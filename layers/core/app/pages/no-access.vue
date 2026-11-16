<script setup lang="ts">
definePageMeta({ layout: 'blank', titleKey: 'errors.noAccess.title' })
const { t } = useI18n()
const { logout } = useLogout()
const auth = useAuthStore()
</script>

<template>
  <div class="flex max-w-md flex-col items-center text-center">
    <div class="flex size-14 items-center justify-center rounded-full bg-warning/10">
      <UIcon
        name="i-lucide-user-lock"
        class="size-7 text-warning"
      />
    </div>
    <h1 class="mt-5 text-2xl font-semibold text-highlighted">
      {{ t('errors.noAccess.title') }}
    </h1>
    <p class="mt-2 text-sm text-muted">
      {{ t('errors.noAccess.description') }}
    </p>
    <p
      v-if="auth.user"
      class="mt-4 text-sm text-toned"
    >
      {{ auth.user.email }}
    </p>
    <UButton
      class="mt-6"
      icon="i-lucide-log-out"
      :label="t('common.logout')"
      :ui="{ leadingIcon: 'rtl:rotate-180' }"
      @click="logout({ skipConfirm: true })"
    />
  </div>
</template>
