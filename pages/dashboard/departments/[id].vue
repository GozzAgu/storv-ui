<template>
  <div class="ds-root s-c s-page s-team">
    <SPageHeader
      :title="department?.name || 'Department'"
      :back="departmentsListPath ? { to: departmentsListPath, label: 'Team' } : undefined"
    >
      <template #eyebrow>
        <nav class="s-breadcrumb" aria-label="Breadcrumb">
          <NuxtLink v-if="departmentsListPath" :to="departmentsListPath" class="s-breadcrumb__link">
            Team
          </NuxtLink>
          <template v-if="departmentStoreName">
            <ChevronRight class="s-breadcrumb__sep" :size="14" :stroke-width="2" aria-hidden="true" />
            <span>{{ departmentStoreName }}</span>
          </template>
        </nav>
      </template>
      <template #description>
        {{ department?.description?.trim() || 'Add people to this department, set what they can access, and move them between departments.' }}
      </template>
      <template v-if="canCreateNewStaff && !(staff.length === 0 && !isLoadingStaff)" #actions>
        <SButton variant="primary" @click="openCreateStaffModal">
          <template #leading><UserPlus :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
          Add staff
        </SButton>
      </template>
    </SPageHeader>

    <StaffInvitePasswordsPanel
      v-if="departmentId"
      :department-id="departmentId"
      :can-show="canCreateNewStaff"
    />

    <SCard v-if="isLoadingStaff" flush aria-busy="true">
      <ul class="s-list" aria-label="Loading staff">
        <li v-for="i in 6" :key="i" class="s-list__item" aria-hidden="true">
          <SSkeleton circle width="32px" height="32px" />
          <div class="s-list__main">
            <SSkeleton width="35%" height="14px" />
            <SSkeleton width="25%" height="12px" />
          </div>
          <SSkeleton width="64px" height="20px" />
        </li>
      </ul>
    </SCard>

    <template v-else>
      <dl v-if="staff.length > 0" class="s-metrics">
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Members</dt>
          <dd class="s-metrics__value">{{ staff.length }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Active</dt>
          <dd class="s-metrics__value">{{ activeStaff }}</dd>
        </div>
        <div class="s-metrics__item">
          <dt class="s-metrics__label">Full access</dt>
          <dd class="s-metrics__value">{{ totalFullAccessStaff }}</dd>
        </div>
      </dl>

      <STabs
        v-if="canRemoveStaff && (staff.length > 0 || removedStaff.length > 0)"
        v-model="rosterTab"
        :tabs="rosterTabs"
        label="Staff roster"
      />

      <div
        v-if="canRemoveStaff && rosterTab === 'active' && selectedStaffForBulk.length > 0"
        class="s-toolbar s-toolbar--selection"
        role="region"
        aria-label="Bulk actions"
      >
        <SCheckbox
          :model-value="allStaffOnPageSelected"
          :label="`${selectedStaffForBulk.length} selected`"
          @update:model-value="toggleSelectAllStaff"
        />
        <div class="s-toolbar__end">
          <SButton variant="ghost" size="sm" @click="selectedStaffForBulk = []">Clear</SButton>
          <SButton variant="danger" size="sm" @click="openBulkDeleteStaffModal">
            <template #leading><UserMinus :size="14" :stroke-width="2" aria-hidden="true" /></template>
            Remove
          </SButton>
        </div>
      </div>
      <div v-else-if="rosterSource.length > 0" class="s-toolbar">
        <SSearch
          v-model="staffSearchQuery"
          class="s-toolbar__search"
          placeholder="Search staff"
          label="Search staff by name, email or position"
        />
      </div>

      <SCard v-if="rosterTab === 'active' && staff.length === 0">
        <SEmptyState
          title="No staff in this department yet"
          description="Add people to give them a sign-in, a role and access to this branch. They sign in with the email and temporary password you set."
        >
          <template #icon><Users :size="24" :stroke-width="1.75" /></template>
          <template v-if="canCreateNewStaff" #actions>
            <SButton variant="primary" @click="openCreateStaffModal">
              <template #leading><UserPlus :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
              Add staff
            </SButton>
          </template>
        </SEmptyState>
      </SCard>

      <SCard v-else-if="rosterTab === 'removed' && removedStaff.length === 0">
        <SEmptyState
          title="No removed staff"
          description="People you remove from this department show up here, and you can reactivate them to restore their sign-in."
        >
          <template #icon><Users :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton @click="rosterTab = 'active'">View active staff</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <SCard v-else-if="rosterPaginationTotal === 0">
        <SEmptyState title="No staff found" description="Try a different name, email or position.">
          <template #icon><SearchX :size="24" :stroke-width="1.75" /></template>
          <template #actions>
            <SButton @click="staffSearchQuery = ''">Clear search</SButton>
          </template>
        </SEmptyState>
      </SCard>

      <template v-else>
        <!-- Phone -->
        <SCard flush class="s-only-sm">
          <ul class="s-list">
            <li v-for="member in rosterPage" :key="member.id">
              <div class="s-list__item">
                <SCheckbox
                  v-if="canRemoveStaff && rosterTab === 'active'"
                  :model-value="isStaffSelected(member)"
                  :aria-label="`Select ${staffName(member)}`"
                  @update:model-value="(checked) => toggleStaffSelection(member, checked)"
                />
                <SAvatar :name="staffName(member)" :src="member.photoURL" size="sm" />
                <span class="s-list__main">
                  <span class="s-list__primary">{{ staffName(member) }}</span>
                  <span class="s-list__secondary">{{ getStaffRowSubtitle(member) }}</span>
                </span>
                <span class="s-list__end">
                  <SBadge :tone="staffStatusTone(member)" size="sm">{{ staffStatusLabel(member) }}</SBadge>
                </span>
                <SIconButton
                  v-if="rosterTab === 'active' ? canManageDepartments : canRemoveStaff"
                  :label="`Actions for ${staffName(member)}`"
                  size="sm"
                  :data-staff-actions-anchor="member.id"
                  aria-haspopup="menu"
                  :aria-expanded="openStaffMenuId === member.id"
                  @click="toggleStaffMenu(member.id)"
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
                <th v-if="canRemoveStaff && rosterTab === 'active'" scope="col" class="s-table__check">
                  <SCheckbox
                    :model-value="allStaffOnPageSelected"
                    aria-label="Select all staff on this page"
                    @update:model-value="toggleSelectAllStaff"
                  />
                </th>
                <th scope="col">Name</th>
                <th scope="col" class="s-hide-md">Position</th>
                <th scope="col">Access</th>
                <th scope="col" class="s-hide-lg">Email</th>
                <th scope="col">Status</th>
                <th scope="col" class="s-table__actions"><span class="ds-sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="member in rosterPage"
                :key="member.id"
                :class="{ 's-table__row--selected': isStaffSelected(member) }"
              >
                <td v-if="canRemoveStaff && rosterTab === 'active'" class="s-table__check">
                  <SCheckbox
                    :model-value="isStaffSelected(member)"
                    :aria-label="`Select ${staffName(member)}`"
                    @update:model-value="(checked) => toggleStaffSelection(member, checked)"
                  />
                </td>
                <td>
                  <div class="s-table__inline">
                    <SAvatar :name="staffName(member)" :src="member.photoURL" size="sm" />
                    <span class="s-table__primary">{{ staffName(member) }}</span>
                  </div>
                </td>
                <td class="s-hide-md">
                  <span v-if="member.position">{{ member.position }}</span>
                  <span v-else class="s-table__muted">{{ EMPTY_CELL }}</span>
                </td>
                <td>
                  <SBadge :tone="getStaffAccessLabel(member) === 'Full access' ? 'accent' : 'neutral'">
                    {{ getStaffAccessLabel(member) }}
                  </SBadge>
                </td>
                <td class="s-hide-lg"><span class="s-table__secondary">{{ member.email }}</span></td>
                <td>
                  <SBadge :tone="staffStatusTone(member)" dot>{{ staffStatusLabel(member) }}</SBadge>
                </td>
                <td class="s-table__actions">
                  <SIconButton
                    v-if="rosterTab === 'active' ? canManageDepartments : canRemoveStaff"
                    :label="`Actions for ${staffName(member)}`"
                    size="sm"
                    :data-staff-actions-anchor="member.id"
                    aria-haspopup="menu"
                    :aria-expanded="openStaffMenuId === member.id"
                    @click="toggleStaffMenu(member.id)"
                  >
                    <EllipsisVertical :size="16" :stroke-width="2" aria-hidden="true" />
                  </SIconButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <SPagination
          :current-page="staffCurrentPage"
          :page-size="staffItemsPerPage"
          :total="rosterPaginationTotal"
          label="Staff pagination"
          @page-change="handleStaffPageChange"
        />
      </template>
    </template>

    <SMenu
      :open="Boolean(openStaffMenuId && staffForOpenMenu && staffMenuFixedStyle)"
      :style="staffMenuFixedStyle"
      menu-id="staff"
      label="Staff actions"
      @close="closeStaffMenu"
    >
      <SMenuItem
        v-if="rosterTab === 'removed'"
        :label="reactivateBusyId === staffForOpenMenu?.id ? 'Reactivating…' : 'Reactivate'"
        :icon="RotateCcw"
        :disabled="reactivateBusyId === staffForOpenMenu?.id"
        @select="runStaffMenuAction(openReactivateStaffModal)"
      />
      <template v-else>
        <SMenuItem label="Edit" :icon="Pencil" @select="runStaffMenuAction(handleEditStaff)" />
        <SMenuItem
          v-if="canMoveStaff"
          label="Move to another department"
          :icon="ArrowLeftRight"
          @select="runStaffMenuAction(openMoveStaffModal)"
        />
        <SMenuItem
          v-if="canRemoveStaff"
          label="Remove from department"
          :icon="UserMinus"
          danger
          @select="runStaffMenuAction(openDeactivateStaffModal)"
        />
      </template>
    </SMenu>

    <DeactivateStaffModal
      v-model="showDeactivateStaffModal"
      :staff="staffPendingDeactivation"
      :is-processing="isDeactivatingStaff"
      @confirm="handleConfirmDeactivateStaff"
    />

    <ReactivateStaffModal
      v-model="showReactivateStaffModal"
      :staff="staffPendingReactivation"
      :is-processing="!!reactivateBusyId"
      @confirm="handleConfirmReactivateStaff"
    />

    <MoveStaffModal
      v-model="showMoveStaffModal"
      :staff="staffPendingMove"
      :current-department-id="departmentId"
      :current-department-name="department?.name || 'This department'"
      :departments="departmentsStore.departments"
      :is-processing="isMovingStaff"
      @confirm="handleConfirmMoveStaff"
    />

    <!-- Staff Modal -->
    <StaffModal
      v-if="departmentId"
      v-model="showStaffModal"
      :department-id="departmentId"
      :staff="editingStaff"
      @success="handleStaffSuccess"
      @error="handleStaffError"
    />

    <TotpConfirmModal
      v-model="totpModalOpen"
      title="Confirm with authenticator"
      description="Enter your 6-digit code to confirm this staff action."
      @confirm="confirmTotp"
      @cancel="cancelTotp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ArrowLeftRight,
  ChevronRight,
  EllipsisVertical,
  Pencil,
  RotateCcw,
  SearchX,
  UserMinus,
  UserPlus,
  Users,
} from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SMenu from '~/components/s/SMenu.vue'
import SMenuItem from '~/components/s/SMenuItem.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPagination from '~/components/s/SPagination.vue'
import SSearch from '~/components/s/SSearch.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import {
  formatStaffStatusLabel,
  staffAccessLabel,
} from '~/utils/status-labels'
import { resolveStaffPermissions, summarizeStaffPermissions } from '~/utils/staff-permissions'
import StaffModal from '~/components/departments/StaffModal.vue'
import DeactivateStaffModal from '~/components/departments/DeactivateStaffModal.vue'
import ReactivateStaffModal from '~/components/departments/ReactivateStaffModal.vue'
import MoveStaffModal from '~/components/departments/MoveStaffModal.vue'
import StaffInvitePasswordsPanel from '~/components/departments/StaffInvitePasswordsPanel.vue'
import TotpConfirmModal from '~/components/security/TotpConfirmModal.vue'
import { useTotpConfirmModal } from '~/composables/useTotpConfirmModal'
import { resolveTotpForSensitiveAction } from '~/utils/security-api-errors'
import { EMPTY_CELL } from '~/utils/ui-empty'
import { useDepartmentsStore } from '~/stores/departments'
import { useStaffStore } from '~/stores/staff'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import type { Department } from '~/composables/useDepartments'
import type { Staff } from '~/composables/useStaff'
import { usePermissions } from '~/composables/usePermissions'
import { useAppToast } from '~/composables/useAppToast'
import { useStoresStore } from '~/stores/stores'
import {
  getVisibleMenuAnchorElement,
  computeFixedAnchoredMenuStyle,
  isInsideAnchoredMenu,
} from '~/utils/menuAnchor'
import { useDashboardFloatingMenu } from '~/composables/useDashboardFloatingMenu'
import {
  departmentDetailPath,
  resolveStoreDepartmentsPath,
  storeDepartmentsPath,
} from '~/utils/department-routes'

