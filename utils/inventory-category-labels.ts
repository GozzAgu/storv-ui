/**
 * User-facing label for inventory groupings (Firestore paths/collections still use "folder").
 * Import these constants in templates and copy instead of hardcoding "folder".
 */
export const INVENTORY_GROUP = {
  singular: 'Category',
  plural: 'Categories',
  singularLower: 'category',
  pluralLower: 'categories',
} as const

export function inventoryGroupCount(count: number): string {
  const n = Math.max(0, count)
  return `${n} ${n === 1 ? INVENTORY_GROUP.singularLower : INVENTORY_GROUP.pluralLower}`
}

/** e.g. "Search categories…" */
export const SEARCH_PLACEHOLDER = `Search ${INVENTORY_GROUP.pluralLower}…`

/** e.g. "New category" */
export const NEW_GROUP_LABEL = `New ${INVENTORY_GROUP.singularLower}`
