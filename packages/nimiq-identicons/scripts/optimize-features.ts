import type { PluginConfig } from 'svgo'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { cwd } from 'node:process'
import { join } from 'pathe'
import { optimize } from 'svgo'
import tinyglob from 'tiny-glob'

interface XastElement { type: 'element', name: string, attributes: Record<string, string>, children: unknown[] }

async function optimizeSvgFile(inputPath: string, outputPath: string) {
  try {
    const data = await readFile(inputPath, 'utf8')
    const svg = optimizeSvg(data)
    if (!svg)
      return
    const withoutSvgTag = svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')
    await writeFile(outputPath, withoutSvgTag, 'utf8')
    console.log(`Optimized: ${outputPath}`)
  }
  catch (error) {
    console.error(`Error processing ${inputPath}:`, error)
  }
}

const greenToCurrentColorPlugin = {
  name: 'greenToCurrentColor',
  type: 'visitor',
  fn: () => {
    return {
      element: {
        enter: (node: XastElement) => {
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
  const base = join(cwd(), './src/features')

  await mkdir(join(base, 'optimized/top'), { recursive: true })
  await mkdir(join(base, 'optimized/bottom'), { recursive: true })
  await mkdir(join(base, 'optimized/sides'), { recursive: true })
  await mkdir(join(base, 'optimized/face'), { recursive: true })

  const originalDir = join(base, 'original')
  const inputPaths = await tinyglob(`${originalDir}/**/*.svg`)

  // replace original with optimized
  const outputPaths = inputPaths.map(path => path.replace('original', 'optimized'))
  const zippedPaths = inputPaths.map((path, index) => [join(cwd(), path), join(cwd(), outputPaths[index])])
  return Promise.all(zippedPaths.map(([inputPath, outputPath]) => optimizeSvgFile(inputPath, outputPath)))
}

processFiles().then(() => console.log('SVG optimization complete'))
