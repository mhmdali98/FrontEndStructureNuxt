<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const head = useLocaleHead({ dir: true, lang: true, seo: false })
useHead(() => ({ htmlAttrs: head.value.htmlAttrs }))

const { loggedIn } = useUserSession()
const status = computed(() => Number(props.error.status ?? 500) || 500)
const traceId = computed(() => {
  const data = props.error.data as { traceId?: string } | string | undefined
  if (data && typeof data === 'object') return data.traceId
  return undefined
})
const inShell = computed(() => loggedIn.value && [403, 404].includes(status.value))

const home = () => clearError({ redirect: '/' })
const retry = () => reloadNuxtApp({ force: true })
const signIn = () => clearError({ redirect: '/login' })
</script>

<template>
  <UApp>
    <NuxtLayout :name="inShell ? 'default' : 'blank'">
      <AppErrorView
        :status="status"
        :trace-id="traceId"
        :embedded="true"
        @home="home"
        @retry="retry"
        @sign-in="signIn"
      />
    </NuxtLayout>
  </UApp>
</template>
