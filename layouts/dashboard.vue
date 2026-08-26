<template>
  <!-- Loading state while checking authentication -->
  <div
    v-if="checkingAuth"
    class="min-h-screen bg-gray-50 dark:bg-gray-900 w-full flex items-center justify-center"
  >
    <div class="text-center">
      <div
        class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"
      ></div>
      <p class="text-sm text-gray-600 dark:text-gray-400">Verifying authentication...</p>
    </div>
  </div>

  <!-- Dashboard content (only shown if authenticated) -->
  <div
    v-else
    :class="[
      'dashboard-layout-root font-sans w-full overflow-x-clip relative bg-gray-100 dark:bg-[#07080c]',
      isDemoDashboard ? 'dashboard-layout-root--demo' : '',
      !isNativeApp && effectiveSidebarCollapsed ? 'dashboard-layout-root--sidebar-collapsed' : '',
      isNativeApp
        ? 'dashboard-layout-root--native h-[100dvh] max-h-[100dvh] overflow-hidden'
        : 'min-h-screen',
    ]"
  >
    <!-- Sidebar (web / tablet - native app uses bottom nav) -->
    <aside
      v-if="!isNativeApp"
      class="dashboard-sidebar dash-sidebar"
      :class="[
        'fixed inset-y-0 left-0 z-[55] flex max-lg:transform-gpu max-lg:will-change-transform lg:will-change-auto flex-col transition-[transform,width] max-lg:duration-[420ms] max-lg:ease-[cubic-bezier(0.16,1,0.3,1)] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        effectiveSidebarCollapsed ? 'w-[72px]' : 'w-64',
      ]"
    >
      <!-- Logo / Brand -->
      <div :class="['dash-sidebar__logo-bar', sidebarLogoBarClass]">
        <NuxtLink
          :to="dashPath('')"
          :class="[
            'flex items-center transition-all duration-300',
            effectiveSidebarCollapsed
              ? 'relative group justify-center w-full'
              : 'gap-1.5 min-w-0 flex-1',
          ]"
        >
          <img :src="sidebarLogoSrc" alt="Storvv" :class="sidebarLogoImgClass" />
          <DashboardHoverTooltip v-if="effectiveSidebarCollapsed">
            Dashboard home
          </DashboardHoverTooltip>
        </NuxtLink>
        <button
          v-if="!effectiveSidebarCollapsed"
          type="button"
          @click="sidebarOpen = false"
          class="group relative rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-100 lg:hidden"
          aria-label="Close menu"
        >
          <XMarkIcon class="w-4 h-4" stroke-width="2" />
        </button>
      </div>

      <!-- Collapse toggle (desktop) - larger on large screens -->
      <button
        type="button"
        @click="toggleSidebar"
        class="group absolute top-10 -right-3 z-10 hidden h-8 w-8 items-center justify-center rounded-full border-0 bg-white/95 text-gray-600 backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-gray-900 dark:bg-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.12] dark:hover:text-white lg:flex"
        aria-label="Toggle sidebar"
      >
        <ChevronRightIcon v-if="effectiveSidebarCollapsed" class="w-3.5 h-3.5" stroke-width="2.5" />
        <ChevronLeftIcon v-else class="w-3.5 h-3.5" stroke-width="2.5" />
      </button>

      <!-- Navigation -->
      <nav
        class="dash-sidebar__nav relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-1"
        :class="effectiveSidebarCollapsed ? 'px-1.5' : 'px-2'"
      >
        <div class="min-h-0 space-y-0">
          <template v-for="(item, navIndex) in filteredNavigation" :key="item.name">
            <p
              v-if="
                !isNativeApp &&
                !effectiveSidebarCollapsed &&
                shouldShowWebNavSection(item.name, navIndex, filteredNavigation)
              "
              class="saas-nav-section-label"
            >
              {{ webNavSectionLabel(item.name) }}
            </p>
            <!-- Inventory (expandable) -->
            <div v-if="item.name === 'Inventory' && !effectiveSidebarCollapsed" class="space-y-0.5">
              <div
                :class="[
                  'group relative mx-0.5 flex w-full max-w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-200',
                  !isActive(item.href) ? 'hover:bg-gray-100/90 dark:hover:bg-white/[0.05]' : '',
                ]"
              >
                <NuxtLink
                  :to="item.href"
                  data-tutorial="inventory"
                  class="flex min-w-0 flex-1 items-center gap-2.5"
                  :class="{ 'pointer-events-none opacity-50': switchingStore }"
                >
                  <DashboardNavIcon
                    :name="item.iconKey"
                    :active="isActive(item.href)"
                    size="md"
                    class="shrink-0 transition-colors"
                  />
                  <span
                    class="truncate text-[13px] leading-snug"
                    :class="
                      isActive(item.href)
                        ? 'font-bold text-gray-900 dark:text-gray-100'
                        : 'font-normal text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-100'
                    "
                  >
                    {{ item.name }}
                  </span>
                </NuxtLink>
                <button
                  type="button"
                  @click.stop="inventoryExpanded = !inventoryExpanded"
                  class="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  :class="
                    isActive(item.href)
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-500 dark:text-gray-400'
                  "
                  :aria-expanded="inventoryExpanded"
                  aria-label="Toggle inventory categories"
                >
                  <span class="group relative inline-flex">
                    <ChevronDownIcon
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      :class="inventoryExpanded ? 'rotate-180' : ''"
                      stroke-width="2"
                    />
                  </span>
                </button>
              </div>
              <div
                v-if="inventoryExpanded && inventoryFolders.length > 0"
                class="ml-1.5 space-y-0 /50 py-0.5 pl-3 dark:border-white/[0.08]"
              >
                <NuxtLink
                  v-for="folder in recentFolders.slice(0, 5)"
                  :key="folder.id"
                  :to="dashPath(`/inventory/${folder.id}`)"
                  :class="[
                    'group relative flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors',
                    route.params.id !== folder.id
                      ? 'text-gray-500 hover:bg-gray-100/90 dark:text-gray-400 dark:hover:bg-white/[0.05]'
                      : '',
                    { 'pointer-events-none opacity-50': switchingStore },
                  ]"
                >
                  <DashboardNavIcon
                    :name="route.params.id === folder.id ? 'folder-open' : 'folder'"
                    :active="route.params.id === folder.id"
                    size="sm"
                  />
                  <span
                    class="flex-1 truncate leading-snug"
                    :class="
                      route.params.id === folder.id
                        ? 'font-bold text-gray-900 dark:text-gray-100'
                        : 'font-normal group-hover:text-gray-800 dark:group-hover:text-gray-100'
                    "
                    >{{ folder.name }}</span
                  >
                </NuxtLink>
              </div>
            </div>

            <!-- Regular nav items -->
            <NuxtLink
              v-else-if="
                (item.name !== 'Inventory' && item.name !== 'Departments') ||
                effectiveSidebarCollapsed
              "
              :to="item.href"
              :data-tutorial="item.name.toLowerCase().replace(/\s+/g, '-')"
              :class="[
                'group relative flex items-center transition-[transform,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                effectiveSidebarCollapsed
                  ? 'mx-0.5 w-full justify-center rounded-lg py-1.5 active:scale-[0.98] motion-reduce:active:scale-100'
                  : 'mx-0.5 gap-2 rounded-lg px-2 py-1.5',
                !isActive(item.href) && effectiveSidebarCollapsed
                  ? 'text-gray-500 hover:bg-gray-100/90 dark:text-gray-400 dark:hover:bg-white/[0.06]'
                  : !isActive(item.href)
                  ? 'text-gray-500 hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-100'
                  : 'text-gray-900 dark:text-gray-100',
                { 'pointer-events-none opacity-50': switchingStore },
              ]"
            >
              <DashboardNavIcon
                :name="item.iconKey"
                :active="isActive(item.href)"
                size="md"
                class="shrink-0 transition-colors"
              />
              <span
                v-if="!effectiveSidebarCollapsed"
                class="truncate text-[13px] leading-snug"
                :class="
                  isActive(item.href)
                    ? 'font-bold text-gray-900 dark:text-gray-100'
                    : 'font-normal text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-100'
                "
              >
                {{ item.name }}
              </span>
              <DashboardHoverTooltip v-if="effectiveSidebarCollapsed">
                {{ item.name }}
              </DashboardHoverTooltip>
            </NuxtLink>
          </template>

          <!-- Stores (super admins) -->
          <div
            v-if="userStore.isSuperAdmin && !effectiveSidebarCollapsed"
            class="dash-sidebar__branches mt-1.5 rounded-xl border-0 p-1.5"
          >
            <button
              type="button"
              @click="storesSectionCollapsed = !storesSectionCollapsed"
              class="group relative flex w-full items-center justify-between rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-200"
              :aria-expanded="!storesSectionCollapsed"
            >
              <span>Branches</span>
              <ChevronDownIcon
                class="w-3.5 h-3.5 transition-transform duration-200"
                :class="storesSectionCollapsed ? '' : 'rotate-180'"
                stroke-width="2"
              />
            </button>
            <div v-if="!storesSectionCollapsed" class="mt-1 space-y-0.5 pl-0">
              <template v-for="store in storesList" :key="store.id">
                <div
                  :class="[
                    'flex items-center justify-between rounded-lg px-2 py-2 transition-colors duration-200',
                    store.id !== storesStore.currentStoreId ? 'opacity-40' : '',
                    store.id === storesStore.currentStoreId &&
                    !(
                      route.params.storeId === store.id &&
                      route.path.startsWith('/dashboard/stores/') &&
                      route.path.includes('/departments')
                    )
                      ? 'hover:bg-gray-100/90 dark:hover:bg-white/[0.05]'
                      : '',
                  ]"
                >
                  <NuxtLink
                    :to="
                      store.id === storesStore.currentStoreId
                        ? `/dashboard/stores/${store.id}/departments`
                        : '#'
                    "
                    class="group relative flex min-w-0 flex-1 items-center gap-2"
                    :class="{
                      'pointer-events-none cursor-not-allowed':
                        switchingStore || store.id !== storesStore.currentStoreId,
                    }"
                    @click.prevent="store.id !== storesStore.currentStoreId ? null : null"
                  >
                    <DashboardNavIcon
                      name="branch"
                      :active="
                        route.params.storeId === store.id &&
                        route.path.startsWith('/dashboard/stores/') &&
                        route.path.includes('/departments')
                      "
                      size="md"
                      aria-hidden="true"
                    />
                    <span
                      class="truncate text-[13px] leading-snug"
                      :data-dashboard-tooltip="
                        storeBranchNavTooltip(store.name, getStoreBranchShortLabel(store.name))
                      "
                      :class="
                        route.params.storeId === store.id &&
                        route.path.startsWith('/dashboard/stores/') &&
                        route.path.includes('/departments')
                          ? 'font-bold text-gray-900 dark:text-gray-100'
                          : currentStore?.id === store.id
                          ? 'font-medium text-gray-900 dark:text-gray-100'
                          : 'font-normal text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-100'
                      "
                    >
                      {{ getStoreBranchShortLabel(store.name) }}
                    </span>
                    <span
                      v-if="
                        currentStore?.id === store.id || store.id === storesStore.currentStoreId
                      "
                      class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25"
                      aria-hidden="true"
                    ></span>
                    <span
                      v-if="store.id !== storesStore.currentStoreId"
                      class="text-[9px] text-gray-400 dark:text-gray-500 italic shrink-0"
                      >Inactive</span
                    >
                  </NuxtLink>
                  <button
                    v-if="store.id === storesStore.currentStoreId"
                    type="button"
                    @click.stop="toggleStoreExpanded(store.id)"
                    class="group relative shrink-0 rounded-lg p-1 text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-800 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                    :aria-expanded="!!expandedStores[store.id]"
                    aria-label="Toggle departments"
                  >
                    <ChevronDownIcon
                      class="w-3.5 h-3.5 transition-transform duration-200"
                      :class="expandedStores[store.id] ? 'rotate-180' : ''"
                      stroke-width="2"
                    />
                  </button>
                </div>
                <div
                  v-if="expandedStores[store.id] && store.id === storesStore.currentStoreId"
                  class="ml-0.5 space-y-0.5 /50 py-0.5 pl-2.5 pr-0.5 dark:border-white/[0.08]"
                >
                  <template
                    v-for="department in getDepartmentsForStore(store.id)"
                    :key="department.id"
                  >
                    <div class="group flex items-center justify-between gap-1 rounded-lg">
                      <NuxtLink
                        :to="`/dashboard/departments/${department.id}`"
                        class="group relative flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors"
                        :class="[
                          route.params.id === department.id &&
                          route.path.startsWith('/dashboard/departments')
                            ? ''
                            : 'text-gray-500 hover:bg-gray-100/90 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-100',
                          { 'pointer-events-none opacity-50': switchingStore },
                        ]"
                      >
                        <DashboardNavIcon
                          name="departments"
                          :active="
                            route.params.id === department.id &&
                            route.path.startsWith('/dashboard/departments')
                          "
                          size="sm"
                        />
                        <span
                          class="flex-1 truncate leading-snug"
                          :class="
                            route.params.id === department.id &&
                            route.path.startsWith('/dashboard/departments')
                              ? 'font-bold text-gray-900 dark:text-gray-100'
                              : 'font-normal group-hover:text-gray-800 dark:group-hover:text-gray-100'
                          "
                          >{{ department.name }}</span
                        >
                      </NuxtLink>
                      <button
                        type="button"
                        @click.stop="toggleDepartmentExpanded(department.id)"
                        class="group relative shrink-0 rounded-lg p-1 text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-800 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
                        :aria-expanded="expandedDepartments[department.id]"
                        aria-label="Toggle staff list"
                      >
                        <ChevronDownIcon
                          class="w-3.5 h-3.5 transition-transform duration-200"
                          :class="expandedDepartments[department.id] ? 'rotate-180' : ''"
                          stroke-width="2"
                        />
                      </button>
                    </div>
                    <div
                      v-if="expandedDepartments[department.id]"
                      class="space-y-0.5 pb-0.5 pl-4 pr-0.5"
                    >
                      <template v-if="getStaffForDepartment(department.id).length > 0">
                        <NuxtLink
                          v-for="member in getStaffForDepartment(department.id)"
                          :key="member.id"
                          :to="`/dashboard/departments/${department.id}`"
                          class="group relative flex items-center gap-2 rounded-md px-2 py-2 text-[13px] text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-100"
                        >
                          <span
                            class="h-1 w-1 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500"
                          ></span>
                          <span class="truncate">{{
                            member.firstName && member.lastName
                              ? `${member.firstName} ${member.lastName}`
                              : member.email || 'Staff'
                          }}</span>
                        </NuxtLink>
                      </template>
                      <p
                        v-else
                        class="rounded-md px-2 py-2 text-[13px] text-gray-400 dark:text-gray-500"
                      >
                        No staff
                      </p>
                    </div>
                  </template>
                  <NuxtLink
                    v-if="getDepartmentsForStore(store.id).length === 0"
                    :to="`/dashboard/stores/${store.id}/departments`"
                    class="mt-0.5 block rounded-lg px-2.5 py-2 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/10"
                  >
                    View departments
                  </NuxtLink>
                </div>
              </template>
              <div
                v-if="storesList.length === 0"
                class="px-2.5 py-2 text-xs text-gray-500 dark:text-gray-400"
              >
                No stores
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Items -->
        <div v-if="!effectiveSidebarCollapsed" class="mt-auto pt-1.5">
          <RecentItemsWidget />
        </div>
      </nav>

      <!-- Bottom: user + sign out -->
      <div
        class="dash-sidebar__footer"
        :class="effectiveSidebarCollapsed ? 'px-1.5 pb-2.5 pt-2.5' : 'px-2.5 pb-3 pt-2.5'"
      >
        <div
          class="dash-sidebar__user"
          :class="effectiveSidebarCollapsed ? 'dash-sidebar__user--collapsed group' : ''"
        >
          <div class="dash-sidebar__avatar">
            <span class="relative">{{ userInitials }}</span>
          </div>
          <div v-if="!effectiveSidebarCollapsed" class="min-w-0 flex-1">
            <p class="dash-sidebar__user-name">{{ userName }}</p>
            <p class="dash-sidebar__user-email">{{ userEmail }}</p>
          </div>
          <DashboardHoverTooltip v-if="effectiveSidebarCollapsed">
            {{ userName }}
            <span class="mt-0.5 block text-[11px] font-normal text-gray-400">{{
              userEmail
            }}</span>
          </DashboardHoverTooltip>
        </div>
        <button
          type="button"
          @click="handleSignOut"
          :class="[
            'dash-sidebar__sign-out',
            effectiveSidebarCollapsed ? 'relative group' : '',
          ]"
        >
          <DashboardNavIcon name="sign-out" size="md" class="shrink-0 opacity-80" />
          <span v-if="!effectiveSidebarCollapsed">Sign out</span>
          <DashboardHoverTooltip v-if="effectiveSidebarCollapsed">
            Sign out
          </DashboardHoverTooltip>
        </button>
        <p
          class="dash-sidebar__version"
          :class="effectiveSidebarCollapsed ? 'dash-sidebar__version--center' : ''"
        >
          V{{ appVersion }}
        </p>
      </div>
    </aside>

    <!-- Mobile scrim (web drawer only) -->
    <div
      v-if="!isNativeApp"
      class="dashboard-mobile-scrim fixed inset-0 z-[54] lg:hidden touch-manipulation transition-[opacity,backdrop-filter,-webkit-backdrop-filter,background-color] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:duration-0"
      :class="[
        sidebarOpen
          ? 'pointer-events-auto bg-black/[0.05] opacity-100 backdrop-blur-md backdrop-saturate-110 dark:bg-[#07080c]/30'
          : 'pointer-events-none opacity-0 backdrop-blur-none backdrop-saturate-100 dark:bg-transparent',
      ]"
      :aria-hidden="!sidebarOpen"
      @click="closeMobileSidebarOverlay"
    />

    <!-- Main Content -->
    <div
      :class="[
        'w-full',
        isNativeApp
          ? 'dashboard-native-shell flex h-full min-h-0 flex-col overflow-hidden'
          : [
              'dashboard-main-shell min-h-screen transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
            ],
      ]"
      style="min-width: 0; max-width: 100vw"
    >
      <!-- Top Navigation (fixed so it stays visible when scrolling) -->
      <header
        :class="[
          'dash-topnav dashboard-top-nav fixed top-0 right-0 isolate',
          isNativeApp
            ? 'dashboard-top-nav-native left-0 z-[54]'
            : [
                'left-0 transition-[left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                sidebarOpen ? 'z-40 lg:z-[54]' : 'z-[54]',
                sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64',
              ],
        ]"
      >
        <div
          :class="[
            'relative flex w-full items-center gap-2.5 px-3 sm:px-4 lg:gap-3 lg:px-5',
            isNativeApp
              ? [
                  'native-topnav dashboard-top-nav-native-row',
                  showNativeCommandHeader ? 'dashboard-top-nav-native-row--command' : 'h-11',
                ]
              : 'h-11 sm:h-12',
          ]"
        >
          <!-- Mobile nav trigger (web drawer) -->
          <button
            v-if="!isNativeApp"
            type="button"
            class="dashboard-sidebar-open-trigger group flex h-8 shrink-0 items-center gap-0.5 py-1 pl-1.5 pr-2 lg:hidden"
            aria-label="Open menu"
            @click="sidebarOpen = true"
          >
            <img
              src="/storvv logo mobile.png"
              alt=""
              class="h-6 w-6 shrink-0 object-contain"
              width="24"
              height="24"
              decoding="async"
            />
            <ChevronRightIcon
              class="h-3 w-3 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-px dark:text-gray-500"
              stroke-width="2.5"
              aria-hidden="true"
            />
          </button>

          <!-- Native iOS: command header (greeting + branch + actions) -->
          <NativeCommandHeader
            v-if="showNativeCommandHeader"
            class="min-w-0 w-full flex-1"
            :greeting="commandHeaderGreeting"
            :page-title="commandHeaderPageTitle"
          >
            <template #actions>
              <button
                type="button"
                class="dash-topnav__icon-btn"
                aria-label="Search"
                @click="openGlobalSearch()"
              >
                <MagnifyingGlassIcon class="block h-4 w-4 shrink-0" :size="16" stroke-width="1.75" />
              </button>

              <button
                type="button"
                class="dash-topnav__icon-btn"
                aria-label="Open Storvv Assistant"
                @click="openAssistant()"
              >
                <SparklesIcon class="block h-4 w-4 shrink-0" :size="16" stroke-width="1.75" />
              </button>

              <ThemeToggle class="shrink-0" />

              <div class="relative z-[130] h-8 w-8 shrink-0" ref="notificationsRef">
                <button
                  type="button"
                  class="dash-topnav__icon-btn group relative inline-flex cursor-pointer"
                  aria-label="Notifications"
                  :aria-expanded="notificationsOpen"
                  aria-haspopup="true"
                  @click.stop.prevent="toggleNotifications"
                >
                  <BellIcon
                    class="h-4 w-4 text-gray-600 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100"
                    stroke-width="1.75"
                  />
                  <span
                    v-if="unreadNotificationCount > 0"
                    class="pointer-events-none absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold leading-none text-white ring-2 ring-gray-50 dark:ring-[#0a0c12]"
                  >
                    {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
                  </span>
                </button>
                <Transition
                  enter-active-class="transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
                  enter-to-class="opacity-100 translate-y-0 scale-100"
                  leave-active-class="transition-[opacity,transform] duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0 scale-100"
                  leave-to-class="opacity-0 translate-y-0.5 scale-[0.99]"
                >
                  <Teleport to="body">
                    <div
                      v-if="notificationsOpen"
                      ref="notificationsPanelRef"
                      :style="notificationsPanelStyle"
                      class="pointer-events-auto origin-top-right"
                      @click.stop
                    >
                      <NotificationsPanel variant="dropdown" @close="notificationsOpen = false" />
                    </div>
                  </Teleport>
                </Transition>
              </div>

              <DashboardProfileMenu
                :user-name="userName"
                :user-email="userEmail"
                :user-initials="userInitials"
                compact
                @sign-out="handleSignOut"
              />
            </template>
          </NativeCommandHeader>

          <!-- Native (non-iOS): logo + current workspace page -->
          <div v-else-if="isNativeApp" class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <NuxtLink
              :to="dashPath('')"
              class="flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
              aria-label="Storv home"
            >
              <img
                src="/storvv logo mobile.png"
                alt=""
                class="h-7 w-7 object-contain"
                width="28"
                height="28"
                decoding="async"
              />
            </NuxtLink>
            <div
              class="native-topnav-page flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden border-l border-gray-200/90 pl-2 dark:border-white/10"
            >
              <DashboardNavIcon
                :name="currentPageIconKey"
                size="sm"
                class="shrink-0 text-gray-400 dark:text-gray-500"
              />
              <p class="native-topnav-page__title truncate text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
                {{ currentPageName }}
              </p>
            </div>
          </div>

          <!-- Page title -->
          <div v-else class="hidden min-w-0 shrink-0 md:block lg:min-w-[7.5rem]">
            <p class="dash-topnav__eyebrow">Workspace</p>
            <div class="mt-0.5 flex min-w-0 items-center gap-1.5">
              <DashboardNavIcon
                :name="currentPageIconKey"
                size="sm"
                class="text-gray-400 dark:text-gray-500"
              />
              <h1 class="dash-topnav__title">{{ currentPageName }}</h1>
            </div>
          </div>

          <!-- Desktop search + assistant -->
          <div
            v-if="!isNativeApp"
            class="dash-topnav__search-group dashboard-topnav-search-group group/search hidden h-8 w-[min(100%,12rem)] shrink-0 items-stretch sm:w-[min(100%,14rem)] md:flex lg:w-[min(100%,16rem)] xl:w-[min(100%,18rem)]"
          >
            <button
              type="button"
              class="dash-topnav__search dashboard-topnav-search relative flex min-w-0 flex-1 items-center gap-2 px-2.5"
              @click="openGlobalSearch()"
            >
              <MagnifyingGlassIcon
                class="block h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500"
                :size="14"
                stroke-width="1.75"
              />
              <span
                class="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-gray-500 dark:text-gray-400"
              >
                Search workspace
              </span>
              <kbd
                class="hidden shrink-0 rounded bg-white/90 px-1.5 py-px font-mono text-[9px] font-medium text-gray-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-gray-500 lg:inline"
              >
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              class="dash-topnav__search-assistant dashboard-topnav-search-assistant shrink-0"
              aria-label="Open Storvv Assistant"
              @click="openAssistant()"
            >
              <SparklesIcon
                class="block h-3.5 w-3.5 shrink-0 text-gray-700 dark:text-gray-200"
                stroke-width="1.75"
              />
            </button>
          </div>

          <div v-if="!showNativeCommandHeader" class="hidden min-w-0 flex-1 md:block" aria-hidden="true" />

          <div v-if="!showNativeCommandHeader" class="min-w-0 flex-1 md:hidden" aria-hidden="true" />

          <!-- Actions toolbar -->
          <div
            v-if="!showNativeCommandHeader"
            class="dash-topnav__actions dashboard-topnav-actions relative z-10 flex shrink-0 items-center"
          >
            <button
              type="button"
              class="dash-topnav__icon-btn md:hidden"
              aria-label="Search"
              @click="openGlobalSearch()"
            >
              <MagnifyingGlassIcon class="block h-4 w-4 shrink-0" :size="16" stroke-width="1.75" />
            </button>

            <button
              type="button"
              class="dash-topnav__icon-btn md:hidden"
              aria-label="Open Storvv Assistant"
              @click="openAssistant()"
            >
              <SparklesIcon class="block h-4 w-4 shrink-0" :size="16" stroke-width="1.75" />
            </button>

            <span class="dash-topnav__divider hidden md:block" aria-hidden="true" />

            <StoreSelector
              v-if="userStore.userData?.role === 'superAdmin'"
              :class="isNativeApp ? 'max-w-[5.25rem] shrink' : 'shrink-0'"
            />

            <ThemeToggle class="shrink-0" />

            <div class="relative z-[130] h-8 w-8 shrink-0" ref="notificationsRef">
              <button
                type="button"
                class="dash-topnav__icon-btn group relative inline-flex cursor-pointer"
                aria-label="Notifications"
                :aria-expanded="notificationsOpen"
                aria-haspopup="true"
                @click.stop.prevent="toggleNotifications"
              >
                <BellIcon
                  class="h-4 w-4 text-gray-600 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100"
                  stroke-width="1.75"
                />
                <span
                  v-if="unreadNotificationCount > 0"
                  class="pointer-events-none absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold leading-none text-white ring-2 ring-gray-50 dark:ring-[#0a0c12]"
                >
                  {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
                </span>
              </button>
              <Transition
                enter-active-class="transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                enter-from-class="opacity-0 translate-y-1 scale-[0.98]"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition-[opacity,transform] duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 translate-y-0.5 scale-[0.99]"
              >
                <Teleport to="body">
                  <div
                    v-if="notificationsOpen"
                    ref="notificationsPanelRef"
                    :style="notificationsPanelStyle"
                    class="pointer-events-auto origin-top-right"
                    @click.stop
                  >
                    <NotificationsPanel variant="dropdown" @close="notificationsOpen = false" />
                  </div>
                </Teleport>
              </Transition>
            </div>

            <span class="dash-topnav__divider hidden sm:block" aria-hidden="true" />

            <DashboardProfileMenu
              :user-name="userName"
              :user-email="userEmail"
              :user-initials="userInitials"
              :compact="isNativeApp"
              @sign-out="handleSignOut"
            />
          </div>
        </div>
      </header>

      <!-- Spacer so fixed nav never overlaps page content -->
      <div
        class="dashboard-top-nav-spacer shrink-0"
        :class="
          isNativeApp
            ? 'dashboard-top-nav-spacer-native'
            : 'dashboard-top-nav-spacer--web h-11 sm:h-12'
        "
        aria-hidden="true"
      />

      <!-- Page Content (same soft entrance as auth pages; re-runs on route change) -->
      <main
        ref="dashboardMainRef"
        data-dashboard-main
        :class="[
          'w-full min-w-0 max-w-full px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4',
          isNativeApp
            ? 'dashboard-native-main min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain'
            : 'overflow-x-clip overflow-y-visible',
        ]"
      >
        <IosPullToRefreshHost
          v-if="isCapacitorIos"
          :scroll-target="dashboardMainRef"
        />
        <div
          :key="route.path"
          :class="[
            'min-w-0',
            isNativeApp
              ? 'opacity-100'
              : 'opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none animate-auth-fade-up [animation-delay:40ms]',
          ]"
        >
          <DemoModeBanner v-if="isDemoDashboard" />
          <slot />
        </div>
      </main>
    </div>

    <!-- Native overlays: host on body so fixed modals/drawers are not clipped by overflow-hidden shells (iOS WKWebView) -->
    <Teleport v-if="isNativeApp" to="body">
      <div
        id="dashboard-native-overlay-host"
        class="dashboard-native-overlay-host"
        aria-hidden="true"
      />
    </Teleport>

    <!-- Toast Notifications -->
    <ToastContainer />

    <!-- Sign out confirmation -->
    <Modal
      :model-value="showLogoutConfirm"
      size="xs"
      :show-close="false"
      :close-on-backdrop="!loggingOut"
      content-padding="px-5 pt-6 pb-5 sm:px-6 sm:pt-7 sm:pb-6"
      @update:model-value="(value: boolean) => { if (!value) cancelSignOut() }"
    >
      <div class="flex flex-col items-center text-center">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"
        >
          <ArrowRightOnRectangleIcon class="h-5 w-5" stroke-width="1.75" />
        </div>
        <h3 class="mt-4 text-base font-semibold text-gray-900 dark:text-gray-50">Sign out?</h3>
        <p class="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          You'll need to sign in again to access your dashboard.
        </p>

        <div class="mt-6 flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            size="sm"
            :disabled="loggingOut"
            class="w-full sm:min-w-[7.5rem] sm:w-auto"
            @click="cancelSignOut"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            :disabled="loggingOut"
            :loading="loggingOut"
            class="w-full sm:min-w-[7.5rem] sm:w-auto"
            @click="confirmSignOut"
          >
            Sign out
          </Button>
        </div>
      </div>
    </Modal>

    <!-- Global Search (deferred; especially on native to keep first paint lean) -->
    <GlobalSearch v-if="searchShellReady" />

    <DashboardAssistant v-if="assistantShellReady" />

    <DashboardNativeTableLayoutSync />

    <!-- Native app bottom navigation (CSS fallback via html.capacitor-native) -->
    <DashboardNativeBottomNav
      class="dashboard-native-bottom-nav-host"
      :primary-items="nativePrimaryNav"
      :more-items="nativeMoreNav"
      @sign-out="handleSignOut"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick, defineAsyncComponent } from 'vue'
