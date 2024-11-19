import { createIdenticon, identiconPlaceholder } from './identicons'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = `${hostStyles}${identiconPlaceholder}`

export class IdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'format']

  private shadow: ShadowRoot

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    // Add debug styles
    this.shadow.innerHTML = placeholder
  }

  async attributeChangedCallback(name: string, _oldValue: string, newValue: string): Promise<void> {
    if (name === 'input')
      await this.updateIdenticon(newValue)
  }

  private async updateIdenticon(input: string): Promise<void> {
    if (!input) {
      this.shadow.innerHTML = identiconPlaceholder
      return
    }

    try {
      const identicon = await createIdenticon(input)

      // First set styles to maintain them
      this.shadow.innerHTML = `${hostStyles}${identicon}`
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-identicon', IdenticonElement)
