<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PermissionDef, Role } from '#layers/roles/shared/types/roles'
import { createRoleSchema, type RoleFormValues } from '../schemas/roles.schema'
import { useRolesMutations } from '../composables/useRolesQueries'

const props = defineProps<{ role?: Role | null, definitions: PermissionDef[] }>()
const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const notify = useNotify()
const { dir } = useAppDirection()
const schema = computed(() => createRoleSchema(t))
const { create, update } = useRolesMutations()
const form = useTemplateRef('form')
const { apply } = useApiFormErrors(form)
const state = reactive<RoleFormValues>({ name: '', label: '', permissions: [] })

watch([open, () => props.role], () => {
  if (!open.value) return
  Object.assign(state, props.role
    ? { name: props.role.name, label: props.role.label, permissions: [...props.role.permissions] }
    : { name: '', label: '', permissions: [] })
}, { immediate: true })

async function onSubmit(e: FormSubmitEvent<RoleFormValues>): Promise<void> {
  try {
    const saved = props.role
      ? await update.mutateAsync({ id: props.role.id, input: e.data })
      : await create.mutateAsync(e.data)
    notify.success(props.role ? 'roles.form.updated' : 'roles.form.created', { params: { name: saved.label } })
    open.value = false
  }
  catch (err) {
    apply(err)
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :side="dir === 'rtl' ? 'left' : 'right'"
    :title="role ? t('roles.form.editTitle') : t('roles.form.createTitle')"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <UForm
        id="roles-form"
        ref="form"
        :schema="schema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            name="label"
            :label="t('roles.fields.label')"
            required
          >
            <UInput
              v-model="state.label"
              class="w-full"
              autofocus
            />
          </UFormField>
          <UFormField
            name="name"
            :label="t('roles.fields.name')"
            :help="role?.system ? t('roles.form.systemName') : undefined"
            required
          >
            <UInput
              v-model="state.name"
              dir="ltr"
              class="w-full font-mono"
              :disabled="role?.system"
            />
          </UFormField>
        </div>
        <UFormField
          name="permissions"
          :label="t('roles.fields.permissions')"
        >
          <RolesPermissionMatrix
            v-model="state.permissions"
            :definitions="definitions"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :label="t('common.cancel')"
          @click="open = false"
        />
        <UButton
          type="submit"
          form="roles-form"
          :loading="create.isLoading.value || update.isLoading.value"
          :label="role ? t('common.save') : t('roles.actions.create')"
        />
      </div>
    </template>
  </USlideover>
</template>
