# Decisions

| # | Decision | Why |
|---|---|---|
| 1 | `ssr: false` SPA served by Nitro `node-server` | Authenticated dashboard: no SEO need; the Nitro server still hosts the BFF, mock and runtime config. `nuxt generate` (static hosting) is **not supported** because the BFF needs a server. |
| 2 | BFF with nuxt-auth-utils sealed cookie | Tokens never reach browser JS; one same-origin cookie; CSRF handled in one middleware. |
| 3 | Nuxt UI 4 as the only component library | Ships dashboard/sidebar, forms (Standard Schema), table, toasts, overlays, charts, RTL and color mode. |
| 4 | Pinia Colada for all server state | Caching, dedupe, cancellation, invalidation; official Nuxt module; no hand-written data stores. |
| 5 | Custom RBAC (no CASL) | The backend already decides; the UI needs a tiny matcher (`*`, `res.*`), `<Can>`, `v-can`, route meta. |
| 6 | `UChart` (built on `@tanstack/charts`) | Follows `--ui-chart-*` CSS variables (primary, secondary) and RTL with no JS theming. Built-in RTL behaviour (reversed x scale, y-axis on the right) is kept. |
| 7 | Fonts self-hosted from `@fontsource/*` via `css` | No third-party requests at build or run time (the build sandbox blocks font CDNs; `@nuxt/fonts` providers are disabled). |
| 8 | Forms validate on input (eager, 0 ms delay), not on blur | A message appearing/disappearing on blur shifts the layout under the pointer and swallows the click on the submit button (found by E2E). Set once through `<UTheme :props>` in the default layout and on the login form. |
| 9 | Below `lg` a dedicated `AppMobileNav` slide-over replaces USidebar's own mobile menu | USidebar writes `open` on breakpoint changes; binding it to persisted state made phone visits collapse the desktop sidebar. Desktop USidebar writes are ignored; only the toggle button persists. |
| 10 | `useNuxtApp().$i18n` instead of `useI18n()` in core composables/stores/plugins | `useI18n()` throws outside component setup (`MUST_BE_CALL_SETUP_TOP`), and these run in plugins, middleware and Colada hooks. |
| 11 | BFF relays a buffered body (JSON or bytes) instead of returning a streamed web `Response` | Header merging with a returned `Response` on Nitro 2 was not relied upon; buffering keeps `Set-Cookie` from session updates intact. Fine for JSON APIs; large downloads would need streaming. |
| 12 | Auth broadcast messages carry a per-tab id | `BroadcastChannel` delivers to other channel objects in the **same** tab too; without the id a tab reloaded itself on its own logout/expiry. |
| 13 | Users with zero permissions always land on `/no-access` | Profile/settings have no permission requirement, so "first visible nav item" would otherwise pick settings. |
| 14 | `pnpm` override `@vueuse/core: 14.4.0` | `vaul-vue` (Nuxt UI dependency) pins VueUse 10; one copy keeps the bundle lean (checked by `check:bundle`). |
| 15 | `better-tailwindcss/no-unknown-classes` off | Nuxt UI semantic utilities come from `#build/ui.css`, which the plugin cannot resolve. Other correctness rules stay on. |
| 16 | Boundary checker allows core-owned names | The feature is called `auth` while core owns `useAuthStore` / `AuthUser`; names defined by core are never violations. Only `t()`/`labelKey` strings count as i18n usage (so `can('users.view')` is fine). |
| 17 | Node 22.22+ also accepted in `engines` | Nuxt 4.6 supports `^22.22.3`; the build sandbox runs Node 22. `.nvmrc` and Docker use 24. |
| 18 | Coverage threshold applies to `layers/core/app/utils` (97 %) | Composables are mostly thin Nuxt-context wrappers covered by Nuxt-environment and E2E tests; their unit line coverage is reported, not enforced. |
| 19 | `NUXT_E1005` ignored in the E2E console guard | Nuxt logs it whenever a page load *starts* with a fatal error (direct 403/404 loads), which is the intended behaviour. |

## Verification log

| Claim | Source | Result | Action |
|---|---|---|---|
| Nuxt UI 4.12 syncs locale/dir from @nuxtjs/i18n | `@nuxt/ui/dist/module.mjs` (`ui-i18n.mjs` plugin) | ✅ provides the locale from `$i18n.locale` | No `:locale` on `<UApp>` |
| i18n v10 merges locale files across layers | build + E2E (all layer keys render) | ✅ | Each layer declares `en.json`/`ar.json` |
| `UDashboardSearch` works standalone with `v-model:open` | `DashboardSearch.vue` (`defineModel('open')`, own `defineShortcuts`) | ✅ | Rendered once in the default layout |
| `setUserSession(event, data, { maxAge })` per call | `nuxt-auth-utils` 0.6.2 `session.d.ts` | ✅ third `config` arg | 12 h / 30 d (remember) |
| `NUXT_APP_SECRET` replaces `NUXT_SESSION_PASSWORD` | `nuxt-auth-utils` module warning text | ✅ | Documented in `.env.example` |
| `NUXT_SESSION_COOKIE_SECURE=false` override | E2E over `http://127.0.0.1` with `.env.mock` | ✅ login works over HTTP | Only in `.env.mock` |
| Head script reaches the SPA shell | `curl /login` contains `first-paint` script; E2E reads `dir` at `DOMContentLoaded` | ✅ | `app.head.script` |
| Pinia Colada plugin name | `@pinia/colada-nuxt/dist/runtime/plugin.js` (`name: "Pinia Colada"`) | ✅ | `dependsOn: ['Pinia Colada']` |
| `UAuthForm` | not used | — | Plain `UForm` gives inline 401/429 alerts and demo chips |
| Returned `Response` streaming on Nitro 2 | not relied upon | — | See decision 11 |
| `nuxt/server` exports `serverFetch`, `readValidatedBody`, `getRequestURL` … | `nuxt/dist/server/index.d.ts` | ✅ | Server code imports only from `nuxt/server` |
