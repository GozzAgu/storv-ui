<template>
  <div class="s-branch" :class="{ 's-branch--compact': compact }">
    <SPopover
      v-if="interactive"
      label="Branches"
      role="listbox"
      align="start"
      header-menu-id="stores"
      panel-class="s-branch__menu"
    >
      <template #trigger="{ open, toggle }">
        <button
          type="button"
          class="s-branch__trigger"
          aria-haspopup="listbox"
          :aria-expanded="open"
          :aria-label="triggerLabel"
          :disabled="switchingStore"
          @click.stop="toggle"
        >
          <span class="s-branch__mark" aria-hidden="true">
            <SSpinner v-if="switchingStore" />
            <template v-else>{{ initial }}</template>
          </span>
          <span v-if="!compact" class="s-branch__text">
            <span class="s-branch__eyebrow">Branch</span>
            <span class="s-branch__name">{{ switchingStore ? 'Switching…' : name }}</span>
          </span>
          <ChevronsUpDown
            v-if="!compact"
            class="s-branch__chevron"
            :size="14"
            :stroke-width="1.75"
            aria-hidden="true"
          />
        </button>
      </template>

      <template #default="{ close }">
        <p class="s-popover__label">Branches</p>
        <div v-if="loading" class="s-popover__empty">Loading…</div>
        <div v-else-if="stores.length === 0" class="s-popover__empty">No branches yet</div>
        <ul v-else class="s-branch__list">
          <li v-for="store in stores" :key="store.id">
            <button
              type="button"
              role="option"
              class="s-menu-row"
              :aria-selected="store.id === currentStore?.id"
              @click="select(store.id, close)"
            >
              <span class="s-branch__mark s-branch__mark--sm" aria-hidden="true">
                {{ markFor(store.name) }}
              </span>
              <span class="s-menu-row__text">
                <span class="s-menu-row__label">{{ storePrimaryLabel(store) }}</span>
                <span v-if="storeSecondaryLabel(store)" class="s-menu-row__meta">
                  {{ storeSecondaryLabel(store) }}
                </span>
              </span>
              <Check
                v-if="store.id === currentStore?.id"
                class="s-menu-row__check"
                :size="16"
                :stroke-width="2"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>
        <div v-if="!isStaff" class="s-popover__foot">
          <NuxtLink :to="manageTo" class="s-menu-row" @click="close">
            <Settings2 class="s-menu-row__icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
            <span class="s-menu-row__label">Manage branches</span>
          </NuxtLink>
        </div>
      </template>
    </SPopover>

    <div v-else class="s-branch__trigger s-branch__trigger--static" :aria-label="triggerLabel">
      <span class="s-branch__mark" aria-hidden="true">{{ initial }}</span>
      <span v-if="!compact" class="s-branch__text">
        <span class="s-branch__eyebrow">{{ isStaff ? 'Your branch' : 'Branch' }}</span>
        <span class="s-branch__name">{{ name }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Check, ChevronsUpDown, Settings2 } from '@lucide/vue'
import SPopover from '~/components/s/SPopover.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import { useStoresStore } from '~/stores/stores'
import { useBranchSwitcher } from '~/composables/useBranchSwitcher'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'

const props = defineProps<{
  interactive: boolean
  compact?: boolean
  manageTo: string
}>()

const storesStore = useStoresStore()
const {
  stores,
  currentStore,
  loading,
  isStaff,
  switchingStore,
  switchStore,
  storePrimaryLabel,
  storeSecondaryLabel,
} = useBranchSwitcher()

const name = computed(() => getStoreBranchShortLabel(currentStore.value?.name) || 'No branch')
const initial = computed(() => markFor(currentStore.value?.name))
const triggerLabel = computed(() =>
  switchingStore.value ? 'Switching branch' : `Current branch: ${name.value}. Change branch`
)

function markFor(storeName: string | null | undefined) {
  const label = getStoreBranchShortLabel(storeName) || storeName || ''
  return label.trim().charAt(0).toUpperCase() || 'S'
}

async function select(storeId: string, close: () => void) {
  close()
  await switchStore(storeId)
}

onMounted(async () => {
  if (!props.interactive) return
  await storesStore.fetchStores()
  await storesStore.initializeCurrentStore()
})
</script>
