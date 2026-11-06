'use client'

import { useState, type FormEvent } from 'react'
import { invoiceBalance, invoiceGross, invoiceSummary, type Invoice, type InvoiceStatus } from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { ErrorNote, Field, Input, Modal, Page, Pill, PrimaryButton, Select, SoftButton, StatTile, useFormat } from './primitives'

const TONE: Record<InvoiceStatus, 'ink' | 'amber' | 'blue' | 'red' | 'emerald'> = { 0: 'ink', 1: 'amber', 2: 'blue', 3: 'red', 4: 'emerald', 5: 'ink' }

function NewInvoiceModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const clients = state.clients.filter((c) => c.active).map((c) => c.name)
  const [client, setClient] = useState(clients[0])
  const [description, setDescription] = useState('')
  const [net, setNet] = useState('1500')
  const amount = Number(net) || 0
  return (
    <Modal open onClose={onClose} title={t('invoices.new')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const due = new Date(state.year, state.month, 15)
          dispatch({
            type: 'createInvoice', client, description: description.trim(), net: amount,
            due: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-15`,
          })
          toast(t('toast.invoiceDrafted'))
          onClose()
        }}
      >
        <Field label={t('invoices.client')}>
          <Select value={client} onChange={(e) => setClient(e.target.value)}>{clients.map((c) => <option key={c}>{c}</option>)}</Select>
        </Field>
        <Field label={t('invoices.item')}><Input required maxLength={80} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <Field label={t('invoices.net')}><Input type="number" min="1" step="0.01" required value={net} onChange={(e) => setNet(e.target.value)} /></Field>
        <div className="flex justify-between rounded-lg bg-ink/5 px-3 py-2 text-sm">
          <span className="text-ink-3">{t('invoices.withTax')}</span>
          <span className="font-semibold text-ink-1">{format.money(amount * 1.17)}</span>
        </div>
        <PrimaryButton type="submit" data-tour="invoice-save" className="w-full">{t('invoices.saveDraft')}</PrimaryButton>
      </form>
    </Modal>
  )
}

function PaymentModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const { dispatch, t, toast } = useDemo()
  const format = useFormat()
  const balance = invoiceBalance(invoice)
  const [amount, setAmount] = useState(String(balance))
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!(value > 0) || value > balance) { setError(t('error.paymentAmount')); return }
    dispatch({ type: 'recordPayment', id: invoice.id, amount: value })
    toast(t('toast.paymentRecorded'))
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={t('invoices.recordPayment')}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-ink-2">{t('invoices.balance', { amount: format.money(balance) })}</p>
        <Field label={t('invoices.amount')}><Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton type="submit" data-tour="payment-send" className="w-full">{t('invoices.recordPayment')}</PrimaryButton>
      </form>
    </Modal>
  )
}

export function InvoicesView() {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState<Invoice | null>(null)
  const summary = invoiceSummary(state)

  return (
    <Page
      title={t('invoices.title')}
      subtitle={t('invoices.subtitle')}
      actions={<PrimaryButton data-tour="invoice-new" className="h-9" onClick={() => setCreating(true)}>{t('invoices.new')}</PrimaryButton>}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t('invoices.outstanding')} value={<span data-testid="outstanding">{format.money(summary.outstanding)}</span>} />
        <StatTile label={t('invoices.overdue')} value={format.money(summary.overdue)} tone={summary.overdue ? 'red' : 'default'} />
        <StatTile label={t('invoices.paid')} value={format.money(summary.paid)} tone="emerald" />
        <StatTile label={t('invoices.review')} value={summary.review} tone={summary.review ? 'amber' : 'default'} />
      </div>

      <div className="space-y-2">
        {state.invoices.map((inv) => (
          <div key={inv.id} className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-l-2 border-ink/10 bg-ink/5 px-4 py-3 text-sm ${inv.status === 3 ? 'border-l-red-500/50' : inv.status === 1 ? 'border-l-amber-500/40' : ''}`}>
            <div className="min-w-0 flex-1 basis-44">
              <p className="truncate font-medium text-ink-1">{inv.client}</p>
              <p className="truncate text-xs text-ink-3">{inv.number ?? t('invoices.noNumber')}{inv.description ? `, ${inv.description}` : ''}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink-1">{format.money(invoiceGross(inv))}</p>
              {inv.paid > 0 && inv.status !== 4 && <p className="text-xs text-ink-3">{t('invoices.paidSoFar', { amount: format.money(inv.paid) })}</p>}
            </div>
            <Pill tone={TONE[inv.status]}>{t(`invoiceStatus.${inv.status}`)}</Pill>
            <div className="flex gap-2">
              {inv.status === 0 && <SoftButton data-tour={`invoice-review-${inv.id}`} onClick={() => { dispatch({ type: 'sendForReview', id: inv.id }); toast(t('toast.sentForReview')) }}>{t('invoices.sendForReview')}</SoftButton>}
              {inv.status === 1 && <SoftButton tone="emerald" data-tour={`invoice-issue-${inv.id}`} onClick={() => { dispatch({ type: 'issueInvoice', id: inv.id }); toast(t('toast.invoiceIssued')) }}>{t('invoices.approveIssue')}</SoftButton>}
              {(inv.status === 2 || inv.status === 3) && <SoftButton tone="blue" data-tour={`invoice-pay-${inv.id}`} onClick={() => setPaying(inv)}>{t('invoices.recordPayment')}</SoftButton>}
            </div>
          </div>
        ))}
      </div>
      {creating && <NewInvoiceModal onClose={() => setCreating(false)} />}
      {paying && <PaymentModal invoice={paying} onClose={() => setPaying(null)} />}
    </Page>
  )
}
