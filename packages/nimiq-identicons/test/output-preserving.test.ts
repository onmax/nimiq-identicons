import { describe, expect, it } from 'vitest'
import { makeHash } from '../src/core.js'
import { createIdenticon } from '../src/index.js'
import { createShinyIdenticon } from '../src/shiny.js'
import { corpus, validAddresses } from './golden.js'

// These snapshots are captured from the ORIGINAL implementation and act as a
// gate: any performance refactor of makeHash / getIdenticonsParams / section
// lookup must keep every output byte-identical. Do NOT run vitest with `-u`
// while a refactor is in flight — that would defeat the gate.

describe('makeHash is output-preserving', () => {
  for (const { name, input } of corpus) {
    it(`makeHash: ${name}`, () => {
      expect(makeHash(input)).toMatchSnapshot()
    })
  }
})

describe('createIdenticon is output-preserving (validation off)', () => {
  for (const { name, input } of corpus) {
    it(`svg: ${name}`, () => {
      expect(createIdenticon(input, { shouldValidateAddress: false, format: 'svg' })).toMatchSnapshot()
    })
    it(`base64: ${name}`, () => {
      expect(createIdenticon(input, { shouldValidateAddress: false, format: 'image/svg+xml' })).toMatchSnapshot()
    })
  }
})

describe('createIdenticon is output-preserving (validate + normalize path)', () => {
  for (const address of validAddresses) {
    it(`address: ${address}`, () => {
      expect(createIdenticon(address, { format: 'svg' })).toMatchSnapshot()
    })
  }
})

describe('createShinyIdenticon is output-preserving', () => {
  const materials = ['bronze', 'silver', 'gold'] as const
  for (const material of materials) {
    it(`shiny ${material}: nimiq`, () => {
      expect(createShinyIdenticon('nimiq', { material, shouldValidateAddress: false, format: 'svg' })).toMatchSnapshot()
    })
  }
})
