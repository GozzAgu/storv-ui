/**
 * Visual grouping for web sidebar navigation.
 * Does not change routes, permissions, or item order — only section labels.
 */

export const WEB_NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', items: ['Dashboard'] },
  { id: 'commerce', label: 'Commerce', items: ['Inventory', 'Sales'] },
  {
    id: 'operations',
    label: 'Stock operations',
    items: ['Customer buybacks', 'Stock loans', 'Multi-Store Sync', 'Payment links'],
  },
  { id: 'organization', label: 'Organization', items: ['Departments'] },
  { id: 'insights', label: 'Insights', items: ['Analytics', 'Activity Logs'] },
  { id: 'account', label: 'Account', items: ['Help center', 'Settings', 'Profile'] },
] as const

const itemToSection = new Map<string, string>()

for (const section of WEB_NAV_SECTIONS) {
  for (const item of section.items) {
    itemToSection.set(item, section.label)
  }
}

export function webNavSectionLabel(itemName: string): string | null {
  return itemToSection.get(itemName) ?? null
}

export function shouldShowWebNavSection(
  itemName: string,
  itemIndex: number,
  visibleItems: Array<{ name: string }>
): boolean {
  const label = webNavSectionLabel(itemName)
  if (!label) return false
  if (itemIndex === 0) return true
  const prev = visibleItems[itemIndex - 1]
  if (!prev) return true
  return webNavSectionLabel(prev.name) !== label
}
