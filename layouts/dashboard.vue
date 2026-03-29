<template>
  <!-- Loading state while checking authentication -->
  <div v-if="checkingAuth" class="min-h-screen bg-gray-50 dark:bg-gray-900 w-full flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
      <p class="text-sm text-gray-600 dark:text-gray-400">Verifying authentication...</p>
    </div>
  </div>
  
  <!-- Dashboard content (only shown if authenticated) -->
  <div v-else class="min-h-screen bg-gray-100 dark:bg-[#07080c] w-full overflow-x-clip relative">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex flex-col transition-[transform,width] duration-300 ease-in-out lg:translate-x-0',
        /* Same base as main canvas — separation is shadow only */
        'bg-gray-100 dark:bg-[#07080c]',
        'shadow-[8px_0_32px_-12px_rgba(15,23,42,0.08)] dark:shadow-[16px_0_48px_-16px_rgba(0,0,0,0.85)]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      ]"
    >
      <!-- Logo / Brand -->
      <div
        class="flex h-12 min-h-[3rem] shrink-0 items-center justify-between border-b border-gray-200/25 px-3 dark:border-white/[0.05]"
      >
        <NuxtLink
          to="/dashboard"
          :class="['flex items-center transition-all duration-300', sidebarCollapsed ? 'justify-center w-full' : 'gap-1.5 min-w-0']"
        >
          <img
            :src="logoSource"
            alt="Storvv"
            :class="[
              'shrink-0 object-contain transition-[height,width,max-width] duration-300 ease-in-out',
              sidebarCollapsed ? 'h-4 w-auto max-w-[46px]' : 'h-5 max-w-[100px]',
            ]"
          />
        </NuxtLink>
        <button
          v-if="!sidebarCollapsed"
          @click="sidebarOpen = false"
          class="rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-white/80 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-900/60 dark:hover:text-gray-200 lg:hidden"
          aria-label="Close menu"
        >
          <XMarkIcon class="w-4 h-4" stroke-width="2" />
        </button>
      </div>

      <!-- Collapse toggle (desktop) - larger on large screens -->
      <button
        @click="toggleSidebar"
        class="absolute top-10 -right-3 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-md ring-1 ring-gray-200/60 transition-colors hover:text-gray-800 dark:bg-[#12141c] dark:text-gray-400 dark:shadow-lg dark:ring-white/10 dark:hover:bg-[#161922] dark:hover:text-gray-100 lg:flex"
        :title="sidebarCollapsed ? 'Expand' : 'Collapse'"
        aria-label="Toggle sidebar"
      >
        <ChevronRightIcon v-if="sidebarCollapsed" class="w-3.5 h-3.5" stroke-width="2.5" />
        <ChevronLeftIcon v-else class="w-3.5 h-3.5" stroke-width="2.5" />
      </button>

      <!-- Navigation -->
      <nav
        class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1.5"
        :class="sidebarCollapsed ? 'px-1.5' : 'px-2.5'"
      >
        <div class="min-h-0 space-y-0.5">
          <template v-for="item in filteredNavigation" :key="item.name">
            <!-- Inventory (expandable) -->
            <div v-if="item.name === 'Inventory' && !sidebarCollapsed" class="space-y-0.5">
              <div
                :class="[
                  'group relative flex w-full items-center justify-between rounded-l-[1px] transition-all duration-200',
                  sidebarCollapsed ? 'px-1.5 py-1' : 'px-2.5 py-1.5',
                  isActive(item.href)
                    ? 'border-l-[5px] border-primary-500 pl-2 font-bold text-primary-800 dark:border-primary-400 dark:text-primary-200'
                    : 'border-l-[5px] border-transparent pl-2 hover:border-primary-500/55 hover:font-semibold dark:hover:border-primary-400/50'
                ]"
              >
                <NuxtLink
                  :to="item.href"
                  class="flex items-center flex-1 min-w-0"
                  :class="{ 'pointer-events-none opacity-50': switchingStore }"
                >
                  <component
                    :is="item.icon"
                    :class="[
                      'w-4 h-4 shrink-0 transition-colors',
                      sidebarCollapsed ? '' : 'mr-2.5',
                      isActive(item.href) ? 'text-primary-600 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                    ]"
                    :stroke-width="isActive(item.href) ? 2.25 : 1.5"
                  />
                  <span class="truncate text-[13px]" :class="isActive(item.href) ? 'font-bold text-primary-800 dark:text-primary-200' : 'font-medium text-gray-700 group-hover:font-semibold dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'">
                    {{ item.name }}
                  </span>
                </NuxtLink>
                <button
                  @click.stop="inventoryExpanded = !inventoryExpanded"
                  class="shrink-0 rounded-full p-1 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
                  :class="isActive(item.href) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'"
                >
                  <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="inventoryExpanded ? 'rotate-180' : ''" stroke-width="2" />
                </button>
              </div>
              <div v-if="inventoryExpanded && inventoryFolders.length > 0" class="space-y-0.5 border-l border-gray-200/40 py-0.5 pl-3 pr-1.5 dark:border-white/[0.06]">
                <NuxtLink
                  v-for="folder in recentFolders.slice(0, 5)"
                  :key="folder.id"
                  :to="`/dashboard/inventory/${folder.id}`"
                  :class="[
                    'group flex items-center gap-2 rounded-l-[1px] px-2 py-1 text-[13px] transition-colors',
                    route.params.id === folder.id
                      ? 'border-l-[5px] border-primary-500 pl-2 font-bold text-primary-800 dark:border-primary-400 dark:text-primary-200'
                      : 'border-l-[5px] border-transparent pl-2 text-gray-600 hover:border-primary-500/55 hover:font-semibold hover:text-gray-900 dark:text-gray-400 dark:hover:border-primary-400/50 dark:hover:text-gray-100',
                    { 'pointer-events-none opacity-50': switchingStore }
                  ]"
                >
                  <FolderIcon class="w-3.5 h-3.5 shrink-0" :class="route.params.id === folder.id ? 'text-primary-600 dark:text-primary-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200'" :stroke-width="route.params.id === folder.id ? 2.25 : 1.75" />
                  <span class="truncate flex-1" :class="route.params.id === folder.id ? 'font-bold' : 'group-hover:font-semibold'">{{ folder.name }}</span>
                  <ArrowRightIcon v-if="route.params.id === folder.id" class="w-3.5 h-3.5 shrink-0 text-primary-500 dark:text-primary-400" stroke-width="2" />
                </NuxtLink>
              </div>
            </div>

            <!-- Regular nav items -->
            <NuxtLink
              v-else-if="(item.name !== 'Inventory' && item.name !== 'Departments') || sidebarCollapsed"
              :to="item.href"
              :data-tutorial="item.name.toLowerCase().replace(/\s+/g, '-')"
              :class="[
                'group relative flex items-center rounded-l-[1px] transition-all duration-200',
                sidebarCollapsed ? 'w-full justify-center py-1.5' : 'gap-2.5 px-2.5 py-1.5',
                isActive(item.href)
                  ? sidebarCollapsed
                    ? 'ring-4 ring-primary-500/50 text-primary-600 dark:text-primary-300 dark:ring-primary-400/45'
                    : 'border-l-[5px] border-primary-500 pl-2 font-bold text-primary-800 dark:border-primary-400 dark:text-primary-200'
                  : sidebarCollapsed
                    ? 'ring-4 ring-transparent hover:ring-primary-500/40 dark:hover:ring-primary-400/35 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                    : 'border-l-[5px] border-transparent pl-2 text-gray-600 hover:border-primary-500/55 hover:font-semibold hover:text-gray-900 dark:text-gray-400 dark:hover:border-primary-400/50 dark:hover:text-gray-100',
                { 'pointer-events-none opacity-50': switchingStore }
              ]"
              :title="sidebarCollapsed ? item.name : ''"
            >
              <component
                :is="item.icon"
                :class="[
                  'w-4 h-4 shrink-0 transition-colors',
                  sidebarCollapsed ? '' : 'mr-0',
                  isActive(item.href) ? 'text-primary-600 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                ]"
                :stroke-width="isActive(item.href) ? 2.25 : 1.75"
              />
              <span v-if="!sidebarCollapsed" class="truncate text-[13px]" :class="isActive(item.href) ? 'font-bold text-primary-800 dark:text-primary-200' : 'font-medium text-gray-700 group-hover:font-semibold dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100'">
                {{ item.name }}
              </span>
              <!-- Tooltip when collapsed -->
              <div
                v-if="sidebarCollapsed"
                class="pointer-events-none invisible absolute left-full z-50 ml-2 inline-flex w-max min-w-max max-w-none shrink-0 items-center whitespace-nowrap rounded-sm border border-gray-700/40 bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:border-gray-700/50 dark:bg-gray-950"
              >
                {{ item.name }}
                <div class="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
              </div>
            </NuxtLink>
          </template>
          
          <!-- Stores (super admins) - Fathom-style section -->
          <div
            v-if="userStore.isSuperAdmin && !sidebarCollapsed"
            class="mt-2 rounded-sm bg-white/55 p-1 shadow-sm ring-1 ring-gray-200/45 dark:bg-[#0c0e14] dark:shadow-inner dark:ring-white/[0.06]"
          >
            <button
              type="button"
              @click="storesSectionCollapsed = !storesSectionCollapsed"
              class="flex w-full items-center justify-between rounded-sm px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
            >
              <span>Branches</span>
              <ChevronDownIcon class="w-3 h-3 transition-transform duration-200" :class="storesSectionCollapsed ? '' : 'rotate-180'" stroke-width="2" />
            </button>
            <div v-if="!storesSectionCollapsed" class="mt-0.5 space-y-0.5 pl-0">
              <template v-for="store in storesList" :key="store.id">
                <div
                  :class="[
                    'flex items-center justify-between rounded-l-[1px] px-2 py-1 transition-all duration-200',
                    route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                      ? 'border-l-[5px] border-primary-500 pl-2 font-bold text-primary-800 dark:border-primary-400 dark:text-primary-200'
                      : currentStore?.id === store.id
                        ? 'border-l-[5px] border-transparent pl-2 font-medium text-gray-900 dark:text-gray-100'
                        : store.id !== storesStore.currentStoreId
                          ? 'opacity-50'
                          : 'group border-l-[5px] border-transparent pl-2 hover:border-primary-500/55 hover:font-semibold hover:text-gray-900 dark:hover:border-primary-400/50 dark:hover:text-gray-100'
                  ]"
                >
                  <NuxtLink
                    :to="store.id === storesStore.currentStoreId ? `/dashboard/stores/${store.id}/departments` : '#'"
                    class="flex items-center flex-1 min-w-0 gap-2"
                    :class="{ 'pointer-events-none cursor-not-allowed': switchingStore || (store.id !== storesStore.currentStoreId) }"
                    :title="store.id !== storesStore.currentStoreId ? 'Switch to this store to access it' : ''"
                    @click.prevent="store.id !== storesStore.currentStoreId ? null : null"
                  >
                    <svg
                      class="w-4 h-4 shrink-0"
                      :class="
                        route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                          ? 'text-primary-600 dark:text-primary-300'
                          : currentStore?.id === store.id
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-200'
                      "
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      :stroke-width="
                        route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                          ? 2.25
                          : 1.75
                      "
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span
                      class="truncate text-[13px]"
                      :class="
                        route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                          ? 'font-bold text-primary-800 dark:text-primary-200'
                          : currentStore?.id === store.id
                            ? 'font-medium text-gray-900 dark:text-gray-100'
                            : 'font-medium text-gray-700 group-hover:font-semibold group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100'
                      "
                    >
                      {{ store.name }}
                    </span>
                    <span v-if="currentStore?.id === store.id || store.id === storesStore.currentStoreId" class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Active store"></span>
                    <span v-if="store.id !== storesStore.currentStoreId" class="text-[9px] text-gray-400 dark:text-gray-500 italic shrink-0">Inactive</span>
                  </NuxtLink>
                  <button
                    v-if="store.id === storesStore.currentStoreId"
                    @click.stop="toggleStoreExpanded(store.id)"
                    class="shrink-0 rounded-full p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="expandedStores[store.id] ? 'rotate-180' : ''" stroke-width="2" />
                  </button>
                </div>
                <div v-if="expandedStores[store.id] && store.id === storesStore.currentStoreId" class="space-y-0.5 border-l border-gray-200/40 py-0.5 pl-3 pr-1 dark:border-white/[0.06]">
                  <template v-for="department in getDepartmentsForStore(store.id)" :key="department.id">
                    <div class="group flex items-center justify-between gap-1 rounded-l-[1px]">
                      <NuxtLink
                        :to="`/dashboard/departments/${department.id}`"
                        class="group flex min-w-0 flex-1 items-center gap-2 rounded-l-[1px] px-2 py-1 text-[13px] transition-colors"
                        :class="[
                          route.params.id === department.id && route.path.startsWith('/dashboard/departments')
                            ? 'border-l-[5px] border-primary-500 pl-2 font-bold text-primary-800 dark:border-primary-400 dark:text-primary-200'
                            : 'border-l-[5px] border-transparent pl-2 text-gray-600 hover:border-primary-500/55 hover:font-semibold hover:text-gray-900 dark:text-gray-400 dark:hover:border-primary-400/50 dark:hover:text-gray-100',
                          { 'pointer-events-none opacity-50': switchingStore }
                        ]"
                      >
                        <BuildingOfficeIcon class="w-3.5 h-3.5 shrink-0" :class="route.params.id === department.id ? 'text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200'" :stroke-width="route.params.id === department.id ? 2.25 : 1.75" />
                        <span class="truncate flex-1" :class="route.params.id === department.id ? 'font-bold' : 'group-hover:font-semibold'">{{ department.name }}</span>
                      </NuxtLink>
                      <button
                        @click.stop="toggleDepartmentExpanded(department.id)"
                        class="shrink-0 rounded-full p-1 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        :aria-expanded="expandedDepartments[department.id]"
                      >
                        <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="expandedDepartments[department.id] ? 'rotate-180' : ''" stroke-width="2" />
                      </button>
                    </div>
                    <div v-if="expandedDepartments[department.id]" class="pl-5 pr-1.5 pb-0.5 space-y-0.5">
                      <template v-if="getStaffForDepartment(department.id).length > 0">
                        <NuxtLink
                          v-for="member in getStaffForDepartment(department.id)"
                          :key="member.id"
                          :to="`/dashboard/departments/${department.id}`"
                          class="flex items-center gap-1.5 rounded-l-[1px] px-2 py-0.5 text-[11px] text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                        >
                          <span class="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 shrink-0"></span>
                          <span class="truncate">{{ (member.firstName && member.lastName) ? `${member.firstName} ${member.lastName}` : (member.email || 'Staff') }}</span>
                        </NuxtLink>
                      </template>
                      <p v-else class="px-2.5 py-1 text-[11px] text-gray-400 dark:text-gray-500">No staff</p>
                    </div>
                  </template>
                  <NuxtLink
                    v-if="getDepartmentsForStore(store.id).length === 0"
                    :to="`/dashboard/stores/${store.id}/departments`"
                    class="block px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    View departments →
                  </NuxtLink>
                </div>
              </template>
              <div v-if="storesList.length === 0" class="px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400">No stores</div>
            </div>
          </div>
        </div>

        <!-- Recent Items -->
        <div v-if="!sidebarCollapsed" class="mt-auto pt-2">
          <RecentItemsWidget />
        </div>
      </nav>

      <!-- Bottom: user + sign out -->
      <div
        class="shrink-0 border-t border-gray-200/25 dark:border-white/[0.05]"
        :class="sidebarCollapsed ? 'px-1.5 pb-2 pt-2' : 'px-2.5 pb-2.5 pt-2'"
      >
        <div
          class="rounded-sm bg-white/70 p-2 shadow-sm ring-1 ring-gray-200/45 dark:bg-[#12141c]/95 dark:shadow-lg dark:ring-white/[0.07]"
          :class="sidebarCollapsed ? 'px-1.5' : ''"
        >
          <div class="flex items-center gap-2.5" :class="sidebarCollapsed ? 'relative justify-center group' : ''">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-800 ring-1 ring-gray-200/50 dark:bg-gray-800 dark:text-gray-100 dark:ring-white/10"
            >
              {{ userInitials }}
            </div>
            <div v-if="!sidebarCollapsed" class="min-w-0 flex-1">
              <p class="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{{ userName }}</p>
              <p class="truncate text-[11px] text-gray-500 dark:text-gray-400">{{ userEmail }}</p>
            </div>
            <div
              v-if="sidebarCollapsed"
              class="pointer-events-none invisible absolute left-full z-50 ml-2 inline-flex w-max min-w-max max-w-none shrink-0 flex-col items-start whitespace-nowrap rounded-sm border border-gray-700/40 bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100 dark:border-gray-700/50 dark:bg-gray-950"
            >
              {{ userName }}
              <span class="block text-[11px] text-gray-400">{{ userEmail }}</span>
              <div class="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
            </div>
          </div>
          <button
            @click="handleSignOut"
            :class="[
              'mt-2 flex w-full items-center justify-center gap-1.5 rounded-sm py-2 text-xs font-medium transition-colors',
              sidebarCollapsed ? 'relative group py-2' : 'px-2',
              'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            ]"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon class="h-4 w-4 shrink-0" stroke-width="1.75" />
            <span v-if="!sidebarCollapsed">Sign out</span>
            <div
              v-if="sidebarCollapsed"
              class="pointer-events-none invisible absolute left-full z-50 ml-2 inline-flex w-max min-w-max max-w-none shrink-0 items-center whitespace-nowrap rounded-sm border border-gray-700/40 bg-gray-900 px-2.5 py-1.5 text-xs text-white opacity-0 transition-all group-hover:visible group-hover:opacity-100 dark:border-gray-700/50 dark:bg-gray-950"
            >
              Sign out
              <div class="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
            </div>
          </button>
          <p class="mt-1.5 text-[9px] text-gray-400 dark:text-gray-500" :class="sidebarCollapsed ? 'text-center' : 'text-left'">
            v{{ appVersion }}
          </p>
        </div>
      </div>
    </aside>

    <!-- Sidebar Overlay (Mobile) -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 dark:bg-opacity-70 lg:hidden"
    ></div>

    <!-- Main Content -->
    <div 
      :class="['min-h-screen transition-[padding-left] duration-300 ease-in-out', sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64']"
      class="w-full"
      style="min-width: 0; max-width: 100vw;"
    >
      <!-- Top Navigation (fixed so it stays visible when scrolling) -->
      <header
        :class="[
          'fixed top-0 left-0 right-0 z-30 border-b border-gray-200/25 bg-gray-100/95 backdrop-blur-sm transition-[left] duration-300 dark:border-white/[0.05] dark:bg-[#07080c]/95 dark:backdrop-blur-sm',
          sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'
        ]"
      >
        <div
          class="flex h-12 w-full items-center justify-between gap-3 px-3 sm:h-[3.25rem] sm:px-4 lg:px-6"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <button
              @click="sidebarOpen = true"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-transparent text-gray-600 dark:text-gray-400 lg:hidden"
              aria-label="Open menu"
            >
              <Squares2X2Icon class="h-5 w-5" stroke-width="1.75" />
            </button>
            <!-- Current page (neutral — no primary “active” treatment) -->
            <div class="hidden min-w-0 items-center md:flex">
              <div class="flex min-w-0 items-center gap-3 py-0.5">
                <component
                  :is="currentPageIcon"
                  class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400"
                  stroke-width="1.75"
                />
                <div class="min-w-0">
                  <p class="text-[9px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
                    Current page
                  </p>
                  <h1 class="truncate text-sm font-medium tracking-tight text-gray-900 dark:text-gray-100">
                    {{ currentPageName }}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          <div
            class="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 md:gap-2"
          >
            <!-- Global search -->
            <button
              type="button"
              @click="searchStore.openSearch()"
              class="hidden h-9 w-full max-w-[11.5rem] items-center gap-2 rounded-sm border-0 bg-transparent px-2 py-1.5 text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 sm:max-w-[13rem] lg:max-w-[15rem] lg:pr-2.5 dark:text-gray-400 md:flex"
              title="Search (⌘K)"
            >
              <MagnifyingGlassIcon
                class="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-500"
                stroke-width="1.75"
              />
              <span class="flex-1 truncate text-left text-xs font-medium text-gray-600 dark:text-gray-400">
                Search workspace…
              </span>
              <kbd
                class="hidden items-center gap-0.5 rounded-sm border border-gray-200/90 bg-gray-50/95 px-1.5 py-0.5 font-mono text-[10px] font-medium text-gray-500 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-400 lg:inline-flex"
              >
                ⌘K
              </kbd>
            </button>

            <!-- Mobile search -->
            <button
              type="button"
              @click="searchStore.openSearch()"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-transparent text-gray-600 dark:text-gray-400 md:hidden"
              title="Search"
              aria-label="Search"
            >
              <MagnifyingGlassIcon class="h-4 w-4" stroke-width="1.75" />
            </button>

            <StoreSelector v-if="userStore.userData?.role === 'superAdmin'" />

            <div class="flex h-9 items-center justify-center rounded-sm bg-transparent px-1">
              <ThemeToggle />
            </div>

            <!-- Notifications dropdown -->
            <div class="relative shrink-0" ref="notificationsRef">
              <button
                type="button"
                @click="notificationsOpen = !notificationsOpen"
                class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-transparent text-gray-600 dark:text-gray-400"
                title="Notifications"
                aria-label="Notifications"
                :aria-expanded="notificationsOpen"
                aria-haspopup="true"
              >
                <BellIcon class="h-4 w-4" stroke-width="1.75" />
                <span
                  v-if="unreadNotificationCount > 0"
                  class="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-950"
                >
                  {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
                </span>
              </button>
              <Teleport to="body">
                <Transition
                  enter-active-class="transition ease-out duration-150"
                  enter-from-class="opacity-0 scale-95"
                  enter-to-class="opacity-100 scale-100"
                  leave-active-class="transition ease-in duration-100"
                  leave-from-class="opacity-100 scale-100"
                  leave-to-class="opacity-0 scale-95"
                >
                  <div
                    v-if="notificationsOpen"
                    class="fixed z-[100] w-[min(18rem,calc(100vw-2rem))] origin-top-right top-[calc(3rem+0.25rem)] sm:top-[calc(3.25rem+0.25rem)]"
                    style="right: max(1rem, env(safe-area-inset-right, 0px)); left: auto;"
                    @click.stop
                  >
                    <NotificationsPanel variant="dropdown" @close="notificationsOpen = false" />
                  </div>
                </Transition>
              </Teleport>
            </div>

            <!-- Profile -->
            <div class="relative shrink-0" ref="profileMenuRef">
              <button
                type="button"
                @click="profileMenuOpen = !profileMenuOpen"
                class="flex min-w-0 items-center gap-2 rounded-sm border-0 bg-transparent py-1 pl-1 pr-2 font-medium text-gray-700 dark:text-gray-200 sm:pr-2.5"
                :aria-expanded="profileMenuOpen"
                aria-haspopup="true"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 text-[11px] font-bold text-white ring-2 ring-white/25 dark:ring-primary-900/40 sm:h-8 sm:w-8"
                >
                  {{ userInitials }}
                </div>
                <div class="hidden min-w-0 text-left md:block">
                  <p class="truncate text-xs font-medium tracking-tight text-gray-900 dark:text-gray-50">
                    {{ userName }}
                  </p>
                  <p class="truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {{ userEmail }}
                  </p>
                </div>
                <ChevronDownIcon
                  class="hidden h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform dark:text-gray-500 md:block"
                  :class="profileMenuOpen ? 'rotate-180' : ''"
                  stroke-width="2"
                />
              </button>

              <Teleport to="body">
              <Transition
                enter-active-class="transition-[opacity,transform] duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:duration-150 motion-reduce:ease-out"
                enter-from-class="opacity-0 translate-y-[14px]"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-[opacity,transform] duration-[380ms] ease-[cubic-bezier(0.4,0,1,1)] motion-reduce:duration-100"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 translate-y-2"
              >
             <div
                  v-if="profileMenuOpen"
                  ref="profileMenuPanelRef"
                  class="overflow-hidden rounded-sm border border-gray-200/80 bg-white shadow-[0_12px_40px_-16px_rgba(8,27,64,0.14)] dark:border-gray-800/90 dark:bg-slate-950 dark:shadow-[0_12px_48px_-12px_rgba(0,0,0,0.55)]"
                  :style="profileMenuPanelStyle"
                  @click.stop
                >
                  <!-- User -->
                  <div
                    class="border-b border-gray-200/25 px-3 py-3.5 dark:border-white/[0.06]"
                  >
                    <div class="flex min-w-0 items-center gap-2.5">
                      <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 text-xs font-bold text-white ring-2 ring-primary-400/20"
                      >
                        {{ userInitials }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p
                          class="truncate text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50"
                        >
                          {{ userName }}
                        </p>
                        <p class="mt-0.5 truncate text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                          {{ userEmail }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <nav class="p-1.5" aria-label="Account menu">
                    <NuxtLink
                      to="/dashboard/profile"
                      class="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-inset"
                      @click="profileMenuOpen = false"
                    >
                      <UserCircleIcon
                        class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
                        stroke-width="1.75"
                        aria-hidden="true"
                      />
                      Profile
                    </NuxtLink>
                    <NuxtLink
                      to="/dashboard/settings"
                      class="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/25 focus-visible:ring-inset"
                      @click="profileMenuOpen = false"
                    >
                      <Cog6ToothIcon
                        class="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
                        stroke-width="1.75"
                        aria-hidden="true"
                      />
                      Settings
                    </NuxtLink>
                  </nav>

                  <div class="border-t border-gray-100/90 p-1.5 dark:border-gray-800/80">
                    <button
                      type="button"
                      @click="handleSignOut"
                      class="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20 focus-visible:ring-inset"
                    >
                      <ArrowRightOnRectangleIcon
                        class="h-4 w-4 shrink-0 opacity-90"
                        stroke-width="1.75"
                        aria-hidden="true"
                      />
                      Sign out
                    </button>
                  </div>
                </div>
              </Transition>
              </Teleport>
            </div>
          </div>
        </div>
      </header>

      <!-- Spacer so fixed nav never overlaps page content -->
      <div class="h-12 shrink-0 sm:h-[3.25rem]" aria-hidden="true" />

      <!-- Page Content (same soft entrance as auth pages; re-runs on route change) -->
      <main
        data-dashboard-main
        class="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4 w-full min-w-0 max-w-full overflow-x-clip overflow-y-visible"
      >
        <div
          :key="route.path"
          class="min-w-0 opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none animate-auth-fade-up [animation-delay:40ms]"
        >
          <slot />
        </div>
      </main>
    </div>
    
    <!-- Toast Notifications -->
    <ToastContainer />
    
    <!-- Global Search -->
    <GlobalSearch />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import {
  Squares2X2Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  ReceiptPercentIcon,
  ArrowPathIcon,
  UsersIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  FolderIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
  ShieldCheckIcon,
  BookOpenIcon,
} from '@heroicons/vue/24/outline'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import StoreSelector from '~/components/ui/StoreSelector.vue'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import GlobalSearch from '~/components/search/GlobalSearch.vue'
import RecentItemsWidget from '~/components/ui/RecentItemsWidget.vue'
import NotificationsPanel from '~/components/notifications/NotificationsPanel.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useTheme } from '~/composables/useTheme'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import type { SubscriptionFeature } from '~/types/subscription'
import { useNotificationsStore } from '~/stores/notifications'
import { useInventoryStore } from '~/stores/inventory'
import { useReceiptsStore } from '~/stores/receipts'
import { useDepartmentsStore } from '~/stores/departments'
import { useStoresStore } from '~/stores/stores'
import { useStaffStore } from '~/stores/staff'
import { useSearchStore } from '~/stores/search'

const { actualTheme } = useTheme()

const logoSource = computed(() => {
  return actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
})
const appVersion = (useRuntimeConfig().public.appVersion as string) ?? '1.0'
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

// Fetch notifications on mount
onMounted(() => {
  if (authStore.currentUser) {
    notificationsStore.fetchNotifications()
  }
})

// Watch for auth changes to fetch notifications
watch(() => authStore.currentUser, (newUser) => {
  if (newUser) {
    notificationsStore.fetchNotifications()
  }
})

// Computed unread count
const unreadNotificationCount = computed(() => notificationsStore.unreadCount)
const sidebarOpen = ref(false)
const profileMenuOpen = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)
const profileMenuPanelRef = ref<HTMLElement | null>(null)
const profileMenuPanelStyle = ref<Record<string, string>>({})

function positionProfileMenuPanel() {
  if (!import.meta.client || !profileMenuOpen.value || !profileMenuRef.value) return
  const trigger = profileMenuRef.value
  const r = trigger.getBoundingClientRect()
  const gap = 8
  const vw = window.innerWidth
  const margin = 12
  const panelMax = 16.5 * 16 // 16.5rem
  const widthPx = Math.min(panelMax, vw - 2 * margin)
  let right = vw - r.right
  const leftEdge = vw - right - widthPx
  if (leftEdge < margin) {
    right = Math.max(margin, vw - widthPx - margin)
  }
  profileMenuPanelStyle.value = {
    position: 'fixed',
    top: `${Math.round(r.bottom + gap)}px`,
    right: `${Math.round(right)}px`,
    left: 'auto',
    width: `${Math.round(widthPx)}px`,
    zIndex: '100',
  }
}

function scheduleProfileMenuPosition() {
  if (!import.meta.client) return
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      positionProfileMenuPanel()
    })
  })
}
const notificationsOpen = ref(false)
const notificationsRef = ref<HTMLElement | null>(null)
const checkingAuth = ref(import.meta.client) // Track authentication check status - true on client, false on server

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


