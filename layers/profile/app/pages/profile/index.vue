<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { createProfileApi } from '../../api/profile.api'
import { AVATAR_MAX_BYTES, createProfileSchema } from '../../schemas/profile.schema'

definePageMeta({ titleKey: 'profile.title' })

const { t, locales } = useI18n()
const auth = useAuthStore()
const notify = useNotify()
const appearance = useAppearanceStore()
const api = createProfileApi(useApiClient())
const form = useTemplateRef('form')
const { apply } = useApiFormErrors(form)

const schema = computed(() => createProfileSchema(t))
type Schema = z.output<ReturnType<typeof createProfileSchema>>
const state = reactive<Schema>({ name: '', phone: '', locale: 'en' })
watch(() => auth.user, (u) => {
  if (u) Object.assign(state, { name: u.name, phone: u.phone ?? '', locale: u.locale })
}, { immediate: true })

const save = useMutation({ mutation: (input: Schema) => api.update({ ...input, phone: input.phone || null }) })
async function onSubmit(e: FormSubmitEvent<Schema>): Promise<void> {
  try {
    const user = await save.mutateAsync(e.data)
    auth.setUser(user)
    if (user.locale !== appearance.language) appearance.language = user.locale
    notify.success('profile.general.saved')
  }
  catch (err) {
    apply(err)
  }
}

const preview = ref<string | null>(null)
const fileInput = useTemplateRef('fileInput')
const upload = useMutation({ mutation: (file: File) => api.uploadAvatar(file) })
async function onFile(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/') || file.size > AVATAR_MAX_BYTES) {
    notify.error('profile.avatar.invalid')
    return
  }
  preview.value = URL.createObjectURL(file)
  try {
    const { avatarUrl } = await upload.mutateAsync(file)
    auth.setUser({ avatarUrl })
    notify.success('profile.avatar.saved')
  }
  catch {
    preview.value = null
  }
  finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}
onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})
</script>

<template>
  <div>
    <AppPageHeader
      :title="t('profile.title')"
      :description="t('profile.description')"
    />
    <ProfileTabs />
    <div class="grid gap-(--app-gap) lg:grid-cols-3">
      <UCard variant="outline">
        <div class="flex flex-col items-center gap-4 py-2 text-center">
          <UAvatar
            :src="preview ?? auth.user?.avatarUrl ?? undefined"
            :alt="auth.user?.name"
            size="3xl"
          />
          <div>
            <p class="font-medium text-highlighted">
              {{ auth.user?.name }}
            </p>
            <p class="text-sm text-muted">
              {{ auth.user?.email }}
            </p>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="sr-only"
            data-testid="avatar-input"
            @change="onFile"
          >
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-upload"
            :loading="upload.isLoading.value"
            :label="t('profile.avatar.upload')"
            @click="fileInput?.click()"
          />
          <p class="text-xs text-muted">
            {{ t('profile.avatar.hint') }}
          </p>
        </div>
      </UCard>
      <UCard
        variant="outline"
        class="lg:col-span-2"
      >
        <template #header>
          <h2 class="text-base font-medium text-highlighted">
            {{ t('profile.general.title') }}
          </h2>
        </template>
        <UForm
          ref="form"
          :schema="schema"
          :state="state"
          class="grid gap-4 sm:grid-cols-2"
          @submit="onSubmit"
        >
          <UFormField
            name="name"
            :label="t('profile.fields.name')"
            required
          >
            <UInput
              v-model="state.name"
              class="w-full"
              autocomplete="name"
            />
          </UFormField>
          <UFormField
            name="email"
            :label="t('profile.fields.email')"
            :help="t('profile.fields.emailHelp')"
          >
            <UInput
              :model-value="auth.user?.email"
              class="w-full"
              disabled
            />
          </UFormField>
          <UFormField
            name="phone"
            :label="t('profile.fields.phone')"
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
            name="locale"
            :label="t('profile.fields.locale')"
          >
            <USelect
              v-model="state.locale"
              :items="locales.map(l => ({ label: l.name ?? l.code, value: l.code }))"
              class="w-full"
            />
          </UFormField>
          <div class="sm:col-span-2">
            <UButton
              type="submit"
              :loading="save.isLoading.value"
              :label="t('common.save')"
              data-testid="profile-save"
            />
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>
