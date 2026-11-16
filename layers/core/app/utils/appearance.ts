import { z } from 'zod'
import {
  DEFAULT_APPEARANCE, NEUTRAL_COLORS, PALETTE_COLORS, RADIUS_OPTIONS,
  type AppearanceSettings,
} from '#layers/core/shared/types/appearance'

const d = DEFAULT_APPEARANCE

/** Each field falls back to its default independently, so one bad value never resets everything. */
export const appearanceSchema = z.object({
  version: z.literal(1).catch(1),
  primary: z.enum(PALETTE_COLORS).catch(d.primary),
  secondary: z.enum(PALETTE_COLORS).catch(d.secondary),
  neutral: z.enum(NEUTRAL_COLORS).catch(d.neutral),
  radius: z.number().refine(v => (RADIUS_OPTIONS as readonly number[]).includes(v)).catch(d.radius),
  layout: z.enum(['sidebar', 'topnav']).catch(d.layout),
  sidebarVariant: z.enum(['sidebar', 'floating', 'inset']).catch(d.sidebarVariant),
  sidebarCollapsible: z.enum(['icon', 'offcanvas', 'none']).catch(d.sidebarCollapsible),
  sidebarCollapsed: z.boolean().catch(d.sidebarCollapsed),
  navbarPosition: z.enum(['sticky', 'static']).catch(d.navbarPosition),
  navbarStyle: z.enum(['solid', 'blur', 'floating']).catch(d.navbarStyle),
  contentWidth: z.enum(['full', 'boxed']).catch(d.contentWidth),
  density: z.enum(['comfortable', 'compact']).catch(d.density),
  numerals: z.enum(['latn', 'arab']).catch(d.numerals),
})

/** Parses a cookie value (object or JSON string); anything invalid falls back to defaults. */
export function parseAppearance(raw: unknown): AppearanceSettings {
  let value: unknown = raw
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw)
    }
    catch {
      value = {}
    }
  }
  if (typeof value !== 'object' || value === null) value = {}
  return appearanceSchema.parse(value) as AppearanceSettings
}
