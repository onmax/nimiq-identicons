import { defaultBackgroundShape, defaultCircleShape, defaultShadow, formatIdenticon, getIdenticonsParams } from './core'
import type { CreateShinyIdenticonOptions, IdenticonParams } from './types'

// TODO colors
export function ensambleShinySvg({ colors: { accent, background, main }, sections: { bottom, face, sides, top }, innerShadow, backgroundShape, circleShape }: IdenticonParams): string {
  innerShadow ||= defaultShadow
  backgroundShape ||= defaultBackgroundShape
  circleShape ||= defaultCircleShape(main)

  const innerBackgroundShape = `<path d="M120.656 10.991C118.869 7.906 115.549 6 111.954 6H48.046c-1.764 0-3.5.463-5.028 1.34a10.029 10.029 0 0 0-3.68 3.659L7.382 65.992l-.002.004a9.99 9.99 0 0 0 0 10.006l.002.003 31.955 55.002A10.053 10.053 0 0 0 48.039 136h63.915c3.595 0 6.915-1.907 8.702-4.993l.004-.006 31.955-55.003a9.943 9.943 0 0 0 .001-9.996l-31.96-55.012Z" />`
  const template = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink"
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
 * Generate a shiny identicon from a string
 *
 * @param input The string to generate the identicon from
 * @param options The options for the identicon
 * @returns The identicon as a string
 */
export async function createShinyIdenticon(input: string, options: CreateShinyIdenticonOptions): Promise<string> {
  const params = await getIdenticonsParams(input)
  const svg = ensambleShinySvg(params)
  const formatted = await formatIdenticon(svg, options)
  return formatted
}
