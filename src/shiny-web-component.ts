import type { IdenticonMaterial } from './types'
import { identiconPlaceholder } from '.'
import { createShinyIdenticon } from './shiny'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = `${hostStyles}${identiconPlaceholder}`

export class ShinyIdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'material', 'should-validate-address']

  private shadow: ShadowRoot
  private currentInput: string | undefined
  private currentMaterial: IdenticonMaterial | undefined
  private currentShouldValidate: boolean = false

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = placeholder
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string | null): void {
    if (name === 'input') {
      this.currentInput = newValue || ''
    }
    else if (name === 'material') {
      if (!['bronze', 'silver', 'gold', 'platinum'].includes(newValue || ''))
        throw new Error('Invalid material attribute. Must be one of: bronze, silver, gold, platinum')
      this.currentMaterial = newValue as IdenticonMaterial || undefined
    }
    else if (name === 'should-validate-address') {
      this.currentShouldValidate = newValue === 'true' || newValue === null
    }

    this.updateIdenticon(this.currentInput || '')
  }

  private updateIdenticon(input: string): void {
    if (!input) {
      this.shadow.innerHTML = identiconPlaceholder
      return
    }

    try {
      const identicon = createShinyIdenticon(input, {
        material: this.currentMaterial!,
        shouldValidateAddress: this.currentShouldValidate,
      })
      this.shadow.innerHTML = `${hostStyles}${identicon}`
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-shiny-identicon', ShinyIdenticonElement)
