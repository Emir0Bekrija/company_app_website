'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { track } from '@/lib/analytics'
import { translate, type DemoLocale } from '@/lib/demo/strings'
import { isTourId, type TourId } from '@/lib/demo/tours'
import type { ModuleId } from '@/lib/demo/engine'
import { cn, stagger } from '@/lib/utils'
import { DemoApp, WhenNear } from '../demo/lazy'

const TABS: ModuleId[] = [
  'timesheets', 'approvals', 'leave', 'absences', 'toil', 'tasks', 'calendar', 'invoices', 'clients', 'expenses', 'templates',
  'people', 'departments', 'schedules', 'activeMonth', 'export', 'roles', 'settings',
]

/** Feature tabs, the live product in a frame, and a line about what to try. */
export function DemoExperience({ tall }: { tall?: boolean }) {
  const t = useTranslations('demo')
  const locale = useLocale() as DemoLocale
  const [module, setModule] = useState<ModuleId>('timesheets')
  const [tour, setTour] = useState<TourId | undefined>()
  const frame = useRef<HTMLDivElement>(null)
  const onModuleChange = useCallback((id: ModuleId) => setModule(id), [])

  // Read after mount so /demo stays a static page. /features links here with ?tour=<feature>.
  useEffect(() => {
    if (!tall) return
    const id = new URLSearchParams(window.location.search).get('tour')
    if (!isTourId(id)) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTour(id)
    track('demo_tour', { tour: id })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    frame.current?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
  }, [tall])

  return (
    <div>
      <div role="tablist" aria-label={t('tabsLabel')} className="-mx-[var(--gutter)] flex gap-1 overflow-x-auto px-[var(--gutter)] pb-3 lg:mx-0 lg:flex-wrap lg:overflow-x-visible lg:px-0">
        {TABS.map((id, i) => (
          <button
            key={id}
            type="button"
            data-reveal="pop"
            style={stagger(i * 0.5)}
            role="tab"
            aria-selected={module === id}
            aria-controls="demo-frame"
            onClick={() => { setModule(id); track('demo_module', { module: id }) }}
            className={cn('min-h-11 whitespace-nowrap rounded-[var(--radius-control)] px-4 py-2 text-[0.9375rem] font-medium', module === id ? 'bg-gradient-to-br from-steel to-[#0b5a63] text-white' : 'fluent fluent-control text-fg')}
          >
            {translate(locale, `nav.${id}`)}
          </button>
        ))}
      </div>

      <div ref={frame} id="demo-frame" role="tabpanel" data-reveal="tilt" className={cn('relative overflow-hidden rounded-[var(--radius-card)] shadow-[0_40px_90px_-40px_rgb(3_16_26/0.7)]', tall ? 'h-[min(52rem,calc(100dvh-7rem))]' : 'h-[44rem] max-h-[88dvh]')}>
        <WhenNear className="h-full bg-[#030712]" margin="400px">
          <DemoApp requested={module} tour={tour} onModuleChange={onModuleChange} />
        </WhenNear>
      </div>

      <p aria-live="polite" className="mt-4 max-w-3xl text-muted-fg">{t(`context.${module}`)}</p>
    </div>
  )
}
