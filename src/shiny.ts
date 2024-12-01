import { defaultCircleShape, defaultShadow, formatIdenticon, getIdenticonsParams } from './core'
import type { CreateShinyIdenticonOptions, ShinyIdenticonParams } from './types'

export const defaultBackgroundShape = `<path d="m126.072 8.437 31.956 55.003a15.918 15.918 0 0 1 2.158 7.999c0 2.808-.745 5.566-2.158 7.998l-31.956 55.003c-2.867 4.949-8.183 7.998-13.933 7.998H48.224c-5.75 0-11.066-3.049-13.933-7.998L2.336 79.437a15.96 15.96 0 0 1-2.15-7.998c0-2.808.741-5.566 2.15-7.999l31.96-55.003a16.047 16.047 0 0 1 5.889-5.854A16.173 16.173 0 0 1 48.229.438h63.91c5.75 0 11.066 3.05 13.933 7.999Z" />`

const bronzeGradient = `<linearGradient id="m" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop stop-color="#ECF5FC"/><stop offset="1" stop-color="#BEC8D3" /></linearGradient>`
// <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 77 77">
//   <circle cx="38.5" cy="38.5" r="38.5" fill="url(#a)"/>
//   <defs>
//     <linearGradient id="a" x1="38.5" x2="38.5" y1="0" y2="77" gradientUnits="userSpaceOnUse">
//       <stop stop-color="#FB3C3C"/>
//       <stop offset="1" stop-color="#952323"/>
//     </linearGradient>
//   </defs>
// </svg>
const goldGradient = `<linearGradient id="m" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop stop-color="#FFD767"/><stop offset="1" stop-color="#BB9B25"/></linearGradient>`
const silverGradient = `<linearGradient id="m" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop stop-color="#F2F2F2"/><stop offset="1" stop-color="#D9D9D9"/></linearGradient>`
const platinumGradient = `<linearGradient id="m" x1="160" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse"><stop stop-color="#ECEEFF"/><stop offset="1" stop-color="#F2EEFF"/></linearGradient>`

export const materialGradients = { bronze: bronzeGradient, gold: goldGradient, silver: silverGradient, platinum: platinumGradient }

export function ensambleShinySvg({ colors: { accent, background, main }, sections: { bottom, face, sides, top }, innerShadow, backgroundShape, circleShape, material }: ShinyIdenticonParams): string {
  innerShadow ||= defaultShadow
  backgroundShape ||= defaultBackgroundShape
  circleShape ||= defaultCircleShape(main)

  // TODO Minify svg
  const innerBackgroundShape = `<path d="M120.656 10.991C118.869 7.906 115.549 6 111.954 6H48.046c-1.764 0-3.5.463-5.028 1.34a10.029 10.029 0 0 0-3.68 3.659L7.382 65.992l-.002.004a9.99 9.99 0 0 0 0 10.006l.002.003 31.955 55.002A10.053 10.053 0 0 0 48.039 136h63.915c3.595 0 6.915-1.907 8.702-4.993l.004-.006 31.955-55.003a9.943 9.943 0 0 0 .001-9.996l-31.96-55.012Z" />`
  const noise = `<filter id="o" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="linearRGB"><feTurbulence type="turbulence" baseFrequency="1" numOctaves="4" seed="15" stitchTiles="stitch" x="0%" y="0%" width="100%" height="100%" result="turbulence"></feTurbulence><feSpecularLighting surfaceScale="3" specularConstant="3" specularExponent="20" lighting-color="#0eff00" x="0%" y="0%" width="100%" height="100%" in="turbulence" result="specularLighting"><feDistantLight azimuth="3" elevation="19"></feDistantLight></feSpecularLighting><feColorMatrix type="saturate" values="0" x="0%" y="0%" width="100%" height="100%" in="specularLighting" result="colormatrix"></feColorMatrix></filter>`
  const template = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160"><defs>${noise}${materialGradients[material]}<linearGradient id="e" x1="162.732" x2="31.769" y1="145.635" y2="28.728" class="b" gradientUnits="userSpaceOnUse"><stop stop-color="#79AEE7" /><stop offset=".33" stop-color="#4960A7" /><stop offset="1" stop-color="#1B2030" stop-opacity=".25" /></linearGradient></defs><clipPath id="c">${backgroundShape}</clipPath><clipPath id="d">${innerBackgroundShape}</clipPath><rect width="160" height="160" fill="url(#m)" clip-path="url(#c)" /><rect width="160" height="160" fill="#7957a8" clip-path="url(#c)" filter="url(#o)" /><rect width="160" height="160" fill="${background}" clip-path="url(#d)" /><rect width="160" height="160" fill="url(#e)" clip-path="url(#d)" style="mix-blend-mode:color-dodge" /><g fill="${accent}" transform="translate(80,60) scale(0.968) translate(-80,-60)" color="${main}">${circleShape}${innerShadow}${top}${sides}${face}${bottom}</g></svg>`
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
  const svg = ensambleShinySvg({ ...params, material: options.material })
  const formatted = await formatIdenticon(svg, options)
  return formatted
}
