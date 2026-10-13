import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { isDemoModeActive } from '~/utils/demo-mode'
import type { LoyaltySettings } from '~/utils/loyalty'

export interface LoyaltyMemberView {
  key: string
  name: string
  phone: string | null
  email: string | null
  points: number
  spend12m: number
  tier: { id: string; name: string; multiplier: number }
  next: { name: string; remaining: number } | null
}

/** The flag only shows the screens; the server gate decides (routes 404 when off). */
export function loyaltyUiFlag(): boolean {
  if (import.meta.server || isDemoModeActive()) return false
  return useRuntimeConfig().public.loyalty === true
}

/** Client for /api/loyalty/*. Points are only ever changed by the server. */
export function useLoyalty() {
  const { authFetch } = useAuthenticatedFetch()

  async function scope(): Promise<{ ownerUserId: string; storeId: string }> {
    const ownerUserId = await getQueryUserId()
    const storeId = await getCurrentStoreId()
    if (!ownerUserId || !storeId) throw new Error('No store selected')
    return { ownerUserId, storeId }
  }

  return {
    /**
     * Ask the server to recalculate a sale's points after it is created, paid or refunded.
     * Never throws: a sale must not fail because rewards did.
     */
    async syncSale(receiptId: string | null | undefined): Promise<void> {
      if (!receiptId || !loyaltyUiFlag()) return
      try {
        await authFetch('/api/loyalty/sync', {
          method: 'POST',
          body: { ...(await scope()), receiptId },
        })
      } catch {
        console.warn('[loyalty] points not updated for this sale yet')
      }
    },
    async getSettings() {
      return authFetch<{ settings: LoyaltySettings; canEdit: boolean }>('/api/loyalty/settings', {
        query: await scope(),
      })
    },
    async saveSettings(settings: LoyaltySettings) {
      return authFetch<{ settings: LoyaltySettings }>('/api/loyalty/settings', {
        method: 'POST',
        body: { ...(await scope()), settings },
      })
    },
    async topMembers(limit = 10) {
      const res = await authFetch<{ members: LoyaltyMemberView[] }>('/api/loyalty/members', {
        query: { ...(await scope()), limit },
      })
      return res.members
    },
    async findMember(contact: { phone?: string; email?: string }) {
      const res = await authFetch<{ member: LoyaltyMemberView | null }>('/api/loyalty/members', {
        query: { ...(await scope()), ...contact },
      })
      return res.member
    },
  }
}
