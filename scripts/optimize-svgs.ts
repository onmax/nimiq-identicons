import { readFile, writeFile } from 'node:fs/promises'
import { cwd } from 'node:process'
import { join } from 'pathe'
import { optimize } from 'svgo'
import tinyglob from 'tiny-glob'
import type { PluginConfig } from 'svgo'

async function optimizeSvgFile(filePath: string) {
  try {
    const data = await readFile(filePath, 'utf8')
    const svg = optimizeSvg(data)
    if (!svg)
      return
    const withoutSvgTag = svg.replace(/<svg[^>]*>/, '')
    await writeFile(filePath, withoutSvgTag, 'utf8')
    console.log(`Optimized: ${filePath}`)
  }
  catch (error) {
    console.error(`Error processing ${filePath}:`, error)
  }
}

const greenToCurrentColorPlugin = {
  name: 'greenToCurrentColor',
  type: 'visitor',
  fn: () => {
    return {
      element: {
        enter: (node: any) => {
          if (node.attributes.fill === '#0f0' || node.attributes.fill === '#00ff00')
            node.attributes.fill = 'currentColor'

          if (node.attributes.stroke === '#0f0' || node.attributes.stroke === '#00ff00')
            node.attributes.stroke = 'currentColor'
        },
      },
    }
  },
}

const plugins: PluginConfig[] = [
  'preset-default',
  { name: 'removeAttrs', params: { attrs: 'viewBox' } },
  { name: 'mergePaths', params: { force: true } },
  greenToCurrentColorPlugin,
]

function optimizeSvg(svg: string): string {
  return optimize(svg, { multipass: true, plugins }).data
}

async function processFiles() {
  const files = await tinyglob('src/svgs/*/*.svg')
  return Promise.all(files.map(file => optimizeSvgFile(join(cwd(), file))))
}

processFiles().then(() => console.log('SVG optimization complete'))
