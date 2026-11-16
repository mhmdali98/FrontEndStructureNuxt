<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { createAuthApi } from '../api/auth.api'
import { createForgotSchema } from '../schemas/auth.schema'

definePageMeta({ layout: 'auth', guestOnly: true, titleKey: 'auth.forgot.title' })

const { t } = useI18n()
const api = createAuthApi(useApiClient())
const { handleApiError } = useErrorPolicy()
const schema = computed(() => createForgotSchema(t))
type Schema = z.output<ReturnType<typeof createForgotSchema>>
const state = reactive<Schema>({ email: '' })
const sent = ref(false)
const cooldown = ref(0)
const { pause, resume } = useIntervalFn(() => {
  cooldown.value = Math.max(0, cooldown.value - 1)
  if (cooldown.value === 0) pause()
}, 1000, { immediate: false })

const { mutateAsync, isLoading } = useMutation({
  mutation: (email: string) => api.forgotPassword(email),
})

async function onSubmit(event: FormSubmitEvent<Schema>): Promise<void> {
  try {
    await mutateAsync(event.data.email)
    sent.value = true
    cooldown.value = 30
    resume()
  }
  catch (e) {
    handleApiError(e)
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        {{ t('auth.forgot.title') }}
      </h1>
      <p class="mt-1 text-sm text-muted">
        {{ t('auth.forgot.subtitle') }}
      </p>
    </div>
    <UAlert
      v-if="sent"
      color="success"
      variant="subtle"
      icon="i-lucide-mail-check"
      :title="t('auth.forgot.sentTitle')"
      :description="t('auth.forgot.sentDescription', { email: state.email })"
    />
    <UForm
      :schema="schema"
      :state="state"
      class="flex flex-col gap-4"
      @submit="onSubmit"
    >
      <UFormField
        name="email"
        :label="t('auth.fields.email')"
        required
      >
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          icon="i-lucide-mail"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        block
        :loading="isLoading"
        :disabled="cooldown > 0"
        :label="cooldown > 0 ? t('auth.forgot.resendIn', { seconds: cooldown }) : sent ? t('auth.forgot.resend') : t('auth.forgot.submit')"
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
