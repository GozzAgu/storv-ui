/**
 * Where a transfer's stock left from and landed: branch, category and (when used) subcategory.
 * Transfers store each end's category path as names, root first (e.g. ['Cars', 'Sedan']), so the
 * route stays readable after a category is renamed or deleted and across branches whose
 * categories the viewer can't load.
 */

/** Deepest category nesting we follow; guards against a parentId loop in bad data. */
export const MAX_FOLDER_DEPTH = 4

/** Folder names from the top-level category down to `folderId`. Empty when it isn't found. */
export function folderPathNames(
  folders: ReadonlyArray<{ id: string; name?: string; parentId?: string | null }>,
  folderId: string | null | undefined
): string[] {
  const byId = new Map(folders.map((f) => [f.id, f]))
  const names: string[] = []
  const seen = new Set<string>()
  let id = folderId || ''
  while (id && names.length < MAX_FOLDER_DEPTH && !seen.has(id)) {
    seen.add(id)
    const folder = byId.get(id)
    if (!folder) break
    names.unshift(String(folder.name || '').trim() || 'Unnamed category')
    id = folder.parentId || ''
  }
  return names
}

/** Keeps a stored path to short, non-empty strings; anything else reads as no path. */
export function normalizeFolderPath(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((n) => String(n ?? '').trim().slice(0, 120))
    .filter(Boolean)
    .slice(0, MAX_FOLDER_DEPTH)
}

/** "Port Harcourt › Cars › Sedan", or just the branch when the categories are unknown. */
export function formatTransferEndpoint(branchName: string, folderPath: unknown): string {
  return [branchName, ...normalizeFolderPath(folderPath)].filter(Boolean).join(' › ')
}
