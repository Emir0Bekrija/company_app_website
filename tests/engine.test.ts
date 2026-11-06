import { beforeEach, describe, expect, it } from 'vitest'
import {
  createSeed, dayInfo, formatMinutes, incompleteDays, invoiceGross, invoiceSummary, isWorkingDay, leaveBalance,
  monthDates, monthTotals, reducer, REQUIRED_MINUTES, toilBalance, unreadFor, validateEntry, validateLeave,
  type DemoState,
} from '@/lib/demo/engine'

// A fixed Wednesday, early in the month, so results never depend on the day tests run.
const NOW = new Date(2026, 10, 4)
let s: DemoState

const emptyWorkingDay = (state: DemoState) =>
  monthDates(state).find((d) => isWorkingDay(state, d) && !dayInfo(state, d).entries.length)!
const futureWorkingDay = (state: DemoState) =>
  monthDates(state).filter((d) => d > state.today && isWorkingDay(state, d)).at(-1)!

beforeEach(() => { s = createSeed(NOW) })

describe('timesheet entries', () => {
  it('adds a block and updates the totals', () => {
    const date = emptyWorkingDay(s)
    const before = monthTotals(s).work
    const next = reducer(s, { type: 'saveEntry', input: { date, type: 1, start: '09:00', end: '15:30', note: 'Frontend' } })
    expect(dayInfo(next, date).work).toBe(390)
    expect(monthTotals(next).work).toBe(before + 390)
  })

  it('refuses overlapping blocks', () => {
    const date = emptyWorkingDay(s)
    const next = reducer(s, { type: 'saveEntry', input: { date, type: 1, start: '09:00', end: '12:00', note: '' } })
    const clash = { date, type: 1 as const, start: '11:00', end: '13:00', note: '' }
    expect(validateEntry(next, clash)).toBe('error.overlap')
    expect(reducer(next, { type: 'saveEntry', input: clash })).toBe(next)
  })

  it('allows blocks that touch end to start', () => {
    const date = emptyWorkingDay(s)
    const next = reducer(s, { type: 'saveEntry', input: { date, type: 1, start: '09:00', end: '12:00', note: '' } })
    expect(validateEntry(next, { date, type: 3, start: '12:00', end: '12:30', note: '' })).toBeNull()
  })

  it('refuses an end before the start, and non-working days', () => {
    const date = emptyWorkingDay(s)
    expect(validateEntry(s, { date, type: 1, start: '12:00', end: '09:00', note: '' })).toBe('error.timeOrder')
    expect(validateEntry(s, { date: s.holiday.date, type: 1, start: '09:00', end: '10:00', note: '' })).toBe('error.nonWorkingDay')
  })

  it('edits a block without clashing with itself', () => {
    const date = emptyWorkingDay(s)
    const added = reducer(s, { type: 'saveEntry', input: { date, type: 1, start: '09:00', end: '12:00', note: '' } })
    const entry = dayInfo(added, date).entries[0]
    const input = { date, type: 1 as const, start: '09:30', end: '12:00', note: '' }
    expect(validateEntry(added, input, entry.id)).toBeNull()
    expect(dayInfo(reducer(added, { type: 'saveEntry', input, id: entry.id }), date).work).toBe(150)
  })

  it('autofills a day to exactly the required minutes with no overtime', () => {
    const date = emptyWorkingDay(s)
    const info = dayInfo(reducer(s, { type: 'autofillDay', date }), date)
    expect(info.work).toBe(REQUIRED_MINUTES)
    expect(info.overtime).toBe(0)
    expect(info.complete).toBe(true)
  })

  it('autofills only empty working days and leaves existing days alone', () => {
    const filled = monthDates(s).find((d) => dayInfo(s, d).work > 0)!
    const before = dayInfo(s, filled).entries.length
    const next = reducer(s, { type: 'autofillMonth' })
    expect(incompleteDays(next)).toEqual([])
    expect(dayInfo(next, filled).entries.length).toBe(before)
    expect(dayInfo(next, s.holiday.date).entries.length).toBe(0)
  })
})

