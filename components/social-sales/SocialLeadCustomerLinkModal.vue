<template>
  <SidePanel
    :model-value="modelValue"
    title="Link to customer"
    subtitle="Search existing customers. This does not edit the customer record."
    size="md"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <div class="space-y-4">
      <div class="relative">
        <MagnifyingGlassIcon
          class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="search"
          type="search"
          placeholder="Search by name, phone, or email…"
          class="app-field w-full py-2 pl-8 pr-3 text-sm"
          @focus="loadCustomers"
        />
      </div>

      <div v-if="loading" class="space-y-2">
        <div v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10" />
      </div>

      <ul v-else-if="matches.length > 0" class="max-h-64 space-y-1 overflow-y-auto">
        <li v-for="customer in matches" :key="customer.id">
          <button
            type="button"
            class="w-full rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
            :disabled="linking"
            @click="link(customer)"
          >
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ customer.name }}</span>
            <span
              v-if="customer.phone || customer.email"
              class="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400"
            >
              {{ [customer.phone, customer.email].filter(Boolean).join(' · ') }}
            </span>
          </button>
        </li>
      </ul>

      <p v-else class="text-xs text-gray-500 dark:text-gray-400">
        {{ search.trim() ? 'No customers match your search.' : 'Type to search customers.' }}
      </p>

      <p v-if="error" class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
  </SidePanel>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import { MagnifyingGlassIcon } from '~/utils/app-icons'
import { useCustomersStore, type Customer } from '~/stores/customers'
import { useSocialSalesLeadsStore } from '~/stores/social-sales/leads'
import { useUserStore } from '~/stores/user'

const props = defineProps<{
  modelValue: boolean
  leadId: string
}>()

const emit = defineEmits<{ 'update:modelValue': [boolean]; linked: [] }>()

const customersStore = useCustomersStore()
const leadsStore = useSocialSalesLeadsStore()
const userStore = useUserStore()
const toast = useAppToast()

const search = ref('')
const loading = ref(false)
const linking = ref(false)
const error = ref('')

const matches = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = customersStore.customers
  if (!q) return list.slice(0, 20)
  return list
    .filter((c) => {
      const haystack = [c.name, c.phone, c.email].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
    .slice(0, 20)
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      search.value = ''
      error.value = ''
      loadCustomers()
    }
  }
)

async function loadCustomers() {
  if (customersStore.customers.length > 0 || customersStore.loading) return
  loading.value = true
  try {
    await customersStore.fetchCustomers()
  } finally {
    loading.value = false
  }
}

async function link(customer: Customer) {
  error.value = ''
  linking.value = true
  try {
    const actorName = userStore.userData?.name || userStore.userData?.email || 'Staff'
    await leadsStore.linkLeadToCustomer(props.leadId, customer.id, customer.name, actorName)
    toast.success(`Linked to ${customer.name}`)
    emit('update:modelValue', false)
    emit('linked')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not link customer'
  } finally {
    linking.value = false
  }
}
</script>
