import { describe, expect, it } from 'vitest'
import { makeHash } from '../src/core'

describe('hash implementation', () => {
  it('should produce consistent hashes', () => {
    // Known inputs should produce consistent outputs
    expect(makeHash('test')).toMatchInlineSnapshot(`"39522148458090"`)
    expect(makeHash('hello')).toMatchInlineSnapshot(`"7935187296325090"`)
    expect(makeHash('NQ07 0000 0000 0000 0000 0000 0000 0000 0000')).toMatchInlineSnapshot(`"113682528368518"`)
  })

  it('should produce different hashes for different inputs', () => {
    const hash1 = makeHash('input1')
    const hash2 = makeHash('input2')
    expect(hash1).not.toBe(hash2)
  })

  it('should be deterministic', () => {
    for (let i = 0; i < 100; i++) {
      const randomString = Math.random().toString(36).substring(2)
      const hash1 = makeHash(randomString)
      const hash2 = makeHash(randomString)
      expect(hash1).toBe(hash2)
    }
  })
})
