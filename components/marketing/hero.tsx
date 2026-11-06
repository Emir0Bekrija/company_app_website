import { useTranslations } from 'next-intl'
import { CalendarCheck, Inbox, ListChecks } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { stagger } from '@/lib/utils'
import { Band } from './band'
import { Lattice } from './lattice'

const ICONS = [CalendarCheck, Inbox, ListChecks]

/** Copy first, by design: the product itself appears in the section below. */
export function Hero() {
  const t = useTranslations('hero')
  const benefits = t.raw('benefits') as string[]
  return (
    <Band tone="night" className="overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_70%_at_82%_30%,rgb(37_99_235/0.22),transparent_70%),radial-gradient(45%_60%_at_62%_88%,rgb(16_185_129/0.16),transparent_70%)]" />
      <Lattice className="pointer-events-none absolute -right-[22%] top-24 w-[120%] opacity-40 sm:-right-[10%] sm:w-[85%] lg:-right-[3%] lg:top-1/2 lg:w-[56%] lg:-translate-y-1/2 lg:opacity-100" />

      <div className="wrap relative flex min-h-[calc(100svh+var(--cut))] flex-col justify-center pb-[calc(var(--cut)*2+2rem)] pt-32">
        <div className="max-w-[46rem]">
          <h1 className="display-1 hero-in">{t('title')}</h1>
          <p style={stagger(1)} className="lede hero-in mt-7">{t('lede')}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/demo" style={stagger(2)} className="btn btn-primary hero-in">{t('primary')}</Link>
            <Link href="/#features" style={stagger(3)} className="btn btn-ghost hero-in">{t('secondary')}</Link>
          </div>
          <p style={stagger(4)} className="hero-in mt-4 text-[0.9375rem] text-muted-fg">{t('note')}</p>
        </div>

        <ul className="mt-12 grid max-w-[52rem] gap-x-8 gap-y-3 sm:grid-cols-3">
          {benefits.map((text, i) => {
            const Icon = ICONS[i]
            return (
              <li key={text} style={stagger(5 + i)} className="hero-in flex items-start gap-3 text-[0.9375rem] leading-snug">
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-jade" />
                {text}
              </li>
            )
          })}
        </ul>
      </div>
    </Band>
  )
}
