import { env } from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: env.BASE_URL,
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag === 'nimiq-identicon' || tag === 'nimiq-shiny-identicon',
        },
      },
    }),
    vueDevTools(),
    UnoCSS(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'identicons-esm': fileURLToPath(new URL('../packages/nimiq-identicons/src', import.meta.url)),
    },
  },
})
