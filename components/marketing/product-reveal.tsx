'use client'

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { cubicBezier, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Bell, CircleCheck, Receipt } from 'lucide-react'
import { ProductShot, WhenNear } from '../demo/lazy'
import { Band } from './band'

type Point = [number, number]

/** The opening's half-diagonal at rest, as a share of the frame's half height. */
const START = 0.52
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * The opening, in pixels so its edges stay at a true 45 degrees on any frame. A square turns into
 * a diamond while it still fits the frame. The diamond then grows until the frame cuts its tips,
 * and the eight points slide out to the corners, so no vertex ever jumps.
 */
function aperture(p: number, w: number, h: number): Point[] {
  const hw = w / 2
  const hh = h / 2
  const from = hh * START
  const r = from + (hw + hh - from) * p
  const a = Math.min(hw, Math.max(0, r - hh))
  const b = Math.min(hh, Math.max(0, r - hw))
  const x = Math.min(r, hw)
  const y = Math.min(r, hh)
  const turned = 1 - clamp01((r - from) / (Math.min(hw, hh) - from || 1))
  const angle = -(Math.PI / 4) * turned * turned
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const corners: Point[] = [[-a, -y], [a, -y], [x, -b], [x, b], [a, y], [-a, y], [-x, b], [-x, -b]]
  return corners.map(([px, py]) => [hw + px * cos - py * sin, hh + px * sin + py * cos])
}

const polygon = (points: Point[]) => `polygon(${points.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`
const svgPoints = (points: Point[]) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

const unfold = cubicBezier(0.55, 0, 0.2, 1)

/** Follows the scrollbar closely, but turns the steps of a mouse wheel into one continuous move. */
const GLIDE = { stiffness: 150, damping: 32, mass: 0.6, restDelta: 0.0005 }

/** Scroll positions at which each card pops out, in the order the cards are listed. */
const CARD_AT = [0.54, 0.6, 0.66]

function Float({ className, from, shown, x, y, depth, children }: {
  className: string
  from: 'left' | 'right'
  shown: boolean
  x: MotionValue<number>
  y: MotionValue<number>
  depth: number
  children: ReactNode
}) {
  const tx = useTransform(x, (v) => v * depth)
  const ty = useTransform(y, (v) => v * depth)
  // Opacity stays on the glass itself. On the outer element it would cut the blur off from the screen behind.
  return (
    <motion.div data-testid="reveal-card" style={{ x: tx, y: ty }} className={`absolute z-20 hidden w-max max-w-56 lg:block ${from === 'left' ? 'left-0 -translate-x-3/5' : 'right-0 translate-x-3/5'} ${className}`}>
      <motion.div
        initial={false}
        animate={shown ? { opacity: 1, scale: 1, x: '0%' } : { opacity: 0, scale: 0.92, x: from === 'left' ? '-120%' : '120%' }}
        transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.8, opacity: { duration: 0.22, ease: 'easeOut' } }}
        className="fluent fluent-control px-4 py-3 text-sm"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/** The site's signature moment: the letterhead diamond turns into place and unfolds to show the real product. */
