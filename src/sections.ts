import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'pathe'
import type { Section, Sections } from './types'

export async function sectionsToSvg(sectionsIndexes: Record<Section, number>): Promise<Sections> {
  const [bottom, top, face, sides] = await Promise.all((['bottom', 'face', 'sides', 'top'] as Section[]).map(s => sectionToSvg(s, sectionsIndexes[s])))
  const sections: Sections = { bottom, top, sides, face }
  return sections
}

async function sectionToSvg(section: Section, index: number): Promise<string> {
  const numIndex = (Number(index) % 21) + 1
  const assetIndex = numIndex < 10 ? `0${numIndex}` : `${numIndex}`

  const svgFile = `${section}_${assetIndex}.svg`
  const path = resolve(dirname('.'), './src/svgs', section, svgFile)
  const svg = await readFile(path, 'utf-8')
  return svg
}
