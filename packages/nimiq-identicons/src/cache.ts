import type { CreateIdenticonOptions, CreateShinyIdenticonOptions } from './types.js'
import { createIdenticon } from './core.js'
import { createShinyIdenticon } from './shiny.js'

export interface IdenticonCache {
  get: (key: string) => string | undefined
  set: (key: string, value: string) => void
  has: (key: string) => boolean
  delete: (key: string) => boolean
  clear: () => void
  readonly size: number
}

/**
 * A tiny dependency-free LRU cache for identicon output strings. Backed by a
 * `Map` (which preserves insertion order): a hit re-inserts the key to mark it
 * most-recently-used, and the oldest key is evicted once `maxSize` is exceeded.
 *
 * Useful when the same inputs are rendered repeatedly (re-renders, scrolling a
 * list back into view). It does nothing for a one-shot batch of unique inputs.
 */
export function createIdenticonCache(maxSize = 4096): IdenticonCache {
  const map = new Map<string, string>()
  return {
    get(key) {
      const value = map.get(key)
      if (value !== undefined) {
        map.delete(key)
        map.set(key, value)
      }
      return value
    },
    set(key, value) {
      if (map.has(key))
        map.delete(key)
      else if (map.size >= maxSize)
        map.delete(map.keys().next().value!)
      map.set(key, value)
    },
    has: key => map.has(key),
    delete: key => map.delete(key),
    clear: () => map.clear(),
    get size() {
      return map.size
    },
  }
}

function identiconKey(input: string, options: CreateIdenticonOptions): string {
  const validate = options.shouldValidateAddress === false ? '0' : '1'
  const format = options.format ?? 'image/svg+xml'
  return `${validate}:${format}:${input}`
}

// Return the cached value for `key`, or compute it with `produce`, store it, and
// return it. Falls back to plain `produce()` when no cache is provided.
function withCache(cache: IdenticonCache | undefined, key: string, produce: () => string): string {
  if (!cache)
    return produce()
  const cached = cache.get(key)
  if (cached !== undefined)
    return cached
  const result = produce()
  cache.set(key, result)
  return result
}

/**
 * `createIdenticon` with an opt-in cache. Output is identical to
 * `createIdenticon`; the cache only skips recomputation for repeated inputs.
 */
export function createIdenticonCached(
  input: string,
  options: CreateIdenticonOptions & { cache?: IdenticonCache } = {},
): string {
  return withCache(options.cache, identiconKey(input, options), () => createIdenticon(input, options))
}

/** `createShinyIdenticon` with an opt-in cache. */
export function createShinyIdenticonCached(
  input: string,
  options: CreateShinyIdenticonOptions & { cache?: IdenticonCache },
): string {
  const key = `${options.material}:${identiconKey(input, options)}`
  return withCache(options.cache, key, () => createShinyIdenticon(input, options))
}
