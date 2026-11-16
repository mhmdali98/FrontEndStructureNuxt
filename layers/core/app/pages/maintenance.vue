<script setup lang="ts">
definePageMeta({ layout: 'blank', public: true, titleKey: 'errors.pages.503.title' })
const { t } = useI18n()
const back = ref(false)

async function check(): Promise<void> {
  try {
    await $fetch('/api/health')
    back.value = true
    setTimeout(() => reloadNuxtApp({ path: '/', force: true }), 1200)
  }
  catch {
    // still in maintenance
  }
}

useIntervalFn(check, 30_000)
</script>

<template>
  <div class="flex max-w-md flex-col items-center text-center">
    <AppErrorView
      :status="503"
      embedded
      @home="check"
      @retry="check"
    />
    <p
      class="-mt-8 flex items-center gap-2 text-xs text-muted"
      role="status"
    >
      <UIcon
        :name="back ? 'i-lucide-circle-check' : 'i-lucide-loader-circle'"
        :class="back ? 'text-success' : 'animate-spin'"
        class="size-3.5"
      />
      {{ back ? t('errors.maintenance.back') : t('errors.maintenance.checking') }}
    </p>
  </div>
</template>
