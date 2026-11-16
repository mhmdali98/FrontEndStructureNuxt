<script setup lang="ts">
const head = useLocaleHead({ dir: true, lang: true, seo: false })
const { dir } = useAppDirection()
const route = useRoute()
const { t } = useI18n()
const config = useRuntimeConfig()

useHead(() => ({
  htmlAttrs: head.value.htmlAttrs,
  title: route.meta.titleKey ? `${t(route.meta.titleKey)} · ${config.public.appName}` : config.public.appName,
}))

const toaster = computed(() => ({ position: dir.value === 'rtl' ? 'bottom-left' as const : 'bottom-right' as const }))
</script>

<template>
  <UApp :toaster="toaster">
    <NuxtLoadingIndicator color="var(--ui-primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
