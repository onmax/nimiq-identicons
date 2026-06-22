import type { Colors, ColorType, CreateIdenticonOptions, IdenticonFormat, IdenticonParams, Section, Sections } from './types.js'
import { ValidationUtils } from '@nimiq/utils/validation-utils'

import { identiconFeatures } from './generated/features.js'

export const defaultShadow = '<path fill="#010101" d="M119.21 80a39.46 39.46 0 0 1-67.13 28.13c10.36 2.33 36 3 49.82-14.28 10.39-12.47 8.31-33.23 4.16-43.26A39.35 39.35 0 0 1 119.21 80" opacity=".1"/>'
export const defaultCircleShape = (color: string): string => `<circle cx="80" cy="80" r="40" fill="${color}"/>`

/**
 * Generates the parameters needed to create an identicon
 * @param input - The string to generate the identicon parameters from
 * @returns Promise containing the sections and colors for the identicon
 */
export function getIdenticonsParams(input: string): IdenticonParams {
  const hash = makeHash(input)
  const main = Number(hash.charAt(0))
  const background = Number(hash.charAt(2))
  const accent = Number(hash.charAt(11))
  const face = Number(hash.charAt(3) + hash.charAt(4))
  const top = Number(hash.charAt(5) + hash.charAt(6))
  const sides = Number(hash.charAt(7) + hash.charAt(8))
  const bottom = Number(hash.charAt(9) + hash.charAt(10))

  const sections = sectionsToSvg({ face, top, sides, bottom })
  const colors = colorsToRgb({ accent, background, main })

  return { sections, colors }
}

export const colors = ['#FC8702', '#D94432', '#E9B213', '#1A5493', '#0582CA', '#5961A8', '#21BCA5', '#FA7268', '#88B04B', '#795548'] as const
export const backgroundColors = ['#FC8702', '#D94432', '#E9B213', '#1F2348', '#0582CA', '#5F4B8B', '#21BCA5', '#FA7268', '#88B04B', '#795548'] as const

export function colorsToRgb({ main, background, accent }: Record<ColorType, number>): Colors {
  const adjustIndex = (index: number): number => ((index + 1) % 10) as number

  if (main === background)
    main = adjustIndex(main)
  while (accent === main || accent === background) accent = adjustIndex(accent)

  return {
    main: colors[main]!,
    background: backgroundColors[background]!,
    accent: colors[accent]!,
  }
}

export function makeHash(input: string): string {
  // Iterate by code point (matches the original `[...input]` spread, which keeps
  // surrogate pairs as single units) and read the leading code unit, exactly as
  // `.map(c => c.charCodeAt(0) + 3)` did — but without allocating arrays. The
  // float reduction keeps the same left-to-right order/associativity so the
  // resulting Number (and its `toString(10)`) stays bit-identical.
  let acc = 0.5
  for (const ch of input)
    acc = acc * (1 - acc) * chaosHash(ch.charCodeAt(0) + 3)

  // Reverse the decimal string (original used `split('').reduce((a, e) => e + a, '')`).
  const fullHash = acc.toString(10).split('').reverse().join('')

  const padChar = fullHash.charAt(5) || '0'
  const hash = fullHash
    .replace('.', padChar) // Replace the dot as it cannot be parsed to int
    .slice(4, 21) // Changed from (4, 17) to (4, 21) to match V1 behavior

  // The index 5 of `fullHash` is currently unused (index 1 of `hash`,
  // after cutting off the first 4 elements). Identicons.svg() is not using it.

  // A small percentage of returned values are actually too short,
  // leading to an invalid bottom index and feature color. Adding
  // padding creates a bottom feature and accent color where no
  // existed previously, thus it's not a disrupting change.
  return hash.padEnd(13, padChar)
}

// chaosHash is a pure function of its integer input, so memoize it. The 100-iter
// loop is the dominant cost of makeHash, and across many identicons only a small
// set of distinct char codes (the Nimiq alphabet, digits, spaces) ever appears —
// so after warm-up this is an O(1) lookup. Returns the identical double, so
// makeHash output stays byte-identical. The cache is size-capped so unvalidated
// inputs with arbitrary code points can't grow it without bound; the normal
// char-code domain stays far under the cap.
const CHAOS_CACHE_LIMIT = 4096
const chaosHashCache = new Map<number, number>()

