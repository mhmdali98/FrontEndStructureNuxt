<script setup lang="ts">
import { use__Name__ListQuery } from '../../composables/use__Name__Queries'

definePageMeta({ permissions: ['__name__.view'], titleKey: '__name__.title' })

const { t } = useI18n()
const params = ref({ page: 1, perPage: 10 })
const { data, isLoading, error, refetch } = use__Name__ListQuery(params)
</script>

<template>
  <div>
    <AppPageHeader
      :title="t('__name__.title')"
      :description="t('__name__.description')"
    />
    <UCard variant="outline">
      <AppInlineError
        v-if="error && !data"
        @retry="refetch()"
      />
      <USkeleton
        v-else-if="isLoading && !data"
        class="h-40"
      />
      <AppEmptyState v-else-if="!data?.data.length" />
      <ul
        v-else
        class="divide-y divide-default"
      >
        <li
          v-for="item in data.data"
          :key="item.id"
          class="py-2 text-sm"
        >
          {{ item.name }}
        </li>
      </ul>
    </UCard>
  </div>
</template>
