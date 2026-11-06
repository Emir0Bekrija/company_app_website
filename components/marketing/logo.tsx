import { cn } from '@/lib/utils'
import { FlowLogo } from './flow-logo'

/** The Navitecs N, redrawn as a vector from the company letterhead. For spaces too small for the full logo. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 705" className={className} fill="currentColor" aria-hidden="true">
      <path d="M0 0 510 482V0h90v703L0 140Z" />
      <path d="M0 623 95 542v163H0Z" />
    </svg>
  )
}

export function Logo({ className, centerNavitecs }: { className?: string; centerNavitecs?: boolean }) {
  return <FlowLogo centerNavitecs={centerNavitecs} className={cn('w-44 shrink-0', className)} />
}
