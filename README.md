# Identicons

A rewrite of the Identicon module with ESM support.

[Docs preview](https://deploy-preview-78--developer-center.netlify.app/build/ui/identicons#nimiq-identicons)

- Fully typed
- Runtime agnostic: works in browser, workerd, node, bun...
- About 2 times faster on startup and 5 times faster on re-rendering than previous version
- Produces about 25% smaller SVG, thanks to svgo
- Simplify bundling compare to previous version
- No more promises!

## Installation

```bash
npm install identicons-esm
```

```ts
import { createIdenticon } from 'identicons-esm'

const input = 'Your input here'
const svg = createIdenticon(input, { shouldValidateAddress: false }) // shouldValidateAddress is `true` by default
```

## Identicons as `<img>`

```ts
import { createIdenticon } from 'identicons-esm'

const input = 'Your input here'
const imgSrc = await createIdenticon(input, { shouldValidateAddress: false, format: 'image/svg+xml' })
```

```html
<img src="imgSrc" alt="Identicon" />
```

## Identicons as Web Component

```html
<nimiq-identicon input="Your input here" should-validate-address="false"></nimiq-identicon>
<nimiq-shiny-identicon input="Your input here" should-validate-address="false" material="gold"></nimiq-shiny-identicon>
```

Make sure to import the web components in your project before using them.

### Web Components in Vue 3

```vue
<script setup lang="ts">
import type { IdenticonMaterial } from 'identicons-esm/types'
import 'identicons-esm/web-components'
import 'identicons-esm/shiny-web-components'

const input = 'Your input here'
const shouldValidateAddress = false
const material: IdenticonMaterial = 'gold'
</script>

<template>
  <nimiq-identicon :input="input" :should-validate-address="shouldValidateAddress" />
  <nimiq-shiny-identicon :input="input" :should-validate-address="shouldValidateAddress" :material="material" />
</template>
```

#### Vite warning

To avoid a warning in development mode, you have to let Vite know that the web component exists:

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: tag => ['nimiq-identicon', 'nimiq-shiny-identicon'].includes(tag),
      }
    }
  })],
})
```

> [!WARNING]
> This is a PoC and the API might change

### Getting just a specific color or section of the identicon

```ts
import { getIdenticonsParams } from 'identicons-esm/core'

const input = 'Your input here'
const { colors, sections } = getIdenticonsParams(input)

// colors.background -> '#0ab123'
// colors.main -> '#0ab123'
// colors.accent -> '#0ab123'
// sections.top -> Path to the SVG
// sections.bottom -> Path to the SVG
// sections.sides -> Path to the SVG
// sections.face -> Path to the SVG
```

## Why not just use the V1 version?

We were having issues running the lib in workerd. That's it. But then, when I started looking into it, I discovered that we are there was space for improvements.

### Bundling

While `gulp` is great and allows you to build the library, `vite` is the standard these days. With the old implementation, the library loaded all the features of svg into a single DOM element (using `dom-parser`) and from there, depending on the hash, it selected the features for the fiven hash. Then it ensabmages all the selected elements together with a predefined background and colors and runs an optimization process on each render.

With the new approach, we run `svgo` with some defined plugins in dev and write the optimized svg to the folder. Then at runtime we just assemble the selected optimized features and return the SVG. After the selected features have been retrieved, we just ensamlbe the SVG and return it. **We don't use `dom-parser` and we don't need to optimize the SVG at runtime**.

### Performance Comparison

| Metric                 | V1 Implementation | Current Implementation |
| ---------------------- | ----------------- | ---------------------- |
| First Time Load        | ~20ms             | ~10ms                  |
| Already Loaded         | ~6ms              | ~1ms                   |
| Average Size Reduction | -                 | 25% smaller            |

## Migrate

Currently part of the implementation has been ported

### Generate SVG string

#### Before

```js
// @ts-ignore Types no implemented
import Identicons from '@nimiq/identicons/dist/identicons.min.js'
IdenticonsV1.svgPath = '@nimiq/identicons/dist/identicons.min.svg'

const input = 'Your input here'
const svg = await Identicons.svg(input)
//    ^ type any 😩
```

#### Now

```ts
import { createIdenticon } from 'identicons-esm'

const input = 'Your input here'
const svg = createIdenticon(input)
//    ^ type string
```

### Generate Data URI

#### Before

```js
// @ts-ignore Types no implemented
import Identicons from '@nimiq/identicons/dist/identicons.min.js'
IdenticonsV1.svgPath = '@nimiq/identicons/dist/identicons.min.svg'

const input = 'Your input here'
const svg = await Identicons.toDataUri(input)
//    ^ type any 😩
```

#### Now

```ts
import { createIdenticon } from 'identicons-esm'

const input = 'Your input here'
const svg = createIdenticon(input, { format: 'image/svg+xml' })
//    ^ type string
```

### Discontiuned functions

There are functions in the original library that are not included in this implementation due to lack of use. These functions are:

- `makeLetterHash`
- `wordsByEntropy`
- `Identicons.render`
- `Identicons.image`
- `Identicons.placeholder`

## Development

```bash
git clone https://github.com/onmax/nimiq-identicons
pnpm install
pnpm dev
pnpm optimize-svg # Run just if you modify the content of the features
```
