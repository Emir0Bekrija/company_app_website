'use client'

import { useMemo, useState } from 'react'
import { Paperclip, Search } from 'lucide-react'
import { expenseAmount, expensesThisMonth, firstWorkingDay, invoiceGross, type Client, type TemplateKind } from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { Field, Input, Modal, Page, Pill, PrimaryButton, Select, SoftButton, StatTile, useFormat } from './primitives'

const BLANK_CLIENT: Omit<Client, 'id'> = { name: '', taxId: '', email: '', city: '', country: 'BA', terms: 30, language: 'bs', secondLanguage: null, active: true }

function ClientForm({ onClose }: { onClose: () => void }) {
  const { dispatch, t, toast } = useDemo()
  const [client, setClient] = useState(BLANK_CLIENT)
  const set = <K extends keyof typeof client>(key: K, value: (typeof client)[K]) => setClient({ ...client, [key]: value })
  return (
    <Modal open wide onClose={onClose} title={t('clients.new')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: 'createClient', client: { ...client, name: client.name.trim() } })
          toast(t('toast.clientCreated'))
          onClose()
        }}
      >
        <Field label={t('clients.name')}><Input required maxLength={60} value={client.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('clients.taxId')}><Input value={client.taxId} onChange={(e) => set('taxId', e.target.value)} /></Field>
          <Field label={t('people.email')}><Input type="email" value={client.email} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label={t('clients.city')}><Input value={client.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label={t('clients.terms')}><Input type="number" min="0" max="120" value={client.terms} onChange={(e) => set('terms', Number(e.target.value))} /></Field>
          <Field label={t('clients.language')}>
            <Select value={client.language} onChange={(e) => set('language', e.target.value as Client['language'])}>
              <option value="bs">Bosanski</option>
              <option value="en">English</option>
            </Select>
          </Field>
          <Field label={t('clients.secondLanguage')}>
            <Select value={client.secondLanguage ?? ''} onChange={(e) => set('secondLanguage', (e.target.value || null) as Client['secondLanguage'])}>
              <option value="">{t('clients.none')}</option>
              <option value="bs">Bosanski</option>
              <option value="en">English</option>
            </Select>
          </Field>
        </div>
        <PrimaryButton type="submit" data-tour="client-save" className="w-full">{t('action.saveChanges')}</PrimaryButton>
      </form>
    </Modal>
  )
}

export function ClientsView() {
  const { state, dispatch, t } = useDemo()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const clients = useMemo(() => state.clients.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())), [state.clients, query])

  return (
    <Page
      title={t('clients.title')}
      subtitle={t('clients.subtitle')}
      actions={<PrimaryButton data-tour="client-new" className="h-9" onClick={() => setCreating(true)}>{t('clients.new')}</PrimaryButton>}
    >
      <div data-tour="client-search" className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <Input aria-label={t('clients.search')} value={query} placeholder={t('clients.search')} className="pl-9" onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="space-y-2">
        {clients.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
            <div className="min-w-0 flex-1 basis-44">
              <p className={`truncate font-medium text-ink-1 ${c.active ? '' : 'line-through'}`}>{c.name}</p>
              <p className="truncate text-xs text-ink-3">{[c.taxId, c.email].filter(Boolean).join(', ')}</p>
            </div>
            <span className="text-xs text-ink-3">{t('clients.terms.short', { days: c.terms })}</span>
            <Pill tone="ink">{t('clients.invoices', { count: state.invoices.filter((i) => i.client === c.name).length })}</Pill>
            <label className="flex items-center gap-1.5 text-xs text-ink-2">
              <input
                type="checkbox"
                className="size-4 accent-emerald-600"
                checked={c.active}
                onChange={(e) => dispatch({ type: 'setClientActive', id: c.id, active: e.target.checked })}
              />
              {t('clients.active')}
            </label>
          </div>
        ))}
        {clients.length === 0 && <p className="rounded-xl border border-dashed border-ink/10 px-4 py-6 text-center text-sm text-ink-3">{t('clients.nothing')}</p>}
      </div>
      {creating && <ClientForm onClose={() => setCreating(false)} />}
    </Page>
  )
}

