<script setup lang="ts">
const props = defineProps<{
  status: number
  traceId?: string
  /** compact: rendered inside the app shell */
  embedded?: boolean
}>()
const emit = defineEmits<{ home: [], retry: [], signIn: [] }>()
const { t, te } = useI18n()
const router = useRouter()
const notify = useNotify()

const key = computed(() => te(`errors.pages.${props.status}.title`) ? String(props.status) : 'default')
const icon = computed(() => ({
  401: 'i-lucide-lock-keyhole',
  403: 'i-lucide-shield-x',
  404: 'i-lucide-map-pin-off',
  419: 'i-lucide-timer-off',
  440: 'i-lucide-timer-off',
  429: 'i-lucide-gauge',
  500: 'i-lucide-server-crash',
  503: 'i-lucide-construction',
} as Record<number, string>)[props.status] ?? 'i-lucide-circle-alert')

const showSignIn = computed(() => [401, 419, 440].includes(props.status))
const showRetry = computed(() => props.status >= 500 || props.status === 429)
const showBack = computed(() => [403, 404].includes(props.status))

async function copyTrace(): Promise<void> {
  if (!props.traceId) return
  await navigator.clipboard?.writeText(props.traceId)
  notify.success('common.copied', { id: 'copied' })
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center px-4 text-center"
    :class="embedded ? 'py-16' : 'min-h-svh py-10'"
  >
    <p class="text-sm font-semibold tabular-nums text-primary">
      {{ status }}
    </p>
    <div class="mt-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
      <UIcon
        :name="icon"
        class="size-7 text-primary"
      />
    </div>
    <h1 class="mt-5 text-2xl font-semibold text-highlighted sm:text-3xl">
      {{ t(`errors.pages.${key}.title`) }}
    </h1>
    <p class="mt-2 max-w-md text-sm text-muted">
      {{ t(`errors.pages.${key}.description`) }}
    </p>
    <div class="mt-6 flex flex-wrap items-center justify-center gap-2">
      <UButton
        v-if="showSignIn"
        icon="i-lucide-log-in"
        :label="t('common.signIn')"
        :ui="{ leadingIcon: 'rtl:rotate-180' }"
        @click="emit('signIn')"
      />
      <UButton
        v-if="showRetry"
        icon="i-lucide-rotate-ccw"
        :label="t('common.retry')"
        @click="emit('retry')"
      />
      <UButton
        v-if="showBack"
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        :label="t('common.back')"
        :ui="{ leadingIcon: 'rtl:rotate-180' }"
        @click="router.back()"
      />
      <UButton
        v-if="!showSignIn"
        :color="showRetry || showBack ? 'neutral' : 'primary'"
        :variant="showRetry || showBack ? 'ghost' : 'solid'"
        icon="i-lucide-house"
        :label="t('common.home')"
        @click="emit('home')"
      />
    </div>
    <button
      v-if="traceId"
      type="button"
      class="mt-6 inline-flex items-center gap-1.5 text-xs text-muted hover:text-highlighted"
      @click="copyTrace"
    >
      <UIcon
        name="i-lucide-copy"
        class="size-3.5"
      />
      {{ t('errors.traceId', { id: traceId }) }}
    </button>
  </div>
</template>
