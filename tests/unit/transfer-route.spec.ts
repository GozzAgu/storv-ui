import { describe, expect, it } from 'vitest'
import { folderPathNames, formatTransferEndpoint } from '~/utils/transfer-route'

const folders = [
  { id: 'cars', name: 'Cars' },
  { id: 'sedan', name: 'Sedan', parentId: 'cars' },
  { id: 'loop', name: 'Loop', parentId: 'loop' },
]

describe('transfer route', () => {
  it('lists the category then subcategory', () => {
    expect(folderPathNames(folders, 'sedan')).toEqual(['Cars', 'Sedan'])
    expect(folderPathNames(folders, 'cars')).toEqual(['Cars'])
  })

  it('returns nothing for an unknown category and survives a parent loop', () => {
    expect(folderPathNames(folders, 'missing')).toEqual([])
    expect(folderPathNames(folders, 'loop')).toEqual(['Loop'])
  })

  it('formats the branch with its categories, or the branch alone', () => {
    expect(formatTransferEndpoint('Port Harcourt', ['Cars', 'Sedan'])).toBe(
      'Port Harcourt › Cars › Sedan'
    )
    expect(formatTransferEndpoint('Lagos', undefined)).toBe('Lagos')
  })
})
