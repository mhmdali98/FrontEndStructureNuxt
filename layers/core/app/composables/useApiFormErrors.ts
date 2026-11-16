import type { Ref } from 'vue'
import { ApiError, normalizeApiError } from '../utils/api-error'

interface FormLike {
  setErrors: (errors: { name?: string, message: string }[], name?: string) => void
  clear: (name?: string) => void
}

/**
 * Maps 422 field errors onto a Nuxt UI `<UForm>`. Returns true when at least one
 * field matched; otherwise shows a summary toast.
 */
export function useApiFormErrors(form: Ref<FormLike | null | undefined>, fields?: readonly string[]) {
  const notify = useNotify()
  const { t, te } = useNuxtApp().$i18n

  function apply(error: unknown): boolean {
    const err = error instanceof ApiError ? error : normalizeApiError(error)
    if (err.status !== 422) return false
    const entries = Object.entries(err.fieldErrors)
      .filter(([name]) => !fields || fields.includes(name))
      .map(([name, messages]) => {
        const message = messages[0] ?? ''
        // Server-side validation may return i18n keys (e.g. the BFF's own zod schemas).
        return { name, message: te(message) ? t(message) : message }
      })
    form.value?.setErrors(entries)
    if (entries.length === 0) notify.error(err.message ? err : 'errors.validation', { id: 'api-422' })
    return entries.length > 0
  }

  return { apply, clear: () => form.value?.clear() }
}