const navigation: Array<{
  name: string
  href: string
  icon: any
  requiresSuperAdmin?: boolean
  requiresManagerOrSuperAdmin?: boolean
  subscriptionFeature?: SubscriptionFeature
}> = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, subscriptionFeature: 'dashboard' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: CubeIcon, subscriptionFeature: 'inventory' },
  { name: 'Receipts', href: '/dashboard/receipts', icon: ReceiptPercentIcon, subscriptionFeature: 'receipts' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon, subscriptionFeature: 'analytics' },
  { name: 'Activity Logs', href: '/dashboard/activity', icon: ShieldCheckIcon, subscriptionFeature: 'activity_logs', requiresManagerOrSuperAdmin: true },
  { name: 'Multi-Store Sync', href: '/dashboard/multi-store-sync', icon: ArrowsRightLeftIcon, requiresSuperAdmin: true, subscriptionFeature: 'multi_store_sync' },
  { name: 'Help center', href: '/dashboard/help', icon: BookOpenIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, subscriptionFeature: 'settings' },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon, subscriptionFeature: 'profile' },
]

// Filter navigation based on user role and subscription plan
const filteredNavigation = computed(() => {
  const isManager = userStore.userData?.role === 'staff' && staffStore.getCurrentStaffMember?.role === 'manager'
  const canSeeManagerOnlyFeatures = userStore.isSuperAdmin || isManager
  return navigation.filter(item => {
    if (item.requiresSuperAdmin && !userStore.isSuperAdmin) return false
    if (item.requiresManagerOrSuperAdmin && !canSeeManagerOnlyFeatures) return false
    if (item.subscriptionFeature && !canUseSubscriptionFeature(item.subscriptionFeature)) return false
    return true
  })
})

