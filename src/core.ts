import { colorsToRgb } from './colors'
import { makeHash } from './hash'
import { sectionsToSvg } from './sections'
import type { CreateIdenticonOptions, IdenticonParams } from './types'

/**
 * Generates the parameters needed to create an identicon
 * @param input - The string to generate the identicon parameters from
 * @returns Promise containing the sections and colors for the identicon
 */
export async function getIdenticonsParams(input: string): Promise<IdenticonParams> {
  const hash = makeHash(input)
  const main = Number(hash[0])
  const background = Number(hash[2])
  const accent = Number(hash[11])
  const face = Number(hash[3] + hash[4])
  const top = Number(hash[5] + hash[6])
  const sides = Number(hash[7] + hash[8])
  const bottom = Number(hash[9] + hash[10])

  const sections = await sectionsToSvg({ face, top, sides, bottom })
  const colors = colorsToRgb({ accent, background, main })

  return { sections, colors }
}

/**
 * Formats the SVG string into the requested output format
 * @param svg - The SVG string to format
 * @param options - Object containing format and size options
 * @param options.format - The desired output format. See {@link IdenticonFormat}
 * @returns Promise containing the formatted identicon string
 */
export async function formatIdenticon(svg: string, { format = 'svg' }: CreateIdenticonOptions = {}): Promise<string> {
  switch (format) {
    case 'image/svg+xml': {
      const base64String = typeof window !== 'undefined'
        ? btoa(svg)
        // eslint-disable-next-line unicorn/prefer-node-protocol
        : (await import('buffer')).Buffer.from(svg).toString('base64')

      return `data:image/svg+xml;base64,${base64String}`
    }
    case 'svg':
    default:
      return svg
  }
}
