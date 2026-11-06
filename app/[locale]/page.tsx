import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Band } from '@/components/marketing/band'
import { FinalCta, Faq, HowItWorks, Security } from '@/components/marketing/closing'
import { DemoExperience } from '@/components/marketing/demo-experience'
import { Hero } from '@/components/marketing/hero'
import { ImpactCalculator } from '@/components/marketing/impact-calculator'
import { PlatformHub } from '@/components/marketing/platform-hub'
import { ProductReveal } from '@/components/marketing/product-reveal'
import { ExportStory, InvoiceStory, LeaveStory, PeopleStory, TimesheetStory, WorkStory } from '@/components/marketing/stories'
import { ThemeExperience } from '@/components/marketing/theme-experience'
import { PricingCards } from '@/components/pricing/pricing-cards'
import { Link } from '@/i18n/navigation'
import { brand } from '@/lib/brand'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata((await params).locale, 'home')
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const strip = await getTranslations('strip')
  const demo = await getTranslations('demo')
  const pricing = await getTranslations('pricing')
  const meta = await getTranslations('meta.home')

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: brand.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: meta('description'),
    publisher: { '@type': 'Organization', name: brand.legalName, url: brand.siteUrl, email: brand.contactEmail },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, '\\u003c') }} />
      <Hero />
      <ProductReveal />

      <Band tone="paper" edge="chevron">
        <div className="wrap py-24">
          <p data-reveal="mask" className="max-w-5xl font-display text-[clamp(1.75rem,3.6vw,3.25rem)] font-semibold leading-[1.14] tracking-[-0.018em]" style={{ fontStretch: '112%' }}>
            {strip('text')}
          </p>
        </div>
      </Band>

      <PlatformHub />

      <Band tone="mist" edge="fall" id="demo">
        <div className="wrap py-24">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-end">
            <h2 data-reveal="mask" className="display-2">{demo('title')}</h2>
            <div data-reveal="rise">
              <p className="lede">{demo('lede')}</p>
              <Link href="/demo" className="mt-3 inline-block font-medium underline underline-offset-4">{demo('fullscreen')}</Link>
            </div>
          </div>
          <div className="mt-10"><DemoExperience /></div>
        </div>
      </Band>

      <TimesheetStory />
      <LeaveStory />
      <InvoiceStory />
      <PeopleStory />
      <WorkStory />
      <ExportStory />
      <ThemeExperience />
      <ImpactCalculator />

      <Band tone="deep" edge="rise" id="pricing">
        <div className="wrap pt-24 pb-[calc(var(--cut)+4rem)]">
          <h2 data-reveal="mask" className="display-2">{pricing('title')}</h2>
          <p data-reveal="rise" className="lede mb-10 mt-5">{pricing('lede')}</p>
          <PricingCards />
          <Link href="/pricing" className="mt-4 inline-block font-medium underline underline-offset-4">{pricing('compare')}</Link>
        </div>
      </Band>

      <HowItWorks />
      <Security />
      <Faq />
      <FinalCta />
    </>
  )
}
