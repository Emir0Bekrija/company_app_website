'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { Paperclip } from 'lucide-react'
import {
  firstWorkingDay, formatMinutes, freeLeaveRange, leaveBalance, nextWorkingDays, toilBalance, validateAbsence, validateLeave, validateToil, workingDaysBetween,
  type AbsenceRequest,
} from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { ErrorNote, Field, Input, Modal, Page, Pill, PrimaryButton, Select, SoftButton, StatTile, useFormat } from './primitives'

const REQUEST_TONE = { 0: 'amber', 1: 'emerald', 2: 'red' } as const

function RequestLeaveModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const [suggested] = useState(() => freeLeaveRange(state))
  const [from, setFrom] = useState(suggested[0])
  const [to, setTo] = useState(suggested[1])
  const [error, setError] = useState<string | null>(null)
  const days = from && to && to >= from ? workingDaysBetween(state, from, to).length : 0

  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = validateLeave(state, from, to)
    if (problem) { setError(t(problem)); return }
    dispatch({ type: 'requestLeave', from, to })
    toast(t('toast.leaveRequested'))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={t('leave.requestTitle')}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('leave.from')}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required /></Field>
          <Field label={t('leave.to')}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} required /></Field>
        </div>
        {days > 0 && <p className="text-sm text-ink-2">{t('leave.preview', { days })}</p>}
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton type="submit" data-tour="leave-send" className="w-full">{t('leave.send')}</PrimaryButton>
      </form>
    </Modal>
  )
}

function ReportSickModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const [from, setFrom] = useState(() => firstWorkingDay(state))
  const [to, setTo] = useState(from)
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!from || !to || to < from) { setError(t('error.dateOrder')); return }
    if (!workingDaysBetween(state, from, to).length) { setError(t('error.noWorkingDays')); return }
    dispatch({ type: 'reportSick', from, to })
    toast(t('toast.sickReported'))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={t('sick.title')}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-ink-2">{t('sick.explain')}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('sick.first')}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required /></Field>
          <Field label={t('sick.expectedEnd')}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} required /></Field>
        </div>
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton type="submit" data-tour="sick-send" className="w-full">{t('sick.send')}</PrimaryButton>
      </form>
    </Modal>
  )
}

export function LeaveView() {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const [modal, setModal] = useState<'leave' | 'sick' | null>(null)
  const balance = leaveBalance(state)

  return (
    <Page
      title={t('leave.title')}
      subtitle={t('leave.subtitle')}
      actions={(
        <div className="flex flex-wrap gap-2">
          <SoftButton data-tour="sick-report" onClick={() => setModal('sick')}>{t('sick.button')}</SoftButton>
          <PrimaryButton data-tour="leave-request" className="h-9" onClick={() => setModal('leave')}>{t('leave.button')}</PrimaryButton>
        </div>
      )}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t('leave.entitled')} value={balance.entitled} />
        <StatTile label={t('leave.used')} value={balance.used} />
        <StatTile label={t('leave.pending')} value={balance.pending} tone={balance.pending ? 'amber' : 'default'} />
        <StatTile label={t('leave.remaining')} value={<span data-testid="leave-remaining" data-tour="leave-remaining">{balance.remaining}</span>} tone="emerald" />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink-2">{t('leave.myRequests')}</h3>
        {state.leaveRequests.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
            <span className="text-ink-1">{format.short(r.from)} – {format.short(r.to)}</span>
            <span className="text-ink-3">{t('leave.days', { days: r.days })}</span>
            <Pill tone={REQUEST_TONE[r.status]}>{t(`request.${r.status}`)}</Pill>
          </div>
        ))}
      </div>

      {state.reports.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ink-2">{t('sick.reports')}</h3>
          {state.reports.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
              <span className="text-ink-1">{format.short(r.from)} – {format.short(r.to)}</span>
              {r.document ? (
                <span className="flex items-center gap-1.5 text-xs text-ink-3"><Paperclip className="size-3.5" />{r.document.name}</span>
              ) : (
                <SoftButton
                  tone="blue"
                  data-tour="sick-attach"
                  onClick={() => { dispatch({ type: 'attachDocument', id: r.id, name: 'doctor-certificate.pdf' }); toast(t('toast.documentAttached')) }}
                >
                  <Paperclip className="size-3.5" />{t('sick.attach')}
                </SoftButton>
              )}
              <Pill tone={r.status === 'acknowledged' ? 'emerald' : 'blue'}>{t(`sick.status.${r.status}`)}</Pill>
            </div>
          ))}
          <p className="text-xs text-ink-3">{t('sick.simulated')}</p>
        </div>
      )}

      {modal === 'leave' && <RequestLeaveModal onClose={() => setModal(null)} />}
      {modal === 'sick' && <ReportSickModal onClose={() => setModal(null)} />}
    </Page>
  )
}

