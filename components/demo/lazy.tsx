'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Client-only: the demo builds itself around the visitor's date, so it has no server render. */
export const DemoApp = dynamic(() => import('./demo-app'), { ssr: false })
export const ProductShot = dynamic(() => import('./product-shot'), { ssr: false })

/** Holds heavy content back until it is close to the viewport. */
export function WhenNear({ children, className, margin = '600px' }: { children: ReactNode; className?: string; margin?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect() }
    }, { rootMargin: margin })
    observer.observe(el)
    return () => observer.disconnect()
  }, [margin])
  return <div ref={ref} className={cn(className)}>{near ? children : null}</div>
}