describe('month approval', () => {
  it('blocks submit while days are incomplete', () => {
    expect(incompleteDays(s).length).toBeGreaterThan(0)
    expect(reducer(s, { type: 'submitMonth' }).monthStatus).toBe(0)
  })

  it('runs submit, reject, fix, resubmit, approve', () => {
    let n = reducer(s, { type: 'autofillMonth' })
    n = reducer(n, { type: 'submitMonth' })
    expect(n.monthStatus).toBe(1)
    expect(n.queue.find((q) => q.userId === 'alex')?.status).toBe(1)
    expect(n.notifications[0]).toMatchObject({ to: 'hr', key: 'timesheetSubmitted' })

    // A submitted month is locked.
    const date = monthDates(n).find((d) => dayInfo(n, d).work > 0)!
    expect(validateEntry(n, { date, type: 1, start: '20:00', end: '21:00', note: '' })).toBe('error.monthLocked')

    n = reducer(n, { type: 'rejectMonth', date, note: 'Please check this day' })
    expect(n.monthStatus).toBe(3)
    expect(n.flagged).toEqual([date])
    expect(reducer(n, { type: 'submitMonth' }).monthStatus).toBe(3)

    n = reducer(n, { type: 'saveEntry', input: { date, type: 1, start: '20:00', end: '21:00', note: '' } })
    expect(n.flagged).toEqual([])
    n = reducer(n, { type: 'submitMonth' })
    n = reducer(n, { type: 'approveMonth' })
    expect(n.monthStatus).toBe(2)
    expect(n.notifications[0]).toMatchObject({ to: 'worker', key: 'timesheetApproved' })
  })
})

describe('overtime and TOIL', () => {
  const otDay = (state: DemoState) => Object.keys(state.overtime)[0]

  it('only counts overtime once approved', () => {
    expect(dayInfo(s, otDay(s)).overtime).toBe(90)
    expect(toilBalance(s).available).toBe(0)
    expect(monthTotals(s).overtimePending).toBe(90)
    const n = reducer(s, { type: 'reviewOvertime', date: otDay(s), approve: true })
    expect(toilBalance(n).available).toBe(90)
    expect(monthTotals(n).overtimeToil).toBe(90)
    expect(monthTotals(n).overtimePending).toBe(0)
  })

  it('banks nothing when the worker elects paid', () => {
    let n = reducer(s, { type: 'electOvertime', date: otDay(s), election: 'paid' })
    n = reducer(n, { type: 'reviewOvertime', date: otDay(n), approve: true })
    expect(toilBalance(n).available).toBe(0)
    expect(monthTotals(n).overtimePaid).toBe(90)
  })

  it('spends the balance only when the request is approved, and never touches leave', () => {
    let n = reducer(s, { type: 'reviewOvertime', date: otDay(s), approve: true })
    const leave = leaveBalance(n)
    const date = futureWorkingDay(n)
    n = reducer(n, { type: 'requestToil', date, minutes: 60 })
    expect(toilBalance(n).available).toBe(90)
    n = reducer(n, { type: 'reviewToil', id: n.toilRequests[0].id, approve: true })
    expect(toilBalance(n).available).toBe(30)
    expect(dayInfo(n, date).absence?.absence).toBe('toil')
    expect(leaveBalance(n)).toEqual(leave)
  })

  it('refuses a request larger than the available balance', () => {
    const n = reducer(s, { type: 'requestToil', date: futureWorkingDay(s), minutes: 60 })
    expect(n.toilRequests).toHaveLength(0)
  })
})