import {
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
} from '~/utils/app-icons'
import Modal from '~/components/ui/Modal.vue'
import Button from '~/components/ui/Button.vue'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import DashboardHoverTooltip from '~/components/ui/DashboardHoverTooltip.vue'
import DashboardNavIcon from '~/components/dashboard/DashboardNavIcon.vue'
import DemoModeBanner from '~/components/demo/DemoModeBanner.vue'
import DashboardNativeBottomNav from '~/components/dashboard/DashboardNativeBottomNav.vue'
import DashboardNativeTableLayoutSync from '~/components/dashboard/DashboardNativeTableLayoutSync.vue'
import NativeCommandHeader from '~/components/dashboard/NativeCommandHeader.vue'
import IosPullToRefreshHost from '~/components/ios/IosPullToRefreshHost.vue'
import DashboardProfileMenu from '~/components/dashboard/DashboardProfileMenu.vue'
import {
  splitNativeBottomNav,
  isDashboardNavActive,
  NATIVE_PRIMARY_ORDER,
  NATIVE_PRIMARY_ORDER_WITH_PAYMENT_LINKS,
  type DashboardNavItem,
} from '~/utils/dashboard-native-nav'
import {
  DASHBOARD_NAV_DEFINITIONS,
  filterDashboardNavItems,
  orderNativeMoreNavItems,
} from '~/utils/dashboard-nav-filter'
import { shouldShowWebNavSection, webNavSectionLabel } from '~/utils/dashboard-web-nav-groups'
import type { DashboardNavIconKey } from '~/utils/dashboard-nav-icons'
import { isPaymentLinksNativeComingSoon, isPaymentLinksComingSoon } from '~/utils/payment-links-launch'
import { resolveStoreDepartmentsPath } from '~/utils/department-routes'
import { getStoreBranchShortLabel } from '~/utils/store-branch-label'
import { storeBranchNavTooltip } from '~/utils/dashboard-tooltip'
import { isStaffCreationInProgress } from '~/utils/staff-creation-session'
import StoreSelector from '~/components/ui/StoreSelector.vue'
import ToastContainer from '~/components/ui/ToastContainer.vue'

