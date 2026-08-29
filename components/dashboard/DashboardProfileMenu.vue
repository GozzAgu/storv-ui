<template>
  <div ref="menuRootRef" class="relative shrink-0">
    <button
      type="button"
      :class="[triggerClass, compact ? triggerCompactClass : triggerDefaultClass]"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="open = !open"
    >
      <div :class="[avatarClass, 'h-8 w-8 text-[11px]']">
        <span class="relative">{{ userInitials }}</span>
      </div>
      <div v-if="!compact" class="hidden min-w-0 flex-1 text-left md:block">
        <p class="dash-profile-trigger__name">{{ userName }}</p>
        <p class="dash-profile-trigger__email">{{ userEmail }}</p>
      </div>
      <ChevronDownIcon
        v-if="!compact"
        class="hidden h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 md:block"
        :class="open ? 'rotate-180' : ''"
        stroke-width="2"
      />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-[opacity,transform] duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-0.5 scale-[0.99]"
      >
        <div
          v-if="open"
          ref="menuPanelRef"
          :class="panelClass"
          :style="panelStyle"
          role="menu"
          aria-label="Account menu"
          @click.stop
        >
          <div :class="panelHeaderClass">
            <div class="flex min-w-0 items-center gap-2.5">
              <div :class="[avatarClass, 'h-9 w-9 text-[10px]']">
                <span class="relative">{{ userInitials }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p :class="panelHeaderNameClass">{{ userName }}</p>
                <p :class="panelHeaderEmailClass">{{ userEmail }}</p>
                <div class="mt-1.5 flex flex-wrap items-center gap-1">
                  <span v-if="storeLabel" :class="metaBadgeClass">
                    {{ storeLabel }}
                  </span>
                  <span v-if="planLabel" :class="metaBadgeClass">{{ planLabel }}</span>
                  <span :class="roleBadgeClass">{{ roleLabel }}</span>
                  <ExperienceModeBadge variant="profile" />
                </div>
              </div>
            </div>
          </div>

          <p :class="menuSectionLabelClass">Account</p>
          <nav :class="menuSectionClass" aria-label="Account">
            <template v-for="item in accountLinks" :key="item.to">
              <NuxtLink
                :to="item.to"
                role="menuitem"
                :class="[
                  menuRowClass,
                  isActive(item.match) ? menuRowActiveClass : menuRowInactiveClass,
                ]"
                @click="open = false"
              >
                <span
                  :class="[menuIconWrapClass, isActive(item.match) ? menuIconWrapActiveClass : '']"
                >
                  <component :is="item.icon" :class="menuIconClass" stroke-width="1.75" />
                </span>
                <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                <span v-if="item.badge && item.badge > 0" :class="menuBadgeClass">
                  {{ item.badge > 9 ? '9+' : item.badge }}
                </span>
              </NuxtLink>
            </template>
          </nav>

          <p :class="menuSectionLabelClass">Support</p>
          <nav :class="menuSectionClass" aria-label="Support">
            <template v-for="item in supportLinks" :key="item.to">
              <NuxtLink
                :to="item.to"
                role="menuitem"
                :class="[
                  menuRowClass,
                  isActive(item.match) ? menuRowActiveClass : menuRowInactiveClass,
                ]"
                @click="open = false"
              >
                <span
                  :class="[menuIconWrapClass, isActive(item.match) ? menuIconWrapActiveClass : '']"
                >
                  <component :is="item.icon" :class="menuIconClass" stroke-width="1.75" />
                </span>
                <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
              </NuxtLink>
            </template>
          </nav>

          <div :class="menuFooterClass">
            <button
              type="button"
              role="menuitem"
              class="group"
              :class="signOutRowClass"
              @click="onSignOut"
            >
              <span :class="signOutIconWrapClass">
                <ArrowRightOnRectangleIcon :class="menuIconClass" stroke-width="1.75" />
              </span>
              <span class="min-w-0 flex-1">Sign out</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Component } from 'vue'
import {
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
} from '~/utils/app-icons'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useStaffStore } from '~/stores/staff'
import { useNotificationsStore } from '~/stores/notifications'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { getPlanDisplayName } from '~/types/subscription'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

defineProps<{
  userName: string
  userEmail: string
  userInitials: string
  compact?: boolean
}>()

const emit = defineEmits<{
  signOut: []
}>()

