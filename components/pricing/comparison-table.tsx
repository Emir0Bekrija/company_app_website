import { useTranslations } from 'next-intl'
import { Check, Minus } from 'lucide-react'
import { COMPARISON, PLANS, type PlanId } from '@/lib/pricing/plans'

function Mark({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return on
    ? <><Check aria-hidden className="mx-auto size-4 text-[#047857]" /><span className="sr-only">{yes}</span></>
    : <><Minus aria-hidden className="mx-auto size-4 text-muted-fg" /><span className="sr-only">{no}</span></>
}

export function ComparisonTable() {
  const t = useTranslations('pricing')
  const ids = PLANS.map((p) => p.id)
  const name = (id: PlanId) => t(`plans.${id}.name`)

  return (
    <div>
      <h2 data-reveal="mask" className="display-2">{t('compareTitle')}</h2>

      <table data-reveal="rise" className="mt-10 hidden w-full border-collapse text-left md:table">
        <caption className="sr-only">{t('compareTitle')}</caption>
        <thead>
          <tr className="border-b-2 border-line">
            <th scope="col" className="py-3 pr-4 font-medium text-muted-fg">{t('feature')}</th>
            {ids.map((id) => <th key={id} scope="col" className="w-32 px-2 py-3 text-center font-semibold">{name(id)}</th>)}
          </tr>
        </thead>
        {COMPARISON.map((group) => (
          <tbody key={group.group}>
            <tr><th colSpan={5} scope="colgroup" className="pb-2 pt-8 font-display text-lg font-semibold">{t(`groups.${group.group}`)}</th></tr>
            {group.rows.map((row) => (
              <tr key={row.key} className="border-b border-line">
                <th scope="row" className="py-2.5 pr-4 font-normal">{t(`features.${row.key}`)}</th>
                {ids.map((id) => <td key={id} className="px-2 py-2.5 text-center"><Mark on={row.plans.includes(id)} yes={t('included')} no={t('notIncluded')} /></td>)}
              </tr>
            ))}
          </tbody>
        ))}
      </table>

      {/* On a phone a five-column table doesn't fit, so each plan becomes its own list. */}
      <div className="mt-8 space-y-2 md:hidden">
        {ids.map((id) => (
          <details key={id} className="border border-line bg-raised px-4">
            <summary className="flex min-h-13 cursor-pointer items-center py-3 font-semibold">{name(id)}</summary>
            <div className="pb-4">
              {COMPARISON.map((group) => {
                const rows = group.rows.filter((r) => r.plans.includes(id))
                if (!rows.length) return null
                return (
                  <div key={group.group} className="mt-3">
                    <h3 className="font-sans text-sm font-semibold tracking-normal text-muted-fg">{t(`groups.${group.group}`)}</h3>
                    <ul className="mt-1.5 space-y-1.5">
                      {rows.map((r) => <li key={r.key} className="flex items-start gap-2 text-[0.9375rem]"><Check aria-hidden className="mt-1 size-4 shrink-0 text-[#047857]" />{t(`features.${r.key}`)}</li>)}
                    </ul>
                  </div>
                )
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
