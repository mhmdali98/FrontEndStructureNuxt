import { z } from 'zod'

/** Shared by the login form (client) and the login route (server). Messages are i18n keys. */
export const loginSchema = z.object({
  email: z.string({ error: 'validation.required' }).trim().min(1, 'validation.required').email('validation.email'),
  password: z.string({ error: 'validation.required' }).min(1, 'validation.required'),
  remember: z.boolean().optional().default(false),
})

export type LoginInput = z.infer<typeof loginSchema>
