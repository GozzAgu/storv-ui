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
