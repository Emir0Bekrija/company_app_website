/**
 * The one place to rebrand. Changing the product name or logo later means editing this
 * file and components/marketing/flow-logo.tsx. `name` is the product; the company is `legalName`,
 * and its details come from the Navitecs letterhead.
 */
export const brand = {
  name: 'Navitecs Flow',
  legalName: 'NAVITECS d.o.o.',
  address: 'Džemala Bijedića 40, Sarajevo',
  contactEmail: 'info@navitecs.com',
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.navitecs.com').replace(/\/$/, ''),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, ''),
} as const

/**
 * Where "Create your workspace" goes. Registration lives on the app's /login page. With
 * no app URL configured the button goes to the contact page rather than a dead link.
 */
export const registerHref: string | null = brand.appUrl ? `${brand.appUrl}/login` : null
