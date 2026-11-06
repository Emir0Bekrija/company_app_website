import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { brand } from '@/lib/brand'
import { stagger } from '@/lib/utils'
import { Band } from './band'
import { Logo } from './logo'

export function SiteFooter() {
  const t = useTranslations('footer')
  const nav = useTranslations('nav')
  const year = new Date().getFullYear()
  return (
    <Band tone="night" edge="fall">
      <footer className="wrap grid gap-10 pb-10 pt-20 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div data-reveal="rise">
          <Logo className="w-52" />
          <p className="mt-4 max-w-xs text-muted-fg">{t('tagline')}</p>
        </div>
        <div data-reveal="rise" style={stagger(1)}>
          <h2 className="font-sans text-sm font-semibold tracking-normal">{t('product')}</h2>
          <ul className="mt-3 space-y-2 text-muted-fg">
            <li><Link className="hover:text-fg" href="/features">{nav('features')}</Link></li>
            <li><Link className="hover:text-fg" href="/demo">{nav('demo')}</Link></li>
            <li><Link className="hover:text-fg" href="/solutions">{nav('solutions')}</Link></li>
            <li><Link className="hover:text-fg" href="/pricing">{nav('pricing')}</Link></li>
          </ul>
        </div>
        <div data-reveal="rise" style={stagger(2)}>
          <h2 className="font-sans text-sm font-semibold tracking-normal">{t('company')}</h2>
          <ul className="mt-3 space-y-2 text-muted-fg">
            <li><Link className="hover:text-fg" href="/contact">{nav('contact')}</Link></li>
            <li><a className="hover:text-fg" href={`mailto:${brand.contactEmail}`}>{brand.contactEmail}</a></li>
            <li>{brand.address}</li>
          </ul>
        </div>
        <div data-reveal="rise" style={stagger(3)}>
          <h2 className="font-sans text-sm font-semibold tracking-normal">{t('legal')}</h2>
          <ul className="mt-3 space-y-2 text-muted-fg">
            <li><Link className="hover:text-fg" href="/privacy" prefetch={false}>{t('privacy')}</Link></li>
          </ul>
        </div>
        <p className="border-t border-line pt-6 text-sm text-muted-fg md:col-span-4">© {year} {brand.legalName} {t('rights')}</p>
      </footer>
    </Band>
  )
}
