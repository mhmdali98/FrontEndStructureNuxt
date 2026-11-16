export const PALETTE_COLORS = [
  'brand', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'zinc',
] as const
export type PaletteColor = typeof PALETTE_COLORS[number]

export const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const
export type NeutralColor = typeof NEUTRAL_COLORS[number]

export const RADIUS_OPTIONS = [0, 0.125, 0.25, 0.375, 0.5] as const
export type Radius = typeof RADIUS_OPTIONS[number]

export interface AppearanceSettings {
  version: 1
  primary: PaletteColor
  secondary: PaletteColor
  neutral: NeutralColor
  radius: Radius
  layout: 'sidebar' | 'topnav'
  sidebarVariant: 'sidebar' | 'floating' | 'inset'
  sidebarCollapsible: 'icon' | 'offcanvas' | 'none'
  sidebarCollapsed: boolean
  navbarPosition: 'sticky' | 'static'
  navbarStyle: 'solid' | 'blur' | 'floating'
  contentWidth: 'full' | 'boxed'
  density: 'comfortable' | 'compact'
  numerals: 'latn' | 'arab'
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  version: 1,
  primary: 'brand',
  secondary: 'violet',
  neutral: 'slate',
  radius: 0.375,
  layout: 'sidebar',
  sidebarVariant: 'sidebar',
  sidebarCollapsible: 'icon',
  sidebarCollapsed: false,
  navbarPosition: 'sticky',
  navbarStyle: 'blur',
  contentWidth: 'full',
  density: 'comfortable',
  numerals: 'latn',
}

export type AppearancePresetName = 'default' | 'ocean' | 'forest' | 'sunset' | 'mono'

export const APPEARANCE_PRESETS: Record<AppearancePresetName, Pick<AppearanceSettings, 'primary' | 'secondary' | 'neutral'>> = {
  default: { primary: 'brand', secondary: 'violet', neutral: 'slate' },
  ocean: { primary: 'sky', secondary: 'teal', neutral: 'slate' },
  forest: { primary: 'emerald', secondary: 'lime', neutral: 'stone' },
  sunset: { primary: 'orange', secondary: 'rose', neutral: 'neutral' },
  mono: { primary: 'zinc', secondary: 'sky', neutral: 'zinc' },
}
