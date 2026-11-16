# Build Prompt: Nuxt 4 Admin Dashboard Starter (Feature Layers · Backend RBAC · EN/AR + RTL · Live Theming)

## 0. Role, objective, ground rules

You are a senior Nuxt/Vue architect and TypeScript engineer. You work alone and unattended in an **empty git repository**. Build a production-ready **admin dashboard frontend starter** with Nuxt 4 and TypeScript. A team should be able to clone it, point it at their own REST backend and grow it one feature at a time. It must also run straight away against a built-in mock backend.

Every one of these outcomes is required and must be shown to work:
1. A complete Nuxt 4 + TS project that is ready for a real REST API (documented contract plus adapters) and that also runs with no backend (mock mode).
2. Pinia for client state, Tailwind CSS v4, and Nuxt UI v4 as the only component library.
3. A professional, modern dashboard design.
4. English and Arabic, with correct RTL.
5. Light, dark and system color modes.
6. Backend-driven RBAC. After login, the roles and permissions from the backend decide which routes, menu items, widgets, buttons and row actions are shown or enabled. Admins manage roles and their permissions in the UI.
7. High performance (budgets in §7).
8. Clean, strictly typed code.
9. Feature-based architecture: one Nuxt Layer per feature, with enforced boundaries.
10. A central system for error messages and notifications, and a chart system.
11. Complete auth (login, logout, forgot/reset password, session, token refresh, guards) and error pages (401, 403, 404, 500, 503/maintenance, offline, no-access).
12. A home overview dashboard.
13. Appearance settings (primary/secondary/neutral color, radius, layout, sidebar style, navbar style, content width, density and more). They apply live and are persisted.
14. Profile pages.

Ground rules:
- It is November 2026 and your training data may be older. **Check the current docs before you use any library API.** Use Context7 MCP if it is available. Otherwise use the official docs or the package's `.d.ts` in `node_modules`. Use **Nuxt 4.x** docs only, and ignore Nuxt 3 and Nuxt 5 docs (`/docs/5.x` and the nuxt `main` branch). If the docs contradict this prompt, follow the docs and log the difference in `docs/DECISIONS.md`.
- Work through the phases in §13. Commit after each phase using Conventional Commits.
- Do not stop to ask about anything this prompt already decides. If something is truly ambiguous, choose the simplest option that fits this prompt and log it in DECISIONS.md.
- Delivered pages contain no placeholders, lorem ipsum or TODO stubs. Mock data is realistic and localized.
- **Every check is automated. There are no "check by hand" steps.** If a tool cannot run in your environment (no Docker daemon, no browser download, no network for fonts), never fake the result. Mark the item `NOT VERIFIED — <reason>` in `docs/PROGRESS.md` and continue.
- Keep `docs/PROGRESS.md` up to date: the phase checklist, the current step, open issues and NOT VERIFIED items. Update it before every commit. **Read it first whenever you resume or after context compaction.**
- When requirements conflict, use this priority: security and correctness (BFF, auth, RBAC) > R1–R14 features > tests and DoD > performance budgets > tooling extras (Docker, hooks, generator). Never drop an item silently; log it in PROGRESS.md.

## 1. Tech stack

Use the latest stable version **within** each range. Check it with `npm view <pkg> version` and skim the changelog for breaking changes.

| Concern | Package(s) | Range | Notes |
|---|---|---|---|
| Runtime | Node | `^24.15.0 \|\| >=26.0.0` | `.nvmrc` = `24`; set the same `engines` |
| Package manager | pnpm | `packageManager: pnpm@12.21.0` | Install with `npm i -g pnpm@12`; Node 25+ dropped corepack. `pnpm-workspace.yaml` needs `allowBuilds` for `@parcel/watcher`, `@tailwindcss/oxide`, `esbuild`, `unrs-resolver`, `vue-demi`. If install reports ERR_PNPM_IGNORED_BUILDS, run `pnpm approve-builds` and commit the result |
| Framework | nuxt | ^4.6.4 | `app/` srcDir. Do not opt into compat v5 |
| UI | @nuxt/ui, tailwindcss | ^4.12.2, ^4.3.5 | MIT. Includes Dashboard/Sidebar, UChart, UForm, UTable, toasts and overlays |
| Icons | @iconify-json/lucide | latest | lucide only |
| Client state | pinia, @pinia/nuxt | ^4.1.0, ^1.0.3 | Setup stores only |
| Server state | @pinia/colada, @pinia/colada-nuxt | ^1.4.9, ^1.2.1 | The only data-fetching pattern |
| i18n | @nuxtjs/i18n | ^10.6.0 | |
| Auth / BFF | nuxt-auth-utils | ~0.6.2 | Tilde range, because 0.x minors break |
| Validation | zod | ^4.6.7 | Used through UForm Standard Schema |
| Charts | @tanstack/charts | ^1.5.0 | Optional peer of Nuxt UI, required by UChart |
| Utilities | @vueuse/core, @vueuse/nuxt | exactly `14.4.0` for both | Must match Nuxt UI's VueUse 14; never 15. If `check:bundle` finds two copies, add an `overrides` entry |
| Dates | @internationalized/date | latest | For UCalendar / UInputDate |
| Types | typescript, vue-tsc | ~6.0.3, ^3.3.14 | **Never TypeScript 7**: it breaks vue-tsc and typescript-eslint |
| Lint | @nuxt/eslint, eslint, eslint-plugin-better-tailwindcss | ^1.17, ^10, ^4.11 | ESLint Stylistic; no Prettier |
| Tests | vitest, @vitest/coverage-v8, @nuxt/test-utils, @vue/test-utils, happy-dom, @playwright/test | ^5.1, ^5.1, ^4.4, ^2.6, ^21, ^1.65 | |
| Perf | lighthouse, rollup-plugin-visualizer | latest, ^7.1.3 | |
| Git hooks | husky, lint-staged, @commitlint/cli + @commitlint/config-conventional | ^9.1.7, ^17.6, ^21.2 | |

- Nuxt UI registers `@nuxt/icon`, `@nuxt/fonts` and `@nuxtjs/color-mode` itself. Configure them through the `icon`, `fonts` and `colorMode` keys, and never install or register them yourself. Never install `reka-ui` or `@tanstack/vue-table` directly.
- Register modules **only in the root `nuxt.config.ts`**, in this order: `@nuxt/eslint`, `@nuxt/ui`, `@nuxtjs/i18n`, `@pinia/nuxt`, `@pinia/colada-nuxt`, `@vueuse/nuxt`, `nuxt-auth-utils`.

## 2. Rendering & deployment (decided)
- The whole app uses `ssr: false` (SPA) and is served by a Nitro **node-server**: `nuxt build`, then `node .output/server/index.mjs`. Nitro hosts the BFF (auth plus API proxy), the mock backend, runtime config and the compressed assets. Static hosting (`nuxt generate`) is not supported because the BFF needs a server; say so in the README. Put the rationale in DECISIONS.md.
- Keep the code SSR-safe so SSR can be turned on later:
  - no reactive state at module scope (plain, non-reactive client-only flags and handlers such as the error bus in §4.2 and the session-expired flag in §4.4 are fine);
  - `useCookie` for persisted preferences;
  - no `window` access at import time.

  Document the steps to enable SSR: forward cookies with `useRequestHeaders`, and add a server-side token-refresh middleware.
- Add `app/spa-loading-template.html`: a tiny inline loader in neutral colors only. It respects the `.dark` class on `<html>` and `prefers-color-scheme`, and makes no external requests.

## 3. Architecture

### 3.1 Repository tree
```
.
├─ app/                          # root app, kept thin
│  ├─ app.vue                    # <UApp :toaster> > NuxtLoadingIndicator + NuxtLayout > NuxtPage; useLocaleHead
│  ├─ error.vue                  # status-aware error screen wrapped in <UApp>
│  ├─ app.config.ts              # default ui.colors/icons (from DEFAULT_APPEARANCE)
│  ├─ spa-loading-template.html
│  └─ assets/css/main.css        # tailwind theme(static) + @nuxt/ui + @theme static (fonts, brand palette, chart vars)
├─ i18n/                         # i18n.config.ts + locales/{en,ar}.json (project overrides)
├─ layers/
│  ├─ core/                      # shared kernel; NEVER references a feature
│  │  ├─ nuxt.config.ts
│  │  ├─ app/
│  │  │  ├─ layouts/             default.vue (shell), auth.vue, blank.vue
│  │  │  ├─ pages/               no-access.vue, maintenance.vue, dev/errors.vue
│  │  │  ├─ components/          App* (AppLogo, AppSidebar, AppTopNav, AppNavbar, AppUserMenu, AppSearch,
│  │  │  │                       AppPageHeader, AppStatCard, AppChartCard, AppEmptyState, AppErrorView,
│  │  │  │                       AppConfirmModal, AppLocaleSwitcher, AppOfflineBanner, AppCustomizer,
│  │  │  │                       AppearanceForm), Can.vue
│  │  │  ├─ composables/         useApiClient, useNotify, usePermissions, useNavigation, useCommands,
│  │  │  │                       useFormat, useApiFormErrors, useConfirm, useHomeRoute
│  │  │  ├─ stores/              auth.ts, appearance.ts
│  │  │  ├─ middleware/          01.auth.global.ts, 02.permissions.global.ts
│  │  │  ├─ plugins/             api.ts, appearance.ts, permissions.ts (v-can), colada-errors.ts,
│  │  │  │                       error-handler.ts, auth-sync.ts
│  │  │  ├─ utils/               api-error.ts, api-adapters.ts, error-bus.ts, permissions.ts, safe-redirect.ts
│  │  │  └─ types/               page-meta.d.ts, app-config.d.ts, colada.d.ts
│  │  ├─ shared/types/           api.ts, auth.ts, appearance.ts, navigation.ts, permissions.ts
│  │  ├─ server/                 api/auth/*.post.ts, api/bff/[...path].ts, api/health.get.ts,
│  │  │                          middleware/csrf.ts, utils/{backend,token-store,refresh}.ts
│  │  ├─ i18n/locales/           en.json, ar.json (common.*, shell.*, nav.*, errors.*, validation.*)
│  │  └─ test/
│  └─ auth/  dashboard/  users/  roles/  profile/  settings/
├─ mock-api/                     # fake backend: server-only layer, added via `extends` in root nuxt.config
├─ templates/feature/            # skeleton for scripts/new-feature.mjs
├─ scripts/                      # new-feature, check-rtl, check-i18n, check-boundaries, check-bundle, perf (+ *.test.ts)
├─ test/e2e/                     # Playwright specs + fixtures
├─ docs/                         # ARCHITECTURE.md, BACKEND_CONTRACT.md, DECISIONS.md, PROGRESS.md
└─ nuxt.config.ts colada.options.ts eslint.config.mjs vitest.config.ts playwright.config.ts
   .env.example .env.mock .env.e2e .nvmrc pnpm-workspace.yaml Dockerfile .dockerignore .github/workflows/ci.yml
```

