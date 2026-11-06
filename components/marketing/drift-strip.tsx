'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** The drift, in rem per second. */
const SPEED = 1.5
/** How long the strip takes to settle on a new speed, in ms. This one value is both the glide after a drag and the gentle restart. */
const EASE = 350
/** Fastest glide after a drag, in px per ms. */
const MAX_GLIDE = 3
/** How far an arrow key moves the strip, in rem: about one card. */
const KEY_STEP = 20

/**
 * An endless strip that drifts sideways on its own and can be dragged. It moves a track with a
 * transform rather than scrolling: scrollLeft rounds to whole pixels, which stutters at this
 * speed, and a scroller would clip the top of a card that grows on hover.
 *
 * The track holds a copy, the real items, then enough copies to fill the screen, so whichever way
 * it's dragged there is always something to show. Each copy must have the same number of items.
 * Until the strip nears the screen it's a plain scroller with no copies, which is also what
 * visitors without JavaScript get.
 *
 * `children` is called once per copy. With `clone` true, render items for looks only: aria-hidden,
 * no data-reveal, and nothing that waits to be scrolled near, as a clip hides that from observers.
 */
export function DriftStrip({ label, className, children }: { label: string; className?: string; children: (clone: boolean) => ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLUListElement>(null)
  // Copies after the real items. 0 until the strip is close to the screen.
  const [after, setAfter] = useState(0)
  const looping = after > 0

  useEffect(() => {
    const el = outer.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAfter(1); observer.disconnect() }
    }, { rootMargin: '600px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // A layout effect, so the first copy going in ahead of the real items never shows as a jump.
  useLayoutEffect(() => {
    const box = outer.current
    const list = track.current
    if (!looping || !box || !list) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let rem = 16
    let set = 0 // The width of one copy, gap included.
    let x = 0
    let velocity = 0 // px per ms
    let frame = 0
    let last = 0
    let onScreen = false
    let hovering = box.matches(':hover')
    let focused = false
    let dragging = false
    let pointerX = 0
    let pointerAt = 0

    const place = () => {
      if (set) x = ((x % set) + set) % set
      list.style.transform = `translate3d(${(-(set + x)).toFixed(2)}px, 0, 0)`
    }

    const target = () => (still || hovering || focused ? 0 : (SPEED * rem) / 1000)

    const tick = (now: number) => {
      // Capped, so a dropped frame doesn't throw the strip forward.
      const elapsed = Math.min(now - last, 50)
      last = now
      const aim = target()
      velocity += (aim - velocity) * (1 - Math.exp(-elapsed / EASE))
      x += velocity * elapsed
      place()
      const settled = aim === 0 && Math.abs(velocity) < 0.001
      if (settled) velocity = 0
      frame = onScreen && !dragging && !settled ? requestAnimationFrame(tick) : 0
    }

    const wake = () => {
      if (frame || !onScreen || dragging) return
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const measure = () => {
      rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const perCopy = list.querySelectorAll(':scope > :not([aria-hidden])').length
      const first = list.children[0] as HTMLElement | undefined
      const next = list.children[perCopy] as HTMLElement | undefined
      if (!first || !next) return
      set = next.offsetLeft - first.offsetLeft
      if (set <= 0) return
      place()
      setAfter(Math.max(1, Math.ceil(box.clientWidth / set)))
    }

    const onDragMove = (e: PointerEvent) => {
      const moved = e.clientX - pointerX
      const took = e.timeStamp - pointerAt
      x -= moved
      place()
      if (took > 0) velocity = velocity * 0.3 + (-moved / took) * 0.7
      pointerX = e.clientX
      pointerAt = e.timeStamp
    }

    const stopListening = () => {
      window.removeEventListener('pointermove', onDragMove)
      window.removeEventListener('pointerup', onDragEnd)
      window.removeEventListener('pointercancel', onDragEnd)
    }

    function onDragEnd(e: PointerEvent) {
      stopListening()
      dragging = false
      delete box!.dataset.drag
      // Held still before letting go, or reduced motion: nothing to glide on.
      const held = e.timeStamp - pointerAt > 100
      velocity = still || held ? 0 : Math.max(-MAX_GLIDE, Math.min(MAX_GLIDE, velocity))
      wake()
    }

    // On the window with no pointer capture: capture would take :hover, and so the light, off the card.
    const onDown = (e: PointerEvent) => {
      if (!e.isPrimary || e.button !== 0) return
      dragging = true
      box.dataset.drag = ''
      velocity = 0
      pointerX = e.clientX
      pointerAt = e.timeStamp
      window.addEventListener('pointermove', onDragMove, { passive: true })
      window.addEventListener('pointerup', onDragEnd)
      window.addEventListener('pointercancel', onDragEnd)
    }

    const onEnter = (e: PointerEvent) => { if (e.pointerType === 'mouse') hovering = true }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      hovering = false
      wake()
    }
    const onFocus = () => { focused = box.matches(':focus-visible') }
    const onBlur = () => {
      focused = false
      wake()
    }

    const onWheel = (e: WheelEvent) => {
      // Sideways only: a vertical wheel still scrolls the page.
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      x += e.deltaX
      place()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const step = KEY_STEP * rem * (e.key === 'ArrowLeft' ? -1 : 1)
      if (still) {
        x += step
        place()
        return
      }
      // At rest, a velocity decaying over EASE covers velocity * EASE, so this glides one step.
      velocity += step / EASE
      wake()
    }

    const noNativeDrag = (e: Event) => e.preventDefault()

    measure()
    const resized = new ResizeObserver(measure)
    resized.observe(box)
    resized.observe(list)
    const visible = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      wake()
    })
    visible.observe(box)

    box.addEventListener('pointerdown', onDown)
    box.addEventListener('pointerenter', onEnter)
    box.addEventListener('pointerleave', onLeave)
    box.addEventListener('focusin', onFocus)
    box.addEventListener('focusout', onBlur)
    box.addEventListener('wheel', onWheel, { passive: false })
    box.addEventListener('keydown', onKey)
    box.addEventListener('dragstart', noNativeDrag)

    return () => {
      cancelAnimationFrame(frame)
      resized.disconnect()
      visible.disconnect()
      stopListening()
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('pointerenter', onEnter)
      box.removeEventListener('pointerleave', onLeave)
      box.removeEventListener('focusin', onFocus)
      box.removeEventListener('focusout', onBlur)
      box.removeEventListener('wheel', onWheel)
      box.removeEventListener('keydown', onKey)
      box.removeEventListener('dragstart', noNativeDrag)
    }
  }, [looping])

  return (
    <div ref={outer} role="group" aria-label={label} tabIndex={0} data-loop={looping ? '' : undefined} className={cn('drift-strip', className)}>
      <ul ref={track} className="flex w-max gap-4 px-[max(var(--gutter),calc((100vw-86rem)/2+var(--gutter)))] pb-4">
        {looping && <Fragment key="before">{children(true)}</Fragment>}
        <Fragment key="real">{children(false)}</Fragment>
        {Array.from({ length: after }, (_, i) => <Fragment key={i}>{children(true)}</Fragment>)}
      </ul>
    </div>
  )
}
