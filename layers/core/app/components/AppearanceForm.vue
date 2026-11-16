<script setup lang="ts">
import {
  APPEARANCE_PRESETS, NEUTRAL_COLORS, PALETTE_COLORS, RADIUS_OPTIONS,
  type AppearancePresetName, type AppearanceSettings,
} from '#layers/core/shared/types/appearance'

defineProps<{ compact?: boolean }>()

const store = useAppearanceStore()
const notify = useNotify()
const { t } = useI18n()

/** Two-way binding for one settings field. */
function field<K extends keyof AppearanceSettings>(key: K) {
  return computed<AppearanceSettings[K]>({
    get: () => store.settings[key],
    set: v => store.update({ [key]: v } as Partial<AppearanceSettings>),
  })
}

const primary = field('primary')
const secondary = field('secondary')
const neutral = field('neutral')
const radius = field('radius')
const layout = field('layout')
const sidebarVariant = field('sidebarVariant')
const sidebarCollapsible = field('sidebarCollapsible')
const navbarPosition = field('navbarPosition')
const navbarStyle = field('navbarStyle')
const contentWidth = field('contentWidth')
const density = field('density')
const numerals = field('numerals')
const mode = computed({
  get: () => store.mode,
  set: (v) => {
    store.mode = v
  },
})

const opts = <T extends string>(prefix: string, values: readonly T[], icons?: Partial<Record<T, string>>) =>
  values.map(v => ({ value: v, label: t(`${prefix}.${v}`), icon: icons?.[v] }))

const presets = Object.keys(APPEARANCE_PRESETS) as AppearancePresetName[]

const isPresetActive = (name: AppearancePresetName) => {
  const p = APPEARANCE_PRESETS[name]
  return p.primary === store.settings.primary && p.secondary === store.settings.secondary && p.neutral === store.settings.neutral
}

function reset(): void {
  store.reset()
  notify.success('appearance.resetDone', { id: 'appearance-reset' })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <section class="flex flex-col gap-2">
      <h3 class="text-sm font-medium text-highlighted">
        {{ t('appearance.presets') }}
      </h3>
      <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
        <button
          v-for="p in presets"
          :key="p"
          type="button"
          class="flex flex-col items-center gap-1.5 rounded-(--ui-radius) border p-2 text-xs transition focus-visible:outline-2 focus-visible:outline-primary"
          :class="isPresetActive(p) ? 'border-primary bg-primary/5 text-highlighted' : 'border-default text-muted hover:border-accented'"
          :aria-pressed="isPresetActive(p)"
          @click="store.applyPreset(p)"
        >
          <span class="flex -space-x-1.5 rtl:space-x-reverse">
            <span
              class="size-5 rounded-full ring-2 ring-(--ui-bg)"
              :style="{ backgroundColor: `var(--color-${APPEARANCE_PRESETS[p].primary}-500)` }"
            />
            <span
              class="size-5 rounded-full ring-2 ring-(--ui-bg)"
              :style="{ backgroundColor: `var(--color-${APPEARANCE_PRESETS[p].secondary}-500)` }"
            />
          </span>
          {{ t(`appearance.presetNames.${p}`) }}
        </button>
      </div>
    </section>

    <UFormField :label="t('appearance.primary')">
      <AppColorSwatches
        v-model="primary"
        :colors="PALETTE_COLORS"
        :label="t('appearance.primary')"
      />
    </UFormField>
    <UFormField :label="t('appearance.secondary')">
      <AppColorSwatches
        v-model="secondary"
        :colors="PALETTE_COLORS"
        :label="t('appearance.secondary')"
      />
    </UFormField>
    <UFormField :label="t('appearance.neutral')">
      <AppColorSwatches
        v-model="neutral"
        :colors="NEUTRAL_COLORS"
        :label="t('appearance.neutral')"
      />
    </UFormField>

    <div
      class="grid gap-5"
      :class="compact ? '' : 'md:grid-cols-2'"
    >
      <UFormField :label="t('appearance.colorMode')">
        <AppOptionGroup
          v-model="mode"
          :label="t('appearance.colorMode')"
          :options="[
            { value: 'light', label: t('shell.light'), icon: 'i-lucide-sun' },
            { value: 'dark', label: t('shell.dark'), icon: 'i-lucide-moon' },
            { value: 'system', label: t('shell.system'), icon: 'i-lucide-monitor' },
          ]"
        />
      </UFormField>
      <UFormField :label="t('appearance.radius')">
        <AppOptionGroup
          v-model="radius"
          :label="t('appearance.radius')"
          :options="RADIUS_OPTIONS.map(r => ({ value: r, label: String(r) }))"
        />
      </UFormField>
      <UFormField :label="t('appearance.layout')">
        <AppOptionGroup
          v-model="layout"
          :label="t('appearance.layout')"
          :options="opts('appearance.layouts', ['sidebar', 'topnav'] as const, { sidebar: 'i-lucide-panel-left', topnav: 'i-lucide-panel-top' })"
        />
      </UFormField>
      <UFormField :label="t('appearance.contentWidth')">
        <AppOptionGroup
          v-model="contentWidth"
          :label="t('appearance.contentWidth')"
          :options="opts('appearance.contentWidths', ['full', 'boxed'] as const, { full: 'i-lucide-move-horizontal', boxed: 'i-lucide-square' })"
        />
      </UFormField>
      <template v-if="layout === 'sidebar'">
        <UFormField :label="t('appearance.sidebarVariant')">
          <AppOptionGroup
            v-model="sidebarVariant"
            :label="t('appearance.sidebarVariant')"
            :options="opts('appearance.sidebarVariants', ['sidebar', 'floating', 'inset'] as const)"
          />
        </UFormField>
        <UFormField
          :label="t('appearance.sidebarCollapsible')"
          :help="t('appearance.sidebarMobileHint')"
        >
          <AppOptionGroup
            v-model="sidebarCollapsible"
            :label="t('appearance.sidebarCollapsible')"
            :options="opts('appearance.sidebarCollapsibles', ['icon', 'offcanvas', 'none'] as const)"
          />
        </UFormField>
      </template>
      <UFormField :label="t('appearance.navbarStyle')">
        <AppOptionGroup
          v-model="navbarStyle"
          :label="t('appearance.navbarStyle')"
          :options="opts('appearance.navbarStyles', ['solid', 'blur', 'floating'] as const)"
        />
      </UFormField>
      <UFormField :label="t('appearance.navbarPosition')">
        <AppOptionGroup
          v-model="navbarPosition"
          :label="t('appearance.navbarPosition')"
          :options="opts('appearance.navbarPositions', ['sticky', 'static'] as const)"
        />
      </UFormField>
      <UFormField :label="t('appearance.density')">
        <AppOptionGroup
          v-model="density"
          :label="t('appearance.density')"
          :options="opts('appearance.densities', ['comfortable', 'compact'] as const)"
        />
      </UFormField>
      <UFormField :label="t('appearance.numerals')">
        <AppOptionGroup
          v-model="numerals"
          :label="t('appearance.numerals')"
          :options="opts('appearance.numeralOptions', ['latn', 'arab'] as const)"
        />
      </UFormField>
    </div>

    <div>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-rotate-ccw"
        :label="t('appearance.reset')"
        @click="reset"
      />
    </div>
  </div>
</template>