### 3.2 Anatomy of a feature layer (`users` is the reference)
```
layers/users/
├─ nuxt.config.ts            # only: i18n: { locales: [{ code: 'en', file: 'en.json' }, { code: 'ar', file: 'ar.json' }] }
├─ app/
│  ├─ app.config.ts          # registers navigation + commands (§4.6)
│  ├─ pages/users/index.vue, pages/users/[id].vue   # thin: definePageMeta + composition
│  ├─ components/            UsersTable, UsersFilters, UsersFormSlideover, UsersStatusBadge
│  ├─ composables/           useUsersQueries, useUsersColumns, useUsersRowActions
│  ├─ api/users.api.ts       # pure: createUsersApi(client); no Vue imports
│  ├─ schemas/users.schema.ts  # zod schema factories that take t()
│  └─ stores/                # only for client-only UI state, if any
├─ shared/types/users.ts     # DTOs + AppPermissions augmentation
├─ i18n/locales/en.json, ar.json   # keys under "users.*" only
└─ test/
```

### 3.3 Layer rules
- Every directory under `layers/` has a `nuxt.config.ts`; without one it is silently ignored. Layer configs declare only i18n files and settings specific to that layer.
- All layers share one auto-import and component namespace, so prefix everything with the feature name:
  - components: `Users*`
  - composables: `useUsers*`
  - stores: `useUsers*Store`, with id `users-*`
  - i18n keys: `users.*`
  - server utils: `users*`

  Generic names (`App*`, `useNotify`, …) belong to core only.
- Inside a layer, `~/` resolves to that layer's own `app/`. The only cross-layer explicit import allowed is from `#layers/core/...`.
- Dependencies only point one way: feature → core → libraries. Core never references a feature, and features never reference each other; move shared code into core instead.
  - Auto-imports bypass `no-restricted-imports`, so enforce this with `scripts/check-boundaries.mjs`. It runs as part of `pnpm lint` and CI.
  - It scans each layer's `.vue` and `.ts` files. It fails when a feature uses another feature's prefixes (`<Feature>*` tags or identifiers, `use<Feature>*`, `'<feature>.` i18n keys, `#layers/<feature>`), or when core uses any feature prefix.
  - The prefixes come from the list of layer directories. Unit-test the script with fixtures.