definePageMeta({
  layout: 'dashboard',
  key: (route) => `department-${route.params.id}`, // Force re-mount when ID changes
  middleware: 'auth', // Ensure auth middleware runs
  ssr: false, // Disable SSR for client-side navigation
})

const route = useRoute()
const departmentId = computed(() => route.params.id as string)

const department = ref<Department | null>(null)
const staff = ref<Staff[]>([])
const removedStaff = ref<Staff[]>([])
type StaffRosterTab = 'active' | 'removed'
const rosterTab = ref<StaffRosterTab>('active')
const isLoadingStaff = ref(true)
const reactivateBusyId = ref<string | null>(null)

// Staff pagination - load from localStorage per department
const getStaffInitialPage = (): number => {
  if (import.meta.client) {
    try {
      const deptId = route.params.id as string
      if (deptId) {
        const saved = localStorage.getItem(`departments-staff-page-${deptId}`)
        return saved ? parseInt(saved, 10) : 1
      }
    } catch (e) {
      return 1
    }
  }
  return 1
}
const staffCurrentPage = ref(getStaffInitialPage())
const staffItemsPerPage = ref(100)
const staffSearchQuery = ref('')

function matchesStaffSearch(member: Staff, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [member.firstName, member.lastName, member.email, member.position].some((value) =>
    value?.toLowerCase().includes(q)
  )
}

