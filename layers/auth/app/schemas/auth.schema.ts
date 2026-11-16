import { z } from 'zod'

type T = (key: string, params?: Record<string, unknown>) => string

export const createLoginSchema = (t: T) => z.object({
  email: z.string().trim().min(1, t('validation.required')).email(t('validation.email')),
  password: z.string().min(1, t('validation.required')),
  remember: z.boolean(),
})

export const createForgotSchema = (t: T) => z.object({
  email: z.string().trim().min(1, t('validation.required')).email(t('validation.email')),
})

export const createResetSchema = (t: T) => z.object({
  password: z.string().min(8, t('validation.passwordMin')),
  passwordConfirmation: z.string().min(1, t('validation.required')),
}).refine(v => v.password === v.passwordConfirmation, { message: t('validation.passwordMatch'), path: ['passwordConfirmation'] })

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4
}