- Features plug into the shell only through these extension points: pages, the `navigation` and `commands` registries in `app.config.ts`, i18n files and permission types. Adding or removing a feature means adding or deleting its folder.
- Put Tailwind class strings only inside `app/` directories, because Nuxt UI adds `@source` only for layer `app/` directories.
- Pages stay thin. Components never call `$api` directly; they use feature composables. Business rules are pure, unit-tested functions.
- Server state lives in Pinia Colada; client and session state live in Pinia setup stores. Never copy server lists into Pinia.
- **Server code** (layers/*/server and mock-api) imports its helpers explicitly from `nuxt/server`: `defineEventHandler`, `createError`, `getQuery`, `readBody`, `readValidatedBody`, `getRouterParam`, `getRequestHeader`, `setResponseStatus`, `useRuntimeConfig` and so on. It reads raw data from `event.req`, which is a web `Request`.
  - Do not use the h3 auto-imports; their event is the deprecated legacy type.
  - Do not import `h3`, except for a helper `nuxt/server` truly lacks, and log that in DECISIONS.md.
  - Enforce this with ESLint `no-restricted-imports` (ban `h3`) in server directories.
  - The nuxt-auth-utils 0.6 session utils accept the `nuxt/server` event.

## 4. Core systems

### 4.1 Configuration
- **`nuxt.config`:**
  - `compatibilityDate: '2026-11-01'`, `ssr: false`, `css: ['~/assets/css/main.css']`, `extends: ['./mock-api']`
  - `experimental: { typedPages: true, defaults: { nuxtLink: { prefetchOn: { visibility: false, interaction: true } } } }`
  - `colorMode: { preference: 'system', fallback: 'light', storage: 'cookie' }`
  - `nitro.compressPublicAssets: { gzip: true, brotli: true }`
  - `routeRules`: `/api/**` gets `cache-control: no-store`, and `/_nuxt/**` is immutable for 1 year. All routes get `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and `X-Frame-Options: DENY`.
- **`runtimeConfig`, server-only:**
  - `apiBase` (`NUXT_API_BASE`), `apiMock` (`NUXT_API_MOCK`), `apiTimeout` (15000), `authTokenStore` (`'cookie' | 'storage'`).
  - `mockRoutes` (`NUXT_MOCK_ROUTES`): mock routes are served when `mockRoutes` or `apiMock` is true.
  - `session: { maxAge: 2592000, cookie: { sameSite: 'lax', secure: true } }`. nuxt-auth-utils does not declare `secure` itself; declaring it lets `NUXT_SESSION_COOKIE_SECURE=false` override it for local HTTP testing (verify).
  - `mockAccessTtl` (120 s) and `mockLatencyMs` (`'150-500'`).
- **`runtimeConfig`, public:** `appName`, `defaultLocale` (`'en'`), `demoMode` (shows the demo accounts and `/dev/errors`), `preferencesSync` (false).
- **`NUXT_APP_SECRET`** must be at least 32 characters (`openssl rand -base64 32`). nuxt-auth-utils 0.6 uses it to seal the session; `NUXT_SESSION_PASSWORD` is obsolete. Dev mode generates one, but **production builds do not**, so every production run (preview, E2E, Docker, CI) must set it.
- **Env files:**
  - `.env.example` is committed and documents every variable.
  - `.env.mock` sets `NUXT_API_MOCK=true`, `NUXT_MOCK_ROUTES=true`, `NUXT_PUBLIC_DEMO_MODE=true`, and a `NUXT_APP_SECRET` labelled `# DEMO ONLY – never use in production`.
  - `.env.e2e` sets `NUXT_MOCK_ACCESS_TTL=5` and `NUXT_MOCK_LATENCY_MS=0`.

  App code reads config only through `useRuntimeConfig()`.

### 4.2 API client & server state
- Plugin `api.ts` provides `$api = $fetch.create({ baseURL: '/api/bff', timeout, retry: 0 })`.
  - Its `onRequest` sets `Accept-Language` (the active locale), `X-Requested-With: fetch` and `X-Request-Id`.
  - It captures `nuxtApp`, and any toast or navigation it triggers runs inside `nuxtApp.runWithContext`.
- `useApiClient()` exposes typed `get/post/put/patch/delete/upload<T>()` with the options `{ query, signal, silent?, baseURL? }`. Every failure is re-thrown as an `ApiError` (§4.3).
  - **The session-expired flow (§4.4) starts only for a 401/419/440 from `/api/bff/**`, or for any error with `code: 'SESSION_EXPIRED'`.**
  - Calls to `/api/auth/*` never start it; the auth feature makes those calls with `baseURL: '/api'`. `silent` calls never start it either.
- Feature API modules are pure functions: `createUsersApi(client)` returns `{ list(params, signal), get, create, update, remove, bulkRemove, roleOptions }`.
- **All backend data goes through Pinia Colada** (`useQuery`, `useMutation`, `defineQueryOptions`). Never use hand-written data stores or ad-hoc `useFetch`. Each feature has:
  - a key factory: `usersKeys.all`, `.list(params)`, `.detail(id)`;
  - query composables;
  - mutations that invalidate `usersKeys.all`, with optimistic updates where they are cheap.

  Tables use `placeholderData: (prev) => prev` and pass `signal`.
- `colada.options.ts` at the repo root holds static options only:
  - `queryOptions: { staleTime: 30_000, gcTime: 300_000 }`;
  - a `PiniaColadaQueryHooksPlugin({ onError })` and a global `mutationOptions.onError`. Both only **forward** to `emitApiError(error, meta)` from `layers/core/app/utils/error-bus.ts` (relative import).
- These hooks run outside Nuxt's injection context. So the plugin `colada-errors.ts` (`dependsOn: ['Pinia Colada']`) registers the handler: it captures `nuxtApp` and calls `handleApiError` inside `nuxtApp.runWithContext`. A nuxt-environment test asserts that a failing query produces a toast.
- Type the errors and meta in `types/colada.d.ts`: `declare module '@pinia/colada' { interface TypesConfig { defaultError: ApiError; queryMeta: { silentError?: boolean } } }`.
- `api-adapters.ts` is the one place for wire-shape adapters:
  - `toPaginated()` accepts our `{ data, meta }` shape and the Laravel paginator shapes, and returns `Paginated<T>`.
  - `serializeListParams(params)` returns a flat query: `page`, `perPage`, `sort` (`name`, `-createdAt`, comma-separated for multi-sort), `search`, `filter[status]=active`, and multi-values as `filter[role]=1,2`. One flag switches to repeated keys: `filter[role][]=1&filter[role][]=2`. Never pass nested objects to the ofetch `query` option.
  - An optional snake_case ↔ camelCase transform sits behind one flag.

### 4.3 Errors & notifications
```ts
export class ApiError extends Error {
  status: number                         // 0 = network error or timeout
  code?: string                          // 'SESSION_EXPIRED' | 'MAINTENANCE' | 'INVALID_CREDENTIALS' | 'UPSTREAM_UNAVAILABLE' | ...
  fieldErrors: Record<string, string[]>  // 422, keyed by form field path
  traceId?: string
  retryAfter?: number                    // seconds, from 429 Retry-After
  raw: unknown
}
```
- `normalizeApiError(e: unknown): ApiError` handles:
  - error types: ofetch `FetchError`, `NuxtError`, network `TypeError`s and timeouts;
  - response bodies: our own shape `{ message, code?, errors?, traceId? }`, Laravel `{ message, errors }`, RFC 9457 ProblemDetails (PascalCase field keys are converted to camelCase), and generic `{ error | message }`;
  - the **Nitro/H3 error envelope** `{ statusCode|status, statusMessage|statusText, message, data }`. Unwrap `data` and normalize it recursively; this is how the BFF's own errors arrive.

  An `AbortError` is ignored and never shown as a toast.
- The error policy lives in one function, `handleApiError(error, ctx)`:

| Status | Behaviour |
|---|---|
| 0 / 502 `UPSTREAM_UNAVAILABLE` | Network or server toast with a Retry action. Show the offline banner if `useOnline()` is false |
| 400 / 409 | Error toast with the server message |
| 401 / 419 / 440 | From `/api/bff/**` or with `SESSION_EXPIRED`: session-expired flow, with a single toast. From `/api/auth/*`: never handled globally; the form shows it inline |
| 403 | `errors.forbidden` toast, then refetch `/me` in the background. A 403 on navigation is handled by the guard |
| 404 | Inline not-found or empty state. Detail pages throw a fatal 404 |
| 422 | `useApiFormErrors(formRef).apply(err)` maps the errors onto the form fields. Show a summary toast only if no field matched. The global handler skips 422 |
| 429 | Warning toast with a retry-after countdown |
| 503 + `MAINTENANCE` | Navigate to `/maintenance` |
| ≥ 500 | Generic translated toast plus a `traceId` the user can copy. Never show raw server text |

- `useNotify()` wraps `useToast()` and exposes `success / info / warning / error(keyOrApiError, params?)`.
  - Messages are always translated.
  - Toasts use stable ids such as `api-${status}`, so repeated errors merge instead of stacking (useToast merges by id).
  - The toaster position is physical, so set it from the text direction: `position: dir === 'rtl' ? 'bottom-left' : 'bottom-right'`.
- Plugin `error-handler.ts` hooks `vue:error` and `app:error`, logs the error, and calls `reportError()`. That is a no-op adapter for now, with an interface ready for Sentry.
- Every widget and chart is wrapped in `<NuxtErrorBoundary>` with an inline retry fallback. In Nuxt 4.x the slot prop is `clearError`.
- Always use `createError({ status, statusText, message, data, fatal })`. Never use `statusCode` or `statusMessage`; they are deprecated. `statusText` must be ASCII. Pass translated text as i18n keys inside `data`.

### 4.4 Authentication (BFF) & guards
Tokens must never reach browser JavaScript. The browser only holds the sealed, httpOnly `nuxt-auth-session` cookie. Backend tokens live in `session.secure`, which only the server can read.

**Server (`layers/core/server`):**
- **`middleware/csrf.ts`.** It rejects with 403 any POST, PUT, PATCH or DELETE to `/api/**` that:
  - lacks `X-Requested-With: fetch`; or
  - has a `Content-Type` other than `application/json` or `multipart/form-data`; or
  - has an `Origin` header that differs from the host.

  `/api/_auth/**` is exempt, because nuxt-auth-utils owns it. The middleware also covers `/api/auth/*`, which prevents login CSRF.
- **`POST /api/auth/login`:**
  1. Validate the body with `readValidatedBody` and the shared zod schema.
  2. Call the backend's `POST /auth/login`.
  3. Store the session: `setUserSession(event, { user: { id }, secure: { accessToken, refreshToken?, expiresAt?, lifetime? }, loggedInAt }, { maxAge })`. Pass `maxAge` as the third `config` argument: 30 days if `remember` is set, otherwise 12 hours.

  The session `user` holds only `{ id }`, which keeps the cookie small; the UI gets user data from `/me`. Backend 401, 422 and 429 responses are passed through.
- **`POST /api/auth/logout`:** calls the backend's `/auth/logout` on a best-effort basis (with an `allDevices` option), then `clearUserSession`.
- **Public pass-throughs:** `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, and `GET /api/health` (to the backend's `/health`).
- **`/api/bff/[...path]`.** Never use h3 `proxyRequest`: it forwards all request headers, including cookies, and relays `set-cookie`. For each request:
  1. Load the session with `getUserSession`. If there is no user, return 401 `{ code: 'SESSION_EXPIRED' }`.
  2. Call `ensureFreshToken()` (see below).
  3. Buffer the body once with `await event.req.arrayBuffer()`, so it can be replayed. Build a request with an allow-list of headers: `content-type`, `accept`, `accept-language`, `x-request-id` and `authorization: Bearer …`. Keep the method and query unchanged. Call `fetch` with `apiTimeout`.
  4. Return a web `Response` that streams the upstream body, with only these headers: `content-type`, `content-disposition`, `cache-control`, `retry-after`, `x-permissions-version`. Verify that a returned `Response` streams on Nitro 2, and log the result.
     - Upstream errors pass through verbatim (status plus JSON body).
     - The BFF's own errors use `createError({ status, statusText, data: { code, errors?, traceId } })`.
  5. On an upstream 401, refresh once and replay the request once. If it is still 401, call `clearUserSession` and return 401 `SESSION_EXPIRED`.

  Unit tests assert that `cookie` never reaches the backend and that upstream `set-cookie` never reaches the browser.
- **`utils/refresh.ts`.** `ensureFreshToken()` refreshes when less than `min(60 s, lifetime / 2)` remains. It must stay safe when the backend rotates refresh tokens:
  - **In-flight dedupe:** `Map<sha256(refreshToken), Promise<TokenPair>>`.
  - **Rotated cache:** keep `sha256(oldRefreshToken) → newPair` for 60 seconds. A late request that still carries the old cookie reuses the new pair and re-seals it with `replaceUserSession`, instead of refreshing again.
  - **Ending the session:** only a 400/401 from the backend's `/auth/refresh` **and** no cache entry ends the session. Network errors, timeouts and 5xx keep the session and return 502 `UPSTREAM_UNAVAILABLE`.
  - **No refresh token:** if login returned no `refreshToken` or no `expiresIn`, skip proactive refresh; the first upstream 401 ends the session.
  - **Multiple instances:** the maps live in memory, per process. Document that multi-instance deployments need `authTokenStore: 'storage'` with a shared unstorage driver (for example Redis) for the cache and a lock.

  Test: 5 parallel BFF calls with an expiring token cause exactly one backend refresh. A 6th call with the old cookie 2 seconds later succeeds with no refresh and no logout.
- **`utils/backend.ts`** has one `backendFetch`. In real mode it calls `apiBase` over HTTP. In mock mode it calls `/api/mock` in-process (for example with `serverFetch` from `nuxt/server`), using the same paths.
- **`TokenStore`** is an interface with two implementations: `cookie` (the default, inside `session.secure`) and `storage` (unstorage, for JWTs too large for the 4 KB cookie limit). `authTokenStore` selects one. Augment the `#auth-utils` types: `User` (`{ id: string }`), `UserSession` and `SecureSessionData`.

**Client:**
- **Auth store.** `useAuthStore` is a setup store.
  - State: `user`, `roles`, `permissions`, `permissionSet` (a computed `Set`), `permissionsVersion`, `loadedAt`.
  - Actions: `load()` (GET `/auth/me` through the BFF), `ensureLoaded()`, `setUser()`, `$reset()`.
  - It is the **only** source of user data for the UI. `useUserSession()` is used only for `loggedIn` and `ready`.
  - It never holds tokens. After a profile or avatar update, call `setUser()` with the response.
- **Home route.** `useHomeRoute().resolve(redirect?)` returns:
  1. `safeRedirect(redirect)`, if that route's meta permissions pass;
  2. otherwise the first visible navigation item;
  3. otherwise `/no-access`.

  Login success and guestOnly redirects both use it.
- **Login page.** Use `UForm`, or `UAuthForm` if it supports everything below (verify). It has:
  - email, password with a show/hide toggle, remember me, and a loading submit button;
  - inline 422 field errors;
  - an inline alert for 401 `INVALID_CREDENTIALS` and for 429, never a redirect or a toast;
  - a banner when the URL has `?reason=session_expired`;
  - demo-account quick-fill chips when `demoMode` is on.

  On success:
  1. `await useUserSession().fetch()`
  2. `await authStore.load()`
  3. `setLocale(me.user.locale)` if it is set.
  4. Apply the backend preferences if `preferencesSync` is on.
  5. Reset the session-expired flag.
  6. `navigateTo(resolve(route.query.redirect))`

  On reset-password, a 401 or 422 shows "link invalid or expired" inline.
- **Session-expired flow.** Guard it with a plain module-level boolean (client-only, reset after a successful login). The flow:
  1. resets the auth store;
  2. clears the Colada cache: `const qc = useQueryCache(); qc.getEntries().forEach(e => qc.remove(e))`;
  3. broadcasts the event;
  4. navigates to `/login?reason=session_expired&redirect=<current>`.

  Test: two expiries in one app lifetime both redirect to login.
- **Logout.** Ask for confirmation, call `POST /api/auth/logout`, broadcast, then `reloadNuxtApp({ path: '/login' })`.
- **Cross-tab sync.** Use `BroadcastChannel('auth')` through `useBroadcastChannel`. A logout in another tab sends this tab to login; a login in another tab reloads this one.
- **Permission freshness.** Refetch `/me` when:
  - the window regains focus and the last load is older than 5 minutes;
  - any request returns 403;
  - `x-permissions-version` differs from the stored value.

  After every refetch, re-evaluate the current route's meta. If it now fails, call `showError(createError({ status: 403, statusText: 'Forbidden', fatal: true }))`. Menus re-filter reactively.
- **Language.** Changing the locale anywhere writes the i18n cookie. When the user is logged in, it also sends a silent `PATCH /profile { locale }`.

**Guards (`layers/core/app/middleware`):**
```ts
declare module '#app' {
  interface PageMeta {
    public?: boolean                 // no login needed (maintenance)
    guestOnly?: boolean              // login, forgot, reset
    permissions?: Permission[]
    permissionMode?: 'any' | 'all'   // default 'all'
    titleKey?: string                // i18n key for <title> and the page header
  }
}
```
- `01.auth.global.ts`:
  1. Skip `public` pages.
  2. Wait until the session is `ready`.
  3. On `guestOnly` pages, send a logged-in user to `useHomeRoute().resolve()`.
  4. If the user is logged out, redirect to `/login?redirect=<to.fullPath>`.
  5. Otherwise `await authStore.ensureLoaded()`.
- `02.permissions.global.ts`: when `meta.permissions` fails, return `abortNavigation(createError({ status: 403, statusText: 'Forbidden', fatal: true }))`.
- `safeRedirect()` only accepts same-origin paths: they start with `/` and not with `//` or `/\`.
- Guards must never loop on the error page, and must never hit the network more than once per session load.

### 4.5 Permissions / RBAC (custom, no dependency)
- **Format.** Permissions are `<resource>.<action>` in lowercase: `dashboard.view`, `reports.view`, `users.view|create|update|delete|export`, `roles.view|manage`, `system.debug`.
  - Wildcards: `*` (super admin) and `users.*`.
  - One adapter, `normalizePermissions(raw)`, maps other backend formats (for example Spatie's "edit articles").
- **Type registry.** Features extend it without core knowing about them:
```ts
// core: shared/types/permissions.ts
declare global { interface AppPermissions {} }
export type Permission = Extract<keyof AppPermissions, string> | '*' | `${string}.*`
// users layer: declare global { interface AppPermissions { 'users.view': true; 'users.create': true /* … */ } }
```
- **Matching.** A pure matcher matches exactly, or `*`, or `<resource>.*`, with O(1) lookups through a `Set`. `filterNavigation(items, can, resolveMeta)` is a separate pure function.
- **Public API:**
  - `usePermissions()` returns reactive `can(p)`, `canAny(ps)`, `canAll(ps)`, `hasRole(r)` and `hasAnyRole(rs)`.
  - `<Can :permission | :any | :all | :role>` has a `#fallback` slot.
  - `v-can="'users.update'"` hides the element (`display:none` + `aria-hidden`), and `v-can:disable` disables it. These are a convenience only; prefer `<Can>` or `v-if` so the markup is never rendered.
  - Routes declare `definePageMeta({ permissions })`.
