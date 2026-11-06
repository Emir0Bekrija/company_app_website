import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(200),
  company: z.string().trim().max(120).optional().default(''),
  size: z.string().trim().max(10).optional().default(''),
  message: z.string().trim().min(5).max(3000),
  plan: z.enum(['essentials', 'team', 'business', 'enterprise']).optional(),
  locale: z.enum(['en', 'bs']).optional(),
  website: z.string().max(200).optional().default(''),
})

export type ContactMessage = z.infer<typeof contactSchema>

/** Line breaks in a header value would let a sender inject extra mail headers. */
export const headerSafe = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()

export function buildMail(m: ContactMessage) {
  const lines = [
    `Name: ${m.name}`,
    `Email: ${m.email}`,
    ...(m.company ? [`Company: ${m.company}`] : []),
    ...(m.size ? [`Employees: ${m.size}`] : []),
    ...(m.plan ? [`Plan: ${m.plan}`] : []),
    ...(m.locale ? [`Language: ${m.locale}`] : []),
    '',
    m.message,
  ]
  return {
    subject: headerSafe(`Website enquiry from ${m.name}`),
    replyTo: headerSafe(m.email),
    text: lines.join('\n'),
  }
}

/**
 * Rate-limit key from X-Forwarded-For. The hosting proxy appends the address it saw, so
 * only the last entry can be trusted: anything before it is whatever the sender wrote.
 * App Service also adds the port, which changes per connection and must be dropped.
 */
export function clientKey(forwardedFor: string | null) {
  const last = forwardedFor?.split(',').at(-1)?.trim()
  if (!last) return 'unknown'
  return /^\d+\.\d+\.\d+\.\d+:\d+$/.test(last) ? last.slice(0, last.lastIndexOf(':')) : last
}

/** A small fixed-window limiter. Per server instance, which suits a low-volume form. */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  return (key: string, now = Date.now()) => {
    if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
    const entry = hits.get(key)
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }
    entry.count++
    return entry.count <= limit
  }
}
