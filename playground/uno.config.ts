import { presetNimiq } from 'nimiq-css'
import { defineConfig, presetWind } from 'unocss'
import { presetOnmax } from 'unocss-preset-onmax'
import { presetScalePx } from 'unocss-preset-scale-px'

export default defineConfig({
  presets: [
    presetWind(),
    presetOnmax({ presets: { wind4: false } }),
    presetNimiq({
      attributifyUtilities: true,
      utilities: true,
      staticContent: true,
    }),
    presetScalePx(),
  ],
})
