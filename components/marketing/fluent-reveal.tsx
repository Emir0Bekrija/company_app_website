'use client'

import { useEffect } from 'react'

const GLASS = '.btn, .fluent, .fluent-rim'
/** How long the colour takes to close most of the gap to the cursor, in ms. This is what gives it weight. */
const LAG = 110

type Track = { x: number; y: number; toX: number; toY: number; width: number; height: number }

/**
 * Moves the soap film and the rim's colours on the site's glass. They trail the cursor rather than
 * sitting under it, which is most of what makes the surface read as a material. No light follows
 * the cursor. One listener for the whole page, and the loop only runs while something is still
 * moving. It only writes custom properties, so nothing re-renders.
 *
 * --mx and --my are the position in the element, --tx and --ty the same from -1 to 1.
 */
export function FluentReveal() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const tracks = new WeakMap<HTMLElement, Track>()
    const moving = new Set<HTMLElement>()
    let under: HTMLElement[] = []
    let frame = 0
    let last = 0

    const paint = (el: HTMLElement, t: Track) => {
      el.style.setProperty('--mx', `${t.x.toFixed(1)}px`)
      el.style.setProperty('--my', `${t.y.toFixed(1)}px`)
      el.style.setProperty('--tx', ((t.x / t.width) * 2 - 1).toFixed(3))
      el.style.setProperty('--ty', ((t.y / t.height) * 2 - 1).toFixed(3))
    }

    const tick = (now: number) => {
      // Scaled by elapsed time, so it feels the same at 60Hz and 144Hz.
      const step = 1 - Math.exp(-(now - last) / LAG)
      last = now
      for (const el of moving) {
        const t = tracks.get(el)
        if (!t) continue
        t.x += (t.toX - t.x) * step
        t.y += (t.toY - t.y) * step
        if (Math.abs(t.toX - t.x) < 0.1 && Math.abs(t.toY - t.y) < 0.1) {
          t.x = t.toX
          t.y = t.toY
          moving.delete(el)
        }
        paint(el, t)
      }
      frame = moving.size ? requestAnimationFrame(tick) : 0
    }

    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null
      const chain: HTMLElement[] = []
      // Every glass surface under the pointer, so a card's film keeps following over its own button.
      for (let el = target?.closest?.<HTMLElement>(GLASS); el; el = el.parentElement?.closest<HTMLElement>(GLASS)) chain.push(el)

      for (const el of chain) {
        const width = el.offsetWidth || 1
        const height = el.offsetHeight || 1
        let toX: number
        let toY: number
        // offsetX is in the element's own coordinates, so it stays right on the hub's rotated and tilted glass.
        if (target === el) {
          toX = e.offsetX
          toY = e.offsetY
        } else {
          // The rect includes the hover scale, so it's measured back down to the element's own size.
          const box = el.getBoundingClientRect()
          toX = ((e.clientX - box.left) / (box.width || 1)) * width
          toY = ((e.clientY - box.top) / (box.height || 1)) * height
        }

        const track = tracks.get(el)
        if (track && under.includes(el)) {
          Object.assign(track, { toX, toY, width, height })
        } else {
          // Entering: start at the pointer, or the colour would streak across from where it last was.
          const fresh = { x: toX, y: toY, toX, toY, width, height }
          tracks.set(el, fresh)
          paint(el, fresh)
        }
        moving.add(el)
      }
      under = chain

      if (moving.size && !frame) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
