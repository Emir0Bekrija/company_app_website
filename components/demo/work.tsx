'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ChevronDown, MessageSquare, Search } from 'lucide-react'
import { dayInfo, monthDates, WORKER_ID, type Task, type TaskPriority, type TaskStatus } from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { Field, Input, Modal, Monogram, Page, Pill, PrimaryButton, Select, SoftButton, useFormat } from './primitives'

const STATUS_TONE = { 0: 'ink', 1: 'blue', 2: 'emerald', 3: 'red' } as const
const PRIORITY_TONE = { 0: 'ink', 1: 'cyan', 2: 'amber', 3: 'red' } as const

function TaskCard({ task }: { task: Task }) {
  const { state, dispatch, t, toast } = useDemo()
  const format = useFormat()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  function send(e: FormEvent) {
    e.preventDefault()
    const text = comment.trim()
    if (!text) return
    dispatch({ type: 'addComment', id: task.id, author: WORKER_ID, text })
    setComment('')
    // The app pushes task changes live; this stands in for a colleague replying.
    timer.current = setTimeout(() => {
      dispatch({ type: 'addComment', id: task.id, author: 'tarik', text: t('tasks.liveReply'), live: true })
      toast(t('tasks.liveToast'), 'info')
    }, 2200)
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-ink/5">
      <button type="button" data-tour={`task-${task.id}`} aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left">
        <span className="min-w-0 flex-1 basis-48 text-sm font-medium text-ink-1">{task.title}</span>
        <Pill tone={PRIORITY_TONE[task.priority]}>{t(`priority.${task.priority}`)}</Pill>
        <Pill tone={STATUS_TONE[task.status]}>{t(`taskStatus.${task.status}`)}</Pill>
        <span className="text-xs text-ink-3">{format.short(task.due)}</span>
        {task.comments.length > 0 && <span className="flex items-center gap-1 text-xs text-ink-3"><MessageSquare className="size-3.5" />{task.comments.length}</span>}
        <ChevronDown className={`size-4 text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink/10 px-4 py-3">
          {task.description && <p className="text-sm text-ink-2">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex -space-x-1.5">
              {task.assignees.map((id) => {
                const person = state.people.find((p) => p.id === id)
                return person ? <Monogram key={id} id={id} name={person.name} size="sm" /> : null
              })}
            </span>
            <Field label={t('tasks.status')}>
              <Select
                value={task.status}
                className="h-8 w-40"
                onChange={(e) => dispatch({ type: 'setTaskStatus', id: task.id, status: Number(e.target.value) as TaskStatus })}
              >
                {[0, 1, 2, 3].map((s) => <option key={s} value={s}>{t(`taskStatus.${s}`)}</option>)}
              </Select>
            </Field>
          </div>
          <ul className="space-y-2">
            {task.comments.map((c) => {
              const author = state.people.find((p) => p.id === c.author)
              return (
                <li key={c.id} className="flex gap-2 text-sm">
                  <Monogram id={c.author} name={author?.name ?? ''} size="sm" />
                  <span className="min-w-0"><span className="font-medium text-ink-1">{author?.name}</span><br /><span className="text-ink-2">{c.text}</span></span>
                </li>
              )
            })}
          </ul>
          <form onSubmit={send} data-tour="task-comment" className="flex gap-2">
            <Input aria-label={t('tasks.comment')} value={comment} maxLength={200} placeholder={t('tasks.comment')} onChange={(e) => setComment(e.target.value)} />
            <SoftButton type="submit" tone="blue" className="h-10">{t('tasks.send')}</SoftButton>
          </form>
        </div>
      )}
    </div>
  )
}

function CreateTaskModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch, t, toast } = useDemo()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>(1)
  const [due, setDue] = useState(state.today)
  const [assignee, setAssignee] = useState(WORKER_ID)
  return (
    <Modal open onClose={onClose} title={t('tasks.create')}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: 'createTask', title: title.trim(), priority, due, assignee })
          toast(t('toast.taskCreated'))
          onClose()
        }}
      >
        <Field label={t('tasks.taskTitle')}><Input required value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('tasks.priority')}>
            <Select value={priority} onChange={(e) => setPriority(Number(e.target.value) as TaskPriority)}>
              {[0, 1, 2, 3].map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
            </Select>
          </Field>
          <Field label={t('tasks.due')}><Input type="date" required value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        </div>
        <Field label={t('tasks.assignee')}>
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {state.people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <PrimaryButton type="submit" data-tour="task-save" className="w-full">{t('tasks.create')}</PrimaryButton>
      </form>
    </Modal>
  )
}

export function TasksView() {
  const { state, t } = useDemo()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [creating, setCreating] = useState(false)

  const tasks = useMemo(() => state.tasks.filter((task) =>
    (status === 'all' || String(task.status) === status)
    && task.title.toLowerCase().includes(query.trim().toLowerCase())), [state.tasks, query, status])

  return (
    <Page
      title={t('tasks.title')}
      subtitle={t('tasks.subtitle')}
      actions={<PrimaryButton data-tour="task-new" className="h-9" onClick={() => setCreating(true)}>{t('tasks.create')}</PrimaryButton>}
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input aria-label={t('tasks.search')} value={query} placeholder={t('tasks.search')} className="pl-9" onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select aria-label={t('tasks.status')} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">{t('tasks.allStatuses')}</option>
          {[0, 1, 2, 3].map((s) => <option key={s} value={s}>{t(`taskStatus.${s}`)}</option>)}
        </Select>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
        {tasks.length === 0 && <p className="rounded-xl border border-dashed border-ink/10 px-4 py-6 text-center text-sm text-ink-3">{t('tasks.none')}</p>}
      </div>
      {creating && <CreateTaskModal onClose={() => setCreating(false)} />}
    </Page>
  )
}

export function CalendarView() {
  const { state, t } = useDemo()
  const format = useFormat()
  const dates = monthDates(state)
  const offset = (new Date(state.year, state.month - 1, 1).getDay() + 6) % 7
  const [selected, setSelected] = useState<string | null>(null)
  const detail = selected ? {
    tasks: state.tasks.filter((k) => k.due === selected),
    info: dayInfo(state, selected),
  } : null

  return (
    <Page title={t('calendar.title')} subtitle={t('calendar.subtitle')} actions={<span className="font-medium text-ink-1">{format.month(state.year, state.month)}</span>}>
      <div data-tour="calendar-grid" className="overflow-x-auto rounded-xl border border-ink/10 bg-ink/[0.02]">
        <div className="w-[175%] sm:w-full">
          <div className="grid grid-cols-7 border-b border-ink/10">
            {format.weekdays.map((d) => <div key={d} className="py-2 text-center text-xs font-medium text-ink-3">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: offset }, (_, i) => <div key={i} className="h-24 border-b border-r border-ink/5" />)}
            {dates.map((date) => {
              const info = dayInfo(state, date)
              const due = state.tasks.filter((k) => k.due === date)
              return (
                <button key={date} type="button" onClick={() => setSelected(date)} aria-label={format.date(date)} className="h-24 space-y-1 overflow-hidden border-b border-r border-ink/5 p-1.5 text-left transition-colors hover:bg-ink/5">
                  <div className={`text-xs font-medium ${date === state.today ? 'text-emerald-fg' : 'text-ink-2'}`}>{Number(date.slice(-2))}</div>
                  {info.holiday && <div className="truncate rounded bg-violet-500/15 px-1 text-[0.6875rem] text-violet-fg">{t('legend.holiday')}</div>}
                  {info.absence && <div className="truncate rounded bg-emerald-500/15 px-1 text-[0.6875rem] text-emerald-fg">{t(`absence.${info.absence.absence}`)}</div>}
                  {due.map((k) => <div key={k.id} className="truncate rounded bg-blue-500/15 px-1 text-[0.6875rem] text-blue-fg">{k.title}</div>)}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div data-tour="calendar-feed" className="rounded-xl border border-ink/10 bg-ink/[0.03] px-4 py-3 text-sm text-ink-2">{t('calendar.feed')}</div>
      {selected && detail && (
        <Modal open onClose={() => setSelected(null)} title={format.date(selected)}>
          <ul className="space-y-1.5 text-sm text-ink-2">
            {detail.info.holiday && <li>{t('legend.holiday')}</li>}
            {detail.info.absence && <li>{t(`absence.${detail.info.absence.absence}`)}</li>}
            {detail.tasks.map((k) => <li key={k.id}>{k.title}</li>)}
            {!detail.info.holiday && !detail.info.absence && detail.tasks.length === 0 && <li className="text-ink-3">{t('calendar.nothing')}</li>}
          </ul>
        </Modal>
      )}
    </Page>
  )
}
