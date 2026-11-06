'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { animate, useReducedMotion } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { formatMoney, formatNumber } from '@/lib/format'
import { estimateRoi, WORK_WEEKS_PER_YEAR } from '@/lib/metrics/roi'
import { Band } from './band'

export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (reduced) return
    const controls = animate(shown, value, { duration: 0.45, ease: [0.22, 0.8, 0.2, 1], onUpdate: setShown })
    return () => controls.stop()
    // Only a new target restarts the animation; `shown` is where it starts from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced])
  return <>{format(reduced ? value : shown)}</>
}

function Slider({ label, value, min, max, step, onChange, suffix }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (n: number) => void
  suffix?: string
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-muted-fg">{label}</span>
        <span className="font-display text-xl font-semibold">{value}{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-11 w-full cursor-pointer accent-[#047857]"
      />
    </label>
  )
}

function Bar({ label, hours, max, tone, format }: { label: string; hours: number; max: number; tone: string; format: (n: number) => ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[0.9375rem]">
        <span className="text-muted-fg">{label}</span>
        <span className="font-medium">{format(hours)}</span>
      </div>
      <div className="mt-1 h-2.5 bg-line">
        <div className={`h-full rounded-r-[4px] transition-[width] duration-500 ${tone}`} style={{ width: `${max ? (hours / max) * 100 : 0}%` }} />
      </div>
    </div>
  )
}

export function ImpactCalculator() {
  const t = useTranslations('impact')
  const locale = useLocale()
  const [employees, setEmployees] = useState(25)
  const [adminHours, setAdminHours] = useState(3)
  const [savedPercent, setSavedPercent] = useState(25)
  const [hourlyCost, setHourlyCost] = useState('')

  const cost = Number(hourlyCost) || 0
  const result = estimateRoi({ employees, adminHours, savedPercent, hourlyCost: cost })
  const before = employees * adminHours * WORK_WEEKS_PER_YEAR
  const whole = (n: number) => formatNumber(locale, n)
  const money = (n: number) => formatMoney(locale, n, 0)

  return (
    <Band tone="paper" edge="fall" id="impact">
      <div className="wrap py-24">
        <h2 data-reveal="mask" className="display-2 max-w-3xl">{t('title')}</h2>
        <p data-reveal="rise" className="lede mt-6">{t('lede')}</p>

        <div className="mt-14 grid gap-14 lg:grid-cols-2">
          <div data-reveal="left" className="space-y-6">
            <Slider label={t('employees')} value={employees} min={5} max={500} step={5} onChange={setEmployees} />
            <Slider label={t('adminHours')} value={adminHours} min={0.5} max={10} step={0.5} onChange={setAdminHours} />
            <Slider label={t('saved')} value={savedPercent} min={5} max={60} step={5} suffix="%" onChange={setSavedPercent} />
            <label className="block">
              <span className="text-muted-fg">{t('cost')}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.5"
                value={hourlyCost}
                onChange={(e) => setHourlyCost(e.target.value)}
                className="mt-2 h-12 w-full border border-line bg-raised px-3 focus-visible:outline-2"
              />
            </label>
          </div>

          <div data-reveal="right" aria-live="polite">
            <p className="font-display font-semibold leading-none text-[clamp(4rem,10vw,8rem)]" style={{ fontStretch: '118%' }}>
              <AnimatedNumber value={result.yearlyHours} format={whole} />
            </p>
            <p className="mt-2 text-xl">{t('resultHours')}</p>
            <p className="mt-4 text-muted-fg">{t('resultWeeks', { weeks: whole(result.workWeeksPerYear) })}</p>
            {cost > 0 && <p className="mt-1 text-muted-fg">{t('resultCost', { amount: money(result.yearlyCost) })}</p>}

            <figure className="mt-8 space-y-3">
              <figcaption className="text-sm font-medium">{t('chartLabel')}</figcaption>
              <Bar label={t('today')} hours={before} max={before} tone="bg-[#8ea3b2]" format={whole} />
              <Bar label={t('after')} hours={before - result.yearlyHours} max={before} tone="bg-[#047857]" format={whole} />
            </figure>
          </div>
        </div>
        <p className="mt-10 max-w-3xl border-l-2 border-line pl-4 text-[0.9375rem] text-muted-fg">{t('disclaimer', { weeks: WORK_WEEKS_PER_YEAR })}</p>
      </div>
    </Band>
  )
}