- **Menus.** The sidebar, top nav and command palette all use the same filtered list. A parent with no visible children disappears, and so does an empty group.
- **Actions.**
  - Toolbar buttons sit inside `<Can>`.
  - Row actions come from `use<Feature>RowActions()`, which returns only permitted `DropdownMenuItem`s. If no row action is permitted, the actions column is hidden; the same goes for the bulk-action bar.
  - Hide forbidden actions by default. Use disabled + tooltip only when the user has the permission but the row's state forbids the action (for example, deleting yourself).
- UI gating is for UX only; the backend enforces access. State this in the docs.

### 4.6 Registries, search, shortcuts
Each feature registers its items in its own `app/app.config.ts`. Items are keyed by id, because objects merge across layers while arrays do not.
```ts
export interface NavItemConfig {
  labelKey: string; icon: `i-lucide-${string}`; to?: string
  permission?: Permission | Permission[]; permissionMode?: 'any' | 'all'  // ONLY for items without a route
  group: 'main' | 'management' | 'system'; order: number
  children?: Record<string, NavItemConfig>; badge?: string; shortcut?: string  // e.g. 'g-u'
}
export interface CommandConfig {
  labelKey: string; icon: `i-lucide-${string}`; to: string
  permission?: Permission | Permission[]; shortcut?: string; order: number
}
// layers/users/app/app.config.ts
// defineAppConfig({ navigation: { users: { labelKey: 'users.nav', icon: 'i-lucide-users', to: '/users', group: 'management', order: 10, shortcut: 'g-u' } },
//                   commands: { 'users-create': { labelKey: 'users.create', icon: 'i-lucide-user-plus', to: '/users?create=1', permission: 'users.create', order: 10 } } })
```
- **Typing.** In `layers/core/app/types/app-config.d.ts`: `declare module 'nuxt/schema' { interface AppConfigInput { navigation?: Record<string, NavItemConfig>; commands?: Record<string, CommandConfig> } interface AppConfig { navigation: Record<string, NavItemConfig>; commands: Record<string, CommandConfig> } } export {}`.
- **`useNavigation()`** sorts, translates and filters the items, and returns `NavigationMenuItem[][]`.
  - For an item with `to`, visibility comes from `router.resolve(item.to).meta.permissions/permissionMode`. That makes the route the single source of truth, so the menu and the guard cannot drift apart.
  - Unit test: every nav `to` resolves to an existing route.
- **Command palette.** Use `UDashboardSearch` on its own, with `v-model:open` bound to `useState('search-open')` and the `meta_k` shortcut.
  - It has two groups: the pages the user may see (from navigation), and actions. Actions are the permitted feature `commands` plus core actions: toggle color mode, switch language, open the customizer, logout.
  - **`UDashboardSearchButton`, `UDashboardSidebarCollapse` and `UDashboardSidebarToggle` do nothing outside `UDashboardGroup`, so do not use them.** Open the search with your own `UButton` + `UKbd`.
- **Shortcuts.** `defineShortcuts` is built from the registry `shortcut` fields: dashboard registers `g-h`, users `g-u`, settings `g-s`. The user menu lists them. Core hard-codes no feature route.

### 4.7 i18n & RTL
- **@nuxtjs/i18n v10 config:**
  - `strategy: 'no_prefix'`, `defaultLocale: 'en'`
  - `detectBrowserLanguage: { useCookie: true, cookieKey: 'i18n_redirected', fallbackLocale: 'en', redirectOn: 'root' }`
  - locales `{ code: 'en', language: 'en-US', name: 'English', dir: 'ltr' }` and `{ code: 'ar', language: 'ar', name: 'العربية', dir: 'rtl' }`
- **Message files.** Each layer ships `i18n/locales/{en,ar}.json`, declared in its own `nuxt.config`, so messages merge across layers (verify the v10 layer docs). v10 has no `lazy` option. `i18n/i18n.config.ts` sets the `en` fallback, the Arabic plural rules (zero/one/two/few/many/other), and the number and date formats.
- **HTML attributes.** In `app.vue`: `const head = useLocaleHead(); useHead(() => ({ htmlAttrs: head.value.htmlAttrs }))`.
- **Nuxt UI locale.** Nuxt UI 4.12 syncs its own locale and `dir` from @nuxtjs/i18n automatically. If a check shows it doesn't, pass `<UApp :locale>` explicitly, importing only `en` and `ar`. Never `import * as locales from '@nuxt/ui/locale'`.
- **No flip on first paint.**
  - A tiny inline head script reads the `i18n_redirected` and `app-appearance` cookies, parses them defensively, and synchronously sets `<html lang dir data-layout data-density data-navbar data-content-width>`.
  - Inject it through `app.head.script`, or through a Nitro `render:html` hook the way @nuxtjs/color-mode does; use whichever reaches the SPA shell.
  - Afterwards, `useLocaleHead` and the appearance plugin keep the attributes in sync.
  - E2E: reload in Arabic and assert that `document.documentElement.dir === 'rtl'` at `DOMContentLoaded` (record it through `page.addInitScript`).
- **Logical utilities only.**
  - Use `ms/me/ps/pe`, `inset-s/inset-e` (`start-*` and `end-*` are deprecated since Tailwind 4.2), `border-s/e`, `rounded-s/e`, `text-start/end`.
  - Apply `rtl:rotate-180` **only** to horizontally directional icons: chevron-left/right, chevrons-left/right, arrow-left/right, log-in, log-out, panel-left*/panel-right*, undo/redo. Never apply it to trending-up/down, arrow-up/down, check, clock, chart or media icons.
- **`scripts/check-rtl.mjs`** runs in CI.
  - It scans only class contexts in `app/` directories: `class=`, `:class`, `ui`/`:ui` values, and tailwind-variants or `cn()` strings.
  - It matches whole tokens, with an optional variant chain and an optional `-` or `!` prefix. Flagged patterns: `m[lr]-*`, `p[lr]-*`, `scroll-[mp][lr]-*`, `left-*`, `right-*`, `start-*`, `end-*`, `border-[lr]`(`-*`), `rounded-[lr]`(`-*`), `rounded-(tl|tr|bl|br)`(`-*`), `text-(left|right)`, `float-(left|right)`, `clear-(left|right)`.
  - It skips `i-lucide-*` names. A `// rtl-ok: <reason>` comment allows an exception.
  - Fixture tests: it must flag `ml-2`, `sm:-mr-1`, `rounded-tl-md`, `left-0`, `start-0` and `border-l`. It must NOT flag `rounded-lg`, `border-red-500`, `items-start`, `justify-end`, `text-start`, `ms-2`, `'bottom-left'`, `'backend-url'` or `trend-up`.
- **Fonts.** Configure them with the `fonts` key: Inter (400–700) and IBM Plex Sans Arabic (subsets `arabic` and `latin`, weights 400/500/600/700). `--font-sans` lists Inter first; under `:lang(ar)` the order flips. Arabic text gets slightly more line-height and no letter-spacing or uppercase.
- **`useFormat()`** provides memoized Intl formatters: number, compact, currency, percent, date, datetime and relative time. Locale tags are `en-US` and `ar-u-nu-${numerals}`, where `numerals` comes from the appearance settings (`latn` by default, or `arab`). Pinning the numbering system avoids ICU differences between environments.
- **Everything visible is translated:** zod messages, titles, aria-labels, toasts, error pages, chart labels, activity items and mock enums. `scripts/check-i18n.mjs` runs in CI and fails if the en and ar key sets differ in any layer.

