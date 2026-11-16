import type { User } from '#layers/users/shared/types/users'

const BOM = String.fromCharCode(0xFEFF)
const escape = (v: string): string => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

/** Pure CSV builder for the current page. */
export function usersToCsv(users: User[], headers: { name: string, email: string, roles: string, status: string, createdAt: string }): string {
  const rows = [[headers.name, headers.email, headers.roles, headers.status, headers.createdAt]]
  for (const u of users) rows.push([u.name, u.email, u.roles.map(r => r.label).join(' / '), u.status, u.createdAt])
  return `${BOM}${rows.map(r => r.map(escape).join(',')).join('\n')}`
}

export function useUsersExport() {
  const { t } = useI18n()
  return {
    exportCsv(users: User[]): void {
      const csv = usersToCsv(users, {
        name: t('users.fields.name'),
        email: t('users.fields.email'),
        roles: t('users.fields.roles'),
        status: t('users.fields.status'),
        createdAt: t('users.fields.createdAt'),
      })
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
  }
}