const route = useRoute()

const isActive = (href: string) => {
  const currentPath = route.path
  
  // Check if any other navigation item has a longer matching path
  // This prevents parent routes from being active when on child routes
  const hasLongerMatch = navigation.some(item => {
    if (item.href === href) return false
    if (item.href.length <= href.length) return false
    return currentPath.startsWith(item.href)
  })
  
  // If there's a longer match, this route shouldn't be active
  if (hasLongerMatch) {
    return false
  }
  
  // Exact match
  if (currentPath === href) {
    return true
  }
  
  // For routes other than /dashboard, allow matching child routes
  // This allows /dashboard/inventory to be active when on /dashboard/inventory/items
  if (href !== '/dashboard' && currentPath.startsWith(href + '/')) {
    return true
  }
  
  return false
}

const currentPage = computed(() => {
  return navigation.find(item => isActive(item.href)) || navigation[0]
})

const currentPageName = computed(() => {
  return currentPage.value?.name || 'Dashboard'
})

const currentPageIcon = computed(() => {
  return currentPage.value?.icon || HomeIcon
})

// Folder navigation for Inventory
const isInventoryRoute = computed(() => {
  return route.path.startsWith('/dashboard/inventory')
})

// Expanded state for Inventory folders — open on inventory routes; closed elsewhere (see watch below)
const inventoryExpanded = ref(false)

