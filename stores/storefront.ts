import { defineStore } from 'pinia'
import type { Firestore } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { useAuthStore } from '~/stores/auth'
import { useInventoryStore, type InventoryFolder, type InventoryItem } from '~/stores/inventory'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import { CLOUD_UNAVAILABLE_MESSAGE } from '~/utils/cloud-user-messages'
import {
  fetchStorefrontConfig,
  publishStorefrontProfile,
  saveStorefrontConfig,
  syncStorefrontItemFromInventory,
  unpublishStorefrontSlug,
  upsertStorefrontListing,
  deleteStorefrontListing,
} from '~/utils/storefront-sync-client'
import { buildStorefrontListing } from '~/utils/storefront-projection'
import { isValidStorefrontSlug } from '~/utils/storefront-slug'
import { EMPTY_STOREFRONT_CONFIG, type StorefrontConfig } from '~/types/storefront'
import { suggestDefaultPublicFieldIds } from '~/utils/storefront-fields'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'

export type StorefrontAnalyticsSummary = {
  storeViews: number
  productViews: number
  topListings: { id: string; views: number }[]
}

export type StorefrontInquiryCounts = {
  pending: number
  confirmed: number
  rejected: number
  cancelled: number
  completed: number
  all: number
}

export type StorefrontAnalyticsDay = {
  date: string
  storeViews: number
  productViews: number
}

const EMPTY_INQUIRY_COUNTS = (): StorefrontInquiryCounts => ({
  pending: 0,
  confirmed: 0,
  rejected: 0,
  cancelled: 0,
  completed: 0,
  all: 0,
})

function isPermissionDeniedMessage(err: unknown): boolean {
  const code = (err as { code?: string })?.code || ''
  const message = String((err as { message?: string })?.message || '')
  return (
    code === 'permission-denied' ||
    message.toLowerCase().includes('insufficient permissions') ||
    message.toLowerCase().includes('permission_denied')
  )
}