function filterStaffBySearch(list: Staff[]): Staff[] {
  const q = staffSearchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((member) => matchesStaffSearch(member, q))
}

function getStaffRowSubtitle(member: Staff): string {
  const parts = [member.position, member.email].filter(Boolean)
  return parts.join(' · ')
}

function getStaffAccessLabel(member: Staff): string {
  return staffAccessLabel(summarizeStaffPermissions(resolveStaffPermissions(member)))
}

function staffName(member: Staff): string {
  return `${member.firstName} ${member.lastName}`.trim() || member.email
}

function staffStatusTone(member: Staff): 'success' | 'warning' | 'error' {
  if (rosterTab.value === 'removed') return 'error'
  if (member.status === 'active') return 'success'
  if (member.status === 'on_leave') return 'warning'
  return 'error'
}

function staffStatusLabel(member: Staff): string {
  return rosterTab.value === 'removed' ? 'Removed' : formatStaffStatusLabel(member.status)
}

const filteredStaffRoster = computed(() =>
  rosterTab.value === 'active'
    ? filterStaffBySearch(staff.value)
    : filterStaffBySearch(removedStaff.value)
)

// Staff modal
const showStaffModal = ref(false)
const editingStaff = ref<Staff | null>(null)

// Bulk remove / lifecycle modals
const selectedStaffForBulk = ref<Staff[]>([])
const showDeactivateStaffModal = ref(false)
const staffPendingDeactivation = ref<Staff | Staff[] | null>(null)
const isDeactivatingStaff = ref(false)
const showReactivateStaffModal = ref(false)
const staffPendingReactivation = ref<Staff | null>(null)
const showMoveStaffModal = ref(false)
const staffPendingMove = ref<Staff | null>(null)
const isMovingStaff = ref(false)
const toast = useAppToast()

