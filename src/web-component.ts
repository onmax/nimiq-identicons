import { createIdenticon, identiconPlaceholder } from '.'
import type { ShinyRing } from './types'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = `${hostStyles}${identiconPlaceholder}`

export class IdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'shiny', 'ring']

  private shadow: ShadowRoot

  private currentInput: string | undefined
  private shinyFlag = false
  private shinyRing: ShinyRing | undefined

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = placeholder

    this.shinyFlag = this.hasAttribute('shiny')
  }

  async attributeChangedCallback(name: string, _oldValue: string, newValue: string | null): Promise<void> {
    if (name === 'input') {
      this.currentInput = newValue || ''
      await this.updateIdenticon(this.currentInput)
    }
    else if (name === 'shiny') {
      this.shinyFlag = (!!newValue || newValue === '') && newValue !== 'false'
      if (this.currentInput) {
        await this.updateIdenticon(this.currentInput)
      }
    }
    else if (name === 'ring') {
      this.shinyRing = newValue as ShinyRing || undefined
      if (this.currentInput) {
        await this.updateIdenticon(this.currentInput)
      }
    }
  }

  private async updateIdenticon(input: string): Promise<void> {
    if (!input) {
      this.shadow.innerHTML = identiconPlaceholder
      return
    }

    try {
      let identicon: string
      if (!this.shinyFlag) {
        identicon = await createIdenticon(input)
      }
      else {
        if (!this.shinyRing) {
          throw new Error('Shiny identicons require a ring attribute')
        }
        const { createShinyIdenticon } = await import('./shiny')
        identicon = await createShinyIdenticon(input, { ring: this.shinyRing })
      }
      this.shadow.innerHTML = `${hostStyles}${identicon}`
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-identicon', IdenticonElement)
