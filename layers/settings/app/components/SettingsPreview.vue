<script setup lang="ts">
/** Miniature of the app shell that reflects the current appearance settings. */
const appearance = useAppearanceStore()
const s = computed(() => appearance.settings)
const { t } = useI18n()
</script>

<template>
  <div
    class="overflow-hidden rounded-(--ui-radius) border border-default bg-muted"
    role="img"
    :aria-label="t('appearance.preview')"
  >
    <div class="flex h-56 gap-1.5 p-1.5">
      <div
        v-if="s.layout === 'sidebar'"
        class="flex w-1/4 flex-col gap-1.5 p-2"
        :class="[
          s.sidebarVariant === 'floating' ? 'rounded-(--ui-radius) bg-default shadow ring ring-default' : '',
          s.sidebarVariant === 'sidebar' ? 'border-e border-default bg-default' : '',
          s.sidebarCollapsed && s.sidebarCollapsible === 'icon' ? 'w-8' : '',
        ]"
      >
        <span class="h-3 w-3 rounded-sm bg-primary" />
        <span class="h-2 rounded-full bg-primary/60" />
        <span class="h-2 rounded-full bg-accented" />
        <span class="h-2 rounded-full bg-accented" />
      </div>
      <div
        class="flex flex-1 flex-col overflow-hidden"
        :class="s.layout === 'sidebar' && s.sidebarVariant === 'inset' ? 'rounded-(--ui-radius) bg-default shadow-xs ring ring-default' : 'bg-default'"
      >
        <div
          class="flex h-6 items-center gap-1.5 px-2"
          :class="[
            s.navbarStyle === 'floating' ? 'm-1 rounded-(--ui-radius) ring ring-default' : 'border-b border-default',
            s.navbarStyle === 'blur' ? 'bg-default/70' : '',
          ]"
        >
          <span
            v-if="s.layout === 'topnav'"
            class="h-2.5 w-2.5 rounded-sm bg-primary"
          />
          <span
            v-if="s.layout === 'topnav'"
            class="h-1.5 w-8 rounded-full bg-accented"
          />
          <span class="ms-auto h-2.5 w-2.5 rounded-full bg-secondary" />
        </div>
        <div
          class="grid flex-1 grid-cols-3 gap-1.5 p-2"
          :class="s.contentWidth === 'boxed' ? 'mx-auto w-3/4' : ''"
        >
          <span class="rounded-(--ui-radius) bg-primary/15" />
          <span class="rounded-(--ui-radius) bg-secondary/15" />
          <span class="rounded-(--ui-radius) bg-elevated" />
          <span class="col-span-2 rounded-(--ui-radius) bg-elevated" />
          <span class="rounded-(--ui-radius) bg-elevated" />
        </div>
      </div>
    </div>
  </div>
</template>
