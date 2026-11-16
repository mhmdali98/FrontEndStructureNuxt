# Nexus Admin — Nuxt 4 dashboard starter

Production-ready admin dashboard frontend: **Nuxt 4 + TypeScript**, **Nuxt UI 4 / Tailwind CSS 4**,
**Pinia + Pinia Colada**, feature layers, backend-driven RBAC, English/Arabic with full RTL,
light/dark/system modes and a live appearance customizer. Runs out of the box against a built-in mock backend.

## Quick start

```bash
nvm use            # Node 24 (22.22+ also works)
npm i -g pnpm@12
pnpm install
pnpm dev:mock      # http://localhost:3000
```

Demo accounts (password `Password123!`):

| Email | Access |
|---|---|
| `admin@demo.test` | everything (`*`) |
| `manager@demo.test` | dashboard, reports, users view/create/update, roles view — prefers Arabic |
| `viewer@demo.test` | dashboard, users view |
| `noaccess@demo.test` | no permissions → `/no-access` |

## Features

- **Auth via a BFF**: login, logout (+ all devices), forgot/reset password, remember me, sealed httpOnly
  session cookie, rotation-safe single-flight token refresh, guards, safe redirects, cross-tab sync,
  session-expired flow.
- **RBAC**: permissions from `/auth/me` drive routes (`definePageMeta({ permissions })`), menus,
  command palette, widgets, buttons (`<Can>`, `v-can`) and table row actions; roles management UI.
- **i18n**: English + Arabic (RTL from the first paint, logical utilities only, IBM Plex Sans Arabic,
  Western or Arabic-Indic numerals).
- **Theming**: primary/secondary/neutral color, presets, radius, color mode, sidebar or top-nav layout,
  sidebar style (classic/floating/inset) and collapse mode, navbar style/position, content width,
  density — applied live and persisted in a cookie.
- **Pages**: dashboard (KPIs + area, donut, stacked-bar charts + activity), users CRUD, roles,
  profile, security, settings, 401/403/404/429/500/503, maintenance, offline banner, no-access, error lab.
- **Errors**: one `ApiError` shape and one policy (`handleApiError`) → translated toasts, inline
  form errors (422), maintenance redirect, trace IDs.

## Scripts

| Script | Purpose |
|---|---|
| `dev` / `dev:mock` | dev server (real backend / mock) |
| `build`, `preview`, `preview:mock` | production build and server |
| `lint`, `lint:fix` | ESLint + feature boundary check |
| `check:rtl`, `check:i18n`, `check:boundaries` | physical-direction classes, en/ar key parity, layer isolation |
| `typecheck` | `nuxt typecheck` |
| `test`, `test:coverage`, `test:e2e` | Vitest (unit + Nuxt env), Playwright |
| `check:bundle`, `perf` | bundle budgets, Lighthouse budgets (writes `docs/*.json`) |
| `new:feature <name>` | scaffold a feature layer |

## Environment

See `.env.example`. Essentials: `NUXT_APP_SECRET` (≥ 32 chars, **required in production**) and
`NUXT_API_BASE`. Mock: `NUXT_API_MOCK=true`.

## Connecting a real backend

1. Implement the contract in [`docs/BACKEND_CONTRACT.md`](docs/BACKEND_CONTRACT.md) (Laravel paginators,
   Laravel/RFC 9457 errors and Spatie-style permissions are understood out of the box).
2. Set `NUXT_API_BASE`, `NUXT_APP_SECRET`, `NUXT_API_MOCK=false`.
3. Delete `'./mock-api'` from `extends` in `nuxt.config.ts` to drop the mock from production builds.

## Adding a feature

```bash
pnpm new:feature invoices
```

Creates `layers/invoices` (page, API module, query keys, navigation entry, permission type, en/ar
messages, test). Grant `invoices.view` to a role and it appears in the menu. Delete the folder to remove it.
Rules: prefix everything (`Invoices*`, `useInvoices*`, `invoices.*`), import only from `#layers/core`.

## Permissions how-to

```vue
<script setup lang="ts">
definePageMeta({ permissions: ['users.view'] })        // route guard + menu visibility
const { can } = usePermissions()
</script>
<template>
  <Can permission="users.create"><UButton label="Add" /></Can>
  <UButton v-can:disable="'users.update'" label="Edit" />
</template>
```

UI gating is UX only — the backend must enforce every permission.

## Theming how-to

Defaults live in `DEFAULT_APPEARANCE` (`layers/core/shared/types/appearance.ts`); the brand palette is
in `app/assets/css/main.css`. Every setting is available to users in **Settings → Appearance** and
in the customizer (palette icon in the navbar).

## Deployment

SPA served by a Nitro Node server (the BFF needs a server; static hosting is not supported):

```bash
pnpm build && NUXT_APP_SECRET=… NUXT_API_BASE=… node .output/server/index.mjs
# or
docker build -t nexus-admin .
docker run -p 3000:3000 -e NUXT_APP_SECRET=… -e NUXT_API_BASE=… nexus-admin
```

The session cookie is `Secure`: test at `http://localhost` or behind TLS
(`NUXT_SESSION_COOKIE_SECURE=false` only for non-TLS intranet testing).

## Measured performance

Production build, mock API, 0 ms latency, Lighthouse desktop (median of 3) — see `docs/perf.json`:

| Page | Performance | Accessibility | Best practices | CLS |
|---|---|---|---|---|
| `/login` | 100 | 96 | 100 | 0 |
| `/` | 98 | 96 | 96 | 0 |

Entry JS 73 KB gzip; largest chunk 59 KB gzip (`docs/bundle.json`).

## Docs

[Architecture](docs/ARCHITECTURE.md) · [Backend contract](docs/BACKEND_CONTRACT.md) ·
[Decisions](docs/DECISIONS.md) · [Progress & DoD audit](docs/PROGRESS.md) · [Build prompt](docs/PROMPT.md)

---

<div dir="rtl">

## البدء السريع (عربي)

لوحة تحكم جاهزة مبنية على **Nuxt 4 وTypeScript** مع **Nuxt UI وTailwind CSS** و**Pinia**، تدعم العربية
(من اليمين لليسار) والإنجليزية، والوضع الداكن والفاتح، وصلاحيات تأتي من الباك إند.

```bash
npm i -g pnpm@12
pnpm install
pnpm dev:mock
```

ثم افتح `http://localhost:3000` وسجّل الدخول بأحد الحسابات التجريبية أعلاه (كلمة المرور `Password123!`).

- **الربط مع الباك إند:** اتبع العقد في `docs/BACKEND_CONTRACT.md`، ثم اضبط `NUXT_API_BASE`
  و`NUXT_APP_SECRET` واجعل `NUXT_API_MOCK=false`.
- **إضافة ميزة جديدة:** `pnpm new:feature invoices` تنشئ طبقة كاملة (صفحة، API، ترجمة، صلاحية، اختبار).
- **الصلاحيات:** `definePageMeta({ permissions: ['users.view'] })` للصفحات، و`<Can>` و`v-can` للأزرار والإجراءات.
- **المظهر:** من الإعدادات ← المظهر أو أيقونة لوحة الألوان في الشريط العلوي: اللون الرئيسي والثانوي،
  شكل القائمة الجانبية وشريط التنقل، عرض المحتوى، الكثافة، والأرقام العربية.

</div>
