<template>
  <SidePanel
    :model-value="modelValue"
    title="Add social lead"
    subtitle="Track an enquiry from WhatsApp, Instagram, or another channel. Business notes only — not chat messages."
    size="lg"
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Customer name *
          </label>
          <input
            v-model="customerName"
            type="text"
            maxlength="120"
            required
            placeholder="Who enquired?"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Phone (optional)
          </label>
          <input
            v-model="customerPhone"
            type="tel"
            maxlength="40"
            placeholder="Contact number"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            WhatsApp (optional)
          </label>
          <input
            v-model="whatsappNumber"
            type="tel"
            maxlength="40"
            placeholder="WhatsApp number"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Instagram (optional)
          </label>
          <input
            v-model="instagramUsername"
            type="text"
            maxlength="80"
            placeholder="@username"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Platform *
          </label>
          <select v-model="platform" required class="app-field w-full px-3 py-2 text-sm">
            <option v-for="p in SOCIAL_SALES_PLATFORMS" :key="p.value" :value="p.value">
              {{ p.label }}
            </option>
          </select>
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Product interested in *
          </label>
          <input
            v-model="productName"
            type="text"
            maxlength="200"
            required
            placeholder="e.g. iPhone 15 Pro 256GB"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Estimated value *
          </label>
          <input
            v-model.number="estimatedValue"
            type="number"
            min="0"
            step="1"
            required
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>

        <div class="sm:col-span-2">
          <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Notes (optional)
          </label>
          <textarea
            v-model="notes"
            rows="3"
            maxlength="2000"
            placeholder="e.g. Asked about colour options, negotiating price…"
            class="app-field w-full px-3 py-2 text-sm"
          />
        </div>
      </div>

      <p v-if="error" class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>

      <div class="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
        <Button type="button" variant="secondary" size="sm" @click="emit('update:modelValue', false)">
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" :disabled="saving">
          {{ saving ? 'Saving…' : 'Add lead' }}
        </Button>
      </div>
    </form>
  </SidePanel>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SidePanel from '~/components/ui/SidePanel.vue'
import Button from '~/components/ui/Button.vue'
import { useSocialSalesLeadsStore } from '~/stores/social-sales/leads'
import { SOCIAL_SALES_PLATFORMS, type SocialSalesPlatform } from '~/types/social-sales'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean]; created: [string] }>()

const leadsStore = useSocialSalesLeadsStore()
const toast = useAppToast()

const customerName = ref('')
const customerPhone = ref('')
const whatsappNumber = ref('')
const instagramUsername = ref('')
const platform = ref<SocialSalesPlatform>('whatsapp')
const productName = ref('')
const estimatedValue = ref(0)
const notes = ref('')
const error = ref('')
const saving = ref(false)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    error.value = ''
    customerName.value = ''
    customerPhone.value = ''
    whatsappNumber.value = ''
    instagramUsername.value = ''
    platform.value = 'whatsapp'
    productName.value = ''
    estimatedValue.value = 0
    notes.value = ''
  }
)

async function submit() {
  error.value = ''
  saving.value = true
  try {
    const lead = await leadsStore.createLead({
      customerName: customerName.value,
      customerPhone: customerPhone.value,
      whatsappNumber: whatsappNumber.value,
      instagramUsername: instagramUsername.value,
      platform: platform.value,
      productName: productName.value,
      estimatedValue: estimatedValue.value,
      notes: notes.value,
    })
    toast.success('Lead added')
    emit('update:modelValue', false)
    emit('created', lead.id)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Could not create lead'
  } finally {
    saving.value = false
  }
}
</script>
