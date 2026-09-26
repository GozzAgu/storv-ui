import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

/** Build branch display name from city and optional area (e.g. Lagos + Lekki → "Lagos, Lekki"). */
export function formatBranchDisplayName(city: string, locality?: string): string {
  const trimmedCity = city.trim()
  const trimmedLocality = locality?.trim() ?? ''
  if (!trimmedCity) return ''
  if (!trimmedLocality) return trimmedCity
  return `${trimmedCity}, ${trimmedLocality}`
}

/** Split stored branch name into city and optional area suffix. */
export function parseBranchDisplayName(branchName: string): { city: string; locality: string } {
  const name = branchName.trim()
  if (!name) return { city: '', locality: '' }

  const city = getStoreBranchShortLabel(name)
  if (!city) return { city: name, locality: '' }

  if (city.toLowerCase() === name.toLowerCase()) {
    return { city, locality: '' }
  }

  let remainder = name.slice(city.length).trim()
  remainder = remainder.replace(/^[,|\u2013\u2014-]\s*/, '').trim()
  return { city, locality: remainder }
}

type StoreLabelFields = {
  id?: string
  name?: string | null
  address?: string | null
  description?: string | null
}

function shortLabelKey(name: string | null | undefined): string {
  return (getStoreBranchShortLabel(name) || name || '').trim().toLowerCase()
}

/**
 * Primary label in the store switcher list.
 * Uses the city short label when unique; if two stores share a city (e.g. two Port Harcourts),
 * shows the full branch name so locality is visible ("Port Harcourt, GRA").
 */
export function getStoreSwitcherPrimaryLabel(
  store: StoreLabelFields,
  stores: StoreLabelFields[]
): string {
  const full = store.name?.trim() || 'Unnamed store'
  const short = getStoreBranchShortLabel(full) || full
  const key = shortLabelKey(full)
  const duplicateCount = stores.filter((entry) => shortLabelKey(entry.name) === key).length
  if (duplicateCount > 1 && full.toLowerCase() !== key) {
    return full
  }
  return short
}

/**
 * Secondary line under the store name: locality, then address, then description.
 * When two stores still look identical, falls back to a short id tip.
 */
export function getStoreSwitcherSecondaryLabel(
  store: StoreLabelFields,
  stores: StoreLabelFields[] = []
): string {
  const { locality } = parseBranchDisplayName(store.name || '')
  if (locality) return locality

  const address = store.address?.trim()
  if (address) return address

  const description = store.description?.trim()
  if (description) return description

  const key = shortLabelKey(store.name)
  const duplicates = stores.filter((entry) => shortLabelKey(entry.name) === key)
  if (duplicates.length > 1 && store.id) {
    return `Branch · ${store.id.slice(-4)}`
  }

  return ''
}