function ExpenseForm({ onClose }: { onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const [date, setDate] = useState(() => firstWorkingDay(state))
  const [description, setDescription] = useState('')
  const [supplier, setSupplier] = useState('')
  const [reference, setReference] = useState('')
  const [net, setNet] = useState('100')
  const [tax, setTax] = useState('17')
  const amount = Number(net) || 0
  const taxAmount = (amount * (Number(tax) || 0)) / 100
  return (
    <Modal open onClose={onClose} title={t('expenses.new')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: 'createExpense', expense: { date, description: description.trim(), supplier: supplier.trim(), reference: reference.trim(), net: amount, tax: Math.round(taxAmount * 100) / 100 } })
          toast(t('toast.expenseCreated'))
          onClose()
        }}
      >
        <Field label={t('expenses.description')}><Input required maxLength={80} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('expenses.date')}><Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label={t('expenses.supplier')}><Input maxLength={60} value={supplier} onChange={(e) => setSupplier(e.target.value)} /></Field>
          <Field label={t('expenses.net')}><Input type="number" min="0.01" step="0.01" required value={net} onChange={(e) => setNet(e.target.value)} /></Field>
          <Field label={t('expenses.taxRate')}><Input type="number" min="0" max="100" value={tax} onChange={(e) => setTax(e.target.value)} /></Field>
        </div>
        <Field label={t('expenses.reference')}><Input maxLength={40} value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
        <div className="flex justify-between rounded-lg bg-ink/5 px-3 py-2 text-sm">
          <span className="text-ink-3">{t('expenses.amount')}</span>
          <span className="font-semibold text-ink-1">{format.money(amount + taxAmount)}</span>
        </div>
        <PrimaryButton type="submit" data-tour="expense-save" className="w-full">{t('action.saveChanges')}</PrimaryButton>
      </form>
    </Modal>
  )
}

