import type { InventoryFolder, Template, TemplateField } from '~/stores/inventory'

export type InventoryFolderDisplayRow = {
  folder: InventoryFolder
  depth: 0 | 1
  parentName?: string
}

export function normalizeParentId(parentId?: string | null): string | null {
  if (!parentId || parentId.trim() === '') return null
  return parentId
}

export function getRootFolders(folders: InventoryFolder[]): InventoryFolder[] {
  return folders.filter((folder) => !normalizeParentId(folder.parentId))
}

export function getChildFolders(folders: InventoryFolder[], parentId: string): InventoryFolder[] {
  return folders.filter((folder) => normalizeParentId(folder.parentId) === parentId)
}

export function folderHasChildren(folders: InventoryFolder[], folderId: string): boolean {
  return getChildFolders(folders, folderId).length > 0
}

export function isSubfolder(folder: InventoryFolder): boolean {
  return normalizeParentId(folder.parentId) !== null
}

/** Categories that hold products (no child categories). */
export function getLeafFolders(folders: InventoryFolder[]): InventoryFolder[] {
  return folders.filter((folder) => !folderHasChildren(folders, folder.id))
}

export function getFolderParent(
  folders: InventoryFolder[],
  folder: InventoryFolder
): InventoryFolder | null {
  const parentId = normalizeParentId(folder.parentId)
  if (!parentId) return null
  return folders.find((entry) => entry.id === parentId) ?? null
}

export function validateFolderParentId(
  folders: InventoryFolder[],
  parentId: string | null | undefined,
  options?: { editingFolderId?: string }
): void {
  const normalized = normalizeParentId(parentId)
  if (!normalized) return

  const parent = folders.find((folder) => folder.id === normalized)
  if (!parent) {
    throw new Error('Parent category not found.')
  }

  if (isSubfolder(parent)) {
    throw new Error('Subcategories cannot be nested further. Choose a top-level category as parent.')
  }

  if (options?.editingFolderId && normalized === options.editingFolderId) {
    throw new Error('A category cannot be its own parent.')
  }

  if ((parent.itemCount ?? 0) > 0) {
    throw new Error(
      'This category already has products. Move or delete them before adding subcategories.'
    )
  }
}

function matchesFolderSearch(folder: InventoryFolder, query: string): boolean {
  const q = query.toLowerCase()
  return (
    folder.name.toLowerCase().includes(q) ||
    (folder.description || '').toLowerCase().includes(q)
  )
}

export function buildFolderDisplayRows(
  folders: InventoryFolder[],
  options?: { searchQuery?: string }
): InventoryFolderDisplayRow[] {
  const roots = getRootFolders(folders)
  const rows: InventoryFolderDisplayRow[] = []
  const query = options?.searchQuery?.trim()

  for (const root of roots) {
    const children = getChildFolders(folders, root.id)

    if (query) {
      const rootMatches = matchesFolderSearch(root, query)
      const matchingChildren = children.filter((child) => matchesFolderSearch(child, query))
      if (!rootMatches && matchingChildren.length === 0) continue

      rows.push({ folder: root, depth: 0 })
      const childrenToShow = rootMatches ? children : matchingChildren
      for (const child of childrenToShow) {
        rows.push({ folder: child, depth: 1, parentName: root.name })
      }
      continue
    }

    rows.push({ folder: root, depth: 0 })
    for (const child of children) {
      rows.push({ folder: child, depth: 1, parentName: root.name })
    }
  }

  return rows
}

export function filterRootFolders(folders: InventoryFolder[], searchQuery?: string): InventoryFolder[] {
  const query = searchQuery?.trim()
  if (!query) return getRootFolders(folders)

  const rows = buildFolderDisplayRows(folders, { searchQuery: query })
  const seen = new Set<string>()
  const roots: InventoryFolder[] = []

  for (const row of rows) {
    if (row.depth !== 0 || seen.has(row.folder.id)) continue
    seen.add(row.folder.id)
    roots.push(row.folder)
  }

  return roots
}

export function rollupFolderStats(
  folder: InventoryFolder,
  folders: InventoryFolder[]
): Pick<InventoryFolder, 'itemCount' | 'totalValue' | 'lowStockCount'> {
  const children = getChildFolders(folders, folder.id)
  if (children.length === 0) {
    return {
      itemCount: folder.itemCount ?? 0,
      totalValue: folder.totalValue ?? 0,
      lowStockCount: folder.lowStockCount ?? 0,
    }
  }

  return children.reduce(
    (acc, child) => {
      const stats = rollupFolderStats(child, folders)
      return {
        itemCount: acc.itemCount + stats.itemCount,
        totalValue: acc.totalValue + stats.totalValue,
        lowStockCount: acc.lowStockCount + stats.lowStockCount,
      }
    },
    { itemCount: 0, totalValue: 0, lowStockCount: 0 }
  )
}

/** Settings subcategories inherit from their parent category. */
export type InheritableFolderSettings = {
  type: string
  color: string
  hasSerialNumbers: boolean
  trackProfit: boolean
  template: Template
  allowedDepartments: string[]
}

function templateFieldsSignature(fields: TemplateField[] | undefined): string {
  if (!fields?.length) return ''
  return JSON.stringify(
    fields.map((field) => ({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options,
      placeholder: field.placeholder,
    }))
  )
}

function departmentsSignature(departments: string[] | undefined): string {
  return [...(departments ?? [])].sort().join('\0')
}

export function getInheritableFolderSettingsFromFolder(
  folder: InventoryFolder
): InheritableFolderSettings {
  return {
    type: folder.type || 'general',
    color: folder.color || '#3B82F6',
    hasSerialNumbers: folder.hasSerialNumbers || false,
    trackProfit: folder.trackProfit === true,
    template: folder.template ?? {
      id: 'custom',
      name: 'Custom Template',
      description: 'Custom table structure',
      fields: [],
    },
    allowedDepartments: folder.allowedDepartments ? [...folder.allowedDepartments] : [],
  }
}

export function inheritableFolderSettingsChanged(
  original: InventoryFolder,
  next: InheritableFolderSettings
): boolean {
  const previous = getInheritableFolderSettingsFromFolder(original)
  if (previous.type !== next.type) return true
  if (previous.color !== next.color) return true
  if (previous.hasSerialNumbers !== next.hasSerialNumbers) return true
  if (previous.trackProfit !== next.trackProfit) return true
  if (
    departmentsSignature(previous.allowedDepartments) !==
    departmentsSignature(next.allowedDepartments)
  ) {
    return true
  }
  return (
    templateFieldsSignature(previous.template.fields) !==
    templateFieldsSignature(next.template.fields)
  )
}

export function pickInheritableFolderUpdates(
  settings: InheritableFolderSettings
): InheritableFolderSettings {
  return {
    type: settings.type,
    color: settings.color,
    hasSerialNumbers: settings.hasSerialNumbers,
    trackProfit: settings.trackProfit,
    template: {
      ...settings.template,
      fields: settings.template.fields.map((field) => ({ ...field })),
    },
    allowedDepartments: [...settings.allowedDepartments],
  }
}
