'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { track } from '@/lib/analytics'
import { formatMoney } from '@/lib/format'
import { monthlyTotal, PLAN_CTA_MODE, PLANS, SEATS, type Billing, type Plan } from '@/lib/pricing/plans'
import { cn, stagger } from '@/lib/utils'
import { CreateLink } from '../marketing/create-link'

function Price({ value }: { value: string }) {
  const reduced = useReducedMotion()
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="inline-block"
          initial={reduced ? false : { y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? undefined : { y: '-100%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

function PlanCard({ plan, billing, seats, order }: { plan: Plan; billing: Billing; seats: number; order: number }) {
  const t = useTranslations('pricing')
  const locale = useLocale()
  const money = (n: number) => formatMoney(locale, n, 0)
  const id = plan.id
  const highlights = t.raw(`plans.${id}.highlights`) as string[]
  const total = monthlyTotal(plan, billing, seats)
  const cta = cn('btn mt-6 w-full', plan.popular ? 'btn-primary' : 'btn-ghost')

  return (
    // The popular card stretches past the row, and its extra padding keeps its content level with the others.
    <div data-reveal="pop" style={stagger(order)} className={cn('fluent glass-still flex h-full flex-col p-6', plan.popular ? 'plan-popular xl:-my-5 xl:h-auto xl:py-11' : 'glass-quiet')}>
      <div className="flex min-h-7 items-start justify-between gap-2">
        <h3 className="display-3 !text-2xl">{t(`plans.${id}.name`)}</h3>
        {plan.popular && <span className="whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[0.8125rem] font-semibold text-[#3b1578]">{t('popular')}</span>}
      </div>
      <p className="mt-2 min-h-12 text-[0.9375rem] leading-snug text-muted-fg">{t(`plans.${id}.for`)}</p>

      <p className="mt-5 font-display text-5xl font-semibold" style={{ fontStretch: '112%' }}>
        {plan.price ? <Price value={money(plan.price[billing])} /> : <span className="text-4xl">{t('custom')}</span>}
      </p>
      <p className="mt-1 text-sm text-muted-fg">{plan.price ? t('perEmployee') : t('customNote')}</p>
      <p className="mt-3 min-h-10 text-sm leading-snug">
        {total !== null && t(billing === 'yearly' ? 'totalYearly' : 'total', { amount: money(total), seats })}
      </p>

      {id === 'enterprise' || PLAN_CTA_MODE === 'contact'
        ? <Link href={{ pathname: '/contact', query: { plan: id } }} className={cta}>{t(`plans.${id}.cta`)}</Link>
        : <CreateLink plan={id} className={cta}>{t(`plans.${id}.cta`)}</CreateLink>}

      <ul className="mt-6 space-y-2.5 text-[0.9375rem] leading-snug">
        {highlights.map((h) => (
          <li key={h} className="flex items-start gap-2.5"><Check aria-hidden className={cn('mt-0.5 size-4 shrink-0', plan.popular ? 'text-[#fbcfe8]' : 'text-jade')} />{h}</li>
        ))}
      </ul>
    </div>
  )
}

export function PricingCards() {
  const t = useTranslations('pricing')
  const [billing, setBilling] = useState<Billing>('yearly')
  const [seats, setSeats] = useState<number>(SEATS.initial)

  return (
    <div>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div role="radiogroup" aria-label={t('billingLabel')} className="fluent fluent-control glass-quiet glass-still inline-flex p-1">
            {(['monthly', 'yearly'] as const).map((b) => (
              <button
                key={b}
                type="button"
                role="radio"
                aria-checked={billing === b}
                onClick={() => { setBilling(b); track('billing_changed', { billing: b }) }}
                className={cn('min-h-11 rounded-[calc(var(--radius-control)-0.25rem)] px-5 font-medium transition-colors', billing === b ? 'bg-fg text-band' : 'text-muted-fg hover:text-fg')}
              >
                {t(b)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-fg">{t('saveNote')}</p>
        </div>
        <label className="block w-full md:max-w-sm">
          <span className="flex items-baseline justify-between gap-4">
            <span className="text-muted-fg">{t('seats')}</span>
            <span className="font-display text-xl font-semibold">{seats}</span>
          </span>
          <input
            type="range"
            min={SEATS.min}
            max={SEATS.max}
            step={5}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className="mt-1 h-11 w-full cursor-pointer accent-[#10b981]"
          />
        </label>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
        {PLANS.map((plan, i) => <PlanCard key={plan.id} plan={plan} billing={billing} seats={seats} order={i} />)}
      </div>
      <p className="mt-10 max-w-3xl text-muted-fg">{t('everyPlan')}</p>
    </div>
  )
}
