import type { Section, Sections } from './types'

const svgModules = {
  bottom: import.meta.glob('/src/svgs/bottom/*.svg', { eager: true, query: '?url', import: 'default' }),
  top: import.meta.glob('/src/svgs/top/*.svg', { eager: true, query: '?url', import: 'default' }),
  face: import.meta.glob('/src/svgs/face/*.svg', { eager: true, query: '?url', import: 'default' }),
  sides: import.meta.glob('/src/svgs/sides/*.svg', { eager: true, query: '?url', import: 'default' }),
}

const svgCache: Record<string, string> = {}

// Preload SVGs
Object.keys(svgModules).forEach((section) => {
  for (const path in svgModules[section as Section]) {
    fetch(svgModules[section as Section][path] as string)
      .then(response => response.text())
      .then((svg) => {
        svgCache[path] = svg
      })
  }
})

async function sectionToSvg(section: Section, index: number): Promise<string> {
  const numIndex = (Number(index) % 21) + 1
  const assetIndex = numIndex < 10 ? `0${numIndex}` : `${numIndex}`
  const selector = `${section}_${assetIndex}`
  const svgFile = `/src/svgs/${section}/${selector}.svg`

  const cachedSvg = svgCache[svgFile]
  if (!cachedSvg) {
    console.error(`SVG file not found for ${section} with index ${numIndex}/${index}. Path ${svgFile}`)
    throw new Error(`SVG file not found for ${section} with index ${index}`)
  }
  return cachedSvg
}

export async function sectionsToSvg(sectionsIndexes: Record<Section, number>): Promise<Sections> {
  const [bottom, top, face, sides] = await Promise.all(
    (['bottom', 'face', 'sides', 'top'] as Section[]).map(s => sectionToSvg(s, sectionsIndexes[s])),
  )
  return { bottom, top, sides, face }
}
