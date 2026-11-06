import type { FeatureId } from '@/lib/features/modules'
import {
  dayInfo, freeLeaveRange, incompleteDays, isWorkingDay, monthDates, monthKey, reducer, unreadFor, WORKER_ID,
  type DemoState, type ModuleId, type Role,
} from './engine'

/**
 * One guided presentation per feature on /features. Steps are data, so they can be tested
 * against the reducer without a browser. The current step only moves forward: `advance` stops
 * at the first step whose `done` is false, or at a step without one, which waits for Next.
 */
export type TourId = FeatureId | 'loop'

export type TourContext = { state: DemoState; module: ModuleId; start: DemoState }

export type TourStep = {
  key: string
  /** data-tour values, best first. The first one on screen gets the ring. */
  targets: string[] | ((s: DemoState) => string[])
  done?: (c: TourContext) => boolean
}

export type Tour = {
  start: ModuleId
  role: Role
  setup?: (s: DemoState) => DemoState
  steps: TourStep[]
}

const role = (r: Role): TourStep => ({ key: `tour.common.${r}`, targets: ['role'], done: ({ state }) => state.role === r })
const open = (m: ModuleId): TourStep => ({ key: `tour.common.open.${m}`, targets: [`nav-${m}`], done: ({ module }) => module === m })
const more = (pick: (s: DemoState) => unknown[]) => ({ state, start }: TourContext) => pick(state).length > pick(start).length

const freeDay = (s: DemoState) => monthDates(s).find((d) => isWorkingDay(s, d) && !dayInfo(s, d).entries.length)
const overtimeDay = (s: DemoState) => Object.keys(s.overtime)[0]

const submitted = (s: DemoState) => reducer(reducer(s, { type: 'autofillMonth' }), { type: 'submitMonth' })

