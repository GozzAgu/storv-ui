import type { Ref } from 'vue'
import type { Receipt } from '~/stores/receipts'
import type { UserData } from '~/composables/useUser'
import { getQueryUserId } from '~/composables/useFirestorePaths'
import { resolveBusinessNameFromUserData } from '~/utils/receipt-business-name'

/**
 * Receipt paper header: account business name (`user.name`) + branch name.
 */
export function useReceiptPaperHeader(receipt: Ref<Receipt | null | undefined>) {
  const userStore = useUserStore()
  const storesStore = useStoresStore()
  const { getUserDocument } = useUser()

  const ownerUserData = shallowRef<UserData | null>(null)

  const branchName = computed(() => {
    const r = receipt.value
    if (!r) return ''
    const fromReceipt = r.storeBranchName?.trim()
    if (fromReceipt) return fromReceipt
    if (r.storeId) {
      const store = storesStore.getStoreById(r.storeId)
      const name = store?.name?.trim()
      if (name) return name
      if (storesStore.currentStore?.id === r.storeId) {
        return storesStore.currentStore?.name?.trim() || ''
      }
    }
    return storesStore.currentStore?.name?.trim() || ''
  })

  const businessName = computed(() => {
    const ud = ownerUserData.value || userStore.userData
    const resolved = resolveBusinessNameFromUserData(ud, { branchName: branchName.value })
    return resolved || 'Store'
  })

  const storePhone = computed(() => {
    const ud = ownerUserData.value || userStore.userData
    return ud?.storeDetails?.storePhone?.trim() || ''
  })

  const storeEmail = computed(() => {
    const ud = ownerUserData.value || userStore.userData
    return ud?.storeDetails?.storeEmail?.trim() || ''
  })

  const storeLogoUrl = computed(() => {
    const r = receipt.value
    if (r?.storeLogoUrl) return r.storeLogoUrl
    if (r?.storeId) {
      const store =
        storesStore.getStoreById(r.storeId) ||
        (storesStore.currentStore?.id === r.storeId ? storesStore.currentStore : null)
      if (store?.logoUrl) return store.logoUrl
    }
    const ud = ownerUserData.value || userStore.userData
    return ud?.storeLogoUrl || ''
  })

  async function loadOwnerUserData() {
    try {
      const ownerId = await getQueryUserId()
      if (!ownerId) {
        ownerUserData.value = userStore.userData
        return
      }
      if (ownerId === userStore.userData?.uid && userStore.userData) {
        ownerUserData.value = userStore.userData
        return
      }
      const doc = await getUserDocument(ownerId)
      ownerUserData.value = doc
    } catch (e) {
      console.warn('[useReceiptPaperHeader] Could not load owner user:', e)
      ownerUserData.value = userStore.userData
    }
  }

  watch(
    () => [receipt.value?.id, receipt.value?.storeId, userStore.userData?.name] as const,
    () => {
      void loadOwnerUserData()
    },
    { immediate: true },
  )

  return {
    businessName,
    branchName,
    storePhone,
    storeEmail,
    storeLogoUrl,
    refreshOwnerUserData: loadOwnerUserData,
  }
}
