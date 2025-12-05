<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">Stores</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Manage your stores and switch between them</p>
      </div>
      <Button @click="showCreateModal = true" v-if="!isStaff">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Create Store
      </Button>
    </div>

    <!-- Current Store Info -->
    <Card class="mb-6" v-if="currentStore">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-50">Current Store</h2>
          <p class="text-gray-600 dark:text-gray-400 mt-1">{{ currentStore.name }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mt-1" v-if="currentStore.description">
            {{ currentStore.description }}
          </p>
        </div>
        <span class="px-3 py-1.5 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
          Active
        </span>
      </div>
    </Card>

    <!-- Stores List -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <p class="text-gray-600 dark:text-gray-400 mt-4">Loading stores...</p>
    </div>

    <div v-else-if="storeError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <p class="text-red-800 dark:text-red-200">{{ storeError }}</p>
    </div>

    <div v-else-if="stores.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-gray-50">No stores yet</h3>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Get started by creating your first store.</p>
      <div class="mt-6" v-if="!isStaff">
        <Button @click="showCreateModal = true">Create Store</Button>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card
        v-for="store in stores"
        :key="store.id"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        :class="{ 'ring-2 ring-primary-500': currentStore?.id === store.id }"
        @click="switchStore(store.id)"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-50">{{ store.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1" v-if="store.description">
              {{ store.description }}
            </p>
            <div class="mt-3 space-y-1 text-sm text-gray-500 dark:text-gray-400">
              <p v-if="store.address">
                <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ store.address }}
              </p>
              <p v-if="store.phone">
                <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {{ store.phone }}
              </p>
              <p v-if="store.email">
                <svg class="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {{ store.email }}
              </p>
            </div>
          </div>
          <div class="ml-4 flex items-center gap-2">
            <span
              v-if="currentStore?.id === store.id"
              class="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full"
            >
              Current
            </span>
            <span
              v-else-if="!store.isActive"
              class="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
            >
              Inactive
            </span>
          </div>
        </div>
        <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4" v-if="!isStaff">
          <Button
            variant="secondary"
            size="sm"
            @click.stop="editStore(store)"
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            @click.stop="confirmDelete(store)"
            :disabled="currentStore?.id === store.id"
          >
            Delete
          </Button>
        </div>
      </Card>
    </div>

    <!-- Create/Edit Store Modal -->
    <Modal
      v-model="showCreateModal"
      :title="editingStore ? 'Edit Store' : 'Create Store'"
      size="lg"
    >
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Store Name <span class="text-red-500">*</span>
          </label>
          <input
            v-model="storeForm.name"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="My Store"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            v-model="storeForm.description"
            rows="3"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="Store description..."
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address
          </label>
          <input
            v-model="storeForm.address"
            type="text"
            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            placeholder="123 Main St, City, State ZIP"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <input
              v-model="storeForm.phone"
              type="tel"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              v-model="storeForm.email"
              type="email"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="store@example.com"
            />
          </div>
        </div>

        <div v-if="editingStore">
          <label class="flex items-center gap-2">
            <input
              v-model="storeForm.isActive"
              type="checkbox"
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </div>

      <template #footer>
        <Button variant="secondary" @click="closeModal">Cancel</Button>
        <Button @click="handleSubmit" :disabled="!storeForm.name || isSubmitting">
          {{ isSubmitting ? 'Saving...' : editingStore ? 'Update' : 'Create' }}
        </Button>
      </template>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      v-model="showDeleteModal"
      title="Delete Store"
      size="md"
    >
      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete <strong>{{ storeToDelete?.name }}</strong>? This action cannot be undone.
        </p>
        <p class="text-sm text-red-600 dark:text-red-400">
          Warning: All data associated with this store (departments, staff, inventory, receipts) will need to be handled separately.
        </p>
      </div>

      <template #footer>
        <Button variant="secondary" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="danger" @click="handleDelete" :disabled="isDeleting">
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </Button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useToast } from '~/composables/useToast'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Modal from '~/components/ui/Modal.vue'
import type { Store } from '~/composables/useStores'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

const storesStore = useStoresStore()
const userStore = useUserStore()
const toast = useToast()

const loading = computed(() => storesStore.loading)
const storeError = computed(() => storesStore.error)
const stores = computed(() => storesStore.stores)
const currentStore = computed(() => storesStore.currentStore)
const isStaff = computed(() => userStore.userData?.role === 'staff')

const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const editingStore = ref<Store | null>(null)
const storeToDelete = ref<Store | null>(null)
const isSubmitting = ref(false)
const isDeleting = ref(false)

const storeForm = ref({
  name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  isActive: true,
})

onMounted(async () => {
  await storesStore.fetchStores()
})

const closeModal = () => {
  showCreateModal.value = false
  editingStore.value = null
  storeForm.value = {
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    isActive: true,
  }
}

const editStore = (store: Store) => {
  editingStore.value = store
  storeForm.value = {
    name: store.name,
    description: store.description || '',
    address: store.address || '',
    phone: store.phone || '',
    email: store.email || '',
    isActive: store.isActive,
  }
  showCreateModal.value = true
}

const handleSubmit = async () => {
  if (!storeForm.value.name) return

  isSubmitting.value = true
  try {
    if (editingStore.value) {
      await storesStore.updateStore(editingStore.value.id, storeForm.value)
      toast.success('Store updated successfully')
    } else {
      await storesStore.createStore(storeForm.value)
      toast.success('Store created successfully')
    }
    closeModal()
    await storesStore.fetchStores()
  } catch (err: any) {
    toast.error(err.message || 'Failed to save store')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (store: Store) => {
  storeToDelete.value = store
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!storeToDelete.value) return

  isDeleting.value = true
  try {
    await storesStore.deleteStore(storeToDelete.value.id)
    toast.success('Store deleted successfully')
    showDeleteModal.value = false
    storeToDelete.value = null
    await storesStore.fetchStores()
  } catch (err: any) {
    toast.error(err.message || 'Failed to delete store')
  } finally {
    isDeleting.value = false
  }
}

const switchStore = async (storeId: string) => {
  try {
    toast.info('Switching store...')
    // Set the new store and automatically refresh all data
    await storesStore.setCurrentStore(storeId)
    toast.success('Store switched successfully')
  } catch (err: any) {
    toast.error(err.message || 'Failed to switch store')
  }
}
</script>
