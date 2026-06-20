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

## Rendering many identicons (1k–100k+) without blocking

`createIdenticon` is synchronous. Generating thousands in a tight loop runs as one long task and freezes the page. Use one of the following instead.

### Batched (recommended)

`createIdenticons` generates in chunks and yields to the event loop between them, so the page stays responsive. Works identically in Chrome and Safari (it uses `scheduler.yield` where available and falls back to a `MessageChannel` macrotask otherwise).

```ts
import { createIdenticons } from 'identicons-esm/batch'

const inputs = addresses // string[]
const controller = new AbortController()

const svgs = await createIdenticons(inputs, {
  shouldValidateAddress: false,
  format: 'image/svg+xml',
  chunkSize: 64, // items per burst (default 64)
  signal: controller.signal, // optional: cancel between chunks
  onProgress: (done, total) => console.log(`${done}/${total}`),
})
```

Stream results to paint incrementally (pairs well with virtualized lists):

```ts
import { createIdenticonsStream } from 'identicons-esm/batch'

for await (const { index, value } of createIdenticonsStream(inputs, { shouldValidateAddress: false })) {
  // insert `value` at `index` as it becomes ready
}
```

> Shiny (material) variants share the same APIs: `createShinyIdenticons` (`identicons-esm/batch`), `createShinyIdenticonCached` (`identicons-esm/cache`), and `pool.generateShiny` (`identicons-esm/worker-client`) — same options plus `material`. `yieldToMain()` (from `identicons-esm/batch`), the cooperative yield these helpers use between chunks, is also exported if you need to interleave your own work.

### Web Worker pool (off the main thread)

Generates on worker threads. Best when you can keep results in the worker; returning many strings to the main thread pays a `postMessage` copy cost, so benchmark against the batched approach for your workload.

```ts
import { createIdenticonWorkerPool } from 'identicons-esm/worker-client'

// In Vite / modern bundlers, the default worker URL resolution works out of the box.
// If your bundler needs help, pass a factory (Vite example):
import IdenticonWorker from 'identicons-esm/worker?worker'

const pool = createIdenticonWorkerPool({ createWorker: () => new IdenticonWorker() })
const svgs = await pool.generate(inputs, { shouldValidateAddress: false })
pool.terminate()
```

### Cheaper `<img>` sources

Each `<img>` over 10k+ items is much lighter than inline SVG DOM. For the source you have two options:

- `format: 'image/svg+xml'` → a base64 data URI (default, backwards compatible).
- An object URL, which skips base64 entirely:

```ts
import { createIdenticon, identiconToObjectURL, revokeIdenticonObjectURL } from 'identicons-esm'

const url = identiconToObjectURL(createIdenticon(input, { shouldValidateAddress: false, format: 'svg' }))
img.src = url
// IMPORTANT: revoke when the image is gone, or the URL leaks
revokeIdenticonObjectURL(url)
```

> **Displaying thousands is a separate cost from generating them.** Each identicon shown as an SVG `<img>` makes the browser build an isolated SVG document to rasterize it, and Chromium can only do that on the main thread (`createImageBitmap` rejects SVG) — a few thousand at once will freeze or crash the tab. To put that many on screen, either virtualize (keep only on-screen items in the DOM) or rasterize the SVGs onto a `<canvas>` in small, yielding chunks so the page never blocks. The playground's Benchmark tab does the latter. The library's job is to make each item cheap and async to produce; getting them on screen at scale is the consumer's.

### Caching repeated inputs

Opt-in LRU cache for when the same inputs are rendered repeatedly (re-renders, scrolling back into view). It does nothing for a one-shot batch of unique inputs.

```ts
import { createIdenticonCache, createIdenticonCached } from 'identicons-esm/cache'

const cache = createIdenticonCache(4096)
const svg = createIdenticonCached(input, { shouldValidateAddress: false, cache })
```

### Benchmarks

`makeHash` (the hot path) is now allocation-free and memoizes its inner chaos function, so generation throughput is **~15× higher** than before with byte-identical output (`createIdenticon`: ~1.16M ops/s as a raw SVG string, ~671k ops/s as a base64 data URI).

The browser benchmark drives the playground's **Benchmark** tab via Playwright, measuring each strategy's impact on the main thread. Dev-mode numbers — a production build is faster; the **relative** behavior is the point:

| count  | mode    | gen   | throughput | long tasks | worst frame gap |
| ------ | ------- | ----- | ---------- | ---------- | --------------- |
| 10,000 | sync    | 47ms  | ~211k/s    | 1 (52ms)   | **45ms**        |
| 10,000 | batched | 50ms  | ~199k/s    | 0          | 9ms             |
| 10,000 | worker  | 79ms  | ~127k/s    | 0          | 8.9ms           |
| 10,000 | cached  | 42ms  | ~239k/s    | 0          | 30ms            |
| 50,000 | sync    | 215ms | ~232k/s    | 1 (221ms)  | **211ms**       |
| 50,000 | batched | 210ms | ~238k/s    | 0          | 91ms            |
| 50,000 | cached  | 422ms | ~118k/s    | 1 (428ms)  | **409ms**       |

(Chromium; WebKit shows the same pattern.) **batched** matches sync's raw speed while eliminating long tasks, so the page never blocks; **sync** freezes proportionally to count; **worker** frees raw compute but pays a `postMessage` copy for the returned strings; **cached** only helps on repeat renders — a cold run (shown here) is pure overhead, ≈ sync at 10k and worse at 50k from cache fill/eviction.

Run them:

- `pnpm --filter identicons-esm bench` — node throughput.
- `node packages/nimiq-identicons/bench/browser-bench.mjs` (with `pnpm dev` running) — browser long-tasks / frame-blocking across Chromium and WebKit.

Full results: [`packages/nimiq-identicons/bench/RESULTS.md`](./packages/nimiq-identicons/bench/RESULTS.md).

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
