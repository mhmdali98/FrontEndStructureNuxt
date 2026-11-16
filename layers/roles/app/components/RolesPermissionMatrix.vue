<script setup lang="ts">
import type { PermissionDef } from '#layers/roles/shared/types/roles'
import { groupPermissions, roleGrants } from '../schemas/roles.schema'

const props = defineProps<{ definitions: PermissionDef[], readonly?: boolean }>()
const model = defineModel<string[]>({ required: true })
const { t } = useI18n()

const groups = computed(() => groupPermissions(props.definitions))
const has = (key: string) => roleGrants(model.value, key)

function toggle(key: string, on: boolean): void {
  if (props.readonly) return
  const set = new Set(model.value.filter(p => p !== '*'))
  if (on) set.add(key)
  else set.delete(key)
  model.value = [...set]
}

function groupState(items: PermissionDef[]): boolean | 'indeterminate' {
  const n = items.filter(i => has(i.key)).length
  return n === 0 ? false : n === items.length ? true : 'indeterminate'
}

function toggleGroup(items: PermissionDef[], on: boolean): void {
  if (props.readonly) return
  const set = new Set(model.value.filter(p => p !== '*'))
  for (const i of items) {
    if (on) set.add(i.key)
    else set.delete(i.key)
  }
  model.value = [...set]
}
</script>

<template>
  <div class="divide-y divide-default rounded-(--ui-radius) border border-default">
    <fieldset
      v-for="g in groups"
      :key="g.group"
      class="p-3"
    >
      <legend class="sr-only">
        {{ t(`roles.groups.${g.group}`) }}
      </legend>
      <div class="mb-2 flex items-center justify-between gap-2">
        <span class="text-sm font-medium text-highlighted">{{ t(`roles.groups.${g.group}`) }}</span>
        <UCheckbox
          v-if="!readonly"
          :model-value="groupState(g.items)"
          :label="t('roles.form.selectAll')"
          :ui="{ label: 'text-xs text-muted' }"
          @update:model-value="(v: boolean | 'indeterminate') => toggleGroup(g.items, v === true)"
        />
      </div>
      <div class="grid gap-2 sm:grid-cols-2">
        <UCheckbox
          v-for="p in g.items"
          :key="p.key"
          :model-value="has(p.key)"
          :disabled="readonly"
          :label="t(`roles.perm.${p.key}`)"
          :description="p.key"
          :ui="{ description: 'font-mono text-xs' }"
          @update:model-value="(v: boolean | 'indeterminate') => toggle(p.key, v === true)"
        />
      </div>
    </fieldset>
  </div>
</template>