describe('leave and sick reports', () => {
  it('holds vacation days as pending until HR decides', () => {
    const date = futureWorkingDay(s)
    const before = leaveBalance(s)
    let n = reducer(s, { type: 'requestLeave', from: date, to: date })
    expect(leaveBalance(n).pending).toBe(before.pending + 1)
    expect(dayInfo(n, date).absence).toBeUndefined()
    n = reducer(n, { type: 'reviewLeave', id: n.leaveRequests[0].id, approve: true })
    expect(leaveBalance(n).used).toBe(before.used + 1)
    expect(dayInfo(n, date).absence?.absence).toBe('vacation')
  })

  it('returns days to the balance when rejected', () => {
    const date = futureWorkingDay(s)
    let n = reducer(s, { type: 'requestLeave', from: date, to: date })
    n = reducer(n, { type: 'reviewLeave', id: n.leaveRequests[0].id, approve: false })
    expect(leaveBalance(n).remaining).toBe(leaveBalance(s).remaining)
  })

  it('refuses past dates and overlapping requests', () => {
    expect(validateLeave(s, s.today, s.today)).toBe('error.mustBeFuture')
    const date = futureWorkingDay(s)
    const n = reducer(s, { type: 'requestLeave', from: date, to: date })
    expect(validateLeave(n, date, date)).toBe('error.leaveOverlap')
  })

  it('books sick leave at once, without using leave', () => {
    const date = emptyWorkingDay(s)
    const n = reducer(s, { type: 'reportSick', from: date, to: date })
    expect(dayInfo(n, date).absence?.absence).toBe('sick')
    expect(n.reports[0].status).toBe('reported')
    expect(leaveBalance(n)).toEqual(leaveBalance(s))
    expect(n.notifications[0]).toMatchObject({ to: 'hr', key: 'absenceReported' })
  })
})

describe('invoices', () => {
  it('numbers an invoice when issued and settles after partial payments', () => {
    let n = reducer(s, { type: 'createInvoice', client: 'Una Logistics', description: 'Audit', net: 1000, due: '2099-01-01' })
    const id = n.invoices[0].id
    expect(n.invoices[0].number).toBeNull()
    n = reducer(n, { type: 'sendForReview', id })
    n = reducer(n, { type: 'issueInvoice', id })
    expect(n.invoices[0].number).toMatch(/^INV-2026-\d{3}$/)
    expect(n.invoices[0].status).toBe(2)
    expect(invoiceGross(n.invoices[0])).toBe(1170)
    n = reducer(n, { type: 'recordPayment', id, amount: 500 })
    expect(n.invoices[0].status).toBe(2)
    n = reducer(n, { type: 'recordPayment', id, amount: 9999 })
    expect(n.invoices[0]).toMatchObject({ status: 4, paid: 1170 })
  })

  it('keeps the summary tiles in step', () => {
    const before = invoiceSummary(s)
    const n = reducer(s, { type: 'recordPayment', id: 'i3', amount: 1000 })
    expect(invoiceSummary(n).outstanding).toBeCloseTo(before.outstanding - 1000)
    expect(invoiceSummary(n).paid).toBeCloseTo(before.paid + 1000)
  })
})

describe('shared state', () => {
  it('splits notifications by role', () => {
    const worker = unreadFor(s)
    expect(worker).toBe(1)
    const asHr = reducer(s, { type: 'setRole', role: 'hr' })
    expect(unreadFor(asHr)).toBe(1)
    const read = reducer(asHr, { type: 'readAll' })
    expect(unreadFor(read)).toBe(0)
    expect(unreadFor(reducer(read, { type: 'setRole', role: 'worker' }))).toBe(1)
  })

  it('reset returns the seed', () => {
    const n = reducer(reducer(s, { type: 'autofillMonth' }), { type: 'reset', state: createSeed(NOW) })
    expect(n).toEqual(createSeed(NOW))
  })

  it('formats durations like the app', () => {
    expect(formatMinutes(450)).toBe('7h 30m')
    expect(formatMinutes(60)).toBe('1h')
    expect(formatMinutes(0)).toBe('0m')
  })

  it('seeds sensibly on every day of a year', () => {
    for (let d = 0; d < 366; d++) {
      const seeded = createSeed(new Date(2028, 0, 1 + d))
      expect(Object.keys(seeded.overtime)).toHaveLength(1)
      expect(seeded.leaveRequests[0].days).toBe(2)
      expect(dayInfo(seeded, seeded.holiday.date).entries).toHaveLength(0)
    }
  })
})

