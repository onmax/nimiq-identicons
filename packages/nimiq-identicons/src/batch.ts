import type { CreateIdenticonOptions, CreateShinyIdenticonOptions } from './types.js'
import { createIdenticon } from './core.js'
import { createShinyIdenticon } from './shiny.js'

export interface CreateIdenticonsOptions extends CreateIdenticonOptions {
  /**
   * How many identicons to generate synchronously before yielding back to the
   * event loop. Larger = faster total time but longer tasks; smaller = more
   * responsive. Default 64 keeps each burst well under a 50ms long task.
   *
   * @default 64
   */
  chunkSize?: number

  /**
   * Abort the run between chunks. The returned promise rejects with the
   * signal's reason (an `AbortError` `DOMException` by default).
   */
  signal?: AbortSignal

  /** Called after each chunk with the number generated so far and the total. */
  onProgress?: (done: number, total: number) => void
}

export type CreateShinyIdenticonsOptions = CreateIdenticonsOptions & Pick<CreateShinyIdenticonOptions, 'material'>

const DEFAULT_CHUNK_SIZE = 64

interface SchedulerLike { yield?: () => Promise<void> }

/**
 * Yield control back to the browser (or worker) event loop so it can process
 * input, run timers and paint between chunks of work.
 *
 * Prefers `scheduler.yield()` (Chromium) which resumes with high priority; falls
 * back to a `MessageChannel` macrotask (fast resume, works in Safari/WebKit and
 * Web Workers where `scheduler` and `requestIdleCallback` are absent), then to
 * `setTimeout` as a last resort.
 */
// A single reused MessageChannel for yielding, instead of allocating one per
// chunk. Each yield posts a message and queues its resolver; messages round-trip
// in order, so resolvers fire FIFO — correct even with concurrent batch runs.
let yieldChannel: MessageChannel | undefined
const yieldResolvers: Array<() => void> = []

export function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: SchedulerLike }).scheduler
  if (scheduler && typeof scheduler.yield === 'function')
    return scheduler.yield()

  if (typeof MessageChannel === 'undefined')
    return new Promise<void>(resolve => setTimeout(resolve, 0))

  if (!yieldChannel) {
    yieldChannel = new MessageChannel()
    yieldChannel.port1.onmessage = () => yieldResolvers.shift()?.()
  }
  return new Promise<void>((resolve) => {
    yieldResolvers.push(resolve)
    yieldChannel!.port2.postMessage(undefined)
  })
}

export function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted.', 'AbortError')
}

function isChunkBoundary(done: number, total: number, chunkSize: number): boolean {
  return done % chunkSize === 0 || done === total
}

// The work done once a chunk completes: report progress, then (unless this was
// the last item) yield to the event loop and honor the abort signal. Shared by
// the array and streaming paths — the cheap boundary check stays inline in each
// loop so only boundaries await, keeping the per-item hot path allocation-free.
async function onChunkBoundary(
  done: number,
  total: number,
  signal: AbortSignal | undefined,
  onProgress: CreateIdenticonsOptions['onProgress'],
): Promise<void> {
  onProgress?.(done, total)
  if (done < total) {
    await yieldToMain()
    if (signal?.aborted)
      throw abortReason(signal)
  }
}

async function processInChunks(
  total: number,
  produce: (index: number) => void,
  options: Pick<CreateIdenticonsOptions, 'chunkSize' | 'signal' | 'onProgress'>,
): Promise<void> {
  const { chunkSize = DEFAULT_CHUNK_SIZE, signal, onProgress } = options
  if (signal?.aborted)
    throw abortReason(signal)

  for (let i = 0; i < total; i++) {
    produce(i)
    const done = i + 1
    if (isChunkBoundary(done, total, chunkSize))
      await onChunkBoundary(done, total, signal, onProgress)
  }
}

// Build a results array by producing each input in chunks, preserving order.
function collectInChunks(
  inputs: readonly string[],
  options: Pick<CreateIdenticonsOptions, 'chunkSize' | 'signal' | 'onProgress'>,
  render: (input: string) => string,
): Promise<string[]> {
  const results = Array.from<string>({ length: inputs.length })
  return processInChunks(inputs.length, (i) => {
    results[i] = render(inputs[i]!)
  }, options).then(() => results)
}

/**
 * Generate identicons for many inputs without blocking the main thread.
 *
 * Processes inputs in chunks and yields to the event loop between them, so the
 * page stays responsive while rendering thousands of identicons. Results are
 * returned in the same order as `inputs`.
 */
export function createIdenticons(
  inputs: readonly string[],
  options: CreateIdenticonsOptions = {},
): Promise<string[]> {
  return collectInChunks(inputs, options, input => createIdenticon(input, options))
}

/**
 * Streaming variant of {@link createIdenticons}: yields each identicon as soon
 * as it is generated, so consumers can insert into the DOM incrementally
 * (pairs well with virtualized lists). Yields to the event loop between chunks.
 */
export async function* createIdenticonsStream(
  inputs: readonly string[],
  options: CreateIdenticonsOptions = {},
): AsyncGenerator<{ index: number, value: string }, void> {
  const { chunkSize = DEFAULT_CHUNK_SIZE, signal, onProgress } = options
  if (signal?.aborted)
    throw abortReason(signal)

  const total = inputs.length
  for (let i = 0; i < total; i++) {
    yield { index: i, value: createIdenticon(inputs[i]!, options) }
    const done = i + 1
    if (isChunkBoundary(done, total, chunkSize))
      await onChunkBoundary(done, total, signal, onProgress)
  }
}

/** Non-blocking batch variant of `createShinyIdenticon`. */
export function createShinyIdenticons(
  inputs: readonly string[],
  options: CreateShinyIdenticonsOptions,
): Promise<string[]> {
  return collectInChunks(inputs, options, input => createShinyIdenticon(input, options))
}
