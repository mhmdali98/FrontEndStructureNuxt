import { z } from 'zod'

type T = (key: string, params?: Record<string, unknown>) => string

export const createProfileSchema = (t: T) => z.object({
  name: z.string().trim().min(2, t('validation.min', { min: 2 })).max(80, t('validation.max', { max: 80 })),
  phone: z.string().trim().regex(/^[+\d\s()-]{6,20}$/, t('validation.phone')).or(z.literal('')),
  locale: z.enum(['en', 'ar']),
})

export const createPasswordSchema = (t: T) => z.object({
  currentPassword: z.string().min(1, t('validation.required')),
  password: z.string().min(8, t('validation.passwordMin')),
  passwordConfirmation: z.string().min(1, t('validation.required')),
}).refine(v => v.password === v.passwordConfirmation, { message: t('validation.passwordMatch'), path: ['passwordConfirmation'] })

export const AVATAR_MAX_BYTES = 1024 * 1024
