# Identicons

A rewrite of the Identicon module with ESM support.

- Fully typed
- Runtime agnostic: works in browser, workerd, node, bun...
- About 2 times faster on startup and 5 times faster on re-rendering
- Produces about 25% smaller SVG

## Installation

```bash
npm install @onmax/identicons
```

```ts
import { createIdenticon } from 'identicons'

const input = 'Your input here'
const svg = await createIdenticon(input)
```

> [!WARNING]
> This is a PoC and the API might change

### Getting just a specific color or section of the identicon

```ts
import { createIdenticon } from 'identicons'

const input = 'Your input here'
const { colors, sections } = await getIdenticonsParams(input)

// colors.background -> '#0ab123'
// colors.main -> '#0ab123'
// colors.accent -> '#0ab123'
// sections.top -> Path to the SVG
// sections.bottom -> Path to the SVG
// sections.sides -> Path to the SVG
// sections.face -> Path to the SVG
```

## Migrate

Currently part of the implementation has been ported

### Generate SVG string

#### Before

```js
// @ts-ignore Types no implemented
import Identicons from '@nimiq/identicons/dist/identicons.min.js'
IdenticonsLegacy.svgPath = './node_modules/@nimiq/identicons/dist/identicons.min.svg'

const input = 'Your input here'
const svg = await Identicons.svg(input)
//    ^ type any 😩
```

#### Now

```ts
import { createIdenticon } from 'identicons'

const input = 'Your input here'
const svg = await createIdenticon(input)
//    ^ type string
```

### Generate Data URI

#### Before

```js
// @ts-ignore Types no implemented
import Identicons from '@nimiq/identicons/dist/identicons.min.js'
IdenticonsLegacy.svgPath = './node_modules/@nimiq/identicons/dist/identicons.min.svg'

const input = 'Your input here'
const svg = await Identicons.toDataUri(input)
//    ^ type any 😩
```

#### Now

```ts
import { createIdenticon } from 'identicons'

const input = 'Your input here'
const svg = await createIdenticon(input, { format: 'image/svg+xml' })
//    ^ type string
```

### Discontiuned functions

There are functions in the original library that are not included in this implementation because of the lack of use. The function are:

- `makeLetterHash`
- `wordsByEntropy`
- `Identicons.render`
- `Identicons.image`
- `Identicons.placeholder`

## Development

```bash
git clone https://github.com/onmax/identicons
pnpm install
pnpm dev
```