function chaosHash(number: number): number {
  const cached = chaosHashCache.get(number)
  if (cached !== undefined)
    return cached
  const k = 3.569956786876
  let a_n = 1 / number
  for (let i = 0; i < 100; i++)
    a_n = (1 - a_n) * a_n * k
  if (chaosHashCache.size < CHAOS_CACHE_LIMIT)
    chaosHashCache.set(number, a_n)
  return a_n
}
export { identiconFeatures }

const SECTION_NAMES = ['face', 'sides', 'top', 'bottom'] as const

let sectionArrays: Record<Section, string[]> | undefined

// Lazily group the flat `identiconFeatures` map into per-section arrays indexed
// 1..21, so each render does an array index instead of building a key string and
// doing a hashmap lookup. Key derivation is identical, so output is unchanged.
function getSectionArrays(): Record<Section, string[]> {
  if (sectionArrays)
    return sectionArrays
  const arrays: Record<Section, string[]> = { face: [], sides: [], top: [], bottom: [] }
  for (const section of SECTION_NAMES) {
    for (let n = 1; n <= 21; n++) {
      const assetIndex = n < 10 ? `0${n}` : `${n}`
      const svg = identiconFeatures[`./features/optimized/${section}/${section}_${assetIndex}.svg`]
      if (svg)
        arrays[section][n] = svg
    }
  }
  sectionArrays = arrays
  return arrays
}

export function sectionToSvg(section: Section, index: number): string {
  // Ensure index is between 1 and 21
  const numIndex = Math.abs(index % 21) + 1
  const svg = getSectionArrays()[section][numIndex]
  if (!svg)
    throw new Error(`SVG file not found for ${section} with index ${index}/${numIndex}.`)
  return svg
}

export function sectionsToSvg(sectionsIndexes: Record<Section, number>): Sections {
  const bottom = sectionToSvg('bottom', sectionsIndexes.bottom)
  const top = sectionToSvg('top', sectionsIndexes.top)
  const sides = sectionToSvg('sides', sectionsIndexes.sides)
  const face = sectionToSvg('face', sectionsIndexes.face)
  return { bottom, top, sides, face }
}

export function validateInput(input: string, options: CreateIdenticonOptions = {}): string | undefined {
  const { shouldValidateAddress = true } = options
  if (shouldValidateAddress === false)
    return input

  if (!ValidationUtils.isValidAddress(input)) {
    console.warn(`[Nimiq Identicon] - Invalid address: \`${input}\``)
    return
  }

  const chunks = input.replace(/[+ ]/g, '').toUpperCase().match(/.{4}/g)
  if (!chunks)
    return
  return chunks.join(' ').trim()
}

export function formatIdenticon(svg: string, format: IdenticonFormat = 'image/svg+xml'): string {
  if (format === 'svg')
    return svg

  const base64 = typeof globalThis.btoa === 'function'
    ? globalThis.btoa(svg)
    // eslint-disable-next-line node/prefer-global/buffer
    : Buffer.from(svg).toString('base64')
  return `data:${format};base64,${base64}`
}

export const defaultBackgroundShape = `<path d="m126.074 16.999 31.955 55.003a15.92 15.92 0 0 1 2.159 7.999 15.93 15.93 0 0 1-2.159 7.998l-31.955 55.003c-2.867 4.949-8.183 7.998-13.933 7.998H48.225c-5.75 0-11.066-3.049-13.933-7.998L2.337 87.999a15.96 15.96 0 0 1 0-15.997l31.96-55.003a16.048 16.048 0 0 1 5.89-5.854A16.173 16.173 0 0 1 48.23 9h63.91c5.75 0 11.066 3.05 13.933 7.999Z"/>`

/**
 * Assembles an SVG string from the provided identicon parameters
 * @param params - Object containing colors and sections for the identicon
 * @param params.colors - RGB colors for accent, background, and main elements
 * @param params.sections - SVG path strings for bottom, face, sides, and top elements
 * @param params.sections.bottom - SVG path string for the bottom section
 * @param params.sections.face - SVG path string for the face section
 * @param params.sections.sides - SVG path string for the sides section
 * @param params.sections.top - SVG path string for the top section
 * @param params.innerShadow - SVG filter string for the inner shadow
 * @param params.backgroundShape - SVG path string for the background shape
 * @param params.circleShape - SVG path string for the circle shape
 * @param params.colors.accent - RGB color for the accent elements
 * @param params.colors.background - RGB color for the background elements
 * @param params.colors.main - RGB color for the main elements
 * @returns Complete SVG string of the assembled identicon
 */
