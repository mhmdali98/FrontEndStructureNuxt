<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { createProfileApi } from '../../api/profile.api'
import { createPasswordSchema } from '../../schemas/profile.schema'

definePageMeta({ titleKey: 'profile.security.title' })

const { t } = useI18n()
const notify = useNotify()
const { confirm } = useConfirm()
const { logout } = useLogout()
const api = createProfileApi(useApiClient())
const form = useTemplateRef('form')
const { apply } = useApiFormErrors(form)
const schema = computed(() => createPasswordSchema(t))
type Schema = z.output<ReturnType<typeof createPasswordSchema>>
const blank = (): Schema => ({ currentPassword: '', password: '', passwordConfirmation: '' })
const state = reactive<Schema>(blank())

const change = useMutation({ mutation: (input: Schema) => api.changePassword(input) })
async function onSubmit(e: FormSubmitEvent<Schema>): Promise<void> {
  try {
    await change.mutateAsync(e.data)
    Object.assign(state, blank())
    form.value?.clear()
    notify.success('profile.security.changed')
  }
  catch (err) {
    apply(err)
  }
}

async function signOutEverywhere(): Promise<void> {
  const ok = await confirm({ title: t('profile.security.everywhereTitle'), description: t('profile.security.everywhereDescription'), confirmLabel: t('profile.security.everywhere'), danger: true })
  if (ok) await logout({ skipConfirm: true, allDevices: true })
}
</script>

<template>
  <div>
    <AppPageHeader
      :title="t('profile.title')"
      :description="t('profile.description')"
    />
    <ProfileTabs />
    <div class="grid gap-(--app-gap) lg:grid-cols-3">
      <div class="lg:col-span-1">
        <h2 class="text-base font-medium text-highlighted">
          {{ t('profile.security.title') }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{ t('profile.security.description') }}
        </p>
      </div>
      <UCard
        variant="outline"
        class="lg:col-span-2"
      >
        <UForm
          ref="form"
          :schema="schema"
          :state="state"
          class="flex flex-col gap-4"
          @submit="onSubmit"
        >
          <UFormField
            name="currentPassword"
            :label="t('profile.security.current')"
            required
          >
            <UInput
              v-model="state.currentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              name="password"
              :label="t('profile.security.new')"
              required
            >
              <UInput
                v-model="state.password"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
            <UFormField
              name="passwordConfirmation"
              :label="t('profile.security.confirm')"
              required
            >
              <UInput
                v-model="state.passwordConfirmation"
                type="password"
                autocomplete="new-password"
                class="w-full"
              />
            </UFormField>
          </div>
          <div>
            <UButton
              type="submit"
              :loading="change.isLoading.value"
              :label="t('profile.security.submit')"
              data-testid="password-submit"
            />
          </div>
        </UForm>
      </UCard>

      <div class="lg:col-span-1">
        <h2 class="text-base font-medium text-highlighted">
          {{ t('profile.security.sessions') }}
        </h2>
        <p class="mt-1 text-sm text-muted">
          {{ t('profile.security.sessionsDescription') }}
        </p>
      </div>
      <UCard
        variant="outline"
        class="lg:col-span-2"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <UIcon
              name="i-lucide-monitor-smartphone"
              class="size-5 text-muted"
            />
            <p class="text-sm">
              {{ t('profile.security.everywhereHint') }}
            </p>
          </div>
          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-log-out"
            :label="t('profile.security.everywhere')"
            @click="signOutEverywhere"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>
