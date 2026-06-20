// Public entry point. Re-exports the core generation API plus the non-blocking
// batch helpers and opt-in cache (also available via the ./batch and ./cache
// subpaths). The generators live in ./core so ./batch and ./cache can import
// them without an import cycle back through this barrel.

export type { CreateIdenticonsOptions, CreateShinyIdenticonsOptions } from './batch.js'
export { createIdenticons, createIdenticonsStream, createShinyIdenticons, yieldToMain } from './batch.js'
export type { IdenticonCache } from './cache.js'
export { createIdenticonCache, createIdenticonCached, createShinyIdenticonCached } from './cache.js'
export {
  assembleSvg,
  createIdenticon,
  defaultBackgroundShape,
  identiconPlaceholder,
  identiconPlaceholderBase64,
  identiconToObjectURL,
  revokeIdenticonObjectURL,
} from './core.js'
