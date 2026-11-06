export type AnalyticsEvent = 'demo_module' | 'demo_tour' | 'theme_selected' | 'billing_changed' | 'contact_sent'

/**
 * The site's one analytics hook. It sends nothing until a tag manager puts `dataLayer` on
 * the page, and that should wait for a provider choice and a consent decision.
 */
export function track(event: AnalyticsEvent, detail?: Record<string, string>) {
  if (typeof window === 'undefined') return
  const layer = (window as Window & { dataLayer?: unknown[] }).dataLayer
  layer?.push({ event, ...detail })
}
