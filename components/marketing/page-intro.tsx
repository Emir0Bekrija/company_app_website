import type { ReactNode } from 'react'
import { stagger } from '@/lib/utils'
import { Band } from './band'
import { Lattice } from './lattice'

export function PageIntro({ title, lede, children }: { title: string; lede: string; children?: ReactNode }) {
  return (
    <Band tone="night" className="overflow-hidden">
      <Lattice className="pointer-events-none absolute -right-24 -top-10 hidden w-[42rem] opacity-40 md:block" />
      <div className="wrap relative pb-[calc(var(--cut)+5rem)] pt-40">
        <h1 className="display-1 hero-in max-w-4xl !text-[clamp(2.5rem,5.4vw,4.75rem)]">{title}</h1>
        <p style={stagger(1)} className="lede hero-in mt-6">{lede}</p>
        {children}
      </div>
    </Band>
  )
}
