export type Section = 'face' | 'sides' | 'top' | 'bottom'
export type ColorType = 'accent' | 'background' | 'main'
export type Colors = Record<ColorType, string>
export type Sections = Record<Section, string>
export type IdenticonParams = Colors & Sections
