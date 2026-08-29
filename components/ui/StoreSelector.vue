<template>
  <div class="relative min-w-0 shrink" ref="dropdownRef">
    <button
      type="button"
      :class="triggerClass"
      :aria-expanded="dropdownOpen"
      :aria-label="
        switchingStore
          ? 'Switching store...'
          : currentStore?.name
          ? `${getStoreBranchShortLabel(currentStore.name)} (${currentStore.name})`
          : 'Select store'
      "
      @click.stop="toggleDropdown"
    >
      <span
        v-if="!switchingStore"
        :class="[
          triggerIconClass,
          props.variant === 'command-pill' ? 'native-command-header__branch-icon' : '',
          !currentStore && props.variant !== 'command-pill' ? triggerIconEmptyClass : '',
        ]"
        :style="currentStore && props.variant !== 'command-pill' ? iconSurfaceStyleFor(currentStore) : undefined"
        aria-hidden="true"
      >
        <BuildingStorefrontIcon :size="14" stroke-width="1.6" />
      </span>
      <span v-else :class="triggerSpinnerClass" aria-hidden="true">
        <svg class="animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </span>

      <span :class="triggerNameClassResolved">
        <span
          class="truncate"
          :data-dashboard-tooltip="
            currentStore
              ? storeBranchNavTooltip(currentStore.name, branchCodeLabel(currentStore.name))
              : undefined
          "
        >
          {{
            switchingStore
              ? 'Switching…'
              : currentStore
              ? props.variant === 'command-pill'
                ? getStoreBranchShortLabel(currentStore.name) || branchCodeLabel(currentStore.name)
                : branchCodeLabel(currentStore.name)
              : 'No store'
          }}
        </span>
        <span
          v-if="!switchingStore && currentStore && props.variant !== 'command-pill'"
          class="status-dot status-dot--active shrink-0"
          aria-hidden="true"
        />
      </span>

      <svg
        v-if="!switchingStore"
        :class="[triggerChevronClass, dropdownOpen ? 'dash-store-trigger__chevron--open' : '']"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        enter-from-class="translate-y-1 scale-[0.98] opacity-0"
        enter-to-class="translate-y-0 scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 scale-100 opacity-100"
        leave-to-class="translate-y-1 scale-[0.98] opacity-0"
      >
        <div
          v-if="dropdownOpen"
          ref="panelRef"
          :class="panelClass"
          :style="panelStyle"
          @click.stop
        >
          <div :class="panelSurfaceClass">
          <div :class="panelHeaderClass">
            <p :class="panelSectionLabelClass">
              {{ isStaff ? 'Your store' : 'Stores' }}
            </p>
          </div>

          <div
            :class="[
              panelScrollClass,
              !loading && stores.length > 3 ? 'dash-store-panel__scroll--tall' : '',
            ]"
          >
            <div v-if="loading" :class="loadingClass">
              <svg class="animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading…
            </div>

            <div v-else-if="stores.length === 0" :class="emptyClass">
              No stores available
            </div>

            <div v-else class="space-y-0.5 pb-0.5">
              <button
                v-for="store in stores"
                :key="store.id"
                type="button"
                :class="[
                  rowClass,
                  currentStore?.id === store.id ? rowActiveClass : rowInactiveClass,
                ]"
                @click="switchStore(store.id)"
              >
                <span
                  :class="rowIconClass"
                  :style="iconSurfaceStyleFor(store)"
                  aria-hidden="true"
                >
                  <BuildingStorefrontIcon :size="14" stroke-width="1.6" />
                </span>
                <div class="min-w-0 flex-1">
                  <p :class="rowNameClass">
                    {{ branchShortLabel(store.name) || 'Unnamed store' }}
                  </p>
                  <div
                    v-if="currentStore?.id === store.id || store.isActive === false"
                    class="mt-0.5"
                  >
                    <span v-if="currentStore?.id === store.id" :class="statusActiveClass">
                      <span class="status-dot status-dot--active" />
                      Active
                    </span>
                    <span v-else :class="statusInactiveClass">
                      <span class="status-dot status-dot--inactive" />
                      Inactive
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div v-if="!isStaff" :class="panelFooterClass">
            <NuxtLink
              to="/dashboard/settings"
              :class="footerLinkClass"
              @click="dropdownOpen = false"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage stores
            </NuxtLink>
          </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  BuildingStorefrontIcon,
} from '~/utils/app-icons'
import { iconSurfaceStyleFor } from '~/utils/storeIconBadge'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'
import { useDashboardStoreSwitchChrome } from '~/composables/useDashboardStoreSwitchChrome'
import { getStoreBranchCodeLabel, getStoreBranchShortLabel } from '~/utils/store-branch-label'
import { storeBranchNavTooltip } from '~/utils/dashboard-tooltip'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'command-pill'
  }>(),
  { variant: 'default' }
)

