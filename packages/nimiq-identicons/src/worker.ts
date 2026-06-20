import type { CreateIdenticonOptions, IdenticonMaterial } from './types.js'
import { createIdenticon } from './core.js'
import { createShinyIdenticon } from './shiny.js'

export interface IdenticonWorkerRequest {
  id: number
  inputs: string[]
  options?: CreateIdenticonOptions
  material?: IdenticonMaterial
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
  const { id, inputs, options, material } = event.data
  try {
    const results = material
      ? inputs.map(input => createShinyIdenticon(input, { ...options, material }))
      : inputs.map(input => createIdenticon(input, options))
    ctx.postMessage({ id, results })
  }
  catch (error) {
    ctx.postMessage({ id, error: error instanceof Error ? error.message : String(error) })
  }
}
