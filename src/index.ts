import { colorsToRgb } from './colors'
import { makeHash } from './hash'
import { sectionsToSvg } from './sections'
import type { ColorType, IdenticonParams, Section } from './types'

function ensambleSvg({ accent, background, bottom, face, main, sides, top }: IdenticonParams): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><defs><clipPath id="a"><path d="m125.8 16.67 31.765 55.015a15.99 15.99 0 0 1 0 16L125.8 142.7c-2.85 4.95-8.135 8-13.85 8H48.415c-5.715 0-11-3.05-13.85-8L2.8 87.685a16.04 16.04 0 0 1 0-16L34.57 16.67a16 16 0 0 1 13.85-8h63.53c5.715 0 11 3.05 13.85 8"/></clipPath></defs><g fill="${accent}" clip-path="url(#a)" color="${main}"><path fill="${background}" d="M0 0h160v160H0z"/><circle cx="80" cy="80" r="40" fill="${main}"/><path fill="#010101" d="M119.21 80a39.46 39.46 0 0 1-67.13 28.13c10.36 2.33 36 3 49.82-14.28 10.39-12.47 8.31-33.23 4.16-43.26A39.35 39.35 0 0 1 119.21 80" opacity=".1"/></g>${top}${sides}${face}${bottom}</svg>`
}

interface CreateIdenticonOptions {
  /**
   * If true, the function will return a data URI instead of a SVG string.
   * @default false
   */
  encodedAsDataUri?: boolean
}

export async function createIdenticon(input: string, options: CreateIdenticonOptions = {}): Promise<string> {
  const { encodedAsDataUri = false } = options

  const { colors, sections } = getIdenticonsParams(input)
  const { main, background, accent } = colorsToRgb(colors)
  const { bottom, face, sides, top } = await sectionsToSvg(sections)

  const svg = ensambleSvg({ top, bottom, sides, face, main, background, accent })

  if (!encodedAsDataUri)
    return svg

  const Buffer = await import('node:buffer').then(b => b.default.Buffer)
  const base64String = Buffer.from(svg).toString('base64')
  const uri = `data:image/svg+xml;base64,${base64String}`
  return uri
}

function getIdenticonsParams(input: string): { colors: Record<ColorType, number>, sections: Record<Section, number> } {
  const hash = makeHash(input)
  const main = Number(hash[0])
  const background = Number(hash[2])
  const accent = Number(hash[11])
  const face = Number(hash[3] + hash[4])
  const top = Number(hash[5] + hash[6])
  const sides = Number(hash[7] + hash[8])
  const bottom = Number(hash[9] + hash[10])

  return {
    sections: { face, sides, top, bottom },
    colors: { main, background, accent },
  }
}
