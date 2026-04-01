<template>
  <div class="relative" ref="dropdownRef">
    <button
      type="button"
      @click="dropdownOpen = !dropdownOpen"
      class="store-switch-trigger group relative flex h-9 max-w-[11rem] items-center gap-2 rounded-md border-0 bg-transparent py-1 pl-1 pr-1.5 text-left outline-none transition-colors hover:bg-gray-100/90 focus-visible:ring-2 focus-visible:ring-primary-500/30 dark:hover:bg-white/[0.06] sm:max-w-[14rem] lg:max-w-[17.5rem]"
      :aria-expanded="dropdownOpen"
      :aria-label="switchingStore ? 'Switching store...' : (currentStore?.name || 'Select store')"
    >
      <span
        v-if="!switchingStore"
        class="store-switch-avatar flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold uppercase leading-none tracking-tight text-white shadow-sm"
        :style="currentStore ? avatarStyleFor(currentStore) : undefined"
        aria-hidden="true"
      >
        {{ currentStore ? initialsFor(currentStore) : '?' }}
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
            class="store-switch-status-dot shrink-0"
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
      enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-[0.98] translate-y-1"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-[0.98] translate-y-1"
    >
      <div
        v-if="dropdownOpen"
        class="store-switch-panel fixed left-4 right-4 top-20 z-[50] flex max-h-[calc(100vh-7rem)] w-auto max-w-none flex-col overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1.5 sm:max-h-[min(24rem,calc(100vh-8rem))] sm:w-[min(17rem,calc(100vw-1.5rem))] sm:max-w-none"
        @click.stop
      >
        <div class="store-switch-panel__surface flex max-h-full min-h-0 flex-col overflow-hidden py-1.5">
          <div class="store-switch-panel__header px-3 pb-2 pt-0.5">
            <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">
              {{ isStaff ? 'Your store' : 'Stores' }}
            </p>
          </div>

          <div
            class="store-switch-panel__scroll flex-1 overflow-y-auto px-1.5 min-h-0 overscroll-contain"
            :class="{ 'max-h-[10rem]': !loading && stores.length > 3 }"
          >
            <div v-if="loading" class="px-2 py-4 text-center">
              <div class="inline-flex items-center gap-2 text-[13px] text-gray-500 dark:text-gray-400">
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

            <div v-else-if="stores.length === 0" class="px-2 py-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
              No stores available
            </div>

            <div v-else class="space-y-0.5 pb-1">
              <button
                v-for="store in stores"
                :key="store.id"
                type="button"
                @click="switchStore(store.id)"
                class="store-switch-row group/row flex w-full items-center gap-2.5 rounded-md px-2 py-2.5 text-left transition-colors duration-150"
                :class="
                  currentStore?.id === store.id
                    ? 'store-switch-row--active bg-gray-100/95 dark:bg-white/[0.07]'
                    : 'hover:bg-gray-50/95 dark:hover:bg-white/[0.04]'
                "
              >
                <span
                  class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold uppercase leading-none tracking-tight text-white shadow-sm"
                  :style="avatarStyleFor(store)"
                  aria-hidden="true"
                >
                  {{ initialsFor(store) }}
                </span>
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-[13px] font-medium leading-snug text-gray-900 dark:text-gray-100"
                    :class="currentStore?.id === store.id ? 'font-semibold' : ''"
                  >
                    {{ store.name || 'Unnamed store' }}
                  </p>
                  <div
                    v-if="currentStore?.id === store.id || store.isActive === false"
                    class="mt-0.5 flex items-center gap-1.5"
                  >
                    <span
                      v-if="currentStore?.id === store.id"
                      class="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-400"
                    >
                      <span class="store-switch-row-dot store-switch-row-dot--active" />
                      Active
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700/90 dark:text-amber-400/95"
                    >
                      <span class="store-switch-row-dot store-switch-row-dot--inactive" />
                      Inactive
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div
            v-if="!isStaff"
            class="store-switch-panel__footer mt-1 border-t border-gray-200/90 px-1.5 pt-1.5 dark:border-white/[0.08]"
          >
            <NuxtLink
              to="/dashboard/settings"
              class="store-switch-footer-link flex items-center gap-2.5 rounded-md px-2 py-2.5 text-[13px] font-medium text-gray-600 transition-colors duration-150 hover:bg-gray-50/95 dark:text-gray-400 dark:hover:bg-white/[0.04]"
              @click="dropdownOpen = false"
            >
              <svg
                class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
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
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useToast } from '~/composables/useToast'

interface StoreLike {
  id?: string
  name?: string | null
}

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

function initialsFor(store: StoreLike): string {
  const raw = (store.name || 'Store').trim()
  if (!raw) return 'S'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  }
  if (raw.length >= 2) return raw.slice(0, 2).toUpperCase()
  const ch = raw[0]!.toUpperCase()
  return ch + ch
}

function hueFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i)!
    h |= 0
  }
  return ((h % 360) + 360) % 360
}

function avatarStyleFor(store: StoreLike): Record<string, string> {
  const key = store.id || store.name || 'default'
  const hue = hueFromString(key)
  return {
    background: `hsl(${hue} 62% 46%)`,
    boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.14)',
  }
}

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

<style scoped>
.store-switch-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: rgb(52 211 153);
  box-shadow: 0 0 0 2px rgb(255 255 255);
}
.dark .store-switch-status-dot {
  box-shadow: 0 0 0 2px rgb(15 23 42);
}

.store-switch-panel__surface {
  border-radius: 6px;
  border: 1px solid rgb(229 231 235 / 0.95);
  background: rgb(255 255 255);
  box-shadow:
    0 10px 40px -12px rgb(0 0 0 / 0.22),
    0 4px 16px -4px rgb(0 0 0 / 0.1);
}

.dark .store-switch-panel__surface {
  border-color: rgb(255 255 255 / 0.1);
  background: rgb(22 23 29);
  box-shadow:
    0 12px 48px -10px rgb(0 0 0 / 0.65),
    0 0 0 1px rgb(0 0 0 / 0.35);
}

.store-switch-row-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.store-switch-row-dot--active {
  background: rgb(52 211 153);
}

.store-switch-row-dot--inactive {
  background: rgb(251 146 60);
}
</style>
