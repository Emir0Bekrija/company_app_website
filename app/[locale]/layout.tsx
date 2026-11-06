import type { Metadata, Viewport } from 'next'
import { Archivo, Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'
import { FluentReveal } from '@/components/marketing/fluent-reveal'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'
import { SiteFooter } from '@/components/marketing/site-footer'
import { SiteHeader } from '@/components/marketing/site-header'
import { routing } from '@/i18n/routing'
import { brand } from '@/lib/brand'
import '@/styles/globals.css'

// Both families include Latin Extended, which Bosnian needs for č, ć, đ, š and ž.
const archivo = Archivo({ subsets: ['latin', 'latin-ext'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' })

/**
 * A reload starts at the top. This has to run before the browser restores the old position, so it
 * is inline. Restoration goes back to auto afterwards, which keeps the Back button working.
 */
const RELOAD_TO_TOP = `(function(){try{
var n=performance.getEntriesByType('navigation')[0];
if(!n||n.type!=='reload')return;
history.scrollRestoration='manual';
if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
addEventListener('load',function(){
scrollTo({top:0,behavior:'instant'});
requestAnimationFrame(function(){requestAnimationFrame(function(){history.scrollRestoration='auto'})});
});
}catch(e){}})()`

/**
 * Switches entrances on before first paint, so sections never flash in and then hide. Without
 * this script nothing is hidden, and if the page's code hasn't started in time everything shows.
 */
const ENABLE_REVEALS = `(function(){try{
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var d=document.documentElement;
d.setAttribute('data-reveals','');
setTimeout(function(){if(!d.hasAttribute('data-reveals-ready'))d.removeAttribute('data-reveals')},4000);
}catch(e){}})()`

export const viewport: Viewport = { themeColor: '#071621' }

export const metadata: Metadata = { metadataBase: new URL(brand.siteUrl) }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const t = await getTranslations('nav')

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${archivo.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: RELOAD_TO_TOP }} />
        <script dangerouslySetInnerHTML={{ __html: ENABLE_REVEALS }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <FluentReveal />
          <ScrollReveal />
          <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-paper focus:px-4 focus:py-2 focus:text-harbour">
            {t('skip')}
          </a>
          <SiteHeader />
          <main id="content">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