export function ProductReveal() {
  const t = useTranslations('reveal')
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: stage, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, GLIDE)
  const open = useTransform(progress, [0.02, 0.62], [0, 1], { clamp: true, ease: unfold })

  // Zero until measured, which keeps the opening shut rather than showing the whole screen for a frame.
  const width = useMotionValue(0)
  const height = useMotionValue(0)
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const measure = () => { width.set(el.offsetWidth); height.set(el.offsetHeight) }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [width, height, reduced])

  const clipPath = useTransform([open, width, height], ([p, w, h]: number[]) => (p >= 1 ? 'none' : polygon(aperture(p, w, h))))
  const points = useTransform([open, width, height], ([p, w, h]: number[]) => svgPoints(aperture(p, w, h)))

  const scale = useTransform(open, [0, 1], [0.9, 1])
  const rotateX = useTransform(open, [0, 1], [14, 0])
  const zoom = useTransform(open, [0, 1], [1.16, 1])
  const edge = useTransform(open, [0.9, 1], [1, 0])
  const rounded = useTransform(open, [0.9, 1], [0, 1])
  const sweep = useTransform(progress, [0.08, 0.6], ['-130%', '330%'])

  // One fixed blur that fades. Changing the radius would make the browser rebuild the filter on every frame.
  const frosted = useTransform(progress, [0.26, 0.56], [1, 0])
  const frost = useTransform(frosted, (v) => (v < 0.01 ? 'none' : 'blur(22px) saturate(1.35)'))

  const [cards, setCards] = useState(0)
  useMotionValueEvent(progress, 'change', (v) => setCards(CARD_AT.filter((at) => v >= at).length))

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const x = useSpring(px, { stiffness: 60, damping: 18 })
  const y = useSpring(py, { stiffness: 60, damping: 18 })

  function onPointerMove(e: PointerEvent) {
    if (reduced) return
    const box = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - box.left) / box.width - 0.5) * 2)
    py.set(((e.clientY - box.top) / box.height - 0.5) * 2)
  }

  const shot = (
    <WhenNear className="h-full">
      <ProductShot view="timesheets" theme="aurora" className="h-full" />
    </WhenNear>
  )
  const float = { x, y }

  return (
    <Band tone="deep" edge="rise" id="product">
      {/* Clipped sideways so nothing moving at the edges can widen the page. Clip, unlike hidden, keeps sticky working. */}
      <div ref={stage} className={`overflow-x-clip ${reduced ? '' : 'lg:h-[260vh]'}`}>
        <div onPointerMove={onPointerMove} className={`wrap flex flex-col justify-center gap-6 py-16 ${reduced ? '' : 'lg:sticky lg:top-0 lg:h-screen lg:pb-6 lg:pt-24'}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <h2 data-reveal="mask" className="display-2 max-w-3xl">{t('title')}</h2>
            <p data-reveal="rise" className="lede lg:max-w-md lg:pb-1">{t('lede')}</p>
          </div>

          <div data-testid="reveal-stage" className="reveal-stage relative min-h-0 lg:flex-1">
            {/* Below lg there is no sticky stage, so the screen simply sits in the page. */}
            <div data-reveal="tilt" className="fluent-rim h-[30rem] lg:hidden"><div className="h-full overflow-hidden rounded-[inherit]">{shot}</div></div>
            {reduced ? (
              <div className="fluent-rim hidden h-[60vh] lg:block"><div className="h-full overflow-hidden rounded-[inherit]">{shot}</div></div>
            ) : (
              <div className="hidden h-full [perspective:100rem] lg:block">
                <motion.div ref={frame} style={{ scale, rotateX }} className="relative h-full will-change-transform">
                  <div className="absolute inset-0 overflow-hidden rounded-[var(--radius-card)]">
                    {/*
                      The frost must stay inside this clip. A clip-path on the blurring element itself
                      doesn't hold the blur in, and a ghost of the screen shows around the opening.
                    */}
                    <motion.div data-testid="reveal-opening" style={{ clipPath }} className="relative h-full [will-change:clip-path]">
                      <motion.div style={{ scale: zoom }} className="h-full will-change-transform">{shot}</motion.div>
                      <motion.div aria-hidden data-testid="reveal-frost" style={{ opacity: frosted, backdropFilter: frost, WebkitBackdropFilter: frost }} className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgb(255_255_255/0.22),rgb(125_211_252/0.07)_38%,transparent_52%,rgb(16_185_129/0.12))]" />
                      <motion.div aria-hidden style={{ x: sweep }} className="pointer-events-none absolute inset-y-0 left-0 w-[34%] -skew-x-[24deg] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.16),transparent)] will-change-transform" />
                    </motion.div>
                  </div>

                  {/* A clip-path can't carry a border, so the glass edge is drawn from the same points. No viewBox: these are pixels. */}
                  <motion.svg aria-hidden data-testid="reveal-edge" style={{ opacity: edge }} className="pointer-events-none absolute inset-0 size-full overflow-visible">
                    <defs>
                      <linearGradient id="reveal-rim" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="0.45" stopColor="#7dd3fc" stopOpacity="0.55" />
                        <stop offset="1" stopColor="#34d399" stopOpacity="0.85" />
                      </linearGradient>
                    </defs>
                    <motion.polygon points={points} fill="none" stroke="url(#reveal-rim)" strokeWidth="1.5" strokeLinejoin="round" />
                  </motion.svg>
                  {/* Polygon corners are sharp, so the rim hands over to a rounded one as the pane settles. */}
                  <motion.div aria-hidden style={{ opacity: rounded }} className="fluent-rim pointer-events-none absolute inset-0 shadow-[0_30px_70px_-30px_rgb(3_16_26/0.7)]" />
                </motion.div>
              </div>
            )}

            <Float {...float} shown={!!reduced || cards > 0} className="bottom-16" from="left" depth={14}>
              <span className="flex items-center gap-2 text-muted-fg"><Receipt aria-hidden className="size-4" />{t('cardInvoice')}</span>
              <span className="mt-0.5 block font-display text-xl font-semibold">{t('cardInvoiceValue')}</span>
            </Float>
            <Float {...float} shown={!!reduced || cards > 1} className="top-12" from="right" depth={-18}>
              <span className="flex items-center gap-2"><Bell aria-hidden className="size-4 text-jade" />{t('cardNotice')}</span>
            </Float>
            <Float {...float} shown={!!reduced || cards > 2} className="bottom-10" from="right" depth={10}>
              <span className="flex items-center gap-2"><CircleCheck aria-hidden className="size-4 text-jade" />{t('cardDay')}</span>
            </Float>
          </div>
          <p className="text-sm text-muted-fg">{t('sample')}</p>
        </div>
      </div>
    </Band>
  )
}
