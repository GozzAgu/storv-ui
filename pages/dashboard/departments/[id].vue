<template>
  <div
    class="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[1400px] flex-col space-y-5 overflow-x-hidden pb-24 sm:space-y-6 sm:pb-24"
  >
    <Breadcrumbs :items="departmentBreadcrumbs" class="text-[11px] text-gray-500 dark:text-gray-400" />

    <StaffInvitePasswordsPanel
      v-if="departmentId"
      :department-id="departmentId"
      :can-show="canCreateNewStaff"
      class="rounded-2xl border border-gray-200/80 bg-white/90 dark:border-gray-800/70 dark:bg-gray-900/35"
    />

    <!-- Hero -->
    <header
      v-if="!isLoadingDepartment"
      class="relative rounded-2xl border border-gray-200/80 bg-white/90 px-4 py-4 dark:border-gray-800/70 dark:bg-gray-900/35 sm:px-5 sm:py-5"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200/90 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700/80 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            title="Back to departments"
            @click="navigateTo('/dashboard/departments')"
          >
            <ArrowLeftIcon class="h-4 w-4" stroke-width="1.75" />
          </button>
          <div class="min-w-0 flex-1">
            <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              Department
            </p>
            <h1
              class="mt-1 truncate text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl"
            >
              {{ department?.name || 'Department' }}
            </h1>
            <p class="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {{
                department?.description ||
                'Manage roles, contact info, and status for everyone in this department.'
              }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50/90 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700/80 dark:bg-gray-800/70 dark:text-gray-300"
              >
                <BuildingOfficeIcon class="h-3.5 w-3.5 opacity-70" />
                {{ department?.departmentType || 'Type' }}
              </span>
              <span
                class="inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-full border border-gray-200/80 bg-gray-50/90 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:border-gray-700/80 dark:bg-gray-800/70 dark:text-gray-300 sm:max-w-xs"
                :title="currentManager"
              >
                <UserCircleIcon class="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span class="truncate">Lead: {{ currentManager }}</span>
              </span>
              <span
                v-if="!isLoadingStaff"
                class="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-gray-50/90 px-2.5 py-1 text-[11px] font-medium tabular-nums text-gray-600 dark:border-gray-700/80 dark:bg-gray-800/70 dark:text-gray-300"
              >
                <UsersIcon class="h-3.5 w-3.5 opacity-70" />
                {{ staff.length }} {{ staff.length === 1 ? 'member' : 'members' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
    <div
      v-else
      class="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-5 dark:border-gray-800/70 dark:bg-gray-900/35 sm:p-6"
    >
      <div class="flex gap-3">
        <div class="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"></div>
        <div class="min-w-0 flex-1 space-y-3">
          <div class="h-2.5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div class="h-7 w-2/3 max-w-sm animate-pulse rounded-md bg-gray-200 dark:bg-gray-700"></div>
          <div class="h-3 w-full max-w-md animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>

    <!-- KPI strip -->
    <div
      v-if="!isLoadingStaff && !isStaffFullscreen"
      class="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3"
    >
      <StatCard label="Team size" :value="String(staff.length)" subtext="In this department" />
      <StatCard label="Active" :value="String(activeStaff)" subtext="Available to work" />
      <div class="col-span-2 lg:col-span-1">
        <StatCard label="Managers" :value="String(totalManagers)" subtext="Leadership roles" />
      </div>
    </div>

    <div
      :class="[
        'flex min-h-0 flex-col transition-all duration-300',
        isStaffFullscreen
          ? 'fixed inset-0 z-50 overflow-auto bg-gray-50 dark:bg-gray-950'
          : 'relative flex-1',
      ]"
    >
      <div
        v-if="isStaffFullscreen"
        class="sticky top-0 z-20 border-b border-gray-200/90 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/90 sm:px-6"
      >
        <div class="mx-auto flex max-w-[1400px] items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              Expanded view
            </p>
            <h2 class="mt-0.5 truncate text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-xl">
              {{ department?.name || 'Department' }} — Staff
            </h2>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ staff.length }} people · {{ totalManagers }} managers · {{ activeStaff }} active
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-xl border border-gray-200/90 bg-white p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700/80 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            title="Exit expanded view"
            @click="isStaffFullscreen = false"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        :class="[
          'flex min-h-0 flex-col',
          isStaffFullscreen
            ? 'mx-auto min-h-0 w-full max-w-[1400px] flex-1 px-3 pb-6 pt-3 sm:px-5'
            : 'overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 dark:border-gray-800/70 dark:bg-gray-900/35',
        ]"
      >
        <div
          v-if="canManageDepartments && selectedStaffForBulk.length > 0"
          class="flex flex-wrap items-center gap-2 border-b border-gray-100/90 bg-primary-50/60 px-4 py-2.5 dark:border-gray-800/80 dark:bg-primary-900/15 sm:px-5"
        >
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300"
            >{{ selectedStaffForBulk.length }} selected</span
          >
          <Button
            variant="outline"
            size="sm"
            :icon="TrashIcon"
            class="!rounded-lg !border-red-200 dark:!border-red-800 !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20"
            @click="openBulkDeleteStaffModal"
          >
            Delete ({{ selectedStaffForBulk.length }})
          </Button>
        </div>

        <!-- Table toolbar -->
        <div
          v-if="!isLoadingStaff && staff.length > 0 && !isStaffFullscreen"
          class="flex flex-col gap-3 border-b border-gray-100/90 px-4 py-3 dark:border-gray-800/80 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5"
        >
          <div class="min-w-0">
            <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
              Team roster
            </h2>
            <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
              {{ paginatedStaff.length }} on this page · {{ staff.length }} total
            </p>
          </div>
          <button
            type="button"
            class="self-end rounded-xl border border-gray-200/90 bg-white p-2 text-gray-500 transition-colors hover:border-gray-300/90 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700/80 dark:bg-gray-900/50 dark:text-gray-400 dark:hover:border-gray-600/80 dark:hover:bg-gray-800 sm:self-auto"
            title="Expanded table"
            @click="isStaffFullscreen = true"
          >
            <ArrowsPointingOutIcon class="h-4 w-4" />
          </button>
        </div>

        <div
          v-if="isLoadingStaff"
          class="min-h-[min(420px,calc(100svh-16rem))] flex-1 overflow-x-auto"
        >
          <div class="space-y-3 p-4 sm:p-6">
            <div v-for="i in 6" :key="i" class="flex items-center gap-4">
              <div class="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"></div>
              <div class="flex-1 space-y-2">
                <div class="h-4 w-1/3 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"></div>
                <div class="h-3 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800"></div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="staff.length === 0"
          class="flex min-h-[min(280px,calc(100svh-14rem))] flex-1 flex-col items-center justify-center px-4 py-14 text-center sm:px-6"
        >
          <div
            class="mx-3 max-w-md rounded-2xl border border-dashed border-gray-200/90 bg-gradient-to-b from-gray-50/90 to-transparent px-6 py-12 dark:border-gray-700/70 dark:from-gray-900/40 dark:to-transparent sm:mx-6"
          >
            <div
              class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200/80 bg-white/90 dark:border-gray-700/80 dark:bg-gray-900/60"
            >
              <UsersIcon class="h-7 w-7 text-primary-500 dark:text-primary-400" stroke-width="1.35" />
            </div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
              Empty roster
            </p>
            <h2 class="mt-2 text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-50">
              No staff members yet
            </h2>
            <p class="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Add people to this department to assign roles, track status, and control access.
            </p>
          </div>
        </div>

        <div v-else class="min-h-0 flex-1 overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100/90 dark:divide-gray-800/80">
            <thead class="bg-gray-50/95 dark:bg-gray-900/55">
              <tr>
                <th v-if="canManageDepartments" class="w-10 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-5">
                  <Checkbox
                    :model-value="paginatedStaff.length > 0 && selectedStaffForBulk.length === paginatedStaff.length"
                    @update:model-value="toggleSelectAllStaff"
                    size="sm"
                    wrapper-class="justify-center"
                  />
                </th>
                <th class="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:table-cell sm:px-5">Position</th>
                <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-5">Role</th>
                <th class="hidden px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell md:px-5">Email</th>
                <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-5">Status</th>
                <th
                  v-if="canManageDepartments"
                  class="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-5"
                >
                  Action
                </th>
                  <th class="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:px-5">Name</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100/90 bg-white/80 dark:divide-gray-800/80 dark:bg-gray-950/20">
              <tr
                v-for="member in paginatedStaff"
                :key="member.id"
                class="transition-colors hover:bg-gray-50/90 dark:hover:bg-gray-900/35"
              >
              <td v-if="canManageDepartments" class="w-10 px-4 py-3 text-center sm:px-5">
                <Checkbox
                  :model-value="selectedStaffForBulk.some(s => s.id === member.id)"
                  @update:model-value="(checked) => toggleStaffSelection(member, checked)"
                  size="sm"
                  wrapper-class="justify-center"
                  @click.stop
                />
              </td>
              <td class="px-4 py-3 sm:px-5">
                <span class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ member.firstName }} {{ member.lastName }}</span>
              </td>
              <td class="hidden px-4 py-3 sm:table-cell sm:px-5">
                <span class="text-xs text-gray-600 dark:text-gray-300">{{ member.position }}</span>
              </td>
              <td class="px-4 py-3 sm:px-5">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize tracking-wide ring-1 ring-inset"
                  :class="[
                    member.role === 'manager'
                      ? 'bg-primary-500/10 text-primary-700 ring-primary-500/20 dark:bg-primary-400/10 dark:text-primary-300 dark:ring-primary-400/25'
                      : member.role === 'intern'
                        ? 'bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:bg-blue-400/10 dark:text-blue-300 dark:ring-blue-400/25'
                        : 'bg-gray-500/10 text-gray-700 ring-gray-500/15 dark:bg-gray-400/10 dark:text-gray-300 dark:ring-gray-500/20',
                  ]"
                >
                  {{ member.role }}
                </span>
              </td>
              <td class="hidden px-4 py-3 md:table-cell md:px-5">
                <span class="max-w-[150px] truncate text-xs text-gray-600 dark:text-gray-300">{{ member.email }}</span>
              </td>
              <td class="px-4 py-3 sm:px-5">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize tracking-wide ring-1 ring-inset"
                  :class="[
                    member.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25'
                      : member.status === 'on_leave'
                        ? 'bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25'
                        : 'bg-red-500/10 text-red-800 ring-red-500/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25',
                  ]"
                >
                  {{ member.status === 'on_leave' ? 'On Leave' : member.status }}
                </span>
              </td>
              <td v-if="canManageDepartments" class="px-4 py-3 sm:px-5">
                <div class="hidden shrink-0 items-center justify-end gap-1 sm:flex" @click.stop>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg border border-transparent p-1.5 text-gray-500 transition-colors hover:border-gray-200/90 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-900/60 dark:hover:text-blue-400"
                    :title="`Change role to ${getNextRoleLabel(member.role)}`"
                    @click="handleToggleStaffRole(member)"
                  >
                    <UserGroupIcon class="h-3.5 w-3.5 shrink-0" />
                  </button>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg border border-transparent p-1.5 text-gray-500 transition-colors hover:border-gray-200/90 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-900/60 dark:hover:text-gray-100"
                    title="Edit"
                    @click="handleEditStaff(member)"
                  >
                    <PencilSquareIcon class="h-3.5 w-3.5 shrink-0" />
                  </button>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg border border-transparent p-1.5 text-gray-500 transition-colors hover:border-red-200/80 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:border-red-800/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    title="Delete"
                    @click="handleDeleteStaff(member)"
                  >
                    <TrashIcon class="h-3.5 w-3.5 shrink-0" />
                  </button>
                </div>
                <div class="relative sm:hidden" @click.stop>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg border border-transparent p-1.5 text-gray-500 transition-colors hover:border-gray-200/90 hover:bg-gray-50 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-900/60"
                    title="Actions"
                    @click="toggleStaffMenu(member.id)"
                  >
                    <EllipsisVerticalIcon class="h-4 w-4 shrink-0" />
                  </button>
                  <div
                    v-if="openStaffMenuId === member.id"
                    class="absolute right-0 top-9 z-50 min-w-[44px] overflow-hidden rounded-xl border border-gray-200/90 bg-white/95 py-1 backdrop-blur-xl dark:border-gray-700/80 dark:bg-slate-950/95"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center justify-center px-3 py-2.5 text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/25"
                      :title="`Change role to ${getNextRoleLabel(member.role)}`"
                      @click="handleToggleStaffRole(member); openStaffMenuId = null"
                    >
                      <UserGroupIcon class="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center justify-center px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80"
                      title="Edit"
                      @click="handleEditStaff(member); openStaffMenuId = null"
                    >
                      <PencilSquareIcon class="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center justify-center px-3 py-2.5 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/35"
                      title="Delete"
                      @click="handleDeleteStaff(member); openStaffMenuId = null"
                    >
                      <TrashIcon class="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>

    <div
      v-if="staff.length > 0 && !isStaffFullscreen"
      class="fixed bottom-0 left-0 right-0 z-30 rounded-none border-t border-gray-200/90 bg-white/95 backdrop-blur-md transition-[left] duration-300 dark:border-gray-800/80 dark:bg-gray-950/95 safe-area-inset-bottom"
      :class="sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'"
    >
      <Pagination
        :current-page="staffCurrentPage"
        :items-per-page="staffItemsPerPage"
        :total="staff.length"
        @page-change="handleStaffPageChange"
      />
    </div>

    <div
      v-if="isStaffFullscreen && staff.length > 0"
      class="sticky bottom-0 z-10 rounded-none border-t border-gray-200/90 bg-white/95 px-4 py-2 backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/95 sm:px-6"
    >
      <Pagination
        :current-page="staffCurrentPage"
        :items-per-page="staffItemsPerPage"
        :total="staff.length"
        @page-change="handleStaffPageChange"
      />
    </div>

    <DraggableFabContainer
      v-if="canCreateNewStaff && !isLoadingStaff"
      :storage-key="`storv-fab:dept-staff:${departmentId}`"
      layout="row"
      anchor-class="bottom-24 right-6"
    >
      <div class="group relative overflow-visible">
        <span
          class="pointer-events-none absolute right-full top-1/2 z-50 mr-2 inline-flex min-w-max max-w-none -translate-y-1/2 items-center justify-center whitespace-nowrap rounded-full border border-gray-700/50 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 dark:border-gray-600/50 dark:bg-gray-800"
        >
          Add staff
        </span>
        <button
          type="button"
          @click="openCreateStaffModal"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white ring-2 ring-primary-500/25 transition-all duration-200 hover:scale-105 hover:bg-primary-600 active:scale-95 dark:ring-primary-400/20"
          title="Add new staff"
        >
          <PlusIcon class="h-5 w-5 stroke-white" stroke-width="2.5" />
        </button>
      </div>
    </DraggableFabContainer>

    <!-- Bulk Delete Staff Modal -->
    <Modal
      v-model="showBulkDeleteStaffModal"
      @update:model-value="(v: boolean) => { showBulkDeleteStaffModal = v; if (!v) bulkDeleteStaffConfirmed = false }"
      size="md"
    >
      <template #header>
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrashIcon class="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Delete selected staff</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedStaffForBulk.length }} staff member{{ selectedStaffForBulk.length !== 1 ? 's' : '' }} selected</p>
          </div>
        </div>
      </template>
      <div class="space-y-3">
        <div class="p-3 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/50 dark:ring-red-800/40 rounded-xl">
          <p class="text-xs text-red-800 dark:text-red-200">This will permanently remove the selected staff members from this department. This action cannot be undone.</p>
        </div>
        <div class="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
          <Checkbox
            v-model="bulkDeleteStaffConfirmed"
            label="I understand that these staff members will be permanently removed."
            size="sm"
            wrapper-class="items-start"
            label-class="text-xs text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="outline" size="sm" @click="showBulkDeleteStaffModal = false; bulkDeleteStaffConfirmed = false" class="!rounded-lg">Cancel</Button>
        <Button
          variant="danger"
          size="sm"
          :disabled="!bulkDeleteStaffConfirmed || isBulkDeletingStaff"
          :icon="TrashIcon"
          class="!rounded-lg"
          @click="handleConfirmBulkDeleteStaff"
        >
          {{ isBulkDeletingStaff ? 'Deleting...' : `Delete ${selectedStaffForBulk.length} staff member${selectedStaffForBulk.length !== 1 ? 's' : ''}` }}
        </Button>
      </template>
    </Modal>
    <!-- Staff Modal -->
    <StaffModal
      v-if="departmentId"
      v-model="showStaffModal"
      :department-id="departmentId"
      :staff="editingStaff"
      @success="handleStaffSuccess"
      @error="handleStaffError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import {
  ArrowLeftIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserCircleIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  ClipboardDocumentIcon,
} from '@heroicons/vue/24/outline'
import DraggableFabContainer from '~/components/ui/DraggableFabContainer.vue'
import Button from '~/components/ui/Button.vue'
import Breadcrumbs from '~/components/ui/Breadcrumbs.vue'
import Pagination from '~/components/ui/Pagination.vue'
import Modal from '~/components/ui/Modal.vue'
import Checkbox from '~/components/ui/Checkbox.vue'
import StaffModal from '~/components/departments/StaffModal.vue'
import StaffInvitePasswordsPanel from '~/components/departments/StaffInvitePasswordsPanel.vue'
import StatCard from '~/components/ui/StatCard.vue'
import { useDepartmentsStore } from '~/stores/departments'
import { useStaffStore } from '~/stores/staff'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import type { Department } from '~/composables/useDepartments'
import type { Staff } from '~/composables/useStaff'
import { usePermissions } from '~/composables/usePermissions'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'dashboard',
  key: (route) => `department-${route.params.id}`, // Force re-mount when ID changes
  middleware: 'auth', // Ensure auth middleware runs
  ssr: false // Disable SSR for client-side navigation
})

