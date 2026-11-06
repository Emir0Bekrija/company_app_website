'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { Link, usePathname } from '@/i18n/navigation'
import { brand } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { CreateLink } from './create-link'
import { Logo } from './logo'

const LINKS = [
  { href: '/features', key: 'features' },
  { href: '/demo', key: 'demo' },
  { href: '/solutions', key: 'solutions' },
  { href: '/pricing', key: 'pricing' },
  { href: '/contact', key: 'contact' },
] as const

// The locale is a param of the root layout, so a client-side switch would re-render its inline
// scripts, which never run that way. A full load runs them. Link has already updated the cookie.
function loadDocument(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  window.location.assign(e.currentTarget.href)
}

function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('nav')
  return (
    <div role="group" aria-label={t('language')} className={cn('flex text-sm', className)}>
      {(['en', 'bs'] as const).map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          hrefLang={l}
          onClick={l === locale ? undefined : loadDocument}
          aria-current={l === locale ? 'true' : undefined}
          className={cn('inline-flex min-h-11 min-w-9 items-center justify-center px-1.5 font-medium', l === locale ? 'text-fg' : 'text-muted-fg hover:text-fg')}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}

/** These pages open on a light band, where the white logo and links need the dark glass from the start. */
const LIGHT_TOP: string[] = ['/demo', '/privacy']

export function SiteHeader() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className={cn('tone-night fixed inset-x-0 top-0 z-50 text-fg transition-colors duration-300', (scrolled || open || LIGHT_TOP.includes(pathname)) && 'header-acrylic')}>
      <div className="wrap flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" aria-label={brand.name} onClick={() => setOpen(false)}><Logo centerNavitecs className="w-52" /></Link>

        <nav aria-label={t('main')} className="hidden items-center gap-7 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? 'page' : undefined}
              className={cn('text-[0.9375rem] transition-colors hover:text-fg', pathname === l.href ? 'text-fg' : 'text-muted-fg')}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitch className="hidden lg:flex" />
          <CreateLink className="btn btn-primary hidden !min-h-11 !py-2 !text-[0.9375rem] sm:inline-flex">{t('create')}</CreateLink>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('close') : t('menu')}
            onClick={() => setOpen(!open)}
            className="inline-flex size-11 items-center justify-center lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label={t('main')} className="wrap max-h-[calc(100dvh-4.5rem)] overflow-y-auto pb-8 lg:hidden">
          <ul className="border-t border-line">
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-line">
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-4 font-display text-xl">{t(l.key)}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between gap-4">
            <LanguageSwitch />
            <CreateLink className="btn btn-primary sm:hidden">{t('create')}</CreateLink>
          </div>
        </nav>
      )}
    </header>
  )
}
