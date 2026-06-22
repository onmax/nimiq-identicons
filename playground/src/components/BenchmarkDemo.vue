<script setup lang="ts">
import type { IdenticonWorkerPool } from 'identicons-esm/worker-client'
import { useLocalStorage } from '@vueuse/core'
import { createIdenticon, createIdenticons, identiconToObjectURL, revokeIdenticonObjectURL } from 'identicons-esm'
import { createIdenticonCache, createIdenticonCached } from 'identicons-esm/cache'
import { createIdenticonWorkerPool } from 'identicons-esm/worker-client'
import IdenticonWorker from 'identicons-esm/worker?worker'
import { onUnmounted, ref, shallowRef } from 'vue'
import BenchImageGrid from './BenchImageGrid.vue'

type Mode = 'sync' | 'batched' | 'worker' | 'cached'
type Output = 'base64' | 'objecturl'

interface BenchResult {
  runId: number
  mode: Mode
  output: Output
  count: number
  genTime: number
  throughput: number
  longTaskCount: number
  longTaskTotal: number
  worstFrameGap: number
}

// Monotonic id so an automated driver (Playwright) can detect a finished run.
let runId = 0

const count = useLocalStorage('bench-count', 10000)
const mode = useLocalStorage<Mode>('bench-mode', 'batched')
const output = useLocalStorage<Output>('bench-output', 'base64')
const chunkSize = useLocalStorage('bench-chunk', 64)
const showImages = useLocalStorage('bench-show-images', true)

const running = ref(false)
const progress = ref(0)
const sources = shallowRef<string[]>([])

// Metrics
const genTime = ref(0)
const throughput = ref(0)
const longTaskCount = ref(0)
const longTaskTotal = ref(0)
const worstFrameGap = ref(0)
// A counter driven by requestAnimationFrame. It keeps ticking only while the
// main thread is free — it visibly freezes during a blocking sync run.
const liveTicks = ref(0)

let cache = createIdenticonCache(20000)
let pool: IdenticonWorkerPool | undefined
let objectUrls: string[] = []
// Cancels the in-flight run on unmount (or could be wired to a stop button), so
// async batch/worker work doesn't keep running and writing to a dead component.
let runController: AbortController | undefined

function getPool(): IdenticonWorkerPool {
  if (!pool)
    pool = createIdenticonWorkerPool({ createWorker: () => new IdenticonWorker() })
  return pool
}

function makeInputs(n: number): string[] {
  const inputs = Array.from<string>({ length: n })
  for (let i = 0; i < n; i++)
    inputs[i] = `nq-bench-${i}-${(i * 2654435761) >>> 0}`
  return inputs
}

function revokeOldUrls(): void {
  for (const url of objectUrls)
    revokeIdenticonObjectURL(url)
  objectUrls = []
}

function toSources(svgs: string[], asObjectUrl: boolean): string[] {
  if (!asObjectUrl)
    return svgs
  const urls = svgs.map(identiconToObjectURL)
  objectUrls = urls
  return urls
}

