import { describe, expect, it } from 'vitest'
import {
  buildStoreExportZipFilename,
  sanitizeFolderPath,
  uniqueFolderPath,
} from '~/utils/store-data-export'

describe('sanitizeFolderPath', () => {
  it('removes invalid path characters', () => {
    expect(sanitizeFolderPath('Phones / Tablets')).toBe('Phones _ Tablets')
    expect(sanitizeFolderPath('A:B*C?')).toBe('A_B_C_')
  })

  it('falls back when empty', () => {
    expect(sanitizeFolderPath('   ')).toBe('Category')
  })
})

describe('uniqueFolderPath', () => {
  it('deduplicates folder names', () => {
    const used = new Set<string>()
    expect(uniqueFolderPath('Phones', used)).toBe('Phones')
    expect(uniqueFolderPath('Phones', used)).toBe('Phones_2')
    expect(uniqueFolderPath('Phones', used)).toBe('Phones_3')
  })
})

describe('buildStoreExportZipFilename', () => {
  it('uses zip extension for inventory exports', () => {
    expect(buildStoreExportZipFilename('inventory', 'Port Harcourt')).toMatch(
      /^port_harcourt_inventory_\d{4}-\d{2}-\d{2}\.zip$/
    )
  })
})
