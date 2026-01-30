import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/shiny.ts', 'src/web-component.ts', 'src/shiny-web-component.ts', 'src/types.ts', 'src/core.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  external: ['@nimiq/utils'],
})
