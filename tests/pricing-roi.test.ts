import { describe, expect, it } from 'vitest'
import { estimateRoi, WORK_WEEKS_PER_YEAR } from '@/lib/metrics/roi'
import { COMPARISON, monthlyTotal, PLANS, yearlySaving } from '@/lib/pricing/plans'

const plan = (id: string) => PLANS.find((p) => p.id === id)!

describe('ROI estimate', () => {
  it('computes hours and cost from the inputs', () => {
    const r = estimateRoi({ employees: 50, adminHours: 3, savedPercent: 20, hourlyCost: 15 })
    expect(r.weeklyHours).toBeCloseTo(30)
    expect(r.yearlyHours).toBeCloseTo(30 * WORK_WEEKS_PER_YEAR)
    expect(r.yearlyCost).toBeCloseTo(30 * WORK_WEEKS_PER_YEAR * 15)
  })

  it('treats empty, negative and invalid input as zero', () => {
    expect(estimateRoi({ employees: NaN, adminHours: 3, savedPercent: 20, hourlyCost: 15 }).yearlyHours).toBe(0)
    expect(estimateRoi({ employees: -5, adminHours: 3, savedPercent: 20, hourlyCost: 15 }).yearlyHours).toBe(0)
    expect(estimateRoi({ employees: 10, adminHours: 3, savedPercent: 20, hourlyCost: 0 }).yearlyCost).toBe(0)
  })

  it('caps savings at 100%', () => {
    const r = estimateRoi({ employees: 1, adminHours: 10, savedPercent: 500, hourlyCost: 0 })
    expect(r.weeklyHours).toBe(10)
  })
})

describe('pricing', () => {
  it('multiplies the seat price', () => {
    expect(monthlyTotal(plan('team'), 'monthly', 25)).toBe(150)
    expect(monthlyTotal(plan('team'), 'yearly', 25)).toBe(125)
  })

  it('has no total for individually agreed plans', () => {
    expect(monthlyTotal(plan('enterprise'), 'monthly', 25)).toBeNull()
    expect(yearlySaving(plan('enterprise'), 25)).toBe(0)
  })

  it('makes yearly billing cheaper on every priced plan', () => {
    for (const p of PLANS.filter((x) => x.price)) expect(yearlySaving(p, 10)).toBeGreaterThan(0)
  })

  it('has exactly one popular plan', () => {
    expect(PLANS.filter((p) => p.popular).map((p) => p.id)).toEqual(['team'])
  })

  it('never takes a feature away on a higher plan', () => {
    const order = ['essentials', 'team', 'business', 'enterprise'] as const
    for (const row of COMPARISON.flatMap((g) => g.rows)) {
      const first = order.findIndex((id) => row.plans.includes(id))
      expect(order.slice(first).every((id) => row.plans.includes(id))).toBe(true)
    }
  })
})
