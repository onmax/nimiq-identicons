import { optimize } from 'svgo'
import type { PluginConfig } from 'svgo'

const plugins: PluginConfig[] = [
  'preset-default',
  { name: 'removeAttrs', params: { attrs: 'viewBox' } },
  { name: 'mergePaths', params: { force: true } },
]

export function optimizeSvg(svg: string): string {
  return optimize(svg, { multipass: true, plugins }).data
}
