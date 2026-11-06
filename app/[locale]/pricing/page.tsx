import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Band } from '@/components/marketing/band'
import { FinalCta } from '@/components/marketing/closing'
import { PageIntro } from '@/components/marketing/page-intro'
import { ComparisonTable } from '@/components/pricing/comparison-table'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata((await params).locale, 'pricing')
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('pricing')
  return (
    <>
      <PageIntro title={t('title')} lede={t('lede')} />
      <Band tone="deep" edge="rise">
        <div className="wrap pt-20 pb-[calc(var(--cut)+4rem)]"><PricingCards /></div>
      </Band>
      <Band tone="paper" edge="fall">
        <div className="wrap py-24"><ComparisonTable /></div>
      </Band>
      <FinalCta />
    </>
  )
}
