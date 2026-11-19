import type { ActivityChange, ActivityDetails, ActivityFact } from '~/utils/activity-details'
import { humanizeFieldKey } from '~/utils/activity-details'

/**
 * Activity details for inventory items: what an edit changed (before → after, with the
 * category's own field labels), and a snapshot of an item when it is added or deleted.
 */

type Field = { name: string; label?: string; type?: string }
type FolderLike = { name?: string; template?: { fields?: Field[] } } | null | undefined

/** Bookkeeping fields that change on every save and say nothing to a person reading the log. */
const SYSTEM_KEYS = new Set([
  'id',
  'updatedAt',
  'createdAt',
  'createdBy',
  'folderId',
  'storeId',
  'pendingSaleAt',
  'transferredAt',
  'soldReceiptId',
])

function isMoneyField(key: string, field?: Field): boolean {
  return field?.type === 'currency' || /price|cost|amount/i.test(key)
}

function comparable(v: unknown): string {
  if (v === undefined || v === null || v === '') return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object' && typeof (v as { toDate?: unknown }).toDate === 'function') {
    try {
      return (v as { toDate: () => Date }).toDate().toISOString().slice(0, 10)
    } catch {
      return ''
    }
  }
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v).trim()
}

function display(v: unknown, money: boolean): string | number | null {
  const c = comparable(v)
  if (!c) return null
  if (money) {
    const n = Number(String(v).replace(/[^0-9.-]/g, ''))
    if (Number.isFinite(n)) return n
  }
  return c.slice(0, 200)
}

function fieldMap(folder: FolderLike): Map<string, Field> {
  return new Map((folder?.template?.fields ?? []).map((f) => [f.name, f]))
}

/** Before → after for every field the edit really changed. */
export function itemChanges(
  before: Record<string, unknown> | null | undefined,
  updates: Record<string, unknown>,
  folder?: FolderLike
): ActivityChange[] {
  const fields = fieldMap(folder)
  const changes: ActivityChange[] = []
  for (const [key, next] of Object.entries(updates)) {
    if (SYSTEM_KEYS.has(key)) continue
    const prev = before?.[key]
    if (comparable(prev) === comparable(next)) continue
    const field = fields.get(key)
    const money = isMoneyField(key, field)
    changes.push({
      label: field?.label || humanizeFieldKey(key),
      from: display(prev, money),
      to: display(next, money),
      ...(money && { money: true }),
    })
  }
  return changes
}

/** The item's own fields (in template order) as facts, for "added" and "deleted" entries. */
export function itemSnapshotFacts(
  item: Record<string, unknown>,
  folder?: FolderLike
): ActivityFact[] {
  const facts: ActivityFact[] = []
  if (folder?.name) facts.push({ label: 'Category', value: folder.name })
  const seen = new Set<string>()
  const push = (key: string, field?: Field) => {
    if (seen.has(key) || SYSTEM_KEYS.has(key)) return
    seen.add(key)
    const money = isMoneyField(key, field)
    const v = display(item[key], money)
    if (v === null) return
    facts.push({
      label: field?.label || humanizeFieldKey(key),
      value: v,
      ...(money && { money: true }),
    })
  }
  for (const field of folder?.template?.fields ?? []) push(field.name, field)
  for (const key of ['discountedPrice', 'unitCost', 'swapIn', 'buyback']) {
    if (key in item) push(key)
  }
  return facts.slice(0, 20)
}

/** Details for an item edit: what changed, plus where the item lives. */
export function itemEditDetails(
  before: Record<string, unknown> | null | undefined,
  updates: Record<string, unknown>,
  folder?: FolderLike
): ActivityDetails {
  const serial = comparable(before?.serialNo ?? before?.serialNumber ?? updates.serialNo)
  return {
    facts: [
      ...(folder?.name ? [{ label: 'Category', value: folder.name }] : []),
      ...(serial ? [{ label: 'Serial', value: serial }] : []),
    ],
    changes: itemChanges(before, updates, folder),
  }
}