const ABSENCE_TONE = { 0: 'amber', 1: 'emerald', 2: 'emerald', 3: 'red' } as const

function NewAbsenceModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const types = state.absenceTypes.filter((a) => a.mode === 'request' && !a.hrOnly && !a.annualLeave)
  const [suggested] = useState(() => nextWorkingDays(state, 3))
  const [typeId, setTypeId] = useState(types[0].id)
  const [from, setFrom] = useState(suggested[1])
  const [to, setTo] = useState(suggested[2])
  const [reason, setReason] = useState('')
  const [proposal, setProposal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const days = from && to && to >= from ? workingDaysBetween(state, from, to).length : 0

  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = validateAbsence(state, from, to)
    if (problem) { setError(t(problem)); return }
    dispatch({ type: 'requestAbsence', typeId, from, to, reason: reason.trim(), proposal: proposal.trim() })
    toast(t('toast.leaveRequested'))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={t('absences.new')}>
      <form onSubmit={submit} className="space-y-3">
        <Field label={t('absences.type')}>
          <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>{types.map((a) => <option key={a.id} value={a.id}>{t(a.name)}</option>)}</Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('absences.from')}><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required /></Field>
          <Field label={t('absences.to')}><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} required /></Field>
        </div>
        <p className="text-xs text-ink-3">{t('absences.skipped')}</p>
        {days > 0 && <p className="text-sm text-ink-2">{t('absences.preview', { days })}</p>}
        <Field label={t('absences.reason')}><Input maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Field label={t('absences.proposal')}><Input maxLength={120} value={proposal} placeholder={t('absences.proposalPlaceholder')} onChange={(e) => setProposal(e.target.value)} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton type="submit" data-tour="absence-send" className="w-full">{t('leave.send')}</PrimaryButton>
      </form>
    </Modal>
  )
}

function AbsenceRow({ request, children }: { request: AbsenceRequest; children?: ReactNode }) {
  const { state, t } = useDemo()
  const format = useFormat()
  const type = state.absenceTypes.find((a) => a.id === request.typeId)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
      <span className="font-medium text-ink-1">{type ? t(type.name) : ''}</span>
      <span className="text-ink-3">{format.short(request.from)} – {format.short(request.to)}</span>
      <span className="text-ink-3">{t('leave.days', { days: request.days })}</span>
      {request.proposal && <span className="min-w-0 truncate text-xs text-ink-3">{request.proposal}</span>}
      <span className="ml-auto flex flex-wrap items-center gap-2">
        {children ?? <Pill tone={ABSENCE_TONE[request.status]}>{t(`absences.status.${request.status}`)}</Pill>}
      </span>
    </div>
  )
}

