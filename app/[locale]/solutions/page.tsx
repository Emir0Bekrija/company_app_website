import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Check } from 'lucide-react'
import { Band, type BandEdge, type BandTone } from '@/components/marketing/band'
import { FinalCta } from '@/components/marketing/closing'
import { PageIntro } from '@/components/marketing/page-intro'
import { Link } from '@/i18n/navigation'
import { pageMetadata } from '@/lib/seo'
import { stagger } from '@/lib/utils'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return pageMetadata((await params).locale, 'solutions')
}

const ROLES: { id: string; tone: BandTone; edge: BandEdge }[] = [
  { id: 'workers', tone: 'paper', edge: 'rise' },
  { id: 'leads', tone: 'mist', edge: 'fall' },
  { id: 'hr', tone: 'deep', edge: 'chevron' },
  { id: 'finance', tone: 'paper', edge: 'rise' },
  { id: 'owners', tone: 'mist', edge: 'fall' },
]

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('solutionsPage')

  return (
    <>
      <PageIntro title={t('title')} lede={t('lede')} />
      {ROLES.map((role, i) => (
        <Band key={role.id} tone={role.tone} edge={role.edge} id={role.id}>
          <div className={`wrap grid items-center gap-10 py-24 lg:grid-cols-2 ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
            <div>
              <h2 data-reveal="mask" className="display-2">{t(`roles.${role.id}.title`)}</h2>
              <p data-reveal="rise" className="lede mt-5">{t(`roles.${role.id}.lede`)}</p>
              <Link href="/demo" data-reveal="pop" style={stagger(1)} className="btn btn-ghost mt-7">{t('try')}</Link>
            </div>
            <ul className="space-y-4 text-lg">
              {(t.raw(`roles.${role.id}.points`) as string[]).map((p, n) => (
                <li key={p} data-reveal={i % 2 ? 'left' : 'right'} style={stagger(n)} className="flex items-start gap-3 border-b border-line pb-4"><Check aria-hidden className="mt-1 size-5 shrink-0 text-jade" />{p}</li>
              ))}
            </ul>
          </div>
        </Band>
      ))}
      <FinalCta />
    </>
  )
}
