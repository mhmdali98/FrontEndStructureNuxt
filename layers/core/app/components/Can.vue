<script setup lang="ts">
import type { Permission } from '#layers/core/shared/types/permissions'

/**
 * Renders the default slot only when the user has the permission(s) or role.
 * `#fallback` renders otherwise. Forbidden markup is never rendered.
 */
const props = defineProps<{
  permission?: Permission
  any?: Permission[]
  all?: Permission[]
  role?: string
}>()

const { can, canAny, canAll, hasRole } = usePermissions()

const allowed = computed(() => {
  if (props.permission && !can(props.permission)) return false
  if (props.any && !canAny(props.any)) return false
  if (props.all && !canAll(props.all)) return false
  if (props.role && !hasRole(props.role)) return false
  return true
})
</script>

<template>
  <slot v-if="allowed" />
  <slot
    v-else
    name="fallback"
  />
</template>
