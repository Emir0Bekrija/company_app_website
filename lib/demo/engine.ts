/**
 * The demo's whole world: types, seed data, and a pure reducer. No network code and no
 * real data; everything here is invented for the demonstration.
 *
 * The rules mirror the app's so the demo behaves like the product: a 7h30 working day,
 * overtime as work beyond it, overlapping blocks refused, submit blocked while days are
 * incomplete, per-day rejection, a TOIL balance derived rather than stored, and reported
 * sick leave booked at once while vacation waits for approval.
 */

import type { ThemeConfig } from '@/vendor/app/theme/theme-config'

export type Role = 'worker' | 'hr'
export type EntryType = 1 | 2 | 3 | 4
export type AbsenceKind = 'vacation' | 'sick' | 'toil' | 'other'
export type MonthStatus = 0 | 1 | 2 | 3

export type Entry = {
  id: string
  date: string
  type: EntryType
  start: string | null
  end: string | null
  note: string
  absence?: AbsenceKind
}

export type OvertimeState = { election: 'paid' | 'toil'; status: 0 | 1 | 2 }
export type ToilRequest = { id: string; date: string; minutes: number; status: 0 | 1 | 2 }
export type LeaveRequest = { id: string; from: string; to: string; days: number; status: 0 | 1 | 2 }
export type SickReport = {
  id: string
  from: string
  to: string
  status: 'reported' | 'acknowledged'
  document: null | { name: string; status: 'submitted' | 'accepted' }
}

export type TaskStatus = 0 | 1 | 2 | 3
export type TaskPriority = 0 | 1 | 2 | 3
export type Task = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due: string
  assignees: string[]
  comments: { id: string; author: string; text: string }[]
}

export type InvoiceStatus = 0 | 1 | 2 | 3 | 4 | 5
export type Invoice = {
  id: string
  number: string | null
  client: string
  description: string
  net: number
  taxRate: number
  status: InvoiceStatus
  due: string
  paid: number
}

export type Person = {
  id: string
  name: string
  email: string
  role: string
  department: string
  team: string | null
  invited?: boolean
}

export type Notification = {
  id: string
  to: Role
  key: string
  params: Record<string, string | number>
  module: ModuleId
  read: boolean
}

export type ModuleId =
  | 'timesheets' | 'approvals' | 'leave' | 'absences' | 'toil' | 'tasks'
  | 'calendar' | 'invoices' | 'clients' | 'expenses' | 'templates'
  | 'people' | 'departments' | 'schedules' | 'roles' | 'export' | 'activeMonth' | 'settings'

export type QueueRow = { userId: string; status: MonthStatus; workMinutes: number }

/** `name` is a string key for the sample types. As in the app, a company defines its own. */
export type AbsenceType = {
  id: string
  name: string
  code: string
  mode: 'request' | 'reported'
  annualLeave: boolean
  documentDays: number | null
  hrOnly: boolean
}
/** 0 pending, 1 approved with compensation, 2 approved without, 3 rejected. */
export type AbsenceRequest = { id: string; typeId: string; from: string; to: string; days: number; reason: string; proposal: string; status: 0 | 1 | 2 | 3 }

export type Client = {
  id: string
  name: string
  taxId: string
  email: string
  city: string
  country: string
  terms: number
  language: 'en' | 'bs'
  secondLanguage: 'en' | 'bs' | null
  active: boolean
}

/** Deliberately a plain record, as in the app: no statuses and no approval. */
export type Expense = {
  id: string
  date: string
  description: string
  supplier: string
  reference: string
  net: number
  tax: number
  attachments: string[]
}

export type TemplateKind = 'builtin' | 'layout' | 'word'
export type InvoiceTemplate = { active: TemplateKind; accent: string; logo: 'left' | 'right'; showTax: boolean; showNotes: boolean }

export type DepartmentRecord = { id: string; person: string; department: string; from: string; to: string | null; addedBy: string; removedBy: string | null }
export type Team = { id: string; name: string; lead: string; members: string[] }

export type ScheduleVersion = { id: string; userId: string; from: string; weeklyHours: number | null; breakMinutes: number | null }

export type TwoFactorState = 'off' | 'codes' | 'on'
export type TwoFactorRequirement = 'none' | 'admins' | 'everyone'
export type SettingsTab = 'security' | 'appearance' | 'language'

export type DemoState = {
  today: string
  year: number
  month: number
  role: Role
  entries: Entry[]
  holiday: { date: string }
  monthStatus: MonthStatus
  rejectNote: string
  flagged: string[]
  queue: QueueRow[]
  overtime: Record<string, OvertimeState>
  toilRequests: ToilRequest[]
  leaveEntitled: number
  leaveRequests: LeaveRequest[]
  reports: SickReport[]
  tasks: Task[]
  invoices: Invoice[]
  people: Person[]
  notifications: Notification[]
  matrix: Record<string, Record<string, string[]>>
  customRoles: { name: string; from: string }[]
  activeMonths: string[]
  absenceTypes: AbsenceType[]
  absenceRequests: AbsenceRequest[]
  clients: Client[]
  expenses: Expense[]
  template: InvoiceTemplate
  departmentLog: DepartmentRecord[]
  teams: Team[]
  scheduleVersions: ScheduleVersion[]
  twoFactor: TwoFactorState
  twoFactorRequirement: TwoFactorRequirement
  exports: number
  settingsTab: SettingsTab
  theme: ThemeConfig
  language: 'en' | 'bs' | null
  seq: number
}

