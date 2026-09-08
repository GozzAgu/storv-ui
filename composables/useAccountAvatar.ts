import { computed } from 'vue'
import { optimizeCloudinaryLogo } from '~/utils/cloudinary'
import { useUserStore } from '~/stores/user'

/**
 * Personal profile photo for circular avatars (top nav, sidebar, Profile).
 * Company / receipt logos use `storeLogoUrl` separately (Settings → Company logo).
 */
export function useAccountAvatar() {
  const userStore = useUserStore()

  const avatarImageUrl = computed(() => {
    const raw = (userStore.userData?.photoURL || '').trim()
    if (!raw) return ''
    return optimizeCloudinaryLogo(raw, 192)
  })

  return { avatarImageUrl }
}
