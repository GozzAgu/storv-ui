import { describe, it, expect, vi } from 'vitest'
import { duplicateSerialExistsViaApi } from '~/utils/inventory-serial-validation'

describe('duplicateSerialExistsViaApi', () => {
 it('returns duplicateExists from API response', async () => {
 const fetcher = vi.fn().mockResolvedValue({ success: true, duplicateExists: true })
 const getToken = vi.fn().mockResolvedValue('tok')
 const result = await duplicateSerialExistsViaApi(
 getToken,
 {
 ownerUserId: 'owner',
 storeId: 's1',
 folderId: 'f1',
 serialNo: 'SN1',
 brand: 'B',
 model: 'M',
 },
 fetcher
 )
 expect(result).toBe(true)
 expect(fetcher).toHaveBeenCalledWith(
 '/api/inventory/validate-serial',
 expect.objectContaining({
 headers: { Authorization: 'Bearer tok' },
 })
 )
 })
})
