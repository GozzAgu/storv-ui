import type { CategoryTrackingPill } from '~/utils/inventory-category-card'

export function departmentDescriptionText(description: string | undefined): string {
  const trimmed = description?.trim()
  return trimmed || 'No description added yet.'
}

export function formatDepartmentTypeLabel(departmentType: string | undefined): string {
  if (!departmentType?.trim()) return 'General'
  return departmentType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function departmentStatusPill(inactive: boolean): CategoryTrackingPill {
  if (inactive) {
    return {
      label: 'Inactive',
      dotClass: 'bg-amber-500',
      pillClass:
        'bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50',
    }
  }
  return {
    label: 'Active',
    dotClass: 'bg-emerald-500',
    pillClass:
      'bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/35 dark:text-emerald-300 dark:ring-emerald-800/40',
  }
}

/** Ring fill: active departments with staff read as full; empty or inactive lower. */
export function departmentStaffRingPercent(inactive: boolean, staffCount: number): number {
  if (inactive) return 0
  if (staffCount <= 0) return 20
  return 100
}

export function departmentManagerLabel(manager: string | undefined): string {
  const trimmed = manager?.trim()
  return trimmed || 'No manager assigned'
}
