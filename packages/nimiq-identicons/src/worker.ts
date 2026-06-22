import type { CreateIdenticonOptions, IdenticonMaterial } from './types.js'
import { createIdenticon } from './core.js'
import { createShinyIdenticon } from './shiny.js'

export interface IdenticonWorkerRequest {
  id: number
  inputs: string[]
  options?: CreateIdenticonOptions
  material?: IdenticonMaterial
  /**
   * Whether to render shiny identicons. Carried explicitly (not inferred from
   * `material` being set) so an invalid/falsy material still routes through
   * `createShinyIdenticon` and gets normalized to bronze — matching the
   * main-thread `createShinyIdenticons` path exactly.
   */
  shiny?: boolean
}

export interface IdenticonWorkerResponse {
  id: number
  results?: string[]
  error?: string
}

// Typed view of the worker global scope without pulling in the WebWorker lib.
const ctx = globalThis as unknown as {
  onmessage: ((event: MessageEvent<IdenticonWorkerRequest>) => void) | null
  postMessage: (message: IdenticonWorkerResponse) => void
}

ctx.onmessage = (event) => {
  const { id, inputs, options, material, shiny } = event.data
  try {
    let results: string[]
    if (shiny) {
      // Merge the material once, not per input.
      const shinyOptions = { ...options, material: material as IdenticonMaterial }
      results = inputs.map(input => createShinyIdenticon(input, shinyOptions))
    }
    else {
      results = inputs.map(input => createIdenticon(input, options))
    }
    ctx.postMessage({ id, results })
  }
  catch (error) {
    ctx.postMessage({ id, error: error instanceof Error ? error.message : String(error) })
  }
}
