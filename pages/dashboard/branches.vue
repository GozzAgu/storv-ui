<template>
  <div class="ds-root s-c s-page s-team s-branches">
    <SPageHeader title="Branches">
      <template #description>
        Each branch keeps its own stock, team and sales. Switch between them from the top bar.
      </template>
      <template v-if="canManage && eligibleStores.length > 0" #actions>
        <SButton variant="primary" :disabled="!canAddStore" @click="openCreateStoreModal">
          <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
          Add branch
        </SButton>
      </template>
    </SPageHeader>

    <SCard v-if="!userStore.isSuperAdmin">
      <SEmptyState
        title="Only the account owner can manage branches"
        description="Ask the owner of this account to add or change branches."
      >
        <template #icon><Store :size="24" :stroke-width="1.75" /></template>
      </SEmptyState>
    </SCard>

    <SCard v-else-if="!canManage">
      <SEmptyState
        title="Branches are turned off"
        description="Your workspace is set up for a single location. Turn on multi-location in Settings to add and manage branches."
      >
        <template #icon><Store :size="24" :stroke-width="1.75" /></template>
        <template #actions>
          <SButton variant="primary" :to="dashPath('/settings#advanced-features')">Open Settings</SButton>
        </template>
      </SEmptyState>
    </SCard>

    <template v-else>
      <p v-if="eligibleStores.length > 0 && !canAddStore && isMicroSubscription" class="s-notice">
        Storvv Micro includes one branch.
        <NuxtLink :to="dashPath('/settings?upgrade=1')" class="s-link">Upgrade your plan</NuxtLink>
        to add more.
      </p>
      <p v-if="hiddenStoreCount > 0" class="s-notice">
        {{ hiddenStoreCount }} {{ hiddenStoreCount === 1 ? 'branch is' : 'branches are' }} on your
        account but not on your current plan<template v-if="hiddenStoreNames.length">
          ({{ hiddenStoreNames.join(', ') }})</template>. Your oldest branches stay available first.
        <NuxtLink :to="dashPath('/settings?upgrade=1')" class="s-link">Upgrade to restore them</NuxtLink>.
      </p>

      <SCard v-if="storesLoading && eligibleStores.length === 0" flush aria-busy="true">
        <ul class="s-list" aria-label="Loading branches">
          <li v-for="i in 3" :key="i" class="s-list__item" aria-hidden="true">
            <SSkeleton width="32px" height="32px" />
            <div class="s-list__main">
              <SSkeleton width="35%" height="14px" />
              <SSkeleton width="50%" height="12px" />
            </div>
            <SSkeleton width="56px" height="20px" />
          </li>
        </ul>
      </SCard>

      <SCard v-else-if="storesError && eligibleStores.length === 0">
        <SEmptyState title="Couldn't load your branches" :description="storesError">
          <template #icon><Store :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton @click="storesStore.fetchStores({ force: true })">Try again</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <SCard v-else-if="eligibleStores.length === 0">
        <SEmptyState
          title="Add your first branch"
          description="A branch is a shop or location. Your stock, staff and sales are kept separate for each one."
        >
          <template #icon><Store :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton variant="primary" @click="openCreateStoreModal">
              <template #leading><Plus :size="16" :stroke-width="2" aria-hidden="true" /></template>
              Add branch
            </SButton>
          </template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <dl class="s-metrics">
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Branches</dt>
            <dd class="s-metrics__value">{{ eligibleStores.length }}</dd>
          </div>
          <div class="s-metrics__item">
            <dt class="s-metrics__label">Active</dt>
            <dd class="s-metrics__value">{{ activeBranchCount }}</dd>
          </div>
          <div v-if="maxStores >= 0" class="s-metrics__item">
            <dt class="s-metrics__label">Plan allows</dt>
            <dd class="s-metrics__value">{{ maxStores }}</dd>
          </div>
        </dl>

        <!-- Phone -->
        <SCard flush class="s-only-sm">
          <ul class="s-list">
            <li v-for="store in eligibleStores" :key="store.id">
              <div class="s-list__item">
                <span class="s-team__mark" aria-hidden="true">
                  <Store :size="16" :stroke-width="1.75" />
                </span>
                <span class="s-list__main">
                  <span class="s-list__primary">{{ store.name }}</span>
                  <span class="s-list__secondary">{{ branchSummary(store) }}</span>
                </span>
                <span class="s-list__end">
                  <SBadge :tone="branchStatus(store).tone" size="sm">{{ branchStatus(store).label }}</SBadge>
                </span>
                <SIconButton
                  :label="`Actions for ${store.name}`"
                  size="sm"
                  :data-branch-actions-anchor="store.id"
                  aria-haspopup="menu"
                  :aria-expanded="openMenuId === store.id"
                  @click="toggleMenu(store.id)"
                >
                  <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                </SIconButton>
              </div>
            </li>
          </ul>
        </SCard>

        <!-- Tablet and desktop -->
        <div class="s-table-wrap s-hide-sm">
          <table class="s-table">
            <thead>
              <tr>
                <th scope="col">Branch</th>
                <th scope="col" class="s-hide-md">Address</th>
                <th scope="col" class="s-hide-lg">Contact</th>
                <th scope="col">Status</th>
                <th scope="col" class="s-table__actions"><span class="ds-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="store in eligibleStores" :key="store.id">
                <td>
                  <div class="s-team__cell">
                    <span class="s-team__mark" aria-hidden="true">
                      <Store :size="16" :stroke-width="1.75" />
                    </span>
                    <span class="s-team__cell-text">
                      <span class="s-table__primary">{{ store.name }}</span>
                      <span v-if="store.description" class="s-table__secondary">{{ store.description }}</span>
                    </span>
                  </div>
                </td>
                <td class="s-hide-md">
                  <span v-if="store.address" class="s-table__secondary">{{ store.address }}</span>
                  <span v-else class="s-table__muted">{{ EMPTY_CELL }}</span>
                </td>
                <td class="s-hide-lg">
                  <span v-if="store.phone || store.email" class="s-team__cell-text">
                    <span v-if="store.phone" class="s-table__secondary">{{ store.phone }}</span>
                    <span v-if="store.email" class="s-table__secondary">{{ store.email }}</span>
                  </span>
                  <span v-else class="s-table__muted">{{ EMPTY_CELL }}</span>
                </td>
                <td>
                  <SBadge :tone="branchStatus(store).tone" dot>{{ branchStatus(store).label }}</SBadge>
                </td>
                <td class="s-table__actions">
                  <SIconButton
                    :label="`Actions for ${store.name}`"
                    size="sm"
                    :data-branch-actions-anchor="store.id"
                    aria-haspopup="menu"
                    :aria-expanded="openMenuId === store.id"
                    @click="toggleMenu(store.id)"
                  >
                    <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                  </SIconButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <SMenu
      :open="Boolean(openMenuId && branchForMenu && menuFixedStyle)"
      :style="menuFixedStyle"
      menu-id="branch"
      label="Branch actions"
      @close="closeBranchMenu"
    >
      <SMenuItem
        v-if="branchForMenu && branchForMenu.id !== currentStore?.id"
        label="Switch to this branch"
        :icon="ArrowLeftRight"
        @select="runBranchMenuAction((store) => switchStore(store.id))"
      />
      <SMenuItem label="Edit details" :icon="Pencil" @select="runBranchMenuAction(editStore)" />
      <SMenuItem
        v-if="branchForMenu && branchForMenu.id !== currentStore?.id"
        label="Delete branch"
        :icon="Trash2"
        danger
        @select="runBranchMenuAction(confirmDelete)"
      />
    </SMenu>

    <SDialog
      v-model:open="branchFormOpen"
      placement="right"
      :title="editingStore ? 'Edit branch' : 'Add branch'"
      :description="editingStore ? undefined : 'Name the branch and add the details customers see on receipts.'"
      :dismissible="!isSubmittingStore"
    >
      <form id="branch-form" class="s-form" @submit.prevent="handleStoreSubmit">
        <template v-if="useRegionBranchPicker">
          <SSelect
            v-model="branchCity"
            label="City"
            :options="branchCityOptions"
            placeholder="Choose a city"
            :hint="`Cities in ${branchRegionLabel}, based on your account region.`"
            required
          />
          <SInput v-model="branchLocality" label="Area" placeholder="e.g. Lekki or GRA" hint="Optional. Helps tell apart two branches in the same city." />
        </template>
        <SInput v-else v-model="storeForm.name" label="Branch name" placeholder="e.g. Main shop" required />

        <STextarea v-model="storeForm.description" label="Description" :rows="2" />
        <STextarea
          v-model="storeForm.sellScreenNote"
          label="Note for cashiers"
          :rows="3"
          placeholder="e.g. 10% off accessories today"
          hint="Shown on Quick sale and checkout for this branch."
        />
        <SInput v-model="storeForm.address" label="Address" autocomplete="street-address" />
        <SInput v-model="storeForm.phone" label="Phone" type="tel" autocomplete="tel" />
        <SInput v-model="storeForm.email" label="Email" type="email" autocomplete="email" />
        <SCheckbox
          v-if="editingStore"
          v-model="storeForm.isActive"
          label="Branch is active"
        />
      </form>
      <template #footer>
        <SButton :disabled="isSubmittingStore" @click="closeStoreModal">Cancel</SButton>
        <SButton
          variant="primary"
          type="submit"
          form="branch-form"
          :loading="isSubmittingStore"
          :disabled="!storeForm.name"
        >
          {{ editingStore ? 'Save changes' : 'Add branch' }}
        </SButton>
      </template>
    </SDialog>

    <SDialog
      v-model:open="showDeleteModal"
      role="alertdialog"
      size="sm"
      :title="`Delete ${storeToDelete?.name ?? 'branch'}?`"
      description="This removes the branch. Its departments, staff, stock and sales aren't moved anywhere, so handle them first. This can't be undone."
      :dismissible="!isDeletingStore"
    >
      <template #footer>
        <SButton :disabled="isDeletingStore" @click="showDeleteModal = false">Cancel</SButton>
        <SButton variant="danger" :loading="isDeletingStore" @click="handleStoreDelete">
          Delete branch
        </SButton>
      </template>
    </SDialog>

    <SDialog
      v-model:open="showStoreSelectionModal"
      title="Start using your branch"
      description="Your branch is ready. Choose it to start adding stock and sales."
      size="sm"
      :dismissible="false"
    >
      <ul class="s-list" aria-label="Your branches">
        <li v-for="store in storesStore.stores" :key="store.id">
          <button type="button" class="s-list__item s-list__hit" @click="handleStoreSelection(store.id)">
            <span class="s-list__main">
              <span class="s-list__primary">{{ store.name }}</span>
              <span v-if="store.address" class="s-list__secondary">{{ store.address }}</span>
            </span>
            <SBadge v-if="newlyCreatedStoreId === store.id" tone="accent" size="sm">New</SBadge>
          </button>
        </li>
      </ul>
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { ArrowLeftRight, EllipsisVertical, Pencil, Plus, Store, Trash2 } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SInput from '~/components/s/SInput.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STextarea from '~/components/s/STextarea.vue'
import { useStoresStore } from '~/stores/stores'
import { useUserStore } from '~/stores/user'
import { useBranchManagement } from '~/composables/useBranchManagement'
import { useAnchoredRowMenu } from '~/composables/useAnchoredRowMenu'
import type { Store as Branch } from '~/composables/useStores'
import { getVisibleMenuAnchorElement } from '~/utils/menuAnchor'
import { EMPTY_CELL } from '~/utils/ui-empty'

