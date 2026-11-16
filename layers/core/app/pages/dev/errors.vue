<script setup lang="ts">
definePageMeta({ permissions: ['system.debug'], titleKey: 'devErrors.title' })

const config = useRuntimeConfig()
if (!config.public.demoMode) {
  throw createError({ status: 404, statusText: 'Not Found', fatal: true })
}

const { t } = useI18n()
const client = useApiClient()
const { handleApiError } = useErrorPolicy()
const form = useTemplateRef('form')
const { apply } = useApiFormErrors(form)
const state = reactive({ name: '', email: '' })
const statuses = [400, 401, 403, 404, 409, 422, 429, 500, 503] as const
const views = [401, 403, 404, 429, 500, 503] as const
const busy = ref<number | null>(null)

async function trigger(status: number): Promise<void> {
  busy.value = status
  try {
    await client.get(`/__simulate/${status}`)
  }
  catch (e) {
    if (status === 422) apply(e)
    else handleApiError(e, { retry: () => void trigger(status) })
  }
  finally {
    busy.value = null
  }
}

async function network(): Promise<void> {
  try {
    await client.get('/__simulate/500', { baseURL: 'http://127.0.0.1:9' })
  }
  catch (e) {
    handleApiError(e)
  }
}

function preview(status: number): void {
  showError(createError({ status, statusText: 'Preview', fatal: true, data: { traceId: status >= 500 ? 'trc_preview' : undefined } }))
}
</script>

<template>
  <div>
    <AppPageHeader
      :title="t('devErrors.title')"
      :description="t('devErrors.description')"
    />
    <div class="grid gap-(--app-gap) lg:grid-cols-2">
      <UCard variant="outline">
        <ul class="divide-y divide-default">
          <li
            v-for="s in statuses"
            :key="s"
            class="flex items-center justify-between gap-3 py-2.5"
          >
            <span class="text-sm"><span class="font-mono tabular-nums text-highlighted">{{ s }}</span> · {{ t(`devErrors.statuses.${s}`) }}</span>
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :loading="busy === s"
              :label="t('devErrors.trigger', { status: s })"
              :data-testid="`simulate-${s}`"
              @click="trigger(s)"
            />
          </li>
          <li class="flex items-center justify-between gap-3 py-2.5">
            <span class="text-sm">{{ t('devErrors.network') }}</span>
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              :label="t('devErrors.network')"
              data-testid="simulate-network"
              @click="network"
            />
          </li>
        </ul>
      </UCard>
      <div class="flex flex-col gap-(--app-gap)">
        <UCard variant="outline">
          <UForm
            ref="form"
            :state="state"
            class="grid gap-4"
          >
            <UFormField
              name="name"
              label="Name"
            >
              <UInput
                v-model="state.name"
                class="w-full"
              />
            </UFormField>
            <UFormField
              name="email"
              label="Email"
            >
              <UInput
                v-model="state.email"
                class="w-full"
              />
            </UFormField>
          </UForm>
        </UCard>
        <UCard variant="outline">
          <template #header>
            <h2 class="text-base font-medium text-highlighted">
              {{ t('devErrors.views') }}
            </h2>
          </template>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="v in views"
              :key="v"
              size="sm"
              color="neutral"
              variant="soft"
              :label="t('devErrors.preview', { status: v })"
              :data-testid="`preview-${v}`"
              @click="preview(v)"
            />
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
