import { describe, expect, it } from 'vitest'
import { buildMail, clientKey, contactSchema, createRateLimiter, headerSafe } from '@/lib/contact'

const valid = { name: 'Ana', email: 'ana@example.com', message: 'Hello there' }

describe('contact form', () => {
  it('accepts a valid message and rejects a bad address', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true)
    expect(contactSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false)
  })

  it('strips line breaks from header values', () => {
    expect(headerSafe('Ana\r\nBcc: x@example.com')).toBe('Ana Bcc: x@example.com')
    const mail = buildMail(contactSchema.parse({ ...valid, name: 'Ana\nBcc: x@example.com' }))
    expect(mail.subject).not.toMatch(/[\r\n]/)
  })

  it('leaves out empty optional lines', () => {
    expect(buildMail(contactSchema.parse(valid)).text).not.toContain('Company:')
  })

  it('keys on the address the proxy appended, not one the sender wrote', () => {
    expect(clientKey('6.6.6.6, 203.0.113.9')).toBe('203.0.113.9')
    expect(clientKey('203.0.113.9:51234')).toBe('203.0.113.9')
    expect(clientKey('2001:db8::1')).toBe('2001:db8::1')
    expect(clientKey(null)).toBe('unknown')
  })

  it('limits per key and recovers after the window', () => {
    const allow = createRateLimiter(2, 1000)
    expect([allow('a', 0), allow('a', 1), allow('a', 2)]).toEqual([true, true, false])
    expect(allow('b', 2)).toBe(true)
    expect(allow('a', 1001)).toBe(true)
  })
})
