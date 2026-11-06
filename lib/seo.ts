import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { brand } from './brand'

export type PageKey = 'home' | 'features' | 'demo' | 'solutions' | 'pricing' | 'contact' | 'privacy'

const PATHS: Record<PageKey, string> = {
  home: '', features: '/features', demo: '/demo', solutions: '/solutions', pricing: '/pricing', contact: '/contact', privacy: '/privacy',
}

export const pagePaths = Object.values(PATHS)

export const localizedPath = (locale: string, path: string) =>
  `${locale === routing.defaultLocale ? '' : `/${locale}`}${path}` || '/'

export async function pageMetadata(locale: string, page: PageKey): Promise<Metadata> {
  const t = await getTranslations({ locale: locale as Locale, namespace: `meta.${page}` })
  const path = PATHS[page]
  const title = page === 'home' ? t('title') : `${t('title')} | ${brand.name}`
  // A page's own openGraph block replaces the inherited one, image included.
  const image = `${locale === routing.defaultLocale ? '' : `/${locale}`}/opengraph-image`
  return {
    title,
    description: t('description'),
    alternates: {
      canonical: localizedPath(locale, path),
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, localizedPath(l, path)])),
        'x-default': localizedPath(routing.defaultLocale, path),
      },
    },
    openGraph: {
      title,
      description: t('description'),
      url: localizedPath(locale, path),
      siteName: brand.name,
      locale: locale === 'bs' ? 'bs_BA' : 'en_GB',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description: t('description'), images: [image] },
  }
}
