/**
 * Pricing is per active employee per month. All prices are PLACEHOLDERS awaiting a
 * business decision: change them here and every price on the site follows.
 *
 * The app has no billing yet, so nothing here is enforced. See docs/launch-checklist.md.
 */

export type Billing = 'monthly' | 'yearly'
export type PlanId = 'essentials' | 'team' | 'business' | 'enterprise'

export type Plan = {
  id: PlanId
  /** Euro per active employee per month. Null means the price is agreed individually. */
  price: { monthly: number; yearly: number } | null
  popular?: boolean
}

export const CURRENCY = 'EUR'

/**
 * 'register' sends self-serve plans to the app's registration. 'contact' sends every
 * plan to the contact form, for launching before the app can enforce plans.
 */
export const PLAN_CTA_MODE: 'register' | 'contact' = 'register'

export const PLANS: Plan[] = [
  { id: 'essentials', price: { monthly: 4, yearly: 3 } },
  { id: 'team', price: { monthly: 6, yearly: 5 }, popular: true },
  { id: 'business', price: { monthly: 10, yearly: 8 } },
  { id: 'enterprise', price: null },
]

export const SEATS = { min: 5, max: 250, initial: 25 } as const

/** What a company pays per month for a seat count, or null for individually agreed plans. */
export function monthlyTotal(plan: Plan, billing: Billing, seats: number): number | null {
  return plan.price ? plan.price[billing] * Math.max(0, Math.round(seats)) : null
}

/** What choosing yearly billing saves over twelve months. */
export function yearlySaving(plan: Plan, seats: number): number {
  if (!plan.price) return 0
  return (plan.price.monthly - plan.price.yearly) * 12 * Math.max(0, Math.round(seats))
}

/**
 * The comparison table. `true` means included, and only features that exist in the
 * product appear here. Keys resolve to pricing.features.* in the messages.
 */
export const COMPARISON: { group: string; rows: { key: string; plans: PlanId[] }[] }[] = [
  {
    group: 'time',
    rows: [
      { key: 'timesheets', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'autofill', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'approvals', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'overtime', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'schedules', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'calendarFeed', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'exportBuiltIn', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'exportCustom', plans: ['team', 'business', 'enterprise'] },
    ],
  },
  {
    group: 'people',
    rows: [
      { key: 'departments', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'vacation', plans: ['team', 'business', 'enterprise'] },
      { key: 'absences', plans: ['team', 'business', 'enterprise'] },
      { key: 'toil', plans: ['team', 'business', 'enterprise'] },
      { key: 'tasks', plans: ['team', 'business', 'enterprise'] },
      { key: 'teams', plans: ['team', 'business', 'enterprise'] },
      { key: 'customRoles', plans: ['business', 'enterprise'] },
    ],
  },
  {
    group: 'finance',
    rows: [
      { key: 'invoicing', plans: ['business', 'enterprise'] },
      { key: 'clients', plans: ['business', 'enterprise'] },
      { key: 'expenses', plans: ['business', 'enterprise'] },
      { key: 'templates', plans: ['business', 'enterprise'] },
    ],
  },
  {
    group: 'everyPlan',
    rows: [
      { key: 'twoFactor', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'themes', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'languages', plans: ['essentials', 'team', 'business', 'enterprise'] },
      { key: 'notifications', plans: ['essentials', 'team', 'business', 'enterprise'] },
    ],
  },
  {
    group: 'service',
    rows: [
      { key: 'volume', plans: ['enterprise'] },
      { key: 'migration', plans: ['enterprise'] },
    ],
  },
]