const {
  triggerClass,
  triggerCompactClass,
  triggerDefaultClass,
  avatarClass,
  panelClass,
  panelHeaderClass,
  panelHeaderNameClass,
  panelHeaderEmailClass,
  metaBadgeClass,
  roleBadgeClass,
  menuSectionLabelClass,
  menuSectionClass,
  menuRowClass,
  menuRowInactiveClass,
  menuRowActiveClass,
  menuIconWrapClass,
  menuIconWrapActiveClass,
  menuIconClass,
  menuBadgeClass,
  menuFooterClass,
  signOutRowClass,
  signOutIconWrapClass,
} = useDashboardProfileMenuChrome()

const route = useRoute()
const storesStore = useStoresStore()
const userStore = useUserStore()
const staffStore = useStaffStore()
const notificationsStore = useNotificationsStore()
const { canUse, plan } = useSubscriptionFeatures()

const open = ref(false)
const menuRootRef = ref<HTMLElement | null>(null)
const menuPanelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

type MenuLink = {
  to: string
  label: string
  icon: Component
  match: string
  badge?: number
}

const storeLabel = computed(() => {
  const name = getStoreBranchShortLabel(storesStore.currentStore?.name)
  if (!name) return ''
  return name.length > 22 ? `${name.slice(0, 21)}…` : name
})

const roleLabel = computed(() => {
  if (userStore.isSuperAdmin) return 'Admin'
  if (userStore.userData?.role === 'staff') {
    return staffStore.getCurrentStaffMember?.role === 'manager' ? 'Manager' : 'Staff'
  }
  const role = userStore.userData?.role
  if (role) return role.charAt(0).toUpperCase() + role.slice(1)
  return 'User'
})

const planLabel = computed(() => {
  if (!userStore.isSuperAdmin) return ''
  return getPlanDisplayName(plan.value)
})

const { dashPath } = useDashboardPaths()

const accountLinks = computed<MenuLink[]>(() => [
  { to: dashPath('/profile'), label: 'Profile', icon: UserCircleIcon, match: dashPath('/profile') },
  {
    to: dashPath('/settings'),
    label: 'Settings',
    icon: Cog6ToothIcon,
    match: dashPath('/settings'),
  },
  {
    to: dashPath('/notifications'),
    label: 'Notifications',
    icon: BellIcon,
    match: dashPath('/notifications'),
    badge: notificationsStore.unreadCount,
  },
])

const supportLinks = computed<MenuLink[]>(() => {
  const links: MenuLink[] = [
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

function isActive(match: string) {
  return route.path === match || route.path.startsWith(`${match}/`)
}

function positionPanel() {
  if (!import.meta.client || !open.value || !menuRootRef.value) return
  const trigger = menuRootRef.value
  const rect = trigger.getBoundingClientRect()
  const gap = 6
  const margin = 12
  const panelWidth = 14 * 16
  const widthPx = Math.min(panelWidth, window.innerWidth - margin * 2)
  let right = window.innerWidth - rect.right
  const leftEdge = window.innerWidth - right - widthPx
  if (leftEdge < margin) {
    right = Math.max(margin, window.innerWidth - widthPx - margin)
  }
  panelStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + gap)}px`,
    right: `${Math.round(right)}px`,
    left: 'auto',
    width: `${Math.round(widthPx)}px`,
    zIndex: '100',
  }
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value) return
  const target = event.target as Node
  const path = typeof event.composedPath === 'function' ? event.composedPath() : []
  const inside =
    menuRootRef.value?.contains(target) ||
    menuPanelRef.value?.contains(target) ||
    path.includes(menuRootRef.value as EventTarget) ||
    path.includes(menuPanelRef.value as EventTarget)
  if (!inside) open.value = false
}

function onScrollOrResize() {
  if (open.value) positionPanel()
}

function onSignOut() {
  open.value = false
  emit('signOut')
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  if (import.meta.client) {
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  if (import.meta.client) {
    window.removeEventListener('resize', onScrollOrResize)
    window.removeEventListener('scroll', onScrollOrResize, true)
  }
})

watch(
  () => route.path,
  () => {
    open.value = false
  }
)

watch(open, async (isOpen) => {
  if (!import.meta.client || !isOpen) return
  await nextTick()
  positionPanel()
  requestAnimationFrame(() => positionPanel())
})
</script>