// Expanded state for Stores - manage which stores are expanded
// Use reactive object instead of Set for better Vue reactivity
const expandedStores = reactive<Record<string, boolean>>({})
const expandedDepartments = reactive<Record<string, boolean>>({})
// Fathom-style: collapsible Stores section header
const storesSectionCollapsed = ref(false)

// Load stores and departments when user data is available
watch([() => authStore.currentUser, () => userStore.userData, () => authStore.loading], async ([user, userData, loading]) => {
  if (!user || loading) return // Wait for auth to be ready
  
  // Check if staff creation is in progress - don't update userData during this time
  const isStaffCreationInProgress = import.meta.client 
    ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
    : false
  
  // During staff creation, don't fetch or update userData to preserve super admin's data
  if (isStaffCreationInProgress) {
    console.log('[Dashboard] Staff creation in progress - skipping userData fetch to preserve super admin data')
    return
  }
  
  // Fetch user data if not loaded (only if not during staff creation)
  // IMPORTANT: Only fetch when auth is ready (not loading)
  if (!userData && user && !isStaffCreationInProgress && !loading) {
    try {
    await userStore.fetchUserData(user.uid)
      console.log('[Dashboard] User data fetched in stores watch:', userStore.userData)
    } catch (err) {
      console.error('[Dashboard] Error fetching user data in stores watch:', err)
    }
  }
  
  const finalUserData = userStore.userData
  
  if (finalUserData?.role === 'superAdmin') {
    await storesStore.fetchStores()
    await storesStore.initializeCurrentStore()
    await Promise.all([
      departmentsStore.fetchDepartments(),
      staffStore.fetchStaff().catch(err => {
        console.warn('[Dashboard] Error fetching staff:', err)
      }),
    ])
    // Inventory item lists are loaded on-demand (folder page, dashboard home, search) — avoids N queries on every route.
    await Promise.all([
      inventoryStore.fetchFolders(),
      receiptsStore.fetchReceipts(),
    ]).catch(err => {
      console.warn('[Dashboard] Error fetching inventory/receipts:', err)
    })
    // Auto-expand current store
    if (storesStore.currentStoreId) {
      expandedStores[storesStore.currentStoreId] = true
    }
  } else if (finalUserData?.role === 'staff') {
    // Fetch staff member data first to ensure getQueryUserId works correctly
    // This is critical - without this, getQueryUserId will fail and data won't load
    try {
      const staffMember = await staffStore.fetchCurrentStaffMember()
      if (!staffMember) {
        console.error('[Dashboard] Staff member not found - this will cause data loading issues')
        // Try to fetch all staff to see if we can find them
        try {
          await staffStore.fetchStaff()
          const retryStaffMember = staffStore.getCurrentStaffMember
          if (!retryStaffMember) {
            console.error('[Dashboard] Staff member still not found after fetching all staff')
          }
        } catch (fetchErr) {
          console.error('[Dashboard] Error fetching all staff:', fetchErr)
        }
      } else {
        console.log('[Dashboard] Staff member found:', staffMember.storeId)
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching staff member:', err)
    }
    await storesStore.initializeCurrentStore()
    await departmentsStore.fetchDepartments()
    await Promise.all([
      inventoryStore.fetchFolders(),
      receiptsStore.fetchReceipts(),
    ]).catch(err => {
      console.warn('[Dashboard] Error fetching inventory/receipts:', err)
    })
    // Auto-expand current store for staff
    if (storesStore.currentStoreId) {
      expandedStores[storesStore.currentStoreId] = true
    }
  }
}, { immediate: true })

// Watch for store changes and auto-expand current store
watch(() => storesStore.currentStoreId, async (newStoreId, oldStoreId) => {
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
      await new Promise(resolve => setTimeout(resolve, 500))
      switchingStore.value = false
      previousStoreId.value = null
    }
  }
}, { immediate: true })

