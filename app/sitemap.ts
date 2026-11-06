import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { brand } from '@/lib/brand'
import { localizedPath, pagePaths } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  return pagePaths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${brand.siteUrl}${localizedPath(locale, path)}`,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, `${brand.siteUrl}${localizedPath(l, path)}`])),
      },
    })))
}
