// import { presetRemToPx } from '@unocss/preset-rem-to-px'
import { presetNimiq } from 'nimiq-css'
import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'
import { presetFluidSizing } from 'unocss-preset-fluid-sizing'
import { presetScalePx } from 'unocss-preset-scale-px'

export default defineConfig({
  // ...UnoCSS options
  presets: [
    presetUno(),
    presetAttributify(),
    presetNimiq({
      attributifyUtilities: true,
      utilities: true,
      staticContent: true,
    }),
    // presetRemToPx({ baseFontSize: 4 }),
    presetIcons(),
    // @ts-expect-error The preset is fine
    presetScalePx(),
    presetFluidSizing(),
  ],
})
