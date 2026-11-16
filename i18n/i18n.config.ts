/** Arabic plural categories: zero / one / two / few / many / other. */
function arabicPlural(choice: number, choicesLength: number): number {
  if (choicesLength < 6) return Math.min(choice === 0 ? 0 : choice === 1 ? 1 : 2, choicesLength - 1)
  const n = Math.abs(choice)
  const mod100 = n % 100
  if (n === 0) return 0
  if (n === 1) return 1
  if (n === 2) return 2
  if (mod100 >= 3 && mod100 <= 10) return 3
  if (mod100 >= 11 && mod100 <= 99) return 4
  return 5
}

export default defineI18nConfig(() => ({
  fallbackLocale: 'en',
  pluralRules: { ar: arabicPlural },
  missingWarn: false,
  fallbackWarn: false,
  numberFormats: {
    en: { currency: { style: 'currency', currency: 'USD' } },
    ar: { currency: { style: 'currency', currency: 'USD' } },
  },
  datetimeFormats: {
    en: { short: { dateStyle: 'medium' } },
    ar: { short: { dateStyle: 'medium' } },
  },
}))
