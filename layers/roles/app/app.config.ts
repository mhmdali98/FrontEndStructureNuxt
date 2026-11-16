export default defineAppConfig({
  navigation: {
    roles: {
      labelKey: 'roles.nav',
      icon: 'i-lucide-shield-check',
      to: '/roles',
      group: 'management',
      order: 20,
      shortcut: 'g-r',
    },
  },
  commands: {
    'roles-create': {
      labelKey: 'roles.actions.create',
      icon: 'i-lucide-shield-plus',
      to: '/roles?create=1',
      permission: 'roles.manage',
      order: 20,
    },
  },
})
