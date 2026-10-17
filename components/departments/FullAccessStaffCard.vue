<template>
  <SCard
    v-if="access && fullAccessIds && !access.storeViewOnly"
    title="Full access"
    :description="`Your plan includes ${access.maxStaff} staff with full access in this branch. The others can sign in and look, but not sell or edit.`"
  >
    <template #actions>
      <SButton size="sm" @click="openChooser">Choose staff</SButton>
    </template>
    <ul class="s-list">
      <li v-for="member in access.staff" :key="member.id" class="s-list__item">
        <span class="s-list__main">
          <span class="s-list__primary">{{ member.name }}</span>
        </span>
        <SBadge :tone="fullAccessIds.includes(member.id) ? 'success' : 'neutral'" size="sm">
          {{ fullAccessIds.includes(member.id) ? 'Full access' : 'View only' }}
        </SBadge>
      </li>
    </ul>
  </SCard>

  <SDialog
    v-if="access"
    :open="chooserOpen"
    title="Who keeps full access"
    size="sm"
    @update:open="(value: boolean) => (chooserOpen = value)"
  >
    <p class="s-field__hint">
      Pick up to {{ access.maxStaff }}. Everyone else in this branch becomes view only.
    </p>
    <SCheckbox
      v-for="member in access.staff"
      :key="member.id"
      :model-value="selected.includes(member.id)"
      :label="member.name"
      :disabled="!selected.includes(member.id) && selected.length >= access.maxStaff"
      @update:model-value="(checked: boolean) => toggle(member.id, checked)"
    />
    <p v-if="errorMessage" class="s-field__error" role="alert">{{ errorMessage }}</p>
    <template #footer>
      <SDialogActions
        :primary-loading="saving"
        :primary-disabled="saving || selected.length === 0"
        @cancel="chooserOpen = false"
        @primary="save"
      />
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import { getApiErrorMessage } from '~/utils/api-error-message'
import { useAuthenticatedFetch } from '~/composables/useAuthenticatedFetch'
import { useAppToast } from '~/composables/useAppToast'

type StoreAccess = {
  storeViewOnly: boolean
  maxStaff: number
  fullAccessIds: string[] | null
  staff: Array<{ id: string; name: string; departmentId: string }>
}

const props = defineProps<{ storeId: string }>()

const { authFetch } = useAuthenticatedFetch()
const toast = useAppToast()

const access = ref<StoreAccess | null>(null)
const fullAccessIds = computed(() => access.value?.fullAccessIds ?? null)
const chooserOpen = ref(false)
const selected = ref<string[]>([])
const saving = ref(false)
const errorMessage = ref('')

async function load() {
  if (!props.storeId) return
  try {
    access.value = await authFetch<StoreAccess>(
      `/api/workspace/full-access-staff?storeId=${encodeURIComponent(props.storeId)}`
    )
  } catch (error) {
    console.warn('[FullAccessStaffCard] Could not load staff access:', error)
    access.value = null
  }
}

function openChooser() {
  selected.value = [...(fullAccessIds.value ?? [])]
  errorMessage.value = ''
  chooserOpen.value = true
}

function toggle(id: string, checked: boolean) {
  selected.value = checked
    ? [...selected.value, id]
    : selected.value.filter((memberId) => memberId !== id)
}

async function save() {
  saving.value = true
  errorMessage.value = ''
  try {
    await authFetch('/api/workspace/full-access-staff', {
      method: 'POST',
      body: { storeId: props.storeId, staffIds: selected.value },
    })
    await load()
    chooserOpen.value = false
    toast.success('Saved. Staff see the change next time they open Storvv.')
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, 'Could not save. Please try again.')
  } finally {
    saving.value = false
  }
}

watch(() => props.storeId, load, { immediate: true })
</script>
