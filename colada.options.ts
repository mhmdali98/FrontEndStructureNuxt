import type { PiniaColadaOptions } from '@pinia/colada'
import { PiniaColadaQueryHooksPlugin } from '@pinia/colada'
import { emitApiError } from './layers/core/app/utils/error-bus'

/**
 * Static Pinia Colada options. Hooks run outside the Nuxt context, so they only forward
 * errors to the error bus; the `core-colada-errors` plugin applies the policy.
 */
export default {
  queryOptions: {
    staleTime: 30_000,
    gcTime: 300_000,
  },
  mutationOptions: {
    onError: (error, _vars, context) => emitApiError(error, context.entry.meta),
  },
  plugins: [
    PiniaColadaQueryHooksPlugin({
      onError: (error, entry) => emitApiError(error, entry.meta),
    }),
  ],
} satisfies PiniaColadaOptions