const { menuViewportPadding } = useDashboardFloatingMenu()

const departmentsStore = useDepartmentsStore()
const staffStore = useStaffStore()
const {
  open: totpModalOpen,
  prompt: promptTotp,
  confirm: confirmTotp,
  cancel: cancelTotp,
} = useTotpConfirmModal()
const authStore = useAuthStore()
const userStore = useUserStore()
const storesStore = useStoresStore()

const departmentsListPath = computed(() =>
  resolveStoreDepartmentsPath(
    department.value?.storeId,
    storesStore.currentStoreId,
    storesStore.stores[0]?.id
  )
)
const departmentStoreName = computed(() => {
  const storeId = department.value?.storeId || storesStore.currentStoreId
  return storeId ? storesStore.getStoreById(storeId)?.name || '' : ''
})
const openStaffMenuId = ref<string | null>(null)

const toggleStaffMenu = (staffId: string) => {
  openStaffMenuId.value = openStaffMenuId.value === staffId ? null : staffId
}

const staffForOpenMenu = computed(() => {
  const id = openStaffMenuId.value
  if (!id) return null
  return (
    paginatedStaff.value.find((s) => s.id === id) ??
    paginatedRemovedStaff.value.find((s) => s.id === id) ??
    staff.value.find((s) => s.id === id) ??
    removedStaff.value.find((s) => s.id === id) ??
    null
  )
})

