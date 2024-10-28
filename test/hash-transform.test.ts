import { describe, expect, it } from 'vitest'
import { hashToRGB as legacyHashToRgb } from '../legacy/src/js/colors'
import { makeHash as legacyMakeHash } from '../legacy/src/js/hash'
import { colorsToRgb } from '../src/colors'
import { getIdenticonsParams } from '../src/identicons'

describe('hash transform', () => {
  it('should match the implementation with legacy', async () => {
    for (let i = 0; i < 10000; i++) {
      const randomString = Math.random().toString(36).substring(2)
      const legacyHash = legacyMakeHash(randomString)

      // This is a copy-paste from Identicons legacy
      const color = Number(legacyHash[0])
      const backgroundColor = Number(legacyHash[2])
      const face = Number(legacyHash[3] + legacyHash[4])
      const top = Number(legacyHash[5] + legacyHash[6])
      const side = Number(legacyHash[7] + legacyHash[8])
      const bottom = Number(legacyHash[9] + legacyHash[10])
      const accentColor = Number(legacyHash[11])

      const { colors: colorsIndices, sections } = getIdenticonsParams(randomString)

      // Check indices
      expect(colorsIndices.accent).toBe(accentColor)
      expect(colorsIndices.background).toBe(backgroundColor)
      expect(colorsIndices.main).toBe(color)
      expect(sections.face).toBe(face)
      expect(sections.top).toBe(top)
      expect(sections.sides).toBe(side)
      expect(sections.bottom).toBe(bottom)

      const legacyColors = legacyHashToRgb(color, backgroundColor, accentColor)
      const newColors = colorsToRgb(colorsIndices)

      function oldSelector(part: string, i: number) {
        const index = (Number(i) % 21 /* ASSET_COUNT */) + 1
        return `${part}_${index < 10 ? `0${index}` : index}`
      }

      function newSelector(section: string, index: number) {
        const numIndex = (Number(index) % 21) + 1
        const assetIndex = numIndex < 10 ? `0${numIndex}` : `${numIndex}`
        return `${section}_${assetIndex}`
      }

      expect(newSelector('bottom', sections.bottom)).toBe(oldSelector('bottom', bottom))
      expect(newSelector('face', sections.face)).toBe(oldSelector('face', face))
      expect(newSelector('sides', sections.sides)).toBe(oldSelector('sides', side))
      expect(newSelector('top', sections.top)).toBe(oldSelector('top', top))

      expect(newColors).toMatchObject(legacyColors)
    }
  })
})
