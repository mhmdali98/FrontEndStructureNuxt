/** Current text direction from the active i18n locale. */
export function useAppDirection() {
  const { locale, locales } = useNuxtApp().$i18n
  const dir = computed<'ltr' | 'rtl'>(() => {
    const current = locales.value.find(l => l.code === locale.value)
    return current?.dir === 'rtl' ? 'rtl' : 'ltr'
  })
  return { dir, isRtl: computed(() => dir.value === 'rtl') }
}
