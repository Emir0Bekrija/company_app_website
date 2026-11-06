'use client'

import { formatLongDate, formatMoney, formatMonth, formatShortDate, weekdayNames } from '@/lib/format'
import { createContext, useContext, type ComponentProps, type ReactNode, type RefObject } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { useDemo } from '@/lib/demo/store'
import { toDate } from '@/lib/demo/engine'
import { cn } from '@/lib/utils'

/** Dialogs portal into the demo frame so they pick up its theme and stay inside it. */
export const FrameContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

export function Modal({ open, onClose, title, children, wide }: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const frame = useContext(FrameContext)
  const { t } = useDemo()
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal container={frame?.current ?? undefined}>
        <Dialog.Overlay className="absolute inset-0 z-40 bg-scrim/40 backdrop-blur-xs" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'absolute left-1/2 top-1/2 z-50 max-h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto',
            'space-y-4 rounded-2xl border border-ink/10 bg-surface/95 p-5 text-ink-1 shadow-2xl backdrop-blur-xl',
            wide ? 'max-w-xl' : 'max-w-md',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold text-ink-1">{title}</Dialog.Title>
            <Dialog.Close aria-label={t('action.close')} className="-m-1 rounded-md p-1 text-ink-3 hover:bg-ink/5 hover:text-ink-1">
              <X className="size-4" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function Page({ title, subtitle, actions, children }: {
  title: string
  subtitle: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-1">{title}</h2>
          <p className="text-sm text-ink-3">{subtitle}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  )
}

export function StatTile({ label, value, tone = 'default', hint }: {
  label: string
  value: ReactNode
  tone?: 'default' | 'emerald' | 'amber' | 'red'
  hint?: string
}) {
  const color = { default: 'text-ink-1', emerald: 'text-emerald-fg', amber: 'text-amber-fg', red: 'text-red-fg' }[tone]
  return (
    <div className="rounded-2xl border border-ink/10 bg-ink/5 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-ink-3">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

export function Pill({ tone, children }: { tone: 'ink' | 'amber' | 'blue' | 'red' | 'emerald' | 'violet' | 'cyan'; children: ReactNode }) {
  const cls = {
    ink: 'bg-ink/10 text-ink-2',
    amber: 'bg-amber-500/15 text-amber-fg',
    blue: 'bg-blue-500/15 text-blue-fg',
    red: 'bg-red-500/15 text-red-fg',
    emerald: 'bg-emerald-500/15 text-emerald-fg',
    violet: 'bg-violet-500/15 text-violet-fg',
    cyan: 'bg-cyan-500/15 text-cyan-fg',
  }[tone]
  return <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{children}</span>
}

export function PrimaryButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 px-4 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
    />
  )
}

export function SoftButton({ tone = 'ink', className, ...props }: ComponentProps<'button'> & { tone?: 'ink' | 'blue' | 'red' | 'emerald' }) {
  const cls = {
    ink: 'bg-ink/5 text-ink-2 hover:bg-ink/10',
    blue: 'bg-blue-500/20 text-blue-fg hover:bg-blue-500/30',
    red: 'border border-red-500/20 bg-red-500/10 text-red-fg hover:bg-red-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-fg hover:bg-emerald-500/25',
  }[tone]
  return (
    <button
      type="button"
      {...props}
      className={cn('inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40', cls, className)}
    />
  )
}

const FIELD = 'h-10 w-full rounded-lg border border-ink/10 bg-ink/5 px-3 text-sm text-ink-1 placeholder:text-ink-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-3">{label}</span>
      {children}
    </label>
  )
}

export const Input = (props: ComponentProps<'input'>) => <input {...props} className={cn(FIELD, props.className)} />
export const Select = (props: ComponentProps<'select'>) => <select {...props} className={cn(FIELD, 'bg-surface', props.className)} />

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-fg">{children}</p>
}

/** Same hue-from-id idea as the app's member-monogram.tsx. */
const HUES = [
  'bg-emerald-500/15 text-emerald-fg ring-emerald-500/25',
  'bg-blue-500/15 text-blue-fg ring-blue-500/25',
  'bg-violet-500/15 text-violet-fg ring-violet-500/25',
  'bg-amber-500/15 text-amber-fg ring-amber-500/25',
  'bg-rose-500/15 text-rose-fg ring-rose-500/25',
  'bg-teal-500/15 text-teal-fg ring-teal-500/25',
] as const

export function Monogram({ id, name, size = 'md' }: { id: string; name: string; size?: 'sm' | 'md' }) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  const initials = name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? '').join('').toUpperCase()
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1',
        size === 'sm' ? 'size-7 text-[0.625rem]' : 'size-9 text-xs',
        HUES[Math.abs(hash) % HUES.length],
      )}
    >
      {initials}
    </span>
  )
}

export function useFormat() {
  const { locale } = useDemo()
  return {
    date: (iso: string) => formatLongDate(locale, toDate(iso)),
    short: (iso: string) => formatShortDate(locale, toDate(iso)),
    month: (year: number, month: number) => formatMonth(locale, year, month),
    weekdays: weekdayNames(locale),
    money: (n: number) => formatMoney(locale, n, 2),
  }
}
