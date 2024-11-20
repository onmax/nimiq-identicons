import { colorsToRgb } from './colors'
import { makeHash } from './hash'
import { sectionsToSvg } from './sections'
import type { IdenticonFormat, IdenticonParams } from './types'

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

const defaultShadow = '<path fill="#010101" d="M119.21 80a39.46 39.46 0 0 1-67.13 28.13c10.36 2.33 36 3 49.82-14.28 10.39-12.47 8.31-33.23 4.16-43.26A39.35 39.35 0 0 1 119.21 80" opacity=".1"/>'
const defaultBackgroundShape = `<path d="m126.072 8.437 31.956 55.003a15.918 15.918 0 0 1 2.158 7.999c0 2.808-.745 5.566-2.158 7.998l-31.956 55.003c-2.867 4.949-8.183 7.998-13.933 7.998H48.224c-5.75 0-11.066-3.049-13.933-7.998L2.336 79.437a15.96 15.96 0 0 1-2.15-7.998c0-2.808.741-5.566 2.15-7.999l31.96-55.003a16.047 16.047 0 0 1 5.889-5.854A16.173 16.173 0 0 1 48.229.438h63.91c5.75 0 11.066 3.05 13.933 7.999Z" />`
const defaultCircleShape = (color: string): string => `<circle cx="80" cy="80" r="40" fill="${color}"/>`

// const _fancyGlass = `<g style="mix-blend-mode:color-dodge"><path fill="url(#a)" d="M125.157 8.421v.001l31.955 55.004h.001A15.076 15.076 0 0 1 159.156 71c0 2.659-.705 5.271-2.043 7.574h-.001l-31.955 55.004v.001c-2.715 4.686-7.753 7.577-13.203 7.577H48.038c-5.45 0-10.487-2.891-13.202-7.577v-.001L2.88 78.576v-.001A15.117 15.117 0 0 1 .844 71c0-2.658.702-5.27 2.036-7.575L34.84 8.422a15.203 15.203 0 0 1 5.58-5.545A15.329 15.329 0 0 1 48.043.844h63.91c5.45 0 10.488 2.89 13.203 7.577Z"/><path stroke="url(#b)" stroke-width="1.688" d="M125.157 8.421v.001l31.955 55.004h.001A15.076 15.076 0 0 1 159.156 71c0 2.659-.705 5.271-2.043 7.574h-.001l-31.955 55.004v.001c-2.715 4.686-7.753 7.577-13.203 7.577H48.038c-5.45 0-10.487-2.891-13.202-7.577v-.001L2.88 78.576v-.001A15.117 15.117 0 0 1 .844 71c0-2.658.702-5.27 2.036-7.575L34.84 8.422a15.203 15.203 0 0 1 5.58-5.545A15.329 15.329 0 0 1 48.043.844h63.91c5.45 0 10.488 2.89 13.203 7.577Z"/></g><defs><linearGradient id="a" x1="159.721" x2="24.483" y1="141.489" y2="20.018" gradientUnits="userSpaceOnUse"><stop stop-color="#79AEE7"/><stop offset=".332" stop-color="#4960A7"/><stop offset="1" stop-color="#1B2030" stop-opacity=".25"/></linearGradient><linearGradient id="b" x1="18.908" x2="118.113" y1="135.327" y2="25.44" gradientUnits="userSpaceOnUse"><stop stop-color="#EBF8FC"/><stop offset=".295" stop-color="#7FB8EF"/><stop offset=".576" stop-color="#5142F1"/><stop offset="1" stop-color="#1D1D29"/></linearGradient></defs></svg>`

/**
 * Assembles an SVG string from the provided identicon parameters
 * @param params - Object containing colors and sections for the identicon
 * @param params.colors - RGB colors for accent, background, and main elements
 * @param params.sections - SVG path strings for bottom, face, sides, and top elements
 * @returns Complete SVG string of the assembled identicon
 */
