import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * The diamonds and chevrons from the Navitecs letterhead, used as the hero's only visual.
 * Every stroke uses pathLength=1 so one keyframe draws them all.
 */
const DIAMONDS = [
  { x: 520, y: 300, r: 262, w: 2, d: 0, o: 0.9 },
  { x: 250, y: 170, r: 118, w: 1.25, d: 220, o: 0.55 },
  { x: 790, y: 150, r: 92, w: 1.25, d: 320, o: 0.5 },
  { x: 800, y: 500, r: 150, w: 1.5, d: 420, o: 0.6 },
  { x: 262, y: 520, r: 74, w: 1.25, d: 520, o: 0.42 },
]

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

export function Lattice({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 980 640" className={cn('block', className)} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lattice-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Chevrons, as they run down the letterhead's left edge. */}
      {[0, 58].map((dx, i) => (
        <path
          key={dx}
          className="lattice-line"
          pathLength={1}
          d={`M${40 + dx} 210 L${150 + dx} 320 L${40 + dx} 430`}
          stroke="#f4f8fa"
          strokeOpacity={0.16}
          strokeWidth={20}
          style={delay(600 + i * 120)}
        />
      ))}

      {DIAMONDS.map((d) => (
        <path
          key={`${d.x}-${d.y}`}
          className="lattice-line"
          pathLength={1}
          d={`M${d.x} ${d.y - d.r} L${d.x + d.r} ${d.y} L${d.x} ${d.y + d.r} L${d.x - d.r} ${d.y} Z`}
          stroke="url(#lattice-stroke)"
          strokeWidth={d.w}
          strokeOpacity={d.o}
          style={delay(d.d)}
        />
      ))}

      {/* The N sits inside the main diamond, as the logo does on the letterhead. */}
      <g className="lattice-fill" style={delay(700)} transform="translate(430 194) scale(0.3)" fill="#f4f8fa">
        <path d="M0 0 510 482V0h90v703L0 140Z" />
        <path d="M0 623 95 542v163H0Z" />
      </g>
    </svg>
  )
}
