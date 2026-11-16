const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>()

function memo<T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(key: string, make: () => T): T {
  let f = cache.get(key) as T | undefined
  if (!f) {
    f = make()
    cache.set(key, f)
  }
  return f
}

/** Builds the BCP-47 tag; numbering system is pinned to avoid ICU differences. */
export function localeTag(locale: string, numerals: 'latn' | 'arab'): string {
  return locale === 'ar' ? `ar-u-nu-${numerals}` : 'en-US'
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1],
]

/** Pure formatter factory (unit-testable without Nuxt). */
export function createFormatter(tag: string, currency = 'USD') {
  return {
    number: (v: number, opts?: Intl.NumberFormatOptions) => memo(`n|${tag}|${JSON.stringify(opts ?? {})}`, () => new Intl.NumberFormat(tag, opts)).format(v),
    compact: (v: number) => memo(`c|${tag}`, () => new Intl.NumberFormat(tag, { notation: 'compact', maximumFractionDigits: 1 })).format(v),
    currency: (v: number, opts?: { compact?: boolean }) => memo(`$|${tag}|${currency}|${opts?.compact ? 1 : 0}`, () => new Intl.NumberFormat(tag, {
      style: 'currency',
      currency,
      maximumFractionDigits: opts?.compact ? 1 : 0,
      notation: opts?.compact ? 'compact' : 'standard',
    })).format(v),
    percent: (v: number, digits = 1) => memo(`%|${tag}|${digits}`, () => new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: digits })).format(v),
    date: (v: string | number | Date, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
      memo(`d|${tag}|${JSON.stringify(opts)}`, () => new Intl.DateTimeFormat(tag, opts)).format(new Date(v)),
    datetime: (v: string | number | Date) => memo(`dt|${tag}`, () => new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeStyle: 'short' })).format(new Date(v)),
    relative: (v: string | number | Date, now: number = Date.now()) => {
      const diff = (new Date(v).getTime() - now) / 1000
      const rtf = memo(`r|${tag}`, () => new Intl.RelativeTimeFormat(tag, { numeric: 'auto' })) as Intl.RelativeTimeFormat
      for (const [unit, secs] of RELATIVE_UNITS) {
        if (Math.abs(diff) >= secs || unit === 'second') return rtf.format(Math.round(diff / secs), unit)
      }
      return rtf.format(0, 'second')
    },
  }
}

export type Formatter = ReturnType<typeof createFormatter>

/** Locale- and numerals-aware Intl formatters. */
export function useFormat() {
  const { locale } = useNuxtApp().$i18n
  const appearance = useAppearanceStore()
  const fmt = computed(() => createFormatter(localeTag(locale.value, appearance.settings.numerals)))
  return {
    number: (v: number, opts?: Intl.NumberFormatOptions) => fmt.value.number(v, opts),
    compact: (v: number) => fmt.value.compact(v),
    currency: (v: number, opts?: { compact?: boolean }) => fmt.value.currency(v, opts),
    percent: (v: number, digits?: number) => fmt.value.percent(v, digits),
    date: (v: string | number | Date, opts?: Intl.DateTimeFormatOptions) => fmt.value.date(v, opts),
    datetime: (v: string | number | Date) => fmt.value.datetime(v),
    relative: (v: string | number | Date) => fmt.value.relative(v),
  }
}
