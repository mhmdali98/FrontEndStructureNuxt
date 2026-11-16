<script setup lang="ts">
import type { UserStatus } from '#layers/users/shared/types/users'

const props = defineProps<{ status: UserStatus }>()
const { t } = useI18n()
const color = computed(() => ({ active: 'success', inactive: 'neutral', invited: 'info' } as const)[props.status])
</script>

<template>
  <UBadge
    :color="color"
    variant="subtle"
    size="sm"
    class="capitalize"
    :label="t(`users.status.${status}`)"
  />
</template>