// Also watch for loading state to detect when switching completes
watch(() => storesStore.loading, (loading) => {
  if (!loading && switchingStore.value) {
    // Give a small delay to ensure all data is loaded
    setTimeout(() => {
      switchingStore.value = false
      previousStoreId.value = null
    }, 300)
  }
})

// Auto-expand departments when navigating to departments route
watch(() => route.path, (path) => {
  if (path.startsWith('/dashboard/departments')) {
    // Extract department ID from route if available
    const deptId = route.params.id as string
    if (deptId && deptId !== 'index') {
      expandedDepartments[deptId] = true
      // Find which store this department belongs to and expand it
      const dept = departmentsStore.departments.find(d => d.id === deptId)
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
        departmentsStore.fetchDepartments().catch(err => console.error('Error fetching departments:', err))
      }
    }
  }
}, { immediate: true })

// Open folder list while on inventory; collapse when navigating away (keeps sidenav tidy)
watch(
  () => route.path,
  (path) => {
    inventoryExpanded.value = path.startsWith('/dashboard/inventory')
  },
  { immediate: true },
)

const inventoryFolders = computed(() => {
  if (!inventoryStore.folders) return []
  // Filter to ensure only valid inventory folders are shown
  return inventoryStore.folders.filter(folder => 
    folder && 
    folder.id && 
    folder.name && 
    typeof folder.name === 'string'
  )
})

