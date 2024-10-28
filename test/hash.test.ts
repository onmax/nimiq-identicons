import { describe, expect, it } from 'vitest'
import { makeHash as legacyMakeHash } from '../legacy/src/js/hash'
import { makeHash as newMakeHash } from '../src/hash'

describe('hashes implementation', () => {
  it('should match hash with legacy', async () => {
    for (let i = 0; i < 1000; i++) {
      const randomString = Math.random().toString(36).substring(2)
      const legacyHash = legacyMakeHash(randomString)
      const newHash = newMakeHash(randomString)
      expect(newHash).toBe(legacyHash)
    }
  })
})
