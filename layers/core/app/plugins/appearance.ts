/**
 * Applies appearance settings before the first render and keeps them in sync:
 * Nuxt UI colors (regenerated as CSS variables), `--ui-radius`, and `<html>` data attributes.
 */
export default defineNuxtPlugin({
  name: 'core-appearance',
  dependsOn: ['pinia', 'i18n:plugin'],
  setup() {
    const store = useAppearanceStore()
    const appConfig = useAppConfig()

    watchEffect(() => {
      const s = store.settings
      appConfig.ui.colors.primary = s.primary
      appConfig.ui.colors.secondary = s.secondary
      appConfig.ui.colors.neutral = s.neutral
    })

    useHead(() => ({
      htmlAttrs: {
        'data-layout': store.settings.layout,
        'data-density': store.settings.density,
        'data-navbar': store.settings.navbarStyle,
        'data-content-width': store.settings.contentWidth,
      },
      style: [{ key: 'app-radius', innerHTML: `:root{--ui-radius:${store.settings.radius}rem}` }],
    }))
  },
})
