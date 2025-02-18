import { createIdenticon, identiconPlaceholder } from '.'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = `${hostStyles}${identiconPlaceholder}`

export class IdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'should-validate-address']

  private shadow: ShadowRoot

  private currentInput: string | undefined
  private currentShouldValidateAddress: boolean | undefined

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.shadow.innerHTML = placeholder
  }

  async attributeChangedCallback(name: string, _oldValue: string, newValue: string | null): Promise<void> {
    if (name === 'input')
      this.currentInput = newValue || ''
    if (name === 'should-validate-address')
      this.currentShouldValidateAddress = newValue === 'true' || newValue === null

    this.updateIdenticon(this.currentInput || '')
  }

  private updateIdenticon(input: string): void {
    if (!input) {
      this.shadow.innerHTML = identiconPlaceholder
      return
    }

    try {
      const identicon = createIdenticon(input, { shouldValidateAddress: this.currentShouldValidateAddress })
      this.shadow.innerHTML = `${hostStyles}${identicon}`
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-identicon', IdenticonElement)
