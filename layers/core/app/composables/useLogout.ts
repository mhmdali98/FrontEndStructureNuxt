/** Confirm → server logout (clears the sealed session) → notify other tabs → hard reload to /login. */
export function useLogout() {
  const { confirm } = useConfirm()
  const { t } = useNuxtApp().$i18n
  const client = useApiClient()

  async function logout(options: { skipConfirm?: boolean, allDevices?: boolean } = {}): Promise<void> {
    if (!options.skipConfirm) {
      const ok = await confirm({ title: t('shell.logoutTitle'), description: t('shell.logoutDescription'), confirmLabel: t('common.logout') })
      if (!ok) return
    }
    await client.post('/auth/logout', { allDevices: options.allDevices ?? false }, { baseURL: '/api', silent: true }).catch(() => undefined)
    useAuthBroadcast().post('logout')
    reloadNuxtApp({ path: '/login', force: true })
  }

  return { logout }
}
