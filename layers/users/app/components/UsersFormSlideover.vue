<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { USER_STATUSES, type User, type UserInput } from '#layers/users/shared/types/users'
import { createUserSchema, type UserFormValues } from '../schemas/users.schema'
import { useUsersMutations, useUsersRoleOptions } from '../composables/useUsersQueries'

const props = defineProps<{ user?: User | null }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ saved: [user: User] }>()

const { t } = useI18n()
const notify = useNotify()
const { dir } = useAppDirection()
const mode = computed(() => props.user ? 'edit' as const : 'create' as const)
const schema = computed(() => createUserSchema(t, mode.value))
const { data: roleOptions } = useUsersRoleOptions()
const { create, update } = useUsersMutations()
const form = useTemplateRef('form')
const { apply } = useApiFormErrors(form)

const blank = (): UserFormValues => ({ name: '', email: '', phone: '', roleIds: [], status: 'active', password: '' })
const state = reactive<UserFormValues>(blank())

watch([open, () => props.user], () => {
  if (!open.value) return
  Object.assign(state, props.user
    ? { name: props.user.name, email: props.user.email, phone: props.user.phone ?? '', roleIds: props.user.roles.map(r => r.id), status: props.user.status, password: '' }
    : blank())
}, { immediate: true })

const saving = computed(() => create.isLoading.value || update.isLoading.value)

async function onSubmit(event: FormSubmitEvent<UserFormValues>): Promise<void> {
  const v = event.data
  const input: UserInput = { name: v.name, email: v.email, phone: v.phone || null, roleIds: v.roleIds, status: v.status as UserInput['status'] }
  try {
    const saved = props.user
      ? await update.mutateAsync({ id: props.user.id, input })
      : await create.mutateAsync({ ...input, password: v.password })
    notify.success(props.user ? 'users.form.updated' : 'users.form.created', { params: { name: saved.name } })
    emit('saved', saved)
    open.value = false
  }
  catch (e) {
    apply(e)
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :side="dir === 'rtl' ? 'left' : 'right'"
    :title="mode === 'edit' ? t('users.form.editTitle') : t('users.form.createTitle')"
    :description="mode === 'edit' ? props.user?.email : t('users.form.createDescription')"
  >
    <template #body>
      <UForm
        id="users-form"
        ref="form"
        :schema="schema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <UFormField
          name="name"
          :label="t('users.fields.name')"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
            autocomplete="name"
            autofocus
          />
        </UFormField>
        <UFormField
          name="email"
          :label="t('users.fields.email')"
          required
        >
          <UInput
            v-model="state.email"
            type="email"
            class="w-full"
            autocomplete="email"
          />
        </UFormField>
        <UFormField
          name="phone"
          :label="t('users.fields.phone')"
          :hint="t('common.optional')"
        >
          <UInput
            v-model="state.phone"
            type="tel"
            dir="ltr"
            class="w-full"
            autocomplete="tel"
          />
        </UFormField>
        <UFormField
          name="roleIds"
          :label="t('users.fields.roles')"
          required
        >
          <USelectMenu
            v-model="state.roleIds"
            :items="(roleOptions ?? []).map(r => ({ label: r.label, value: r.id }))"
            value-key="value"
            multiple
            class="w-full"
          />
        </UFormField>
        <UFormField
          name="status"
          :label="t('users.fields.status')"
          required
        >
          <USelect
            v-model="state.status"
            :items="USER_STATUSES.map(s => ({ label: t(`users.status.${s}`), value: s }))"
            class="w-full"
          />
        </UFormField>
        <UFormField
          v-if="mode === 'create'"
          name="password"
          :label="t('users.fields.password')"
          required
        >
          <UInput
            v-model="state.password"
            type="password"
            class="w-full"
            autocomplete="new-password"
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
          form="users-form"
          :loading="saving"
          :label="mode === 'edit' ? t('common.save') : t('users.actions.create')"
        />
      </div>
    </template>
  </USlideover>
</template>