### 4.8 Theming & appearance engine
```ts
export type PaletteColor = 'brand' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal'
  | 'cyan' | 'sky' | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'
export interface AppearanceSettings {
  version: 1
  primary: PaletteColor; secondary: PaletteColor
  neutral: 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'
  radius: 0 | 0.125 | 0.25 | 0.375 | 0.5               // rem → --ui-radius
  layout: 'sidebar' | 'topnav'
  sidebarVariant: 'sidebar' | 'floating' | 'inset'
  sidebarCollapsible: 'icon' | 'offcanvas' | 'none'      // collapse to icons / hide / fixed
  sidebarCollapsed: boolean
  navbarPosition: 'sticky' | 'static'
  navbarStyle: 'solid' | 'blur' | 'floating'
  contentWidth: 'full' | 'boxed'
  density: 'comfortable' | 'compact'
  numerals: 'latn' | 'arab'
}
```
- **Ownership.** Color mode belongs to `@nuxtjs/color-mode` and language to `@nuxtjs/i18n`; each keeps its own cookie. The appearance store exposes both through delegating getters and setters, so the settings UI talks to one facade.
- **The store.** `useAppearanceStore` persists everything else in `useCookie('app-appearance', { maxAge: 31536000, sameSite: 'lax' })`.
  - The cookie is parsed with a zod schema using `.catch(defaults)`, so a corrupt or outdated cookie falls back to defaults. `version` is there for migrations.
  - `DEFAULT_APPEARANCE` is the single source of defaults; `app.config.ts` reads from it too.
  - Actions: `update(partial)`, `applyPreset(name)` and `reset()`. Reset restores everything, including color mode, but keeps the language.
- **The plugin.** `appearance.ts` (`dependsOn: ['pinia']`) applies the settings before the first render and keeps them in sync. It sets:
  - `useAppConfig().ui.colors.primary/secondary/neutral`, which makes Nuxt UI regenerate its CSS variables live;
  - a `useHead` style `:root{--ui-radius:…rem}`;
  - the `<html>` data attributes.
- **Palettes.** `ui.colors` accepts only palette **names**.
  - `main.css` uses `@import "tailwindcss" theme(static);` then `@import "@nuxt/ui";`, and defines a custom `brand` palette (all 11 shades, 50–950) in `@theme static`.
  - Color swatches use an inline `style="background-color: var(--color-<name>-500)"`.
- **Shell mapping:**
  - **Sidebar layout.** Use `USidebar` with `variant`, `collapsible` and `side="left"`. `left` is the logical start, so the sidebar moves to the right in RTL.
    - Bind `v-model:open` to a writable computed `sidebarOpen`: `get: () => !store.sidebarCollapsed`, `set: v => { if (!isMobile.value) store.update({ sidebarCollapsed: !v }) }`, where `isMobile = useMediaQuery('(max-width: 63.99rem)')`. USidebar writes `open=false` below its `lg` breakpoint, and that must not be persisted.
    - Below `lg`, always pass `collapsible: 'offcanvas'`, because `'none'` and `'icon'` render no mobile menu. Show a hint about this in the form.
    - Build your own toggle button.
  - **Top-nav layout:** no sidebar; a horizontal `UNavigationMenu` sits in the navbar, with a slideover menu on mobile.
  - **Navbar position:** sticky is `sticky top-0 z-30`.
  - **Navbar style:** blur is `bg-default/75 backdrop-blur`; solid is `bg-default border-b border-default`; floating is a detached rounded bar with a margin.
  - **Content width:** boxed is `mx-auto max-w-(--ui-container)`.
  - **Density:** wrap the shell in `<UTheme :props>`. Compact maps button, input, select and select-menu to size `sm`, and sets `--app-gap`.
  - **Slideovers** (customizer and forms) open from the inline end. `USlideover`'s `side` is physical, so bind `:side="dir === 'rtl' ? 'left' : 'right'"`.
- **Presets.** Default, Ocean, Forest, Sunset and Mono. Each sets primary, secondary and neutral together.
- **The form.** `AppearanceForm` is used both on `/settings/appearance` and in the `AppCustomizer` slideover, opened by the palette button in the navbar. Every change previews live.
- **Optional backend sync** (`preferencesSync`): send a debounced `PUT /profile/preferences`; after login, apply `me.preferences.appearance`.

### 4.9 Charts
- **Library.** Use `UChart` (it needs `@tanstack/charts`) with the types `line`, `area`, stacked `bar` and `donut`. Colors come from `--ui-chart-1..6`; `--ui-chart-1` is primary. Override `--ui-chart-2: var(--ui-secondary)` for both light and dark, so charts follow the appearance settings and color mode with no JS.
- **RTL.** Keep UChart's built-in behaviour: in Arabic it reverses the x scale and puts the y-axis on the right. Do not override it. Card chrome mirrors through logical utilities. Ticks and tooltips use `useFormat()`, so they follow the numerals setting. Record this decision in DECISIONS.md.
- **Wrappers.**
  - `AppChartCard`: title, description, actions slot, a fixed-height skeleton, error with retry, and an empty state.
  - `AppStatCard`: value, delta badge and a sparkline.

  Always pass `format`, `aria-label` and `aspect-ratio`.
- **Lazy loading.** Charts below the fold use `<LazyDashboardXxxChart v-if="isVisible" />`, with `useElementVisibility` on a placeholder that already has the right size. Hydration props do nothing when `ssr: false`. The KPI row is never lazy.
- **README note only (do not install it).** For gauges, heatmaps or large series, add `nuxt-echarts` behind `AppChartCard`. ECharts cannot parse `oklch()` colors, so theme variables must be converted to rgba first.

## 5. Layouts & pages
There are three layouts:
- **`default`:** the app shell (below).
- **`auth`:** a split screen (§6.1).
- **`blank`:** centered content.

The app shell:
- **Sidebar layout.** The `USidebar` has:
  - header: `AppLogo` and the app name, which collapses to the logo mark;
  - body: a search button and grouped `UNavigationMenu`s with `collapsed`, `tooltip` and `popover`;
  - footer: the user menu.

  Next to it is the main column (navbar + content). The top-nav layout shows the logo, a horizontal menu and the same navbar actions.
- **`AppNavbar`.**
  - Start: sidebar toggle, then the page title or breadcrumbs from `titleKey`.
  - End: search (⌘K), customize, language switcher (language names, not flags), color-mode toggle, and the user menu (`UUser` with Profile, Settings, Shortcuts, Logout).
  - Below `sm`, only the toggle, title, search icon and user menu remain. Language, color mode and customize move into the user menu.
- **Also in the shell:** `AppOfflineBanner`, `NuxtLoadingIndicator` in the primary color, `<title>` set to `t(titleKey) · appName`, and a skip-to-content link.

| Route | Layout | Meta | Content |
|---|---|---|---|
| `/login` | auth | guestOnly | see §4.4 |
| `/forgot-password` | auth | guestOnly | email field, then a neutral confirmation; resend after a cooldown |
| `/reset-password` | auth | guestOnly | token and email from the query, password + confirm, strength hint, then login |
| `/` | default | `dashboard.view` | Home (below) |
| `/users`, `/users/[id]` | default | `users.view` | reference CRUD (§11); an unknown id gives a fatal 404 |
| `/roles` | default | `roles.view` | List of roles + read-only permission matrix grouped by resource. With `roles.manage`: create and edit in a slideover (name, label, matrix with per-group select-all), and delete with confirmation (409 if the role is in use or is a system role). Editing a role the current user holds triggers a `/me` refetch |
| `/profile` | default | logged in | tab "General": avatar upload with preview, name, phone, read-only email, preferred language |
| `/profile/security` | default | logged in | change password (with 422 mapping), sign out other devices |
| `/settings/appearance` | default | logged in | `AppearanceForm` with a live mini-preview (`/settings` redirects here) |
| `/settings/language` | default | logged in | language, direction preview, numerals, date and number format preview |
| `/no-access` | blank | logged in | "Your account has no permissions yet", a contact-admin hint, Logout |
| `/maintenance` | blank | public | 503 view that polls `/api/health` every 30 seconds and returns when the backend is healthy |
| `/dev/errors` | default | `system.debug`, only when `demoMode` | triggers every error type through `/__simulate/:status` and previews every error view |

**Home (`/`):**
- Page header: a greeting, range tabs (7d/30d/90d) synced to `?range`, and a refresh button.
- Each widget has its own query, skeleton, error/retry state, empty state and permission (table below).
- The grid reflows with no holes. The KPI row is `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` over the visible cards only. If one widget in a row is hidden, the other spans the whole row.

| Widget | Permission | Endpoint | lg span |
|---|---|---|---|
| Revenue KPI | `reports.view` | `/dashboard/summary` | 1/4 |
| Orders, New users, Conversion KPIs | `dashboard.view` | `/dashboard/summary` | 1/4 each |
| Revenue vs expenses (area) | `reports.view` | `/dashboard/revenue` | 2/3 |
| Traffic sources (donut) | `dashboard.view` | `/dashboard/traffic-sources` | 1/3 |
| Orders by status (stacked bar, lazy) | `dashboard.view` | `/dashboard/orders-by-status` | 1/2 |
| Recent activity (lazy) | `users.view` | `/dashboard/activity` | 1/2 |

KPI deltas show an up or down arrow, colored success or error according to a client-side `higherIsBetter` flag per KPI key.

**`app/error.vue`:**
- It wraps everything in `<UApp>` and sets the correct lang, dir and theme itself.
- Logged-in users see 403 and 404 inside `<NuxtLayout name="default">`; everyone else sees them in `blank`.
- It switches on `error.status`:
  - 401: session expired, with a Sign in button.
  - 403: Home and Back.
  - 404: Home, Back and search.
  - 419 / 440: expired.
  - 429: too many requests.
  - 500: Retry and Home, plus a traceId the user can copy.
  - 503: maintenance.
  - Anything else: a default view.
