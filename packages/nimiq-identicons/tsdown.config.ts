import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/shiny.ts', 'src/web-component.ts', 'src/shiny-web-component.ts', 'src/types.ts', 'src/core.ts', 'src/batch.ts', 'src/cache.ts', 'src/worker.ts', 'src/worker-client.ts'],
  format: 'esm',
  dts: true,
  clean: true,
  external: ['@nimiq/utils'],
})
