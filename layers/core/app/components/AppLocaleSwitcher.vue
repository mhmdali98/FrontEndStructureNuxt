<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

/** Icon button that opens a language menu (names, not flags). */
const appearance = useAppearanceStore()
const { locales, t } = useI18n()

const items = computed<DropdownMenuItem[]>(() => locales.value.map(l => ({
  label: l.name ?? l.code,
  type: 'checkbox' as const,
  checked: appearance.language === l.code,
  onSelect: () => {
    appearance.language = l.code as 'en' | 'ar'
  },
})))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end' }"
  >
    <UTooltip :text="t('shell.language')">
      <UButton
        color="neutral"
        variant="ghost"
        square
        icon="i-lucide-languages"
        :aria-label="t('shell.switchLanguage')"
        data-testid="locale-switcher"
      />
    </UTooltip>
  </UDropdownMenu>
</template>