export function AbsencesView() {
  const { state, dispatch, t, toast } = useDemo()
  const [creating, setCreating] = useState(false)
  const hr = state.role === 'hr'
  const pending = state.absenceRequests.filter((r) => r.status === 0)
  const decide = (id: string, decision: 'with' | 'without' | 'reject') => {
    dispatch({ type: 'reviewAbsence', id, decision })
    toast(t(decision === 'reject' ? 'toast.absenceRejected' : 'toast.leaveApproved'))
  }

  return (
    <Page
      title={t('absences.title')}
      subtitle={t(hr ? 'absences.subtitleHr' : 'absences.subtitle')}
      actions={hr ? undefined : <PrimaryButton data-tour="absence-new" className="h-9" onClick={() => setCreating(true)}>{t('absences.new')}</PrimaryButton>}
    >
      {hr ? (
        <>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-ink-2">{t('absences.queue')}</h3>
            {pending.map((r) => (
              <AbsenceRow key={r.id} request={r}>
                <SoftButton tone="red" onClick={() => decide(r.id, 'reject')}>{t('action.reject')}</SoftButton>
                <SoftButton onClick={() => decide(r.id, 'without')}>{t('absences.approveWithout')}</SoftButton>
                <SoftButton tone="emerald" data-tour="absence-approve" onClick={() => decide(r.id, 'with')}>{t('absences.approveWith')}</SoftButton>
              </AbsenceRow>
            ))}
            {state.absenceRequests.filter((r) => r.status !== 0).map((r) => <AbsenceRow key={r.id} request={r} />)}
            {state.absenceRequests.length === 0 && <p className="rounded-xl border border-dashed border-ink/10 px-4 py-3 text-sm text-ink-3">{t('approvals.empty')}</p>}
          </div>
          <div data-tour="absence-types" className="space-y-2">
            <h3 className="text-sm font-semibold text-ink-2">{t('absences.catalogue')}</h3>
            {state.absenceTypes.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
                <span className="font-medium text-ink-1">{t(a.name)}</span>
                <span className="text-xs text-ink-3">{a.code}</span>
                <span className="ml-auto flex flex-wrap gap-1.5">
                  <Pill tone={a.hrOnly ? 'ink' : 'blue'}>{t(a.hrOnly ? 'absences.pill.hrOnly' : 'absences.pill.onRequest')}</Pill>
                  {a.annualLeave && <Pill tone="emerald">{t('absences.pill.annual')}</Pill>}
                  {a.mode === 'reported' && <Pill tone="amber">{t('absences.pill.reported')}</Pill>}
                  {a.documentDays !== null && <Pill tone="violet">{t('absences.pill.document', { days: a.documentDays })}</Pill>}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ink-2">{t('leave.myRequests')}</h3>
          {state.absenceRequests.map((r) => <AbsenceRow key={r.id} request={r} />)}
          {state.absenceRequests.length === 0 && <p className="rounded-xl border border-dashed border-ink/10 px-4 py-3 text-sm text-ink-3">{t('absences.none')}</p>}
        </div>
      )}
      {creating && <NewAbsenceModal onClose={() => setCreating(false)} />}
    </Page>
  )
}

export function ToilView() {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const balance = toilBalance(state)
  const [date, setDate] = useState(() => nextWorkingDays(state, 1)[0])
  const [hours, setHours] = useState('60')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = validateToil(state, date, Number(hours))
    if (problem) { setError(t(problem)); return }
    setError(null)
    dispatch({ type: 'requestToil', date, minutes: Number(hours) })
    toast(t('toast.toilRequested'))
    setDate('')
  }

  const ledger = Object.entries(state.overtime)
  return (
    <Page title={t('toil.title')} subtitle={t('toil.subtitle')}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label={t('toil.available')} value={<span data-testid="toil-available" data-tour="toil-available">{formatMinutes(Math.max(balance.available, 0))}</span>} tone="emerald" />
        <StatTile label={t('toil.banked')} value={formatMinutes(balance.banked)} />
        <StatTile label={t('toil.spent')} value={formatMinutes(balance.spent)} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink-2">{t('toil.ledger')}</h3>
        {ledger.map(([d, o]) => (
          <div key={d} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
            <span className="text-ink-1">{format.short(d)}</span>
            <span className="text-ink-3">{t(`overtime.${o.election}`)}</span>
            <Pill tone={o.status === 1 ? 'emerald' : o.status === 2 ? 'red' : 'amber'}>{t(`overtime.status.${o.status}`)}</Pill>
          </div>
        ))}
        {state.toilRequests.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
            <span className="text-ink-1">{format.short(r.date)}</span>
            <span className="text-ink-3">{formatMinutes(r.minutes)}</span>
            <Pill tone={REQUEST_TONE[r.status]}>{t(`request.${r.status}`)}</Pill>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
        <h3 className="text-sm font-semibold text-ink-2">{t('toil.request')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('toil.date')}><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
          <Field label={t('toil.amount')}>
            <Select value={hours} onChange={(e) => setHours(e.target.value)}>
              {[30, 60, 90].map((m) => <option key={m} value={m}>{formatMinutes(m)}</option>)}
            </Select>
          </Field>
        </div>
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton type="submit" data-tour="toil-send">{t('toil.send')}</PrimaryButton>
        {balance.available === 0 && <p className="text-xs text-ink-3">{t('toil.emptyHint')}</p>}
      </form>
    </Page>
  )
}
