import { createIdenticon, identiconPlaceholder } from '.'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = `${hostStyles}${identiconPlaceholder}`

export class IdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'shiny', 'ring']

  private shadow: ShadowRoot

  private currentInput: string | undefined

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = placeholder
  }

  async attributeChangedCallback(name: string, _oldValue: string, newValue: string | null): Promise<void> {
    if (name === 'input') {
      this.currentInput = newValue || ''
      await this.updateIdenticon(this.currentInput)
    }
  }

  private async updateIdenticon(input: string): Promise<void> {
    if (!input) {
      this.shadow.innerHTML = identiconPlaceholder
      return
    }

    try {
      const identicon = await createIdenticon(input)
      this.shadow.innerHTML = `${hostStyles}${identicon}`
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-identicon', IdenticonElement)
