import { describe, expect, it } from 'vitest'
import { createLoginSchema, createResetSchema, passwordStrength } from '../app/schemas/auth.schema'

const t = (k: string) => k

describe('auth schemas', () => {
  it('validates login', () => {
    expect(createLoginSchema(t).safeParse({ email: 'a@b.co', password: 'x', remember: false }).success).toBe(true)
    expect(createLoginSchema(t).safeParse({ email: 'nope', password: '', remember: false }).success).toBe(false)
  })
  it('requires matching passwords on reset', () => {
    const r = createResetSchema(t).safeParse({ password: 'Password1!', passwordConfirmation: 'Password2!' })
    expect(r.error?.issues[0]?.message).toBe('validation.passwordMatch')
  })
  it('scores password strength', () => {
    expect(passwordStrength('abc')).toBe(0)
    expect(passwordStrength('Password1')).toBe(2)
    expect(passwordStrength('Password123!')).toBe(4)
    expect(passwordStrength('Correct-Horse-9-Battery')).toBe(4)
  })
})
