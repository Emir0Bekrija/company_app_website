import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSeed, firstWorkingDay, freeLeaveRange, nextWorkingDays, reducer, type Action, type DemoState, type ModuleId } from '@/lib/demo/engine'
import { STRINGS } from '@/lib/demo/strings'
import { advance, isTourId, stepTargets, TOURS, tourState, type TourId } from '@/lib/demo/tours'
import { FEATURE_GROUPS } from '@/lib/features/modules'

const demoDir = join(__dirname, '..', 'components', 'demo')
const source = readdirSync(demoDir).map((f) => readFileSync(join(demoDir, f), 'utf8')).join('\n')
const literals = new Set([...source.matchAll(/data-tour="([\w-]+)"/g)].map((m) => m[1]))
  .union(new Set([...source.matchAll(/'([a-z][\w-]*)' : undefined/g)].map((m) => m[1])))
const prefixes = [...source.matchAll(/data-tour=\{`([\w-]+)\$\{/g)].map((m) => m[1])

type Move = 'next' | ModuleId | Action | ((s: DemoState) => Action | Action[])

const hr: Action = { type: 'setRole', role: 'hr' }
const worker: Action = { type: 'setRole', role: 'worker' }
const overtimeDay = (s: DemoState) => Object.keys(s.overtime)[0]

/** What a visitor does to finish each tour, in order. */
const SCRIPTS: Record<TourId, Move[]> = {
  loop: [{ type: 'autofillMonth' }, { type: 'submitMonth' }, hr, 'approvals', { type: 'approveMonth' }],
  timesheets: [{ type: 'autofillMonth' }, 'next', { type: 'submitMonth' }],
  approvals: [(s) => ({ type: 'rejectMonth', date: s.entries[0].date, note: 'Check the end time' }), worker, 'next'],
  overtime: [(s) => ({ type: 'electOvertime', date: overtimeDay(s), election: 'toil' }), hr, 'approvals', (s) => ({ type: 'reviewOvertime', date: overtimeDay(s), approve: true }), worker, 'toil', 'next'],
  activeMonth: [(s) => ({ type: 'activateMonth', month: nextMonth(s) }), (s) => ({ type: 'deactivateMonth', month: s.activeMonths[0] }), 'next'],
  export: ['next', { type: 'generateExport' }],
  vacation: [(s) => { const [from, to] = freeLeaveRange(s); return { type: 'requestLeave', from, to } }, hr, 'approvals', (s) => ({ type: 'reviewLeave', id: s.leaveRequests[0].id, approve: true }), worker, 'leave', 'next'],
  absences: ['next', worker, (s) => { const [, from, to] = nextWorkingDays(s, 3); return { type: 'requestAbsence', typeId: 'at2', from, to, reason: '', proposal: '' } }, hr, (s) => ({ type: 'reviewAbsence', id: s.absenceRequests[0].id, decision: 'with' })],
  sick: [(s) => ({ type: 'reportSick', from: firstWorkingDay(s), to: firstWorkingDay(s) }), (s) => ({ type: 'attachDocument', id: s.reports[0].id, name: 'a.pdf' }), hr, 'approvals', (s) => ({ type: 'acknowledgeReport', id: s.reports[0].id }), (s) => ({ type: 'acceptDocument', id: s.reports[0].id })],
  toil: [(s) => ({ type: 'requestToil', date: nextWorkingDays(s, 1)[0], minutes: 60 }), hr, 'approvals', (s) => ({ type: 'reviewToil', id: s.toilRequests[0].id, approve: true }), worker, 'toil', 'next'],
  tasks: [{ type: 'createTask', title: 'A', priority: 1, due: '2030-01-01', assignee: 'alex' }, { type: 'addComment', id: 'k1', author: 'alex', text: 'Hi' }, { type: 'addComment', id: 'k1', author: 'tarik', text: 'Hello', live: true }],
  calendar: ['next', 'next'],
  notifications: [(s) => ({ type: 'readNotification', id: s.notifications.find((n) => n.to === 'hr' && !n.read)!.id }), 'next', { type: 'readAll' }],
  invoices: [{ type: 'createInvoice', client: 'Vrelo Foods', description: 'A', net: 100, due: '2030-01-01' }, (s) => ({ type: 'sendForReview', id: s.invoices[0].id }), (s) => ({ type: 'issueInvoice', id: s.invoices[0].id }), (s) => ({ type: 'recordPayment', id: s.invoices[0].id, amount: 10 })],
  clients: [{ type: 'createClient', client: { name: 'New Co', taxId: '', email: '', city: '', country: 'BA', terms: 30, language: 'bs', secondLanguage: null, active: true } }, 'next', 'invoices', { type: 'createInvoice', client: 'New Co', description: 'A', net: 100, due: '2030-01-01' }],
  expenses: [{ type: 'createExpense', expense: { date: '2030-01-01', description: 'A', supplier: '', reference: '', net: 10, tax: 1 } }, (s) => ({ type: 'attachExpense', id: s.expenses[0].id, name: 'a.pdf' }), 'next'],
  templates: [{ type: 'setTemplate', patch: { accent: '#1d4ed8' } }, 'next', { type: 'useTemplate', kind: 'layout' }],
  people: ['next', { type: 'invitePerson', name: 'A', email: 'a@b.example', role: 'Worker', department: 'Design' }, 'next'],
  departments: [{ type: 'movePerson', id: 'daniel', department: 'Engineering' }, 'next', { type: 'createTeam', name: 'A', lead: 'tarik', members: [] }],
  schedules: ['next', { type: 'addScheduleVersion', userId: 'alex', from: '2030-01-01', weeklyHours: 30, breakMinutes: null }],
  roles: [{ type: 'createRole', name: 'Office', from: 'HR' }, { type: 'togglePermission', role: 'Office', module: 'Tasks', action: 'View' }, 'next'],
  security: [{ type: 'verifyTwoFactor' }, { type: 'confirmRecoveryCodes' }, { type: 'setTwoFactorRequirement', requirement: 'everyone' }],
  appearance: [{ type: 'setTheme', theme: { preset: 'paper' } }, { type: 'setTheme', theme: { preset: 'custom', custom: { base: 'dark', canvas: 'obsidian', blobs: [], intensity: 'normal', motion: 'animated' } } }, { type: 'setLanguage', language: 'bs' }],
}

const nextMonth = (s: DemoState) => {
  const d = new Date(s.year, s.month, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function run(id: TourId, now: Date) {
  const tour = TOURS[id]
  const start = tourState(tour, createSeed(now))
  let state = start
  let screen = tour.start
  let index = advance(tour, 0, { state, module: screen, start })
  for (const move of SCRIPTS[id]) {
    if (move === 'next') {
      expect(tour.steps[index]?.done, `${id} step ${index} should wait for Next`).toBeUndefined()
      index += 1
    } else if (typeof move === 'string') {
      screen = move
    } else {
      const actions = typeof move === 'function' ? move(state) : move
      for (const action of [actions].flat()) state = reducer(state, action)
    }
    index = advance(tour, index, { state, module: screen, start })
  }
  return { index, total: tour.steps.length, state, start }
}

describe('feature tours', () => {
  it('has a tour for every feature on /features', () => {
    const features = FEATURE_GROUPS.flatMap((g) => g.modules)
    expect(features).toHaveLength(22)
    expect(features.filter((f) => !isTourId(f))).toEqual([])
  })

  it('ignores ids that are not tours', () => {
    expect(isTourId('nope')).toBe(false)
    expect(isTourId('constructor')).toBe(false)
    expect(isTourId(null)).toBe(false)
  })

  it('has copy for every step and every ending', () => {
    for (const [id, tour] of Object.entries(TOURS)) {
      expect(STRINGS[`tour.title.${id}`], id).toBeTruthy()
      if (id !== 'loop') expect(STRINGS[`tour.${id}.done`], id).toBeTruthy()
      for (const step of tour.steps) expect(STRINGS[step.key], step.key).toBeTruthy()
    }
  })

  it('points every step at something that exists in the demo', () => {
    const seed = createSeed(new Date(2026, 10, 4))
    for (const [id, tour] of Object.entries(TOURS)) {
      const state = tourState(tour, { ...seed, flagged: seed.flagged.length ? seed.flagged : ['2026-11-02'] })
      for (const step of tour.steps) {
        for (const target of stepTargets(step, state)) {
          const found = literals.has(target) || prefixes.some((p) => target.startsWith(p))
          expect(found, `${id}: ${target}`).toBe(true)
        }
      }
    }
  })

  const dates = [
    new Date(2026, 10, 1), new Date(2026, 10, 4), new Date(2026, 10, 7), new Date(2026, 10, 15),
    new Date(2026, 10, 30), new Date(2026, 11, 31), new Date(2027, 1, 28),
  ]
  for (const id of Object.keys(TOURS) as TourId[]) {
    if (id === 'timesheets') continue
    it(`can be finished: ${id}`, () => {
      for (const now of dates) {
        const { index, total } = run(id, now)
        expect(index, now.toDateString()).toBe(total)
      }
    })
  }

  it('can be finished: timesheets', () => {
    for (const now of dates) {
      const { index, total, state } = run('timesheets', now)
      expect(index, now.toDateString()).toBe(total)
      expect(state.monthStatus).toBe(1)
    }
  })

  it('never goes back to a step it has passed', () => {
    const tour = TOURS.overtime
    const start = tourState(tour, createSeed(new Date(2026, 10, 4)))
    const date = overtimeDay(start)
    const chosen = reducer(start, { type: 'electOvertime', date, election: 'toil' })
    const index = advance(tour, 0, { state: chosen, module: 'timesheets', start })
    expect(index).toBe(1)
    const undone = reducer(chosen, { type: 'electOvertime', date, election: 'paid' })
    expect(advance(tour, index, { state: undone, module: 'timesheets', start })).toBe(1)
  })

  it('starts each tour from a fresh company in the right role', () => {
    const seed = createSeed(new Date(2026, 10, 4))
    expect(tourState(TOURS.approvals, seed).monthStatus).toBe(1)
    expect(tourState(TOURS.approvals, seed).role).toBe('hr')
    expect(tourState(TOURS.loop, seed).role).toBe('worker')
  })
})
