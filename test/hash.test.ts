import { describe, expect, it } from 'vitest'
import { makeHash as newMakeHash } from '../src/core'
// @ts-expect-error no types
import { makeHash as V1MakeHash } from '../V1/src/js/hash'

describe('hashes implementation', () => {
  it('should match hash with V1', async () => {
    for (let i = 0; i < 1000; i++) {
      const randomString = Math.random().toString(36).substring(2)
      const V1Hash = V1MakeHash(randomString)
      const newHash = newMakeHash(randomString)
      expect(newHash).toBe(V1Hash)
    }
  })
})
