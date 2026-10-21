import { clearIndexedDbPersistence, terminate, type Firestore } from 'firebase/firestore'
import { clearOfflineQueueForUser } from '~/composables/useOfflineMode'
import { clearSalesOutbox } from '~/utils/sales-outbox'

/**
 * Wipes what this user left on the device when they sign out on purpose, so the next person on
 * a shared till can't read it: refused and (once confirmed) waiting offline sales, queued
 * changes, and Firestore's on-device cache of customers, receipts and stock.
 *
 * Clearing the cache shuts down this tab's Firestore, so the caller must reload the page
 * afterwards. With other tabs open the cache can't be cleared; that's reported, not thrown.
 */
export async function clearDeviceDataForSignOut(
  uid: string,
  opts: { firestore?: Firestore | null; discardQueuedSales?: boolean } = {}
): Promise<{ cacheCleared: boolean }> {
  clearSalesOutbox(uid, { includeQueued: opts.discardQueuedSales })
  clearOfflineQueueForUser(uid)
  if (!opts.firestore) return { cacheCleared: false }
  try {
    await terminate(opts.firestore)
    await clearIndexedDbPersistence(opts.firestore)
    return { cacheCleared: true }
  } catch (err) {
    console.warn('[sign-out] on-device cache not cleared (another tab may be open)', err)
    return { cacheCleared: false }
  }
}
