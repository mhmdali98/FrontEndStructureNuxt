<script setup lang="ts">
defineProps<{ block?: boolean }>()
const appearance = useAppearanceStore()
const { locales, t } = useI18n()
const items = computed(() => locales.value.map(l => ({ label: l.name ?? l.code, value: l.code })))
</script>

<template>
  <USelect
    :model-value="appearance.language"
    :items="items"
    icon="i-lucide-languages"
    :aria-label="t('shell.language')"
    :class="block ? 'w-full' : 'w-36'"
    @update:model-value="(v) => appearance.language = v as 'en' | 'ar'"
  />
</template>