export const WORKER_ID = 'alex'
export const REQUIRED_MINUTES = 450
export const PERMISSION_MODULES = ['Timesheet', 'Leave', 'Tasks', 'Users', 'Settings'] as const
export const PERMISSION_ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export'] as const
/** The app refuses changes to these. Only custom roles can be edited. */
export const SYSTEM_ROLES = ['HR', 'TeamLead', 'Worker']
/** Company defaults, shown read-only: saving them needs a permission HR doesn't hold by default. */
export const COMPANY_SCHEDULE = { weeklyHours: 37.5, breakMinutes: 30, breakStart: '12:00', start: '08:00', end: '16:00' }

// ─── Dates and time ────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')
export const isoDate = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
export const toDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const isWeekend = (iso: string) => [0, 6].includes(toDate(iso).getDay())
export const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate()
export const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const formatMinutes = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h && !m) return '0m'
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ')
}

export function monthDates(state: Pick<DemoState, 'year' | 'month'>) {
  return Array.from({ length: daysInMonth(state.year, state.month) }, (_, i) => isoDate(state.year, state.month, i + 1))
}

export function datesBetween(from: string, to: string) {
  const out: string[] = []
  const cursor = toDate(from)
  const end = toDate(to)
  while (cursor <= end) {
    out.push(isoDate(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

// ─── Derived values ────────────────────────────────────────────────────────────

export const isWorkingDay = (state: Pick<DemoState, 'holiday'>, date: string) =>
  !isWeekend(date) && state.holiday.date !== date

const span = (e: Entry) => (e.start && e.end ? toMinutes(e.end) - toMinutes(e.start) : 0)

export function dayInfo(state: Pick<DemoState, 'entries' | 'holiday'>, date: string) {
  const entries = state.entries
    .filter((e) => e.date === date)
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''))
  const work = entries.filter((e) => e.type === 1).reduce((sum, e) => sum + span(e), 0)
  const breakMinutes = entries.filter((e) => e.type === 3).reduce((sum, e) => sum + span(e), 0)
  const comp = entries.filter((e) => e.type === 4).reduce((sum, e) => sum + span(e), 0)
  const absence = entries.find((e) => e.type === 2)
  const working = isWorkingDay(state, date)
  return {
    entries,
    work,
    breakMinutes,
    comp,
    absence,
    working,
    holiday: state.holiday.date === date,
    overtime: working && !absence ? Math.max(0, work - REQUIRED_MINUTES) : 0,
    complete: !working || Boolean(absence) || work >= REQUIRED_MINUTES,
  }
}

export function incompleteDays(state: DemoState) {
  return monthDates(state).filter((d) => !dayInfo(state, d).complete)
}

export function monthTotals(state: DemoState) {
  return monthDates(state).reduce(
    (t, d) => {
      const i = dayInfo(state, d)
      t.work += i.work
      t.break += i.breakMinutes
      t.comp += i.comp
      if (i.overtime) {
        const ot = state.overtime[d]
        if (ot?.status === 1) t[ot.election === 'toil' ? 'overtimeToil' : 'overtimePaid'] += i.overtime
        else if (ot?.status !== 2) t.overtimePending += i.overtime
      }
      return t
    },
    { work: 0, break: 0, comp: 0, overtimePending: 0, overtimePaid: 0, overtimeToil: 0 },
  )
}

/** Banked minutes are approved TOIL overtime less approved requests. Never stored. */
export function toilBalance(state: DemoState) {
  const banked = Object.entries(state.overtime)
    .filter(([, o]) => o.status === 1 && o.election === 'toil')
    .reduce((sum, [date]) => sum + dayInfo(state, date).overtime, 0)
  const spent = state.toilRequests.filter((r) => r.status === 1).reduce((sum, r) => sum + r.minutes, 0)
  const held = state.toilRequests.filter((r) => r.status === 0).reduce((sum, r) => sum + r.minutes, 0)
  return { banked, spent, held, available: banked - spent }
}

export function leaveBalance(state: DemoState) {
  const used = state.leaveRequests.filter((r) => r.status === 1).reduce((sum, r) => sum + r.days, 0)
  const pending = state.leaveRequests.filter((r) => r.status === 0).reduce((sum, r) => sum + r.days, 0)
  return { entitled: state.leaveEntitled, used, pending, remaining: state.leaveEntitled - used - pending }
}

export function workingDaysBetween(state: Pick<DemoState, 'holiday'>, from: string, to: string) {
  return datesBetween(from, to).filter((d) => isWorkingDay(state, d))
}

export const invoiceGross = (i: Invoice) => Math.round(i.net * (1 + i.taxRate) * 100) / 100
export const invoiceBalance = (i: Invoice) => Math.round((invoiceGross(i) - i.paid) * 100) / 100

export function invoiceSummary(state: DemoState) {
  const open = state.invoices.filter((i) => i.status === 2 || i.status === 3)
  return {
    outstanding: open.reduce((s, i) => s + invoiceBalance(i), 0),
    overdue: state.invoices.filter((i) => i.status === 3).reduce((s, i) => s + invoiceBalance(i), 0),
    paid: state.invoices.reduce((s, i) => s + (i.status === 5 ? 0 : i.paid), 0),
    review: state.invoices.filter((i) => i.status === 1).length,
  }
}

export const canEditMonth = (state: DemoState) => state.monthStatus === 0 || state.monthStatus === 3

/** Working days after today, for forms that should open with dates that are accepted. */
export function nextWorkingDays(state: Pick<DemoState, 'holiday' | 'today'>, count: number) {
  const out: string[] = []
  const cursor = toDate(state.today)
  while (out.length < count) {
    cursor.setDate(cursor.getDate() + 1)
    const date = isoDate(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate())
    if (isWorkingDay(state, date)) out.push(date)
  }
  return out
}

/** The next two working days in a row with no leave booked, which the request form opens with. */
export function freeLeaveRange(state: Pick<DemoState, 'holiday' | 'today' | 'leaveRequests'>): [string, string] {
  const days = nextWorkingDays(state, 30)
  const free = (d: string) => !state.leaveRequests.some((r) => r.status !== 2 && d >= r.from && d <= r.to)
  const i = days.findIndex((d, n) => free(d) && free(days[n + 1] ?? ''))
  return [days[i], days[i + 1]]
}

/** Today when it is a working day, otherwise the next one. */
export const firstWorkingDay = (state: Pick<DemoState, 'holiday' | 'today'>) =>
  (isWorkingDay(state, state.today) ? state.today : nextWorkingDays(state, 1)[0])

/** Months as YYYY-MM, offset from the demo's month. */
export function monthKey(state: Pick<DemoState, 'year' | 'month'>, offset = 0) {
  const d = new Date(state.year, state.month - 1 + offset, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export const expenseAmount = (e: Expense) => Math.round((e.net + e.tax) * 100) / 100

export const expensesThisMonth = (state: DemoState) => {
  const month = monthKey(state)
  return state.expenses.filter((e) => e.date.startsWith(month)).reduce((sum, e) => sum + expenseAmount(e), 0)
}

export const unreadFor = (state: DemoState) =>
  state.notifications.filter((n) => n.to === state.role && !n.read).length

// ─── Validation ────────────────────────────────────────────────────────────────

export type EntryInput = { date: string; type: EntryType; start: string; end: string; note: string }

/** Returns a string key for the problem, or null when the block can be saved. */
export function validateEntry(state: DemoState, input: EntryInput, ignoreId?: string): string | null {
  if (!canEditMonth(state)) return 'error.monthLocked'
  if (!input.date.startsWith(`${state.year}-${pad(state.month)}`)) return 'error.outsideMonth'
  if (!isWorkingDay(state, input.date)) return 'error.nonWorkingDay'
  const info = dayInfo(state, input.date)
  if (info.absence?.absence === 'vacation') return 'error.vacationDay'
  if (!input.start || !input.end || toMinutes(input.end) <= toMinutes(input.start)) return 'error.timeOrder'
  const clash = info.entries.some((e) =>
    e.id !== ignoreId && e.start && e.end
    && toMinutes(input.start) < toMinutes(e.end) && toMinutes(e.start) < toMinutes(input.end))
  return clash ? 'error.overlap' : null
}

export function validateLeave(state: DemoState, from: string, to: string): string | null {
  if (!from || !to || to < from) return 'error.dateOrder'
  if (from <= state.today) return 'error.mustBeFuture'
  const days = workingDaysBetween(state, from, to).length
  if (days === 0) return 'error.noWorkingDays'
  if (days > leaveBalance(state).remaining) return 'error.notEnoughLeave'
  const busy = state.leaveRequests.some((r) => r.status !== 2 && from <= r.to && r.from <= to)
  return busy ? 'error.leaveOverlap' : null
}

export function validateToil(state: DemoState, date: string, minutes: number): string | null {
  if (!date || date <= state.today) return 'error.mustBeFuture'
  if (!isWorkingDay(state, date)) return 'error.nonWorkingDay'
  const { available, held } = toilBalance(state)
  return minutes > available - held ? 'error.notEnoughToil' : null
}

export function validateAbsence(state: DemoState, from: string, to: string): string | null {
  if (!from || !to || to < from) return 'error.dateOrder'
  if (workingDaysBetween(state, from, to).length === 0) return 'error.noWorkingDays'
  const busy = state.absenceRequests.some((r) => r.status !== 3 && from <= r.to && r.from <= to)
  return busy ? 'error.leaveOverlap' : null
}

export function validateVersion(state: DemoState, userId: string, from: string): string | null {
  if (!from) return 'error.versionDate'
  return state.scheduleVersions.some((v) => v.userId === userId && v.from === from) ? 'error.versionExists' : null
}

// ─── Actions ───────────────────────────────────────────────────────────────────

export type Action =
  | { type: 'reset'; state: DemoState }
  | { type: 'setRole'; role: Role }
  | { type: 'saveEntry'; input: EntryInput; id?: string }
  | { type: 'deleteEntry'; id: string }
  | { type: 'deleteDay'; date: string }
  | { type: 'autofillDay'; date: string }
  | { type: 'autofillMonth' }
  | { type: 'submitMonth' }
  | { type: 'approveMonth' }
  | { type: 'rejectMonth'; date: string; note: string }
  | { type: 'approveRow'; userId: string }
  | { type: 'electOvertime'; date: string; election: 'paid' | 'toil' }
  | { type: 'reviewOvertime'; date: string; approve: boolean }
  | { type: 'requestToil'; date: string; minutes: number }
  | { type: 'reviewToil'; id: string; approve: boolean }
  | { type: 'requestLeave'; from: string; to: string }
  | { type: 'reviewLeave'; id: string; approve: boolean }
  | { type: 'reportSick'; from: string; to: string }
  | { type: 'attachDocument'; id: string; name: string }
  | { type: 'acknowledgeReport'; id: string }
  | { type: 'acceptDocument'; id: string }
  | { type: 'setTaskStatus'; id: string; status: TaskStatus }
  | { type: 'addComment'; id: string; author: string; text: string; live?: boolean }
  | { type: 'createTask'; title: string; priority: TaskPriority; due: string; assignee: string }
  | { type: 'createInvoice'; client: string; description: string; net: number; due: string }
  | { type: 'sendForReview'; id: string }
  | { type: 'issueInvoice'; id: string }
  | { type: 'recordPayment'; id: string; amount: number }
  | { type: 'voidInvoice'; id: string }
  | { type: 'invitePerson'; name: string; email: string; role: string; department: string }
  | { type: 'togglePermission'; role: string; module: string; action: string }
  | { type: 'createRole'; name: string; from: string }
  | { type: 'readAll' }
  | { type: 'readNotification'; id: string }
  | { type: 'generateExport' }
  | { type: 'activateMonth'; month: string }
  | { type: 'deactivateMonth'; month: string }
  | { type: 'requestAbsence'; typeId: string; from: string; to: string; reason: string; proposal: string }
  | { type: 'reviewAbsence'; id: string; decision: 'with' | 'without' | 'reject' }
  | { type: 'createClient'; client: Omit<Client, 'id'> }
  | { type: 'setClientActive'; id: string; active: boolean }
  | { type: 'createExpense'; expense: Omit<Expense, 'id' | 'attachments'> }
  | { type: 'attachExpense'; id: string; name: string }
  | { type: 'setTemplate'; patch: Partial<Omit<InvoiceTemplate, 'active'>> }
  | { type: 'useTemplate'; kind: TemplateKind }
  | { type: 'movePerson'; id: string; department: string }
  | { type: 'createTeam'; name: string; lead: string; members: string[] }
  | { type: 'addScheduleVersion'; userId: string; from: string; weeklyHours: number | null; breakMinutes: number | null }
  | { type: 'verifyTwoFactor' }
  | { type: 'confirmRecoveryCodes' }
  | { type: 'turnOffTwoFactor' }
  | { type: 'setTwoFactorRequirement'; requirement: TwoFactorRequirement }
  | { type: 'setSettingsTab'; tab: SettingsTab }
  | { type: 'setTheme'; theme: ThemeConfig }
  | { type: 'setLanguage'; language: 'en' | 'bs' }

const nextId = (s: DemoState, prefix: string): [string, DemoState] =>
  [`${prefix}${s.seq}`, { ...s, seq: s.seq + 1 }]

function notify(s: DemoState, to: Role, key: string, module: ModuleId, params: Notification['params'] = {}): DemoState {
  const [id, next] = nextId(s, 'n')
  return { ...next, notifications: [{ id, to, key, params, module, read: false }, ...next.notifications] }
}

function bookFullDays(s: DemoState, dates: string[], absence: AbsenceKind): DemoState {
  let next = s
  for (const date of dates) {
    const [id, after] = nextId(next, 'e')
    next = {
      ...after,
      // A booked full-day absence replaces any hours already on that day.
      entries: [...after.entries.filter((e) => e.date !== date), { id, date, type: 2, start: null, end: null, note: '', absence }],
    }
  }
  return next
}

function fillDay(s: DemoState, date: string): DemoState {
  const blocks: [EntryType, string, string][] = [[1, '08:00', '12:00'], [3, '12:00', '12:30'], [1, '12:30', '16:00']]
  return blocks.reduce((acc, [type, start, end]) => {
    const [id, next] = nextId(acc, 'e')
    return { ...next, entries: [...next.entries, { id, date, type, start, end, note: '' }] }
  }, s)
}

const syncWorkerRow = (s: DemoState): DemoState => ({
  ...s,
  queue: s.queue.map((r) => (r.userId === WORKER_ID ? { ...r, status: s.monthStatus, workMinutes: monthTotals(s).work } : r)),
})

const mapTask = (s: DemoState, id: string, fn: (t: Task) => Task) =>
  ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? fn(t) : t)) })
