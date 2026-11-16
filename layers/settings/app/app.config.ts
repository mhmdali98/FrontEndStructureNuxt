export default defineAppConfig({
  navigation: {
    settings: {
      labelKey: 'settings.nav',
      icon: 'i-lucide-settings',
      to: '/settings/appearance',
      group: 'system',
      order: 10,
      shortcut: 'g-s',
    },
  },
  userMenu: {
    settings: { labelKey: 'settings.nav', icon: 'i-lucide-settings', to: '/settings/appearance', order: 30 },
  },
})
