<template>
  <div class="relative" ref="dropdownRef">
    <!-- Mobile Backdrop -->
    <Transition
      enter-active-class="transition-opacity ease-out duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-in duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="dropdownOpen"
        @click="dropdownOpen = false"
        class="fixed inset-0 bg-black/50 z-[45] sm:hidden"
      ></div>
    </Transition>

    <button
      @click="dropdownOpen = !dropdownOpen"
      class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg transition-colors"
      :aria-label="switchingStore ? 'Switching store...' : (currentStore?.name || 'Select store')"
    >
      <svg v-if="!switchingStore" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="max-w-[100px] sm:max-w-[120px] truncate text-xs sm:text-sm flex items-center gap-1.5">
        <span class="hidden sm:inline">
          {{ switchingStore ? 'Switching...' : (currentStore?.name || 'No Store') }}
        </span>
        <span class="sm:hidden">
          {{ switchingStore ? '...' : (currentStore?.name?.substring(0, 8) || 'Store') }}
        </span>
        <!-- Green online indicator for active store -->
        <span 
          v-if="!switchingStore && currentStore"
          class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"
          title="Active store"
        ></span>
      </span>
      <svg v-if="!switchingStore" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95 sm:scale-95 translate-y-1"
      enter-to-class="transform opacity-100 scale-100 sm:scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100 sm:scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 sm:scale-95 translate-y-1"
    >
      <div
        v-if="dropdownOpen"
        class="fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-64 max-w-none sm:max-w-[320px] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-[50] max-h-[calc(100vh-7rem)] sm:max-h-[400px] overflow-y-auto"
        @click.stop
      >
        <div class="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {{ isStaff ? 'Store' : 'Switch Store' }}
          </p>
        </div>
        
        <div v-if="loading" class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          Loading stores...
        </div>

        <div v-else-if="stores.length === 0" class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
          No stores available
        </div>

        <template v-else>
          <button
            v-for="store in stores"
            :key="store.id"
            @click="switchStore(store.id)"
            class="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20': currentStore?.id === store.id
            }"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 dark:text-gray-100 break-words pr-2 flex items-center gap-2">
                  {{ store.name || 'Unnamed Store' }}
                  <!-- Green online indicator for active store -->
                  <span 
                    v-if="currentStore?.id === store.id"
                    class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    title="Active store"
                  ></span>
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-400 break-words mt-0.5" v-if="store.description">
                  {{ store.description }}
                </p>
              </div>
              <svg
                v-if="currentStore?.id === store.id"
                class="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </button>
        </template>

        <div class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2" v-if="!isStaff">
          <NuxtLink
            to="/dashboard/settings"
            class="block px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
            @click="dropdownOpen = false"
          >
            Manage Stores
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
const stores = computed(() => storesStore.stores)
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
    toast.info('Switching store and loading data...')
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
    
    toast.success('Store switched successfully. All data loaded.')
  } catch (err: any) {
    console.error('Error switching store:', err)
    toast.error(err.message || 'Failed to switch store')
  } finally {
    switchingStore.value = false
  }
}
</script>
