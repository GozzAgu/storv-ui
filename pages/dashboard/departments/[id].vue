<template>
  <div
    class="dashboard-page-with-footer flex min-h-[calc(100svh-4rem)] w-full max-w-none flex-col space-y-5 overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:space-y-6 sm:pb-32"
  >
    <Breadcrumbs
      :items="departmentBreadcrumbs"
      class="text-[11px] text-gray-500 dark:text-gray-400"
    />

    <StaffInvitePasswordsPanel
      v-if="departmentId"
      :department-id="departmentId"
      :can-show="canCreateNewStaff"
    />

    <Teleport to="body" :disabled="!isStaffFullscreen">
      <div
        data-dashboard-teleport
        :class="[
          'flex min-h-0 flex-col transition-colors duration-200 ease-out',
          isStaffFullscreen
            ? 'fixed inset-0 z-[100] flex min-h-0 flex-col overflow-hidden bg-white dark:!bg-dashboard-card'
            : 'relative flex-1',
        ]"
      >
        <!-- Fullscreen header (same pattern as receipts) -->
        <div
          v-if="isStaffFullscreen"
          class="shrink-0 border-b border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-gray-800/80 dark:!bg-dashboard-card/95 sm:px-6 lg:px-8"
          style="padding-top: max(0.75rem, env(safe-area-inset-top, 0px))"
        >
          <div
            class="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
          >
            <div class="flex min-w-0 items-start justify-between gap-3 lg:items-center">
              <div class="min-w-0">
                <p
                  class="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500"
                >
                  Expanded view
                </p>
                <div class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h2
                    class="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-lg"
                  >
                    {{ department?.name || 'Department' }}
                  </h2>
                  <span class="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                    {{ staff.length }} members · {{ activeStaff }} active ·
                    {{ totalManagers }} managers
                  </span>
                </div>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-sm border border-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100 lg:hidden"
                aria-label="Exit expanded view"
                @click="isStaffFullscreen = false"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
            <div class="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
              <Button
                v-if="canCreateNewStaff"
                variant="primary"
                size="sm"
                :icon="UserIcon"
                extra-class="!rounded-2xl"
                @click="openCreateStaffModal"
              >
                Add staff
              </Button>
              <button
                type="button"
                class="hidden rounded-sm border border-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100 lg:inline-flex"
                aria-label="Exit expanded view"
                @click="isStaffFullscreen = false"
              >
                <XMarkIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          :class="[
            'data-table-shell flex min-h-0 flex-col',
            isStaffFullscreen ? 'min-h-0 flex-1 overflow-hidden' : 'overflow-hidden',
          ]"
        >
          <div
            v-if="canRemoveStaff && rosterTab === 'active' && selectedStaffForBulk.length > 0"
            class="flex flex-wrap items-center gap-2 border-b border-gray-100/90 bg-primary-50/60 px-4 py-2.5 dark:border-gray-800/80 dark:bg-primary-900/15 sm:px-5"
          >
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300"
              >{{ selectedStaffForBulk.length }} selected</span
            >
            <Button
              variant="outline"
              size="sm"
              :icon="TrashIcon"
              class="!rounded-2xl-red-200 dark:!border-red-800 !text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20"
              @click="openBulkDeleteStaffModal"
            >
              Delete ({{ selectedStaffForBulk.length }})
            </Button>
          </div>

          <!-- Table toolbar -->
          <DataTableToolbar v-if="!isLoadingStaff && !isStaffFullscreen">
            <template #heading>
              <div class="flex min-w-0 flex-1 items-start gap-2">
                <DashboardBackButton
                  v-if="departmentsListPath"
                  :to="departmentsListPath"
                  label="Back to departments"
                  class="mt-0.5"
                />
                <div class="min-w-0 flex-1">
                  <h2
                    class="truncate text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm"
                  >
                    {{ department?.name || 'Department' }}
                  </h2>
                  <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <span class="tabular-nums font-medium text-gray-600 dark:text-gray-300"
                      >{{ staff.length }} members</span
                    >
                    <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                    <span class="tabular-nums">{{ activeStaff }} active</span>
                    <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                    <span class="tabular-nums">{{ totalManagers }} managers</span>
                    <template v-if="staff.length > 0">
                      <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                      <span>{{ paginatedStaff.length }} on this page</span>
                    </template>
                  </p>
                </div>
              </div>
            </template>
            <template #actions>
              <Button
                v-if="
                  canCreateNewStaff &&
                  !(rosterTab === 'active' && staff.length === 0 && !isLoadingStaff)
                "
                variant="primary"
                size="sm"
                :icon="UserIcon"
                :extra-class="headerBtnClass"
                @click="openCreateStaffModal"
              >
                Add staff
              </Button>
              <DashboardToolbarIconButton
                class="hidden lg:inline-flex"
                aria-label="Expand table"
                @click="isStaffFullscreen = true"
              >
                <ArrowsPointingOutIcon class="h-4 w-4" />
              </DashboardToolbarIconButton>
            </template>
          </DataTableToolbar>

          <nav
            v-if="canRemoveStaff && !isLoadingStaff && !isStaffFullscreen"
            class="flex gap-6 border-b border-gray-100/90 px-4 dark:border-gray-800/80 sm:gap-8 sm:px-5"
            role="tablist"
            aria-label="Staff roster"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="rosterTab === 'active'"
              class="relative pb-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 rounded-t"
              :class="
                rosterTab === 'active'
                  ? 'text-gray-900 dark:text-gray-100 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              "
              @click="rosterTab = 'active'"
            >
              Active
              <span class="tabular-nums">({{ staff.length }})</span>
              <span
                class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity"
                :class="
                  rosterTab === 'active' ? 'bg-primary-500 opacity-100' : 'bg-transparent opacity-0'
                "
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="rosterTab === 'removed'"
              class="relative pb-2.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 rounded-t"
              :class="
                rosterTab === 'removed'
                  ? 'text-gray-900 dark:text-gray-100 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              "
              @click="rosterTab = 'removed'"
            >
              Removed
              <span class="tabular-nums">({{ removedStaff.length }})</span>
              <span
                class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-opacity"
                :class="
                  rosterTab === 'removed'
                    ? 'bg-primary-500 opacity-100'
                    : 'bg-transparent opacity-0'
                "
                aria-hidden="true"
              />
            </button>
          </nav>

          <div
            v-if="isLoadingStaff"
            class="min-h-[min(420px,calc(100svh-16rem))] flex-1 overflow-x-auto"
          >
            <div class="space-y-3 p-4 sm:p-6">
              <div v-for="i in 6" :key="i" class="flex items-center gap-4">
                <div class="h-10 w-10 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"></div>
                <div class="flex-1 space-y-2">
                  <div
                    class="h-4 w-1/3 animate-pulse rounded-sm bg-gray-200 dark:bg-white/10"
                  ></div>
                  <div class="h-3 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-white/10"></div>
                </div>
              </div>
            </div>
          </div>

          <DashboardTableEmptyState
            v-else-if="rosterTab === 'active' && staff.length === 0"
            :icon="UsersIcon"
            eyebrow="Empty roster"
            title="No staff members yet"
            description="Add people to this department to assign roles, track status, and control access."
            :tips="[
              'Managers can invite staff and set permissions',
              'Staff sign in with the email and temporary password you provide',
            ]"
          >
            <Button
              v-if="canCreateNewStaff"
              variant="primary"
              size="sm"
              :icon="UserIcon"
              extra-class="!rounded-2xl"
              @click="openCreateStaffModal"
            >
              Add staff
            </Button>
          </DashboardTableEmptyState>

          <DashboardTableEmptyState
            v-else-if="rosterTab === 'removed' && removedStaff.length === 0"
            :icon="UsersIcon"
            eyebrow="Removed staff"
            title="No removed staff"
            description="When you remove someone from this department, they appear here. You can reactivate them to restore sign-in access."
          >
            <Button
              variant="outline"
              size="sm"
              extra-class="!rounded-2xl"
              @click="rosterTab = 'active'"
            >
              View active staff
            </Button>
          </DashboardTableEmptyState>

          <div
            v-else
            :class="[
              'flex min-h-0 flex-1 flex-col gap-3',
              isStaffFullscreen ? 'overflow-auto px-4 pb-2 pt-2 lg:px-8' : '',
            ]"
          >
            <template v-if="rosterTab === 'active'">
              <div v-if="!isStaffFullscreen" class="dept-staff-mobile-list space-y-2.5 px-0.5 md:hidden">
                <div
                  v-for="member in paginatedStaff"
                  :key="`mobile-${member.id}`"
                  class="rounded-xl bg-white/95 p-3 shadow-none backdrop-blur-sm dark:bg-white/[0.04]"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div v-if="canRemoveStaff" class="pt-0.5" @click.stop>
                      <Checkbox
                        :model-value="selectedStaffForBulk.some((s) => s.id === member.id)"
                        @update:model-value="(checked) => toggleStaffSelection(member, checked)"
                        size="sm"
                        wrapper-class="justify-center"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {{ member.firstName }} {{ member.lastName }}
                      </p>
                      <p
                        v-if="member.position"
                        class="mt-0.5 text-xs text-gray-600 dark:text-gray-400"
                      >
                        {{ member.position }}
                      </p>
                      <p class="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-500">
                        {{ member.email }}
                      </p>
                      <div class="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide ring-1 ring-inset"
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
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide ring-1 ring-inset"
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
                      </div>
                    </div>
                    <div v-if="canManageDepartments" class="shrink-0" @click.stop>
                      <button
                        type="button"
                        :data-staff-actions-anchor="member.id"
                        class="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/80"
                        :aria-expanded="openStaffMenuId === member.id"
                        aria-haspopup="menu"
                        :aria-label="`Actions for ${member.firstName} ${member.lastName}`"
                        @click="toggleStaffMenu(member.id)"
                      >
                        <EllipsisVerticalIcon class="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                :class="[
                  'dept-staff-table-wrap',
                  isStaffFullscreen
                    ? 'min-h-0 overflow-auto'
                    : 'hidden min-h-0 overflow-x-auto md:block',
                ]"
              >
                <table class="dashboard-table min-w-full">
                  <thead :class="isStaffFullscreen ? 'sticky top-0 z-10' : ''">
                    <tr>
                      <th v-if="canRemoveStaff" class="w-10 text-center">
                        <Checkbox
                          :model-value="
                            paginatedStaff.length > 0 &&
                            selectedStaffForBulk.length === paginatedStaff.length
                          "
                          @update:model-value="toggleSelectAllStaff"
                          size="sm"
                          wrapper-class="justify-center"
                        />
                      </th>
                      <th>Name</th>
                      <th class="hidden sm:table-cell">Position</th>
                      <th>Role</th>
                      <th class="hidden md:table-cell">Email</th>
                      <th class="dashboard-table__col-status">Status</th>
                      <th v-if="canManageDepartments" class="dashboard-table__col-actions">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="member in paginatedStaff" :key="member.id">
                      <td v-if="canRemoveStaff" class="text-center">
                        <Checkbox
                          :model-value="selectedStaffForBulk.some((s) => s.id === member.id)"
                          @update:model-value="(checked) => toggleStaffSelection(member, checked)"
                          size="sm"
                          wrapper-class="justify-center"
                          @click.stop
                        />
                      </td>
                      <td>
                        <span class="dashboard-table__primary"
                          >{{ member.firstName }} {{ member.lastName }}</span
                        >
                      </td>
                      <td class="hidden sm:table-cell">
                        <span class="dashboard-table__muted">{{
                          member.position || EMPTY_CELL
                        }}</span>
                      </td>
                      <td>
                        <DashboardTableBadge
                          :badge-class="staffRoleBadgeClass(member.role)"
                          :label="member.role"
                        />
                      </td>
                      <td class="hidden md:table-cell">
                        <span class="dashboard-table__muted block max-w-[12rem] truncate">{{
                          member.email
                        }}</span>
                      </td>
                      <td class="dashboard-table__col-status">
                        <DashboardTableBadge
                          :badge-class="staffStatusBadgeClass(member.status)"
                          :label="formatStaffStatusLabel(member.status)"
                        />
                      </td>
                      <td v-if="canManageDepartments" class="dashboard-table__col-actions">
                        <div class="flex justify-end" @click.stop>
                          <button
                            type="button"
                            :data-staff-actions-anchor="member.id"
                            class="dashboard-table__action-btn"
                            :aria-expanded="openStaffMenuId === member.id"
                            aria-haspopup="menu"
                            :aria-label="`Actions for ${member.firstName} ${member.lastName}`"
                            @click="toggleStaffMenu(member.id)"
                          >
                            <EllipsisVerticalIcon class="h-4 w-4 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <template v-else>
              <div v-if="!isStaffFullscreen" class="dept-staff-mobile-list space-y-2.5 px-0.5 md:hidden">
                <div
                  v-for="member in paginatedRemovedStaff"
                  :key="`removed-mobile-${member.id}`"
                  class="rounded-xl bg-white/95 p-3 shadow-none backdrop-blur-sm dark:bg-white/[0.04]"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {{ member.firstName }} {{ member.lastName }}
                      </p>
                      <p
                        v-if="member.position"
                        class="mt-0.5 text-xs text-gray-600 dark:text-gray-400"
                      >
                        {{ member.position }}
                      </p>
                      <p class="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-500">
                        {{ member.email }}
                      </p>
                      <div class="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide ring-1 ring-inset"
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
                        <span
                          class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize tracking-wide ring-1 ring-inset bg-red-500/10 text-red-800 ring-red-500/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25"
                        >
                          Removed
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="shrink-0 rounded-lg p-1.5 text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50 dark:text-primary-400 dark:hover:bg-primary-900/25"
                      :disabled="reactivateBusyId === member.id"
                      :aria-label="reactivateBusyId === member.id ? 'Reactivating…' : 'Reactivate'"
                      @click="openReactivateStaffModal(member)"
                    >
                      <ArrowUturnLeftIcon class="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div
                :class="[
                  'dept-staff-table-wrap',
                  isStaffFullscreen
                    ? 'min-h-0 overflow-auto'
                    : 'hidden min-h-0 overflow-x-auto md:block',
                ]"
              >
                <table class="dashboard-table min-w-full">
                  <thead :class="isStaffFullscreen ? 'sticky top-0 z-10' : ''">
                    <tr>
                      <th>Name</th>
                      <th class="hidden sm:table-cell">Position</th>
                      <th>Role</th>
                      <th class="hidden md:table-cell">Email</th>
                      <th class="dashboard-table__col-status">Status</th>
                      <th class="dashboard-table__col-actions">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="member in paginatedRemovedStaff" :key="member.id">
                      <td>
                        <span class="dashboard-table__primary"
                          >{{ member.firstName }} {{ member.lastName }}</span
                        >
                      </td>
                      <td class="hidden sm:table-cell">
                        <span class="dashboard-table__muted">{{
                          member.position || EMPTY_CELL
                        }}</span>
                      </td>
                      <td>
                        <DashboardTableBadge
                          :badge-class="staffRoleBadgeClass(member.role)"
                          :label="member.role"
                        />
                      </td>
                      <td class="hidden md:table-cell">
                        <span class="dashboard-table__muted block max-w-[12rem] truncate">{{
                          member.email
                        }}</span>
                      </td>
                      <td class="dashboard-table__col-status">
                        <DashboardTableBadge
                          badge-class="bg-red-500/10 text-red-800 ring-red-500/20 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25"
                          label="Removed"
                        />
                      </td>
                      <td class="dashboard-table__col-actions">
                        <div class="dashboard-table__action-group" @click.stop>
                          <button
                            type="button"
                            class="dashboard-table__action-btn text-primary-600 hover:!text-primary-700 dark:text-primary-400 dark:hover:!text-primary-300"
                            :disabled="reactivateBusyId === member.id"
                            :aria-label="reactivateBusyId === member.id ? 'Reactivating…' : 'Reactivate'"
                            @click="openReactivateStaffModal(member)"
                          >
                            <ArrowUturnLeftIcon class="h-3.5 w-3.5 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <DashboardTablePagination
              v-if="rosterPaginationTotal > 0 && !isStaffFullscreen"
              :current-page="staffCurrentPage"
              :items-per-page="staffItemsPerPage"
              :total="rosterPaginationTotal"
              @page-change="handleStaffPageChange"
            />

            <!-- Fullscreen: pagination pinned inside overlay -->
            <DashboardTablePagination
              v-if="isStaffFullscreen && rosterPaginationTotal > 0"
              :pin-to-viewport="false"
              class="shrink-0"
              style="padding-bottom: env(safe-area-inset-bottom, 0px)"
              :current-page="staffCurrentPage"
              :items-per-page="staffItemsPerPage"
              :total="rosterPaginationTotal"
              @page-change="handleStaffPageChange"
            />
          </div>
        </div>
      </div>
    </Teleport>

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

    <!-- Staff ⋮ menu (teleported so table overflow does not clip it) -->
    <Teleport :to="menuTeleportTarget">
      <div
        v-if="openStaffMenuId && staffForOpenMenu && staffMenuFixedStyle"
        data-staff-menu
        role="menu"
        :class="[
          'fixed min-w-[10rem] overflow-hidden rounded-lg bg-white/95 py-1 shadow-lg backdrop-blur-xl dark:bg-slate-950/95',
          isNativeApp ? 'z-[1100]' : 'z-[1000]',
        ]"
        :style="staffMenuFixedStyle"
        @click.stop
      >
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/25"
          :disabled="!!roleToggleBusyId && roleToggleBusyId !== staffForOpenMenu.id"
          @click="
            () => {
              handleToggleStaffRole(staffForOpenMenu)
              openStaffMenuId = null
            }
          "
        >
          <ArrowPathIcon
            class="h-4 w-4 shrink-0"
            :class="{ 'animate-spin': roleToggleBusyId === staffForOpenMenu.id }"
          />
          {{
            roleToggleBusyId === staffForOpenMenu.id
              ? 'Updating…'
              : `Switch to ${getNextStaffRoleLabel(staffForOpenMenu.role)}`
          }}
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/80"
          @click="
            () => {
              handleEditStaff(staffForOpenMenu)
              openStaffMenuId = null
            }
          "
        >
          <PencilSquareIcon class="h-4 w-4 shrink-0" />
          Edit
        </button>
        <button
          v-if="canMoveStaff"
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/35"
          @click="
            () => {
              openMoveStaffModal(staffForOpenMenu)
              openStaffMenuId = null
            }
          "
        >
          <ArrowsRightLeftIcon class="h-4 w-4 shrink-0" />
          Move department
        </button>
        <button
          v-if="canRemoveStaff"
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/35"
          @click="
            () => {
              openDeactivateStaffModal(staffForOpenMenu)
              openStaffMenuId = null
            }
          "
        >
          <TrashIcon class="h-4 w-4 shrink-0" />
          Remove
        </button>
      </div>
    </Teleport>
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
  UserIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ArrowsPointingOutIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  ClipboardDocumentIcon,
} from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
import Breadcrumbs from '~/components/ui/Breadcrumbs.vue'
import DataTableToolbar from '~/components/ui/DataTableToolbar.vue'
import DashboardTableBadge from '~/components/ui/DashboardTableBadge.vue'
import {
  formatStaffStatusLabel,
  staffRoleBadgeClass,
  staffStatusBadgeClass,
} from '~/utils/table-badge-styles'
import Checkbox from '~/components/ui/Checkbox.vue'
import StaffModal from '~/components/departments/StaffModal.vue'
import DeactivateStaffModal from '~/components/departments/DeactivateStaffModal.vue'
import ReactivateStaffModal from '~/components/departments/ReactivateStaffModal.vue'
import MoveStaffModal from '~/components/departments/MoveStaffModal.vue'
import { getNextStaffRole, getNextStaffRoleLabel, normalizeStaffRole } from '~/utils/staff-role'
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
import { getVisibleMenuAnchorElement, computeFixedAnchoredMenuStyle } from '~/utils/menuAnchor'
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
const { headerBtnClass } = useDashboardPageChrome()
const departmentId = computed(() => route.params.id as string)

