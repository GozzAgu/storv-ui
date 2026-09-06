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

export const useStorefrontStore = defineStore('storefront', {
  state: () => ({
    config: EMPTY_STOREFRONT_CONFIG() as StorefrontConfig,
    loading: false,
    saving: false,
    loadedStoreId: '' as string,
    syncing: false,
    lastError: '' as string,
  }),

  getters: {
    isEnabled: (s) => Boolean(s.config.enabled && s.config.slug),
    publicPath: (s) => (s.config.slug ? `/store/${s.config.slug}` : ''),
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
          await publishStorefrontProfile(db, ownerUid, storeId, normalized, {
            previousSlug,
          })
        } else if (previousSlug) {
          await unpublishStorefrontSlug(db, previousSlug)
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