const mapInvoice = (s: DemoState, id: string, fn: (i: Invoice) => Invoice) =>
  ({ ...s, invoices: s.invoices.map((i) => (i.id === id ? fn(i) : i)) })

export function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case 'reset':
      return a.state
    case 'setRole':
      return { ...s, role: a.role }

    case 'saveEntry': {
      if (validateEntry(s, a.input, a.id)) return s
      const { date, type, start, end, note } = a.input
      const flagged = s.flagged.filter((d) => d !== date)
      if (a.id) {
        return { ...s, flagged, entries: s.entries.map((e) => (e.id === a.id ? { ...e, date, type, start, end, note } : e)) }
      }
      const [id, next] = nextId(s, 'e')
      return { ...next, flagged, entries: [...next.entries, { id, date, type, start, end, note }] }
    }
    case 'deleteEntry':
      return canEditMonth(s) ? { ...s, entries: s.entries.filter((e) => e.id !== a.id) } : s
    case 'deleteDay':
      return canEditMonth(s) ? { ...s, entries: s.entries.filter((e) => e.date !== a.date || e.type === 2) } : s
    case 'autofillDay':
      return canEditMonth(s) && dayInfo(s, a.date).working && !dayInfo(s, a.date).entries.length ? fillDay(s, a.date) : s
    case 'autofillMonth': {
      if (!canEditMonth(s)) return s
      return monthDates(s)
        .filter((d) => isWorkingDay(s, d) && !dayInfo(s, d).entries.length)
        .reduce(fillDay, s)
    }

    case 'submitMonth': {
      if (!canEditMonth(s) || incompleteDays(s).length || s.flagged.length) return s
      return notify(syncWorkerRow({ ...s, monthStatus: 1, rejectNote: '' }), 'hr', 'timesheetSubmitted', 'approvals', { name: 'Alex Morgan' })
    }
    case 'approveMonth': {
      if (s.monthStatus !== 1) return s
      return notify(syncWorkerRow({ ...s, monthStatus: 2 }), 'worker', 'timesheetApproved', 'timesheets')
    }
    case 'rejectMonth': {
      if (s.monthStatus !== 1) return s
      return notify(
        syncWorkerRow({ ...s, monthStatus: 3, rejectNote: a.note, flagged: [a.date] }),
        'worker', 'timesheetRejected', 'timesheets',
      )
    }
    case 'approveRow':
      return { ...s, queue: s.queue.map((r) => (r.userId === a.userId ? { ...r, status: 2 } : r)) }

    case 'electOvertime':
      return { ...s, overtime: { ...s.overtime, [a.date]: { election: a.election, status: s.overtime[a.date]?.status ?? 0 } } }
    case 'reviewOvertime': {
      const current = s.overtime[a.date] ?? { election: 'paid' as const, status: 0 as const }
      return notify(
        { ...s, overtime: { ...s.overtime, [a.date]: { ...current, status: a.approve ? 1 : 2 } } },
        'worker', a.approve ? 'overtimeApproved' : 'overtimeRejected', 'toil', { date: a.date },
      )
    }

    case 'requestToil': {
      if (validateToil(s, a.date, a.minutes)) return s
      const [id, next] = nextId(s, 't')
      return notify(
        { ...next, toilRequests: [{ id, date: a.date, minutes: a.minutes, status: 0 }, ...next.toilRequests] },
        'hr', 'toilRequested', 'approvals', { name: 'Alex Morgan' },
      )
    }
    case 'reviewToil': {
      const request = s.toilRequests.find((r) => r.id === a.id)
      if (!request || request.status !== 0) return s
      const updated = { ...s, toilRequests: s.toilRequests.map((r) => (r.id === a.id ? { ...r, status: a.approve ? 1 as const : 2 as const } : r)) }
      const booked = a.approve ? bookFullDays(updated, [request.date], 'toil') : updated
      return notify(booked, 'worker', a.approve ? 'toilApproved' : 'toilRejected', 'toil')
    }

    case 'requestLeave': {
      if (validateLeave(s, a.from, a.to)) return s
      const [id, next] = nextId(s, 'l')
      const days = workingDaysBetween(s, a.from, a.to).length
      return notify(
        { ...next, leaveRequests: [{ id, from: a.from, to: a.to, days, status: 0 }, ...next.leaveRequests] },
        'hr', 'vacationRequested', 'approvals', { name: 'Alex Morgan', days },
      )
    }
    case 'reviewLeave': {
      const request = s.leaveRequests.find((r) => r.id === a.id)
      if (!request || request.status !== 0) return s
      const updated = { ...s, leaveRequests: s.leaveRequests.map((r) => (r.id === a.id ? { ...r, status: a.approve ? 1 as const : 2 as const } : r)) }
      const booked = a.approve ? bookFullDays(updated, workingDaysBetween(s, request.from, request.to), 'vacation') : updated
      return notify(booked, 'worker', a.approve ? 'vacationApproved' : 'vacationRejected', 'leave')
    }

    case 'reportSick': {
      if (!a.from || !a.to || a.to < a.from) return s
      const [id, next] = nextId(s, 'r')
      const booked = bookFullDays(
        { ...next, reports: [{ id, from: a.from, to: a.to, status: 'reported', document: null }, ...next.reports] },
        workingDaysBetween(s, a.from, a.to),
        'sick',
      )
      return notify(booked, 'hr', 'absenceReported', 'approvals', { name: 'Alex Morgan' })
    }
    case 'attachDocument':
      return notify(
        { ...s, reports: s.reports.map((r) => (r.id === a.id ? { ...r, document: { name: a.name, status: 'submitted' as const } } : r)) },
        'hr', 'documentSubmitted', 'approvals', { name: 'Alex Morgan' },
      )
    case 'acknowledgeReport':
      return notify(
        { ...s, reports: s.reports.map((r) => (r.id === a.id ? { ...r, status: 'acknowledged' as const } : r)) },
        'worker', 'absenceAcknowledged', 'leave',
      )
    case 'acceptDocument':
      return notify(
        { ...s, reports: s.reports.map((r) => (r.id === a.id && r.document ? { ...r, document: { ...r.document, status: 'accepted' as const } } : r)) },
        'worker', 'documentAccepted', 'leave',
      )

    case 'setTaskStatus':
      return mapTask(s, a.id, (t) => ({ ...t, status: a.status }))
    case 'addComment': {
      const [id, next] = nextId(s, 'c')
      const updated = mapTask(next, a.id, (t) => ({ ...t, comments: [...t.comments, { id, author: a.author, text: a.text }] }))
      return a.live
        ? notify(updated, s.role, 'taskComment', 'tasks', { title: s.tasks.find((t) => t.id === a.id)?.title ?? '' })
        : updated
    }
    case 'createTask': {
      const [id, next] = nextId(s, 'k')
      const task: Task = { id, title: a.title, description: '', status: 0, priority: a.priority, due: a.due, assignees: [a.assignee], comments: [] }
      return { ...next, tasks: [task, ...next.tasks] }
    }

    case 'createInvoice': {
      const [id, next] = nextId(s, 'i')
      const invoice: Invoice = { id, number: null, client: a.client, description: a.description, net: a.net, taxRate: 0.17, status: 0, due: a.due, paid: 0 }
      return { ...next, invoices: [invoice, ...next.invoices] }
    }
    case 'sendForReview':
      return mapInvoice(s, a.id, (i) => (i.status === 0 ? { ...i, status: 1 } : i))
    case 'issueInvoice': {
      const issued = s.invoices.filter((i) => i.number).length + 1
      return mapInvoice(s, a.id, (i) => (i.status <= 1
        ? { ...i, status: i.due < s.today ? 3 : 2, number: `INV-${s.year}-${String(issued).padStart(3, '0')}` }
        : i))
    }
    case 'recordPayment':
      return mapInvoice(s, a.id, (i) => {
        if (i.status !== 2 && i.status !== 3) return i
        const paid = Math.min(invoiceGross(i), Math.round((i.paid + a.amount) * 100) / 100)
        return { ...i, paid, status: paid >= invoiceGross(i) ? 4 : i.status }
      })
    case 'voidInvoice':
      return mapInvoice(s, a.id, (i) => (i.status === 4 ? i : { ...i, status: 5 }))

    case 'invitePerson': {
      const [id, next] = nextId(s, 'p')
      return { ...next, people: [...next.people, { id, name: a.name, email: a.email, role: a.role, department: a.department, team: null, invited: true }] }
    }
    case 'togglePermission': {
      if (SYSTEM_ROLES.includes(a.role)) return s
      const current = s.matrix[a.role]?.[a.module] ?? []
      const actions = current.includes(a.action) ? current.filter((x) => x !== a.action) : [...current, a.action]
      return { ...s, matrix: { ...s.matrix, [a.role]: { ...s.matrix[a.role], [a.module]: actions } } }
    }
    case 'createRole': {
      if (!a.name || s.matrix[a.name] || !s.matrix[a.from]) return s
      return { ...s, matrix: { ...s.matrix, [a.name]: s.matrix[a.from] }, customRoles: [...s.customRoles, { name: a.name, from: a.from }] }
    }
    case 'readAll':
      return { ...s, notifications: s.notifications.map((n) => (n.to === s.role ? { ...n, read: true } : n)) }
    case 'readNotification':
      return { ...s, notifications: s.notifications.map((n) => (n.id === a.id ? { ...n, read: true } : n)) }

    case 'generateExport':
      return { ...s, exports: s.exports + 1 }

    case 'activateMonth':
      return s.activeMonths.includes(a.month) ? s : { ...s, activeMonths: [...s.activeMonths, a.month].sort() }
    case 'deactivateMonth':
      // The app reopens the current month as soon as anyone loads it, so it can't stay closed.
      return a.month === monthKey(s) ? s : { ...s, activeMonths: s.activeMonths.filter((m) => m !== a.month) }

    case 'requestAbsence': {
      if (validateAbsence(s, a.from, a.to)) return s
      const [id, next] = nextId(s, 'a')
      const days = workingDaysBetween(s, a.from, a.to).length
      const request: AbsenceRequest = { id, typeId: a.typeId, from: a.from, to: a.to, days, reason: a.reason, proposal: a.proposal, status: 0 }
      return notify({ ...next, absenceRequests: [request, ...next.absenceRequests] }, 'hr', 'absenceRequested', 'absences', { name: 'Alex Morgan', days })
    }
    case 'reviewAbsence': {
      const request = s.absenceRequests.find((r) => r.id === a.id)
      if (!request || request.status !== 0) return s
      const status = a.decision === 'with' ? 1 as const : a.decision === 'without' ? 2 as const : 3 as const
      const updated = { ...s, absenceRequests: s.absenceRequests.map((r) => (r.id === a.id ? { ...r, status } : r)) }
      const approved = a.decision !== 'reject'
      const booked = approved ? bookFullDays(updated, workingDaysBetween(s, request.from, request.to), 'other') : updated
      return approved
        ? notify(booked, 'worker', 'absenceApproved', 'absences')
        : notify(booked, 'worker', 'absenceRejected', 'absences')
    }

    case 'createClient': {
      const [id, next] = nextId(s, 'cl')
      return { ...next, clients: [{ ...a.client, id }, ...next.clients] }
    }
    case 'setClientActive':
      return { ...s, clients: s.clients.map((c) => (c.id === a.id ? { ...c, active: a.active } : c)) }

    case 'createExpense': {
      const [id, next] = nextId(s, 'x')
      return { ...next, expenses: [{ ...a.expense, id, attachments: [] }, ...next.expenses] }
    }
    case 'attachExpense':
      return { ...s, expenses: s.expenses.map((e) => (e.id === a.id ? { ...e, attachments: [...e.attachments, a.name] } : e)) }

    case 'setTemplate':
      return { ...s, template: { ...s.template, ...a.patch } }
    case 'useTemplate':
      return { ...s, template: { ...s.template, active: a.kind } }

    case 'movePerson': {
      const person = s.people.find((p) => p.id === a.id)
      if (!person || person.department === a.department) return s
      const [id, next] = nextId(s, 'd')
      return {
        ...next,
        people: next.people.map((p) => (p.id === a.id ? { ...p, department: a.department } : p)),
        departmentLog: [
          ...next.departmentLog.map((r) => (r.person === a.id && !r.to ? { ...r, to: s.today, removedBy: 'lejla' } : r)),
          { id, person: a.id, department: a.department, from: s.today, to: null, addedBy: 'lejla', removedBy: null },
        ],
      }
    }
    case 'createTeam': {
      if (!a.name) return s
      const [id, next] = nextId(s, 'tm')
      return { ...next, teams: [...next.teams, { id, name: a.name, lead: a.lead, members: [...new Set([a.lead, ...a.members])] }] }
    }

    case 'addScheduleVersion': {
      if (validateVersion(s, a.userId, a.from)) return s
      const [id, next] = nextId(s, 'v')
      const version: ScheduleVersion = { id, userId: a.userId, from: a.from, weeklyHours: a.weeklyHours, breakMinutes: a.breakMinutes }
      return { ...next, scheduleVersions: [...next.scheduleVersions, version].sort((x, y) => y.from.localeCompare(x.from)) }
    }

    case 'verifyTwoFactor':
      return s.twoFactor === 'off' ? { ...s, twoFactor: 'codes' } : s
    case 'confirmRecoveryCodes':
      return s.twoFactor === 'codes' ? { ...s, twoFactor: 'on' } : s
    case 'turnOffTwoFactor':
      return { ...s, twoFactor: 'off' }
    case 'setTwoFactorRequirement':
      // Whoever raises the requirement must have two-step verification on themselves.
      return s.twoFactor === 'on' ? { ...s, twoFactorRequirement: a.requirement } : s

    case 'setSettingsTab':
      return { ...s, settingsTab: a.tab }
    case 'setTheme':
      return { ...s, theme: a.theme }
    case 'setLanguage':
      return { ...s, language: a.language }
  }
}

