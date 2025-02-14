import { createExternalPackageIconLoader } from '@iconify/utils/lib/loader/external-pkg'
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
    presetIcons({
      collections: {
        ...createExternalPackageIconLoader('@iconify-json/nimiq'),
      },
    }),
    // @ts-expect-error The preset is fine
    presetScalePx(),
    presetFluidSizing(),
  ],
})
