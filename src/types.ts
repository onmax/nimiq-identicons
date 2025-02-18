export type Section = 'face' | 'sides' | 'top' | 'bottom'
export type ColorType = 'accent' | 'background' | 'main'
export type Colors = Record<ColorType, string>
export type Sections = Record<Section, string>
export interface IdenticonParams { colors: Colors, sections: Sections, innerShadow?: string, backgroundShape?: string, circleShape?: string }

export type IdenticonFormat = 'svg' | 'image/svg+xml' // | 'image/png'

export interface CreateIdenticonOptions {
  /**
   * Whether to validate the address before generating the identicon. If address is invalid, a warn will be logged
   * and the placeholder will be returned.
   *
   * @default true
   */
  shouldValidateAddress?: boolean
}

export type IdenticonMaterial = 'bronze' | 'silver' | 'gold'
export type ShinyIdenticonParams = IdenticonParams & { material: IdenticonMaterial }

export type CreateShinyIdenticonOptions = CreateIdenticonOptions & {
  /**
   * The border color of the shiny identicon. @see{@link IdenticonMaterial}
   *
   * @default 'none'
   */
  material: IdenticonMaterial
}
