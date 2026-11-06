'use client'

import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, Search } from 'lucide-react'
import { dayInfo, formatMinutes, monthDates, PERMISSION_ACTIONS, PERMISSION_MODULES, SYSTEM_ROLES } from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { ErrorNote, Field, Input, Modal, Monogram, Page, Pill, PrimaryButton, Select, useFormat } from './primitives'

export const DEPARTMENTS = ['Engineering', 'Design', 'Finance', 'People']
const ROLES = ['Worker', 'TeamLead', 'HR', 'Finance']

function InviteModal({ onClose }: { onClose: () => void }) {
  const { dispatch, t, toast } = useDemo()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Worker')
  const [department, setDepartment] = useState('Engineering')
  return (
    <Modal open onClose={onClose} title={t('people.invite')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: 'invitePerson', name: name.trim(), email: email.trim(), role, department })
          toast(t('toast.invited', { name: name.trim() }))
          onClose()
        }}
      >
        <Field label={t('people.name')}><Input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t('people.email')}><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('people.role')}>
            <Select value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}</Select>
          </Field>
          <Field label={t('people.department')}>
            <Select value={department} onChange={(e) => setDepartment(e.target.value)}>{DEPARTMENTS.map((d) => <option key={d} value={d}>{t(`department.${d}`)}</option>)}</Select>
          </Field>
        </div>
        <p className="text-xs text-ink-3">{t('people.simulated')}</p>
        <PrimaryButton type="submit" data-tour="invite-send" className="w-full">{t('people.send')}</PrimaryButton>
      </form>
    </Modal>
  )
}

export function PeopleView() {
  const { state, t } = useDemo()
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [inviting, setInviting] = useState(false)
  const people = useMemo(() => state.people.filter((p) =>
    (department === 'all' || p.department === department)
    && p.name.toLowerCase().includes(query.trim().toLowerCase())), [state.people, query, department])

  return (
    <Page
      title={t('people.title')}
      subtitle={t('people.subtitle')}
      actions={<PrimaryButton data-tour="invite-open" className="h-9" onClick={() => setInviting(true)}>{t('people.invite')}</PrimaryButton>}
    >
      <div data-tour="people-filter" className="grid gap-2 sm:grid-cols-[1fr_12rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input aria-label={t('people.search')} value={query} placeholder={t('people.search')} className="pl-9" onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select aria-label={t('people.department')} value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="all">{t('people.allDepartments')}</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{t(`department.${d}`)}</option>)}
        </Select>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {people.map((p) => (
          <div key={p.id} data-tour={`person-${p.id}`} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-ink/5 px-4 py-3">
            <Monogram id={p.id} name={p.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-1">{p.name}</p>
              <p className="truncate text-xs text-ink-3">{t(`department.${p.department}`)}{p.team ? `, ${p.team}` : ''}</p>
            </div>
            {p.invited ? <Pill tone="amber">{t('people.invited')}</Pill> : <Pill tone="ink">{t(`role.${p.role}`)}</Pill>}
          </div>
        ))}
      </div>
      {people.length === 0 && <p className="rounded-xl border border-dashed border-ink/10 px-4 py-6 text-center text-sm text-ink-3">{t('people.none')}</p>}
      {inviting && <InviteModal onClose={() => setInviting(false)} />}
    </Page>
  )
}

function NewRoleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (name: string) => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const [name, setName] = useState('')
  const [from, setFrom] = useState('HR')
  const [error, setError] = useState<string | null>(null)
  return (
    <Modal open onClose={onClose} title={t('roles.new')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const value = name.trim()
          if (state.matrix[value]) { setError(t('error.roleExists')); return }
          dispatch({ type: 'createRole', name: value, from })
          toast(t('toast.roleCreated', { name: value }))
          onCreated(value)
        }}
      >
        <Field label={t('roles.name')}><Input required maxLength={40} value={name} placeholder={t('roles.namePlaceholder')} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t('roles.copyFrom')}>
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>{Object.keys(state.matrix).map((r) => <option key={r} value={r}>{roleLabel(t, r)}</option>)}</Select>
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <PrimaryButton type="submit" data-tour="role-save" className="w-full">{t('roles.create')}</PrimaryButton>
      </form>
    </Modal>
  )
}

const roleLabel = (t: (key: string) => string, role: string) => (SYSTEM_ROLES.includes(role) ? t(`role.${role}`) : role)

