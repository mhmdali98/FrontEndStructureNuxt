# Progress

## Phases

- [x] 0 Recon — versions checked with `npm view`, APIs read from installed `.d.ts`/sources (see DECISIONS verification log)
- [x] 1 Scaffold & tooling — Nuxt 4.6.4, pnpm 12, TS 6, ESLint (Stylistic, better-tailwindcss, h3 ban), husky/commitlint, Vitest, Playwright, layers, mock-api, env files, check scripts
- [x] 2 UI foundation — Nuxt UI 4.12, Tailwind 4, brand palette, self-hosted fonts, i18n + RTL + first-paint script, color mode, appearance store/plugin, layouts, error.vue, loading template
- [x] 3 Data & errors — API client/adapters, ApiError + normalizer + policy, error bus, colada-errors plugin, notify, form error mapping, format, confirm
- [x] 4 Auth — BFF (CSRF, allow-listed proxy, rotation-safe single-flight refresh), auth pages, guards, home route, session-expired flow, cross-tab sync
- [x] 5 RBAC — matcher, `<Can>`, `v-can`, route meta, registries (navigation/commands/userMenu), search, shortcuts, route re-check after `/me`
- [x] 6 Features — dashboard, users, roles (+ management), profile, settings, customizer
- [x] 7 Error pages & polish — 401/403/404/429/500/503 views, maintenance, offline banner, no-access, `/dev/errors`
- [x] 8 Performance — bundle and Lighthouse budgets measured (`docs/bundle.json`, `docs/perf.json`)
- [x] 9 Delivery — generator, Docker, CI, docs

## Definition of Done audit (2026-11-16)

| Item | Result | Evidence |
|---|---|---|
| `pnpm install && pnpm dev:mock`, all demo accounts log in, no console errors | PASS | E2E `auth`, `rbac` specs with the console guard (fails on `pageerror` / `console.error`) |
| lint (incl. boundaries), check:rtl, check:i18n, typecheck | PASS | `pnpm lint && pnpm check:rtl && pnpm check:i18n && pnpm typecheck` exit 0 |
| test (with coverage threshold) | PASS | 110 tests (97 unit + 13 Nuxt-env); utils 97 % lines |
| build, check:bundle | PASS | entry 73 KB gzip, largest chunk 59 KB, single vue/@vueuse/core/reka-ui |
| test:e2e + real-HTTP smoke | PASS | 36 passed (+1 smoke project passed with `E2E_REAL_HTTP=1`) |
| `docker build` + `docker run` | **NOT VERIFIED** — no Docker daemon in the build sandbox (`/var/run/docker.sock` missing) | Dockerfile follows the multi-stage spec |
| No `any` / `@ts-ignore` / TODO / hard-coded UI strings / physical classes | PASS | ESLint rules + check-rtl + check-i18n |
| Layer structure & boundaries | PASS | every layer has `nuxt.config.ts`, en/ar parity, `check-boundaries` OK |
| Token security, cookie stripping, CSRF, single-flight refresh, outage keeps session | PASS | `refresh.test.ts`, `bff-headers.test.ts`, CSRF verified with curl (403 without header) |
| Redirects both ways, open-redirect rejection, `/no-access` | PASS | E2E `auth` + `rbac` |
| Per-role menus/widgets/buttons/actions, 403 view, 403 toast + `/me`, role CRUD | PASS | E2E `rbac`, Nuxt-env row-action tests |
| Arabic: `dir=rtl` from first paint, sidebar right, Arabic font, numerals | PASS | E2E `theme` (dir at DOMContentLoaded), visual screenshots, `format.test.ts` |
| Light/dark/system everywhere, no theme flash | PASS | color-mode cookie + loading template; visual screenshots in both schemes |
| Appearance options live + persisted + reset; phone visit keeps desktop sidebar state | PASS | E2E `theme` |
| Error cases via `/dev/errors` | PASS | E2E `errors` (401, 403, 409, 422, 429, 500, 503, 404) |
| Home KPIs + 4 chart types with skeleton/empty/error, grid reflow | PASS | visual screenshots; viewer hides revenue widgets (E2E) |
| Users CRUD, search/filter/sort/paginate/URL sync, CSV, profile, avatar, password | PASS | E2E `features` |
| Lighthouse budgets | PASS | `docs/perf.json`: login 100/96/100, home 98/96/96, CLS 0 |
| `pnpm new:feature demo` builds and appears behind its permission | PASS (typecheck + lint + boundaries on a generated `demo-items` layer, then deleted) | |
| Screenshot reviews | DONE | Fixed: neutral swatch invisible, chart series color clash (secondary vs violet), sidebar collapse race, mobile menu |

## Open items

- Docker image build/run not verified here (no daemon).
- Composables unit coverage is reported, not enforced (decision 18).