export const useStorefrontStore = defineStore('storefront', {
  state: () => ({
    config: EMPTY_STOREFRONT_CONFIG() as StorefrontConfig,
    loading: false,
    saving: false,
    loadedStoreId: '' as string,
    syncing: false,
    lastError: '' as string,
    analyticsLoading: false,
    analyticsLoadedStoreId: '' as string,
    analyticsFetchedAt: 0,
    analyticsError: '' as string,
    analyticsSummary: {
      storeViews: 0,
      productViews: 0,
      topListings: [],
    } as StorefrontAnalyticsSummary,
    inquiryCounts: EMPTY_INQUIRY_COUNTS() as StorefrontInquiryCounts,
    analyticsLast7Days: [] as StorefrontAnalyticsDay[],
  }),

  getters: {
    isEnabled: (s) => Boolean(s.config.enabled && s.config.slug),
    publicPath: (s) => (s.config.slug ? `/store/${s.config.slug}` : ''),
    viewsLast7Days: (s) =>
      s.analyticsLast7Days.reduce(
        (sum, d) => sum + (d.storeViews || 0) + (d.productViews || 0),
        0
      ),
    pendingInquiryCount: (s) => s.inquiryCounts.pending || 0,
  },

  actions: {
    async ensureContext(): Promise<{
      db: Firestore
      ownerUid: string
      storeId: string
    }> {
      const db = useFirestore().getFirestoreInstance()
      if (!db) throw new Error(CLOUD_UNAVAILABLE_MESSAGE)
      const authStore = useAuthStore()
      if (!authStore.currentUser) throw new Error('Sign in required')
      const ownerUid = (await getQueryUserId()) ?? authStore.currentUser.uid
      const storeId = (await getCurrentStoreId()) || ''
      if (!storeId) throw new Error('Select a branch first')
      return { db, ownerUid, storeId }
    },

    async loadConfig(force = false) {
      const { db, ownerUid, storeId } = await this.ensureContext()
      if (!force && this.loadedStoreId === storeId) {
        return this.config
      }
      this.loading = true
      this.lastError = ''
      try {
        this.config = await fetchStorefrontConfig(db, ownerUid, storeId)
        this.loadedStoreId = storeId
        return this.config
      } catch (e: any) {
        this.lastError = e?.message || 'Failed to load storefront settings'
        throw e
      } finally {
        this.loading = false
      }
    },

    async saveConfig(next: StorefrontConfig) {
      const { db, ownerUid, storeId } = await this.ensureContext()
      this.saving = true
      this.lastError = ''
      try {
        const previousSlug = this.config.slug
        const normalized: StorefrontConfig = {
          ...next,
          slug: String(next.slug || '')
            .trim()
            .toLowerCase(),
        }
        if (normalized.enabled && !isValidStorefrontSlug(normalized.slug)) {
          throw new Error('Enter a valid URL slug (2-48 chars, lowercase, hyphens ok).')
        }

        await saveStorefrontConfig(db, ownerUid, storeId, normalized)

        if (normalized.enabled && normalized.slug) {
          try {
            await publishStorefrontProfile(db, ownerUid, storeId, normalized, {
              previousSlug,
            })
          } catch (e: any) {
            if (isPermissionDeniedMessage(e)) {
              throw new Error(
                'Saved settings, but could not publish the public page. Deploy the latest Firestore rules, then Save again.'
              )
            }
            throw e
          }
        } else if (previousSlug) {
          await unpublishStorefrontSlug(db, previousSlug).catch(() => undefined)
        }

        this.config = normalized
        this.loadedStoreId = storeId
      } catch (e: any) {
        this.lastError = e?.message || 'Failed to save storefront settings'
        throw e
      } finally {
        this.saving = false
      }
    },

    enableFolderDefaults(folder: InventoryFolder) {
      const fields = folder.template?.fields ?? []
      const suggested = suggestDefaultPublicFieldIds(fields)
      this.config.folderPublish = {
        ...this.config.folderPublish,
        [folder.id]: {
          enabled: true,
          publicFieldIds:
            this.config.folderPublish[folder.id]?.publicFieldIds?.length
              ? this.config.folderPublish[folder.id]!.publicFieldIds
              : suggested,
        },
      }
    },

    async republishAllListedItems() {
      const { db, ownerUid, storeId } = await this.ensureContext()
      const config = await fetchStorefrontConfig(db, ownerUid, storeId)
      if (!config.enabled || !config.slug) {
        throw new Error('Turn the storefront on and set a slug before syncing.')
      }
      await publishStorefrontProfile(db, ownerUid, storeId, config)

      const inventory = useInventoryStore()
      if (!inventory.folders.length) {
        await inventory.fetchFolders()
      }
      const folders = inventory.folders
      this.syncing = true
      try {
        for (const folder of folders) {
          if (folder.usesSubcategories) continue
          const folderPub =
            config.folderPublish[folder.id]?.enabled ||
            (folder.parentId
              ? config.folderPublish[String(folder.parentId)]?.enabled
              : false)
          if (!folderPub) continue

          const items = await inventory.fetchItemsAllChunked(folder.id)
          for (const item of items) {
            const listing = buildStorefrontListing({
              item,
              folder,
              folders,
              config,
              ownerUid,
            })
            if (!listing || !listing.isListed) {
              await deleteStorefrontListing(db, config.slug, item.id)
              continue
            }
            await upsertStorefrontListing(db, config.slug, listing)
          }
        }
        this.config = config
      } finally {
        this.syncing = false
      }
    },

    queueItemSync(item: InventoryItem | null, itemId: string, folderId: string) {
      void this.syncItem(item, itemId, folderId).catch((err) => {
        console.warn('[storefront] item sync failed (non-critical):', err)
      })
    },

    async syncItem(item: InventoryItem | null, itemId: string, folderId: string) {
      try {
        const { db, ownerUid, storeId } = await this.ensureContext()
        const inventory = useInventoryStore()
        const folder = inventory.getFolderById(folderId) || null
        await syncStorefrontItemFromInventory({
          db,
          ownerUid,
          storeId,
          item,
          itemId,
          folder,
          folders: inventory.folders,
        })
      } catch {
        /* ignore — storefront may be off */
      }
    },

    async fetchAnalytics(options?: { force?: boolean }) {
      const { ownerUid, storeId } = await this.ensureContext()
      const fresh =
        !options?.force &&
        this.analyticsLoadedStoreId === storeId &&
        Date.now() - this.analyticsFetchedAt < 60_000
      if (fresh) return

      this.analyticsLoading = true
      this.analyticsError = ''
      try {
        const { authFetch } = useAuthenticatedFetch()
        const res = await authFetch<{
          summary: StorefrontAnalyticsSummary
          inquiries?: StorefrontInquiryCounts
          last7Days: StorefrontAnalyticsDay[]
        }>(
          `/api/storefront/analytics?ownerUserId=${encodeURIComponent(ownerUid)}&storeId=${encodeURIComponent(storeId)}`
        )
        this.analyticsSummary = {
          storeViews: Number(res.summary?.storeViews) || 0,
          productViews: Number(res.summary?.productViews) || 0,
          topListings: Array.isArray(res.summary?.topListings) ? res.summary.topListings : [],
        }
        this.inquiryCounts = {
          ...EMPTY_INQUIRY_COUNTS(),
          ...(res.inquiries || {}),
        }
        this.analyticsLast7Days = Array.isArray(res.last7Days) ? res.last7Days : []
        this.analyticsLoadedStoreId = storeId
        this.analyticsFetchedAt = Date.now()
      } catch (e: any) {
        this.analyticsError = e?.data?.message || e?.message || 'Views unavailable yet'
        if (options?.force) {
          this.analyticsSummary = { storeViews: 0, productViews: 0, topListings: [] }
          this.inquiryCounts = EMPTY_INQUIRY_COUNTS()
          this.analyticsLast7Days = []
        }
      } finally {
        this.analyticsLoading = false
      }
    },
  },
})

/** Authenticated slug check via Admin API (avoids leaking unpublished profiles). */
export async function isStorefrontSlugTaken(
  slug: string,
  ownerUid: string
): Promise<boolean> {
  const res = await $fetch<{ available: boolean }>('/api/storefront/slug-available', {
    query: { slug, ownerUid },
  })
  return !res.available
}
