'use client'

import { useState, type FormEvent } from 'react'
import { COMPANY_SCHEDULE, monthKey, validateVersion } from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { DEPARTMENTS } from './org'
import { ErrorNote, Field, Input, Modal, Monogram, Page, Pill, PrimaryButton, Select, SoftButton, StatTile, useFormat } from './primitives'

const label = (format: ReturnType<typeof useFormat>, key: string) => {
  const [y, m] = key.split('-').map(Number)
  return format.month(y, m)
}

export function ActiveMonthView() {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const current = monthKey(state)
  const [suggested] = useState(() => monthKey(state, 1))
  const [year, setYear] = useState(suggested.slice(0, 4))
  const [month, setMonth] = useState(suggested.slice(5))
  const key = `${year}-${month}`
  const years = [state.year - 1, state.year, state.year + 1]

  return (
    <Page title={t('activeMonth.title')} subtitle={t('activeMonth.subtitle')}>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink-2">{t('activeMonth.current')}</h3>
        {state.activeMonths.map((m) => (
          <div key={m} className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
            <span aria-hidden className="size-2 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
            <span className="font-medium text-ink-1">{label(format, m)}</span>
            <span className="ml-auto">
              {m === current ? <Pill tone="emerald">{t('activeMonth.thisMonth')}</Pill> : (
                <SoftButton
                  tone="red"
                  data-tour={`month-off-${m}`}
                  onClick={() => { dispatch({ type: 'deactivateMonth', month: m }); toast(t('toast.monthDeactivated', { month: label(format, m) }), 'info') }}
                >
                  {t('activeMonth.deactivate')}
                </SoftButton>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
        <h3 className="text-sm font-semibold text-ink-2">{t('activeMonth.activateTitle')}</h3>
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
          <Field label={t('activeMonth.year')}>
            <Select value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</Select>
          </Field>
          <Field label={t('activeMonth.month')}>
            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => <option key={m} value={m}>{label(format, `${year}-${m}`)}</option>)}
            </Select>
          </Field>
          <PrimaryButton
            data-tour="month-activate"
            disabled={state.activeMonths.includes(key)}
            onClick={() => { dispatch({ type: 'activateMonth', month: key }); toast(t('toast.monthActivated', { month: label(format, key) })) }}
          >
            {t('activeMonth.activate')}
          </PrimaryButton>
        </div>
      </div>

      <p data-tour="month-note" className="rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3 text-sm text-ink-2">{t('activeMonth.note')}</p>
    </Page>
  )
}

function VersionModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const [from, setFrom] = useState(() => `${monthKey(state, 1)}-01`)
  const [hours, setHours] = useState('30')
  const [breakMinutes, setBreakMinutes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = validateVersion(state, userId, from)
    if (problem) { setError(t(problem)); return }
    dispatch({
      type: 'addScheduleVersion', userId, from,
      weeklyHours: hours ? Number(hours) : null,
      breakMinutes: breakMinutes ? Number(breakMinutes) : null,
    })
    toast(t('toast.versionAdded'))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={t('schedules.addVersion')}>
      <form onSubmit={submit} className="space-y-3">
        <Field label={t('schedules.effectiveFrom')}><Input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('schedules.weeklyHours')}>
            <Input type="number" min="1" max="60" step="0.5" value={hours} placeholder={t('schedules.inherit')} onChange={(e) => setHours(e.target.value)} />
          </Field>
          <Field label={t('schedules.break')}>
            <Select value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)}>
              <option value="">{t('schedules.inherit')}</option>
              {[15, 30, 45, 60].map((m) => <option key={m} value={m}>{t('schedules.minutes', { minutes: m })}</option>)}
            </Select>
          </Field>
        </div>
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton type="submit" data-tour="version-save" className="w-full">{t('schedules.addVersion')}</PrimaryButton>
      </form>
    </Modal>
  )
}

