import { useTranslations } from 'next-intl'
import { Band } from '@/components/marketing/band'
import { Link } from '@/i18n/navigation'

export default function NotFound() {
  const t = useTranslations('notFound')
  return (
    <Band tone="night">
      <div className="wrap pb-40 pt-44">
        <h1 className="display-2">{t('title')}</h1>
        <p className="lede mt-4">{t('lede')}</p>
        <Link href="/" className="btn btn-primary mt-8">{t('home')}</Link>
      </div>
    </Band>
  )
}
