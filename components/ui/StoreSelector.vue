<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      @click="dropdownOpen = !dropdownOpen"
      class="flex h-9 max-w-[10rem] items-center gap-1.5 rounded-sm border-0 bg-transparent px-2.5 py-1.5 text-xs font-medium tracking-tight text-gray-800 dark:text-gray-100 sm:max-w-[12rem]"
      :aria-label="switchingStore ? 'Switching store...' : (currentStore?.name || 'Select store')"
    >
      <svg v-if="!switchingStore" class="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <svg v-else class="w-4 h-4 shrink-0 animate-spin text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="max-w-[80px] sm:max-w-[100px] truncate text-xs flex items-center gap-1">
        <span class="hidden sm:inline">
          {{ switchingStore ? 'Switching...' : (currentStore?.name || 'No Store') }}
        </span>
        <span class="sm:hidden">
          {{ switchingStore ? '...' : (currentStore?.name?.substring(0, 8) || 'Store') }}
        </span>
        <span 
          v-if="!switchingStore && currentStore"
          class="flex-shrink-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse ring-2 ring-white dark:ring-gray-800"
          title="Active store"
        ></span>
      </span>
      <svg v-if="!switchingStore" class="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-[0.98] translate-y-1"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-[0.98] translate-y-1"
    >
      <div
        v-if="dropdownOpen"
        class="frosted-glass fixed left-4 right-4 top-20 z-[50] flex max-h-[calc(100vh-7rem)] w-auto max-w-none flex-col overflow-hidden rounded-sm border border-gray-200/90 py-2 dark:border-gray-700/80 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1.5 sm:max-h-[380px] sm:w-60 sm:max-w-[280px]"
        @click.stop
      >
        <div class="px-3 pb-2 flex items-center gap-1.5">
          <div class="flex h-6 w-6 items-center justify-center rounded-none bg-gray-200/60 text-gray-600 dark:bg-gray-700/80 dark:text-gray-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p class="text-xs font-medium text-gray-700 dark:text-gray-300">
            {{ isStaff ? 'Store' : 'Switch store' }}
          </p>
        </div>

        <div
          class="flex-1 overflow-y-auto px-2 min-h-0 overscroll-contain"
          :class="{ 'max-h-[10rem]': !loading && stores.length > 3 }"
        >
          <div v-if="loading" class="px-2 py-3 text-center">
            <div class="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading…
            </div>
          </div>

          <div v-else-if="stores.length === 0" class="px-2 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
            No stores available
          </div>

          <div v-else class="space-y-0.5 pb-1.5">
            <button
              v-for="store in stores"
              :key="store.id"
              @click="switchStore(store.id)"
              class="w-full text-left flex items-center gap-2.5 rounded-l-sm py-2 pl-2 pr-2.5 text-xs transition-colors duration-150"
              :class="currentStore?.id === store.id
                ? 'border-l-[5px] border-primary-500 font-bold text-primary-800 dark:border-primary-400 dark:text-primary-200'
                : 'border-l-[5px] border-transparent text-gray-700 dark:text-gray-300'"
            >
              <div class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm bg-gray-100/80 dark:bg-gray-800/90">
                <svg class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="truncate pr-1 text-xs" :class="currentStore?.id === store.id ? 'font-bold' : 'font-medium'">
                  {{ store.name || 'Unnamed Store' }}
                </p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span
                    v-if="currentStore?.id === store.id"
                    class="inline-flex items-center gap-1 text-[11px] text-primary-500 dark:text-primary-400"
                  >
                    <span class="w-1 h-1 rounded-full bg-emerald-500 ring-2 ring-primary-100 dark:ring-primary-500/30" />
                    Current
                  </span>
                  <span
                    v-else-if="store.isActive === false"
                    class="text-[11px] text-gray-400 dark:text-gray-500"
                  >
                    Inactive
                  </span>
                </div>
              </div>
              <svg
                v-if="currentStore?.id === store.id"
                class="w-4 h-4 flex-shrink-0 text-primary-500 dark:text-primary-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="!isStaff" class="border-t border-gray-100 dark:border-gray-700/80 pt-1.5 mt-0.5 px-2">
          <NuxtLink
            to="/dashboard/settings"
            class="flex items-center gap-2 rounded-sm px-2.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-400"
            @click="dropdownOpen = false"
          >
            <svg class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage stores
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useToast } from '~/composables/useToast'

const storesStore = useStoresStore()
const userStore = useUserStore()
const toast = useToast()

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

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

// Lock body scroll on mobile when dropdown is open
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
  if (switchingStore.value) return // Prevent multiple simultaneous switches
  
  try {
    switchingStore.value = true
    dropdownOpen.value = false
    
    // Set loading state on all stores to hide previous data
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
    
    // Set loading state to hide previous store data
    departmentsStore.loading = true
    staffStore.loading = true
    inventoryStore.loading = true
    receiptsStore.loading = true
    customersStore.loading = true
    
    // Set the new store and automatically refresh all data
    // This will clear old data and load new data
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
