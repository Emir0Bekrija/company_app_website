import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BandEdge = 'rise' | 'fall' | 'chevron' | 'peak'
export type BandTone = 'night' | 'deep' | 'mist' | 'paper'

/** A full-width section whose top edge is cut into the band above it. */
export function Band({ tone, edge, id, className, children, label }: {
  tone: BandTone
  edge?: BandEdge
  id?: string
  className?: string
  children: ReactNode
  label?: string
}) {
  return (
    <section id={id} aria-label={label} data-edge={edge} className={cn('band', `tone-${tone}`, className)}>
      {children}
    </section>
  )
}
