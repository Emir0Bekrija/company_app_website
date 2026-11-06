import type { ComponentProps, ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { registerHref } from '@/lib/brand'

type Props = Omit<ComponentProps<'a'>, 'href'> & { children: ReactNode; plan?: string; 'data-reveal'?: string }

/** "Create your workspace": the app's registration, or the contact page until its URL is set. */
export function CreateLink({ children, plan, ...rest }: Props) {
  if (registerHref) return <a href={registerHref} {...rest}>{children}</a>
  return (
    <Link href={{ pathname: '/contact', query: plan ? { plan } : { intent: 'workspace' } }} {...rest}>
      {children}
    </Link>
  )
}
