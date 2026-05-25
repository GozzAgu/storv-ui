<template>
  <div class="relative min-w-0 shrink" ref="dropdownRef">
    <button
      type="button"
      @click="dropdownOpen = !dropdownOpen"
      class="store-switch-trigger group relative flex h-9 w-full max-w-28 min-w-0 items-center gap-1.5 rounded-full border-0 bg-white/90 py-1 pl-1 pr-1.5 text-left ring-1 ring-inset ring-gray-200/55 backdrop-blur-sm outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-primary-500/30 dark:bg-white/[0.06] dark:ring-white/10 dark:hover:bg-white/[0.11] sm:max-w-56 sm:gap-2 lg:max-w-70"
      :aria-expanded="dropdownOpen"
      :aria-label="switchingStore ? 'Switching store...' : (currentStore?.name || 'Select store')"
    >
      <span
        v-if="!switchingStore"
        class="store-switch-icon-wrap flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ring-1 ring-inset ring-white/20"
        :class="
          currentStore
            ? 'ring-1 ring-white/20 dark:ring-white/10'
            : 'bg-gray-100 ring-1 ring-gray-200/90 dark:bg-white/8 dark:ring-white/8'
        "
        :style="currentStore ? iconSurfaceStyleFor(currentStore) : undefined"
        aria-hidden="true"
      >
        <BuildingStorefrontIcon
          v-if="currentStore"
          class="h-4 w-4 shrink-0 text-white/95 drop-shadow-[0_1px_1px_rgb(0_0_0/0.12)]"
          stroke-width="1.6"
        />
        <BuildingStorefrontIcon
          v-else
          class="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-300"
          stroke-width="1.6"
        />
      </span>
      <span
        v-else
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-200/90 dark:bg-white/10"
        aria-hidden="true"
      >
        <svg class="h-3.5 w-3.5 animate-spin text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </span>

      <span class="min-w-0 flex-1">
        <span
          class="flex items-center gap-1.5 truncate text-[13px] font-medium leading-tight text-gray-900 dark:text-gray-100"
        >
          <span class="truncate">
            {{ switchingStore ? 'Switching…' : (currentStore?.name || 'No store') }}
          </span>
          <span
            v-if="!switchingStore && currentStore"
            class="status-dot status-dot--active shrink-0"
            aria-hidden="true"
          />
        </span>
      </span>

      <svg
        v-if="!switchingStore"
        class="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500"
        :class="dropdownOpen ? '-rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="2"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

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
        class="store-switch-panel fixed left-1/2 top-18 z-50 flex max-h-[calc(100vh-6rem)] w-[min(calc(100vw-1.5rem),14rem)] max-w-[min(calc(100vw-1.5rem),14rem)] -translate-x-1/2 flex-col overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:h-auto sm:w-[min(13.25rem,calc(100vw-1rem))] sm:max-w-[min(13.25rem,calc(100vw-1rem))] sm:translate-x-0"
        @click.stop
      >
        <div
          class="store-switch-panel__surface relative flex max-h-full min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200/95 bg-white py-1 shadow-md shadow-zinc-900/8 ring-1 ring-black/5 dark:border-gray-700/90 dark:bg-zinc-900 dark:shadow-lg dark:shadow-black/45 dark:ring-white/8"
        >
          <div class="store-switch-panel__header px-2.5 pb-1.5 pt-2">
            <p
              class="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500"
            >
              {{ isStaff ? 'Your store' : 'Stores' }}
            </p>
          </div>

          <div
            class="store-switch-panel__scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-0.5"
            :class="{ 'max-h-36': !loading && stores.length > 3 }"
          >
            <div v-if="loading" class="px-2 py-3 text-center">
              <div class="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Loading…
              </div>
            </div>

            <div v-else-if="stores.length === 0" class="px-2 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
              No stores available
            </div>

            <div v-else class="space-y-0.5 pb-0.5">
              <button
                v-for="store in stores"
                :key="store.id"
                type="button"
                @click="switchStore(store.id)"
                class="store-switch-row group/row flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-150"
                :class="
                  currentStore?.id === store.id
                    ? 'store-switch-row--active bg-primary-500/8 dark:bg-white/6'
                    : 'hover:bg-black/3 dark:hover:bg-white/4'
                "
              >
                <span
                  class="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ring-1 ring-white/25 dark:ring-white/10"
                  :style="iconSurfaceStyleFor(store)"
                  aria-hidden="true"
                >
                  <BuildingStorefrontIcon
                    class="h-3.5 w-3.5 shrink-0 text-white/95 drop-shadow-[0_1px_1px_rgb(0_0_0/0.12)]"
                    stroke-width="1.6"
                  />
                </span>
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-xs font-medium leading-snug tracking-tight text-zinc-800 dark:text-zinc-100"
                    :class="currentStore?.id === store.id ? 'font-semibold text-zinc-900 dark:text-white' : ''"
                  >
                    {{ store.name || 'Unnamed store' }}
                  </p>
                  <div
                    v-if="currentStore?.id === store.id || store.isActive === false"
                    class="mt-0.5 flex items-center gap-1"
                  >
                    <span
                      v-if="currentStore?.id === store.id"
                      class="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600/85 dark:text-emerald-400/90"
                    >
                      <span class="status-dot status-dot--active" />
                      Active
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700/85 dark:text-amber-400/90"
                    >
                      <span class="status-dot status-dot--inactive" />
                      Inactive
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div
            v-if="!isStaff"
            class="store-switch-panel__footer mt-0.5 border-t border-black/6 px-1.5 pb-1 pt-1.5 dark:border-white/7"
          >
            <NuxtLink
              to="/dashboard/settings"
              class="store-switch-footer-link flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 transition-colors duration-150 hover:bg-black/4 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-300"
              @click="dropdownOpen = false"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Manage stores
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { BuildingStorefrontIcon } from '@heroicons/vue/24/outline'
import { iconSurfaceStyleFor } from '~/utils/storeIconBadge'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useAppToast } from '~/composables/useAppToast'

const storesStore = useStoresStore()
const userStore = useUserStore()
const toast = useAppToast()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const switchingStore = ref(false)

const loading = computed(() => storesStore.loading)
const { eligibleStores } = usePlanEligibleStores()
const stores = computed(() =>
  userStore.userData?.role === 'superAdmin' ? eligibleStores.value : storesStore.stores
)
const currentStore = computed(() => storesStore.currentStore)
const isStaff = computed(() => userStore.userData?.role === 'staff')

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

watch(dropdownOpen, (isOpen) => {
  if (typeof window !== 'undefined') {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

onMounted(async () => {
  await storesStore.fetchStores()
  await storesStore.initializeCurrentStore()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.body.style.overflow = ''
})

const switchStore = async (storeId: string) => {
  if (switchingStore.value) return

  try {
    switchingStore.value = true
    dropdownOpen.value = false

    const [
      departmentsModule,
      staffModule,
      inventoryModule,
      receiptsModule,
      customersModule,
    ] = await Promise.all([
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

    toast.success(`Switched to ${storesStore.getStoreById(storeId)?.name || 'store'}`)
  } catch (err: any) {
    console.error('Error switching store:', err)
    toast.error(err.message || 'Failed to switch store')
  } finally {
    switchingStore.value = false
  }
}
</script>

