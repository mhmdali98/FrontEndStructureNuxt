# Backend contract

The frontend never talks to your API directly. The browser calls the **BFF** (Nitro routes in
`layers/core/server`), which keeps tokens server-side and forwards to `NUXT_API_BASE`.

- JSON is **camelCase** (a snake_case transform exists in `api-adapters.ts` behind one flag).
- Paths below are relative to `NUXT_API_BASE`.
- The client sends `Accept-Language` (`en` / `ar`) and `X-Request-Id`.
- The backend may send `Retry-After` (429) and `X-Permissions-Version` (any response): when the
  version changes the UI refetches `/auth/me`.

## Errors

Every non-2xx body:

```ts
interface ApiErrorBody { message: string; code?: string; errors?: Record<string, string[]>; traceId?: string }
```

- `422`: `errors` keys are request field paths (`email`, `address.city`, `items.0.name`).
- Laravel `{ message, errors }`, RFC 9457 ProblemDetails and generic `{ error }` bodies are also understood.
- `503` with `code: "MAINTENANCE"` sends users to `/maintenance`.

## Types

```ts
interface TokenPair { accessToken: string; refreshToken?: string; expiresIn?: number; tokenType?: 'Bearer' }
interface AuthUser { id: string; name: string; email: string; avatarUrl: string | null; phone: string | null; locale: 'en' | 'ar'; createdAt: string }
interface MeResponse { user: AuthUser; roles: string[]; permissions: string[]; permissionsVersion?: string; preferences?: { appearance?: Partial<AppearanceSettings> } }
interface Paginated<T> { data: T[]; meta: { page: number; perPage: number; total: number; lastPage: number } }
type User = AuthUser & { status: 'active' | 'inactive' | 'invited'; roles: { id: string; name: string; label: string }[]; lastLoginAt: string | null }
interface Role { id: string; name: string; label: string; permissions: string[]; usersCount: number; system: boolean }
```

Permissions are `<resource>.<action>` strings (`users.view`), with `*` and `<resource>.*` wildcards.
Other formats (e.g. Spatie's `"edit articles"`) are mapped by `normalizePermissions()`.

## List queries

`?page=1&perPage=10&sort=-createdAt,name&search=ali&filter[status]=active,invited&filter[role]=r1`
(`serializeListParams({ repeatedKeys: true })` switches to `filter[role][]=r1&filter[role][]=r2`).
`toPaginated()` also accepts Laravel paginator JSON.

## Endpoints

| Endpoint | Request | Response |
|---|---|---|
| POST `/auth/login` | `{ email, password, remember }` | `TokenPair` (optionally `user`); 401 `INVALID_CREDENTIALS`, 422, 429 |
| POST `/auth/refresh` | `{ refreshToken }` | `TokenPair` (rotation allowed); 400/401 ends the session |
| POST `/auth/logout` | `{ refreshToken?, allDevices? }` | 204 |
| GET `/auth/me` | — | `MeResponse` |
| POST `/auth/forgot-password` | `{ email }` | always 202 |
| POST `/auth/reset-password` | `{ token, email, password, passwordConfirmation }` | 204; 401/422 |
| GET `/health` | — | 200 `{ status: 'ok' }` or 503 `{ code: 'MAINTENANCE' }` |
| PATCH `/profile` | `{ name?, phone?, locale? }` | `AuthUser` |
| POST `/profile/avatar` | multipart `avatar` | `{ avatarUrl }` |
| PUT `/profile/password` | `{ currentPassword, password, passwordConfirmation }` | 204; 422 |
| PUT `/profile/preferences` | `{ appearance }` | 204 |
| GET `/dashboard/summary?range=7d\|30d\|90d` | — | `{ kpis: { key, value, previous, unit, trend[] }[] }` — only KPIs the caller may see |
| GET `/dashboard/revenue` · `/orders-by-status` · `/traffic-sources` | `range` | `{ points }` · `{ points }` · `{ items }` |
| GET `/dashboard/activity?limit=8` | — | `{ items: { id, type, actor, target?, createdAt }[] }` |
| GET `/users` · GET `/users/:id` | list params | `Paginated<User>` · `User` |
| POST `/users` · PATCH `/users/:id` | `{ name, email, phone?, roleIds, status, password? }` | 201 `User` · `User`; 409/422 |
| DELETE `/users/:id` · POST `/users/bulk-delete` | — · `{ ids }` | 204 |
| GET `/roles/options` | — (allowed with `users.view`) | `{ id, name, label }[]` |
| GET `/roles` · GET `/permissions` | — | `Role[]` · `{ key, group, labelKey }[]` |
| POST `/roles` · PATCH `/roles/:id` · DELETE `/roles/:id` | `{ name, label, permissions }` | 201 · 200 · 204; 409 (in use / system), 422 |

## Refresh tokens

Refresh is optional: without `refreshToken`/`expiresIn` the BFF never refreshes proactively and the
first upstream 401 ends the session. If you rotate refresh tokens, keep a short **reuse grace
window** (the mock uses 10 s) — the BFF also caches rotated pairs for 60 s per process.

## Mock backend

`mock-api/` implements this contract under `/api/mock/**` with ~250 seeded users, 5 roles and 90 days
of metrics. Enable with `NUXT_API_MOCK=true` (in-process) or point `NUXT_API_BASE` at
`/api/mock` with `NUXT_MOCK_ROUTES=true` (real HTTP). Mock-only: `POST /__reset`,
`GET /__simulate/:status`.
