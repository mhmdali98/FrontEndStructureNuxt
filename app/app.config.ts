import { DEFAULT_APPEARANCE } from '#layers/core/shared/types/appearance'

export default defineAppConfig({
  ui: {
    colors: {
      primary: DEFAULT_APPEARANCE.primary,
      secondary: DEFAULT_APPEARANCE.secondary,
      neutral: DEFAULT_APPEARANCE.neutral,
    },
  },
  navigation: {},
  commands: {},
  userMenu: {},
})