const staffMenuFixedStyle = ref<Record<string, string> | null>(null)

function updateStaffMenuPosition() {
  const id = openStaffMenuId.value
  if (!id || !import.meta.client) {
    staffMenuFixedStyle.value = null
    return
  }
  const el = getVisibleMenuAnchorElement('data-staff-actions-anchor', id)
  if (!el) {
    staffMenuFixedStyle.value = null
    return
  }
  const r = el.getBoundingClientRect()
  const itemCount = 2 + (canMoveStaff.value ? 1 : 0) + (canRemoveStaff.value ? 1 : 0)
  staffMenuFixedStyle.value = computeFixedAnchoredMenuStyle(r, {
    estimatedMenuHeight: itemCount * 40 + 8,
    margin: 4,
    viewportPadding: menuViewportPadding.value,
  })
}

function addStaffMenuPositionListeners() {
  if (!import.meta.client) return
  window.addEventListener('scroll', updateStaffMenuPosition, true)
  window.addEventListener('resize', updateStaffMenuPosition)
}

function removeStaffMenuPositionListeners() {
  if (!import.meta.client) return
  window.removeEventListener('scroll', updateStaffMenuPosition, true)
  window.removeEventListener('resize', updateStaffMenuPosition)
}

let staffMenuOutsideHandler: ((e: MouseEvent) => void) | null = null

function removeStaffMenuOutsideListener() {
  if (staffMenuOutsideHandler && import.meta.client) {
    document.removeEventListener('click', staffMenuOutsideHandler, true)
    staffMenuOutsideHandler = null
  }
}

watch(openStaffMenuId, (id) => {
  removeStaffMenuOutsideListener()
  removeStaffMenuPositionListeners()
  staffMenuFixedStyle.value = null
  if (!id || !import.meta.client) return

  nextTick(() => {
    updateStaffMenuPosition()
    addStaffMenuPositionListeners()
  })

  staffMenuOutsideHandler = (e: MouseEvent) => {
    const t = e.target as HTMLElement | null
    if (isInsideAnchoredMenu(t)) return
    if (t?.closest?.('[data-staff-actions-anchor]')) return
    openStaffMenuId.value = null
    removeStaffMenuOutsideListener()
  }

  nextTick(() => {
    setTimeout(() => {
      if (openStaffMenuId.value && staffMenuOutsideHandler) {
        document.addEventListener('click', staffMenuOutsideHandler, true)
      }
    }, 0)
  })
})

function closeStaffMenu() {
  const id = openStaffMenuId.value
  openStaffMenuId.value = null
  if (!id || !import.meta.client) return
  nextTick(() => getVisibleMenuAnchorElement('data-staff-actions-anchor', id)?.focus())
}

function runStaffMenuAction(action: (member: Staff) => void) {
  const member = staffForOpenMenu.value
  closeStaffMenu()
  if (member) action(member)
}

// Check if current user is staff (limited permissions)
const isStaff = computed(() => userStore.userData?.role === 'staff')
// Get permissions
const { canCreateStaff, canManage, canRemoveStaff, canMoveStaff } = usePermissions()
// Only super admins can create or remove staff (managers can edit roles/details)
const canManageDepartments = computed(() => canManage.value)
const canCreateNewStaff = computed(() => canCreateStaff.value)

// Current staff member (for staff users and to check manager status)
const currentStaffMember = ref<Staff | null>(null)

const paginatedStaff = computed(() => {
  const list = filterStaffBySearch(staff.value)
  const start = (staffCurrentPage.value - 1) * staffItemsPerPage.value
  const end = start + staffItemsPerPage.value
  return list.slice(start, end)
})

const paginatedRemovedStaff = computed(() => {
  const list = filterStaffBySearch(removedStaff.value)
  const start = (staffCurrentPage.value - 1) * staffItemsPerPage.value
  const end = start + staffItemsPerPage.value
  return list.slice(start, end)
})

const rosterPaginationTotal = computed(() => filteredStaffRoster.value.length)
const rosterSource = computed(() => (rosterTab.value === 'active' ? staff.value : removedStaff.value))
const rosterPage = computed(() =>
  rosterTab.value === 'active' ? paginatedStaff.value : paginatedRemovedStaff.value
)
const rosterTabs = computed(() => [
  { value: 'active', label: 'Active', count: staff.value.length },
  { value: 'removed', label: 'Removed', count: removedStaff.value.length },
])

