<script setup lang="ts">
const { t } = useI18n()
const config = useRuntimeConfig()
const bullets = [
  { icon: 'i-lucide-shield-check', key: 'secure' },
  { icon: 'i-lucide-languages', key: 'i18n' },
  { icon: 'i-lucide-palette', key: 'theming' },
] as const
</script>

<template>
  <div class="grid min-h-svh bg-default lg:grid-cols-2">
    <aside
      class="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
      style="background-image: linear-gradient(135deg, var(--ui-color-primary-600), var(--ui-color-secondary-600));"
    >
      <div
        class="pointer-events-none absolute -inset-e-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl"
        aria-hidden="true"
      />
      <div class="relative flex items-center gap-2.5 text-lg font-semibold">
        <span class="flex size-9 items-center justify-center rounded-lg bg-white/15 ring ring-white/25">
          <UIcon
            name="i-lucide-layout-dashboard"
            class="size-5"
          />
        </span>
        {{ config.public.appName }}
      </div>
      <div class="relative max-w-md">
        <h2 class="text-3xl font-semibold leading-tight">
          {{ t('shellAuth.headline') }}
        </h2>
        <p class="mt-3 text-white/80">
          {{ t('shellAuth.subhead') }}
        </p>
        <ul class="mt-8 space-y-4">
          <li
            v-for="b in bullets"
            :key="b.key"
            class="flex items-start gap-3"
          >
            <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-white/15">
              <UIcon
                :name="b.icon"
                class="size-4"
              />
            </span>
            <span class="text-sm text-white/90">{{ t(`shellAuth.bullets.${b.key}`) }}</span>
          </li>
        </ul>
      </div>
      <p class="relative text-xs text-white/70">
        © {{ new Date().getFullYear() }} {{ config.public.appName }}
      </p>
    </aside>
    <div class="relative flex flex-col">
      <div class="flex items-center justify-between gap-2 p-4">
        <AppLogo class="lg:invisible" />
        <div class="flex items-center gap-1">
          <AppLocaleSwitcher />
          <AppColorModeButton />
        </div>
      </div>
      <main
        id="main-content"
        class="flex flex-1 items-center justify-center px-4 pb-10"
      >
        <div class="w-full max-w-sm">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
