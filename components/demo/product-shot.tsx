'use client'

import { useMemo, type ComponentType } from 'react'
import { useLocale } from 'next-intl'
import { DemoProvider } from '@/lib/demo/store'
import type { DemoLocale } from '@/lib/demo/strings'
import type { PresetId, ThemeConfig } from '@/vendor/app/theme/theme-config'
import { ApprovalsView } from './approvals'
import { InvoicesView } from './finance'
import { ExportView, PeopleView, RolesView } from './org'
import { ThemeScope } from './theme-scope'
import { LeaveView, ToilView } from './time-off'
import { TimesheetView } from './timesheet'
import { CalendarView, TasksView } from './work'

const VIEWS: Record<string, ComponentType> = {
  timesheets: TimesheetView, leave: LeaveView, toil: ToilView, tasks: TasksView, calendar: CalendarView,
  approvals: ApprovalsView, people: PeopleView, roles: RolesView, export: ExportView, invoices: InvoicesView,
}

export type ProductShotProps = { view: keyof typeof VIEWS; theme?: Exclude<PresetId, 'custom'>; className?: string }

/** A real screen with sample data, shown as a picture: inert, so it can't take focus. */
export default function ProductShot({ view, theme = 'aurora', className }: ProductShotProps) {
  const locale = useLocale() as DemoLocale
  const config = useMemo<ThemeConfig>(() => ({ preset: theme }), [theme])
  const View = VIEWS[view]
  return (
    <DemoProvider locale={locale} persist={false}>
      <ThemeScope config={config} className={className}>
        <div inert className="h-full overflow-hidden"><View /></div>
      </ThemeScope>
    </DemoProvider>
  )
}
