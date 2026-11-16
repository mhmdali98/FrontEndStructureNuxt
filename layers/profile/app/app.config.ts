export default defineAppConfig({
  userMenu: {
    profile: { labelKey: 'profile.nav', icon: 'i-lucide-user', to: '/profile', order: 10 },
    security: { labelKey: 'profile.security.nav', icon: 'i-lucide-key-round', to: '/profile/security', order: 20 },
  },
})