export function RolesView() {
  const { state, dispatch, t } = useDemo()
  const [role, setRole] = useState('HR')
  const [creating, setCreating] = useState(false)
  const locked = SYSTEM_ROLES.includes(role)
  return (
    <Page
      title={t('roles.title')}
      subtitle={t('roles.subtitle')}
      actions={<PrimaryButton data-tour="role-new" className="h-9" onClick={() => setCreating(true)}>{t('roles.new')}</PrimaryButton>}
    >
      <div data-tour="roles-tabs" className="flex flex-wrap gap-1 rounded-lg bg-ink/5 p-1">
        {Object.keys(state.matrix).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={role === r}
            onClick={() => setRole(r)}
            className={`h-9 flex-1 rounded-md px-3 text-sm font-medium transition-colors ${role === r ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-3 hover:text-ink-1'}`}
          >
            {roleLabel(t, r)}
          </button>
        ))}
      </div>
      {locked && <p className="text-sm text-ink-2">{t('roles.locked')}</p>}
      <div data-tour="roles-matrix" className="overflow-x-auto rounded-xl border border-ink/10">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs text-ink-3">
              <th scope="col" className="px-3 py-2 text-left font-medium">{t('roles.module')}</th>
              {PERMISSION_ACTIONS.map((a) => <th key={a} scope="col" className="px-2 py-2 font-medium">{t(`action.perm.${a}`)}</th>)}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((m) => (
              <tr key={m} className="border-b border-ink/5 last:border-0">
                <th scope="row" className="px-3 py-2 text-left font-medium text-ink-1">{t(`module.${m}`)}</th>
                {PERMISSION_ACTIONS.map((a) => (
                  <td key={a} className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      aria-label={`${t(`module.${m}`)}: ${t(`action.perm.${a}`)}`}
                      checked={state.matrix[role]?.[m]?.includes(a) ?? false}
                      disabled={locked}
                      onChange={() => dispatch({ type: 'togglePermission', role, module: m, action: a })}
                      className="size-4 accent-emerald-600"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-3">{t('roles.note')}</p>
      {creating && <NewRoleModal onClose={() => setCreating(false)} onCreated={(name) => { setRole(name); setCreating(false) }} />}
    </Page>
  )
}

export function ExportView() {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const days = monthDates(state)

  return (
    <Page
      title={t('export.title')}
      subtitle={t('export.subtitle')}
      actions={(
        <PrimaryButton data-tour="export-generate" className="h-9" onClick={() => { dispatch({ type: 'generateExport' }); toast(t('toast.exportSimulated'), 'info') }}>
          <Download className="size-4" />{t('export.generate')}
        </PrimaryButton>
      )}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('export.scope')}><Input readOnly value="Alex Morgan" /></Field>
        <Field label={t('export.template')}><Input readOnly value={t('export.builtIn')} /></Field>
      </div>
      <div className="flex items-center gap-2 text-sm text-ink-2">
        <FileSpreadsheet className="size-4 text-emerald-fg" />
        {t('export.sheet', { month: format.month(state.year, state.month) })}
      </div>
      <div data-tour="export-sheet" className="max-h-72 overflow-auto rounded-xl border border-ink/10">
        <table className="w-full min-w-[30rem] text-xs">
          <thead className="sticky top-0 bg-surface">
            <tr className="text-ink-3">
              {['export.day', 'export.work', 'export.break', 'export.overtime', 'export.absence'].map((k) => (
                <th key={k} scope="col" className="border-b border-r border-ink/10 px-2 py-1.5 text-left font-medium">{t(k)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const i = dayInfo(state, d)
              return (
                <tr key={d} className={i.working ? '' : 'bg-ink/[0.03]'}>
                  <td className="border-b border-r border-ink/5 px-2 py-1 text-ink-2">{Number(d.slice(-2))}</td>
                  <td className="border-b border-r border-ink/5 px-2 py-1 text-ink-1">{i.work ? formatMinutes(i.work) : ''}</td>
                  <td className="border-b border-r border-ink/5 px-2 py-1 text-ink-2">{i.breakMinutes ? formatMinutes(i.breakMinutes) : ''}</td>
                  <td className="border-b border-r border-ink/5 px-2 py-1 text-orange-fg">{i.overtime ? formatMinutes(i.overtime) : ''}</td>
                  <td className="border-b border-r border-ink/5 px-2 py-1 text-ink-2">{i.holiday ? t('legend.holiday') : i.absence ? t(`absence.${i.absence.absence}`) : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Page>
  )
}
