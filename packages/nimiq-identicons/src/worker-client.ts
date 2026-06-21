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
   * does not work with your bundler. With Vite, the `?worker` suffix is the
   * most robust form (it bundles the worker and its chunks for you):
   *
   * ```ts
   * import IdenticonWorker from 'identicons-esm/worker?worker'
   *
   * createWorker: () => new IdenticonWorker()
   * ```
   *
   * For other bundlers, point a `new URL(..., import.meta.url)` at the package's
   * built worker file (a bare specifier like `'identicons-esm/worker'` does NOT
   * resolve through `new URL`, so it must be a path your bundler can locate).
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

// Only structured-cloneable identicon options survive postMessage. Drop the
// batch-only fields (chunkSize — which has no effect here since each worker
// renders its slice in one synchronous pass — and the non-cloneable /
// main-thread-only signal and onProgress) and forward everything else, so new
// CreateIdenticonOptions fields reach the worker without updating this list.
function serializableOptions(options?: CreateIdenticonsOptions): CreateIdenticonOptions | undefined {
  if (!options)
    return undefined
  const { chunkSize, signal, onProgress, ...rest } = options
  return rest
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
  // Cancellers for jobs that haven't settled yet. terminate() drains this so no
  // in-flight promise is left hanging once its worker is killed.
  const pending = new Set<() => void>()

  function getWorkers(): Worker[] {
    if (workers.length === 0)
      workers = Array.from({ length: poolSize }, createWorker)
    return workers
  }

  function terminate(): void {
    // Reject in-flight jobs first (snapshot, since each canceller mutates the
    // set), then kill the workers — otherwise those promises never settle.
    for (const cancel of [...pending])
      cancel()
    for (const worker of workers)
      worker.terminate()
    workers = []
  }

  function runOnWorker(
    worker: Worker,
    inputs: string[],
    signal: AbortSignal | undefined,
    shiny: boolean,
    options?: CreateIdenticonOptions,
    material?: IdenticonWorkerRequest['material'],
  ): Promise<string[]> {
    const id = nextId++
    return new Promise<string[]>((resolve, reject) => {
      // Detach every listener once this job settles so an aborted sibling job
      // never terminates the shared pool and no stale listener lingers.
      function cleanup(): void {
        worker.removeEventListener('message', handler)
        worker.removeEventListener('error', onError)
        worker.removeEventListener('messageerror', onError)
        signal?.removeEventListener('abort', onAbort)
        pending.delete(cancel)
      }
      function handler(event: MessageEvent<IdenticonWorkerResponse>): void {
        if (event.data.id !== id)
          return
        cleanup()
        // Check presence, not truthiness: an empty error string still means the
        // worker failed, and must reject rather than resolve with no results.
        if (event.data.error !== undefined)
          reject(new Error(event.data.error))
        else
          resolve(event.data.results ?? [])
      }
      // A worker that fails to load its module, or posts an uncloneable message,
      // fires 'error'/'messageerror' and never a matching 'message'. Without
      // this the job promise would hang forever.
      function onError(event: Event): void {
        cleanup()
        reject(new Error((event as ErrorEvent).message || 'Identicon worker error'))
      }
      // Reject only this job; the worker still finishes its slice (result
      // discarded) but other in-flight dispatches keep their workers.
      function onAbort(): void {
        cleanup()
        reject(abortReason(signal!))
      }
      // Settle this job when terminate() is called mid-flight.
      function cancel(): void {
        cleanup()
        reject(new Error('Identicon worker pool terminated'))
      }
      pending.add(cancel)
      worker.addEventListener('message', handler)
      worker.addEventListener('error', onError)
      worker.addEventListener('messageerror', onError)
      signal?.addEventListener('abort', onAbort, { once: true })
      const payload: IdenticonWorkerRequest = { id, inputs, options, material, shiny }
      worker.postMessage(payload)
    })
  }

  function dispatch(
    inputs: readonly string[],
    shiny: boolean,
    options?: CreateIdenticonsOptions,
    material?: IdenticonWorkerRequest['material'],
  ): Promise<string[]> {
    const { signal, onProgress } = options ?? {}
    if (signal?.aborted)
      return Promise.reject(abortReason(signal))
    if (inputs.length === 0)
      return Promise.resolve([])

    const pool = getWorkers()
    const sliceSize = Math.ceil(inputs.length / pool.length)
    const cloneable = serializableOptions(options)
    const total = inputs.length
    let done = 0
    const jobs: Promise<string[]>[] = []
    for (let i = 0; i < pool.length; i++) {
      const slice = inputs.slice(i * sliceSize, (i + 1) * sliceSize)
      if (slice.length === 0)
        break
      // Report progress per slice as each worker finishes (coarser than the
      // batch helpers' per-chunk reporting, since a worker renders its slice in
      // one pass, but it still honors the onProgress contract).
      const job = onProgress
        ? runOnWorker(pool[i]!, slice as string[], signal, shiny, cloneable, material).then((part) => {
            done += part.length
            onProgress(done, total)
            return part
          })
        : runOnWorker(pool[i]!, slice as string[], signal, shiny, cloneable, material)
      jobs.push(job)
    }

    return Promise.all(jobs).then(parts => parts.flat())
  }

  return {
    generate: (inputs, options) => dispatch(inputs, false, options),
    generateShiny: (inputs, options) => dispatch(inputs, true, options, options.material),
    terminate,
  }
}
