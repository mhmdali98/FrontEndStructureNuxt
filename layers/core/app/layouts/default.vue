<script setup lang="ts">
const appearance = useAppearanceStore()
const s = computed(() => appearance.settings)
const { t } = useI18n()
const router = useRouter()
const { shortcuts } = useRegistryShortcuts()

const MOBILE_QUERY = '(max-width: 63.99rem)'
const isMobile = useMediaQuery(MOBILE_QUERY)
const mobileOpen = ref(false)

/**
 * Desktop: USidebar is bound to the persisted state and its own writes are ignored
 * (it writes `open` on breakpoint changes, which must never be persisted). Below `lg`
 * USidebar is hidden and `AppMobileNav` (in-memory state) is used instead.
 */
const sidebarOpen = computed<boolean>({
  get: () => !s.value.sidebarCollapsed,
  set: () => undefined,
})

function toggleSidebar(): void {
  if (window.matchMedia(MOBILE_QUERY).matches) mobileOpen.value = !mobileOpen.value
  else appearance.update({ sidebarCollapsed: !s.value.sidebarCollapsed })
}

const collapsible = computed(() => isMobile.value ? 'offcanvas' as const : s.value.sidebarCollapsible)

/**
 * Forms validate on input (eagerly) instead of blur: a blur-triggered message appearing or
 * disappearing shifts the layout under the pointer and swallows the submit click.
 */
const FORM_DEFAULTS = {
  form: { validateOn: ['input', 'change'] as ('input' | 'change')[], validateOnInputDelay: 0 },
  formField: { eagerValidation: true },
}

const themeProps = computed(() => s.value.density === 'compact'
  ? { ...FORM_DEFAULTS, button: { size: 'sm' as const }, input: { size: 'sm' as const }, select: { size: 'sm' as const }, selectMenu: { size: 'sm' as const } }
  : FORM_DEFAULTS)

const shortcutMap = computed(() => Object.fromEntries(shortcuts.value.map(sc => [sc.keys, () => router.push(sc.to)])))
defineShortcuts(shortcutMap)

const route = useRoute()
watch(() => route.fullPath, () => {
  mobileOpen.value = false
})
</script>

<template>
  <UTheme :props="themeProps">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:inset-s-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-default focus:px-3 focus:py-2 focus:ring focus:ring-primary"
    >{{ t('shell.skipToContent') }}</a>
    <div
      class="flex min-h-svh"
      :class="s.layout === 'sidebar' && s.sidebarVariant !== 'sidebar' ? 'bg-muted' : 'bg-default'"
    >
      <AppSidebar
        v-if="s.layout === 'sidebar'"
        v-model:open="sidebarOpen"
        :variant="s.sidebarVariant"
        :collapsible="collapsible"
      />
      <div
        class="flex min-w-0 flex-1 flex-col"
        :class="s.layout === 'sidebar' && s.sidebarVariant === 'inset' ? 'lg:my-3 lg:me-3 lg:overflow-clip lg:rounded-xl lg:bg-default lg:shadow-xs lg:ring lg:ring-default' : ''"
      >
        <AppNavbar
          :layout="s.layout"
          :position="s.navbarPosition"
          :navbar-style="s.navbarStyle"
          :sidebar-open="isMobile ? mobileOpen : sidebarOpen"
          :can-toggle="isMobile || s.sidebarCollapsible !== 'none'"
          @toggle-sidebar="toggleSidebar"
          @open-mobile-menu="mobileOpen = true"
        />
        <AppOfflineBanner />
        <main
          id="main-content"
          tabindex="-1"
          class="w-full flex-1 p-4 outline-none sm:p-6"
          :class="s.contentWidth === 'boxed' ? 'mx-auto max-w-(--ui-container)' : ''"
        >
          <slot />
        </main>
      </div>
    </div>

    <AppMobileNav v-model:open="mobileOpen" />
    <AppSearch />
    <AppCustomizer />
    <AppShortcutsModal />
  </UTheme>
</template>
