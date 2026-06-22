<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

// Draws every generated identicon as a 16px tile onto stacked <canvas> slabs
// instead of one <img> per identicon. Each SVG <img> makes Chromium build a
// persistent isolated SVG document (parse + frame + raster), so thousands at once
// freeze the tab. Chromium also can't rasterize SVG off the main thread
// (createImageBitmap rejects SVG sources), so we decode each into a transient
// <img>, draw it, and drop it — processing small chunks with a yield between them
// so the grid fills progressively while the page stays responsive at any count.
//
// Kept as its own component so the benchmark's per-frame metric writes
// (liveTicks, worstFrameGap) re-render only the parent, never this grid.
const props = defineProps<{ sources: string[] }>()

const CELL = 16
const GAP = 2
const STEP = CELL + GAP
// Cap each canvas slab's CSS height so the backing store (×DPR) stays well under
// the browser's max canvas dimension; tall grids span several stacked slabs.
const MAX_SLAB_PX = 4000

const root = ref<HTMLElement | null>(null)
const slabs = ref<Array<{ key: number, cssH: number }>>([])
const canvasEls = ref<HTMLCanvasElement[]>([])

let drawToken = 0

// Decode one identicon source into a transient <img>. We draw it to the canvas
// and drop it, so unlike a persistent SVG <img> in the DOM it isn't retained —
// only a chunk's worth are alive at once, which is what keeps thousands cheap.
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('decode failed'))
    img.src = src
  })
}

function layout(): { cols: number, rows: number, rowsPerSlab: number, slabCount: number } {
  const width = root.value?.clientWidth ?? 0
  const cols = Math.max(1, Math.floor((width + GAP) / STEP))
  const rows = Math.ceil(props.sources.length / cols)
  const rowsPerSlab = Math.max(1, Math.floor(MAX_SLAB_PX / STEP))
  const slabCount = Math.ceil(rows / rowsPerSlab) || 0
  return { cols, rows, rowsPerSlab, slabCount }
}

async function draw(): Promise<void> {
  const token = ++drawToken
  const dpr = window.devicePixelRatio || 1
  const { cols, rows, rowsPerSlab } = layout()
  const n = props.sources.length

  // Build the slab list reactively, then wait for the <canvas> nodes to mount.
  const slabCount = Math.ceil(rows / rowsPerSlab) || 0
  slabs.value = Array.from({ length: slabCount }, (_, s) => {
    const slabRows = Math.min(rowsPerSlab, rows - s * rowsPerSlab)
    return { key: s, cssH: slabRows * STEP }
  })
  await nextTick()
  if (token !== drawToken)
    return

  const ctxs = canvasEls.value.map((c) => {
    const slabRows = Math.round((c.clientHeight) / STEP)
    c.width = Math.max(1, Math.round(c.clientWidth * dpr))
    c.height = Math.max(1, Math.round(slabRows * STEP * dpr))
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    return ctx
  })

  // Draw top-to-bottom so the visible rows fill first. Chromium can only decode
  // SVG on the main thread (createImageBitmap rejects SVG), so keep each batch
  // small and yield between them — the grid fills progressively but the page
  // never blocks, at any count.
  const CHUNK = 8
  for (let start = 0; start < n; start += CHUNK) {
    if (token !== drawToken)
      return
    const end = Math.min(start + CHUNK, n)
    await Promise.all(Array.from({ length: end - start }, async (_, k) => {
      const i = start + k
      try {
        const img = await loadImage(props.sources[i]!)
        if (token !== drawToken)
          return
        const row = Math.floor(i / cols)
        const col = i % cols
        const slab = Math.floor(row / rowsPerSlab)
        const ctx = ctxs[slab]
        if (ctx)
          ctx.drawImage(img, col * STEP, (row - slab * rowsPerSlab) * STEP, CELL, CELL)
      }
      catch {
        // ignore a tile that fails to decode
      }
    }))
    // Yield to the event loop so input/scroll/paint stay responsive.
    await new Promise<void>(resolve => setTimeout(resolve, 0))
  }
}

watch(() => props.sources, () => {
  draw()
})
onMounted(() => {
  if (props.sources.length)
    draw()
})
onBeforeUnmount(() => {
  drawToken++
})
</script>

<template>
  <div ref="root" class="bench-grid">
    <canvas
      v-for="slab in slabs"
      :key="slab.key"
      ref="canvasEls"
      class="bench-slab"
      :style="{ height: `${slab.cssH}px` }"
    />
  </div>
</template>

<style scoped>
.bench-grid {
  max-height: 420px;
  overflow: auto;
  width: 100%;
}

.bench-slab {
  display: block;
  width: 100%;
}
</style>
