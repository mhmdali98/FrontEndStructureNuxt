<script setup lang="ts">
const emit = defineEmits<{ pick: [email: string, password: string] }>()
const { t } = useI18n()
const accounts = [
  { email: 'admin@demo.test', role: 'admin', icon: 'i-lucide-crown' },
  { email: 'manager@demo.test', role: 'manager', icon: 'i-lucide-briefcase' },
  { email: 'viewer@demo.test', role: 'viewer', icon: 'i-lucide-eye' },
  { email: 'noaccess@demo.test', role: 'noaccess', icon: 'i-lucide-ban' },
] as const
</script>

<template>
  <div class="rounded-(--ui-radius) border border-dashed border-default p-3">
    <p class="mb-2 text-xs font-medium text-muted">
      {{ t('auth.demo.title') }}
    </p>
    <div class="flex flex-wrap gap-1.5">
      <UButton
        v-for="a in accounts"
        :key="a.email"
        size="xs"
        color="neutral"
        variant="soft"
        :icon="a.icon"
        :label="t(`auth.demo.roles.${a.role}`)"
        :data-testid="`demo-${a.role}`"
        @click="emit('pick', a.email, 'Password123!')"
      />
    </div>
  </div>
</template>
