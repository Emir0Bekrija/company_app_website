import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Band } from '@/components/marketing/band'
import { ContactForm } from '@/components/marketing/contact-form'
import { PageIntro } from '@/components/marketing/page-intro'
import { brand } from '@/lib/brand'
import { PLANS } from '@/lib/pricing/plans'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ plan?: string; intent?: string }> }

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  return pageMetadata((await params).locale, 'contact')
}

export default async function ContactPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { plan, intent } = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('contactPage')
  const pricing = await getTranslations('pricing')
  const chosen = PLANS.find((p) => p.id === plan)

  return (
    <>
      <PageIntro title={t('title')} lede={t('lede')} />
      <Band tone="paper" edge="rise">
        <div className="wrap relative grid gap-12 py-20 pb-40 lg:grid-cols-[1.3fr_0.7fr]">
          <div data-reveal="rise">
            {chosen && <p className="mb-5 font-medium">{t('planNote', { plan: pricing(`plans.${chosen.id}.name`) })}</p>}
            {!chosen && intent === 'workspace' && <p className="mb-5 font-medium">{t('workspaceNote')}</p>}
            <ContactForm plan={chosen?.id} />
          </div>
          <aside data-reveal="right" className="space-y-6">
            <div>
              <h2 className="font-sans text-lg font-semibold tracking-normal">{t('direct')}</h2>
              <a className="mt-1 inline-block underline underline-offset-4" href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a>
            </div>
            <div>
              <h2 className="font-sans text-lg font-semibold tracking-normal">{t('address')}</h2>
              <p className="mt-1 text-muted-fg">{brand.legalName}<br />{brand.address}</p>
            </div>
          </aside>
        </div>
      </Band>
    </>
  )
}