export function ExpensesView() {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const expenses = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.expenses.filter((e) => `${e.description} ${e.supplier}`.toLowerCase().includes(q))
  }, [state.expenses, query])

  return (
    <Page
      title={t('expenses.title')}
      subtitle={t('expenses.subtitle')}
      actions={<PrimaryButton data-tour="expense-new" className="h-9" onClick={() => setCreating(true)}>{t('expenses.new')}</PrimaryButton>}
    >
      <div className="grid gap-2 sm:grid-cols-[14rem_1fr] sm:items-center">
        <div data-tour="expense-total"><StatTile label={t('expenses.thisMonth')} value={format.money(expensesThisMonth(state))} /></div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input aria-label={t('expenses.search')} value={query} placeholder={t('expenses.search')} className="pl-9" onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        {expenses.map((e) => (
          <div key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm">
            <div className="min-w-0 flex-1 basis-44">
              <p className="truncate font-medium text-ink-1">{e.description}</p>
              <p className="truncate text-xs text-ink-3">{[format.short(e.date), e.supplier, e.reference].filter(Boolean).join(', ')}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink-1">{format.money(expenseAmount(e))}</p>
              <p className="text-xs text-ink-3">{t('expenses.netTax', { net: format.money(e.net), tax: format.money(e.tax) })}</p>
            </div>
            {e.attachments.length > 0 && (
              <span aria-label={t('expenses.attachments', { count: e.attachments.length })} className="flex items-center gap-1 text-xs text-ink-3"><Paperclip className="size-3.5" />{e.attachments.length}</span>
            )}
            <SoftButton
              tone="blue"
              data-tour={`expense-attach-${e.id}`}
              onClick={() => { dispatch({ type: 'attachExpense', id: e.id, name: 'scanned-invoice.pdf' }); toast(t('toast.expenseAttached')) }}
            >
              <Paperclip className="size-3.5" />{t('expenses.attach')}
            </SoftButton>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-3">{t('sick.simulated')}</p>
      {creating && <ExpenseForm onClose={() => setCreating(false)} />}
    </Page>
  )
}

const ACCENTS = ['#0b5a63', '#1d4ed8', '#7c3aed', '#be123c', '#334155']
const KINDS: TemplateKind[] = ['builtin', 'layout', 'word']

/** Sample paper, so it stays white whichever theme the frame is in. */
function Paper() {
  const { state, t } = useDemo()
  const format = useFormat()
  const { accent, logo, showTax, showNotes } = state.template
  const invoice = state.invoices[2]
  const gross = invoiceGross(invoice)
  return (
    <div data-tour="template-preview" className="rounded-lg bg-white p-5 text-[0.75rem] leading-relaxed text-slate-800 shadow-lg">
      <div className={`flex items-start justify-between gap-3 ${logo === 'right' ? 'flex-row-reverse' : ''}`}>
        <span className="rounded px-2 py-1 font-semibold text-white" style={{ backgroundColor: accent }}>Halcyon</span>
        <div className={logo === 'right' ? '' : 'text-right'}>
          <p className="text-sm font-semibold" style={{ color: accent }}>{t('templates.paper.invoice')}</p>
          <p>{invoice.number}</p>
        </div>
      </div>
      <p className="mt-4 font-medium">{invoice.client}</p>
      <div className="mt-3 flex justify-between border-b-2 pb-1 font-medium" style={{ borderColor: accent }}>
        <span>{t('invoices.item')}</span><span>{t('invoices.amount')}</span>
      </div>
      <div className="flex justify-between py-1"><span>{invoice.description}</span><span>{format.money(invoice.net)}</span></div>
      {showTax && <div className="flex justify-between py-1 text-slate-600"><span>{t('templates.paper.tax')}</span><span>{format.money(gross - invoice.net)}</span></div>}
      <div className="flex justify-between border-t pt-1 font-semibold"><span>{t('templates.paper.total')}</span><span>{format.money(showTax ? gross : invoice.net)}</span></div>
      {showNotes && <p className="mt-3 text-slate-600">{t('templates.paper.note')}</p>}
    </div>
  )
}

function BuiltIn() {
  const { state, dispatch, t } = useDemo()
  const { accent, logo, showTax, showNotes } = state.template
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <div data-tour="template-accent" className="space-y-1.5">
          <p className="text-xs font-medium text-ink-3">{t('templates.accent')}</p>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((hex, i) => (
              <button
                key={hex}
                type="button"
                aria-label={t('templates.colour', { n: i + 1 })}
                aria-pressed={accent === hex}
                onClick={() => dispatch({ type: 'setTemplate', patch: { accent: hex } })}
                className={`size-8 rounded-full ring-offset-2 ring-offset-surface ${accent === hex ? 'ring-2 ring-ink-1' : ''}`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
        <Field label={t('templates.logo')}>
          <Select value={logo} onChange={(e) => dispatch({ type: 'setTemplate', patch: { logo: e.target.value as 'left' | 'right' } })}>
            <option value="left">{t('templates.left')}</option>
            <option value="right">{t('templates.right')}</option>
          </Select>
        </Field>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-ink-3">{t('templates.blocks')}</p>
          {([['showTax', 'templates.block.tax', showTax], ['showNotes', 'templates.block.notes', showNotes]] as const).map(([key, label, on]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-ink-2">
              <input type="checkbox" className="size-4 accent-emerald-600" checked={on} onChange={(e) => dispatch({ type: 'setTemplate', patch: { [key]: e.target.checked } })} />
              {t(label)}
            </label>
          ))}
        </div>
      </div>
      <Paper />
    </div>
  )
}

function Layout() {
  const { t } = useDemo()
  const fields = [
    { key: 'templates.field.number', left: '62%', top: '14%' },
    { key: 'templates.field.client', left: '8%', top: '30%' },
    { key: 'templates.field.lines', left: '8%', top: '48%' },
    { key: 'templates.field.total', left: '62%', top: '80%' },
  ]
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2 text-sm text-ink-2">
        <p>{t('templates.layout.explain')}</p>
        <p className="text-xs text-ink-3">{t('templates.layout.note')}</p>
      </div>
      <div className="relative aspect-[3/4] max-h-96 rounded-lg bg-white shadow-lg">
        <div aria-hidden className="absolute inset-x-0 top-0 h-[10%] rounded-t-lg bg-slate-200" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-[6%] rounded-b-lg bg-slate-200" />
        {fields.map((f) => (
          <span key={f.key} style={{ left: f.left, top: f.top }} className="absolute rounded border border-dashed border-blue-500 bg-blue-50 px-1.5 py-0.5 text-[0.6875rem] text-blue-800">{t(f.key)}</span>
        ))}
      </div>
    </div>
  )
}

function WordFile() {
  const { t } = useDemo()
  const rows = ['templates.word.upload', 'templates.word.table', 'templates.word.fields']
  return (
    <div className="space-y-2 text-sm text-ink-2">
      <p>{t('templates.word.explain')}</p>
      <ul className="space-y-1.5">
        {rows.map((key) => <li key={key} className="rounded-lg border border-ink/10 bg-ink/5 px-3 py-2">{t(key)}</li>)}
      </ul>
      <p className="text-xs text-ink-3">{t('templates.word.note')}</p>
    </div>
  )
}

export function TemplatesView() {
  const { state, dispatch, t, toast } = useDemo()
  const [tab, setTab] = useState<TemplateKind>('builtin')
  const inUse = state.template.active === tab
  return (
    <Page
      title={t('templates.title')}
      subtitle={t('templates.subtitle')}
      actions={inUse ? <Pill tone="emerald">{t('templates.inUse')}</Pill> : (
        <PrimaryButton
          data-tour="template-use"
          className="h-9"
          onClick={() => { dispatch({ type: 'useTemplate', kind: tab }); toast(t('toast.templateUsed')) }}
        >
          {t('templates.use')}
        </PrimaryButton>
      )}
    >
      <div className="flex gap-1 rounded-lg bg-ink/5 p-1">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            data-tour={`template-tab-${kind}`}
            aria-pressed={tab === kind}
            onClick={() => setTab(kind)}
            className={`h-9 flex-1 rounded-md px-2 text-sm font-medium transition-colors ${tab === kind ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-3 hover:text-ink-1'}`}
          >
            {t(`templates.tab.${kind}`)}
          </button>
        ))}
      </div>
      {tab === 'builtin' ? <BuiltIn /> : tab === 'layout' ? <Layout /> : <WordFile />}
    </Page>
  )
}
