import { z } from 'zod'

type T = (key: string, params?: Record<string, unknown>) => string

/** Schema factory: messages come from `t()` so they follow the active locale. */
export function createUserSchema(t: T, mode: 'create' | 'edit') {
  return z.object({
    name: z.string().trim().min(2, t('validation.min', { min: 2 })).max(80, t('validation.max', { max: 80 })),
    email: z.string().trim().min(1, t('validation.required')).email(t('validation.email')),
    phone: z.string().trim().regex(/^[+\d\s()-]{6,20}$/, t('validation.phone')).or(z.literal('')).optional(),
    roleIds: z.array(z.string()).min(1, t('validation.atLeastOne')),
    status: z.enum(['active', 'inactive', 'invited']),
    password: mode === 'create'
      ? z.string().min(8, t('validation.passwordMin'))
      : z.string().optional(),
  })
}

export type UserFormValues = z.output<ReturnType<typeof createUserSchema>>
