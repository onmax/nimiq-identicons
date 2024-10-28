// import { readFile } from 'node:fs/promises'
// import { dirname, resolve } from 'pathe'
// import type { Section, Sections } from './types'

// export async function sectionsToSvg(sectionsIndexes: Record<Section, number>): Promise<Sections> {
//   const [bottom, top, face, sides] = await Promise.all((['bottom', 'face', 'sides', 'top'] as Section[]).map(s => sectionToSvg(s, sectionsIndexes[s])))
//   const sections: Sections = { bottom, top, sides, face }
//   return sections
// }

// async function sectionToSvg(section: Section, index: number): Promise<string> {
//   const numIndex = (Number(index) % 21) + 1
//   const assetIndex = numIndex < 10 ? `0${numIndex}` : `${numIndex}`

//   const svgFile = `${section}_${assetIndex}.svg`
//   const path = resolve(dirname('.'), './src/svgs', section, svgFile)
//   const svg = await readFile(path, 'utf-8')
//   return svg
// }

// Assuming you have a folder structure like: /src/svgs/bottom/*.svg, etc.

import type { Section, Sections } from './types'

// Create a map of SVG files based on section and index for efficient access
const svgModules = {
  bottom: import.meta.glob('/src/svgs/bottom/*.svg', { eager: true, query: '?url', import: 'default' }),
  top: import.meta.glob('/src/svgs/top/*.svg', { eager: true, query: '?url', import: 'default' }),
  face: import.meta.glob('/src/svgs/face/*.svg', { eager: true, query: '?url', import: 'default' }),
  sides: import.meta.glob('/src/svgs/sides/*.svg', { eager: true, query: '?url', import: 'default' }),
}

// Helper function to fetch SVG content based on section and index
async function sectionToSvg(section: Section, index: number): Promise<string> {
  const numIndex = (Number(index) % 21) + 1
  const assetIndex = numIndex < 10 ? `0${numIndex}` : `${numIndex}`
  const svgFile = `${section}_${assetIndex}.svg`

  const module = svgModules[section][`/src/svgs/${section}/${svgFile}`]
  if (!module) {
    throw new Error(`SVG file not found for ${section} with index ${index}`)
  }

  const response = await fetch(module as string)
  const svg = await response.text()
  return svg
}

// Main function to get sections as SVG
export async function sectionsToSvg(sectionsIndexes: Record<Section, number>): Promise<Sections> {
  const [bottom, top, face, sides] = await Promise.all(
    (['bottom', 'face', 'sides', 'top'] as Section[]).map(s => sectionToSvg(s, sectionsIndexes[s])),
  )
  return { bottom, top, sides, face }
}