// ─── Seed ──────────────────────────────────────────────────────────────────────

/** Builds the sample company around a given date. All people and clients are invented. */
export function createSeed(now: Date): DemoState {
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const today = isoDate(year, month, now.getDate())
  const dates = monthDates({ year, month })
  const weekdays = dates.filter((d) => !isWeekend(d))
  const holiday = { date: weekdays[Math.min(13, weekdays.length - 1)] }

  // Enough filled days to look lived-in early in a month, but always a few left to do.
  const fillUntil = Math.min(Math.max(now.getDate() - 1, 12), weekdays.length + 6)
  const past = weekdays.filter((d) => d !== holiday.date && toDate(d).getDate() <= fillUntil)
  const overtimeDay = past[2]
  const vacationDays = past.slice(5, 7)

  let s: DemoState = {
    today, year, month, role: 'worker', entries: [], holiday,
    monthStatus: 0, rejectNote: '', flagged: [],
    queue: [
      { userId: WORKER_ID, status: 0, workMinutes: 0 },
      { userId: 'maya', status: 1, workMinutes: 9150 },
      { userId: 'daniel', status: 1, workMinutes: 8850 },
      { userId: 'amra', status: 2, workMinutes: 9000 },
    ],
    overtime: {}, toilRequests: [],
    leaveEntitled: 20, leaveRequests: [], reports: [],
    tasks: seedTasks(dates), invoices: seedInvoices(dates, today), people: SEED_PEOPLE,
    notifications: [],
    matrix: {
      HR: {
        Timesheet: ['View', 'Edit', 'Approve', 'Export'],
        Leave: ['View', 'Edit', 'Approve'],
        Tasks: ['Edit', 'Approve'],
        Users: ['View', 'Create', 'Edit'],
        Settings: ['View', 'Create', 'Edit', 'Delete'],
      },
      TeamLead: { Timesheet: [], Leave: [], Tasks: ['Edit', 'Approve'], Users: [], Settings: [] },
      Worker: { Timesheet: [], Leave: [], Tasks: [], Users: [], Settings: [] },
    },
    customRoles: [],
    activeMonths: [monthKey({ year, month }, -1), monthKey({ year, month })],
    absenceTypes: SEED_ABSENCE_TYPES,
    absenceRequests: [],
    clients: SEED_CLIENTS,
    expenses: seedExpenses(dates),
    template: { active: 'builtin', accent: '#0b5a63', logo: 'left', showTax: true, showNotes: true },
    departmentLog: seedDepartmentLog(year),
    teams: SEED_TEAMS,
    scheduleVersions: [{ id: 'v0', userId: 'daniel', from: `${year}-03-01`, weeklyHours: 30, breakMinutes: null }],
    twoFactor: 'off',
    twoFactorRequirement: 'none',
    exports: 0,
    settingsTab: 'security',
    theme: { preset: 'aurora' },
    language: null,
    seq: 1,
  }

  for (const d of past) {
    if (vacationDays.includes(d)) continue
    s = fillDay(s, d)
  }
  s = bookFullDays(s, vacationDays, 'vacation')
  s = { ...s, leaveRequests: [{ id: 'l0', from: vacationDays[0], to: vacationDays[vacationDays.length - 1], days: vacationDays.length, status: 1 }] }

  // One long day, so overtime has something to show.
  s = {
    ...s,
    entries: s.entries.map((e) => (e.date === overtimeDay && e.end === '16:00' ? { ...e, end: '17:30', note: 'Release support' } : e)),
    overtime: { [overtimeDay]: { election: 'toil', status: 0 } },
  }
  s = notify(s, 'worker', 'taskAssigned', 'tasks', { title: s.tasks[0].title })
  s = notify(s, 'hr', 'timesheetSubmitted', 'approvals', { name: 'Maya Chen' })
  return syncWorkerRow(s)
}