const route = useRoute()
const departmentId = computed(() => route.params.id as string)

const departmentBreadcrumbs = computed(() => [
  { label: 'Departments', href: '/dashboard/departments', icon: BuildingOfficeIcon },
  { label: department.value?.name || 'Department', icon: UsersIcon },
])

const department = ref<Department | null>(null)
const staff = ref<Staff[]>([])
const isLoadingDepartment = ref(true)
const isLoadingStaff = ref(true)

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

// Staff modal
const showStaffModal = ref(false)
const editingStaff = ref<Staff | null>(null)

// Bulk delete staff
const selectedStaffForBulk = ref<Staff[]>([])
const showBulkDeleteStaffModal = ref(false)
const bulkDeleteStaffConfirmed = ref(false)
const isBulkDeletingStaff = ref(false)
const toast = useToast()

const departmentsStore = useDepartmentsStore()
const staffStore = useStaffStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const sidebarCollapsed = ref(false)
const isStaffFullscreen = ref(false)
const openStaffMenuId = ref<string | null>(null)

const toggleStaffMenu = (staffId: string) => {
  openStaffMenuId.value = openStaffMenuId.value === staffId ? null : staffId
}

// Handle ESC key to exit fullscreen and close menus
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isStaffFullscreen.value) {
      isStaffFullscreen.value = false
    }
    openStaffMenuId.value = null
  }
}