- It uses `AppErrorView` and `clearError({ redirect })`.

## 6. UI/UX design guidelines
- **Look.** Clean, modern SaaS. The visual reference is the official Nuxt UI dashboard template (github.com/nuxt-ui-templates/dashboard, MIT). In Phase 0 you may clone it into a scratch directory outside the repo to study the shell, home and settings pages. Do not copy it wholesale.
- **Color.** Surfaces are neutral, with thin borders and one accent.
  - Primary is for actions and active states.
  - Secondary is for highlights and the second chart series.
  - Semantic colors are only for status.
- **Tokens.** Use only Nuxt UI semantic tokens and utilities (`text-highlighted`, `text-muted`, `bg-elevated`, `border-default`, `text-primary`, `bg-primary/10`). Never use raw `gray-*` or hex values; that way every palette and both color modes work.
- **Spacing and shape.** Use a 4/8 px rhythm (`gap-4`/`gap-6`, page padding `p-4 sm:p-6`). Radius comes from `--ui-radius`. Keep shadows minimal.
- **Typography.**
  - Page title: `text-xl font-semibold text-highlighted`.
  - Section titles: `text-base font-medium`.
  - Body: `text-sm`.
  - Numbers: `tabular-nums`.
- **Page header.** Every page uses the same pattern: title, description, primary actions at the end, and breadcrumbs on detail pages.
- **Async states.** Every async block has all four states:
  - a skeleton shaped like the final content (never a full-page spinner);
  - an empty state (icon, title, hint, call to action);
  - an inline error with retry;
  - buttons that show loading and are disabled while saving.
- **Feedback.** Destructive actions ask for confirmation and name the entity. Every outcome gets a toast.
- **Responsive**, designed mobile-first:
  - the sidebar becomes a slideover below `lg`;
  - tables hide secondary columns below `md` and keep a sticky header;
  - forms use a single column on mobile;
  - touch targets are at least 40 px;
  - the page never scrolls horizontally.
- **Accessibility:**
  - WCAG 2.2 AA contrast in both modes;
  - full keyboard navigation with a visible focus ring;
  - translated `aria-label`s on icon buttons;
  - one `h1` per page;
  - `prefers-reduced-motion` is respected;
  - charts have a label and a text summary.
- **Motion and icons.** Transitions take 150–200 ms and never shift the layout. Icons are lucide only: `size-4` inline, `size-5` in navigation.

### 6.1 Component recipes
- **`AppLogo`:** an inline SVG mark in `currentColor` + `text-primary`; the wordmark is `appName`. The favicon SVG uses the same mark.
- **Auth layout:** `lg:grid-cols-2`.
  - The brand panel is `hidden lg:flex`, with a gradient from primary to secondary (via CSS variables), the logo, a headline, three icon bullets and a footer.
  - The form column is `max-w-sm` and centered.
  - The locale and color-mode toggles sit in the top inline-end corner.
- **KPI card:**
  - `UCard variant="outline"`;
  - label `text-sm text-muted`;
  - icon chip `size-9 rounded-md bg-primary/10 text-primary`;
  - value `text-2xl font-semibold tabular-nums`;
  - delta `UBadge variant="subtle"`;
  - a 40 px sparkline.
- **Table page:**
  - The toolbar has search at the start, then filters and the column toggle, and the primary action at the end.
  - Selecting rows swaps the toolbar for "n selected" plus the bulk actions.
  - The number of skeleton rows equals perPage.
  - The footer shows "Showing x–y of z", a per-page select and pagination.

## 7. Performance requirements
Measure automatically on the production build, in mock mode with zero latency. Commit the results to `docs/perf.json` and the README.
- **`pnpm perf`** (`scripts/perf.mjs`):
  1. Build, then start `node --env-file=.env.mock --env-file=.env.e2e .output/server/index.mjs`.
  2. Log in as admin with Playwright.
  3. Run `lighthouse` with `--chrome-path` set to Playwright's Chromium and `--extra-headers` carrying the session cookie. Use the desktop preset and take the median of 3 runs, on `/login` and `/`.
  4. Exit non-zero if any budget fails.

  Budgets: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, and CLS on `/` below 0.05.
- **`pnpm check:bundle`** reads the visualizer raw-data JSON (from `nuxt analyze`) and asserts:
  - entry JS ≤ 200 KB gzip;
  - every other chunk ≤ 150 KB gzip;
  - no `@tanstack/charts` in the chunks loaded by `/login` (taken from the Playwright network log);
  - exactly one copy each of vue, @vueuse/core and reka-ui.
- If a budget cannot be met without breaking §15, record the measured value and the top 5 contributors in DECISIONS.md instead of hacking around it.
- **Code splitting.** Routes split by default. Use `Lazy*` components with `v-if` for slideovers, modals, below-the-fold charts, the customizer and the command palette contents. Links prefetch on interaction. No `manualChunks`.
- **Icons:**
  - Use `icon: { provider: 'none', clientBundle: { scan: { globInclude: ['app/**/*.{vue,ts}', 'layers/**/*.{vue,ts}'] }, icons: [/* dynamic ones */], sizeLimitKb: 256 } }`.
  - Leave out `serverBundle`; it does nothing with provider `none`. Never call the Iconify API.
  - Write icon names as full literals only.
- **Fonts** are self-hosted woff2, with only the weights and subsets that are used.
- **Nuxt UI** `ui.experimental.componentDetection: true`. List components rendered through `h()` or `resolveComponent` (for example in table cells) explicitly. Check in the visual spec that no styles are missing.
- **Data and rendering:**
  - Colada caching, keeping the previous page's data while the next one loads;
  - `signal` cancellation;
  - search debounced at 300 ms;
  - `shallowRef`/`markRaw` for large datasets;
  - `UTable virtualize` for client-side lists over 300 rows;
  - no deep watchers on large arrays.
- **Dependencies.** No moment, lodash or axios. Dates use `Intl` or `@internationalized/date`.

## 8. Code quality conventions
- **TypeScript.** Keep the strict settings Nuxt 4 generates, including `noUncheckedIndexedAccess`, and `verbatimModuleSyntax` (which means `import type`).
  - ESLint errors on `any` and `@ts-ignore`. `@ts-expect-error` is allowed only with a reason.
  - Exported functions have explicit return types.
  - Use unions or `as const` objects instead of enums.
- **Vue.** Use `<script setup lang="ts">` only, with typed `defineProps`, `defineEmits` and `defineModel`. No Options API.
- **Naming:**
  - components: PascalCase with the feature prefix;
  - composables: `useXxx.ts`;
  - stores: `useXxxStore`, with a kebab-case id;
  - files: `xxx.api.ts`, `xxx.schema.ts`;
  - constants: `UPPER_SNAKE`;
  - i18n keys: `feature.section.key`.
- **Single responsibility.** Pages compose, components render, composables orchestrate, and pure functions hold the logic. Soft limits are 200 lines per component and 150 per composable.
- **Stores.** Setup stores return all their state and implement `$reset`. Read them with `storeToRefs`. Never put secrets in Pinia or `localStorage`.
- **Comments and lint.** Comments explain *why*. Every public core API has JSDoc. Lint with the `@nuxt/eslint` flat config + Stylistic, the `better-tailwindcss` correctness rules, the `h3` ban in server code, and `check-boundaries`.
- **Git hooks.**
  - `pre-commit` runs lint-staged (`eslint --fix --cache`).
  - `commit-msg` runs commitlint (conventional).
  - `pre-push` runs typecheck and the unit tests.

## 9. Testing
- **Vitest config.** Use `test.projects`; Vitest 5 removed `workspace`.
  - `unit` project: node environment, `include: ['layers/**/test/**/*.test.ts', 'scripts/**/*.test.ts']`, `exclude: ['**/*.nuxt.test.ts', '**/node_modules/**']`.
  - `nuxt` project: `defineVitestProject` with happy-dom, `include: ['layers/**/test/**/*.nuxt.test.ts']`.
  - Use `passWithNoTests` until Phase 3.
  - Set the coverage thresholds in the config: at least 80% of lines in `layers/core/app/utils` and `composables`.
- **Unit tests:**
  - the permission matcher: exact, `*`, `res.*`, any/all, roles;
  - `filterNavigation` (children, empty groups), and "every nav `to` resolves";
  - `normalizeApiError`: our shape, Laravel, ProblemDetails, the Nitro envelope, network, abort, timeout;
  - 401 scoping: BFF versus `/api/auth/*`;
  - `toPaginated`, `serializeListParams` and `safeRedirect`;
  - refresh dedupe (§4.4) and BFF header stripping;
  - two session expiries in one app lifetime;
  - the appearance cookie schema;
  - `useFormat`: en, ar-latn, ar-arab;
  - the check-rtl and check-boundaries fixtures;
  - i18n key parity.
- **Nuxt-environment tests:**
  - `<Can>` and its fallback, and `v-can`;
  - the permissions middleware returning a 403;
  - `useNotify` deduplication;
  - a failing query producing a toast (colada-errors plugin);
  - the appearance plugin updating `appConfig.ui.colors` and `--ui-radius`;
  - Users row actions for each permission set.
- **End-to-end setup.** Playwright on Chromium, with `workers: 1`.
  - `webServer.command: 'pnpm build && node --env-file=.env.mock --env-file=.env.e2e .output/server/index.mjs'`.
  - A fixture calls the mock's `POST /api/mock/__reset` before each test, and fails any test on `pageerror` or `console.error`.
  - Install the browser with `pnpm exec playwright install chromium` (add `--with-deps` in CI).
