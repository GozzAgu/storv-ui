import { computed } from 'vue'
import { optimizeCloudinaryLogo } from '~/utils/cloudinary'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'

/**
 * Account / store logo for circular avatars (top nav, sidebar, profile).
 * Uses the account-level logo when that field exists (including empty after
 * remove), otherwise the current branch logo.
 */
export function useAccountAvatar() {
  const userStore = useUserStore()
  const storesStore = useStoresStore()

  const avatarImageUrl = computed(() => {
    const accountLogo = userStore.userData?.storeLogoUrl
    const raw =
      typeof accountLogo === 'string'
        ? accountLogo.trim()
        : (storesStore.currentStore?.logoUrl || '').trim()
    if (!raw) return ''
    return optimizeCloudinaryLogo(raw, 192)
  })

  return { avatarImageUrl }
}
