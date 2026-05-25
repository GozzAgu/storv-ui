/**
 * Client-side duplicate serial check via the server API (fail-closed in the store on errors).
 */
import { ofetch } from 'ofetch'

export type DuplicateSerialCheckBody = {
 ownerUserId: string
 storeId: string
 folderId: string
 serialNo: string
 brand: string
 model: string
 userRole?: string
}

type SerialCheckFetcher = (
 url: string,
 opts?: { method?: string; headers?: Record<string, string>; body?: DuplicateSerialCheckBody }
) => Promise<{ success: boolean; duplicateExists: boolean }>

export async function duplicateSerialExistsViaApi(
 getToken: () => Promise<string>,
 body: DuplicateSerialCheckBody,
 fetcher: SerialCheckFetcher = ofetch
): Promise<boolean> {
 const token = await getToken()
 const response = await fetcher('/api/inventory/validate-serial', {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}` },
 body,
 })
 return !!response.duplicateExists
}
