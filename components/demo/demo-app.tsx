'use client'

import { useContext, useEffect, useRef, useState, type ComponentType } from 'react'
import { useLocale } from 'next-intl'
import { Popover } from 'radix-ui'
import {
  BadgeCheck, Bell, Building2, CalendarClock, CalendarCheck, CalendarDays, CheckCheck, CircleCheck, CircleX, Clock, FileSpreadsheet, FileText,
  HeartPulse, Hourglass, Info, ListChecks, Network, Palmtree, Palette, Play, Receipt, RotateCcw, Settings, ShieldCheck, Users, Wallet,
} from 'lucide-react'
import { unreadFor, type DemoState, type ModuleId, type Role } from '@/lib/demo/engine'
import { DemoProvider, useDemo } from '@/lib/demo/store'
import type { DemoLocale } from '@/lib/demo/strings'
import { TOURS, tourState, type TourId } from '@/lib/demo/tours'
import { PRESET_IDS } from '@/vendor/app/theme/theme-config'
import { cn } from '@/lib/utils'
import { FlowLogo } from '../marketing/flow-logo'
import { LogoMark } from '../marketing/logo'
import { FrameContext } from './primitives'
import { ThemeScope } from './theme-scope'
import { TimesheetView } from './timesheet'
import { AbsencesView, LeaveView, ToilView } from './time-off'
import { ApprovalsView } from './approvals'
import { CalendarView, TasksView } from './work'
import { InvoicesView } from './finance'
import { ClientsView, ExpensesView, TemplatesView } from './finance-records'
import { ExportView, PeopleView, RolesView } from './org'
import { SettingsView } from './settings'
import { ActiveMonthView, DepartmentsView, SchedulesView } from './setup'
import { Tour } from './tour'

type ModuleDef = { id: ModuleId; icon: ComponentType<{ className?: string }>; view: ComponentType; gradient: string; hrOnly?: boolean }

// The gradients are the app's own nav group colours.
export const MODULES: ModuleDef[] = [
  { id: 'timesheets', icon: Clock, view: TimesheetView, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'leave', icon: Palmtree, view: LeaveView, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'absences', icon: HeartPulse, view: AbsencesView, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'toil', icon: Hourglass, view: ToilView, gradient: 'from-emerald-500 to-teal-500' },
  { id: 'tasks', icon: ListChecks, view: TasksView, gradient: 'from-blue-500 to-indigo-500' },
  { id: 'calendar', icon: CalendarDays, view: CalendarView, gradient: 'from-violet-500 to-purple-500' },
  { id: 'approvals', icon: BadgeCheck, view: ApprovalsView, gradient: 'from-amber-500 to-orange-500', hrOnly: true },
  { id: 'people', icon: Users, view: PeopleView, gradient: 'from-amber-500 to-orange-500', hrOnly: true },
  { id: 'departments', icon: Network, view: DepartmentsView, gradient: 'from-amber-500 to-orange-500', hrOnly: true },
  { id: 'schedules', icon: CalendarClock, view: SchedulesView, gradient: 'from-amber-500 to-orange-500', hrOnly: true },
  { id: 'activeMonth', icon: CalendarCheck, view: ActiveMonthView, gradient: 'from-amber-500 to-orange-500', hrOnly: true },
  { id: 'export', icon: FileSpreadsheet, view: ExportView, gradient: 'from-amber-500 to-orange-500', hrOnly: true },
  { id: 'roles', icon: ShieldCheck, view: RolesView, gradient: 'from-amber-500 to-orange-500', hrOnly: true },
  { id: 'invoices', icon: Receipt, view: InvoicesView, gradient: 'from-cyan-500 to-sky-500', hrOnly: true },
  { id: 'clients', icon: Building2, view: ClientsView, gradient: 'from-cyan-500 to-sky-500', hrOnly: true },
  { id: 'expenses', icon: Wallet, view: ExpensesView, gradient: 'from-cyan-500 to-sky-500', hrOnly: true },
  { id: 'templates', icon: FileText, view: TemplatesView, gradient: 'from-cyan-500 to-sky-500', hrOnly: true },
  { id: 'settings', icon: Settings, view: SettingsView, gradient: 'from-blue-500 to-indigo-500' },
]

const useFrame = () => useContext(FrameContext)