const RecentItemsWidget = defineAsyncComponent(
  () => import('~/components/ui/RecentItemsWidget.vue')
)
import NotificationsPanel from '~/components/notifications/NotificationsPanel.vue'

const GlobalSearch = defineAsyncComponent(() => import('~/components/search/GlobalSearch.vue'))
const DashboardAssistant = defineAsyncComponent(
  () => import('~/components/dashboard/DashboardAssistant.vue')
)
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useTheme } from '~/composables/useTheme'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useNotificationsStore } from '~/stores/notifications'
import { useInventoryStore } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { useStaffStore } from '~/stores/staff'
import { useSearchStore } from '~/stores/search'
import { clearNativeOverlayLock } from '~/utils/native-overlay-lock'
import { isCapacitorNative } from '~/utils/capacitor-env'
import { scheduleNativeIdleWork } from '~/utils/capacitor-native-perf'
import { runDashboardShellBootstrap } from '~/composables/useDashboardShellBootstrap'

const { actualTheme } = useTheme()

const appVersion = (useRuntimeConfig().public.appVersion as string) ?? '0.1'
const authStore = useAuthStore()
const userStore = useUserStore()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
const notificationsStore = useNotificationsStore()
const inventoryStore = useInventoryStore()
const receiptsStore = useReceiptsStore()
const departmentsStore = useDepartmentsStore()
const storesStore = useStoresStore()
const staffStore = useStaffStore()
const searchStore = useSearchStore()
const { openAssistant: openAssistantPanel } = useDashboardAssistant()
const searchShellReady = ref(false)
const assistantShellReady = ref(false)

