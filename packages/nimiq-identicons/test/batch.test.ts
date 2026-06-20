import { describe, expect, it } from 'vitest'
import { createIdenticons, createIdenticonsStream, createShinyIdenticons } from '../src/batch.js'
import { createIdenticon } from '../src/index.js'
import { createShinyIdenticon } from '../src/shiny.js'

const inputs = Array.from({ length: 200 }, (_, i) => `input-${i}`)
const opt = { shouldValidateAddress: false } as const

describe('createIdenticons', () => {
  it('matches sync createIdenticon for every input, in order', async () => {
    const expected = inputs.map(i => createIdenticon(i, opt))
    const actual = await createIdenticons(inputs, { ...opt, chunkSize: 16 })
    expect(actual).toEqual(expected)
  })

  it('reports monotonic progress ending at total', async () => {
    const progress: number[] = []
    await createIdenticons(inputs, { ...opt, chunkSize: 32, onProgress: d => progress.push(d) })
    expect(progress.at(-1)).toBe(inputs.length)
    for (let i = 1; i < progress.length; i++)
      expect(progress[i]!).toBeGreaterThan(progress[i - 1]!)
  })

  it('rejects with AbortError when aborted mid-flight', async () => {
    const controller = new AbortController()
    const promise = createIdenticons(inputs, {
      ...opt,
      chunkSize: 1,
      signal: controller.signal,
      onProgress: () => controller.abort(),
    })
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('rejects immediately if the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(createIdenticons(inputs, { ...opt, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('createIdenticonsStream', () => {
  it('yields each identicon in order, matching sync', async () => {
    const out: string[] = []
    for await (const { index, value } of createIdenticonsStream(inputs, { ...opt, chunkSize: 16 })) {
      expect(index).toBe(out.length)
      out.push(value)
    }
    expect(out).toEqual(inputs.map(i => createIdenticon(i, opt)))
  })
})

describe('createShinyIdenticons', () => {
  it('matches sync createShinyIdenticon', async () => {
    const expected = inputs.map(i => createShinyIdenticon(i, { ...opt, material: 'gold' }))
    const actual = await createShinyIdenticons(inputs, { ...opt, material: 'gold', chunkSize: 20 })
    expect(actual).toEqual(expected)
  })
})
