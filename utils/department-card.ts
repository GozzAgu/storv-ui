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
      dotClass: '',
      pillClass: 'dash-grid-card__pill dash-pill--warning',
    }
  }
  return {
    label: 'Active',
    dotClass: '',
    pillClass: 'dash-grid-card__pill dash-pill--success',
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
