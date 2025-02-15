import { cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'pathe'
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
    {
      name: 'features', // the name of your custom plugin. Could be anything.
      closeBundle: async () => {
        const __dirname = dirname(fileURLToPath(import.meta.url))
        const srcDir = join(__dirname, 'src/features/optimized')
        const destDir = join(__dirname, 'dist/features')
        await cp(srcDir, destDir, { recursive: true })
        console.log('✓ Copied optimized features to dist')
      },
    },

  ],
})