- **End-to-end specs:**
  - **Theme and RTL:**
    - Arabic sets `dir="rtl"` before mount and puts the sidebar on the right;
    - primary color, dark mode and sidebar style survive a reload;
    - a reload at mobile width leaves the desktop collapsed state unchanged.
  - **Auth:**
    - login success;
    - login failure shows the 422 field errors and the inline 401 alert, with no redirect;
    - redirect to login, then back to the target;
    - a logged-in user is redirected away from guest pages;
    - token refresh is invisible to the user after the 5-second TTL;
    - after logout, the back button shows no protected data;
    - logging out in one tab logs out the other.
  - **RBAC:**
    - the viewer has no create/delete buttons and gets a 403 on `/roles`;
    - the viewer opens `/users` and sees zero error toasts;
    - the manager sees roles read-only, and the admin can manage them;
    - `noaccess@demo.test` lands on `/no-access`.
  - **Features:** users CRUD with search, filter, sort, paginate and URL sync; CSV export; profile update, avatar upload and change password.
  - **Errors:** an unknown route shows the 404 view, and each `/dev/errors` case shows its intended view or toast.
  - **`visual.spec.ts`:** full-page screenshots of `/login`, `/`, `/users`, `/settings/appearance`, a 403 and a 404, for {en-LTR, ar-RTL} × {light, dark} at 375 px and 1440 px. They are saved to `test/e2e/__screenshots__/`, which is gitignored.
  - **Real-HTTP smoke project (CI):** run with `NUXT_API_MOCK=false NUXT_MOCK_ROUTES=true NUXT_API_BASE=http://127.0.0.1:3000/api/mock`, and cover login, the users list, a 422 and a refresh. This makes the BFF talk to the mock over real HTTP.

## 10. Backend API contract & mock mode
Document the contract in `docs/BACKEND_CONTRACT.md`:
- JSON is camelCase, and paths are relative to `NUXT_API_BASE`.
- Every non-2xx body is `{ message: string; code?: string; errors?: Record<string, string[]>; traceId?: string }`.
- The keys of a 422 `errors` object are request field paths, such as `address.city` or `items.0.name`.
- List queries use the format produced by `serializeListParams`.
- The client sends `Accept-Language`. The backend may send `Retry-After` and `X-Permissions-Version`.
- Refresh is optional: with no `refreshToken` or `expiresIn`, there is no proactive refresh. Recommend a short reuse grace window for rotated refresh tokens.
```ts
interface TokenPair { accessToken: string; refreshToken?: string; expiresIn?: number; tokenType?: 'Bearer' }
interface AuthUser { id: string; name: string; email: string; avatarUrl: string | null; phone: string | null; locale: 'en' | 'ar'; createdAt: string }
interface MeResponse { user: AuthUser; roles: string[]; permissions: string[]; permissionsVersion?: string; preferences?: { appearance?: Partial<AppearanceSettings> } }
interface Paginated<T> { data: T[]; meta: { page: number; perPage: number; total: number; lastPage: number } }
interface ListParams { page?: number; perPage?: number; sort?: string; search?: string; filter?: Record<string, string | string[]> }
type User = AuthUser & { status: 'active' | 'inactive' | 'invited'; roles: { id: string; name: string; label: string }[]; lastLoginAt: string | null }
interface Role { id: string; name: string; label: string; permissions: string[]; usersCount: number; system: boolean }
type ActivityType = 'user.created' | 'user.updated' | 'user.deleted' | 'role.updated' | 'auth.login'
```
| Endpoint | Request | Response |
|---|---|---|
| POST `/auth/login` | `{ email, password, remember }` | `TokenPair`, optionally with `user`; errors 401 `INVALID_CREDENTIALS`, 422, 429 |
| POST `/auth/refresh` | `{ refreshToken }` | `TokenPair` (rotation allowed); 401 |
| POST `/auth/logout` | `{ refreshToken?, allDevices? }` | 204 |
| GET `/auth/me` | none | `MeResponse` |
| POST `/auth/forgot-password` | `{ email }` | always 202, so it never reveals whether a user exists |
| POST `/auth/reset-password` | `{ token, email, password, passwordConfirmation }` | 204; 401/422 |
| GET `/health` | none | 200 `{ status: 'ok' }` or 503 `{ code: 'MAINTENANCE' }` |
| PATCH `/profile` · POST `/profile/avatar` (multipart) | `{ name?, phone?, locale? }` · `avatar` | `AuthUser` · `{ avatarUrl }` |
| PUT `/profile/password` · PUT `/profile/preferences` | `{ currentPassword, password, passwordConfirmation }` · `{ appearance }` | 204 (422 possible on the password route) |
| GET `/dashboard/summary` | `range=7d\|30d\|90d` | `{ kpis: { key: 'revenue'\|'orders'\|'newUsers'\|'conversion', value, previous, unit: 'currency'\|'number'\|'percent', trend: number[] }[] }`, containing only the KPIs the caller may see |
| GET `/dashboard/revenue` · `/orders-by-status` · `/traffic-sources` | `range` | `{ points: { date, revenue, expenses }[] }` · `{ points: { date, pending, completed, cancelled }[] }` · `{ items: { source: 'direct'\|'search'\|'social'\|'referral'\|'email', value }[] }` |
| GET `/dashboard/activity` | `limit` | `{ items: { id, type: ActivityType, actor: { id, name, avatarUrl }, target?: { type, id, label }, createdAt }[] }`; the client renders each item with `t('dashboard.activity.' + type, …)` |
| GET `/users` · GET `/users/:id` | `ListParams` with `filter[status]`, `filter[role]` | `Paginated<User>` · `User` |
| POST `/users` · PATCH `/users/:id` | `{ name, email, phone?, roleIds, status, password? }` | 201 `User` · `User`; errors 409/422 |
| DELETE `/users/:id` · POST `/users/bulk-delete` | none · `{ ids }` | 204 |
| GET `/roles/options` | none (allowed with `users.view`) | `{ id, name, label }[]` |
| GET `/roles` · GET `/permissions` | none | `Role[]` · `{ key, group, labelKey }[]` |
| POST `/roles` · PATCH `/roles/:id` · DELETE `/roles/:id` | `{ name, label, permissions }` | 201 `Role` · `Role` · 204; 409 if the role is in use or is a system role; 422 |

Mock backend (the `mock-api/` layer: server-only and added through `extends`, so deleting that one line removes it):
- **Routes.** `/api/mock/**` mirrors the contract **exactly**. A server middleware returns 404 for these routes unless `mockRoutes` or `apiMock` is true. Import helpers from `nuxt/server`.
- **Data.** Seeded, deterministic and in-memory: about 250 users with both Arabic and English names, plus roles and 90 days of metrics. The mock-only `POST /api/mock/__reset` reseeds it.
- **Demo accounts**, all with password `Password123!`:
  - `admin@demo.test`: `*`;
  - `manager@demo.test`: dashboard.view, reports.view, users.view/create/update, roles.view;
  - `viewer@demo.test`: dashboard.view, users.view;
  - `noaccess@demo.test`: no permissions.
- **Realism:**
  - latency comes from `mockLatencyMs`;
  - access tokens expire after `mockAccessTtl`;
  - refresh tokens rotate, with a 10-second reuse grace;
  - 403 for missing permissions and 422 for validation errors (for example a duplicate email);
  - `GET /__simulate/:status` (400/401/403/404/409/422/429/500/503) for `/dev/errors`. A 503 also makes `/health` return 503 for 60 seconds.

## 11. Reference feature: Users
- **List.** `UTable` with server-side data.
  - Columns: avatar + name + email, role badges, status badge, last login (relative time), created date, actions.
  - Sorting, plus `UPagination` with a per-page selector.
  - Search debounced at 300 ms with `refDebounced`.
  - Filters for status and role. The role options come from `GET /roles/options` through `users.api.ts`, never through the roles layer.
  - Column visibility, row selection and bulk delete.
  - All list state is synced to the URL query (`replace: true`).
- **Create and edit** happen in `LazyUsersFormSlideover`, which opens automatically when the URL has `?create=1`:
  - `UForm` with a zod schema factory whose messages come from `t()`;
  - roles multi-select and status; the password field appears only on create;
  - 422 errors mapped onto the fields;
  - a success toast and cache invalidation;
  - correct focus management.
- **Delete** goes through `useConfirm()` (useOverlay + `AppConfirmModal`) and names the user. The row is removed optimistically and restored if the request fails.
- **Permissions:**
  - create needs `users.create`;
  - edit needs `users.update`;
  - delete and bulk delete need `users.delete`;
  - exporting the current page as CSV needs `users.export`.

  Deleting yourself is disabled with a tooltip.
- **Tests.** Unit tests cover the column builder, the action builder and the schema.

## 12. Tooling, delivery & docs
- **Scripts:**
  - development and build: `dev`, `dev:mock` (`nuxt dev --dotenv .env.mock`), `build`, `preview`, `preview:mock` (`node --env-file=.env.mock .output/server/index.mjs`);
  - checks: `typecheck` (`nuxt typecheck`), `lint` (eslint + check:boundaries), `lint:fix`, `check:rtl`, `check:i18n`, `check:boundaries`, `check:bundle`, `perf`;
  - tests: `test`, `test:watch`, `test:coverage`, `test:e2e`;
  - other: `analyze` (`nuxt analyze`), `new:feature`, `postinstall: nuxt prepare`, `prepare: husky`.
- **Feature generator.** `scripts/new-feature.mjs <name>` scaffolds a layer from `templates/feature`. It creates the config, i18n files, a page, an API module, a key factory, a query composable, a nav registration, a permission type and a test. It also registers the new prefix for check-boundaries.
- **TypeScript config.** `tsconfig.json` uses Nuxt 4 project references (`.nuxt/tsconfig.{app,server,shared,node}.json`). Add extra options through `typescript.tsConfig`, never edit `.nuxt`, and do not enable `typescript.typeCheck` in dev.
- **Project files.** `pnpm-workspace.yaml` (with `allowBuilds`), `.nvmrc`, `engines`, `.editorconfig`, and `.vscode/` settings (ESLint fix on save, Prettier disabled, recommended Vue, ESLint and Tailwind extensions).
- **Dockerfile:**
  - multi-stage on `node:24-alpine`, installing pnpm with `npm i -g pnpm@12`;
  - `ENV HUSKY=0` in the deps and build stages;
  - the deps stage runs `pnpm install --frozen-lockfile --ignore-scripts`, then the app is built;
  - the runtime image copies only `.output`, sets `NODE_ENV=production HOST=0.0.0.0 PORT=3000`, runs as `USER node`, and starts with `CMD ["node", ".output/server/index.mjs"]`;
  - add a `.dockerignore`.

  The README run example is `docker run -p 3000:3000 -e NUXT_APP_SECRET=… -e NUXT_API_BASE=… <image>`. The session cookie is `Secure`, so test at `http://localhost` or behind TLS. `NUXT_SESSION_COOKIE_SECURE=false` is only for non-TLS intranet testing.
