import {
  APPEARANCE_PRESETS, DEFAULT_APPEARANCE,
  type AppearancePresetName, type AppearanceSettings,
} from '#layers/core/shared/types/appearance'
import { parseAppearance } from '../utils/appearance'

export type ColorModePreference = 'light' | 'dark' | 'system'

/**
 * Appearance settings persisted in the `app-appearance` cookie. Color mode and language
 * keep their own cookies (color-mode / i18n) but are exposed here as one facade.
 */
export const useAppearanceStore = defineStore('core-appearance', () => {
  const cookie = useCookie<unknown>('app-appearance', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    default: () => ({ ...DEFAULT_APPEARANCE }),
  })
  const settings = ref<AppearanceSettings>(parseAppearance(cookie.value))

  const colorMode = useColorMode()
  const { locale, setLocale } = useNuxtApp().$i18n

  watch(settings, (value) => {
    cookie.value = { ...value }
  }, { deep: true })

  const mode = computed<ColorModePreference>({
    get: () => (colorMode.preference as ColorModePreference) ?? 'system',
    set: (v) => {
      colorMode.preference = v
    },
  })

  const language = computed<'en' | 'ar'>({
    get: () => locale.value as 'en' | 'ar',
    set: (v) => {
      void setLocale(v)
    },
  })

  function update(partial: Partial<AppearanceSettings>): void {
    settings.value = parseAppearance({ ...settings.value, ...partial })
  }

  function applyPreset(name: AppearancePresetName): void {
    update(APPEARANCE_PRESETS[name])
  }

  /** Restores every default including color mode, but keeps the language. */
  function reset(): void {
    settings.value = { ...DEFAULT_APPEARANCE }
    colorMode.preference = 'system'
  }

  function $reset(): void {
    reset()
  }

  return { settings, mode, language, update, applyPreset, reset, $reset }
})