function RoleSwitch({ onChange }: { onChange: (role: Role) => void }) {
  const { state, t } = useDemo()
  return (
    <div data-tour="role" role="radiogroup" aria-label={t('shell.viewAs')} className="flex rounded-lg bg-ink/5 p-0.5">
      {(['worker', 'hr'] as Role[]).map((role) => (
        <button
          key={role}
          type="button"
          role="radio"
          aria-checked={state.role === role}
          onClick={() => onChange(role)}
          className={cn('h-8 rounded-md px-2.5 text-xs font-medium transition-colors', state.role === role ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-3 hover:text-ink-1')}
        >
          {t(`shell.role.${role}`)}
        </button>
      ))}
    </div>
  )
}

function NotificationBell({ onOpen }: { onOpen: (module: ModuleId) => void }) {
  const { state, dispatch, t } = useDemo()
  const frame = useFrame()
  const unread = unreadFor(state)
  const items = state.notifications.filter((n) => n.to === state.role)
  const firstUnread = items.find((n) => !n.read)
  return (
    <Popover.Root>
      <Popover.Trigger data-tour="bell" aria-label={t('shell.notifications', { count: unread })} className="relative inline-flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-ink/5">
        <Bell className="size-4" />
        {unread > 0 && <span className="absolute right-1 top-1 inline-flex size-4 items-center justify-center rounded-full bg-red-600 text-[0.625rem] font-semibold text-white">{unread}</span>}
      </Popover.Trigger>
      <Popover.Portal container={frame?.current ?? undefined}>
        <Popover.Content align="end" sideOffset={6} className="z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-ink/10 bg-surface/95 p-2 text-ink-1 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-semibold">{t('shell.notificationsTitle')}</span>
            <button type="button" data-tour="notif-mark" onClick={() => dispatch({ type: 'readAll' })} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-ink-3 hover:text-ink-1">
              <CheckCheck className="size-3.5" />{t('shell.markRead')}
            </button>
          </div>
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Popover.Close
                  data-tour={n === firstUnread ? 'notif-first' : undefined}
                  onClick={() => { dispatch({ type: 'readNotification', id: n.id }); onOpen(n.module) }}
                  className={cn('w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-ink/5', n.read ? 'text-ink-3' : 'text-ink-1')}
                >
                  {t(`notif.${n.key}`, n.params)}
                </Popover.Close>
              </li>
            ))}
            {items.length === 0 && <li className="px-2 py-4 text-center text-sm text-ink-3">{t('shell.noNotifications')}</li>}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function ThemeMenu() {
  const { state, dispatch, t } = useDemo()
  const frame = useFrame()
  return (
    <Popover.Root>
      <Popover.Trigger aria-label={t('shell.theme')} className="inline-flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-ink/5">
        <Palette className="size-4" />
      </Popover.Trigger>
      <Popover.Portal container={frame?.current ?? undefined}>
        <Popover.Content align="end" sideOffset={6} className="z-50 w-48 rounded-xl border border-ink/10 bg-surface/95 p-1.5 text-ink-1 shadow-2xl backdrop-blur-xl">
          {PRESET_IDS.filter((p) => p !== 'custom').map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={state.theme.preset === p}
              onClick={() => dispatch({ type: 'setTheme', theme: { preset: p } })}
              className={cn('block w-full rounded-lg px-2.5 py-1.5 text-left text-sm hover:bg-ink/5', state.theme.preset === p && 'bg-ink/10 font-medium')}
            >
              {t(`theme.${p}`)}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function Toasts() {
  const { toasts } = useDemo()
  const icon = { success: CircleCheck, error: CircleX, info: Info }
  return (
    <div aria-live="polite" className="pointer-events-none absolute bottom-20 right-3 z-[60] flex w-72 max-w-[calc(100%-1.5rem)] flex-col gap-2 md:bottom-3">
      {toasts.map((toast) => {
        const Icon = icon[toast.tone]
        return (
          <div key={toast.id} className="toast-in flex items-start gap-2 rounded-xl border border-ink/10 bg-surface p-3 text-sm text-ink-1 shadow-xl">
            <Icon className={cn('mt-0.5 size-4 shrink-0', toast.tone === 'success' ? 'text-emerald-fg' : toast.tone === 'error' ? 'text-red-fg' : 'text-blue-fg')} />
            {toast.text}
          </div>
        )
      })}
    </div>
  )
}

function Shell({ initialModule, requested, tour, onModuleChange, showTour }: DemoAppProps & { initialModule: ModuleId }) {
  const { state, dispatch, reset, t, toast } = useDemo()
  const frame = useRef<HTMLDivElement>(null)
  const [module, setModule] = useState<ModuleId>(initialModule)
  // The start state is what steps like "add one more" compare against. The run number restarts the card.
  const [touring, setTouring] = useState<{ id: TourId; run: number; start: DemoState | null } | null>(null)

  const go = (id: ModuleId) => {
    const def = MODULES.find((m) => m.id === id)
    if (def?.hrOnly && state.role !== 'hr') dispatch({ type: 'setRole', role: 'hr' })
    setModule(id)
  }

  const startTour = (id: TourId) => {
    const definition = TOURS[id]
    let prepared: DemoState | null = null
    reset((seed) => { prepared = tourState(definition, seed); return prepared })
    setModule(definition.start)
    setTouring((current) => ({ id, run: (current?.run ?? 0) + 1, start: prepared }))
  }

  const changeRole = (role: Role) => {
    dispatch({ type: 'setRole', role })
    if (role === 'worker' && MODULES.find((m) => m.id === module)?.hrOnly) setModule('timesheets')
  }

  // External tabs drive the frame. Adjusting state during render avoids a stale frame.
  const [seenRequest, setSeenRequest] = useState(requested)
  if (requested !== seenRequest) {
    setSeenRequest(requested)
    if (requested) setModule(requested)
  }

  // The role lives in DemoProvider, which can't be updated while Shell renders. Keyed on the
  // request alone, so switching back to Worker inside the frame isn't overridden.
  useEffect(() => {
    if (MODULES.find((m) => m.id === requested)?.hrOnly) dispatch({ type: 'setRole', role: 'hr' })
  }, [requested, dispatch])

  // A link to a feature starts its presentation as soon as the frame exists.
  const startRef = useRef(startTour)
  useEffect(() => { startRef.current = startTour })
  useEffect(() => { if (tour) startRef.current(tour) }, [tour])

  const visible = MODULES.filter((m) => !m.hrOnly || state.role === 'hr')
  const active = visible.find((m) => m.id === module) ?? MODULES[0]
  const View = active.view

  // Only once the role has caught up, or a tab's HR screen would report the fallback and undo itself.
  useEffect(() => {
    if (active.id === module) onModuleChange?.(module)
  }, [active.id, module, onModuleChange])

  return (
    <ThemeScope ref={frame} config={state.theme} className="h-full overflow-hidden">
      <FrameContext.Provider value={frame}>
        <div className="flex h-full">
          <nav aria-label={t('shell.modules')} className="hidden w-14 shrink-0 flex-col gap-1 overflow-y-auto border-r border-ink/10 bg-sunken p-2 md:flex lg:w-52">
            <div className="mb-2 flex h-9 items-center gap-2 px-1.5 text-ink-1">
              <LogoMark className="h-5 w-auto shrink-0 lg:hidden" />
              <FlowLogo ink="current" className="hidden w-36 lg:block" />
            </div>
            {visible.map((m) => {
              const on = m.id === active.id
              return (
                <button
                  key={m.id}
                  type="button"
                  data-tour={`nav-${m.id}`}
                  aria-current={on ? 'page' : undefined}
                  aria-label={t(`nav.${m.id}`)}
                  title={t(`nav.${m.id}`)}
                  onClick={() => setModule(m.id)}
                  className={cn('flex h-9 items-center gap-2.5 rounded-lg px-1.5 text-sm transition-colors', on ? 'bg-ink/10 font-medium text-ink-1' : 'text-ink-2 hover:bg-ink/5 hover:text-ink-1')}
                >
                  <span className={cn('inline-flex size-6 shrink-0 items-center justify-center rounded-md', on ? `bg-gradient-to-br text-on-accent ${m.gradient}` : '')}>
                    <m.icon className="size-4" />
                  </span>
                  <span className="hidden truncate lg:inline">{t(`nav.${m.id}`)}</span>
                </button>
              )
            })}
          </nav>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-13 shrink-0 items-center justify-between gap-2 border-b border-ink/10 bg-canvas/40 px-3 backdrop-blur-sm">
              <RoleSwitch onChange={changeRole} />
              <span className="hidden rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-fg xl:inline">{t('shell.badge')}</span>
              <div className="flex items-center">
                {showTour && (
                  <button type="button" onClick={() => startTour('loop')} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-2 hover:bg-ink/5">
                    <Play className="size-3.5" /><span className="hidden sm:inline">{t('shell.tour')}</span>
                  </button>
                )}
                <button
                  type="button"
                  aria-label={t('shell.reset')}
                  title={t('shell.reset')}
                  onClick={() => { reset(); setModule('timesheets'); setTouring(null); toast(t('toast.reset'), 'info') }}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-ink-2 hover:bg-ink/5"
                >
                  <RotateCcw className="size-4" />
                </button>
                <ThemeMenu />
                <NotificationBell onOpen={go} />
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0"><View /></main>

            <nav aria-label={t('shell.modules')} className="absolute inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-ink/10 bg-surface px-2 py-1.5 md:hidden">
              {visible.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-tour={`nav-${m.id}`}
                  aria-current={m.id === active.id ? 'page' : undefined}
                  onClick={() => setModule(m.id)}
                  className={cn('flex min-w-16 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[0.6875rem]', m.id === active.id ? 'bg-ink/10 font-medium text-ink-1' : 'text-ink-3')}
                >
                  <m.icon className="size-4" />
                  <span className="whitespace-nowrap">{t(`nav.${m.id}`)}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        <Toasts />
        {touring?.start && (
          <Tour
            key={touring.run}
            id={touring.id}
            start={touring.start}
            module={active.id}
            frame={frame}
            onClose={() => setTouring(null)}
            onRestart={() => startTour(touring.id)}
          />
        )}
      </FrameContext.Provider>
    </ThemeScope>
  )
}

export type DemoAppProps = {
  initialModule?: ModuleId
  requested?: ModuleId
  /** Starts this feature's presentation once the frame has mounted. */
  tour?: TourId
  onModuleChange?: (module: ModuleId) => void
  showTour?: boolean
}

export default function DemoApp({ initialModule = 'timesheets', requested, tour, onModuleChange, showTour = true }: DemoAppProps) {
  const locale = useLocale() as DemoLocale
  return (
    <DemoProvider locale={locale}>
      <Shell initialModule={initialModule} requested={requested} tour={tour} onModuleChange={onModuleChange} showTour={showTour} />
    </DemoProvider>
  )
}
