'use client'

import { useState, type FormEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { track } from '@/lib/analytics'
import { brand } from '@/lib/brand'

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'unavailable' | 'rateLimited'

const FIELD = 'mt-1.5 w-full border border-line bg-raised px-3 py-3 focus-visible:outline-2'

export function ContactForm({ plan }: { plan?: string }) {
  const t = useTranslations('contactPage')
  const locale = useLocale()
  const [status, setStatus] = useState<Status>('idle')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')
    try {
      const body = Object.fromEntries(new FormData(form))
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, plan, locale }),
      })
      if (res.ok) { form.reset(); setStatus('sent'); track('contact_sent'); return }
      setStatus(res.status === 503 ? 'unavailable' : res.status === 429 ? 'rateLimited' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return <p role="status" className="border-l-4 border-jade bg-raised p-5 text-lg">{t('success')}</p>
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span>{t('name')}</span><input name="name" required maxLength={100} autoComplete="name" className={FIELD} /></label>
        <label className="block"><span>{t('email')}</span><input name="email" type="email" required maxLength={200} autoComplete="email" className={FIELD} /></label>
        <label className="block"><span>{t('company')}</span><input name="company" maxLength={120} autoComplete="organization" className={FIELD} /></label>
        <label className="block"><span>{t('size')}</span><input name="size" type="number" min="1" max="100000" className={FIELD} /></label>
      </div>
      <label className="block"><span>{t('message')}</span><textarea name="message" required minLength={5} maxLength={3000} rows={6} className={FIELD} /></label>
      {/* A honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {(status === 'error' || status === 'unavailable' || status === 'rateLimited') && (
        <p role="alert" className="border-l-4 border-red-600 bg-raised p-3">{t(status, { email: brand.contactEmail })}</p>
      )}
      <button type="submit" disabled={status === 'sending'} className="btn btn-primary disabled:opacity-60">
        {t(status === 'sending' ? 'sending' : 'send')}
      </button>
      <p className="text-sm text-muted-fg"><Link href="/privacy" className="underline">{t('privacyNote')}</Link></p>
    </form>
  )
}
