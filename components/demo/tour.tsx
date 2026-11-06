'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { DemoState, ModuleId } from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { advance, stepTargets, TOURS, type TourId } from '@/lib/demo/tours'
import { cn } from '@/lib/utils'
import { SoftButton } from './primitives'

type Box = { top: number; left: number; width: number; height: number }

const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

/** Display:none copies, like the sidebar on a phone, have no offsetParent. */
function findTarget(root: HTMLElement, targets: string[]) {
  for (const name of targets) {
    for (const el of root.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`)) {
      if (el.offsetParent !== null) return el
    }
  }
  return null
}

/** Moves the nearest scrollers only. scrollIntoView would drag the page along too. */
function reveal(target: HTMLElement, root: HTMLElement) {
  for (let el = target.parentElement; el && el !== root; el = el.parentElement) {
    const style = getComputedStyle(el)
    const a = el.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    if (/auto|scroll/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
      if (b.top < a.top + 8) el.scrollTop -= a.top + 8 - b.top
      else if (b.bottom > a.bottom - 8) el.scrollTop += b.bottom - a.bottom + 8
    }
    if (/auto|scroll/.test(style.overflowX) && el.scrollWidth > el.clientWidth) {
      if (b.left < a.left) el.scrollLeft -= a.left - b.left
      else if (b.right > a.right) el.scrollLeft += b.right - a.right
    }
  }
}

/** Steps advance on their own as the visitor does each thing. Steps with nothing to do wait for Next. */
export function Tour({ id, start, module, frame, onClose, onRestart }: {
  id: TourId
  start: DemoState
  module: ModuleId
  frame: RefObject<HTMLDivElement | null>
  onClose: () => void
  onRestart: () => void
}) {
  const { state, t } = useDemo()
  const tour = TOURS[id]
  const [index, setIndex] = useState(0)
  const current = advance(tour, index, { state, module, start })
  if (current !== index) setIndex(current)
  const step = tour.steps[current] ?? null
  const targets = step ? stepTargets(step, state).join(' ') : ''

  const [box, setBox] = useState<Box | null>(null)
  const [raised, setRaised] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const revealed = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!targets) return
    const measure = () => {
      const root = frame.current
      if (!root) return
      const target = findTarget(root, targets.split(' '))
      const dialog = root.querySelector('[role="dialog"]')
      // A target behind an open dialog can't be used, so a ring on it would only confuse.
      const usable = target && (!dialog || dialog.contains(target))
      if (target && usable && revealed.current !== target) {
        revealed.current = target
        reveal(target, root)
      }
      if (!usable) {
        setBox(null)
      } else {
        const a = root.getBoundingClientRect()
        const b = target.getBoundingClientRect()
        setBox({ top: b.top - a.top - 4, left: b.left - a.left - 4, width: b.width + 8, height: b.height + 8 })
      }
      // Measured in its resting place, so the choice can't flip back and forth.
      const own = card.current?.getBoundingClientRect()
      if (!own) return
      const rest = new DOMRect(own.left, restingTop(root, own), own.width, own.height)
      const cover = (usable ? target : dialog)?.getBoundingClientRect()
      setRaised(Boolean(cover && overlaps(rest, cover)))
    }
    measure()
    const timer = setInterval(measure, 200)
    return () => clearInterval(timer)
  }, [targets, frame])

  const root = frame.current
  if (!root) return null
  // Portalled next to the dialogs, because inside the frame's content it could never sit above them.
  return createPortal(
    <>
      {step && box && <div aria-hidden className="pointer-events-none absolute z-[55] rounded-xl ring-2 ring-emerald-400 transition-all duration-300" style={{ ...box, boxShadow: '0 0 0 4px rgb(16 185 129 / 0.25)' }} />}
      <div
        ref={card}
        data-tour-card
        data-testid="tour-card"
        // Radix reads a press outside a dialog as a request to close it, and using the card mustn't do that.
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          'pointer-events-auto absolute inset-x-3 z-[55] rounded-xl border border-emerald-500/30 bg-surface p-3 text-sm text-ink-1 shadow-2xl md:left-auto md:right-3 md:w-80',
          raised ? 'top-16' : 'bottom-20 md:bottom-3',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-ink-3">{t(`tour.title.${id}`)}</p>
            <p data-testid="tour-progress" className="font-semibold">{step ? t('tour.step', { n: current + 1, total: tour.steps.length }) : t(id === 'loop' ? 'tour.doneTitle' : 'tour.finished')}</p>
          </div>
          <button type="button" aria-label={t('action.close')} onClick={onClose} className="-m-1 rounded-md p-1 text-ink-3 hover:text-ink-1"><X className="size-4" /></button>
        </div>
        <p aria-live="polite" data-testid="tour-text" className="mt-1 text-ink-2">{t(step ? step.key : id === 'loop' ? 'tour.done' : `tour.${id}.done`)}</p>
        {step && !step.done && (
          <div className="mt-2 flex justify-end">
            <SoftButton tone="emerald" data-testid="tour-next" onClick={() => setIndex(current + 1)}>{t('tour.next')}</SoftButton>
          </div>
        )}
        {!step && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <SoftButton onClick={onRestart}>{t('tour.again')}</SoftButton>
            <Link href="/features" prefetch={false} className="text-sm font-medium text-ink-1 underline underline-offset-4">{t('tour.allFeatures')}</Link>
          </div>
        )}
      </div>
    </>,
    root,
  )
}

/** Where the card's top would be at rest, along the bottom of the frame. */
function restingTop(root: HTMLElement, own: DOMRect) {
  const inset = window.matchMedia('(min-width: 48rem)').matches ? 12 : 80
  return root.getBoundingClientRect().bottom - inset - own.height
}
