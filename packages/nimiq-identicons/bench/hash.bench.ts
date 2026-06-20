import { bench, describe } from 'vitest'
import { makeHash } from '../src/core.js'
import { createIdenticon } from '../src/index.js'

// Original makeHash, vendored here so the bench shows a real before/after.
function chaosHashOld(number: number): number {
  const k = 3.569956786876
  let a_n = 1 / number
  for (let i = 0; i < 100; i++)
    a_n = (1 - a_n) * a_n * k
  return a_n
}
function makeHashOld(input: string): string {
  const fullHash = [...input]
    .map(c => c.charCodeAt(0) + 3)
    .reduce((a, e) => a * (1 - a) * chaosHashOld(e), 0.5)
    .toString(10)
    .split('')
    .reduce((a, e) => e + a, '')
  const padChar = fullHash.charAt(5) || '0'
  const hash = fullHash.replace('.', padChar).slice(4, 21)
  return hash.padEnd(13, padChar)
}

const address = 'NQ34 248H 248H 248H 248H 248H 248H 248H 248H'

describe('makeHash', () => {
  bench('old (spread + map + reduce + split)', () => {
    makeHashOld(address)
  })
  bench('new (allocation-free loops)', () => {
    makeHash(address)
  })
})

describe('createIdenticon', () => {
  bench('format: svg', () => {
    createIdenticon(address, { shouldValidateAddress: false, format: 'svg' })
  })
  bench('format: image/svg+xml (base64)', () => {
    createIdenticon(address, { shouldValidateAddress: false, format: 'image/svg+xml' })
  })
})