async function run(): Promise<void> {
  if (running.value)
    return
  running.value = true
  progress.value = 0
  revokeOldUrls()
  sources.value = []
  const controller = new AbortController()
  runController = controller

  const n = count.value
  const inputs = makeInputs(n)
  const asObjectUrl = output.value === 'objecturl'
  const format = asObjectUrl ? 'svg' : 'image/svg+xml'
  const baseOptions = { shouldValidateAddress: false, format } as const

  // Observe long tasks (>50ms) on the main thread during the run.
  longTaskCount.value = 0
  longTaskTotal.value = 0
  let observer: PerformanceObserver | undefined
  if (typeof PerformanceObserver !== 'undefined') {
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTaskCount.value++
          longTaskTotal.value += entry.duration
        }
      })
      observer.observe({ entryTypes: ['longtask'] })
    }
    catch {
      // longtask not supported (e.g. Safari) — fall back to the frame-gap metric below.
    }
  }

  // Monitor responsiveness: keep a rAF loop running and record the worst gap
  // between frames during generation. Big gap == main thread was blocked.
  worstFrameGap.value = 0
  let stopFrames = false
  let lastFrame = performance.now()
  const frameLoop = (now: number): void => {
    const gap = now - lastFrame
    if (gap > worstFrameGap.value)
      worstFrameGap.value = Number(gap.toFixed(1))
    lastFrame = now
    liveTicks.value++
    if (!stopFrames)
      requestAnimationFrame(frameLoop)
  }
  requestAnimationFrame(frameLoop)

  const start = performance.now()
  let svgs: string[] = []
  try {
    switch (mode.value) {
      case 'sync':
        svgs = inputs.map(i => createIdenticon(i, baseOptions))
        progress.value = n
        break
      case 'batched':
        svgs = await createIdenticons(inputs, {
          ...baseOptions,
          chunkSize: chunkSize.value,
          signal: controller.signal,
          // Throttle reactive writes so progress UI churn doesn't pollute the
          // responsiveness measurement.
          onProgress: (done) => {
            if (done - progress.value >= 1000 || done === n)
              progress.value = done
          },
        })
        break
      case 'worker':
        svgs = await getPool().generate(inputs, { ...baseOptions, signal: controller.signal })
        progress.value = n
        break
      case 'cached':
        // First run fills the cache; run again to see the all-hit path.
        svgs = inputs.map(i => createIdenticonCached(i, { ...baseOptions, cache }))
        progress.value = n
        break
    }
    // Aborted mid-run (component unmounted): don't touch refs or create object
    // URLs on a dead component — that would leak past onUnmounted's revoke.
    if (controller.signal.aborted)
      return

    const elapsed = performance.now() - start
    genTime.value = Number(elapsed.toFixed(1))
    throughput.value = Math.round(n / (elapsed / 1000))
    sources.value = toSources(svgs, asObjectUrl)

    // Let the main thread settle so a blocking run's long-task entry and the
    // post-block frame gap register before the metrics are snapshotted. This
    // delay is after the timer above, so it does not affect gen/throughput.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    await new Promise<void>(resolve => setTimeout(resolve, 0))

    runId++
    ;(window as unknown as { __bench?: BenchResult }).__bench = {
      runId,
      mode: mode.value,
      output: output.value,
      count: n,
      genTime: genTime.value,
      throughput: throughput.value,
      longTaskCount: longTaskCount.value,
      longTaskTotal: Number(longTaskTotal.value.toFixed(0)),
      worstFrameGap: worstFrameGap.value,
    }
  }
  catch (error) {
    // A run cancelled via the abort signal is expected — swallow it; rethrow
    // anything else.
    if ((error as { name?: string })?.name !== 'AbortError')
      throw error
  }
  finally {
    stopFrames = true
    observer?.disconnect()
    running.value = false
    if (runController === controller)
      runController = undefined
  }
}

function clearCache(): void {
  cache.clear()
  cache = createIdenticonCache(20000)
}

onUnmounted(() => {
  runController?.abort()
  revokeOldUrls()
  pool?.terminate()
})
</script>

<template>
  <div flex="~ col gap-16" w-full f-mt-md>
    <div flex="~ wrap gap-16 items-end justify-center">
      <label flex="~ col gap-4" f-text-xs>
        Count
        <input v-model.number="count" type="number" min="1" max="100000" step="1000" nq-input-box rounded-8 w-120>
      </label>

      <label flex="~ col gap-4" f-text-xs>
        Mode
        <select v-model="mode" nq-input-box rounded-8 w-140>
          <option value="sync">sync (blocks)</option>
          <option value="batched">batched (yield)</option>
          <option value="worker">worker pool</option>
          <option value="cached">cached</option>
        </select>
      </label>

      <label flex="~ col gap-4" f-text-xs>
        Output
        <select v-model="output" nq-input-box rounded-8 w-140>
          <option value="base64">base64 data-URI</option>
          <option value="objecturl">object URL</option>
        </select>
      </label>

      <label v-if="mode === 'batched'" flex="~ col gap-4" f-text-xs>
        Chunk
        <input v-model.number="chunkSize" type="number" min="1" max="2000" step="16" nq-input-box rounded-8 w-100>
      </label>

      <button type="button" nq-pill nq-pill-primary :disabled="running" @click="run">
        {{ running ? `Rendering… ${progress}/${count}` : `Render ${count}` }}
      </button>

      <button v-if="mode === 'cached'" type="button" nq-pill nq-pill-secondary :disabled="running" @click="clearCache">
        Clear cache
      </button>
    </div>

    <div flex="~ wrap gap-16 justify-center" nq-label f-text-xs>
      <p title="pure generation time">
        gen: <b>{{ genTime }}ms</b>
      </p>
      <p title="identicons generated per second">
        throughput: <b>{{ throughput.toLocaleString() }}/s</b>
      </p>
      <p title="main-thread tasks over 50ms during the run">
        long tasks: <b>{{ longTaskCount }}</b> ({{ longTaskTotal.toFixed(0) }}ms)
      </p>
      <p title="worst gap between animation frames — high means the UI froze">
        worst frame gap: <b>{{ worstFrameGap }}ms</b>
      </p>
      <p title="rAF counter — keeps moving only while the main thread is free">
        live ticks: <b>{{ liveTicks }}</b>
      </p>
    </div>

    <label flex="~ gap-8 items-center justify-center" f-text-sm>
      <input v-model="showImages" type="checkbox" nq-switch>
      Insert images into the DOM
    </label>

    <BenchImageGrid v-if="showImages" :sources="sources" />
  </div>
</template>
