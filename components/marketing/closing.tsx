import { useTranslations } from 'next-intl'
import { KeyRound, FileLock2, ScrollText, Timer, ShieldCheck, Lock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { stagger } from '@/lib/utils'
import { Band } from './band'
import { CreateLink } from './create-link'

const SECURITY_ICONS = [KeyRound, FileLock2, ScrollText, Timer, ShieldCheck, Lock]

export function HowItWorks() {
  const t = useTranslations('how')
  const steps = t.raw('steps') as { title: string; text: string }[]
  return (
    <Band tone="mist" edge="rise">
      <div className="wrap py-24">
        <h2 data-reveal="mask" className="display-2">{t('title')}</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} data-reveal="pop" style={{ ...stagger(i * 2), ['--step' as string]: `${i * 2.5}rem` }} className="md:mt-[var(--step)]">
              <span aria-hidden className="font-display text-5xl font-semibold text-signal">{i + 1}</span>
              <h3 className="display-3 mt-3">{s.title}</h3>
              <p className="mt-2 text-muted-fg">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </Band>
  )
}

export function Security() {
  const t = useTranslations('security')
  const items = t.raw('items') as { title: string; text: string }[]
  return (
    <Band tone="night" edge="fall" id="security">
      <div className="wrap grid gap-12 py-24 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <h2 data-reveal="mask" className="display-2">{t('title')}</h2>
          <p data-reveal="rise" className="lede mt-6">{t('lede')}</p>
        </div>
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {items.map((item, i) => {
            const Icon = SECURITY_ICONS[i]
            return (
              <li key={item.title} data-reveal="rise" style={stagger(i % 2)}>
                <Icon aria-hidden className="size-5 text-jade" />
                <h3 className="mt-3 font-sans text-lg font-semibold tracking-normal">{item.title}</h3>
                <p className="mt-1 text-muted-fg">{item.text}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </Band>
  )
}

export function Faq() {
  const t = useTranslations('faq')
  const items = t.raw('items') as { q: string; a: string }[]
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  }
  return (
    <Band tone="paper" edge="rise">
      <div className="wrap grid gap-10 py-24 lg:grid-cols-[0.7fr_1.3fr]">
        <h2 data-reveal="mask" className="display-2">{t('title')}</h2>
        <div className="border-t border-line">
          {items.map((i) => (
            <details key={i.q} data-reveal="right" className="group border-b border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium [&::-webkit-details-marker]:hidden">
                {i.q}
                <span aria-hidden className="size-2.5 shrink-0 rotate-45 border-b-2 border-r-2 border-current transition-transform group-open:-rotate-135" />
              </summary>
              <p className="max-w-2xl pb-5 text-muted-fg">{i.a}</p>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
    </Band>
  )
}

export function FinalCta() {
  const t = useTranslations('cta')
  const nav = useTranslations('nav')
  return (
    <Band tone="deep" edge="chevron">
      <div className="wrap py-28 pb-40 text-center">
        <h2 data-reveal="mask" className="display-2 mx-auto max-w-3xl">{t('title')}</h2>
        <p data-reveal="rise" className="lede mx-auto mt-5">{t('lede')}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/demo" data-reveal="pop" style={stagger(1)} className="btn btn-primary">{t('demo')}</Link>
          <CreateLink data-reveal="pop" style={stagger(2)} className="btn btn-ghost">{nav('create')}</CreateLink>
          <Link href="/contact" data-reveal="pop" style={stagger(3)} className="btn btn-ghost">{t('talk')}</Link>
        </div>
      </div>
    </Band>
  )
}
