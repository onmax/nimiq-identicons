import { defaultBackgroundShape, defaultCircleShape, defaultShadow } from './constants'
import { formatIdenticon, getIdenticonsParams } from './core'
import type { CreateIdenticonOptions, IdenticonParams } from './types'

/**
 * Assembles an SVG string from the provided identicon parameters
 * @param params - Object containing colors and sections for the identicon
 * @param params.colors - RGB colors for accent, background, and main elements
 * @param params.sections - SVG path strings for bottom, face, sides, and top elements
 * @returns Complete SVG string of the assembled identicon
 */
export function ensambleSvg({ colors: { accent, background, main }, sections: { bottom, face, sides, top }, innerShadow, backgroundShape, circleShape }: IdenticonParams): string {
  innerShadow ||= defaultShadow
  backgroundShape ||= defaultBackgroundShape
  circleShape ||= defaultCircleShape(main)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" preserveAspectRatio><defs><clipPath id="a">${backgroundShape}</clipPath></defs><g fill="${accent}" clip-path="url(#a)" color="${main}"><path fill="${background}" d="M0 0h160v160H0z"/>${circleShape}${innerShadow}${top}${sides}${face}${bottom}</g></svg>`
}

/**
 * Generate an identicon from a string
 *
 * @param input The string to generate the identicon from
 * @param options The options for the identicon
 * @returns The identicon as a string
 */
export async function createIdenticon(input: string, options: CreateIdenticonOptions = {}): Promise<string> {
  const params = await getIdenticonsParams(input)
  const svg = ensambleSvg(params)
  const formatted = await formatIdenticon(svg, options)
  return formatted
}

export const identiconPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path fill="url(#a)" d="M62.3 25.4 49.2 2.6A5.3 5.3 0 0 0 44.6 0H18.4c-1.9 0-3.6 1-4.6 2.6L.7 25.4c-1 1.6-1 3.6 0 5.2l13.1 22.8c1 1.6 2.7 2.6 4.6 2.6h26.2c1.9 0 3.6-1 4.6-2.6l13-22.8c1-1.6 1-3.6.1-5.2z" opacity=".1"/><defs><radialGradient id="a" cx="0" cy="0" r="1" gradientTransform="matrix(-63.0033 0 0 -56 63 56)" gradientUnits="userSpaceOnUse"><stop stop-color="#260133"/><stop offset="1" stop-color="#1F2348"/></radialGradient></defs></svg>`

export const identiconPlaceholderBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgPHBhdGggZmlsbD0idXJsKCNhKSIgZD0iTTYyLjMgMjUuNCA0OS4yIDIuNkE1LjMgNS4zIDAgMCAwIDQ0LjYgMEgxOC40Yy0xLjkgMC0zLjYgMS00LjYgMi42TC43IDI1LjRjLTEgMS42LTEgMy42IDAgNS4ybDEzLjEgMjIuOGMxIDEuNiAyLjcgMi42IDQuNiAyLjZoMjYuMmMxLjkgMCAzLjYtMSA0LjYtMi42bDEzLTIyLjhjMS0xLjYgMS0zLjYuMS01LjJ6IiBvcGFjaXR5PSIuMSIvPgogIDxkZWZzPgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSJhIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VHJhbnNmb3JtPSJtYXRyaXgoLTYzLjAwMyAwIDAgLTU2IDYzIDU2KSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjMjYwMTMzIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzFGMjM0OCIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICA8L2RlZnM+Cjwvc3ZnPg=='
