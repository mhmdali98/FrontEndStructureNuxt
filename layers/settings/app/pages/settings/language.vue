<script setup lang="ts">
definePageMeta({ titleKey: 'settings.language.title' })

const { t, locales } = useI18n()
const appearance = useAppearanceStore()
const fmt = useFormat()
const { dir } = useAppDirection()
const sample = new Date('2026-11-16T14:30:00Z')

const numerals = computed({
  get: () => appearance.settings.numerals,
  set: v => appearance.update({ numerals: v }),
})
</script>

<template>
  <div>
    <AppPageHeader
      :title="t('settings.title')"
      :description="t('settings.description')"
    />
    <SettingsTabs />
    <div class="grid gap-(--app-gap) lg:grid-cols-2">
      <UCard variant="outline">
        <template #header>
          <h2 class="text-base font-medium text-highlighted">
            {{ t('settings.language.title') }}
          </h2>
          <p class="mt-0.5 text-sm text-muted">
            {{ t('settings.language.description') }}
          </p>
        </template>
        <div class="flex flex-col gap-5">
          <div class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="l in locales"
              :key="l.code"
              type="button"
              class="flex items-center gap-3 rounded-(--ui-radius) border p-3 text-start transition focus-visible:outline-2 focus-visible:outline-primary"
              :class="appearance.language === l.code ? 'border-primary bg-primary/5' : 'border-default hover:border-accented'"
              :aria-pressed="appearance.language === l.code"
              :data-testid="`language-${l.code}`"
              @click="appearance.language = l.code as 'en' | 'ar'"
            >
              <span class="flex size-9 items-center justify-center rounded-md bg-elevated text-sm font-semibold">{{ l.code.toUpperCase() }}</span>
              <span>
                <span class="block text-sm font-medium text-highlighted">{{ l.name }}</span>
                <span class="block text-xs text-muted">{{ l.dir === 'rtl' ? t('settings.language.rtl') : t('settings.language.ltr') }}</span>
              </span>
              <UIcon
                v-if="appearance.language === l.code"
                name="i-lucide-circle-check"
                class="ms-auto size-5 text-primary"
              />
            </button>
          </div>
          <UFormField :label="t('appearance.numerals')">
            <AppOptionGroup
              v-model="numerals"
              :label="t('appearance.numerals')"
              :options="[
                { value: 'latn', label: t('appearance.numeralOptions.latn') },
                { value: 'arab', label: t('appearance.numeralOptions.arab') },
              ]"
            />
          </UFormField>
        </div>
      </UCard>
      <UCard variant="outline">
        <template #header>
          <h2 class="text-base font-medium text-highlighted">
            {{ t('settings.language.preview') }}
          </h2>
        </template>
        <dl class="divide-y divide-default text-sm">
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-muted">
              {{ t('settings.language.direction') }}
            </dt>
            <dd class="font-medium text-highlighted">
              {{ dir.toUpperCase() }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-muted">
              {{ t('settings.language.number') }}
            </dt>
            <dd class="tabular-nums">
              {{ fmt.number(1234567.89) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-muted">
              {{ t('settings.language.currency') }}
            </dt>
            <dd class="tabular-nums">
              {{ fmt.currency(98450) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-muted">
              {{ t('settings.language.percent') }}
            </dt>
            <dd class="tabular-nums">
              {{ fmt.percent(0.4231) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 py-2.5">
            <dt class="text-muted">
              {{ t('settings.language.date') }}
            </dt>
            <dd class="tabular-nums">
              {{ fmt.datetime(sample) }}
            </dd>
          </div>
        </dl>
      </UCard>
    </div>
  </div>
</template>
