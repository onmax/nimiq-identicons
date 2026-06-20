import type { CreateIdenticonsOptions, CreateShinyIdenticonsOptions } from './batch.js'
import type { CreateIdenticonOptions } from './types.js'
import type { IdenticonWorkerRequest, IdenticonWorkerResponse } from './worker.js'
import { abortReason } from './batch.js'

export interface WorkerPoolOptions {
  /**
   * Number of workers to spawn. Defaults to `navigator.hardwareConcurrency`
   * clamped to [1, 8].
   */
  poolSize?: number

  /**
   * Factory for creating a worker. Override this if the default URL resolution
   * does not work with your bundler. The canonical form is:
   *
   * ```ts
   * createWorker: () => new Worker(
   *   new URL('identicons-esm/worker', import.meta.url),
   *   { type: 'module' },
   * )
   * ```
   */
  createWorker?: () => Worker
}

export interface IdenticonWorkerPool {
  /** Generate identicons across the worker pool. Results keep input order. */
  generate: (inputs: readonly string[], options?: CreateIdenticonsOptions) => Promise<string[]>
  /** Generate shiny identicons across the worker pool. Results keep input order. */
  generateShiny: (inputs: readonly string[], options: CreateShinyIdenticonsOptions) => Promise<string[]>
  /** Terminate all workers and release resources. */
  terminate: () => void
}

function defaultWorker(): Worker {
  // The `new Worker(new URL(...))` shape is recognised by Vite/modern bundlers.
  return new Worker(new URL('./worker.mjs', import.meta.url), { type: 'module' })
}

// Only structured-cloneable identicon options survive postMessage; drop chunkSize,
// signal and onProgress (the latter two are non-cloneable / main-thread only).
function serializableOptions(options?: CreateIdenticonsOptions): CreateIdenticonOptions | undefined {
  if (!options)
    return undefined
  return { shouldValidateAddress: options.shouldValidateAddress, format: options.format }
}

/**
 * Create a pool of Web Workers that generate identicons off the main thread, so
 * the page never blocks regardless of how many are requested. Inputs are split
 * evenly across workers and results are reassembled in order.
 *
 * Trade-off vs {@link createIdenticons}: the worker pool runs in parallel and
 * frees the main thread entirely, but pays the cost of copying result strings
 * back over `postMessage`. Benchmark both for your workload.
 */
export function createIdenticonWorkerPool(options: WorkerPoolOptions = {}): IdenticonWorkerPool {
  const createWorker = options.createWorker ?? defaultWorker
  const hardwareConcurrency = (globalThis as { navigator?: { hardwareConcurrency?: number } })
    .navigator
    ?.hardwareConcurrency ?? 4
  const poolSize = Math.max(1, options.poolSize ?? Math.min(hardwareConcurrency, 8))

  let workers: Worker[] = []
  let nextId = 0

  function getWorkers(): Worker[] {
    if (workers.length === 0)
      workers = Array.from({ length: poolSize }, createWorker)
    return workers
  }

  function terminate(): void {
    for (const worker of workers)
      worker.terminate()
    workers = []
  }

  function runOnWorker(
    worker: Worker,
    inputs: string[],
    signal: AbortSignal | undefined,
    options?: CreateIdenticonOptions,
    material?: IdenticonWorkerRequest['material'],
  ): Promise<string[]> {
    const id = nextId++
    return new Promise<string[]>((resolve, reject) => {
      // Detach both listeners once this job settles so an aborted sibling job
      // never terminates the shared pool and no stale listener lingers.
      function cleanup(): void {
        worker.removeEventListener('message', handler)
        signal?.removeEventListener('abort', onAbort)
      }
      function handler(event: MessageEvent<IdenticonWorkerResponse>): void {
        if (event.data.id !== id)
          return
        cleanup()
        if (event.data.error)
          reject(new Error(event.data.error))
        else
          resolve(event.data.results ?? [])
      }
      // Reject only this job; the worker still finishes its slice (result
      // discarded) but other in-flight dispatches keep their workers.
      function onAbort(): void {
        cleanup()
        reject(abortReason(signal!))
      }
      worker.addEventListener('message', handler)
      signal?.addEventListener('abort', onAbort, { once: true })
      const payload: IdenticonWorkerRequest = { id, inputs, options, material }
      worker.postMessage(payload)
    })
  }

  function dispatch(
    inputs: readonly string[],
    options?: CreateIdenticonsOptions,
    material?: IdenticonWorkerRequest['material'],
  ): Promise<string[]> {
    const { signal } = options ?? {}
    if (signal?.aborted)
      return Promise.reject(abortReason(signal))
    if (inputs.length === 0)
      return Promise.resolve([])

    const pool = getWorkers()
    const sliceSize = Math.ceil(inputs.length / pool.length)
    const cloneable = serializableOptions(options)
    const jobs: Promise<string[]>[] = []
    for (let i = 0; i < pool.length; i++) {
      const slice = inputs.slice(i * sliceSize, (i + 1) * sliceSize)
      if (slice.length === 0)
        break
      jobs.push(runOnWorker(pool[i]!, slice as string[], signal, cloneable, material))
    }

    return Promise.all(jobs).then(parts => parts.flat())
  }

  return {
    generate: (inputs, options) => dispatch(inputs, options),
    generateShiny: (inputs, options) => dispatch(inputs, options, options.material),
    terminate,
  }
}
