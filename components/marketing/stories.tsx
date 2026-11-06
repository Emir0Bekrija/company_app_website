'use client'

import { useTranslations } from 'next-intl'
import { Bell, Check, FileSpreadsheet } from 'lucide-react'
import type { ProductShotProps } from '../demo/product-shot'
import { ProductShot, WhenNear } from '../demo/lazy'
import { cn, stagger } from '@/lib/utils'
import { Band } from './band'
import { DriftStrip } from './drift-strip'

/** `clone` is for a DriftStrip copy, which has no entrance and must be ready before it comes into view. */
function Shot({ view, theme, className, reveal = 'tilt', order = 0, clone = false }: ProductShotProps & { reveal?: 'tilt' | 'pop' | 'left' | 'right'; order?: number; clone?: boolean }) {
  const shot = <ProductShot view={view} theme={theme} className="h-full" />
  return (
    <div data-reveal={clone ? undefined : reveal} style={clone ? undefined : stagger(order)} className={cn('fluent-rim shadow-[0_30px_70px_-30px_rgb(3_16_26/0.55)]', className)}>
      <div className="h-full overflow-hidden rounded-[inherit]">
        {clone ? shot : <WhenNear className="h-full">{shot}</WhenNear>}
      </div>
    </div>
  )
}

/** Sticky screen on one side while a real three-step sequence scrolls past on the other. */
export function TimesheetStory() {
  const t = useTranslations('stories.timesheet')
  const steps = t.raw('steps') as { title: string; text: string }[]
  return (
    <Band tone="paper" edge="chevron" id="features">
      <div className="wrap grid gap-12 py-24 lg:grid-cols-[1.25fr_0.75fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <Shot view="timesheets" theme="daylight" className="h-[26rem] lg:h-full" />
        </div>
        <div className="lg:py-8">
          <h2 data-reveal="mask" className="display-2">{t('title')}</h2>
          <p data-reveal="rise" className="lede mt-6">{t('lede')}</p>
          <ol className="mt-14 space-y-16 lg:mt-28 lg:space-y-[34vh] lg:pb-[18vh]">
            {steps.map((s, i) => (
              <li key={s.title} data-reveal="right">
                <span aria-hidden className="font-display text-5xl font-semibold text-signal">{i + 1}</span>
                <h3 className="display-3 mt-3">{s.title}</h3>
                <p className="mt-3 text-muted-fg">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Band>
  )
}

/** A wide, three-part flow: how absence differs from request to report to document. */
export function LeaveStory() {
  const t = useTranslations('stories.leave')
  return (
    <Band tone="deep" edge="rise">
      <div className="wrap py-24">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <h2 data-reveal="mask" className="display-2">{t('title')}</h2>
          <p data-reveal="rise" className="lede">{t('lede')}</p>
        </div>
        <div className="mt-14 grid border-y border-line md:grid-cols-3">
          {(['requested', 'reported', 'document'] as const).map((k, i) => (
            <div key={k} data-reveal="rise" style={stagger(i)} className={cn('py-8 md:px-8', i > 0 && 'border-t border-line md:border-l md:border-t-0', i === 0 && 'md:pl-0')}>
              <h3 className="display-3">{t(`${k}.title`)}</h3>
              <p className="mt-3 text-muted-fg">{t(`${k}.text`)}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div data-reveal="left">
            <h3 className="display-3">{t('toilTitle')}</h3>
            <p className="mt-4 text-muted-fg">{t('toilText')}</p>
          </div>
          <Shot view="leave" theme="midnight" reveal="right" className="h-[24rem]" />
        </div>
      </div>
    </Band>
  )
}

/** Two windows overlapping across the band edge. */
export function InvoiceStory() {
  const t = useTranslations('stories.invoices')
  const points = t.raw('points') as string[]
  return (
    <Band tone="mist" edge="fall">
      <div className="wrap grid items-center gap-12 pt-24 pb-[calc(var(--cut)+4rem)] lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h2 data-reveal="mask" className="display-2">{t('title')}</h2>
          <p data-reveal="rise" className="lede mt-6">{t('lede')}</p>
          <ul className="mt-8 space-y-3">
            {points.map((p, i) => (
              <li key={p} data-reveal="left" style={stagger(i)} className="flex items-start gap-3"><Check aria-hidden className="mt-1 size-4 shrink-0 text-[#047857]" />{p}</li>
            ))}
          </ul>
        </div>
        <div className="relative lg:h-[36rem]">
          <Shot view="invoices" theme="nebula" reveal="right" className="h-[28rem] lg:absolute lg:right-0 lg:top-0 lg:h-[29rem] lg:w-[92%]" />
          <Shot view="approvals" theme="daylight" reveal="pop" order={3} className="mt-4 hidden h-[17rem] w-[62%] lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:block" />
        </div>
      </div>
    </Band>
  )
}

/** The people features on an endless strip that drifts by itself and can be dragged either way. */
export function PeopleStory() {
  const t = useTranslations('stories.people')
  const cards = t.raw('cards') as { title: string; text: string }[]
  return (
    <Band tone="paper" edge="peak">
      <div className="py-24">
        <div className="wrap grid gap-6 lg:grid-cols-2 lg:items-end">
          <h2 data-reveal="mask" className="display-2">{t('title')}</h2>
          <p data-reveal="rise" className="lede">{t('lede')}</p>
        </div>
        <DriftStrip label={t('title')} className="mt-12">
          {(clone) => (
            <>
              <li aria-hidden={clone || undefined} className="w-[min(36rem,85vw)] shrink-0 snap-start">
                <Shot view="people" theme="paper" reveal="pop" clone={clone} className="glass-quiet h-[22rem]" />
              </li>
              {cards.map((c, i) => (
                <li key={c.title} aria-hidden={clone || undefined} data-reveal={clone ? undefined : 'pop'} style={clone ? undefined : stagger(i + 1)} className="fluent glass-quiet flex h-[22rem] w-[min(19rem,78vw)] shrink-0 snap-start flex-col justify-end p-6">
                  <h3 className="display-3">{c.title}</h3>
                  <p className="mt-3 text-muted-fg">{c.text}</p>
                </li>
              ))}
            </>
          )}
        </DriftStrip>
      </div>
    </Band>
  )
}

/** Tasks and a stepped stream of notifications, the stream running down the cut's angle. */
export function WorkStory() {
  const tasks = useTranslations('stories.tasks')
  const notes = useTranslations('stories.notifications')
  const items = notes.raw('items') as string[]
  return (
    <Band tone="night" edge="fall">
      <div className="wrap grid gap-16 py-24 lg:grid-cols-2">
        <div>
          <h2 data-reveal="mask" className="display-2">{tasks('title')}</h2>
          <p data-reveal="rise" className="lede mt-6">{tasks('lede')}</p>
          <Shot view="tasks" theme="aurora" className="mt-10 h-[26rem]" />
        </div>
        <div>
          <h2 data-reveal="mask" className="display-2">{notes('title')}</h2>
          <p data-reveal="rise" className="lede mt-6">{notes('lede')}</p>
          <ul className="mt-10 space-y-3">
            {items.map((text, i) => (
              <li key={text} data-reveal="pop" style={{ ...stagger(i * 1.5), ['--step' as string]: `${i * 1.6}rem` }} className="fluent fluent-control flex items-center gap-3 px-4 py-3 text-[0.9375rem] sm:ml-[var(--step)]">
                <Bell aria-hidden className="size-4 shrink-0 text-jade" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Band>
  )
}

export function ExportStory() {
  const t = useTranslations('stories.export')
  const points = t.raw('points') as string[]
  return (
    <Band tone="mist" edge="rise">
      <div className="wrap grid items-center gap-12 py-24 lg:grid-cols-[1.2fr_0.8fr]">
        <Shot view="export" theme="daylight" reveal="left" className="order-2 h-[28rem] lg:order-1" />
        <div className="order-1 lg:order-2">
          <FileSpreadsheet aria-hidden data-reveal="pop" className="size-10 text-[#047857]" />
          <h2 data-reveal="mask" className="display-2 mt-4">{t('title')}</h2>
          <p data-reveal="rise" className="lede mt-6">{t('lede')}</p>
          <ul className="mt-8 space-y-3">
            {points.map((p, i) => (
              <li key={p} data-reveal="right" style={stagger(i)} className="flex items-start gap-3"><Check aria-hidden className="mt-1 size-4 shrink-0 text-[#047857]" />{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </Band>
  )
}
