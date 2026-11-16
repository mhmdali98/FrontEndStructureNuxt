<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { ApiError } from '#layers/core/app/utils/api-error'
import { createAuthApi } from '../api/auth.api'
import { createResetSchema, passwordStrength } from '../schemas/auth.schema'

definePageMeta({ layout: 'auth', guestOnly: true, titleKey: 'auth.reset.title' })

const { t } = useI18n()
const route = useRoute()
const notify = useNotify()
const api = createAuthApi(useApiClient())
const { handleApiError } = useErrorPolicy()
const schema = computed(() => createResetSchema(t))
type Schema = z.output<ReturnType<typeof createResetSchema>>
const state = reactive<Schema>({ password: '', passwordConfirmation: '' })
const invalidLink = ref(false)

const token = computed(() => String(route.query.token ?? ''))
const email = computed(() => String(route.query.email ?? ''))
const strength = computed(() => passwordStrength(state.password))
const strengthColor = computed(() => (['error', 'error', 'warning', 'success', 'success'] as const)[strength.value])

const { mutateAsync, isLoading } = useMutation({
  mutation: (body: Schema) => api.resetPassword({ ...body, token: token.value, email: email.value }),
})

async function onSubmit(event: FormSubmitEvent<Schema>): Promise<void> {
  invalidLink.value = false
  try {
    await mutateAsync(event.data)
    notify.success('auth.reset.done')
    await navigateTo('/login')
  }
  catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 422)) invalidLink.value = true
    else handleApiError(e)
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        {{ t('auth.reset.title') }}
      </h1>
      <p class="mt-1 text-sm text-muted">
        {{ email ? t('auth.reset.subtitleFor', { email }) : t('auth.reset.subtitle') }}
      </p>
    </div>
    <UAlert
      v-if="invalidLink || !token"
      color="error"
      variant="subtle"
      icon="i-lucide-link-2-off"
      :title="t('auth.reset.invalid')"
    />
    <UForm
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField
        name="password"
        :label="t('auth.fields.newPassword')"
        required
      >
        <UInput
          v-model="state.password"
          type="password"
          autocomplete="new-password"
          class="w-full"
        />
        <template #help>
          <div class="flex items-center gap-2">
            <UProgress
              :model-value="strength"
              :max="4"
              size="xs"
              :color="strengthColor"
              class="flex-1"
            />
            <span class="text-xs text-muted">{{ t(`auth.reset.strength.${strength}`) }}</span>
          </div>
        </template>
      </UFormField>
      <UFormField
        name="passwordConfirmation"
        :label="t('auth.fields.confirmPassword')"
        required
      >
        <UInput
          v-model="state.passwordConfirmation"
          type="password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        block
        :loading="isLoading"
        :disabled="!token"
        :label="t('auth.reset.submit')"
      />
    </UForm>
    <ULink
      to="/login"
      class="inline-flex items-center gap-1 text-sm text-muted hover:text-highlighted"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="size-4 rtl:rotate-180"
      />
      {{ t('auth.backToLogin') }}
    </ULink>
  </div>
</template>
