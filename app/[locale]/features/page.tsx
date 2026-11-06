import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Band, type BandTone } from '@/components/marketing/band'
import { FinalCta } from '@/components/marketing/closing'
import { PageIntro } from '@/components/marketing/page-intro'
import { Link } from '@/i18n/navigation'
import { FEATURE_GROUPS } from '@/lib/features/modules'
import { pageMetadata } from '@/lib/seo'
import { stagger } from '@/lib/utils'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata((await params).locale, 'features')
}

const TONES: BandTone[] = ['paper', 'mist']

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('featuresPage')

  return (
    <>
      <PageIntro title={t('title')} lede={t('lede')} />
      {FEATURE_GROUPS.map((group, i) => (
        <Band key={group.id} tone={TONES[i % 2]} edge={i % 2 ? 'fall' : 'rise'}>
          <div className="wrap grid gap-8 py-20 lg:grid-cols-[0.6fr_1.4fr]">
            <h2 data-reveal="left" className="display-3 lg:sticky lg:top-28 lg:self-start">{t(`groups.${group.id}`)}</h2>
            <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {group.modules.map((id, n) => (
                <li key={id} data-reveal="rise" style={stagger(n % 2)}>
                  <h3 className="font-sans text-xl font-semibold tracking-normal">{t(`modules.${id}.title`)}</h3>
                  <p className="mt-2 text-muted-fg">{t(`modules.${id}.text`)}</p>
                  <Link
                    href={{ pathname: '/demo', query: { tour: id } }}
                    aria-label={`${t('tryIt')}: ${t(`modules.${id}.title`)}`}
                    data-testid="feature-tour"
                    className="mt-2 inline-block text-[0.9375rem] font-medium underline underline-offset-4"
                  >
                    {t('tryIt')}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Band>
      ))}
      <FinalCta />
    </>
  )
}