export function assembleSvg({ colors: { accent, background, main }, sections: { bottom, face, sides, top }, innerShadow, backgroundShape, circleShape }: IdenticonParams): string {
  innerShadow ||= defaultShadow
  backgroundShape ||= defaultBackgroundShape
  circleShape ||= defaultCircleShape(main)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><defs><clipPath id="a">${backgroundShape}</clipPath></defs><path fill="${background}" d="M0 0h160v160H0z" clip-path="url(#a)"/><g fill="${accent}" clip-path="url(#a)" color="${main}">${circleShape}${innerShadow}${top}${sides}${face}${bottom}</g></svg>`
}

export const identiconPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path fill="url(#a)" transform="translate(0,4)" d="M62.3 25.4 49.2 2.6A5.3 5.3 0 0 0 44.6 0H18.4c-1.9 0-3.6 1-4.6 2.6L.7 25.4c-1 1.6-1 3.6 0 5.2l13.1 22.8c1 1.6 2.7 2.6 4.6 2.6h26.2c1.9 0 3.6-1 4.6-2.6l13-22.8c1-1.6 1-3.6.1-5.2z" opacity=".1"/><defs><radialGradient id="a" cx="0" cy="0" r="1" gradientTransform="matrix(-63.0033 0 0 -56 63 56)" gradientUnits="userSpaceOnUse"><stop stop-color="#260133"/><stop offset="1" stop-color="#1F2348"/></radialGradient></defs></svg>`

export const identiconPlaceholderBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSI+PHBhdGggZmlsbD0idXJsKCNhKSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCw0KSIgZD0iTTYyLjMgMjUuNCA0OS4yIDIuNkE1LjMgNS4zIDAgMCAwIDQ0LjYgMEgxOC40Yy0xLjkgMC0zLjYgMS00LjYgMi42TC43IDI1LjRjLTEgMS42LTEgMy42IDAgNS4ybDEzLjEgMjIuOGMxIDEuNiAyLjcgMi42IDQuNiAyLjZoMjYuMmMxLjkgMCAzLjYtMSA0LjYtMi42bDEzLTIyLjhjMS0xLjYgMS0zLjYuMS01LjJ6IiBvcGFjaXR5PSIuMSIvPjxkZWZzPjxyYWRpYWxHcmFkaWVudCBpZD0iYSIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KC02My4wMDMzIDAgMCAtNTYgNjMgNTYpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iIzI2MDEzMyIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFGMjM0OCIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg=='

/**
 * Generate an identicon from a string
 *
 * @param rawInput The string to generate the identicon from
 * @param options The options for the identicon
 * @returns The identicon as a string
 */
export function createIdenticon(rawInput: string, options: CreateIdenticonOptions = {}): string {
  const input = validateInput(rawInput, options)
  if (!input)
    return identiconPlaceholder
  const params = getIdenticonsParams(input)
  const svg = assembleSvg(params)
  return formatIdenticon(svg, options.format)
}

/**
 * Wrap an identicon SVG string in an object URL for use as an `<img src>`,
 * avoiding the cost and memory of base64 data URIs. Cheaper than
 * `format: 'image/svg+xml'` when rendering many identicons as images.
 *
 * Browser-only. The caller MUST call {@link revokeIdenticonObjectURL} when the
 * image is no longer needed — object URLs leak until revoked, which matters
 * when generating thousands.
 *
 * @param svg A raw SVG string (e.g. `createIdenticon(input, { format: 'svg' })`).
 */
export function identiconToObjectURL(svg: string): string {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function')
    throw new TypeError('identiconToObjectURL requires a browser environment (Blob + URL.createObjectURL).')
  return URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
}

/** Revoke an object URL created by {@link identiconToObjectURL}. */
export function revokeIdenticonObjectURL(url: string): void {
  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function')
    URL.revokeObjectURL(url)
}
