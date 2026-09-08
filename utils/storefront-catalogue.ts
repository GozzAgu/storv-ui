/** Build inventory-like folder browse from storefront listing category paths. */

export type StorefrontFolderNode = {
  /** Display name (parent or subcategory). */
  name: string
  /** Full path, e.g. "Perfumes" or "Perfumes / Lattafa". */
  path: string
  itemCount: number
  childCount: number
  children: StorefrontFolderNode[]
  isLeaf: boolean
}

export type StorefrontCatalogueItemLike = {
  categoryPath?: string | null
  categoryName?: string | null
}

export function parseStorefrontCategoryPath(path: string | null | undefined): string[] {
  return String(path || '')
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean)
}

export function joinStorefrontCategoryPath(parts: string[]): string {
  return parts.map((p) => p.trim()).filter(Boolean).join(' / ')
}

function pathKey(path: string): string {
  return path.trim().toLowerCase()
}

/**
 * Two-level folder tree from listing paths (Parent / Child), matching inventory.
 * Root leaves (no "/") appear as product folders at the top level.
 */
export function buildStorefrontFolderTree(
  items: StorefrontCatalogueItemLike[]
): StorefrontFolderNode[] {
  type Mutable = {
    name: string
    path: string
    itemCount: number
    children: Map<string, Mutable>
  }

  const roots = new Map<string, Mutable>()

  const ensureRoot = (name: string): Mutable => {
    const path = name
    const key = pathKey(path)
    let node = roots.get(key)
    if (!node) {
      node = { name, path, itemCount: 0, children: new Map() }
      roots.set(key, node)
    }
    return node
  }

  for (const item of items) {
    const parts = parseStorefrontCategoryPath(item.categoryPath || item.categoryName || '')
    if (parts.length === 0) {
      const other = ensureRoot('Uncategorized')
      other.itemCount += 1
      continue
    }
    if (parts.length === 1) {
      const root = ensureRoot(parts[0])
      root.itemCount += 1
      continue
    }
    const root = ensureRoot(parts[0])
    const childName = parts[1]
    const childPath = joinStorefrontCategoryPath([parts[0], childName])
    const childKey = pathKey(childPath)
    let child = root.children.get(childKey)
    if (!child) {
      child = { name: childName, path: childPath, itemCount: 0, children: new Map() }
      root.children.set(childKey, child)
    }
    child.itemCount += 1
  }

  const toNode = (m: Mutable): StorefrontFolderNode => {
    const children = Array.from(m.children.values())
      .map(toNode)
      .sort((a, b) => a.name.localeCompare(b.name))
    const childItemTotal = children.reduce((sum, c) => sum + c.itemCount, 0)
    // Parent hubs: count products under children (ignore direct root count when children exist)
    const itemCount = children.length > 0 ? childItemTotal : m.itemCount
    return {
      name: m.name,
      path: m.path,
      itemCount,
      childCount: children.length,
      children,
      isLeaf: children.length === 0,
    }
  }

  return Array.from(roots.values())
    .map(toNode)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function findStorefrontFolder(
  roots: StorefrontFolderNode[],
  path: string
): StorefrontFolderNode | null {
  const target = pathKey(path)
  if (!target) return null
  for (const root of roots) {
    if (pathKey(root.path) === target) return root
    for (const child of root.children) {
      if (pathKey(child.path) === target) return child
    }
  }
  return null
}

/** Parent path for breadcrumbs ("Perfumes / Lattafa" → "Perfumes"). */
export function storefrontFolderParentPath(path: string): string {
  const parts = parseStorefrontCategoryPath(path)
  if (parts.length <= 1) return ''
  return joinStorefrontCategoryPath(parts.slice(0, -1))
}

/** Products that belong in a leaf folder (exact path / name match). */
export function filterStorefrontItemsByFolderPath<T extends StorefrontCatalogueItemLike>(
  items: T[],
  folderPath: string
): T[] {
  const target = pathKey(folderPath)
  if (!target) return items
  return items.filter((item) => {
    const path = String(item.categoryPath || item.categoryName || '').trim()
    if (pathKey(path) === target) return true
    const parts = parseStorefrontCategoryPath(path)
    if (parts.length === 1 && pathKey(parts[0]) === target) return true
    return false
  })
}