const SEED_PEOPLE: Person[] = [
  { id: 'alex', name: 'Alex Morgan', email: 'alex@halcyon.example', role: 'Worker', department: 'Engineering', team: 'Web platform' },
  { id: 'lejla', name: 'Lejla Hadžić', email: 'lejla@halcyon.example', role: 'HR', department: 'People', team: null },
  { id: 'tarik', name: 'Tarik Begović', email: 'tarik@halcyon.example', role: 'TeamLead', department: 'Engineering', team: 'Web platform' },
  { id: 'maya', name: 'Maya Chen', email: 'maya@halcyon.example', role: 'Worker', department: 'Engineering', team: 'Web platform' },
  { id: 'daniel', name: 'Daniel Novak', email: 'daniel@halcyon.example', role: 'Worker', department: 'Design', team: 'Brand studio' },
  { id: 'amra', name: 'Amra Softić', email: 'amra@halcyon.example', role: 'TeamLead', department: 'Design', team: 'Brand studio' },
  { id: 'sara', name: 'Sara Kovač', email: 'sara@halcyon.example', role: 'Finance', department: 'Finance', team: null },
]

const SEED_ABSENCE_TYPES: AbsenceType[] = [
  { id: 'at1', name: 'absenceType.annual', code: 'GO', mode: 'request', annualLeave: true, documentDays: null, hrOnly: false },
  { id: 'at2', name: 'absenceType.family', code: 'PD', mode: 'request', annualLeave: false, documentDays: null, hrOnly: false },
  { id: 'at3', name: 'absenceType.unpaid', code: 'NO', mode: 'request', annualLeave: false, documentDays: null, hrOnly: true },
  { id: 'at4', name: 'absenceType.sick', code: 'BO', mode: 'reported', annualLeave: false, documentDays: 3, hrOnly: false },
]

