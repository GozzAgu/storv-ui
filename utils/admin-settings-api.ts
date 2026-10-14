import { useAuthStore } from '~/stores/auth'
import { resolveApiPath } from '~/utils/api-url'
import type { SharedSettingsSection } from '~/types/staff-permissions'

function apiErrorMessage(error: unknown, fallback: string): string {
  const e = error as {
    data?: { message?: unknown }
    response?: { _data?: { message?: unknown } }
    message?: unknown
  }
  const message = e?.data?.message ?? e?.response?._data?.message ?? e?.message
  return typeof message === 'string' && message ? message : fallback
}

async function postAsStoreAdmin(path: string, body: Record<string, unknown>, fallback: string) {
  const authStore = useAuthStore()
  if (!authStore.currentUser) throw new Error('You must be signed in')
  try {
    const token = await authStore.currentUser.getIdToken()
    const raw: unknown = await $fetch(resolveApiPath(path), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    })
    return raw
  } catch (error: unknown) {
    throw new Error(apiErrorMessage(error, fallback))
  }
}

/** Branch admin with the "store settings" extra: save one shared settings section. */
export async function saveSharedSettingsAsAdmin(
  target: { ownerUserId: string; storeId: string },
  section: SharedSettingsSection,
  values: Record<string, unknown>
): Promise<void> {
  await postAsStoreAdmin(
    '/api/workspace/store-settings',
    { ...target, section, values },
    'Could not save settings'
  )
}

/** Branch admin with the "branches" extra: save their own branch's details. */
export async function saveBranchDetailsAsAdmin(
  target: { ownerUserId: string; storeId: string },
  values: Record<string, unknown>
): Promise<Record<string, string>> {
  const raw = (await postAsStoreAdmin(
    '/api/workspace/branch-details',
    { ...target, values },
    'Could not save branch details'
  )) as { details: Record<string, string> }
  return raw.details
}
