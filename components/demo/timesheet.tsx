'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import {
  canEditMonth, dayInfo, formatMinutes, incompleteDays, monthDates, monthTotals, REQUIRED_MINUTES,
  toMinutes, validateEntry, type Entry, type EntryInput, type EntryType,
} from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { ErrorNote, Field, Input, Modal, Page, Pill, PrimaryButton, SoftButton, StatTile, useFormat } from './primitives'

// Day colours are the app's, from utils/day-status.ts.
const DAY_FILL = {
  holiday: 'bg-violet-500/22 dark:bg-violet-500/10 border-violet-500/45 dark:border-violet-500/25',
  vacation: 'bg-emerald-500/25 dark:bg-emerald-500/15 border-emerald-500/50 dark:border-emerald-500/30',
  absence: 'bg-rose-500/25 dark:bg-rose-500/15 border-rose-500/50 dark:border-rose-500/30',
  flagged: 'bg-amber-500/28 dark:bg-amber-500/15 border-amber-500/55 dark:border-amber-500/30',
}

const LEGEND = [
  { key: 'legend.absence', swatch: 'bg-rose-500/55 dark:bg-rose-500/40 border border-rose-500/65 dark:border-rose-500/50' },
  { key: 'legend.vacation', swatch: 'bg-emerald-500/55 dark:bg-emerald-500/40 border border-emerald-500/65 dark:border-emerald-500/50' },
  { key: 'legend.holiday', swatch: 'bg-violet-500/55 dark:bg-violet-500/40 border border-violet-500/65 dark:border-violet-500/50' },
  { key: 'legend.flagged', swatch: 'bg-amber-500/60 dark:bg-amber-500/40 border border-amber-500/70 dark:border-amber-500/50' },
]

const TYPE_BADGE: Record<number, string> = {
  1: 'bg-emerald-500/15 text-emerald-fg',
  2: 'bg-amber-500/15 text-amber-fg',
  3: 'bg-violet-500/15 text-violet-fg',
  4: 'bg-cyan-500/15 text-cyan-fg',
}

const TYPE_BAR: Record<number, string> = {
  1: 'bg-emerald-500/70 border-emerald-300/40',
  3: 'bg-violet-500/70 border-violet-300/40',
  4: 'bg-cyan-500/70 border-cyan-300/40',
}

const STATUS_TONE = { 0: 'ink', 1: 'blue', 2: 'emerald', 3: 'red' } as const

function DayTimeline({ entries }: { entries: Entry[] }) {
  const { t } = useDemo()
  const timed = entries.filter((e) => e.start && e.end).map((e) => ({ ...e, a: toMinutes(e.start!), b: toMinutes(e.end!) }))
  if (!timed.length) return null
  const from = Math.floor(Math.min(...timed.map((e) => e.a)) / 60) * 60
  const to = Math.ceil(Math.max(...timed.map((e) => e.b)) / 60) * 60
  const spanMin = Math.max(to - from, 60)
  const pct = (m: number) => ((m - from) / spanMin) * 100
  const hours = Array.from({ length: spanMin / 60 + 1 }, (_, i) => from + i * 60)
  return (
    <div className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-3">
      <div className="relative h-9">
        {hours.map((m) => <div key={m} className="absolute inset-y-0 border-l border-ink/20" style={{ left: `${pct(m)}%` }} />)}
        {timed.map((e) => (
          <div
            key={e.id}
            title={`${t(`type.${e.type}`)} ${e.start} – ${e.end}`}
            className={`absolute inset-y-1 rounded-md border ${TYPE_BAR[e.type] ?? TYPE_BAR[1]}`}
            style={{ left: `${pct(e.a)}%`, width: `${Math.max(((e.b - e.a) / spanMin) * 100, 0.5)}%` }}
          />
        ))}
      </div>
      <div className="relative mt-0.5 h-4">
        {hours.filter((_, i) => i % 2 === 0).map((m) => (
          <span key={m} className="absolute -translate-x-1/2 text-[0.625rem] text-ink-3" style={{ left: `${pct(m)}%` }}>
            {String(Math.floor(m / 60)).padStart(2, '0')}:00
          </span>
        ))}
      </div>
    </div>
  )
}