export function SchedulesView() {
  const { state, t } = useDemo()
  const format = useFormat()
  const [userId, setUserId] = useState('alex')
  const [adding, setAdding] = useState(false)
  const versions = state.scheduleVersions.filter((v) => v.userId === userId)
  const company = COMPANY_SCHEDULE

  return (
    <Page title={t('schedules.title')} subtitle={t('schedules.subtitle')}>
      <div data-tour="schedule-defaults" className="space-y-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
        <h3 className="text-sm font-semibold text-ink-2">{t('schedules.defaults')}</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label={t('schedules.weeklyHours')} value={t('schedules.hours', { hours: company.weeklyHours })} />
          <StatTile label={t('schedules.break')} value={t('schedules.minutes', { minutes: company.breakMinutes })} />
          <StatTile label={t('schedules.breakStart')} value={company.breakStart} />
          <StatTile label={t('schedules.window')} value={`${company.start}–${company.end}`} />
        </div>
        <p className="text-xs text-ink-3">{t('schedules.readOnly')}</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="sm:w-64">
            <Field label={t('schedules.overrides')}>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)}>{state.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
            </Field>
          </div>
          <PrimaryButton data-tour="version-add" className="h-9" onClick={() => setAdding(true)}>{t('schedules.addVersion')}</PrimaryButton>
        </div>
        {versions.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
            <span className="font-medium text-ink-1">{t('schedules.from', { date: format.date(v.from) })}</span>
            <span className="ml-auto flex flex-wrap gap-1.5">
              <Pill tone={v.weeklyHours === null ? 'ink' : 'blue'}>{v.weeklyHours === null ? t('schedules.inherit') : t('schedules.hoursWeek', { hours: v.weeklyHours })}</Pill>
              <Pill tone={v.breakMinutes === null ? 'ink' : 'violet'}>{v.breakMinutes === null ? t('schedules.inherit') : t('schedules.breakPill', { minutes: v.breakMinutes })}</Pill>
            </span>
          </div>
        ))}
        {versions.length === 0 && <p className="rounded-xl border border-dashed border-ink/10 px-4 py-3 text-sm text-ink-3">{t('schedules.noVersions')}</p>}
      </div>
      {adding && <VersionModal userId={userId} onClose={() => setAdding(false)} />}
    </Page>
  )
}

function AddMemberModal({ department, onClose }: { department: string; onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const others = state.people.filter((p) => p.department !== department)
  const [id, setId] = useState(others[0]?.id ?? '')
  return (
    <Modal open onClose={onClose} title={t('departments.add')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: 'movePerson', id, department })
          toast(t('toast.personMoved'))
          onClose()
        }}
      >
        <Field label={t('departments.person')}>
          <Select value={id} onChange={(e) => setId(e.target.value)}>{others.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        </Field>
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-fg">{t('departments.moveWarning')}</p>
        <PrimaryButton type="submit" data-tour="dept-add-save" className="w-full">{t('departments.add')}</PrimaryButton>
      </form>
    </Modal>
  )
}

function TeamModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const [name, setName] = useState('')
  const [lead, setLead] = useState('tarik')
  const [members, setMembers] = useState<string[]>([])
  return (
    <Modal open onClose={onClose} title={t('teams.new')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: 'createTeam', name: name.trim(), lead, members })
          toast(t('toast.teamCreated'))
          onClose()
        }}
      >
        <Field label={t('teams.name')}><Input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t('teams.leader')}>
          <Select value={lead} onChange={(e) => setLead(e.target.value)}>{state.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        </Field>
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium text-ink-3">{t('teams.members')}</legend>
          <div className="grid grid-cols-2 gap-1">
            {state.people.filter((p) => p.id !== lead).map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-ink-2">
                <input
                  type="checkbox"
                  className="size-4 accent-emerald-600"
                  checked={members.includes(p.id)}
                  onChange={(e) => setMembers(e.target.checked ? [...members, p.id] : members.filter((m) => m !== p.id))}
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
        <PrimaryButton type="submit" data-tour="team-save" className="w-full">{t('teams.new')}</PrimaryButton>
      </form>
    </Modal>
  )
}

function Teams() {
  const { state, t } = useDemo()
  const [creating, setCreating] = useState(false)
  const person = (id: string) => state.people.find((p) => p.id === id)
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PrimaryButton data-tour="team-new" className="h-9" onClick={() => setCreating(true)}>{t('teams.new')}</PrimaryButton>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {state.teams.map((team) => (
          <div key={team.id} className="space-y-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-ink-1">{team.name}</p>
              <Pill tone="ink">{t('teams.count', { count: team.members.length })}</Pill>
            </div>
            <p className="text-xs text-ink-3">{t('teams.lead', { name: person(team.lead)?.name ?? '' })}</p>
            <span className="flex -space-x-1.5">
              {team.members.map((id) => <Monogram key={id} id={id} name={person(id)?.name ?? ''} size="sm" />)}
            </span>
          </div>
        ))}
      </div>
      {creating && <TeamModal onClose={() => setCreating(false)} />}
    </div>
  )
}

