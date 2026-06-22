import { defineConfig } from 'tsdown'

export default defineConfig([
  // Main multi-entry build. Shared code (core/shiny) is split into chunks across
  // these entries — fine for normal imports.
  {
    entry: ['src/index.ts', 'src/shiny.ts', 'src/web-component.ts', 'src/shiny-web-component.ts', 'src/types.ts', 'src/core.ts', 'src/batch.ts', 'src/cache.ts', 'src/worker-client.ts'],
    format: 'esm',
    dts: true,
    clean: true,
    external: ['@nimiq/utils'],
  },
  // The worker is built on its own so it inlines core/shiny instead of importing
  // sibling hashed chunks. A Web Worker is loaded by URL (`new Worker(new
  // URL('./worker.mjs', ...))`), and if it depended on split chunks those would
  // have to be served alongside it — fragile across bundlers/CDNs. A
  // self-contained worker.mjs avoids that whole class of load failures.
  {
    entry: ['src/worker.ts'],
    format: 'esm',
    dts: true,
    clean: false,
    external: ['@nimiq/utils'],
  },
])
