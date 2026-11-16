<script setup lang="ts">
definePageMeta({ titleKey: 'settings.appearance.title' })
const { t } = useI18n()
</script>

<template>
  <div>
    <AppPageHeader
      :title="t('settings.title')"
      :description="t('settings.description')"
    />
    <SettingsTabs />
    <div class="grid gap-(--app-gap) xl:grid-cols-3">
      <UCard
        variant="outline"
        class="xl:col-span-2"
      >
        <template #header>
          <h2 class="text-base font-medium text-highlighted">
            {{ t('appearance.title') }}
          </h2>
          <p class="mt-0.5 text-sm text-muted">
            {{ t('appearance.description') }}
          </p>
        </template>
        <AppearanceForm />
      </UCard>
      <div class="xl:sticky xl:top-20 xl:self-start">
        <UCard variant="outline">
          <template #header>
            <h2 class="text-base font-medium text-highlighted">
              {{ t('appearance.preview') }}
            </h2>
          </template>
          <SettingsPreview />
        </UCard>
      </div>
    </div>
  </div>
</template>