function mountSearchShell() {
  if (!searchShellReady.value) searchShellReady.value = true
}

function mountAssistantShell() {
  if (!assistantShellReady.value) assistantShellReady.value = true
}

function mountShellWidgets() {
  mountSearchShell()
  mountAssistantShell()
}

function openAssistant(draft?: string) {
  mountAssistantShell()
  openAssistantPanel(draft)
}

function openGlobalSearch() {
  mountSearchShell()
  nextTick(() => searchStore.openSearch())
}

function handleGlobalSearchShortcut(e: KeyboardEvent) {
  if (isCapacitorNative()) return
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    mountSearchShell()
    nextTick(() => searchStore.toggleSearch())
  }
}
const { eligibleStores } = usePlanEligibleStores()
// Fetch notifications after shell is interactive (native defers further).
function scheduleNotificationsFetch() {
  if (!authStore.currentUser) return
  notificationsStore.fetchNotifications()
}

onMounted(() => {
  if (isCapacitorNative()) {
    scheduleNativeIdleWork(scheduleNotificationsFetch, 2000)
  } else if (authStore.currentUser) {
    scheduleNotificationsFetch()
  }
})

// Watch for auth changes to fetch notifications
watch(
  () => authStore.currentUser,
  (newUser) => {
    if (newUser) {
      if (isCapacitorNative()) {
        scheduleNativeIdleWork(scheduleNotificationsFetch, 1500)
      } else {
        scheduleNotificationsFetch()
      }
    }
  }
)

