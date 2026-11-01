import { describe, expect, it } from 'vitest'
import { isValidEmail, isValidPhone } from './validation'

describe('isValidPhone (mirrors backend _is_valid_phone)', () => {
  it.each(['9800000000', '+977-980-000-0000', '4412345', '441-2345'])('accepts %s', (p) => {
    expect(isValidPhone(p)).toBe(true)
  })
  it.each(['', '12345', '98000000', 'abc'])('rejects %s', (p) => {
    expect(isValidPhone(p)).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts a normal address and rejects junk', () => {
    expect(isValidEmail('ram@example.com')).toBe(true)
    expect(isValidEmail('ram@example')).toBe(false)
    expect(isValidEmail('ram example.com')).toBe(false)
  })
})
