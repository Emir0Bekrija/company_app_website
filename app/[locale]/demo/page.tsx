import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Band } from '@/components/marketing/band'
import { DemoExperience } from '@/components/marketing/demo-experience'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata((await params).locale, 'demo')
}

export default async function DemoPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('demo')
  return (
    <Band tone="mist">
      <div className="wrap pb-40 pt-28">
        <h1 className="display-2">{t('pageTitle')}</h1>
        <p className="lede mb-8 mt-4">{t('pageLede')}</p>
        <DemoExperience tall />
      </div>
    </Band>
  )
}