const recentFolders = computed(() => {
  // Only show inventory folders, sorted by most recently updated
  return [...inventoryFolders.value]
    .filter(folder => folder && folder.id) // Additional safety check
    .sort((a, b) => {
      const dateA = a.updatedAt instanceof Date ? a.updatedAt : (a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt))
      const dateB = b.updatedAt instanceof Date ? b.updatedAt : (b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt))
      return dateB.getTime() - dateA.getTime()
    })
})

// Current store
const currentStore = computed(() => storesStore.currentStore)

// Stores list - show current store first, then others
const storesList = computed(() => {
  const allStores = storesStore.stores
  const current = currentStore.value
  
  if (!current) return allStores
  
  // Sort: current store first, then others
  const otherStores = allStores.filter(s => s.id !== current.id)
  return [current, ...otherStores]
})

// Get departments for a specific store
const getDepartmentsForStore = (storeId: string) => {
  return departmentsStore.departments.filter(dept => dept.storeId === storeId)
}

// Get staff for a specific department
const getStaffForDepartment = (departmentId: string) => {
  return staffStore.staff.filter(s => s.departmentId === departmentId)
}

// Toggle store expansion
const toggleStoreExpanded = (storeId: string) => {
  expandedStores[storeId] = !expandedStores[storeId]
  // Fetch departments for this store when expanding
  if (expandedStores[storeId] && authStore.currentUser) {
    departmentsStore.fetchDepartments().catch(err => console.error('Error fetching departments:', err))
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
  return route.path.startsWith('/dashboard/departments')
})

