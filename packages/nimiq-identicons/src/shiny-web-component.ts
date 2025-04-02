import type { IdenticonMaterial } from './types'
import { identiconPlaceholder } from '.'
import { createShinyIdenticon } from './shiny'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = identiconPlaceholder

export class ShinyIdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'material', 'should-validate-address']

  private shadow: ShadowRoot
  private currentInput: string | undefined
  private currentMaterial: IdenticonMaterial | undefined
  private currentShouldValidate: boolean = false

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    // Add styles first, then content
    this.shadow.innerHTML = hostStyles
    const content = document.createElement('div')
    content.innerHTML = placeholder
    this.shadow.appendChild(content)
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string | null): void {
    if (name === 'input')
      this.currentInput = newValue || ''
    else if (name === 'material')
      this.currentMaterial = newValue as IdenticonMaterial || undefined
    else if (name === 'should-validate-address')
      this.currentShouldValidate = newValue === 'true' || newValue === null

    this.updateIdenticon(this.currentInput || '')
  }

  private updateIdenticon(input: string): void {
    if (!input) {
      this.shadow.lastElementChild!.innerHTML = placeholder
      return
    }

    try {
      const identicon = createShinyIdenticon(input, {
        material: this.currentMaterial!,
        shouldValidateAddress: this.currentShouldValidate,
      })
      this.shadow.lastElementChild!.innerHTML = identicon
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.lastElementChild!.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-shiny-identicon', ShinyIdenticonElement)