- **CI** (`.github/workflows/ci.yml`): generate `NUXT_APP_SECRET` per run, then install → lint → check:rtl → check:i18n → typecheck → test (with coverage) → build → check:bundle → e2e (mock) → real-HTTP smoke.
- **Docs:**
  - `README.md`: quick start, demo accounts, env vars, scripts, connecting a real backend, adding a feature, permission and theming how-tos, deployment, the measured performance numbers, and a short **Arabic quick-start section**.
  - `docs/ARCHITECTURE.md`: Mermaid diagrams of the layers, the dependency rules, the data flow and the auth/refresh sequence.
  - `docs/BACKEND_CONTRACT.md`, `docs/DECISIONS.md` and `docs/PROGRESS.md`.

## 13. Execution plan
From Phase 1 on, every phase ends with the standard checkpoint: `pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build`, all green, plus the phase's own check and the E2E specs written so far. Then update PROGRESS.md and commit.
- **Phase 0 — Recon (no code).**
  - Confirm the versions with `npm view` and read the current docs.
  - Create DECISIONS.md with a **Verification log** table (claim | source | result | action). It has one row per open item:
    - UAuthForm capabilities;
    - Nuxt UI i18n locale and dir sync;
    - i18n v10 locale merging across layers;
    - whether a returned `Response` streams on Nitro 2;
    - injecting the head script into the SPA shell;
    - per-call `maxAge` in `setUserSession`;
    - the `NUXT_SESSION_COOKIE_SECURE` override;
    - production behaviour when `NUXT_APP_SECRET` is missing;
    - standalone `v-model:open` on `UDashboardSearch`;
    - the Colada hooks surface.
  - Create PROGRESS.md.
- **Phase 1 — Scaffold & tooling.** Set up Nuxt 4, pnpm, TS, ESLint (with the h3 ban), husky and commitlint, the Vitest and Playwright configs, every layer with its `nuxt.config.ts`, the mock-api layer, the env files, and the check scripts with their fixture tests. Check: the dev server starts and serves `/login`.
- **Phase 2 — UI foundation.** Add:
  - Nuxt UI, `main.css` and the brand palette;
  - fonts and icons;
  - i18n + RTL and the first-paint script;
  - color mode;
  - the appearance store and plugin;
  - layouts with a static nav, `error.vue` and the loading template.

  Check: the theme/RTL E2E specs and the visual spec pass. Then review the screenshots (see below).
- **Phase 3 — Data & error layer.** Build:
  - the API client and adapters;
  - `ApiError`, the normalizer and the error policy;
  - the error bus and the colada-errors plugin;
  - `useNotify`, the Colada options and the form-error mapping;
  - `useFormat` and `useConfirm`;
  - unit tests for all of the above.
- **Phase 4 — Auth.** Build the mock backend, the BFF (CSRF, forwarding, refresh dedupe), the auth feature, the guards, home-route resolution, the session-expired flow and cross-tab sync. Check: the auth E2E specs pass, covering all four demo accounts and refresh after the TTL.
- **Phase 5 — RBAC.** Build the permission engine, `<Can>` and `v-can`, the navigation and commands registries, search, shortcuts, and the route re-check after `/me`. Add the RBAC E2E specs.
- **Phase 6 — Features.** Build the dashboard, users, roles (with management), profile, settings and the customizer. Add the feature E2E specs, then review the screenshots.
- **Phase 7 — Error pages & polish.** Build the error, maintenance, offline and no-access views and `/dev/errors`, then polish UX, responsiveness and accessibility. Add the error E2E specs, then review the screenshots.
- **Phase 8 — Performance.** Run `check:bundle`, componentDetection, lazy loading and `pnpm perf`, and record the numbers.
- **Phase 9 — Delivery.**
  - Reach the coverage target and add the real-HTTP smoke test.
  - Build the `new:feature` generator: generate a throwaway feature, build it, check that it appears behind its permission, then delete it.
  - Add Docker, CI and the docs.
  - Finally, audit §14 and write the result to PROGRESS.md: each item is PASS (command + evidence) or NOT VERIFIED (reason). Fix every failing item before you finish.

**Screenshot review** (after Phases 2, 6 and 7): open the images in `test/e2e/__screenshots__/` with your image-reading tool. Fix overflow, misalignment, clipped text, low contrast, elements that should be mirrored but aren't, the wrong font for Arabic, and anything that looks unfinished. Re-run until the screenshots are clean, and note what you fixed in PROGRESS.md.

## 14. Definition of Done
- [ ] On a fresh clone, `pnpm install && pnpm dev:mock` works: every demo account logs in, with no console errors or warnings in the browser or the terminal.
- [ ] These all pass: `lint` (including check:boundaries), `check:rtl`, `check:i18n`, `typecheck`, `test` (with coverage thresholds), `build`, `check:bundle`, `test:e2e` and the real-HTTP smoke test. `docker build` + `docker run` works with env vars.
- [ ] The code has no `any`, no `@ts-ignore`, no TODOs or lorem ipsum, no hard-coded UI strings and no physical-direction classes.
- [ ] Every layer has its own `nuxt.config.ts`, en/ar files with matching keys, and prefixed names. Core references no feature, and check:boundaries blocks cross-feature usage.
- [ ] Session and token security:
  - JavaScript can never read a token;
  - the BFF strips cookies in both directions;
  - the CSRF middleware is active;
  - token refresh is single-flight and safe under rotation (unit test);
  - a backend refresh outage does not log users out.
- [ ] Redirects work both ways:
  - a logged-out user goes to `/login?redirect=…` and returns to that page after login;
  - guest pages send a logged-in user through home-route resolution;
  - open redirects are rejected;
  - users with no permissions land on `/no-access`.
- [ ] Permissions in the UI:
  - viewer, manager and admin each see different menus, widgets, buttons and row actions;
  - a forbidden route shows the 403 view;
  - a forbidden API action shows a toast and refetches `/me`;
  - a permission revoked while the user is on that page leads to a 403;
  - the admin can create, edit and delete roles.
- [ ] Arabic works fully:
  - `dir="rtl"` from the first paint, with the sidebar on the right;
  - only directional icons are mirrored;
  - the Arabic font and Nuxt UI strings in Arabic;
  - the numerals setting works.

  English works in LTR.
- [ ] Light, dark and system modes work everywhere, including charts, `error.vue` and the loading template. There is no flash of the wrong theme on reload.
- [ ] Every option in §4.8 applies live, survives a reload and resets to its default. Visiting on a phone does not change the persisted sidebar state.
- [ ] Every error case shows its intended view or toast through `/dev/errors`: 401, 403, 404, 429, 500, 503, offline and network errors. 422 errors land on the right form fields, and a wrong password shows the inline alert.
- [ ] Home shows the KPIs and all four chart types, each with skeleton, empty and error states. Charts follow the primary color and RTL, and the grid has no holes when widgets are hidden.
- [ ] Users CRUD works end to end: search, filter, sort, paginate, URL sync, create, edit, delete, bulk delete and CSV export. Profile update, avatar upload and change password also work.
- [ ] The §7 budgets are met (or measured and justified in DECISIONS.md) and recorded in `docs/perf.json`.
- [ ] `pnpm new:feature demo` produces a feature that builds and appears in the menu behind its permission. Deleting its folder removes it.
- [ ] The screenshot reviews are done, and PROGRESS.md contains the final DoD audit with evidence.

## 15. Do NOT
- Install `@nuxt/fonts`, `@nuxt/icon`, `@nuxtjs/color-mode`, `reka-ui` or `@tanstack/vue-table` yourself, or add a second UI library (§1).
- Use TypeScript 7 or `typescript@latest`, `@vueuse/*@15`, Nuxt 3 or Nuxt 5 APIs, or `future.compatibilityVersion: 5` (§1).
- Add axios, TanStack Query, vee-validate, moment, lodash, ApexCharts (it needs a commercial licence) or pinia-plugin-persistedstate (§1, §4.8).
- Store tokens in Pinia, localStorage or JS-readable cookies; put permissions in the session cookie; forward browser cookies or use `proxyRequest` in the BFF; or treat UI gating as security (§4.4, §4.5).
- Start the session-expired flow for 401s from `/api/auth/*`, or call `useToast`/`navigateTo` from Colada hooks outside `runWithContext` (§4.2, §4.3).
- Use `statusCode` or `statusMessage`, use a non-ASCII `statusText`, or show raw 5xx messages to users (§4.3).
- Use physical-direction utilities, mirror non-directional icons, or hard-code user-facing text (§4.7).
- Create root-level `pages/` or `components/` directories, a layer without a `nuxt.config.ts`, module registrations in layer configs, or any cross-feature reference (§3.3).
- Import `h3`, or rely on the h3 auto-imports in server code, without a logged reason (§3.3).
- Use `import * as locales from '@nuxt/ui/locale'`, put hex values in `ui.colors`, or build Tailwind class names from strings (§4.7, §4.8).
- Use `UDashboardSearchButton`, `UDashboardSidebarCollapse` or `UDashboardSidebarToggle` outside `UDashboardGroup`, or bind USidebar's `v-model:open` straight to persisted state (§4.6, §4.8).
- Block navigation with `await useFetch`, fetch on every navigation inside middleware, or keep reactive state at module scope (§2, §4.4).
- Write directives that remove DOM nodes, add `manualChunks`, or enable `typescript.typeCheck` in dev (§4.5, §7, §12).
- Disable lint rules, skip failing checks, or fake results to make them pass (§0).
