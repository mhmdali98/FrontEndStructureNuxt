<script setup lang="ts">
/** Slide-over navigation used below `lg` for both layouts. */
const open = defineModel<boolean>('open', { required: true })
const { groups, groupLabels } = useNavigation()
const { searchOpen } = useShell()
const { dir } = useAppDirection()
const { t } = useI18n()
</script>

<template>
  <USlideover
    v-model:open="open"
    :side="dir === 'rtl' ? 'right' : 'left'"
    :title="t('shell.openMenu')"
    :ui="{ content: 'max-w-xs', header: 'sr-only', body: 'flex flex-col gap-4 p-4' }"
  >
    <template #body>
      <NuxtLink
        to="/"
        class="flex items-center"
      >
        <AppLogo />
      </NuxtLink>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-search"
        block
        class="justify-start text-muted"
        :label="t('shell.search')"
        @click="() => { open = false; searchOpen = true }"
      />
      <nav
        v-for="(group, index) in groups"
        :key="index"
        :aria-label="groupLabels[index]"
        class="flex flex-col gap-1"
      >
        <p class="px-2.5 pb-1 text-xs font-medium text-dimmed">
          {{ groupLabels[index] }}
        </p>
        <UNavigationMenu
          :items="group"
          orientation="vertical"
        />
      </nav>
    </template>
  </USlideover>
</template>