function isStaffSelected(member: Staff): boolean {
  return selectedStaffForBulk.value.some((s) => s.id === member.id)
}

const allStaffOnPageSelected = computed(
  () => paginatedStaff.value.length > 0 && paginatedStaff.value.every((m) => isStaffSelected(m))
)

watch(staffSearchQuery, () => {
  staffCurrentPage.value = 1
})

watch(rosterTab, () => {
  staffCurrentPage.value = 1
  selectedStaffForBulk.value = []
  openStaffMenuId.value = null
})

watch(showDeactivateStaffModal, (open) => {
  if (!open) staffPendingDeactivation.value = null
})

watch(showReactivateStaffModal, (open) => {
  if (!open) staffPendingReactivation.value = null
})

watch(showMoveStaffModal, (open) => {
  if (!open) staffPendingMove.value = null
})

function syncDepartmentFromStore() {
  const updated = departmentsStore.getDepartmentById(departmentId.value)
  if (updated) department.value = { ...updated }
}

function applyStaffRemoved(member: Staff) {
  staff.value = staff.value.filter((s) => s.id !== member.id)
  const removed: Staff = { ...member, status: 'inactive' }
  const existing = removedStaff.value.findIndex((s) => s.id === member.id)
  if (existing === -1) {
    removedStaff.value = [removed, ...removedStaff.value]
  } else {
    removedStaff.value[existing] = removed
  }
  selectedStaffForBulk.value = selectedStaffForBulk.value.filter((s) => s.id !== member.id)
  syncDepartmentManagerFromStaff()
  syncDepartmentFromStore()
}

function applyStaffReactivated(member: Staff) {
  removedStaff.value = removedStaff.value.filter((s) => s.id !== member.id)
  const active: Staff = {
    ...member,
    status: 'active',
    removedAt: undefined,
    removedBy: undefined,
  }
  if (!staff.value.some((s) => s.id === member.id)) {
    staff.value = [active, ...staff.value]
  }
  syncDepartmentManagerFromStaff()
  syncDepartmentFromStore()
  rosterTab.value = 'active'
}

function applyStaffMoved(member: Staff, fromDepartmentId: string) {
  if (fromDepartmentId === departmentId.value) {
    staff.value = staff.value.filter((s) => s.id !== member.id)
    selectedStaffForBulk.value = selectedStaffForBulk.value.filter((s) => s.id !== member.id)
  }
  syncDepartmentManagerFromStaff()
  syncDepartmentFromStore()
}

const toggleStaffSelection = (member: Staff, checked: boolean) => {
  const idx = selectedStaffForBulk.value.findIndex((s) => s.id === member.id)
  if (checked && idx === -1) selectedStaffForBulk.value.push(member)
  else if (!checked && idx !== -1) selectedStaffForBulk.value.splice(idx, 1)
}
const toggleSelectAllStaff = (checked: boolean) => {
  if (checked) selectedStaffForBulk.value = [...paginatedStaff.value]
  else selectedStaffForBulk.value = []
}
function openDeactivateStaffModal(target: Staff | Staff[]) {
  staffPendingDeactivation.value = target
  showDeactivateStaffModal.value = true
}

const openBulkDeleteStaffModal = () => {
  if (selectedStaffForBulk.value.length === 0) return
  openDeactivateStaffModal([...selectedStaffForBulk.value])
}