// Watch fullscreen state to lock/unlock body scroll
watch(isStaffFullscreen, (fullscreen) => {
  if (import.meta.client) {
    if (fullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Load sidebar state from localStorage
if (import.meta.client) {
  try {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true'
    }
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Watch for sidebar state changes
if (import.meta.client) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'sidebarCollapsed' && e.newValue !== null) {
      sidebarCollapsed.value = e.newValue === 'true'
    }
  })
  // Also check periodically for changes (since storage event doesn't fire on same window)
  setInterval(() => {
    try {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        const newValue = savedState === 'true'
        if (newValue !== sidebarCollapsed.value) {
          sidebarCollapsed.value = newValue
        }
      }
    } catch (e) {
      // Ignore
    }
  }, 100)
}

// Check if current user is staff (limited permissions)
const isStaff = computed(() => userStore.userData?.role === 'staff')
// Check if current user is a manager in the department (even if they're a super admin)
const isManager = computed(() => {
  if (!department.value || !currentStaffMember.value) return false
  return currentStaffMember.value.role === 'manager' && 
         currentStaffMember.value.departmentId === department.value.id
})
// Get permissions
const { canCreateStaff, canManage } = usePermissions()
// Only super admins can create staff (managers cannot create staff)
// Managers can edit/delete staff but not create new staff
const canManageDepartments = computed(() => canManage.value)
const canCreateNewStaff = computed(() => canCreateStaff.value)

