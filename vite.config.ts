import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: {
        'index': resolve(__dirname, 'src/index.ts'),
        'shiny': resolve(__dirname, 'src/shiny.ts'),
        'web-component': resolve(__dirname, 'src/web-component.ts'),
        'shiny-web-component': resolve(__dirname, 'src/shiny-web-component.ts'),
        'types': resolve(__dirname, 'src/types.ts'),
        'core': resolve(__dirname, 'src/core.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['node:*', 'jiti'],
    },
  },
  plugins: [
    dts({
      rollupTypes: true,
      include: ['src'],
    }),
  ],
})