async function handleConfirmDeactivateStaff() {
  const pending = staffPendingDeactivation.value
  if (!pending) return

  const targets = Array.isArray(pending) ? pending : [pending]
  if (!targets.length) return

  isDeactivatingStaff.value = true
  const count = targets.length

  try {
    const totpCode = await resolveTotpForSensitiveAction(promptTotp)
    for (const member of targets) {
      const removed = await staffStore.deleteStaff(member.id, totpCode)
      applyStaffRemoved(removed)
    }
    selectedStaffForBulk.value = []
    showDeactivateStaffModal.value = false
    staffPendingDeactivation.value = null
    toast.success(`${count} staff member${count !== 1 ? 's' : ''} removed`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove staff member'
    toast.error(message)
  } finally {
    isDeactivatingStaff.value = false
  }
}

function openReactivateStaffModal(member: Staff) {
  staffPendingReactivation.value = member
  showReactivateStaffModal.value = true
}

async function openMoveStaffModal(member: Staff) {
  if (!departmentsStore.departments.length) {
    await departmentsStore.fetchDepartments().catch(() => {})
  }
  staffPendingMove.value = member
  showMoveStaffModal.value = true
}

async function handleConfirmMoveStaff(targetDepartmentId: string) {
  const member = staffPendingMove.value
  if (!member || !targetDepartmentId || targetDepartmentId === member.departmentId) return

  const fromDepartmentId = member.departmentId
  const targetDept =
    departmentsStore.getDepartmentById(targetDepartmentId) ||
    (await departmentsStore.fetchDepartment(targetDepartmentId).catch(() => null))
  const targetName = targetDept?.name || 'the selected department'
  const name = `${member.firstName} ${member.lastName}`.trim()

  isMovingStaff.value = true
  try {
    await staffStore.updateStaff(member.id, { departmentId: targetDepartmentId })
    const moved = staffStore.getStaffMember(member.id) || {
      ...member,
      departmentId: targetDepartmentId,
      departmentName: targetName,
    }
    applyStaffMoved(moved, fromDepartmentId)
    showMoveStaffModal.value = false
    staffPendingMove.value = null
    toast.success(`${name} moved to ${targetName}`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to move staff member'
    toast.error(message)
  } finally {
    isMovingStaff.value = false
  }
}

async function handleConfirmReactivateStaff() {
  const member = staffPendingReactivation.value
  if (!member) return

  reactivateBusyId.value = member.id
  const name = `${member.firstName} ${member.lastName}`.trim()

  try {
    const totpCode = await resolveTotpForSensitiveAction(promptTotp)
    const reactivated = await staffStore.reactivateStaff(member.id, totpCode)
    applyStaffReactivated(reactivated)
    showReactivateStaffModal.value = false
    staffPendingReactivation.value = null
    toast.success(`${name} was reactivated`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reactivate staff member'
    toast.error(message)
  } finally {
    reactivateBusyId.value = null
  }
}

// Computed stats for compact header
const totalFullAccessStaff = computed(() => {
  return staff.value.filter(
    (m) => summarizeStaffPermissions(resolveStaffPermissions(m)) === 'full'
  ).length
})

const activeStaff = computed(() => {
  return staff.value.filter((m) => m.status === 'active').length
})

// Load department and staff data
const loadDepartmentData = async () => {
  // Fetch user data if authenticated and not already loaded
  if (authStore.currentUser?.uid && !userStore.userData) {
    await userStore.fetchUserData(authStore.currentUser.uid)
  }

  if (!departmentId.value || typeof departmentId.value !== 'string') {
    console.error('Invalid department ID:', departmentId.value)
    if (departmentsListPath.value) await navigateTo(departmentsListPath.value)
    else await navigateTo('/dashboard')
    return
  }

  // Staff may only open their own department
  if (userStore.userData?.role === 'staff') {
    try {
      const member = await staffStore.fetchCurrentStaffMember()
      if (!member?.departmentId) {
        if (departmentsListPath.value) await navigateTo(departmentsListPath.value)
        else await navigateTo('/dashboard')
        return
      }
      if (departmentId.value !== member.departmentId) {
        await navigateTo(departmentDetailPath(member.departmentId))
        return
      }
    } catch {
      if (departmentsListPath.value) await navigateTo(departmentsListPath.value)
      else await navigateTo('/dashboard')
      return
    }
  }

  isLoadingStaff.value = true

  try {
    // Load department using Pinia store
    const dept = await departmentsStore.fetchDepartment(departmentId.value)
    if (dept) {
      department.value = dept
      useHead({
        title: `${dept.name || 'Department'} - Department Management - Storvv`,
      })
    } else {
      // Department not found, redirect
      if (departmentsListPath.value) await navigateTo(departmentsListPath.value)
      else await navigateTo('/dashboard')
      return
    }

    // Load staff for this department using Pinia store
    await staffStore.fetchStaffByDepartment(departmentId.value)
    // Get staff from store getter (it's a function that takes departmentId)
    staff.value = staffStore.getStaffByDepartment(departmentId.value)

    if (canRemoveStaff.value) {
      removedStaff.value = await staffStore.fetchInactiveStaffByDepartment(departmentId.value)
    } else {
      removedStaff.value = []
    }

    // Get current staff member data (for staff users and to check if user is a manager)
    // This helps determine if a super admin is also a manager in this department
    try {
      const staffMember = await staffStore.fetchCurrentStaffMember()
      if (staffMember && staffMember.departmentId === departmentId.value) {
        currentStaffMember.value = staffMember
      }
    } catch (error) {
      // Not a staff member in this department, that's okay
      if (userStore.userData?.role === 'staff') {
        // If they're a staff user, they should be in a department
        console.warn('Staff user not found in department:', error)
      }
    }
  } catch (error: any) {
    console.error('Error loading department data:', error.message || error)
    alert(error.message || 'Failed to load department data')
    if (departmentsListPath.value) await navigateTo(departmentsListPath.value)
    else await navigateTo('/dashboard')
  } finally {
    isLoadingStaff.value = false
  }
}

// Staff management functions
const openCreateStaffModal = () => {
  editingStaff.value = null
  showStaffModal.value = true
}

const handleEditStaff = (staffMember: Staff) => {
  editingStaff.value = staffMember
  showStaffModal.value = true
}

// Legacy field, no longer written on new staff. degrades to "Not assigned" once every staff
// member in a department has moved to the permission matrix (see StaffPermissionsPanel).
function syncDepartmentManagerFromStaff() {
  if (!department.value) return
  const manager = staff.value.find((m) => m.role === 'manager')
  department.value.manager = manager ? `${manager.firstName} ${manager.lastName}` : 'Not assigned'
}

const handleStaffSuccess = async () => {
  // Close modal immediately for better UX
  showStaffModal.value = false
  editingStaff.value = null

  // Refresh staff list in the background (non-blocking)
  // The store's createStaff already triggers background refresh, but we'll also refresh here
  // to ensure the table updates reactively
  isLoadingStaff.value = true

  // Refresh in background without blocking
  Promise.all([
    // Refresh staff for this department
    staffStore.fetchStaffByDepartment(departmentId.value).then(() => {
      // Update local staff ref from store getter
      staff.value = staffStore.getStaffByDepartment(departmentId.value)
    }),
    // Also refresh the department to update staff count
    departmentsStore.fetchDepartment(departmentId.value).then(() => {
      // Update local department ref
      const updatedDept = departmentsStore.getDepartmentById(departmentId.value)
      if (updatedDept) {
        department.value = updatedDept
      }
    }),
  ])
    .then(() => {
      // console.log('[Department Page] Staff list refreshed after creation')
    })
    .catch((error: any) => {
      console.error('Error refreshing staff after creation:', error)
    })
    .finally(() => {
      isLoadingStaff.value = false
    })
}

const handleStaffError = (error: string) => {
  console.error('Staff error:', error)
}

const handleStaffPageChange = (page: number) => {
  staffCurrentPage.value = page
  // Save to localStorage with department ID
  if (import.meta.client) {
    try {
      const deptId = departmentId.value
      if (deptId) {
        localStorage.setItem(`departments-staff-page-${deptId}`, page.toString())
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch for page changes to persist
watch(staffCurrentPage, (newPage) => {
  if (import.meta.client) {
    try {
      const deptId = departmentId.value
      if (deptId) {
        localStorage.setItem(`departments-staff-page-${deptId}`, newPage.toString())
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
})

// Watch for department ID changes and restore pagination
watch(
  () => route.params.id,
  (newDeptId) => {
    if (import.meta.client && newDeptId) {
      try {
        const saved = localStorage.getItem(`departments-staff-page-${newDeptId}`)
        if (saved) {
          staffCurrentPage.value = parseInt(saved, 10)
        } else {
          staffCurrentPage.value = 1
        }
      } catch (e) {
        staffCurrentPage.value = 1
      }
    }
  },
  { immediate: false }
)

// Watch for route parameter changes when navigating between departments
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId && typeof newId === 'string') {
      // Clear previous data
      department.value = null
      staff.value = []
      isLoadingStaff.value = true
      // Load new data
      try {
        await loadDepartmentData()
      } catch (error) {
        console.error('Error loading department data:', error)
      }
    }
  },
  { immediate: false }
)

onMounted(async () => {
  if (import.meta.server) return

  // Wait for auth and user data to load
  let attempts = 0
  while ((authStore.loading || !userStore.userData) && attempts < 100) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }

  // Check if user is staff/intern and redirect
  if (userStore.userData?.role === 'staff') {
    // console.log('[DepartmentDetailPage] Staff user detected - redirecting to dashboard')
    await navigateTo('/dashboard')
    return
  }

  // Load data immediately
  await loadDepartmentData()
})

onBeforeUnmount(() => {
  removeStaffMenuOutsideListener()
  removeStaffMenuPositionListeners()
})
</script>
