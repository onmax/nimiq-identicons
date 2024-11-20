import { identiconPlaceholder } from '.'
import { createShinyIdenticon } from './shiny'
import { IdenticonMaterial } from './types'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = `${hostStyles}${identiconPlaceholder}`

export class IdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'material']

  private shadow: ShadowRoot

  private currentInput: string | undefined
  private currentMaterial = IdenticonMaterial.None

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
    else if (name === 'material') {
      this.currentMaterial = newValue as IdenticonMaterial || undefined
    }
  }

  private async updateIdenticon(input: string): Promise<void> {
    if (!input) {
      this.shadow.innerHTML = identiconPlaceholder
      return
    }

    try {
      const identicon = await createShinyIdenticon(input, { material: this.currentMaterial })
      this.shadow.innerHTML = `${hostStyles}${identicon}`
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-identicon', IdenticonElement)
