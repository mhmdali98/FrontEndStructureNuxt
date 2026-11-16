export default defineAppConfig({
  navigation: {
    users: {
      labelKey: 'users.nav',
      icon: 'i-lucide-users',
      to: '/users',
      group: 'management',
      order: 10,
      shortcut: 'g-u',
    },
  },
  commands: {
    'users-create': {
      labelKey: 'users.actions.create',
      icon: 'i-lucide-user-plus',
      to: '/users?create=1',
      permission: 'users.create',
      order: 10,
    },
  },
})