const departmentBreadcrumbs = computed(() => {
  const storeId = department.value?.storeId || storesStore.currentStoreId
  const store = storeId ? storesStore.getStoreById(storeId) : null
  const items: Array<{ label: string; href?: string; icon: typeof BuildingOfficeIcon }> = []
  if (storeId) {
    items.push({
      label: store?.name || 'Departments',
      href: storeDepartmentsPath(storeId),
      icon: BuildingOfficeIcon,
    })
  }
  items.push({ label: department.value?.name || 'Department', icon: UsersIcon })
  return items
})

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

const { isNativeApp, menuViewportPadding, menuTeleportTarget } = useDashboardFloatingMenu()

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
const isStaffFullscreen = ref(false)
const openStaffMenuId = ref<string | null>(null)
const roleToggleBusyId = ref<string | null>(null)

const toggleStaffMenu = (staffId: string) => {
  openStaffMenuId.value = openStaffMenuId.value === staffId ? null : staffId
}

const staffForOpenMenu = computed(() => {
  const id = openStaffMenuId.value
  if (!id) return null
  return paginatedStaff.value.find((s) => s.id === id) ?? null
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
    menuWidth: 160,
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
    if (t?.closest?.('[data-staff-menu]')) return
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

// Check if current user is staff (limited permissions)
const isStaff = computed(() => userStore.userData?.role === 'staff')
// Check if current user is a manager in the department (even if they're a super admin)
const isManager = computed(() => {
  if (!department.value || !currentStaffMember.value) return false
  return (
    currentStaffMember.value.role === 'manager' &&
    currentStaffMember.value.departmentId === department.value.id
  )
})
// Get permissions
const { canCreateStaff, canManage, canRemoveStaff, canMoveStaff } = usePermissions()
// Only super admins can create or remove staff (managers can edit roles/details)
const canManageDepartments = computed(() => canManage.value)
const canCreateNewStaff = computed(() => canCreateStaff.value)

// Current staff member (for staff users and to check manager status)
const currentStaffMember = ref<Staff | null>(null)

const paginatedStaff = computed(() => {
  const start = (staffCurrentPage.value - 1) * staffItemsPerPage.value
  const end = start + staffItemsPerPage.value
  return staff.value.slice(start, end)
})

const paginatedRemovedStaff = computed(() => {
  const start = (staffCurrentPage.value - 1) * staffItemsPerPage.value
  const end = start + staffItemsPerPage.value
  return removedStaff.value.slice(start, end)
})

const rosterPaginationTotal = computed(() =>
  rosterTab.value === 'active' ? staff.value.length : removedStaff.value.length
)

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
const totalManagers = computed(() => {
  return staff.value.filter((m) => m.role === 'manager').length
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

function syncDepartmentManagerFromStaff() {
  if (!department.value) return
  const manager = staff.value.find((m) => m.role === 'manager')
  department.value.manager = manager ? `${manager.firstName} ${manager.lastName}` : 'Not assigned'
}

const handleToggleStaffRole = async (staffMember: Staff) => {
  if (roleToggleBusyId.value) return

  const currentRole = normalizeStaffRole(staffMember.role)
  const newRole = getNextStaffRole(currentRole)
  const nextLabel = getNextStaffRoleLabel(currentRole)

  roleToggleBusyId.value = staffMember.id

  const staffIndex = staff.value.findIndex((s) => s.id === staffMember.id)
  const storeIndex = staffStore.staff.findIndex((s) => s.id === staffMember.id)
  const originalRole = staffIndex > -1 ? staff.value[staffIndex]!.role : staffMember.role

  if (staffIndex > -1) staff.value[staffIndex]!.role = newRole
  if (storeIndex > -1) staffStore.staff[storeIndex]!.role = newRole

  try {
    await staffStore.updateStaff(staffMember.id, { role: newRole })
    syncDepartmentManagerFromStaff()
    toast.success(`${staffMember.firstName} is now ${nextLabel}`)
  } catch (error: unknown) {
    if (staffIndex > -1) staff.value[staffIndex]!.role = originalRole
    if (storeIndex > -1) staffStore.staff[storeIndex]!.role = originalRole
    const message = error instanceof Error ? error.message : 'Failed to update role'
    toast.error(message)
  } finally {
    roleToggleBusyId.value = null
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
  // Add keyboard listener for ESC key
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
  }

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

// Cleanup keyboard listener and restore body overflow
onBeforeUnmount(() => {
  removeStaffMenuOutsideListener()
  removeStaffMenuPositionListeners()
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
    document.body.style.overflow = ''
  }
})
</script>