// Computed unread count
const unreadNotificationCount = computed(() => notificationsStore.unreadCount)
const { isNativeApp } = useCapacitorNativeApp()
const { isCapacitorIos } = useIsCapacitorIos()
const showNativeCommandHeader = computed(() => isNativeApp.value && isCapacitorIos.value)
const dashboardMainRef = ref<HTMLElement | null>(null)
const sidebarOpen = ref(false)

function closeMobileSidebarOverlay() {
  if (sidebarOpen.value) sidebarOpen.value = false
}
const notificationsOpen = ref(false)
const notificationsRef = ref<HTMLElement | null>(null)
const notificationsPanelRef = ref<HTMLElement | null>(null)
const notificationsPanelStyle = ref<Record<string, string>>({})

function positionNotificationsPanel() {
  if (!import.meta.client || !notificationsOpen.value || !notificationsRef.value) return
  const rect = notificationsRef.value.getBoundingClientRect()
  const gap = 8
  const margin = 12
  const panelWidth = Math.min(320, window.innerWidth - margin * 2)
  let right = window.innerWidth - rect.right
  const leftEdge = window.innerWidth - right - panelWidth
  if (leftEdge < margin) {
    right = Math.max(margin, window.innerWidth - panelWidth - margin)
  }
  notificationsPanelStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + gap)}px`,
    right: `${Math.round(right)}px`,
    left: 'auto',
    width: `${Math.round(panelWidth)}px`,
    maxWidth: `calc(100vw - ${margin * 2}px)`,
    zIndex: '140',
  }
}

function onNotificationsScrollOrResize() {
  if (notificationsOpen.value) positionNotificationsPanel()
}

const toggleNotifications = () => {
  notificationsOpen.value = !notificationsOpen.value
}

watch(notificationsOpen, async (isOpen) => {
  if (!import.meta.client || !isOpen) return
  await nextTick()
  positionNotificationsPanel()
  requestAnimationFrame(() => positionNotificationsPanel())
})

/** Never block the whole shell on auth - show UI with a short gate only (Capacitor-safe). */
const checkingAuth = ref(false)

// Track store switching state
const switchingStore = ref(false)
const previousStoreId = ref<string | null>(null)

// Sidebar collapsed state with localStorage persistence
// Initialize synchronously on client to prevent layout shift
const sidebarCollapsed = ref(false)

// Load sidebar state synchronously before mount to prevent layout shift
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

// Save sidebar state to localStorage when it changes
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (import.meta.client) {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }
}

/** Narrow icon rail only when lg+ and user collapsed; tablet drawer always shows full labels. */
const isLgUp = useMinWidthQuery(1024)
const effectiveSidebarCollapsed = computed(() => sidebarCollapsed.value && isLgUp.value)

/** Compact PNG only on lg+ when the sidebar is collapsed to the icon rail (not on phone/tablet drawer). */
const sidebarUsesMobileLogoAsset = computed(() => effectiveSidebarCollapsed.value)

const sidebarLogoSrc = computed(() => {
  if (sidebarUsesMobileLogoAsset.value) return '/storvv logo mobile.png'
  return actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
})

const sidebarLogoBarClass = computed(() => '')

const sidebarLogoImgClass = computed(() => {
  const base =
    'shrink-0 object-contain transition-[height,width,max-width] duration-300 ease-in-out'
  if (effectiveSidebarCollapsed.value) {
    return [base, 'mx-auto object-center h-7 w-7 max-h-7 max-w-7']
  }
  return [
    base,
    'object-left',
    'h-8 w-auto max-h-8 max-w-[calc(100%-0.5rem)]',
  ]
})

const navigation = DASHBOARD_NAV_DEFINITIONS

// Filter navigation based on user role and subscription plan (web sidebar + iOS/Android bottom nav)
const filteredNavigation = computed(() => {
  const isManager =
    userStore.userData?.role === 'staff' && staffStore.getCurrentStaffMember?.role === 'manager'

  return filterDashboardNavItems(navigation, {
    isSuperAdmin: userStore.isSuperAdmin,
    isManager,
    canUseFeature: canUseSubscriptionFeature,
    hidePaymentLinks: isPaymentLinksComingSoon(),
  }).map((item) => ({
    ...item,
    href:
      item.name === 'Departments'
        ? resolveStoreDepartmentsPath(storesStore.currentStoreId, storesStore.stores[0]?.id) ??
          dashPath('/departments')
        : dashPath(item.segment),
  }))
})

/**
 * Native bottom nav is CSS-gated (html.capacitor-native), not isNativeApp.
 * Promote Payment links whenever native coming-soon is on.
 */
const nativeNavigationItems = computed((): DashboardNavItem[] => {
  const items = filteredNavigation.value
  if (!isPaymentLinksNativeComingSoon()) return items
  if (items.some((item) => item.name === 'Payment links')) return items
  return [
    ...items,
    {
      name: 'Payment links',
      href: dashPath('/payment-links'),
      iconKey: 'payment-links',
    },
  ]
})

const nativePrimaryOrder = computed(() =>
  isPaymentLinksNativeComingSoon() ? NATIVE_PRIMARY_ORDER_WITH_PAYMENT_LINKS : NATIVE_PRIMARY_ORDER
)

const nativeNavSplit = computed(() =>
  splitNativeBottomNav(nativeNavigationItems.value, nativePrimaryOrder.value)
)
const nativePrimaryNav = computed(() => nativeNavSplit.value.primary)
const nativeMoreNav = computed(() => orderNativeMoreNavItems(nativeNavSplit.value.more))

const route = useRoute()
const { dashPath, isDemoDashboard, matchesDashboardPath } = useDashboardPaths()
useDemoConversionNudge()

const isActive = (href: string) => {
  const visibleHrefs = filteredNavigation.value.map((item) => item.href)
  return isDashboardNavActive(route.path, href, visibleHrefs)
}

const currentPage = computed(() => {
  return filteredNavigation.value.find((item) => isActive(item.href)) || filteredNavigation.value[0]
})

const currentPageName = computed(() => {
  return currentPage.value?.name || 'Dashboard'
})

const currentPageIconKey = computed((): DashboardNavIconKey => {
  return currentPage.value?.iconKey || 'dashboard'
})

// Folder navigation for Inventory
const isInventoryRoute = computed(() => matchesDashboardPath(route.path, '/inventory'))

// Expanded state for Inventory folders: open on inventory routes; closed elsewhere (see watch below)
const inventoryExpanded = ref(false)

// Expanded state for Stores - manage which stores are expanded
// Use reactive object instead of Set for better Vue reactivity
const expandedStores = reactive<Record<string, boolean>>({})
const expandedDepartments = reactive<Record<string, boolean>>({})
// Fathom-style: collapsible Stores section header
const storesSectionCollapsed = ref(false)

// Load stores and departments when user data is available
watch(
  [() => authStore.currentUser, () => authStore.loading],
  async ([user, loading]) => {
    if (!user || loading) return
    if (isStaffCreationInProgress()) return

    await runDashboardShellBootstrap()

    if (storesStore.currentStoreId) {
      expandedStores[storesStore.currentStoreId] = true
    }
  },
  { immediate: true }
)

watch(
  () => userStore.userData?.subscription,
  async () => {
    if (userStore.userData?.role !== 'superAdmin' || !storesStore.stores.length) return
    await storesStore.applyPlanToCurrentStoreSelection()
  }
)

// Watch for store changes and auto-expand current store
watch(
  () => storesStore.currentStoreId,
  async (newStoreId, oldStoreId) => {
    // Track store switching
    if (oldStoreId && newStoreId && oldStoreId !== newStoreId) {
      switchingStore.value = true
      previousStoreId.value = oldStoreId

      // Collapse the previous store
      if (oldStoreId) {
        expandedStores[oldStoreId] = false
      }
    }

    if (newStoreId) {
      // Expand the new current store
      expandedStores[newStoreId] = true

      // Wait for data to load before showing details
      if (switchingStore.value) {
        // Wait a bit for data to refresh
        await new Promise((resolve) => setTimeout(resolve, 500))
        switchingStore.value = false
        previousStoreId.value = null
      }
    }
  },
  { immediate: true }
)

// Also watch for loading state to detect when switching completes
watch(
  () => storesStore.loading,
  (loading) => {
    if (!loading && switchingStore.value) {
      // Give a small delay to ensure all data is loaded
      setTimeout(() => {
        switchingStore.value = false
        previousStoreId.value = null
      }, 300)
    }
  }
)

// Auto-expand departments when navigating to departments route
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/dashboard/departments')) {
      // Extract department ID from route if available
      const deptId = route.params.id as string
      if (deptId && deptId !== 'index') {
        expandedDepartments[deptId] = true
        // Find which store this department belongs to and expand it
        const dept = departmentsStore.departments.find((d) => d.id === deptId)
        if (dept?.storeId) {
          expandedStores[dept.storeId] = true
        }
      }
    }

    // Auto-expand store when navigating to store departments page
    if (path.startsWith('/dashboard/stores/') && path.includes('/departments')) {
      const storeId = route.params.storeId as string
      if (storeId) {
        expandedStores[storeId] = true
        // Also fetch departments for this store if not already loaded
        if (authStore.currentUser && departmentsStore.departments.length === 0) {
          departmentsStore
            .fetchDepartments()
            .catch((err) => console.error('Error fetching departments:', err))
        }
      }
    }
  },
  { immediate: true }
)

// Collapse folder list when leaving inventory; expand only via chevron (not link click)
watch(
  () => route.path,
  (path) => {
    if (!path.startsWith('/dashboard/inventory')) {
      inventoryExpanded.value = false
    }
  },
  { immediate: true }
)

const inventoryFolders = computed(() => {
  if (!inventoryStore.folders) return []
  // Filter to ensure only valid inventory folders are shown
  return inventoryStore.folders.filter(
    (folder) => folder && folder.id && folder.name && typeof folder.name === 'string'
  )
})

const recentFolders = computed(() => {
  // Only show inventory folders, sorted by most recently updated
  return [...inventoryFolders.value]
    .filter((folder) => folder && folder.id) // Additional safety check
    .sort((a, b) => {
      const dateA =
        a.updatedAt instanceof Date
          ? a.updatedAt
          : a.updatedAt
          ? new Date(a.updatedAt)
          : new Date(a.createdAt)
      const dateB =
        b.updatedAt instanceof Date
          ? b.updatedAt
          : b.updatedAt
          ? new Date(b.updatedAt)
          : new Date(b.createdAt)
      return dateB.getTime() - dateA.getTime()
    })
})

// Current store
const currentStore = computed(() => storesStore.currentStore)

// Super-admins: only plan-eligible branches (oldest-first when over limit). Staff: full assigned list.
const storesList = computed(() => {
  const allStores =
    userStore.userData?.role === 'superAdmin' ? eligibleStores.value : storesStore.stores
  const current = currentStore.value
  if (!current || !allStores.some((s) => s.id === current.id)) return allStores
  const otherStores = allStores.filter((s) => s.id !== current.id)
  return [current, ...otherStores]
})

// Get departments for a specific store
const getDepartmentsForStore = (storeId: string) => {
  return departmentsStore.departments.filter((dept) => dept.storeId === storeId)
}

// Get staff for a specific department
const getStaffForDepartment = (departmentId: string) => {
  return staffStore.staff.filter((s) => s.departmentId === departmentId)
}

// Toggle store expansion
const toggleStoreExpanded = (storeId: string) => {
  expandedStores[storeId] = !expandedStores[storeId]
  // Fetch departments for this store when expanding
  if (expandedStores[storeId] && authStore.currentUser) {
    departmentsStore
      .fetchDepartments()
      .catch((err) => console.error('Error fetching departments:', err))
  }
}

// Toggle department expansion
const toggleDepartmentExpanded = async (departmentId: string) => {
  expandedDepartments[departmentId] = !expandedDepartments[departmentId]
  // Fetch staff for this department when expanding
  if (expandedDepartments[departmentId] && authStore.currentUser) {
    try {
      await staffStore.fetchStaffByDepartment(departmentId)
    } catch (err) {
      console.error('Error fetching staff:', err)
    }
  }
}

// Departments navigation (kept for compatibility)
const isDepartmentsRoute = computed(() => {
  if (route.path.startsWith('/dashboard/departments')) return true
  return route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
})

const departmentsList = computed(() => {
  if (!departmentsStore.departments) return []
  return departmentsStore.departments
})

// Cache user profile info to prevent UI flickering during staff creation (sign out/sign in process)
// Store the super admin's info when they first load, and preserve it during staff creation
// Persist to localStorage to survive page refreshes
const getCachedUserName = (): string | null => {
  if (!import.meta.client) return null
  const stored = localStorage.getItem('cached_user_name')
  const storedUserId = localStorage.getItem('cached_user_id')
  const currentUserId = authStore.currentUser?.uid
  // Only return cached name if it's for the current user
  if (stored && storedUserId === currentUserId) {
    return stored
  }
  return null
}

const getCachedUserEmail = (): string | null => {
  if (!import.meta.client) return null
  const stored = localStorage.getItem('cached_user_email')
  const storedUserId = localStorage.getItem('cached_user_id')
  const currentUserId = authStore.currentUser?.uid
  // Only return cached email if it's for the current user
  if (stored && storedUserId === currentUserId) {
    return stored
  }
  return null
}

const getCachedUserId = (): string | null | undefined => {
  if (!import.meta.client) return null
  const stored = localStorage.getItem('cached_user_id')
  return stored || null
}

const setCachedUserName = (name: string | null, userId: string | null | undefined) => {
  if (!import.meta.client) return
  if (name && userId) {
    localStorage.setItem('cached_user_name', name)
    localStorage.setItem('cached_user_id', userId)
  }
}

const setCachedUserEmail = (email: string | null, userId: string | null | undefined) => {
  if (!import.meta.client) return
  if (email && userId) {
    localStorage.setItem('cached_user_email', email)
    localStorage.setItem('cached_user_id', userId)
  }
}

const clearCachedUser = () => {
  if (!import.meta.client) return
  localStorage.removeItem('cached_user_name')
  localStorage.removeItem('cached_user_email')
  localStorage.removeItem('cached_user_id')
}

// Initialize from localStorage on mount
const cachedUserName = ref<string | null>(getCachedUserName())
const cachedUserEmail = ref<string | null>(getCachedUserEmail())
const cachedUserId = ref<string | null | undefined>(getCachedUserId())

// Watch userStore.userData to cache super admin info when it's first loaded
watch(
  () => userStore.userData,
  (userData, oldUserData) => {
    // Check if staff creation is in progress - don't update cache during staff creation
    if (isStaffCreationInProgress() && cachedUserName.value) {
      return
    }

    // Only cache if this is a super admin (not staff) and we don't already have cached data
    if (userData?.role === 'superAdmin' && userData.uid) {
      // Only cache if this is a new user or we don't have cached data yet
      if (!cachedUserName.value || cachedUserId.value !== userData.uid) {
        if (userData.name) {
          cachedUserName.value = userData.name
          cachedUserId.value = userData.uid
          setCachedUserName(userData.name, userData.uid)
        }
        // Cache email from auth if available
        if (authStore.currentUser?.email && authStore.currentUser.uid === userData.uid) {
          cachedUserEmail.value = authStore.currentUser.email
          cachedUserId.value = authStore.currentUser.uid
          setCachedUserEmail(authStore.currentUser.email, authStore.currentUser.uid)
        }
      }
    }
  },
  { immediate: true }
)

// User profile data - use cached values during staff creation to prevent UI bug
const userName = computed(() => {
  // During SSR, return a safe default to prevent hydration mismatch
  if (import.meta.server) {
    return 'User'
  }

  const currentUserId = authStore.currentUser?.uid

  // During staff creation, always use cached name if available (preserve super admin name)
  if (isStaffCreationInProgress() && cachedUserName.value) {
    return cachedUserName.value
  }

  // If we have a cached name for the same user, keep using it (prevents flicker)
  // Also check localStorage in case ref was reset on refresh
  if (cachedUserName.value && cachedUserId.value === currentUserId) {
    return cachedUserName.value
  }

  // Check localStorage if ref cache is empty (e.g., after page refresh)
  if (!cachedUserName.value && currentUserId) {
    const storedName = getCachedUserName()
    const storedUserId = getCachedUserId()
    if (storedName && storedUserId === currentUserId) {
      cachedUserName.value = storedName
      cachedUserId.value = storedUserId
      return storedName
    }
  }

  // If no current user but we have cached data, use cache (prevents flicker during sign out)
  if (!currentUserId && cachedUserName.value) {
    return cachedUserName.value
  }

  // Try to get name from Firestore userData first (only if it's for the current auth user)
  // During staff creation, ignore userData if it's for staff (preserve super admin cache)
  if (userStore.userData?.name && currentUserId && userStore.userData.uid === currentUserId) {
    const name = userStore.userData.name ?? null
    const userRole = userStore.userData.role

    // During staff creation, if userData shows staff, ignore it and use cache
    if (isStaffCreationInProgress() && userRole === 'staff') {
      return cachedUserName.value || 'User'
    }

    // Only use and cache if it's the super admin (not staff)
    if (name && userRole === 'superAdmin') {
      if (!isStaffCreationInProgress()) {
        cachedUserName.value = name
        cachedUserId.value = currentUserId ?? null
        setCachedUserName(name, currentUserId ?? null)
      }
      return name
    }
  }
  // Fallback to Firebase Auth displayName
  if (authStore.currentUser?.displayName && currentUserId && !isStaffCreationInProgress()) {
    const name = authStore.currentUser.displayName ?? null
    if (name) {
      cachedUserName.value = name
      cachedUserId.value = currentUserId ?? null
      setCachedUserName(name, currentUserId ?? null)
      return name
    }
  }
  // Fallback to email prefix (part before @) - but only if we don't have a cached name
  // This prevents overwriting a cached name with email prefix on refresh
  const currentEmail = authStore.currentUser?.email
  if (currentEmail && currentUserId && !isStaffCreationInProgress()) {
    // Only use email prefix if we don't have a cached name in localStorage
    const storedName = getCachedUserName()
    if (!storedName || getCachedUserId() !== currentUserId) {
      const emailPrefix = currentEmail.split('@')[0]!
      cachedUserName.value = emailPrefix
      cachedUserEmail.value = currentEmail
      cachedUserId.value = currentUserId ?? null
      setCachedUserName(emailPrefix, currentUserId ?? null)
      setCachedUserEmail(currentEmail, currentUserId ?? null)
      return emailPrefix
    } else {
      // Use the stored name instead of email prefix
      cachedUserName.value = storedName
      cachedUserId.value = currentUserId ?? null
      return storedName
    }
  }

  // If no current user but we have cached data, use cache (prevents flicker)
  if (cachedUserName.value) {
    return cachedUserName.value
  }

  return 'User'
})

const { formatGreeting } = useTimeGreeting()
const commandHeaderGreeting = computed(() => formatGreeting(userName.value || ''))
const commandHeaderPageTitle = computed(() => {
  const path = route.path
  if (path === '/dashboard' || path === '/dashboard/') return ''
  return currentPageName.value
})

const userEmail = computed(() => {
  // During SSR, return a safe default to prevent hydration mismatch
  if (import.meta.server) {
    return ''
  }

  const currentUserId = authStore.currentUser?.uid

  // During staff creation, always use cached email if available (preserve super admin email)
  if (isStaffCreationInProgress() && cachedUserEmail.value) {
    return cachedUserEmail.value
  }

  // If we have cached email for the same user, keep using it
  // Also check localStorage in case ref was reset on refresh
  if (cachedUserEmail.value && cachedUserId.value === currentUserId) {
    return cachedUserEmail.value
  }

  // Check localStorage if ref cache is empty (e.g., after page refresh)
  if (!cachedUserEmail.value && currentUserId) {
    const storedEmail = getCachedUserEmail()
    const storedUserId = getCachedUserId()
    if (storedEmail && storedUserId === currentUserId) {
      cachedUserEmail.value = storedEmail
      cachedUserId.value = storedUserId
      return storedEmail
    }
  }

  // If no current user but we have cached data, use cache (prevents flicker during sign out)
  if (!currentUserId && cachedUserEmail.value) {
    return cachedUserEmail.value
  }

  const email = authStore.currentUser?.email || ''

  // Cache it for this user (only if not staff creation and it's super admin)
  if (email && currentUserId && !isStaffCreationInProgress()) {
    // Only cache if userStore indicates this is the current user (same uid) and is super admin (or we don't have userData yet)
    const isCurrentUserData = userStore.userData && userStore.userData.uid === currentUserId
    if ((isCurrentUserData && userStore.userData?.role === 'superAdmin') || !userStore.userData) {
      cachedUserEmail.value = email
      cachedUserId.value = currentUserId ?? null
      setCachedUserEmail(email, currentUserId ?? null)
    }
  }

  // During staff creation, if userData shows staff, ignore it and use cache
  if (isStaffCreationInProgress() && userStore.userData?.role === 'staff') {
    return cachedUserEmail.value || ''
  }

  return email
})

const userInitials = computed(() => {
  const name = userName.value
  if (!name || name === 'User') {
    // If no name, use first two letters of email
    const email = userEmail.value
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Split name and get first letter of each word
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    // First letter of first name + first letter of last name
    const first = parts[0]?.[0] || ''
    const last = parts[parts.length - 1]?.[0] || ''
    return (first + last).toUpperCase()
  } else if (parts.length === 1 && parts[0]) {
    // Single name, use first two letters
    return parts[0].substring(0, 2).toUpperCase()
  }
  return 'U'
})

const showLogoutConfirm = ref(false)
const loggingOut = ref(false)

const handleSignOut = () => {
  showLogoutConfirm.value = true
}

const cancelSignOut = () => {
  if (loggingOut.value) return
  showLogoutConfirm.value = false
}

const confirmSignOut = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  if (isDemoDashboard.value) {
    const { clearDemoSession } = await import('~/utils/demo-mode')
    clearDemoSession()
    showLogoutConfirm.value = false
    loggingOut.value = false
    return navigateTo('/')
  }
  const { signOut } = useFirebaseAuth()
  try {
    userStore.clearUserData()
    clearCachedUser()
    cachedUserName.value = null
    cachedUserEmail.value = null
    cachedUserId.value = null
    authStore.currentUser = null
    authStore.loading = false
    await signOut()
    await navigateTo('/signin', { replace: true })
  } catch (error) {
    console.error('Sign out error:', error)
    userStore.clearUserData()
    clearCachedUser()
    cachedUserName.value = null
    cachedUserEmail.value = null
    cachedUserId.value = null
    authStore.currentUser = null
    authStore.loading = false
    await navigateTo('/signin', { replace: true })
  } finally {
    showLogoutConfirm.value = false
    loggingOut.value = false
  }
}

// Close dropdowns on outside click
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  const eventPath = typeof event.composedPath === 'function' ? event.composedPath() : []
  const inNotifications =
    notificationsRef.value?.contains(target) ||
    notificationsPanelRef.value?.contains(target) ||
    eventPath.includes(notificationsRef.value as EventTarget) ||
    eventPath.includes(notificationsPanelRef.value as EventTarget)
  if (notificationsOpen.value && !inNotifications) {
    notificationsOpen.value = false
  }
}

// Close sidebar on mobile when route changes
watch(
  () => route.path,
  () => {
    clearNativeOverlayLock()
    useAssistantStore().close()
    if (import.meta.client && sidebarOpen.value) {
      // Check if we're on mobile (screen width < 1024px which is lg breakpoint)
      if (window.innerWidth < 1024) {
        sidebarOpen.value = false
      }
    }
  }
)

// Authentication guard - redirect if no user
const checkAuth = async () => {
  if (!import.meta.client) {
    checkingAuth.value = false
    return
  }

  checkingAuth.value = authStore.loading

  try {
    await waitForAuthStore(authStore, getAuthWaitMs())
  } finally {
    checkingAuth.value = false
  }

  // Redirect to signin if no user after loading completes
  // But add loop prevention
  if (!authStore.loading && !authStore.currentUser) {
    // Prevent redirect loops
    const redirectKey = 'dashboard_layout_redirect'
    if (sessionStorage.getItem(redirectKey) === 'true') {
      // Already redirecting, don't redirect again
      return
    }

    // Check redirect count
    const redirectCount = parseInt(sessionStorage.getItem('dashboard_redirect_count') || '0')
    if (redirectCount >= 2) {
      // Too many redirects - break the loop
      sessionStorage.removeItem('dashboard_redirect_count')
      sessionStorage.removeItem(redirectKey)
      return // Allow page to load
    }

    // Set flag to prevent loops
    sessionStorage.setItem(redirectKey, 'true')
    sessionStorage.setItem('dashboard_redirect_count', String(redirectCount + 1))
    setTimeout(() => {
      sessionStorage.removeItem(redirectKey)
      sessionStorage.removeItem('dashboard_redirect_count')
    }, 3000)

    return navigateTo('/signin')
  }

  // Clear redirect flags if user is authenticated
  if (authStore.currentUser) {
    sessionStorage.removeItem('dashboard_layout_redirect')
    sessionStorage.removeItem('dashboard_redirect_count')
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (import.meta.client) {
    window.addEventListener('resize', onNotificationsScrollOrResize)
    window.addEventListener('scroll', onNotificationsScrollOrResize, true)
    if (!isCapacitorNative()) {
      window.addEventListener('keydown', handleGlobalSearchShortcut)
    }
    if (isCapacitorNative()) {
      assistantShellReady.value = true
      scheduleNativeIdleWork(() => mountSearchShell(), 3500)
    } else {
      scheduleNativeIdleWork(() => mountShellWidgets(), 2500)
    }
    await checkAuth()

    if (authStore.currentUser?.uid && !authStore.loading) {
      await runDashboardShellBootstrap()
    }

    // Initialize cache from localStorage after auth loads
    const currentUserId = authStore.currentUser?.uid
    if (currentUserId) {
      const storedName = getCachedUserName()
      const storedEmail = getCachedUserEmail()
      const storedUserId = getCachedUserId()

      // Only use stored values if they match the current user
      if (storedUserId === currentUserId) {
        if (storedName) {
          cachedUserName.value = storedName
        }
        if (storedEmail) {
          cachedUserEmail.value = storedEmail
        }
        cachedUserId.value = storedUserId
      }
    }

    // Staff with temporary password must change it before using the app
    if (authStore.currentUser?.uid && !authStore.loading) {
      const ud = userStore.userData
      if (
        ud?.role === 'staff' &&
        ud.mustChangePassword &&
        route.path !== '/dashboard/change-password'
      ) {
        await navigateTo('/dashboard/change-password')
      }
    }
  }
})

// Watch for auth state changes to fetch user data and protect routes
watch(
  () => authStore.currentUser,
  async (user, oldUser) => {
    // Check if staff creation is in progress - don't redirect or update user data during temporary sign-out
    // Redirect to signin if user logs out (but not during staff creation)
    if (import.meta.client && !authStore.loading && !user && !isStaffCreationInProgress()) {
      if (isDemoDashboard.value) return
      // Prevent redirect loops
      const redirectKey = 'dashboard_watch_redirect'
      if (sessionStorage.getItem(redirectKey) === 'true') {
        return // Already redirecting
      }

      // Set flag
      sessionStorage.setItem(redirectKey, 'true')
      setTimeout(() => sessionStorage.removeItem(redirectKey), 3000)

      return navigateTo('/signin')
    }

    // During staff creation, don't fetch or update userData to preserve super admin's profile info
    if (isStaffCreationInProgress()) {
      // console.log('[Dashboard] Staff creation in progress - preserving super admin userData')
      return
    }

    // Only fetch if:
    // 1. User exists
    // 2. We don't have userData OR the user changed (not just signed back in)
    // 3. Staff creation is not in progress
    if (user?.uid && !authStore.loading) {
      const hasUserData = userStore.userData && userStore.userData.uid === user.uid
      const userChanged = oldUser?.uid !== user.uid

      // If user changed, clear old user data and cache so nav never shows previous user
      if (userChanged && !isStaffCreationInProgress()) {
        userStore.clearUserData()
        cachedUserName.value = null
        cachedUserEmail.value = null
        cachedUserId.value = null

        // Load new user's cache from localStorage (if they signed in before)
        const storedName = getCachedUserName()
        const storedEmail = getCachedUserEmail()
        const storedUserId = getCachedUserId()

        if (storedUserId === user.uid) {
          if (storedName) cachedUserName.value = storedName
          if (storedEmail) cachedUserEmail.value = storedEmail
          cachedUserId.value = storedUserId
        }
      }

      // Only fetch if we don't have data for this user or if user actually changed
      // Don't fetch during staff creation to prevent overwriting super admin data
      // IMPORTANT: Always fetch when user is available and auth is ready
      if ((!hasUserData || userChanged) && !isStaffCreationInProgress()) {
        try {
          await userStore.fetchUserData(user.uid)
          // console.log('[Dashboard] User data fetched in watch:', userStore.userData)
        } catch (err) {
          console.error('[Dashboard] Error fetching user data in watch:', err)
        }
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (import.meta.client) {
    window.removeEventListener('resize', onNotificationsScrollOrResize)
    window.removeEventListener('scroll', onNotificationsScrollOrResize, true)
    if (!isCapacitorNative()) {
      window.removeEventListener('keydown', handleGlobalSearchShortcut)
    }
    clearNativeOverlayLock()
  }
})
</script>
