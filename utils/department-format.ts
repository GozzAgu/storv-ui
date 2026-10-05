export function formatDepartmentTypeLabel(departmentType: string | undefined): string {
  if (!departmentType?.trim()) return 'General'
  return departmentType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