export function ensambleSvg({ colors: { accent, background, main }, sections: { bottom, face, sides, top }, innerShadow, backgroundShape, circleShape }: IdenticonParams, { fancy = false }: Pick<CreateIdenticonOptions, 'fancy'> = {}): string {
  if (fancy) {
    return ensambleFancySvg({ colors: { accent, background, main }, sections: { bottom, face, sides, top }, innerShadow, backgroundShape, circleShape })
  }
  innerShadow ||= defaultShadow
  backgroundShape ||= defaultBackgroundShape
  circleShape ||= defaultCircleShape(main)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" preserveAspectRatio><defs><clipPath id="a">${backgroundShape}</clipPath></defs><g fill="${accent}" clip-path="url(#a)" color="${main}"><path fill="${background}" d="M0 0h160v160H0z"/>${circleShape}${innerShadow}${top}${sides}${face}${bottom}</g></svg>`
}

// TODO colors
export function ensambleFancySvg({ colors: { accent, background, main }, sections: { bottom, face, sides, top }, innerShadow, backgroundShape, circleShape }: IdenticonParams): string {
  innerShadow ||= defaultShadow
  backgroundShape ||= defaultBackgroundShape
  circleShape ||= defaultCircleShape(main)

  //   const template = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 160 142"><g clip-path="url(#a)">
  //     <path fill="#1F2348" d="m121.88 8.15 30.775 53.302a15.484 15.484 0 0 1 0 15.5l-30.775 53.303a15.49 15.49 0 0 1-13.419 7.75H46.905a15.499 15.499 0 0 1-13.418-7.75L2.711 76.953a15.54 15.54 0 0 1 0-15.501L33.491 8.15A15.5 15.5 0 0 1 46.912.4h61.55a15.488 15.488 0 0 1 13.418 7.75Z"/>
  //     <path fill="url(#b)" d="m121.878 8.15 30.775 53.302a15.484 15.484 0 0 1 0 15.5l-30.775 53.303a15.468 15.468 0 0 1-13.419 7.75H46.904a15.48 15.48 0 0 1-13.42-7.75L2.711 76.953a15.54 15.54 0 0 1 0-15.501L33.491 8.15A15.5 15.5 0 0 1 46.911.4h61.548a15.48 15.48 0 0 1 13.419 7.75Z" style="mix-blend-mode:color-dodge"/>
  //     <mask id="c" width="155" height="138" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha">
  //       <path stroke="#fff" stroke-width="6" d="m119.268 9.646.002.003 30.772 53.296a12.49 12.49 0 0 1 0 12.499L119.27 128.74l-.002.004a12.487 12.487 0 0 1-10.818 6.247H46.9a12.484 12.484 0 0 1-10.816-6.247l-.002-.004-30.77-53.292-.002-.002a12.54 12.54 0 0 1 0-12.503l.002-.002L36.086 9.649a12.5 12.5 0 0 1 10.82-6.25h61.544c4.466 0 8.593 2.384 10.818 6.247Z"/>
  //     </mask>
  //     <g mask="url(#c)">
  //       <path fill="url(#d)" d="M153.012 0H.988C-.11 0-1 .507-1 1.132v135.736c0 .625.89 1.132 1.988 1.132h152.024c1.098 0 1.988-.507 1.988-1.132V1.132C155 .507 154.11 0 153.012 0Z"/>
  //     </g>
  //   </g>
  //   <defs>
  //     <linearGradient id="b" x1="154.731" x2="23.768" y1="137.635" y2="20.728" gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#79AEE7"/>
  //       <stop offset=".332" stop-color="#4960A7"/>
  //       <stop offset="1" stop-color="#1B2030" stop-opacity=".25"/>
  //     </linearGradient>
  //     <linearGradient id="d" x1="77" x2="77" y1="-51.225" y2="138" gradientUnits="userSpaceOnUse">
  //       <stop stop-color="#DBB4A7"/>
  //       <stop offset="1" stop-color="#C89F95"/>
  //     </linearGradient>
  //     <clipPath id="a">
  //       <path fill="#fff" d="M0 0h155v138H0z"/>
  //     </clipPath>
  //   </defs>
  //   <defs><clipPath id="c">${backgroundShape}</clipPath></defs><g fill="${accent}" transform="translate(80,60) scale(0.75) translate(-80,-60)" clip-path="url(#c)" color="${main}">${circleShape}${innerShadow}${top}${sides}${face}${bottom}</g>

  // </svg>`
  const innerBackgroundShape = `<path d="M120.656 10.991C118.869 7.906 115.549 6 111.954 6H48.046c-1.764 0-3.5.463-5.028 1.34a10.029 10.029 0 0 0-3.68 3.659L7.382 65.992l-.002.004a9.99 9.99 0 0 0 0 10.006l.002.003 31.955 55.002A10.053 10.053 0 0 0 48.039 136h63.915c3.595 0 6.915-1.907 8.702-4.993l.004-.006 31.955-55.003a9.943 9.943 0 0 0 .001-9.996l-31.96-55.012Z" />`
  const template = `
<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:svgjs="http://svgjs.dev/svgjs" viewBox="0 0 160 160" width="160" height="160"
    opacity="0.93">
    <defs>
        <filter id="nnnoise-filter" x="-20%" y="-20%" width="140%" height="140%"
            filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse"
            color-interpolation-filters="linearRGB">
            <feTurbulence type="turbulence" baseFrequency="1" numOctaves="4" seed="15"
                stitchTiles="stitch" x="0%" y="0%" width="100%" height="100%" result="turbulence"></feTurbulence>
            <feSpecularLighting surfaceScale="3" specularConstant="3" specularExponent="20"
                lighting-color="#0eff00" x="0%" y="0%" width="100%" height="100%" in="turbulence"
                result="specularLighting">
                <feDistantLight azimuth="3" elevation="19"></feDistantLight>
            </feSpecularLighting>
            <feColorMatrix type="saturate" values="0" x="0%" y="0%" width="100%" height="100%"
                in="specularLighting" result="colormatrix"></feColorMatrix>
        </filter>
        <linearGradient id="metal_gradient" x1="160" y1="0" x2="0"
            y2="160" gradientUnits="userSpaceOnUse">
            <stop stop-color="#C5CAD1" />
            <stop offset="0.267508" stop-color="#C5C6CE" />
            <stop offset="0.535144" stop-color="#CFD7DE" />
            <stop offset="0.826559" stop-color="#CCCCD9" />
            <stop offset="1" stop-color="#C3C9CC" />
        </linearGradient>
        <linearGradient id="e" x1="162.732" x2="31.769" y1="145.635" y2="28.728" class="b" gradientUnits="userSpaceOnUse">
        <stop stop-color="#79AEE7" />
        <stop offset=".332" stop-color="#4960A7" />
        <stop offset="1" stop-color="#1B2030" stop-opacity=".25" />
      </linearGradient>
    </defs>
<clipPath id="c">${backgroundShape}</clipPath>
<clipPath id="d">${innerBackgroundShape}</clipPath>
<rect width="160" height="160" fill="url(#metal_gradient)" clip-path="url(#c)" />
<rect width="160" height="160" fill="#7957a8" clip-path="url(#c)" filter="url(#nnnoise-filter)" />
<rect width="160" height="160" fill="${background}" clip-path="url(#d)" />
<rect width="160" height="160" fill="url(#e)" clip-path="url(#d)" style="mix-blend-mode:color-dodge" />
        <g fill="${accent}" transform="translate(80,60) scale(0.75) translate(-80,-60)" color="${main}">${circleShape}${innerShadow}${top}${sides}${face}${bottom}</g>
</svg>`
  return template
}

/**
 * Formats the SVG string into the requested output format
 * @param svg - The SVG string to format
 * @param options - Object containing format and size options
 * @param options.format - The desired output format. See {@link IdenticonFormat}
 * @returns Promise containing the formatted identicon string
 */
export async function formatIdenticon(svg: string, { format }: { format: CreateIdenticonOptions['format'] }): Promise<string> {
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

interface CreateIdenticonOptions {
  /**
   * The format of the encoded image
   * @default 'svg'
   */
  format?: IdenticonFormat

  /**
   *
   * @default false
   */
  fancy?: boolean
}

/**
 * Generate an identicon from a string
 *
 * @param input The string to generate the identicon from
 * @param options The options for the identicon
 * @returns The identicon as a string
 */
export async function createIdenticon(input: string, options: CreateIdenticonOptions = {}): Promise<string> {
  const { format = 'svg', fancy = false } = options
  const params = await getIdenticonsParams(input)
  const svg = ensambleSvg(params, { fancy })
  const formatted = await formatIdenticon(svg, { format })
  return formatted
}

export const identiconPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path fill="url(#a)" d="M62.3 25.4 49.2 2.6A5.3 5.3 0 0 0 44.6 0H18.4c-1.9 0-3.6 1-4.6 2.6L.7 25.4c-1 1.6-1 3.6 0 5.2l13.1 22.8c1 1.6 2.7 2.6 4.6 2.6h26.2c1.9 0 3.6-1 4.6-2.6l13-22.8c1-1.6 1-3.6.1-5.2z" opacity=".1"/><defs><radialGradient id="a" cx="0" cy="0" r="1" gradientTransform="matrix(-63.0033 0 0 -56 63 56)" gradientUnits="userSpaceOnUse"><stop stop-color="#260133"/><stop offset="1" stop-color="#1F2348"/></radialGradient></defs></svg>`
export const identiconPlaceholderBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgPHBhdGggZmlsbD0idXJsKCNhKSIgZD0iTTYyLjMgMjUuNCA0OS4yIDIuNkE1LjMgNS4zIDAgMCAwIDQ0LjYgMEgxOC40Yy0xLjkgMC0zLjYgMS00LjYgMi42TC43IDI1LjRjLTEgMS42LTEgMy42IDAgNS4ybDEzLjEgMjIuOGMxIDEuNiAyLjcgMi42IDQuNiAyLjZoMjYuMmMxLjkgMCAzLjYtMSA0LjYtMi42bDEzLTIyLjhjMS0xLjYgMS0zLjYuMS01LjJ6IiBvcGFjaXR5PSIuMSIvPgogIDxkZWZzPgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSJhIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLTYzLjAwMyAwIDAgLTU2IDYzIDU2KSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMjYwMTMzIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFGMjM0OCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICA8L2RlZnM+Cjwvc3ZnPg=='