// Current staff member (for staff users and to check manager status)
const currentStaffMember = ref<Staff | null>(null)

const paginatedStaff = computed(() => {
  const start = (staffCurrentPage.value - 1) * staffItemsPerPage.value
  const end = start + staffItemsPerPage.value
  return staff.value.slice(start, end)
})

const toggleStaffSelection = (member: Staff, checked: boolean) => {
  const idx = selectedStaffForBulk.value.findIndex(s => s.id === member.id)
  if (checked && idx === -1) selectedStaffForBulk.value.push(member)
  else if (!checked && idx !== -1) selectedStaffForBulk.value.splice(idx, 1)
}
const toggleSelectAllStaff = (checked: boolean) => {
  if (checked) selectedStaffForBulk.value = [...paginatedStaff.value]
  else selectedStaffForBulk.value = []
}
const openBulkDeleteStaffModal = () => {
  bulkDeleteStaffConfirmed.value = false
  showBulkDeleteStaffModal.value = true
}
const handleConfirmBulkDeleteStaff = async () => {
  if (!bulkDeleteStaffConfirmed.value || selectedStaffForBulk.value.length === 0) return
  isBulkDeletingStaff.value = true
  const ids = selectedStaffForBulk.value.map(s => s.id)
  const count = ids.length
  try {
    for (const id of ids) {
      await staffStore.deleteStaff(id)
    }
    selectedStaffForBulk.value = []
    showBulkDeleteStaffModal.value = false
    bulkDeleteStaffConfirmed.value = false
    await loadDepartmentData()
    toast.success(`${count} staff member${count !== 1 ? 's' : ''} deleted`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to delete some staff members')
  } finally {
    isBulkDeletingStaff.value = false
  }
}

// Computed stats for compact header
const totalManagers = computed(() => {
  return staff.value.filter(m => m.role === 'manager').length
})

const activeStaff = computed(() => {
  return staff.value.filter(m => m.status === 'active').length
})

const onLeaveStaff = computed(() => {
  return staff.value.filter(m => m.status === 'on_leave').length
})

// Computed property for current manager name
const currentManager = computed(() => {
  const manager = staff.value.find(m => m.role === 'manager')
  if (manager) {
    return `${manager.firstName} ${manager.lastName}`
  }
  return 'Not assigned'
})


// Load department and staff data
const loadDepartmentData = async () => {
  // Fetch user data if authenticated and not already loaded
  if (authStore.currentUser?.uid && !userStore.userData) {
    await userStore.fetchUserData(authStore.currentUser.uid)
  }

  if (!departmentId.value || typeof departmentId.value !== 'string') {
    console.error('Invalid department ID:', departmentId.value)
    navigateTo('/dashboard/departments')
    return
  }

  // Staff may only open their own department
  if (userStore.userData?.role === 'staff') {
    try {
      const member = await staffStore.fetchCurrentStaffMember()
      if (!member?.departmentId) {
        await navigateTo('/dashboard/departments')
        return
      }
      if (departmentId.value !== member.departmentId) {
        await navigateTo(`/dashboard/departments/${member.departmentId}`)
        return
      }
    } catch {
      await navigateTo('/dashboard/departments')
      return
    }
  }

  isLoadingDepartment.value = true
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
      navigateTo('/dashboard/departments')
      return
    }

    // Load staff for this department using Pinia store
    await staffStore.fetchStaffByDepartment(departmentId.value)
    // Get staff from store getter (it's a function that takes departmentId)
    staff.value = staffStore.getStaffByDepartment(departmentId.value)

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
    navigateTo('/dashboard/departments')
  } finally {
    isLoadingDepartment.value = false
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

// Cycle through roles: Intern → Staff → Manager → Intern
const ROLE_ORDER: ('intern' | 'staff' | 'manager')[] = ['intern', 'staff', 'manager']
function getNextRole(current: 'intern' | 'staff' | 'manager'): 'intern' | 'staff' | 'manager' {
  const idx = ROLE_ORDER.indexOf(current)
  const nextIdx = idx < 0 ? 1 : (idx + 1) % ROLE_ORDER.length
  return ROLE_ORDER[nextIdx]!
}
function getNextRoleLabel(current: 'intern' | 'staff' | 'manager'): string {
  const next = getNextRole(current)
  return next.charAt(0).toUpperCase() + next.slice(1)
}

const handleToggleStaffRole = async (staffMember: Staff) => {
  const { useToast } = await import('~/composables/useToast')
  const toast = useToast()
  
  const newRole = getNextRole(staffMember.role)
  const roleLabel = getNextRoleLabel(staffMember.role)
  
  // Optimistically update the UI
  const staffIndex = staff.value.findIndex(s => s.id === staffMember.id)
  let originalRole: 'manager' | 'staff' | 'intern' | null = null
  
  if (staffIndex > -1 && staff.value[staffIndex]) {
    originalRole = staff.value[staffIndex].role
    staff.value[staffIndex].role = newRole
  }
  
  try {
    await staffStore.updateStaff(staffMember.id, {
      role: newRole,
    })
    
    if (department.value) {
      const manager = staff.value.find(m => m.role === 'manager')
      if (manager) {
        department.value.manager = `${manager.firstName} ${manager.lastName}`
      } else {
        department.value.manager = 'Not assigned'
      }
    }
    
    staffStore.fetchStaffByDepartment(departmentId.value).then(() => {
      staff.value = staffStore.getStaffByDepartment(departmentId.value)
      departmentsStore.fetchDepartment(departmentId.value).then(() => {
        const updatedDept = departmentsStore.getDepartmentById(departmentId.value)
        if (updatedDept) department.value = updatedDept
      }).catch(console.error)
    }).catch(console.error)
    
    toast.success(`${staffMember.firstName} ${staffMember.lastName} set to ${roleLabel}`)
  } catch (error: any) {
    if (staffIndex > -1 && originalRole !== null && staff.value[staffIndex]) {
      staff.value[staffIndex].role = originalRole
    }
    toast.error(error.message || 'Failed to update staff role')
  }
}

const handleDeleteStaff = async (staffMember: Staff) => {
  if (confirm(`Are you sure you want to delete ${staffMember.firstName} ${staffMember.lastName}? This action cannot be undone.`)) {
    try {
      await staffStore.deleteStaff(staffMember.id)
      await loadDepartmentData() // Reload to update staff list and counts
      alert('Staff member deleted successfully')
    } catch (error: any) {
      alert(error.message || 'Failed to delete staff member')
    }
  }
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
  ]).then(() => {
    console.log('[Department Page] Staff list refreshed after creation')
  }).catch((error: any) => {
    console.error('Error refreshing staff after creation:', error)
  }).finally(() => {
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
watch(() => route.params.id, (newDeptId) => {
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
}, { immediate: false })

// Watch for route parameter changes when navigating between departments
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId && typeof newId === 'string') {
    // Clear previous data
    department.value = null
    staff.value = []
    isLoadingDepartment.value = true
    isLoadingStaff.value = true
    // Load new data
    try {
      await loadDepartmentData()
    } catch (error) {
      console.error('Error loading department data:', error)
    }
  }
}, { immediate: false })

onMounted(async () => {
  // Add keyboard listener for ESC key
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.relative')) {
        openStaffMenuId.value = null
      }
    })
  }

  if (import.meta.server) return

  // Wait for auth and user data to load
  let attempts = 0
  while ((authStore.loading || !userStore.userData) && attempts < 100) {
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }
  
  // Check if user is staff/intern and redirect
  if (userStore.userData?.role === 'staff') {
    console.log('[DepartmentDetailPage] Staff user detected - redirecting to dashboard')
    await navigateTo('/dashboard')
    return
  }

  // Load data immediately
  await loadDepartmentData()
})

// Cleanup keyboard listener and restore body overflow
onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
  }
})
</script>

