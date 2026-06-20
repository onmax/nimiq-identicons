import { describe, expect, it } from 'vitest'
import { createIdenticonCache, createIdenticonCached } from '../src/cache.js'
import { createIdenticon } from '../src/index.js'

const opt = { shouldValidateAddress: false } as const

describe('identicon cache', () => {
  it('returns output identical to createIdenticon, on miss and on hit', () => {
    const cache = createIdenticonCache()
    const direct = createIdenticon('nimiq', opt)
    expect(createIdenticonCached('nimiq', { ...opt, cache })).toBe(direct) // miss
    expect(createIdenticonCached('nimiq', { ...opt, cache })).toBe(direct) // hit
    expect(cache.size).toBe(1)
  })

  it('falls back to direct generation when no cache is given', () => {
    expect(createIdenticonCached('nimiq', opt)).toBe(createIdenticon('nimiq', opt))
  })

  it('evicts the oldest entry beyond maxSize', () => {
    const cache = createIdenticonCache(2)
    createIdenticonCached('a', { ...opt, cache })
    createIdenticonCached('b', { ...opt, cache })
    expect(cache.size).toBe(2)
    createIdenticonCached('c', { ...opt, cache }) // evicts 'a'
    expect(cache.size).toBe(2)
    expect(cache.has('0:image/svg+xml:a')).toBe(false)
    expect(cache.has('0:image/svg+xml:c')).toBe(true)
  })

  it('refreshes recency on a hit', () => {
    const cache = createIdenticonCache(2)
    createIdenticonCached('a', { ...opt, cache })
    createIdenticonCached('b', { ...opt, cache })
    createIdenticonCached('a', { ...opt, cache }) // 'a' becomes most-recently-used
    createIdenticonCached('c', { ...opt, cache }) // evicts 'b', not 'a'
    expect(cache.has('0:image/svg+xml:b')).toBe(false)
    expect(cache.has('0:image/svg+xml:a')).toBe(true)
  })
})
