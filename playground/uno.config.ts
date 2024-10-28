import { presetRemToPx } from '@unocss/preset-rem-to-px'
import { presetNimiq } from 'nimiq-css'
import { defineConfig, presetAttributify, presetUno } from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  presets: [
    presetUno(),
    presetAttributify(),
    presetNimiq({
      attributifyUtilities: true,
      utilities: true,
      typography: true,
      staticContent: true,
      fonts: false,
    }),
    presetRemToPx({ baseFontSize: 4 }),
  ],
})
