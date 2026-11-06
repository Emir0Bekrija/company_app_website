import { NextResponse, type NextRequest } from 'next/server'
import nodemailer from 'nodemailer'
import { brand } from '@/lib/brand'
import { buildMail, clientKey, contactSchema, createRateLimiter } from '@/lib/contact'

const allow = createRateLimiter(5, 10 * 60 * 1000)

export async function POST(request: NextRequest) {
  if (!allow(clientKey(request.headers.get('x-forwarded-for')))) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const parsed = contactSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  // A bot filled the honeypot. Report success so it learns nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true })

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO, CONTACT_FROM } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const port = Number(SMTP_PORT ?? 587)
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })

  try {
    await transport.sendMail({
      from: CONTACT_FROM || SMTP_USER,
      to: CONTACT_TO || brand.contactEmail,
      ...buildMail(parsed.data),
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Contact form delivery failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'delivery_failed' }, { status: 502 })
  }
}
