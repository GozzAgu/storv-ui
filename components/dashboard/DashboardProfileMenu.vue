<template>
  <div class="relative shrink-0" ref="menuRootRef">
    <button
      type="button"
      :class="[
        triggerClass,
        compact ? triggerCompactClass : triggerDefaultClass,
      ]"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="open = !open"
    >
      <div :class="[avatarClass, 'h-8 w-8 text-[11px]']">
        <span class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/10 to-transparent" aria-hidden="true" />
        <span class="relative">{{ userInitials }}</span>
      </div>
      <div v-if="!compact" class="hidden min-w-0 flex-1 text-left md:block">
        <p class="truncate text-xs font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-50">
          {{ userName }}
        </p>
        <p class="truncate text-[10px] leading-snug text-gray-500 dark:text-gray-400">
          {{ userEmail }}
        </p>
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
        enter-active-class="transition-[opacity,transform] duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-[opacity,transform] duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
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
              <div :class="[avatarClass, 'h-9 w-9 text-xs']">
                <span class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/10 to-transparent" aria-hidden="true" />
                <span class="relative">{{ userInitials }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50">
                  {{ userName }}
                </p>
                <p class="mt-0.5 truncate text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  {{ userEmail }}
                </p>
              </div>
            </div>
          </div>

          <nav class="py-1" aria-label="Account links">
            <NuxtLink
              to="/dashboard/profile"
              role="menuitem"
              :class="[
                menuRowClass,
                route.path.startsWith('/dashboard/profile') ? menuRowActiveClass : menuRowInactiveClass,
              ]"
              @click="open = false"
            >
              <UserCircleIcon
                :class="[
                  menuIconClass,
                  route.path.startsWith('/dashboard/profile') ? menuIconActiveClass : '',
                ]"
                stroke-width="1.75"
              />
              Profile
            </NuxtLink>
            <NuxtLink
              to="/dashboard/settings"
              role="menuitem"
              :class="[
                menuRowClass,
                route.path.startsWith('/dashboard/settings') ? menuRowActiveClass : menuRowInactiveClass,
              ]"
              @click="open = false"
            >
              <Cog6ToothIcon
                :class="[
                  menuIconClass,
                  route.path.startsWith('/dashboard/settings') ? menuIconActiveClass : '',
                ]"
                stroke-width="1.75"
              />
              Settings
            </NuxtLink>
          </nav>

          <div class="border-t border-gray-100/90 py-1 dark:border-gray-800/80">
            <button type="button" role="menuitem" :class="signOutRowClass" @click="onSignOut">
              <ArrowRightOnRectangleIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
              Sign out
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline'

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
  menuRowClass,
  menuRowInactiveClass,
  menuRowActiveClass,
  menuIconClass,
  menuIconActiveClass,
  signOutRowClass,
} = useDashboardProfileMenuChrome()

const route = useRoute()
const open = ref(false)
const menuRootRef = ref<HTMLElement | null>(null)
const menuPanelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

function positionPanel() {
  if (!import.meta.client || !open.value || !menuRootRef.value) return
  const trigger = menuRootRef.value
  const rect = trigger.getBoundingClientRect()
  const gap = 6
  const margin = 12
  const panelWidth = 15 * 16
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
