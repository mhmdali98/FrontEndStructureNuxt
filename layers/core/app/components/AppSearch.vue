<script setup lang="ts">
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'

const { searchOpen, customizerOpen } = useShell()
const { flat } = useNavigation()
const { commands } = useCommands()
const { t, locales } = useI18n()
const appearance = useAppearanceStore()
const colorMode = useColorMode()
const { logout } = useLogout()

const groups = computed<CommandPaletteGroup<CommandPaletteItem>[]>(() => [
  {
    id: 'pages',
    label: t('shell.pages'),
    items: flat.value.filter(i => i.to).map(i => ({ id: i.id, label: i.label, icon: i.icon, to: i.to, kbds: i.shortcut?.split('-') })),
  },
  {
    id: 'actions',
    label: t('shell.quickActions'),
    items: [
      ...commands.value.map(c => ({ id: c.id, label: c.label, icon: c.icon, to: c.to, kbds: c.shortcut?.split('-') })),
      {
        id: 'toggle-color-mode',
        label: t('shell.toggleColorMode'),
        icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
        onSelect: () => { colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark' },
      },
      ...locales.value.filter(l => l.code !== appearance.language).map(l => ({
        id: `locale-${l.code}`,
        label: `${t('shell.switchLanguage')}: ${l.name}`,
        icon: 'i-lucide-languages',
        onSelect: () => { appearance.language = l.code as 'en' | 'ar' },
      })),
      { id: 'customizer', label: t('shell.openCustomizer'), icon: 'i-lucide-palette', onSelect: () => { customizerOpen.value = true } },
      { id: 'logout', label: t('common.logout'), icon: 'i-lucide-log-out', onSelect: () => void logout() },
    ],
  },
])
</script>

<template>
  <UDashboardSearch
    v-model:open="searchOpen"
    :groups="groups"
    :color-mode="false"
    :placeholder="t('shell.searchPlaceholder')"
    shortcut="meta_k"
  />
</template>
