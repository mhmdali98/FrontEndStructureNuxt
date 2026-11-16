export default defineAppConfig({
  navigation: {
    'dev-errors': {
      labelKey: 'nav.debug',
      icon: 'i-lucide-bug',
      to: '/dev/errors',
      group: 'system',
      order: 90,
      demoOnly: true,
    },
  },
})