const SEED_CLIENTS: Client[] = [
  { id: 'cl1', name: 'Lumen Arhitekti', taxId: '4200000000011', email: 'office@lumen.example', city: 'Sarajevo', country: 'BA', terms: 30, language: 'bs', secondLanguage: 'en', active: true },
  { id: 'cl2', name: 'Pine & Harbour', taxId: 'GB000000000', email: 'accounts@pineharbour.example', city: 'Bristol', country: 'GB', terms: 14, language: 'en', secondLanguage: null, active: true },
  { id: 'cl3', name: 'Una Logistics', taxId: '4200000000028', email: 'finance@unalogistics.example', city: 'Bihać', country: 'BA', terms: 30, language: 'bs', secondLanguage: null, active: true },
  { id: 'cl4', name: 'Vrelo Foods', taxId: '4200000000035', email: 'racuni@vrelo.example', city: 'Mostar', country: 'BA', terms: 15, language: 'bs', secondLanguage: 'en', active: true },
]

const SEED_TEAMS: Team[] = [
  { id: 'tm1', name: 'Web platform', lead: 'tarik', members: ['tarik', 'alex', 'maya'] },
  { id: 'tm2', name: 'Brand studio', lead: 'amra', members: ['amra', 'daniel'] },
]

function seedExpenses(dates: string[]): Expense[] {
  const at = (n: number) => dates[Math.min(n, dates.length - 1)]
  return [
    { id: 'x1', date: at(2), description: 'Office internet', supplier: 'Telemost', reference: 'TM-4471', net: 85, tax: 14.45, attachments: ['telemost-invoice.pdf'] },
    { id: 'x2', date: at(6), description: 'Design software licences', supplier: 'Formline', reference: 'FL-2093', net: 240, tax: 40.8, attachments: [] },
    { id: 'x3', date: at(9), description: 'Client workshop catering', supplier: 'Bašča Catering', reference: '118', net: 160, tax: 27.2, attachments: ['receipt-118.pdf'] },
  ]
}