function Departments() {
  const { state, t } = useDemo()
  const format = useFormat()
  const [selected, setSelected] = useState('Engineering')
  const [adding, setAdding] = useState(false)
  const person = (id: string) => state.people.find((p) => p.id === id)
  const members = state.departmentLog.filter((r) => r.department === selected && !r.to)
  const history = state.departmentLog.filter((r) => r.to && person(r.person)?.department === selected)

  return (
    <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
      <div className="flex gap-1 overflow-x-auto lg:flex-col">
        {DEPARTMENTS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={selected === d}
            onClick={() => setSelected(d)}
            className={`flex h-9 shrink-0 items-center justify-between gap-3 rounded-lg px-3 text-sm transition-colors ${selected === d ? 'bg-ink/10 font-medium text-ink-1' : 'text-ink-2 hover:bg-ink/5'}`}
          >
            {t(`department.${d}`)}
            <span className="text-xs text-ink-3">{state.people.filter((p) => p.department === d).length}</span>
          </button>
        ))}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-2">{t(`department.${selected}`)}</h3>
          <PrimaryButton data-tour="dept-add" className="h-9" onClick={() => setAdding(true)}>{t('departments.add')}</PrimaryButton>
        </div>
        <div className="overflow-x-auto rounded-xl border border-ink/10">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs text-ink-3">
                <th scope="col" className="px-3 py-2 font-medium">{t('departments.person')}</th>
                <th scope="col" className="px-3 py-2 font-medium">{t('people.role')}</th>
                <th scope="col" className="px-3 py-2 font-medium">{t('departments.addedOn')}</th>
                <th scope="col" className="px-3 py-2 font-medium">{t('departments.addedBy')}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((r) => {
                const p = person(r.person)
                return (
                  <tr key={r.id} className="border-b border-ink/5 last:border-0">
                    <td className="px-3 py-2 font-medium text-ink-1">{p?.name}</td>
                    <td className="px-3 py-2 text-ink-2">{p ? t(`role.${p.role}`) : ''}</td>
                    <td className="px-3 py-2 text-ink-2">{format.date(r.from)}</td>
                    <td className="px-3 py-2 text-ink-2">{person(r.addedBy)?.name}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div data-tour="dept-history" className="space-y-2">
          <h3 className="text-sm font-semibold text-ink-2">{t('departments.previous')}</h3>
          {history.map((r) => (
            <p key={r.id} className="rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-ink-2">
              {t('departments.historyRow', {
                name: person(r.person)?.name ?? '',
                department: t(`department.${r.department}`),
                from: format.date(r.from),
                to: format.date(r.to!),
                by: person(r.removedBy ?? '')?.name ?? '',
              })}
            </p>
          ))}
          {history.length === 0 && <p className="rounded-xl border border-dashed border-ink/10 px-4 py-3 text-sm text-ink-3">{t('departments.noHistory')}</p>}
        </div>
      </div>
      {adding && <AddMemberModal department={selected} onClose={() => setAdding(false)} />}
    </div>
  )
}

export function DepartmentsView() {
  const { state, t } = useDemo()
  const [tab, setTab] = useState<'departments' | 'teams'>('departments')
  return (
    <Page title={t('departments.title')} subtitle={t('departments.subtitle', { departments: DEPARTMENTS.length, people: state.people.length })}>
      <div className="flex gap-1 rounded-lg bg-ink/5 p-1">
        {(['departments', 'teams'] as const).map((id) => (
          <button
            key={id}
            type="button"
            data-tour={id === 'teams' ? 'teams-tab' : undefined}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`h-9 flex-1 rounded-md px-3 text-sm font-medium transition-colors ${tab === id ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-3 hover:text-ink-1'}`}
          >
            {t(`departments.tab.${id}`)}
          </button>
        ))}
      </div>
      {tab === 'departments' ? <Departments /> : <Teams />}
    </Page>
  )
}
