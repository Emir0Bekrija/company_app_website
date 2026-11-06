export type RoiInput = {
  employees: number
  /** Hours each employee spends on admin per week. */
  adminHours: number
  /** Share of that time the visitor expects to save, 0 to 100. */
  savedPercent: number
  /** Optional hourly labour cost. */
  hourlyCost: number
}

export const WORK_WEEKS_PER_YEAR = 46

/** A plain estimate from the visitor's own assumptions. It is not a measured outcome. */
export function estimateRoi({ employees, adminHours, savedPercent, hourlyCost }: RoiInput) {
  const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0)
  const weeklyHours = clamp(employees) * clamp(adminHours) * (Math.min(clamp(savedPercent), 100) / 100)
  const yearlyHours = weeklyHours * WORK_WEEKS_PER_YEAR
  return {
    weeklyHours,
    yearlyHours,
    yearlyCost: yearlyHours * clamp(hourlyCost),
    // A 40-hour week, to make a large number of hours easy to picture.
    workWeeksPerYear: yearlyHours / 40,
  }
}
