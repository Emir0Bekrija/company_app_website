/**
 * Locale formatting that gives the same answer everywhere. Browsers don't reliably carry
 * Bosnian data: Chromium prints `2026 M11` and `€ 5` for bs-BA, while Node prints it
 * properly, so the two would also disagree during hydration. Bosnian names are therefore
 * spelled out here, and its numbers borrow de-DE, which has the same 9.290,50 € shape.
 */
const BS_MONTHS = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar']
const BS_MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
/** Sunday first, matching Date.getDay(). */
const BS_DAYS = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota']
const BS_DAYS_SHORT = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub']

const numberTag = (locale: string) => (locale === 'bs' ? 'de-DE' : 'en-GB')

export const formatNumber = (locale: string, n: number) =>
  new Intl.NumberFormat(numberTag(locale), { maximumFractionDigits: 0 }).format(n)

export const formatMoney = (locale: string, n: number, fractionDigits?: number) =>
  new Intl.NumberFormat(numberTag(locale), { style: 'currency', currency: 'EUR', maximumFractionDigits: fractionDigits, minimumFractionDigits: fractionDigits }).format(n)

export function formatLongDate(locale: string, d: Date) {
  if (locale !== 'bs') return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return `${BS_DAYS[d.getDay()]}, ${d.getDate()}. ${BS_MONTHS[d.getMonth()]}`
}

export function formatShortDate(locale: string, d: Date) {
  if (locale !== 'bs') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${d.getDate()}. ${BS_MONTHS_SHORT[d.getMonth()]}`
}

export function formatMonth(locale: string, year: number, month: number) {
  if (locale !== 'bs') return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  return `${BS_MONTHS[month - 1]} ${year}.`
}

/** Monday to Sunday. */
export function weekdayNames(locale: string) {
  // 1 January 2024 was a Monday.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i)
    return locale === 'bs' ? BS_DAYS_SHORT[d.getDay()] : d.toLocaleDateString('en-GB', { weekday: 'short' })
  })
}
