'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useTranslations } from 'next-intl'
import { CalendarDays, Clock, HeartPulse, ListChecks, Plane, Receipt, Timer, Users, type LucideIcon } from 'lucide-react'
import { stagger } from '@/lib/utils'
import { Band } from './band'

const MODULES: { key: string; icon: LucideIcon }[] = [
  { key: 'timesheets', icon: Clock },
  { key: 'overtime', icon: Timer },
  { key: 'leave', icon: Plane },
  { key: 'absences', icon: HeartPulse },
  { key: 'tasks', icon: ListChecks },
  { key: 'calendar', icon: CalendarDays },
  { key: 'invoices', icon: Receipt },
  { key: 'people', icon: Users },
]

/**
 * A fixed ring, in percent of the stage. Starting a half step round puts two tiles at the top,
 * which is what lets eight of them fit a 360px phone without touching.
 */
const RADIUS_X = 39
const RADIUS_Y = 40
const RING = MODULES.map((_, i) => {
  const a = ((i + 0.5) / MODULES.length) * Math.PI * 2 - Math.PI / 2
  return { left: 50 + Math.cos(a) * RADIUS_X, top: 50 + Math.sin(a) * RADIUS_Y }
})
const DEPTHS = [34, 14, 44, 22, 38, 12, 46, 26]
const STAGGER = 0.035
const MAX_TILT = 6

/** How far one tile is along its way out, which its line follows too. */
function useTileProgress(progress: MotionValue<number>, index: number) {
  return useTransform(progress, (v) => Math.min(1, Math.max(0, (v - index * STAGGER) / (1 - (MODULES.length - 1) * STAGGER))))
}

/** Its tip moves with the tile. x2 and y2 rather than pathLength, whose dashes break under non-scaling-stroke. */
function Spoke({ index, progress, animated }: {
  index: number
  progress: MotionValue<number>
  animated: boolean
}) {
  const { left, top } = RING[index]
  const local = useTileProgress(progress, index)
  const x2 = useTransform(local, (v) => 50 + (left - 50) * v)
  const y2 = useTransform(local, (v) => 50 + (top - 50) * v)
  return <motion.line x1="50" y1="50" x2={animated ? x2 : left} y2={animated ? y2 : top} stroke="url(#hub-line)" strokeWidth={1.25} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
}

function Tile({ icon: Icon, label, index, progress, animated }: {
  icon: LucideIcon
  label: string
  index: number
  progress: MotionValue<number>
  animated: boolean
}) {
  const { left, top } = RING[index]
  const local = useTileProgress(progress, index)
  // Tiles only ever travel from the centre out to their place, so none can pass the edge of the stage.
  const x = useTransform(local, (v) => `${(1 - v) * (50 - left)}cqw`)
  const y = useTransform(local, (v) => `${(1 - v) * (50 - top)}cqh`)
  const scale = useTransform(local, [0, 1], [0.55, 1])
  const opacity = useTransform(local, [0, 0.35], [0, 1])
  return (
    <motion.li
      data-testid="hub-tile"
      style={{ left: `${left}%`, top: `${top}%`, ...(animated ? { x, y, scale, opacity, z: DEPTHS[index] } : {}) }}
      className="fluent absolute flex min-h-[4.25rem] w-[5.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xs font-medium leading-tight sm:min-h-[5.5rem] sm:w-32 sm:gap-2 sm:text-[0.9375rem]"
    >
      <Icon aria-hidden className="size-4 shrink-0 text-jade sm:size-5" />
      {label}
    </motion.li>
  )
}