function seedDepartmentLog(year: number): DepartmentRecord[] {
  const start = `${year - 1}-01-15`
  const current = SEED_PEOPLE.filter((p) => p.id !== 'alex').map((p, i): DepartmentRecord => ({
    id: `d${i}`, person: p.id, department: p.department, from: start, to: null, addedBy: 'lejla', removedBy: null,
  }))
  return [
    { id: 'da', person: 'alex', department: 'Design', from: start, to: `${year}-02-27`, addedBy: 'lejla', removedBy: 'lejla' },
    { id: 'db', person: 'alex', department: 'Engineering', from: `${year}-02-27`, to: null, addedBy: 'lejla', removedBy: null },
    ...current,
  ]
}

function seedTasks(dates: string[]): Task[] {
  const at = (n: number) => dates[Math.min(n, dates.length - 1)]
  return [
    {
      id: 'k1', title: 'Prepare the client onboarding checklist', description: 'Agree the steps with design and publish them for the team.',
      status: 1, priority: 2, due: at(19), assignees: ['alex', 'maya'],
      comments: [{ id: 'c1', author: 'tarik', text: 'Please include the access request step.' }],
    },
    { id: 'k2', title: 'Review the new office lease', description: 'Finance needs a first read by the end of the week.', status: 0, priority: 1, due: at(23), assignees: ['alex'], comments: [] },
    { id: 'k3', title: 'Update the brand guidelines', description: '', status: 0, priority: 0, due: at(26), assignees: ['daniel'], comments: [] },
    { id: 'k4', title: 'Fix the invoice export footer', description: '', status: 2, priority: 3, due: at(9), assignees: ['maya'], comments: [] },
  ]
}

function seedInvoices(dates: string[], today: string): Invoice[] {
  const first = dates[0]
  const last = dates[dates.length - 1]
  const y = first.slice(0, 4)
  return [
    { id: 'i1', number: `INV-${y}-001`, client: 'Vrelo Foods', description: 'Website maintenance', net: 1800, taxRate: 0.17, status: 4, due: first, paid: 2106 },
    { id: 'i2', number: `INV-${y}-002`, client: 'Una Logistics', description: 'Fleet portal, phase 2', net: 6400, taxRate: 0.17, status: 3, due: first < today ? first : '2000-01-01', paid: 2000 },
    { id: 'i3', number: `INV-${y}-003`, client: 'Lumen Arhitekti', description: 'Brand identity', net: 3250, taxRate: 0.17, status: 2, due: last, paid: 0 },
    { id: 'i4', number: null, client: 'Pine & Harbour', description: 'Discovery workshop', net: 1200, taxRate: 0.17, status: 1, due: last, paid: 0 },
    { id: 'i5', number: null, client: 'Vrelo Foods', description: 'Campaign landing pages', net: 2400, taxRate: 0.17, status: 0, due: last, paid: 0 },
  ]
}
