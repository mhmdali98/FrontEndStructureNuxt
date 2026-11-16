<script setup lang="ts">
const props = defineProps<{
  variant: 'sidebar' | 'floating' | 'inset'
  collapsible: 'icon' | 'offcanvas' | 'none'
}>()
const open = defineModel<boolean>('open', { required: true })

const { groups, groupLabels } = useNavigation()
const { searchOpen } = useShell()
const { t } = useI18n()
const collapsed = computed(() => !open.value && props.collapsible === 'icon')
</script>

<template>
  <USidebar
    v-model:open="open"
    :variant="variant"
    :collapsible="collapsible"
    side="left"
    :ui="{ container: variant === 'sidebar' ? 'bg-default' : '', inner: variant === 'inset' ? 'bg-transparent' : 'bg-default', header: 'justify-start' }"
  >
    <template #header>
      <NuxtLink
        to="/"
        class="flex min-w-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-primary"
      >
        <AppLogo :collapsed="collapsed" />
      </NuxtLink>
    </template>

    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-search"
      :square="collapsed"
      :block="!collapsed"
      :aria-label="t('shell.search')"
      class="justify-start text-muted"
      @click="searchOpen = true"
    >
      <template v-if="!collapsed">
        <span class="flex-1 text-start">{{ t('shell.search') }}</span>
        <UKbd value="meta" />
        <UKbd value="K" />
      </template>
    </UButton>

    <nav
      v-for="(group, index) in groups"
      :key="index"
      :aria-label="groupLabels[index]"
      class="flex flex-col gap-1"
    >
      <p
        v-if="!collapsed"
        class="px-2.5 pb-1 text-xs font-medium text-dimmed"
      >
        {{ groupLabels[index] }}
      </p>
      <UNavigationMenu
        :items="group"
        orientation="vertical"
        :collapsed="collapsed"
        tooltip
        popover
        :ui="{ linkTrailingIcon: 'rtl:rotate-180' }"
      />
    </nav>

    <template #footer>
      <AppUserMenu :collapsed="collapsed" />
    </template>
  </USidebar>
</template>