definePageMeta({
  layout: 'dashboard',
})

const { dashPath } = useDashboardPaths()
const storesStore = useStoresStore()
const userStore = useUserStore()

const {
  storesLoading,
  storesError,
  currentStore,
  eligibleStores,
  hiddenStoreCount,
  hiddenStoreNames,
  isMicroSubscription,
  maxStores,
  canAddStore,
  canManageBranches,
  showCreateModal,
  showDeleteModal,
  showStoreSelectionModal,
  editingStore,
  storeToDelete,
  isSubmittingStore,
  isDeletingStore,
  newlyCreatedStoreId,
  storeForm,
  branchCity,
  branchLocality,
  availableBranchCities,
  branchRegionLabel,
  useRegionBranchPicker,
  switchStore,
  closeStoreModal,
  editStore,
  openCreateStoreModal,
  handleStoreSubmit,
  handleStoreSelection,
  confirmDelete,
  handleStoreDelete,
} = useBranchManagement()

/** A workspace without multi-location can still create its very first branch. */
const canManage = computed(() => canManageBranches.value || storesStore.stores.length === 0)

const activeBranchCount = computed(() => eligibleStores.value.filter((store) => store.isActive).length)

const branchCityOptions = computed(() =>
  availableBranchCities.value.map((city) => ({ label: city, value: city }))
)

