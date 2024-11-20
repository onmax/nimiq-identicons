import { identiconPlaceholder } from '.'
import { createShinyIdenticon } from './shiny'
import type { IdenticonMaterial } from './types'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = `${hostStyles}${identiconPlaceholder}`

export class ShinyIdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'material']

  private shadow: ShadowRoot

  private currentInput: string | undefined
  private currentMaterial: IdenticonMaterial | undefined

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
      if (!['bronze', 'silver', 'gold', 'platinum'].includes(newValue || ''))
        throw new Error('Invalid material attribute. Must be one of: bronze, silver, gold, platinum')
      this.currentMaterial = newValue as IdenticonMaterial || undefined
    }
  }

  private async updateIdenticon(input: string): Promise<void> {
    if (!input) {
      this.shadow.innerHTML = identiconPlaceholder
      return
    }

    try {
      const identicon = await createShinyIdenticon(input, { material: this.currentMaterial! })
      this.shadow.innerHTML = `${hostStyles}${identicon}`
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-shiny-identicon', ShinyIdenticonElement)
