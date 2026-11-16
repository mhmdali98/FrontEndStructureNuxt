/**
 * Accepts only same-origin absolute paths (`/x`), never `//host` or `/\host`.
 * Returns `undefined` for anything else so callers fall back to the home route.
 */
export function safeRedirect(value: unknown): string | undefined {
  const v = Array.isArray(value) ? value[0] : value
  if (typeof v !== 'string' || v.length === 0) return undefined
  if (!v.startsWith('/')) return undefined
  if (v.startsWith('//') || v.startsWith('/\\')) return undefined
  // Reject control characters (header/URL smuggling).
  for (let i = 0; i < v.length; i++) if (v.charCodeAt(i) < 0x20) return undefined
  if (v.startsWith('/login')) return undefined
  return v
}