export const TOURS: Record<TourId, Tour> = {
  loop: {
    start: 'timesheets',
    role: 'worker',
    steps: [
      { key: 'tour.autofill', targets: ['autofill'], done: ({ state }) => incompleteDays(state).length === 0 },
      { key: 'tour.submit', targets: ['submit'], done: ({ state }) => state.monthStatus !== 0 },
      { key: 'tour.role', targets: ['role'], done: ({ state }) => state.role === 'hr' },
      { key: 'tour.open', targets: ['nav-approvals'], done: ({ module }) => module === 'approvals' },
      { key: 'tour.approve', targets: ['approve'], done: ({ state }) => state.monthStatus === 2 },
    ],
  },

  timesheets: {
    start: 'timesheets',
    role: 'worker',
    steps: [
      {
        key: 'tour.timesheets.day',
        targets: (s) => ['autofill-day', `day-${freeDay(s)}`],
        done: (c) => more((s) => s.entries)(c) || !freeDay(c.state),
      },
      { key: 'tour.timesheets.block', targets: ['add-block'] },
      { key: 'tour.timesheets.autofill', targets: ['autofill'], done: ({ state }) => incompleteDays(state).length === 0 },
      { key: 'tour.timesheets.submit', targets: ['submit'], done: ({ state }) => state.monthStatus !== 0 },
    ],
  },

  approvals: {
    start: 'approvals',
    role: 'hr',
    setup: submitted,
    steps: [
      { key: 'tour.approvals.reject', targets: ['reject-send', 'reject-open'], done: ({ state }) => state.monthStatus === 3 },
      role('worker'),
      { key: 'tour.approvals.flagged', targets: (s) => [`day-${s.flagged[0]}`] },
    ],
  },

  overtime: {
    start: 'timesheets',
    role: 'worker',
    setup: (s) => reducer(s, { type: 'electOvertime', date: overtimeDay(s), election: 'paid' }),
    steps: [
      {
        key: 'tour.overtime.choose',
        targets: (s) => ['overtime-toil', `day-${overtimeDay(s)}`],
        done: ({ state }) => state.overtime[overtimeDay(state)].election === 'toil',
      },
      role('hr'),
      open('approvals'),
      { key: 'tour.overtime.approve', targets: ['overtime-approve'], done: ({ state }) => state.overtime[overtimeDay(state)].status === 1 },
      role('worker'),
      open('toil'),
      { key: 'tour.overtime.balance', targets: ['toil-available'] },
    ],
  },

  activeMonth: {
    start: 'activeMonth',
    role: 'hr',
    steps: [
      { key: 'tour.activeMonth.activate', targets: ['month-activate'], done: ({ state }) => state.activeMonths.includes(monthKey(state, 1)) },
      {
        key: 'tour.activeMonth.deactivate',
        targets: (s) => [`month-off-${monthKey(s, -1)}`],
        done: ({ state }) => !state.activeMonths.includes(monthKey(state, -1)),
      },
      { key: 'tour.activeMonth.worker', targets: ['month-note'] },
    ],
  },

  export: {
    start: 'export',
    role: 'hr',
    steps: [
      { key: 'tour.export.sheet', targets: ['export-sheet'] },
      { key: 'tour.export.generate', targets: ['export-generate'], done: ({ state }) => state.exports > 0 },
    ],
  },

  vacation: {
    start: 'leave',
    role: 'worker',
    steps: [
      { key: 'tour.vacation.request', targets: ['leave-send', 'leave-request'], done: more((s) => s.leaveRequests) },
      role('hr'),
      open('approvals'),
      { key: 'tour.vacation.approve', targets: ['leave-approve'], done: ({ state }) => state.leaveRequests.every((r) => r.status !== 0) },
      role('worker'),
      open('leave'),
      { key: 'tour.vacation.balance', targets: ['leave-remaining'] },
    ],
  },

  absences: {
    start: 'absences',
    role: 'hr',
    steps: [
      { key: 'tour.absences.catalogue', targets: ['absence-types'] },
      role('worker'),
      { key: 'tour.absences.request', targets: ['absence-send', 'absence-new'], done: more((s) => s.absenceRequests) },
      role('hr'),
      { key: 'tour.absences.approve', targets: ['absence-approve'], done: ({ state }) => state.absenceRequests.some((r) => r.status === 1 || r.status === 2) },
    ],
  },

  sick: {
    start: 'leave',
    role: 'worker',
    steps: [
      { key: 'tour.sick.report', targets: ['sick-send', 'sick-report'], done: more((s) => s.reports) },
      { key: 'tour.sick.attach', targets: ['sick-attach'], done: ({ state }) => state.reports.some((r) => r.document) },
      role('hr'),
      open('approvals'),
      { key: 'tour.sick.acknowledge', targets: ['report-acknowledge'], done: ({ state }) => state.reports.some((r) => r.status === 'acknowledged') },
      { key: 'tour.sick.accept', targets: ['document-accept'], done: ({ state }) => state.reports.some((r) => r.document?.status === 'accepted') },
    ],
  },

  toil: {
    start: 'toil',
    role: 'worker',
    setup: (s) => reducer(s, { type: 'reviewOvertime', date: overtimeDay(s), approve: true }),
    steps: [
      { key: 'tour.toil.request', targets: ['toil-send'], done: more((s) => s.toilRequests) },
      role('hr'),
      open('approvals'),
      { key: 'tour.toil.approve', targets: ['toil-approve'], done: ({ state }) => state.toilRequests.some((r) => r.status === 1) },
      role('worker'),
      open('toil'),
      { key: 'tour.toil.balance', targets: ['toil-available'] },
    ],
  },

  tasks: {
    start: 'tasks',
    role: 'worker',
    steps: [
      { key: 'tour.tasks.create', targets: ['task-save', 'task-new'], done: more((s) => s.tasks) },
      {
        key: 'tour.tasks.comment',
        targets: ['task-comment', 'task-k1'],
        done: ({ state }) => state.tasks.some((k) => k.comments.some((c) => c.author === WORKER_ID)),
      },
      {
        key: 'tour.tasks.reply',
        targets: ['task-comment'],
        done: ({ state }) => state.tasks.some((k) => k.comments.at(-1)?.author === 'tarik' && k.comments.some((c) => c.author === WORKER_ID)),
      },
    ],
  },

  calendar: {
    start: 'calendar',
    role: 'worker',
    steps: [
      { key: 'tour.calendar.grid', targets: ['calendar-grid'] },
      { key: 'tour.calendar.feed', targets: ['calendar-feed'] },
    ],
  },

  notifications: {
    start: 'tasks',
    role: 'hr',
    setup: (s) => {
      const [from, to] = freeLeaveRange(s)
      return reducer(submitted(s), { type: 'requestLeave', from, to })
    },
    steps: [
      {
        key: 'tour.notifications.open',
        targets: ['notif-first', 'bell'],
        done: ({ state, start }) => unreadFor(state) < unreadFor({ ...start, role: state.role }),
      },
      { key: 'tour.notifications.landed', targets: ['nav-approvals'] },
      { key: 'tour.notifications.read', targets: ['notif-mark', 'bell'], done: ({ state }) => unreadFor(state) === 0 },
    ],
  },

  invoices: {
    start: 'invoices',
    role: 'hr',
    steps: [
      { key: 'tour.invoices.draft', targets: ['invoice-save', 'invoice-new'], done: more((s) => s.invoices) },
      { key: 'tour.invoices.review', targets: (s) => [`invoice-review-${s.invoices[0].id}`], done: ({ state }) => state.invoices[0].status >= 1 },
      { key: 'tour.invoices.issue', targets: (s) => [`invoice-issue-${s.invoices[0].id}`], done: ({ state }) => state.invoices[0].status >= 2 },
      { key: 'tour.invoices.pay', targets: (s) => ['payment-send', `invoice-pay-${s.invoices[0].id}`], done: ({ state }) => state.invoices[0].paid > 0 },
    ],
  },

  clients: {
    start: 'clients',
    role: 'hr',
    steps: [
      { key: 'tour.clients.add', targets: ['client-save', 'client-new'], done: more((s) => s.clients) },
      { key: 'tour.clients.search', targets: ['client-search'] },
      open('invoices'),
      {
        key: 'tour.clients.invoice',
        targets: ['invoice-save', 'invoice-new'],
        done: ({ state }) => state.invoices.some((i) => i.client === state.clients[0].name),
      },
    ],
  },

  expenses: {
    start: 'expenses',
    role: 'hr',
    steps: [
      { key: 'tour.expenses.add', targets: ['expense-save', 'expense-new'], done: more((s) => s.expenses) },
      { key: 'tour.expenses.attach', targets: (s) => [`expense-attach-${s.expenses[0].id}`], done: ({ state }) => state.expenses[0].attachments.length > 0 },
      { key: 'tour.expenses.total', targets: ['expense-total'] },
    ],
  },

  templates: {
    start: 'templates',
    role: 'hr',
    steps: [
      { key: 'tour.templates.accent', targets: ['template-accent'], done: ({ state, start }) => state.template.accent !== start.template.accent },
      { key: 'tour.templates.preview', targets: ['template-preview'] },
      { key: 'tour.templates.use', targets: ['template-use', 'template-tab-layout'], done: ({ state }) => state.template.active !== 'builtin' },
    ],
  },

  people: {
    start: 'people',
    role: 'hr',
    steps: [
      { key: 'tour.people.filter', targets: ['people-filter'] },
      { key: 'tour.people.invite', targets: ['invite-send', 'invite-open'], done: more((s) => s.people) },
      { key: 'tour.people.invited', targets: (s) => [`person-${s.people.at(-1)?.id}`] },
    ],
  },

  departments: {
    start: 'departments',
    role: 'hr',
    steps: [
      { key: 'tour.departments.add', targets: ['dept-add-save', 'dept-add'], done: more((s) => s.departmentLog) },
      { key: 'tour.departments.history', targets: ['dept-history'] },
      { key: 'tour.departments.team', targets: ['team-save', 'team-new', 'teams-tab'], done: more((s) => s.teams) },
    ],
  },

  schedules: {
    start: 'schedules',
    role: 'hr',
    steps: [
      { key: 'tour.schedules.defaults', targets: ['schedule-defaults'] },
      { key: 'tour.schedules.version', targets: ['version-save', 'version-add'], done: more((s) => s.scheduleVersions) },
    ],
  },

  roles: {
    start: 'roles',
    role: 'hr',
    steps: [
      { key: 'tour.roles.create', targets: ['role-save', 'role-new'], done: more((s) => s.customRoles) },
      {
        key: 'tour.roles.tick',
        targets: ['roles-matrix'],
        done: ({ state }) => state.customRoles.some((r) => JSON.stringify(state.matrix[r.name]) !== JSON.stringify(state.matrix[r.from])),
      },
      { key: 'tour.roles.system', targets: ['roles-tabs'] },
    ],
  },

  security: {
    start: 'settings',
    role: 'hr',
    setup: (s) => ({ ...s, settingsTab: 'security' }),
    steps: [
      { key: 'tour.security.start', targets: ['twofa-verify', 'twofa-start'], done: ({ state }) => state.twoFactor !== 'off' },
      { key: 'tour.security.codes', targets: ['twofa-done', 'twofa-ack'], done: ({ state }) => state.twoFactor === 'on' },
      { key: 'tour.security.require', targets: ['twofa-everyone'], done: ({ state }) => state.twoFactorRequirement === 'everyone' },
    ],
  },

  appearance: {
    start: 'settings',
    role: 'worker',
    setup: (s) => ({ ...s, settingsTab: 'appearance' }),
    steps: [
      { key: 'tour.appearance.preset', targets: ['theme-presets'], done: ({ state }) => state.theme.preset !== 'aurora' },
      { key: 'tour.appearance.custom', targets: ['theme-custom'], done: ({ state }) => state.theme.preset === 'custom' },
      { key: 'tour.appearance.language', targets: ['language-select', 'settings-tab-language'], done: ({ state }) => state.language !== null },
    ],
  },
}

export const isTourId = (id: string | null | undefined): id is TourId =>
  Boolean(id) && Object.prototype.hasOwnProperty.call(TOURS, id as string)

/** A fresh sample company, set up for this tour, so every tour works whatever came before. */
export function tourState(tour: Tour, seed: DemoState): DemoState {
  return { ...(tour.setup ? tour.setup(seed) : seed), role: tour.role }
}

/** The step to show: moves past finished steps, and never goes back. */
export function advance(tour: Tour, index: number, context: TourContext) {
  let i = index
  while (i < tour.steps.length && tour.steps[i].done?.(context)) i++
  return i
}

export const stepTargets = (step: TourStep, state: DemoState) =>
  (typeof step.targets === 'function' ? step.targets(state) : step.targets)
