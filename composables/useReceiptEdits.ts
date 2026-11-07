import { ref, watch, type Ref } from 'vue'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { useFirestore } from '~/composables/useFirestore'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { getCurrentStoreId } from '~/composables/useCurrentStore'
import type { ReceiptEditEntry } from '~/utils/receipt-edit'

/**
 * Reads a sale's edit history (`receipts/{id}/edits`, newest first). Loaded only for edited
 * receipts, and again whenever the edit count changes.
 */
export function useReceiptEdits(
  receiptId: Ref<string | null | undefined>,
  editCount: Ref<number | undefined>
) {
  const edits = ref<ReceiptEditEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    const id = receiptId.value
    edits.value = []
    error.value = null
    if (!id || !editCount.value) return
    const db = useFirestore().getFirestoreInstance()
    const ownerId = await getQueryUserId()
    const storeId = await getCurrentStoreId()
    if (!db || !ownerId || !storeId) return
    loading.value = true
    try {
      const snap = await getDocs(
        query(
          collection(db, 'users', ownerId, 'stores', storeId, 'receipts', id, 'edits'),
          orderBy('editedAt', 'desc'),
          limit(50)
        )
      )
      if (receiptId.value !== id) return
      edits.value = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          changes: Array.isArray(data.changes) ? data.changes : [],
          reason: String(data.reason ?? ''),
          editedBy: String(data.editedBy ?? ''),
          editedByName: String(data.editedByName ?? 'Staff'),
          editNumber: Number(data.editNumber) || 0,
          editedAt: data.editedAt?.toDate ? data.editedAt.toDate() : null,
        }
      })
    } catch (err) {
      console.warn('[receipts] edit history failed', err)
      error.value = 'Couldn’t load the edit history.'
    } finally {
      loading.value = false
    }
  }

  watch([receiptId, editCount], () => void load(), { immediate: true })

  return { edits, loading, error, reload: load }
}
