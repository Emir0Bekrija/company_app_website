'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Plays each `data-reveal` entrance once, as the element comes on screen. The look of every
 * entrance is in globals.css. When one ends the attribute comes off, so the element goes back to
 * its own transitions. The layout's inline script decides whether entrances run at all.
 */
export function ScrollReveal() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    root.dataset.revealsReady = ''
    if (!('reveals' in root.dataset)) return

    const finish = (el: Element) => {
      el.removeAttribute('data-reveal')
      el.removeAttribute('data-revealed')
    }

    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting, boundingClientRect } of entries) {
        // Already above the screen, as after a jump to an anchor: nothing to watch, so show it.
        const passed = boundingClientRect.bottom < 0 && boundingClientRect.height > 0
        if (!isIntersecting && !passed) continue
        observer.unobserve(target)
        if (passed) { finish(target); continue }
        target.setAttribute('data-revealed', '')
        void Promise.allSettled(target.getAnimations().map((a) => a.finished)).then(() => finish(target))
      }
    }, { rootMargin: '0px 0px -8% 0px' })

    document.querySelectorAll('[data-reveal]:not([data-revealed])').forEach((el) => observer.observe(el))

    // Anything mounted later, or rebuilt by Fast Refresh, arrives hidden and would otherwise stay that way.
    const arrivals = new MutationObserver((records) => {
      for (const { addedNodes } of records) {
        for (const node of addedNodes) {
          if (!(node instanceof Element)) continue
          if (node.matches('[data-reveal]')) observer.observe(node)
          node.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el))
        }
      }
    })
    arrivals.observe(document.body, { childList: true, subtree: true })

    return () => {
      arrivals.disconnect()
      observer.disconnect()
    }
  }, [pathname])

  return null
}
