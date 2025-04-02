import { createIdenticon, identiconPlaceholder } from '.'

const hostStyles = `<style>:host { display: block; width: 160px; height: 160px; }</style>`
const placeholder = identiconPlaceholder

export class IdenticonElement extends HTMLElement {
  static observedAttributes = ['input', 'should-validate-address']

  private shadow: ShadowRoot

  private currentInput: string | undefined
  private currentShouldValidateAddress: boolean | undefined

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    // Add styles first, then content
    this.shadow.innerHTML = hostStyles
    const content = document.createElement('div')
    content.innerHTML = placeholder
    this.shadow.appendChild(content)
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
      this.shadow.lastElementChild!.innerHTML = placeholder
      return
    }

    try {
      const identicon = createIdenticon(input, { shouldValidateAddress: this.currentShouldValidateAddress })
      this.shadow.lastElementChild!.innerHTML = identicon
    }
    catch (error) {
      console.error('Failed to generate identicon:', error)
      this.shadow.lastElementChild!.innerHTML = placeholder
    }
  }
}

customElements.define('nimiq-identicon', IdenticonElement)
