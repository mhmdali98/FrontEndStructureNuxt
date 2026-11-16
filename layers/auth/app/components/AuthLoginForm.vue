<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { createLoginSchema } from '../schemas/auth.schema'

const { t } = useI18n()
const route = useRoute()
const config = useRuntimeConfig()
const { login, isLoading, inlineError } = useAuthLogin()

const schema = computed(() => createLoginSchema(t))
type Schema = z.output<ReturnType<typeof createLoginSchema>>

const state = reactive<Schema>({ email: '', password: '', remember: false })
const showPassword = ref(false)
const form = useTemplateRef('form')
const { apply } = useApiFormErrors(form)

const sessionExpired = computed(() => route.query.reason === 'session_expired')

async function onSubmit(event: FormSubmitEvent<Schema>): Promise<void> {
  const err = await login(event.data)
  if (err?.status === 422) apply(err)
}

function pickDemo(email: string, password: string): void {
  state.email = email
  state.password = password
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        {{ t('auth.login.title') }}
      </h1>
      <p class="mt-1 text-sm text-muted">
        {{ t('auth.login.subtitle') }}
      </p>
    </div>

    <UAlert
      v-if="sessionExpired && !inlineError"
      color="warning"
      variant="subtle"
      icon="i-lucide-timer-off"
      :title="t('session.expired')"
      data-testid="session-expired-banner"
    />
    <UAlert
      v-if="inlineError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      :title="inlineError.kind === 'credentials' ? t('auth.login.invalid') : inlineError.kind === 'throttle' ? t('auth.login.throttled', { seconds: inlineError.seconds ?? 60 }) : t('errors.network')"
      data-testid="login-error"
      role="alert"
    />

    <UForm
      ref="form"
      :schema="schema"
      :state="state"
      :validate-on="['input', 'change']"
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
          autofocus
        />
      </UFormField>
      <UFormField
        name="password"
        :label="t('auth.fields.password')"
        required
      >
        <template #hint>
          <ULink
            to="/forgot-password"
            class="text-xs text-primary"
          >
            {{ t('auth.login.forgot') }}
          </ULink>
        </template>
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          icon="i-lucide-lock"
          class="w-full"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showPassword ? t('auth.fields.hidePassword') : t('auth.fields.showPassword')"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>
      <UCheckbox
        v-model="state.remember"
        name="remember"
        :label="t('auth.login.remember')"
      />
      <UButton
        type="submit"
        block
        :loading="isLoading"
        :label="t('auth.login.submit')"
      />
    </UForm>

    <AuthDemoAccounts
      v-if="config.public.demoMode"
      @pick="pickDemo"
    />
  </div>
</template>
