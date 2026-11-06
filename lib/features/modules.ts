export type FeatureId =
  | 'timesheets' | 'approvals' | 'overtime' | 'activeMonth' | 'export'
  | 'vacation' | 'absences' | 'sick' | 'toil'
  | 'tasks' | 'calendar' | 'notifications'
  | 'invoices' | 'clients' | 'expenses' | 'templates'
  | 'people' | 'departments' | 'schedules' | 'roles' | 'security' | 'appearance'

/**
 * The feature list. To add a module to the website, add its id here, its text under
 * featuresPage.modules in the messages, and its presentation in lib/demo/tours.ts.
 */
export const FEATURE_GROUPS: { id: string; modules: FeatureId[] }[] = [
  { id: 'time', modules: ['timesheets', 'approvals', 'overtime', 'activeMonth', 'export'] },
  { id: 'off', modules: ['vacation', 'absences', 'sick', 'toil'] },
  { id: 'work', modules: ['tasks', 'calendar', 'notifications'] },
  { id: 'finance', modules: ['invoices', 'clients', 'expenses', 'templates'] },
  { id: 'people', modules: ['people', 'departments', 'schedules', 'roles', 'security', 'appearance'] },
]