const {
  triggerClass: defaultTriggerClass,
  triggerIconClass,
  triggerIconEmptyClass,
  triggerNameClass,
  triggerChevronClass,
  triggerSpinnerClass,
  panelClass,
  panelSurfaceClass,
  panelHeaderClass,
  panelSectionLabelClass,
  panelScrollClass,
  panelFooterClass,
  rowClass,
  rowActiveClass,
  rowInactiveClass,
  rowIconClass,
  rowNameClass,
  statusActiveClass,
  statusInactiveClass,
  footerLinkClass,
  loadingClass,
  emptyClass,
} = useDashboardStoreSwitchChrome()

const triggerClass = computed(() =>
  props.variant === 'command-pill'
    ? 'native-command-header__branch-trigger'
    : defaultTriggerClass
)

const triggerNameClassResolved = computed(() =>
  props.variant === 'command-pill' ? 'native-command-header__branch-name' : triggerNameClass
)

const storesStore = useStoresStore()
const userStore = useUserStore()
const toast = useAppToast()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})
const switchingStore = ref(false)
const { canManageBranches } = useBusinessCapabilities()

const PANEL_WIDTH_PX = 232
const PANEL_MARGIN_PX = 12
const PANEL_GAP_PX = 8

function positionPanel() {
  if (!import.meta.client || !dropdownOpen.value || !dropdownRef.value) return

  const rect = dropdownRef.value.getBoundingClientRect()
  const panelWidth = Math.min(PANEL_WIDTH_PX, window.innerWidth - PANEL_MARGIN_PX * 2)
  let left =
    window.innerWidth >= 640
      ? rect.right - panelWidth
      : (window.innerWidth - panelWidth) / 2
  left = Math.max(
    PANEL_MARGIN_PX,
    Math.min(left, window.innerWidth - panelWidth - PANEL_MARGIN_PX)
  )

  panelStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + PANEL_GAP_PX)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(panelWidth)}px`,
    maxWidth: `calc(100vw - ${PANEL_MARGIN_PX * 2}px)`,
    zIndex: '140',
  }
}

function onPanelScrollOrResize() {
  if (dropdownOpen.value) positionPanel()
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

const loading = computed(() => storesStore.loading)
const { eligibleStores } = usePlanEligibleStores()
const stores = computed(() =>
  userStore.userData?.role === 'superAdmin' ? eligibleStores.value : storesStore.stores
)
const currentStore = computed(() => storesStore.currentStore)
const isStaff = computed(() => userStore.userData?.role === 'staff')

function branchShortLabel(name: string | null | undefined) {
  return getStoreBranchShortLabel(name)
}

function branchCodeLabel(name: string | null | undefined) {
  return getStoreBranchCodeLabel(name)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : []
  const inDropdown =
    dropdownRef.value?.contains(target) ||
    panelRef.value?.contains(target) ||
    eventPath.includes(dropdownRef.value as EventTarget) ||
    eventPath.includes(panelRef.value as EventTarget)

  if (!inDropdown) {
    dropdownOpen.value = false
  }
}

watch(dropdownOpen, async (isOpen) => {
  if (typeof window !== 'undefined') {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }

  if (!import.meta.client || !isOpen) return
  await nextTick()
  positionPanel()
  requestAnimationFrame(() => positionPanel())
})

onMounted(async () => {
  await storesStore.fetchStores()
  await storesStore.initializeCurrentStore()
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', onPanelScrollOrResize, true)
  window.addEventListener('resize', onPanelScrollOrResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', onPanelScrollOrResize, true)
  window.removeEventListener('resize', onPanelScrollOrResize)
  document.body.style.overflow = ''
})

const switchStore = async (storeId: string) => {
  if (switchingStore.value) return

  if (
    userStore.userData?.role === 'superAdmin' &&
    !canManageBranches.value &&
    storeId !== storesStore.currentStoreId
  ) {
    toast.error('Branches are not available on your workspace style. Enable multi-location in Settings.')
    return
  }

  try {
    switchingStore.value = true
    dropdownOpen.value = false

    const [departmentsModule, staffModule, inventoryModule, receiptsModule, customersModule] =
      await Promise.all([
        import('~/stores/departments'),
        import('~/stores/staff'),
        import('~/stores/inventory'),
        import('~/stores/receipts'),
        import('~/stores/customers'),
      ])

    const departmentsStore = departmentsModule.useDepartmentsStore()
    const staffStore = staffModule.useStaffStore()
    const inventoryStore = inventoryModule.useInventoryStore()
    const receiptsStore = receiptsModule.useReceiptsStore()
    const customersStore = customersModule.useCustomersStore()

    departmentsStore.loading = true
    staffStore.loading = true
    inventoryStore.loading = true
    receiptsStore.loading = true
    customersStore.loading = true

    await storesStore.setCurrentStore(storeId)

    toast.success(`Switched to ${branchShortLabel(storesStore.getStoreById(storeId)?.name) || 'store'}`)
  } catch (err: any) {
    console.error('Error switching store:', err)
    toast.error(err.message || 'Failed to switch store')
  } finally {
    switchingStore.value = false
  }
}
</script>