function EntryForm({ date, entry, onClose }: { date: string; entry: Entry | null; onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const info = dayInfo(state, date)
  const lastEnd = info.entries.filter((e) => e.end).at(-1)?.end
  const [type, setType] = useState<EntryType>(entry?.type ?? 1)
  const [start, setStart] = useState(entry?.start ?? lastEnd ?? '08:00')
  const [end, setEnd] = useState(entry?.end ?? (lastEnd ? '16:00' : '12:00'))
  const [note, setNote] = useState(entry?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const input: EntryInput = { date, type, start, end, note }
    const problem = validateEntry(state, input, entry?.id)
    if (problem) { setError(t(problem)); return }
    dispatch({ type: 'saveEntry', input, id: entry?.id })
    toast(t(entry ? 'toast.entryUpdated' : 'toast.entryCreated'))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={t(entry ? 'entry.editTitle' : 'entry.addTitle')}>
      <form onSubmit={submit} className="space-y-3">
        <div role="radiogroup" aria-label={t('entry.type')} className="grid grid-cols-2 gap-1 rounded-lg bg-ink/5 p-1">
          {([1, 3] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => setType(value)}
              className={`h-9 rounded-md text-sm font-medium transition-colors ${type === value ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-3 hover:text-ink-1'}`}
            >
              {t(`type.${value}`)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('entry.start')}><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} required /></Field>
          <Field label={t('entry.end')}><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required /></Field>
        </div>
        <Field label={t('entry.note')}>
          <Input value={note} maxLength={120} placeholder={t('entry.notePlaceholder')} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton type="submit" className="w-full">{t(entry ? 'action.saveChanges' : 'entry.create')}</PrimaryButton>
      </form>
    </Modal>
  )
}

function DayPanel({ date, onClose }: { date: string; onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const [editing, setEditing] = useState<Entry | 'new' | null>(null)
  const info = dayInfo(state, date)
  const editable = canEditMonth(state)
  const locked = info.absence?.absence === 'vacation'
  const flagged = state.flagged.includes(date)

  return (
    <>
      <Modal open={!editing} onClose={onClose} title={format.date(date)}>
        {info.working && (
          <div className={`rounded-xl border px-3 py-2.5 ${info.complete ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-2">{t('day.scheduleCheck')}</span>
              <span className="text-xs text-ink-3">
                {t('day.requiredLogged', { required: formatMinutes(REQUIRED_MINUTES), logged: formatMinutes(info.work) })}
              </span>
            </div>
            <p className="mt-1 flex items-start gap-2 text-sm text-ink-2">
              <span className={`w-3 shrink-0 text-center font-semibold ${info.complete ? 'text-emerald-fg' : 'text-amber-fg'}`}>{info.complete ? '✓' : '!'}</span>
              {t(info.absence ? 'day.absenceCovered' : info.complete ? 'day.complete' : 'day.incomplete')}
            </p>
          </div>
        )}
        {flagged && <ErrorNote>{t('day.flagged', { note: state.rejectNote })}</ErrorNote>}

        <DayTimeline entries={info.entries} />

        <div className="max-h-56 space-y-1 overflow-y-auto">
          {info.entries.length === 0 && <p className="py-2 text-sm text-ink-3">{t('day.noEntries')}</p>}
          {info.entries.map((e) => (
            <div key={e.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
              <span className={`rounded-full px-2 py-0.5 text-xs ${TYPE_BADGE[e.type]}`}>
                {e.absence ? t(`absence.${e.absence}`) : t(`type.${e.type}`)}
              </span>
              {e.start && <span className="text-ink-2">{e.start} – {e.end}</span>}
              {e.note && <span className="min-w-0 flex-1 truncate text-xs text-ink-3">{e.note}</span>}
              {editable && e.type !== 2 && (
                <span className="ml-auto flex gap-0.5">
                  <button type="button" aria-label={t('action.edit')} onClick={() => setEditing(e)} className="rounded-md p-1.5 text-ink-3 hover:bg-ink/5 hover:text-ink-1"><Pencil className="size-3.5" /></button>
                  <button
                    type="button"
                    aria-label={t('action.delete')}
                    onClick={() => { dispatch({ type: 'deleteEntry', id: e.id }); toast(t('toast.entryDeleted')) }}
                    className="rounded-md p-1.5 text-ink-3 hover:bg-red-500/10 hover:text-red-fg"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>

        {info.overtime > 0 && <OvertimeRow date={date} minutes={info.overtime} />}

        {!info.working ? (
          <p className="rounded-xl border border-ink/10 bg-ink/5 py-2 text-center text-xs text-ink-3">{t(info.holiday ? 'day.holiday' : 'day.nonWorking')}</p>
        ) : locked ? (
          <p className="rounded-xl border border-ink/10 bg-ink/5 py-2 text-center text-xs text-ink-3">{t('day.vacationLocked')}</p>
        ) : editable ? (
          <div className="space-y-2">
            <PrimaryButton data-testid="add-block" data-tour="add-block" className="w-full" onClick={() => setEditing('new')}>{t('day.addBlock')}</PrimaryButton>
            {info.entries.length === 0 && (
              <SoftButton
                tone="blue"
                data-tour="autofill-day"
                className="w-full"
                onClick={() => { dispatch({ type: 'autofillDay', date }); toast(t('toast.dayFilled')) }}
              >
                {t('day.autofill')}
              </SoftButton>
            )}
          </div>
        ) : (
          <p className="rounded-xl border border-ink/10 bg-ink/5 py-2 text-center text-xs text-ink-3">{t('day.monthLocked')}</p>
        )}
      </Modal>
      {editing && <EntryForm date={date} entry={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function OvertimeRow({ date, minutes }: { date: string; minutes: number }) {
  const { state, dispatch, t } = useDemo()
  const current = state.overtime[date] ?? { election: 'paid' as const, status: 0 as const }
  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-orange-fg">{t('overtime.amount', { duration: formatMinutes(minutes) })}</span>
        <Pill tone={current.status === 1 ? 'emerald' : current.status === 2 ? 'red' : 'amber'}>{t(`overtime.status.${current.status}`)}</Pill>
      </div>
      {current.status === 0 && (
        <div role="radiogroup" aria-label={t('overtime.choose')} className="mt-2 grid grid-cols-2 gap-1 rounded-lg bg-ink/5 p-1">
          {(['paid', 'toil'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              data-tour={`overtime-${value}`}
              aria-checked={current.election === value}
              onClick={() => dispatch({ type: 'electOvertime', date, election: value })}
              className={`h-8 rounded-md text-xs font-medium transition-colors ${current.election === value ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-3 hover:text-ink-1'}`}
            >
              {t(`overtime.${value}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MonthGrid({ onSelect, compact }: { onSelect?: (date: string) => void; compact?: boolean }) {
  const { state, t } = useDemo()
  const format = useFormat()
  const dates = useMemo(() => monthDates(state), [state])
  const offset = (new Date(state.year, state.month - 1, 1).getDay() + 6) % 7
  const trailing = (7 - ((offset + dates.length) % 7)) % 7
  const height = compact ? 'h-14 sm:h-16' : 'h-20'

  return (
    <div className="snap-x snap-mandatory overflow-x-auto rounded-xl border border-ink/10 bg-ink/[0.02] sm:snap-none">
      <div className="w-[175%] sm:w-full">
        <div className="grid grid-cols-7 border-b border-ink/10">
          {format.weekdays.map((d) => <div key={d} className="snap-start py-2 text-center text-xs font-medium text-ink-3">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: offset }, (_, i) => <div key={`a${i}`} className={`${height} border-b border-r border-ink/5 bg-ink/[0.01]`} />)}
          {dates.map((date) => {
            const info = dayInfo(state, date)
            const absence = info.absence?.absence
            const flagged = state.flagged.includes(date)
            const fill = flagged ? DAY_FILL.flagged
              : info.holiday ? DAY_FILL.holiday
              : absence === 'sick' || absence === 'other' ? DAY_FILL.absence
              : absence ? DAY_FILL.vacation
              : ''
            const today = date === state.today
            return (
              <button
                key={date}
                type="button"
                data-day={date}
                data-tour={`day-${date}`}
                onClick={() => onSelect?.(date)}
                aria-label={format.date(date)}
                className={`group relative snap-start border-b border-r p-2 text-left transition-colors ${height}
                  ${fill || 'border-ink/5 hover:bg-ink/5'}
                  ${!info.working && !info.holiday ? 'opacity-40' : ''}
                  ${today ? 'ring-1 ring-inset ring-emerald-500/30' : ''}`}
              >
                <div className={`mb-1 text-xs font-medium ${today ? 'text-emerald-fg' : 'text-ink-2'}`}>{Number(date.slice(-2))}</div>
                {info.holiday && <div className="truncate text-xs text-violet-fg">{t('legend.holiday')}</div>}
                {!info.holiday && info.work > 0 && <div className="text-xs font-medium text-emerald-fg">{formatMinutes(info.work)}</div>}
                {absence && <div className="truncate text-xs font-medium text-ink-2">{t(`absence.${absence}`)}</div>}
                {info.overtime > 0 && <span className="absolute right-1.5 top-1.5 text-[0.625rem] font-medium text-orange-fg">+{formatMinutes(info.overtime)}</span>}
                {(info.work > 0 || absence) && <div className={`absolute bottom-1.5 right-1.5 size-1.5 rounded-full ${info.work > 0 ? 'bg-emerald-500' : 'bg-orange-400'}`} />}
              </button>
            )
          })}
          {Array.from({ length: trailing }, (_, i) => <div key={`b${i}`} className={`${height} border-b border-r border-ink/5 bg-ink/[0.01]`} />)}
        </div>
      </div>
    </div>
  )
}

export function TimesheetView() {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const [selected, setSelected] = useState<string | null>(null)
  const totals = monthTotals(state)
  const missing = incompleteDays(state)
  const editable = canEditMonth(state)
  const overtime = totals.overtimePending + totals.overtimePaid + totals.overtimeToil

  return (
    <Page
      title={t('timesheet.title')}
      subtitle={t('timesheet.subtitle')}
      actions={(
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ink-1">{format.month(state.year, state.month)}</span>
          <Pill tone={STATUS_TONE[state.monthStatus]}>{t(`status.${state.monthStatus}`)}</Pill>
        </div>
      )}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t('timesheet.work')} value={<span data-testid="total-work">{formatMinutes(totals.work)}</span>} tone="emerald" />
        <StatTile label={t('timesheet.break')} value={formatMinutes(totals.break)} />
        <StatTile
          label={t('timesheet.overtime')}
          value={formatMinutes(overtime)}
          hint={totals.overtimePending ? t('timesheet.overtimePending', { duration: formatMinutes(totals.overtimePending) }) : undefined}
        />
        <StatTile label={t('timesheet.daysLeft')} value={<span data-testid="days-left">{missing.length}</span>} tone={missing.length ? 'amber' : 'emerald'} />
      </div>

      {state.monthStatus === 3 && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-fg">
          {t('timesheet.rejected', { note: state.rejectNote })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <SoftButton
          tone="blue"
          data-tour="autofill"
          disabled={!editable || missing.length === 0}
          onClick={() => { dispatch({ type: 'autofillMonth' }); toast(t('toast.monthFilled')) }}
        >
          {t('timesheet.autofillMonth')}
        </SoftButton>
        <PrimaryButton
          data-tour="submit"
          className="h-9"
          disabled={!editable || missing.length > 0 || state.flagged.length > 0}
          onClick={() => { dispatch({ type: 'submitMonth' }); toast(t('toast.monthSubmitted')) }}
        >
          <Check className="size-4" />
          {t('timesheet.submit')}
        </PrimaryButton>
      </div>

      <MonthGrid onSelect={setSelected} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-3">
        {LEGEND.map((l) => (
          <span key={l.key} className="flex items-center gap-1.5">
            <span className={`inline-block size-3 rounded-sm ${l.swatch}`} />
            {t(l.key)}
          </span>
        ))}
      </div>

      {selected && <DayPanel date={selected} onClose={() => setSelected(null)} />}
    </Page>
  )
}
