import type { Directive, DirectiveBinding } from 'vue'
import type { Permission } from '#layers/core/shared/types/permissions'
import { checkPermissions } from '../utils/permissions'

type Value = Permission | Permission[]

/**
 * `v-can="'users.update'"` hides the element; `v-can:disable` disables it instead.
 * Convenience only: prefer `<Can>` or `v-if` so forbidden markup is never rendered.
 */
export default defineNuxtPlugin({
  name: 'core-permissions',
  dependsOn: ['pinia', 'i18n:plugin'],
  setup(nuxtApp) {
    const auth = useAuthStore()

    function apply(el: HTMLElement, binding: DirectiveBinding<Value>): void {
      const ok = checkPermissions(auth.permissionSet, binding.value, binding.modifiers.any ? 'any' : 'all')
      if (binding.arg === 'disable') {
        if (ok) {
          el.removeAttribute('disabled')
          el.removeAttribute('aria-disabled')
        }
        else {
          el.setAttribute('disabled', '')
          el.setAttribute('aria-disabled', 'true')
        }
        return
      }
      el.style.display = ok ? '' : 'none'
      if (ok) el.removeAttribute('aria-hidden')
      else el.setAttribute('aria-hidden', 'true')
    }

    const directive: Directive<HTMLElement, Value> = {
      mounted: apply,
      updated: apply,
      getSSRProps: () => ({}),
    }

    nuxtApp.vueApp.directive('can', directive)
  },
})
