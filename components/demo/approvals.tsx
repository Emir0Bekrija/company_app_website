'use client'

import { useState, type ReactNode } from 'react'
import { dayInfo, formatMinutes, monthDates, WORKER_ID } from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { ErrorNote, Field, Input, Modal, Monogram, Page, Pill, PrimaryButton, Select, SoftButton, useFormat } from './primitives'

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">{children}</div>
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const { t } = useDemo()
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-2">{title}<span className="text-xs font-normal text-ink-3">{count}</span></h3>
      {count === 0 ? <p className="rounded-xl border border-dashed border-ink/10 px-4 py-3 text-sm text-ink-3">{t('approvals.empty')}</p> : children}
    </div>
  )
}

function RejectModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const days = monthDates(state).filter((d) => dayInfo(state, d).work > 0)
  const [date, setDate] = useState(days[0] ?? '')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  return (
    <Modal open onClose={onClose} title={t('approvals.rejectTitle')}>
      <p className="text-sm text-ink-2">{t('approvals.rejectExplain')}</p>
      <Field label={t('approvals.day')}>
        <Select value={date} onChange={(e) => setDate(e.target.value)}>
          {days.map((d) => <option key={d} value={d}>{format.date(d)}</option>)}
        </Select>
      </Field>
      <Field label={t('approvals.note')}>
        <Input value={note} maxLength={120} placeholder={t('approvals.notePlaceholder')} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <ErrorNote>{error}</ErrorNote>
      <PrimaryButton
        data-tour="reject-send"
        className="w-full"
        onClick={() => {
          if (!note.trim()) { setError(t('error.noteRequired')); return }
          dispatch({ type: 'rejectMonth', date, note: note.trim() })
          toast(t('toast.monthRejected'), 'info')
          onClose()
        }}
      >
        {t('approvals.reject')}
      </PrimaryButton>
    </Modal>
  )
}

export function ApprovalsView() {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const [rejecting, setRejecting] = useState(false)
  const person = (id: string) => state.people.find((p) => p.id === id)

  const months = state.queue.filter((q) => q.status === 1)
  const overtime = Object.entries(state.overtime).filter(([, o]) => o.status === 0)
  const leave = state.leaveRequests.filter((r) => r.status === 0)
  const toil = state.toilRequests.filter((r) => r.status === 0)
  const reports = state.reports.filter((r) => r.status === 'reported' || r.document?.status === 'submitted')

  return (
    <Page title={t('approvals.title')} subtitle={t('approvals.subtitle')}>
      <Section title={t('approvals.timesheets')} count={months.length}>
        {months.map((q) => {
          const p = person(q.userId)!
          const own = q.userId === WORKER_ID
          return (
            <Row key={q.userId}>
              <Monogram id={p.id} name={p.name} size="sm" />
              <span className="font-medium text-ink-1">{p.name}</span>
              <span className="text-ink-3">{formatMinutes(q.workMinutes)}</span>
              <span className="ml-auto flex gap-2">
                {own && <SoftButton tone="red" data-tour="reject-open" onClick={() => setRejecting(true)}>{t('approvals.rejectDay')}</SoftButton>}
                <SoftButton
                  tone="emerald"
                  data-tour={own ? 'approve' : undefined}
                  onClick={() => {
                    dispatch(own ? { type: 'approveMonth' } : { type: 'approveRow', userId: q.userId })
                    toast(t('toast.monthApproved', { name: p.name }))
                  }}
                >
                  {t('action.approve')}
                </SoftButton>
              </span>
            </Row>
          )
        })}
      </Section>

      <Section title={t('approvals.overtime')} count={overtime.length}>
        {overtime.map(([date, o]) => (
          <Row key={date}>
            <span className="font-medium text-ink-1">Alex Morgan</span>
            <span className="text-ink-3">{format.short(date)}</span>
            <span className="text-orange-fg">+{formatMinutes(dayInfo(state, date).overtime)}</span>
            <Pill tone="ink">{t(`overtime.${o.election}`)}</Pill>
            <span className="ml-auto flex gap-2">
              <SoftButton tone="red" onClick={() => dispatch({ type: 'reviewOvertime', date, approve: false })}>{t('action.reject')}</SoftButton>
              <SoftButton tone="emerald" data-tour="overtime-approve" onClick={() => { dispatch({ type: 'reviewOvertime', date, approve: true }); toast(t('toast.overtimeApproved')) }}>{t('action.approve')}</SoftButton>
            </span>
          </Row>
        ))}
      </Section>

      <Section title={t('approvals.leave')} count={leave.length + toil.length}>
        {leave.map((r) => (
          <Row key={r.id}>
            <span className="font-medium text-ink-1">Alex Morgan</span>
            <span className="text-ink-3">{format.short(r.from)} – {format.short(r.to)}</span>
            <Pill tone="ink">{t('leave.days', { days: r.days })}</Pill>
            <span className="ml-auto flex gap-2">
              <SoftButton tone="red" onClick={() => dispatch({ type: 'reviewLeave', id: r.id, approve: false })}>{t('action.reject')}</SoftButton>
              <SoftButton tone="emerald" data-tour="leave-approve" onClick={() => { dispatch({ type: 'reviewLeave', id: r.id, approve: true }); toast(t('toast.leaveApproved')) }}>{t('action.approve')}</SoftButton>
            </span>
          </Row>
        ))}
        {toil.map((r) => (
          <Row key={r.id}>
            <span className="font-medium text-ink-1">Alex Morgan</span>
            <span className="text-ink-3">{format.short(r.date)}</span>
            <Pill tone="ink">{t('approvals.toilAmount', { duration: formatMinutes(r.minutes) })}</Pill>
            <span className="ml-auto flex gap-2">
              <SoftButton tone="red" onClick={() => dispatch({ type: 'reviewToil', id: r.id, approve: false })}>{t('action.reject')}</SoftButton>
              <SoftButton tone="emerald" data-tour="toil-approve" onClick={() => { dispatch({ type: 'reviewToil', id: r.id, approve: true }); toast(t('toast.leaveApproved')) }}>{t('action.approve')}</SoftButton>
            </span>
          </Row>
        ))}
      </Section>

      <Section title={t('approvals.reports')} count={reports.length}>
        {reports.map((r) => (
          <Row key={r.id}>
            <span className="font-medium text-ink-1">Alex Morgan</span>
            <span className="text-ink-3">{format.short(r.from)} – {format.short(r.to)}</span>
            <span className="ml-auto flex flex-wrap gap-2">
              {r.document?.status === 'submitted' && (
                <SoftButton tone="blue" data-tour="document-accept" onClick={() => { dispatch({ type: 'acceptDocument', id: r.id }); toast(t('toast.documentAccepted')) }}>{t('approvals.acceptDocument')}</SoftButton>
              )}
              {r.status === 'reported' && (
                <SoftButton tone="emerald" data-tour="report-acknowledge" onClick={() => { dispatch({ type: 'acknowledgeReport', id: r.id }); toast(t('toast.reportAcknowledged')) }}>{t('approvals.acknowledge')}</SoftButton>
              )}
            </span>
          </Row>
        ))}
      </Section>

      {rejecting && <RejectModal onClose={() => setRejecting(false)} />}
    </Page>
  )
}
