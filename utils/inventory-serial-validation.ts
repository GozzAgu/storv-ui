export function resolveSerialProductLine(
  model?: string | null,
  name?: string | null
): string {
  const trimmedModel = String(model ?? '').trim()
  if (trimmedModel) return trimmedModel
  return String(name ?? '').trim()
}

export function serialProductCompositeKey(
  serialNo: string,
  brand?: string | null,
  model?: string | null,
  name?: string | null
): string {
  return `${String(serialNo).trim()}|${String(brand ?? '').trim()}|${resolveSerialProductLine(model, name)}`
}

/**
 * Client-side duplicate serial check via the server API (fail-closed in the store on errors).
 */
import { ofetch } from 'ofetch'
import { resolveApiPath } from '~/utils/api-url'

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
  const response = await fetcher(resolveApiPath('/api/inventory/validate-serial'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  })
  return !!response.duplicateExists
}