export function PlatformHub() {
  const t = useTranslations('hub')
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)
  const { scrollYProgress } = useScroll({ target: stage, offset: ['start end', 'end end'] })
  const progress = useTransform(scrollYProgress, [0.42, 0.92], [0, 1], { clamp: true })

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const tiltX = useSpring(py, { stiffness: 60, damping: 18 })
  const tiltY = useSpring(px, { stiffness: 60, damping: 18 })
  const rotateX = useTransform(tiltX, (v) => v * -MAX_TILT)
  const rotateY = useTransform(tiltY, (v) => v * MAX_TILT)

  // Decided after mount because it depends on the screen. Starts as the finished ring, which is also the server render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimated(!reduced && window.matchMedia('(min-width: 1024px)').matches)
  }, [reduced])

  function onPointerMove(e: PointerEvent) {
    if (!animated) return
    const box = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - box.left) / box.width - 0.5) * 2)
    py.set(((e.clientY - box.top) / box.height - 0.5) * 2)
  }
  function onPointerLeave() {
    px.set(0)
    py.set(0)
  }

  const points = t.raw('points') as string[]
  return (
    <Band tone="night" edge="rise" id="platform">
      <div ref={stage} className={reduced ? '' : 'lg:h-[200vh]'}>
        <div className={`wrap grid items-center gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr] ${reduced ? '' : 'lg:sticky lg:top-0 lg:h-screen lg:pb-6 lg:pt-24'}`}>
          <div>
            <h2 data-reveal="mask" className="display-2">{t('title')}</h2>
            <p data-reveal="rise" className="lede mt-6">{t('lede')}</p>
            <ul className="mt-8 space-y-2 border-l-2 border-jade/60 pl-4 text-[1.0625rem]">
              {points.map((p, i) => <li key={p} data-reveal="left" style={stagger(i)}>{p}</li>)}
            </ul>
          </div>

          <div data-testid="hub-stage" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className="relative h-[min(34rem,120vw)] lg:h-full lg:min-h-[36rem] lg:self-stretch">
            {/* The colour the glass frosts. It has to sit inside the band for backdrop-filter to see it. */}
            <div aria-hidden className="hub-orb absolute left-[6%] top-[8%] size-[52%] bg-[radial-gradient(closest-side,rgb(37_99_235/0.55),transparent)]" />
            <div aria-hidden style={{ ['--d' as string]: '-7s' }} className="hub-orb absolute bottom-[6%] right-[4%] size-[56%] bg-[radial-gradient(closest-side,rgb(16_185_129/0.42),transparent)]" />
            <div aria-hidden style={{ ['--d' as string]: '-13s' }} className="hub-orb absolute left-[30%] top-[30%] size-[40%] bg-[radial-gradient(closest-side,rgb(56_189_248/0.4),transparent)]" />

            <div className="absolute inset-0 [container-type:size] [perspective:75rem]">
              {/* No opacity or filter on this element or the list: either would switch off the tiles' blur. */}
              <motion.div style={animated ? { rotateX, rotateY } : undefined} className="absolute inset-0 [transform-style:preserve-3d]">
                <svg aria-hidden data-testid="hub-spokes" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
                  <defs>
                    <radialGradient id="hub-line" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="50">
                      <stop offset="0" stopColor="#7dd3fc" stopOpacity="0.9" />
                      <stop offset="1" stopColor="#34d399" stopOpacity="0.35" />
                    </radialGradient>
                  </defs>
                  {MODULES.map(({ key }, i) => <Spoke key={key} index={i} progress={progress} animated={animated} />)}
                </svg>

                <ul className="absolute inset-0 [transform-style:preserve-3d]">
                  {MODULES.map(({ key, icon }, i) => (
                    <Tile key={key} icon={icon} label={t(`modules.${key}`)} index={i} progress={progress} animated={animated} />
                  ))}
                </ul>

                <motion.div style={animated ? { z: 90 } : undefined} className="absolute left-1/2 top-1/2 z-10 grid size-[6.75rem] -translate-x-1/2 -translate-y-1/2 place-items-center sm:size-44">
                  <div aria-hidden className="fluent hub-glass absolute inset-0 rotate-45 !rounded-[1.5rem] shadow-[0_0_60px_-8px_rgb(56_189_248/0.55)] sm:!rounded-[2rem]" />
                  <p data-testid="hub-core" style={{ fontStretch: '112%' }} className="pointer-events-none relative max-w-[5.5rem] text-balance text-center font-display text-base font-semibold leading-[1.1] tracking-[-0.018em] sm:max-w-[8.5rem] sm:text-2xl">{t('center')}</p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </Band>
  )
}
