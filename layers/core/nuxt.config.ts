// Core layer: shared kernel. It must never reference a feature layer.
export default defineNuxtConfig({
  i18n: {
    locales: [
      { code: 'en', file: 'en.json' },
      { code: 'ar', file: 'ar.json' },
    ],
  },
})
