export type Section = 'face' | 'sides' | 'top' | 'bottom'
export type ColorType = 'accent' | 'background' | 'main'
export type Colors = Record<ColorType, string>
export type Sections = Record<Section, string>
export interface IdenticonParams { colors: Colors, sections: Sections, innerShadow?: string, backgroundShape?: string, circleShape?: string }

export type IdenticonFormat = 'svg' | 'image/svg+xml' // | 'image/png'

export interface CreateIdenticonOptions {
  /**
   * The format of the encoded image
   * @default 'svg'
   */
  format?: IdenticonFormat
}

export enum ShinyRing {
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Platinum = 'platinum',
  Diamond = 'diamond',
  Master = 'master',
  Grandmaster = 'grandmaster',
}

export type CreateShinyIdenticonOptions = CreateIdenticonOptions & {
  /**
   * The border color of the shiny identicon
   */
  ring: ShinyRing
}