describe('screens behind the feature tours', () => {
  it('keeps system roles fixed and lets a custom role change', () => {
    expect(reducer(s, { type: 'togglePermission', role: 'HR', module: 'Tasks', action: 'View' })).toBe(s)
    const custom = reducer(s, { type: 'createRole', name: 'Office', from: 'HR' })
    expect(custom.matrix.Office).toEqual(s.matrix.HR)
    const changed = reducer(custom, { type: 'togglePermission', role: 'Office', module: 'Tasks', action: 'View' })
    expect(changed.matrix.Office.Tasks).toContain('View')
    expect(changed.matrix.HR.Tasks).not.toContain('View')
  })

  it('never closes the current month', () => {
    const current = s.activeMonths.at(-1)!
    expect(reducer(s, { type: 'deactivateMonth', month: current })).toBe(s)
    expect(reducer(s, { type: 'deactivateMonth', month: s.activeMonths[0] }).activeMonths).toEqual([current])
  })

  it('books an approved absence on the timesheet and tells the worker', () => {
    const from = futureWorkingDay(s)
    const asked = reducer(s, { type: 'requestAbsence', typeId: 'at2', from, to: from, reason: '', proposal: '' })
    const id = asked.absenceRequests[0].id
    const approved = reducer(asked, { type: 'reviewAbsence', id, decision: 'with' })
    expect(approved.absenceRequests[0].status).toBe(1)
    expect(dayInfo(approved, from).absence?.absence).toBe('other')
    expect(approved.notifications[0].key).toBe('absenceApproved')
    const declined = reducer(asked, { type: 'reviewAbsence', id, decision: 'reject' })
    expect(dayInfo(declined, from).absence).toBeUndefined()
  })

  it('keeps department history when someone moves', () => {
    const moved = reducer(s, { type: 'movePerson', id: 'daniel', department: 'Engineering' })
    expect(moved.people.find((p) => p.id === 'daniel')?.department).toBe('Engineering')
    const records = moved.departmentLog.filter((r) => r.person === 'daniel')
    expect(records.find((r) => r.department === 'Design')?.to).toBe(s.today)
    expect(records.find((r) => r.department === 'Engineering')?.to).toBeNull()
    expect(reducer(moved, { type: 'movePerson', id: 'daniel', department: 'Engineering' })).toBe(moved)
  })

  it('refuses two schedule versions from one date', () => {
    const version = { type: 'addScheduleVersion', userId: 'alex', from: '2030-01-01', weeklyHours: 30, breakMinutes: null } as const
    const once = reducer(s, version)
    expect(once.scheduleVersions).toHaveLength(s.scheduleVersions.length + 1)
    expect(reducer(once, version)).toBe(once)
  })

  it('needs two-step verification on before it can be required', () => {
    expect(reducer(s, { type: 'setTwoFactorRequirement', requirement: 'everyone' }).twoFactorRequirement).toBe('none')
    const on = reducer(reducer(s, { type: 'verifyTwoFactor' }), { type: 'confirmRecoveryCodes' })
    expect(on.twoFactor).toBe('on')
    expect(reducer(on, { type: 'setTwoFactorRequirement', requirement: 'everyone' }).twoFactorRequirement).toBe('everyone')
  })

  it('marks one notification read', () => {
    const asHr = reducer(s, { type: 'setRole', role: 'hr' })
    const id = asHr.notifications.find((n) => n.to === 'hr')!.id
    expect(unreadFor(reducer(asHr, { type: 'readNotification', id }))).toBe(unreadFor(asHr) - 1)
  })
})