const departmentsList = computed(() => {
  if (!departmentsStore.departments) return []
  return departmentsStore.departments
})

// Fetch inventory folders when on inventory routes
watch(() => route.path, async (path) => {
  if (path.startsWith('/dashboard/inventory') && authStore.currentUser) {
    try {
      await inventoryStore.fetchFolders()
    } catch (error) {
      console.error('Error fetching inventory folders:', error)
    }
  }
  if (path.startsWith('/dashboard/departments') && authStore.currentUser) {
    try {
      await departmentsStore.fetchDepartments()
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }
}, { immediate: true })

// Also fetch folders when user is authenticated
watch(() => authStore.currentUser, async (user) => {
  if (user && isInventoryRoute.value) {
    try {
      await inventoryStore.fetchFolders()
    } catch (error) {
      console.error('Error fetching inventory folders:', error)
    }
  }
  if (user && isDepartmentsRoute.value) {
    try {
      await departmentsStore.fetchDepartments()
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }
}, { immediate: true })

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
watch(() => userStore.userData, (userData, oldUserData) => {
  // Check if staff creation is in progress - don't update cache during staff creation
  const isStaffCreationInProgress = import.meta.client 
    ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
    : false
  
  // During staff creation, preserve existing cache and don't update it
  if (isStaffCreationInProgress && cachedUserName.value) {
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
}, { immediate: true })

// User profile data - use cached values during staff creation to prevent UI bug
const userName = computed(() => {
  // During SSR, return a safe default to prevent hydration mismatch
  if (import.meta.server) {
    return 'User'
  }
  
  const currentUserId = authStore.currentUser?.uid
  
  // Check if staff creation is in progress - preserve cached super admin name
  const isStaffCreationInProgress = import.meta.client 
    ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
    : false
  
  // During staff creation, always use cached name if available (preserve super admin name)
  if (isStaffCreationInProgress && cachedUserName.value) {
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
    if (isStaffCreationInProgress && userRole === 'staff') {
      return cachedUserName.value || 'User'
    }
    
    // Only use and cache if it's the super admin (not staff)
    if (name && userRole === 'superAdmin') {
      if (!isStaffCreationInProgress) {
        cachedUserName.value = name
        cachedUserId.value = currentUserId ?? null
        setCachedUserName(name, currentUserId ?? null)
      }
      return name
    }
  }
  // Fallback to Firebase Auth displayName
  if (authStore.currentUser?.displayName && currentUserId && !isStaffCreationInProgress) {
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
  if (currentEmail && currentUserId && !isStaffCreationInProgress) {
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

const userEmail = computed(() => {
  // During SSR, return a safe default to prevent hydration mismatch
  if (import.meta.server) {
    return ''
  }
  
  const currentUserId = authStore.currentUser?.uid
  
  // Check if staff creation is in progress - preserve cached super admin email
  const isStaffCreationInProgress = import.meta.client 
    ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
    : false
  
  // During staff creation, always use cached email if available (preserve super admin email)
  if (isStaffCreationInProgress && cachedUserEmail.value) {
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
  if (email && currentUserId && !isStaffCreationInProgress) {
    // Only cache if userStore indicates this is the current user (same uid) and is super admin (or we don't have userData yet)
    const isCurrentUserData = userStore.userData && userStore.userData.uid === currentUserId
    if ((isCurrentUserData && userStore.userData?.role === 'superAdmin') || !userStore.userData) {
      cachedUserEmail.value = email
      cachedUserId.value = currentUserId ?? null
      setCachedUserEmail(email, currentUserId ?? null)
    }
  }
  
  // During staff creation, if userData shows staff, ignore it and use cache
  if (isStaffCreationInProgress && userStore.userData?.role === 'staff') {
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

const handleSignOut = async () => {
  const { signOut } = useFirebaseAuth()
  try {
    userStore.clearUserData()
    clearCachedUser()
    await signOut()
    navigateTo('/signin')
  } catch (error) {
    console.error('Sign out error:', error)
    userStore.clearUserData()
    clearCachedUser()
    navigateTo('/signin')
  }
}

// Close dropdowns on outside click
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  const inProfile =
    profileMenuRef.value?.contains(target) ||
    profileMenuPanelRef.value?.contains(target)
  if (profileMenuOpen.value && !inProfile) {
    profileMenuOpen.value = false
  }
  if (notificationsRef.value && !notificationsRef.value.contains(target)) {
    notificationsOpen.value = false
  }
}

// Close sidebar on mobile when route changes
watch(() => route.path, () => {
  if (import.meta.client && sidebarOpen.value) {
    // Check if we're on mobile (screen width < 1024px which is lg breakpoint)
    if (window.innerWidth < 1024) {
      sidebarOpen.value = false
    }
  }
})

// Authentication guard - redirect if no user
const checkAuth = async () => {
  if (!import.meta.client) {
    checkingAuth.value = false
    return
  }
  
  checkingAuth.value = true
  
  // Wait for auth to finish loading
  if (authStore.loading) {
    await new Promise<void>((resolve) => {
      let resolved = false
      const maxWait = 5000 // 5 seconds max wait
      const startTime = Date.now()
      
      const checkAuthState = () => {
        if (!authStore.loading) {
          if (!resolved) {
            resolved = true
            resolve()
          }
          return
        }
        
        if (Date.now() - startTime > maxWait) {
          if (!resolved) {
            resolved = true
            resolve()
          }
          return
        }
        
        setTimeout(checkAuthState, 50)
      }
      
      checkAuthState()
    })
  }
  
  // Redirect to signin if no user after loading completes
  // But add loop prevention
  if (!authStore.loading && !authStore.currentUser) {
    checkingAuth.value = false
    
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
  
  checkingAuth.value = false
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  if (import.meta.client) {
    window.addEventListener('resize', onProfileMenuScrollOrResize)
    window.addEventListener('scroll', onProfileMenuScrollOrResize, true)
  }

  // Check authentication first
  if (import.meta.client) {
    await checkAuth()
    
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
  
  // Fetch user data if authenticated and not already loaded
    if (authStore.currentUser?.uid && !authStore.loading) {
      if (!userStore.userData || userStore.userData.uid !== authStore.currentUser.uid) {
        try {
          await userStore.fetchUserData(authStore.currentUser.uid)
          console.log('[Dashboard] User data fetched successfully:', userStore.userData)
        } catch (err) {
          console.error('[Dashboard] Error fetching user data:', err)
        }
      }
      // Staff with temporary password must change it before using the app
      const ud = userStore.userData
      if (ud?.role === 'staff' && ud.mustChangePassword && route.path !== '/dashboard/change-password') {
        await navigateTo('/dashboard/change-password')
      }
    }
  }
  
  // Fetch inventory folders if on inventory route
  if (authStore.currentUser && isInventoryRoute.value) {
    try {
      await inventoryStore.fetchFolders()
    } catch (error) {
      console.error('Error fetching inventory folders:', error)
    }
  }
  
  // Fetch departments if on departments route
  if (authStore.currentUser && isDepartmentsRoute.value) {
    try {
      await departmentsStore.fetchDepartments()
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }
})

// Watch for auth state changes to fetch user data and protect routes
watch(() => authStore.currentUser, async (user, oldUser) => {
  // Check if staff creation is in progress - don't redirect or update user data during temporary sign-out
  const isStaffCreationInProgress = import.meta.client 
    ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
    : false
  
  // Redirect to signin if user logs out (but not during staff creation)
  if (import.meta.client && !authStore.loading && !user && !isStaffCreationInProgress) {
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
  if (isStaffCreationInProgress) {
    console.log('[Dashboard] Staff creation in progress - preserving super admin userData')
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
    if (userChanged && !isStaffCreationInProgress) {
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
    if ((!hasUserData || userChanged) && !isStaffCreationInProgress) {
      try {
        await userStore.fetchUserData(user.uid)
        console.log('[Dashboard] User data fetched in watch:', userStore.userData)
      } catch (err) {
        console.error('[Dashboard] Error fetching user data in watch:', err)
      }
    }
  }
}, { immediate: true })

watch(profileMenuOpen, async (open) => {
  if (!import.meta.client || !open) return
  await nextTick()
  positionProfileMenuPanel()
  scheduleProfileMenuPosition()
})

const onProfileMenuScrollOrResize = () => {
  if (profileMenuOpen.value) positionProfileMenuPanel()
}

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (import.meta.client) {
    window.removeEventListener('resize', onProfileMenuScrollOrResize)
    window.removeEventListener('scroll', onProfileMenuScrollOrResize, true)
  }
})
</script>

