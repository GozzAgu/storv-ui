<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="dropdownOpen = !dropdownOpen"
      class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
    >
      <svg v-if="!switchingStore" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="hidden md:inline max-w-[120px] truncate">
        {{ switchingStore ? 'Switching...' : (currentStore?.name || 'No Store') }}
      </span>
      <svg v-if="!switchingStore" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="dropdownOpen"
        class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 max-h-[400px] overflow-y-auto"
      >
        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
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
            class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300': currentStore?.id === store.id,
              'text-gray-700 dark:text-gray-300': currentStore?.id !== store.id
            }"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{{ store.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate" v-if="store.description">
                  {{ store.description }}
                </p>
              </div>
              <svg
                v-if="currentStore?.id === store.id"
                class="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-2"
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
            to="/dashboard/stores"
            class="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

onMounted(async () => {
  await storesStore.fetchStores()
  await storesStore.initializeCurrentStore()
})

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const switchStore = async (storeId: string) => {
  if (switchingStore.value) return // Prevent multiple simultaneous switches
  
  try {
    switchingStore.value = true
    toast.info('Switching store and loading data...')
    dropdownOpen.value = false
    
    // Set the new store and automatically refresh all data
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
