import { computed, type Component } from 'vue'
import {
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
} from '~/utils/app-icons'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useNotificationsStore } from '~/stores/notifications'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { getPlanDisplayName } from '~/types/subscription'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

export type AccountMenuLink = {
  to: string
  label: string
  icon: Component
  match: string
  badge?: number
}

/** Account identity labels and links shown in every account menu. */
export function useAccountMenu() {
  const route = useRoute()
  const storesStore = useStoresStore()
  const userStore = useUserStore()
  const notificationsStore = useNotificationsStore()
  const { canUse, plan } = useSubscriptionFeatures()
  const { hasAnyManageAccess } = usePermissions()
  const { dashPath } = useDashboardPaths()

  const storeLabel = computed(() => {
    const name = getStoreBranchShortLabel(storesStore.currentStore?.name)
    if (!name) return ''
    return name.length > 22 ? `${name.slice(0, 21)}…` : name
  })

  const roleLabel = computed(() => {
    if (userStore.isSuperAdmin) return 'Admin'
    if (userStore.userData?.role === 'staff') {
      return hasAnyManageAccess.value ? 'Manager' : 'Staff'
    }
    const role = userStore.userData?.role
    if (role) return role.charAt(0).toUpperCase() + role.slice(1)
    return 'User'
  })

  const planLabel = computed(() => {
    if (!userStore.isSuperAdmin) return ''
    return getPlanDisplayName(plan.value)
  })

  const accountLinks = computed<AccountMenuLink[]>(() => [
    { to: dashPath('/profile'), label: 'Profile', icon: UserCircleIcon, match: dashPath('/profile') },
    { to: dashPath('/settings'), label: 'Settings', icon: Cog6ToothIcon, match: dashPath('/settings') },
    {
      to: dashPath('/notifications'),
      label: 'Notifications',
      icon: BellIcon,
      match: dashPath('/notifications'),
      badge: notificationsStore.unreadCount,
    },
  ])

  const supportLinks = computed<AccountMenuLink[]>(() => {
    const links: AccountMenuLink[] = [
      { to: dashPath('/help'), label: 'Help center', icon: BookOpenIcon, match: dashPath('/help') },
    ]
    if (canUse('activity_logs')) {
      links.push({
        to: dashPath('/activity'),
        label: 'Activity logs',
        icon: ClipboardDocumentListIcon,
        match: dashPath('/activity'),
      })
    }
    return links
  })

  function isLinkActive(match: string) {
    return route.path === match || route.path.startsWith(`${match}/`)
  }

  return { storeLabel, roleLabel, planLabel, accountLinks, supportLinks, isLinkActive }
}
