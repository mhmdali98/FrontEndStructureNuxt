<script setup lang="ts">
const props = defineProps<{
  layout: 'sidebar' | 'topnav'
  position: 'sticky' | 'static'
  navbarStyle: 'solid' | 'blur' | 'floating'
  sidebarOpen: boolean
  canToggle: boolean
}>()
const emit = defineEmits<{ toggleSidebar: [], openMobileMenu: [] }>()

const route = useRoute()
const { t } = useI18n()
const { searchOpen, customizerOpen } = useShell()

const title = computed(() => route.meta.titleKey ? t(route.meta.titleKey) : '')

const classes = computed(() => [
  props.position === 'sticky' ? 'sticky top-0 z-30' : 'relative z-30',
  props.navbarStyle === 'blur' && 'border-b border-default bg-default/75 backdrop-blur',
  props.navbarStyle === 'solid' && 'border-b border-default bg-default',
  props.navbarStyle === 'floating' && 'mx-2 mt-2 rounded-(--ui-radius) border border-default bg-default/90 shadow-sm backdrop-blur sm:mx-4',
])
</script>

<template>
  <header
    :class="classes"
    class="flex h-(--ui-header-height) shrink-0 items-center gap-2 px-3 sm:px-4"
  >
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <UButton
        v-if="layout === 'sidebar' && canToggle"
        color="neutral"
        variant="ghost"
        square
        :icon="sidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
        :aria-label="t('shell.toggleSidebar')"
        :aria-expanded="sidebarOpen"
        :ui="{ leadingIcon: 'rtl:rotate-180' }"
        @click="emit('toggleSidebar')"
      />
      <template v-else>
        <UButton
          color="neutral"
          variant="ghost"
          square
          icon="i-lucide-menu"
          class="lg:hidden"
          :aria-label="t('shell.openMenu')"
          @click="emit('openMobileMenu')"
        />
        <NuxtLink
          to="/"
          class="me-2 hidden shrink-0 sm:flex"
        >
          <AppLogo />
        </NuxtLink>
        <AppTopNav />
      </template>
      <p
        v-if="layout === 'sidebar' && title"
        class="truncate text-sm font-medium text-highlighted"
      >
        {{ title }}
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-1">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-search"
        :aria-label="t('shell.search')"
        class="sm:hidden"
        square
        @click="searchOpen = true"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-search"
        class="hidden text-muted sm:inline-flex"
        :aria-label="t('shell.search')"
        @click="searchOpen = true"
      >
        <span class="hidden w-28 text-start lg:inline">{{ t('shell.search') }}</span>
        <UKbd value="meta" />
        <UKbd value="K" />
      </UButton>
      <UTooltip :text="t('shell.customize')">
        <UButton
          color="neutral"
          variant="ghost"
          square
          icon="i-lucide-palette"
          class="hidden sm:inline-flex"
          :aria-label="t('shell.openCustomizer')"
          @click="customizerOpen = true"
        />
      </UTooltip>
      <div class="hidden sm:block">
        <AppLocaleSwitcher />
      </div>
      <AppColorModeButton class="hidden sm:inline-flex" />
      <AppUserMenu
        compact
        class="sm:hidden"
      />
      <div class="hidden sm:block">
        <AppUserMenu
          v-if="layout === 'topnav'"
          compact
        />
      </div>
    </div>
  </header>
</template>