const branchFormOpen = computed({
  get: () => showCreateModal.value,
  set: (open: boolean) => {
    if (!open) closeStoreModal()
  },
})

function branchStatus(store: Branch): { label: string; tone: 'accent' | 'success' | 'neutral' } {
  if (store.id === currentStore.value?.id) return { label: 'Current', tone: 'accent' }
  if (store.isActive) return { label: 'Active', tone: 'success' }
  return { label: 'Inactive', tone: 'neutral' }
}

function branchSummary(store: Branch): string {
  return store.address || store.description || store.phone || 'No address yet'
}

const { openMenuId, menuFixedStyle, toggleMenu } = useAnchoredRowMenu({
  anchorAttr: 'data-branch-actions-anchor',
  estimatedMenuHeight: 132,
})

const branchForMenu = computed(
  () => eligibleStores.value.find((store) => store.id === openMenuId.value) ?? null
)

function runBranchMenuAction(action: (store: Branch) => unknown) {
  const store = branchForMenu.value
  openMenuId.value = null
  if (store) action(store)
}

function closeBranchMenu() {
  const id = openMenuId.value
  openMenuId.value = null
  if (id) nextTick(() => getVisibleMenuAnchorElement('data-branch-actions-anchor', id)?.focus())
}

onMounted(() => {
  if (storesStore.stores.length === 0 && !storesStore.loading) {
    void storesStore.fetchStores()
  }
})
</script>
