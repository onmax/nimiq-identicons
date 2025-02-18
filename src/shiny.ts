import type { CreateShinyIdenticonOptions, IdenticonMaterial, ShinyIdenticonParams } from './types'
import { defaultCircleShape, defaultShadow, getIdenticonsParams, validateInput } from './core'

export const defaultBackgroundShape = `<path d="m126.072 8.437 31.956 55.003a15.918 15.918 0 0 1 2.158 7.999c0 2.808-.745 5.566-2.158 7.998l-31.956 55.003c-2.867 4.949-8.183 7.998-13.933 7.998H48.224c-5.75 0-11.066-3.049-13.933-7.998L2.336 79.437a15.96 15.96 0 0 1-2.15-7.998c0-2.808.741-5.566 2.15-7.999l31.96-55.003a16.047 16.047 0 0 1 5.889-5.854A16.173 16.173 0 0 1 48.229.438h63.91c5.75 0 11.066 3.05 13.933 7.999Z" />`

export const materialColors: Record<IdenticonMaterial, [string, string]> = {
  gold: ['#FFD767', '#BB9B25'],
  silver: ['#ECF5FC', '#BEC8D3'],
  bronze: ['#FCD1BE', '#9E6262'],
}

export function assembleShinySvg({ colors: { accent, background, main }, sections: { bottom, face, sides, top }, innerShadow, backgroundShape, circleShape, material }: ShinyIdenticonParams): string {
  innerShadow ||= defaultShadow
  backgroundShape ||= defaultBackgroundShape
  circleShape ||= defaultCircleShape(main)

  // TODO Minify svg
  const innerBackgroundShape = `<path d="M120.656 10.991C118.869 7.906 115.549 6 111.954 6H48.046c-1.764 0-3.5.463-5.028 1.34a10.029 10.029 0 0 0-3.68 3.659L7.382 65.992l-.002.004a9.99 9.99 0 0 0 0 10.006l.002.003 31.955 55.002A10.053 10.053 0 0 0 48.039 136h63.915c3.595 0 6.915-1.907 8.702-4.993l.004-.006 31.955-55.003a9.943 9.943 0 0 0 .001-9.996l-31.96-55.012Z" />`
  const gradientNoise = `<filter id="o" x="-50%" y="-50%" width="200%" height="200%"><feTurbulence type="fractalNoise" baseFrequency="0.01 0.03" numOctaves="3" result="turbulence" /><feDisplacementMap in="SourceGraphic" in2="turbulence" scale="15" xChannelSelector="R" yChannelSelector="G" result="displaced" /><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" result="noise" /><feBlend in="displaced" in2="noise" mode="multiply" /><feGaussianBlur stdDeviation="0.5" /></filter>`

  const template = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160"><defs>${gradientNoise}<linearGradient id="e" x1="162.732" x2="31.769" y1="145.635" y2="28.728" class="b" gradientUnits="userSpaceOnUse"><stop stop-color="#79AEE7" /><stop offset=".33" stop-color="#4960A7" /><stop offset="1" stop-color="#1B2030" stop-opacity=".25" /></linearGradient></defs><clipPath id="c">${backgroundShape}</clipPath><clipPath id="d">${innerBackgroundShape}</clipPath><g transform="translate(0,7.5)"><rect width="160" height="160" fill="url(#m)" clip-path="url(#c)" /><rect width="160" height="160" clip-path="url(#c)" filter="url(#o)" fill="${materialColors[material][0]}" /><rect width="160" height="160" fill="${background}" clip-path="url(#d)" /><rect width="160" height="160" fill="url(#e)" clip-path="url(#d)" style="mix-blend-mode:color-dodge" /><g fill="${accent}" transform="translate(80,60) scale(0.968) translate(-80,-60)" color="${main}">${circleShape}${innerShadow}${top}${sides}${face}${bottom}</g></g></svg>`
  return template
}

/**
 * Generate a shiny identicon from a string
 *
 * @param input The string to generate the identicon from
 * @param options The options for the identicon:w
 *
 * @returns The identicon as a string
 */
export function createShinyIdenticon(input: string, options: CreateShinyIdenticonOptions): string {
  const placeholder = validateInput(input, options)
  if (placeholder)
    return placeholder
  const material = options.material
  if (!(['bronze', 'silver', 'gold'] as IdenticonMaterial[]).includes(material)) {
    console.warn(`Invalid material: ${material}. Defaulting to 'bronze'`)
    options.material = 'bronze'
  }
  const params = getIdenticonsParams(input)
  const svg = assembleShinySvg({ ...params, material: options.material })
  return svg
}
