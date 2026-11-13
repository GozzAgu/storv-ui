import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import type { TransferAction, TransferStatus } from '~/types/transfers'

export interface TransferActionResponse {
  status: TransferStatus
  moved: number
  skipped: string[]
}

/** Every change to a transfer after it is requested goes through the server. */
export function useTransfersApi() {
  const { authFetch } = useAuthenticatedFetch()

  async function run(
    transferId: string,
    action: TransferAction,
    body: { reason?: string; carrier?: string; trackingNumber?: string } = {}
  ): Promise<TransferActionResponse> {
    const ownerUserId = await getQueryUserId()
    if (!ownerUserId) throw new Error('No business selected')
    return authFetch<TransferActionResponse>(
      `/api/transfers/${encodeURIComponent(transferId)}/${action}`,
      { method: 'POST', body: { ownerUserId, ...body } }
    )
  }

  return {
    dispatch: (id: string) => run(id, 'dispatch'),
    receive: (id: string) => run(id, 'receive'),
    reject: (id: string, reason: string) => run(id, 'reject', { reason }),
    cancel: (id: string) => run(id, 'cancel'),
    track: (id: string, carrier: string, trackingNumber: string) =>
      run(id, 'track', { carrier, trackingNumber }),
  }
}
