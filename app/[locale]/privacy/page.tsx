import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Band } from '@/components/marketing/band'
import { brand } from '@/lib/brand'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata((await params).locale, 'privacy')
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('privacyPage')
  const sections = t.raw('sections') as { title: string; text: string }[]
  const fill = (s: string) => s
    .replace('{legalName}', brand.legalName)
    .replace('{address}', brand.address)
    .replace('{email}', brand.contactEmail)

  return (
    <Band tone="paper">
      <div className="wrap max-w-3xl pb-40 pt-36">
        <h1 className="display-2">{t('title')}</h1>
        {sections.map((s) => (
          <section key={s.title} className="mt-10">
            <h2 className="font-sans text-xl font-semibold tracking-normal">{s.title}</h2>
            <p className="mt-2 text-muted-fg">{fill(s.text)}</p>
          </section>
        ))}
      </div>
    </Band>
  )
}
