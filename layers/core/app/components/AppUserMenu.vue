<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const props = defineProps<{ collapsed?: boolean, compact?: boolean }>()

const auth = useAuthStore()
const appConfig = useAppConfig()
const appearance = useAppearanceStore()
const { t, locales } = useI18n()
const { logout } = useLogout()
const { customizerOpen, shortcutsOpen } = useShell()

const items = computed<DropdownMenuItem[][]>(() => {
  const registered = Object.values(appConfig.userMenu ?? {})
    .sort((a, b) => a.order - b.order)
    .map(i => ({ label: t(i.labelKey), icon: i.icon, to: i.to }))

  const prefs: DropdownMenuItem[] = [
    { label: t('shell.customize'), icon: 'i-lucide-palette', onSelect: () => { customizerOpen.value = true } },
    { label: t('shell.shortcuts'), icon: 'i-lucide-keyboard', onSelect: () => { shortcutsOpen.value = true } },
  ]
  if (props.compact) {
    prefs.push({
      label: t('shell.language'),
      icon: 'i-lucide-languages',
      children: locales.value.map(l => ({
        label: l.name ?? l.code,
        type: 'checkbox' as const,
        checked: appearance.language === l.code,
        onSelect: () => { appearance.language = l.code as 'en' | 'ar' },
      })),
    }, {
      label: t('shell.colorMode'),
      icon: 'i-lucide-sun-moon',
      children: (['light', 'dark', 'system'] as const).map(m => ({
        label: t(`shell.${m}`),
        type: 'checkbox' as const,
        checked: appearance.mode === m,
        onSelect: () => { appearance.mode = m },
      })),
    })
  }

  return [
    [{ type: 'label', label: auth.user?.name ?? '', avatar: { src: auth.user?.avatarUrl ?? undefined, alt: auth.user?.name } }],
    ...(registered.length ? [registered] : []),
    prefs,
    [{ label: t('common.logout'), icon: 'i-lucide-log-out', color: 'error' as const, onSelect: () => void logout() }],
  ]
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width) min-w-52', itemLeadingIcon: '' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      :square="collapsed || compact"
      :block="!compact"
      :aria-label="t('shell.userMenu')"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
      :trailing-icon="collapsed || compact ? undefined : 'i-lucide-chevrons-up-down'"
    >
      <UAvatar
        :src="auth.user?.avatarUrl ?? undefined"
        :alt="auth.user?.name"
        size="xs"
      />
      <span
        v-if="!collapsed && !compact"
        class="min-w-0 flex-1 truncate text-start"
      >{{ auth.user?.name }}</span>
    </UButton>
  </UDropdownMenu>
</template>
