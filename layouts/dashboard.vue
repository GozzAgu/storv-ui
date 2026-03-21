<template>
  <!-- Loading state while checking authentication -->
  <div v-if="checkingAuth" class="min-h-screen bg-gray-50 dark:bg-gray-900 w-full flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
      <p class="text-sm text-gray-600 dark:text-gray-400">Verifying authentication...</p>
    </div>
  </div>
  
  <!-- Dashboard content (only shown if authenticated) -->
  <div v-else class="min-h-screen bg-white dark:bg-gray-900 w-full overflow-x-hidden relative">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0',
        'bg-[#f8f8f8] dark:bg-gray-900 border-r border-gray-200/40 dark:border-gray-800',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      ]"
    >
      <!-- Logo / Brand (smaller logo when collapsed so it doesn’t span edge-to-edge in 72px rail) -->
      <div
        class="flex items-center justify-between h-11 shrink-0 min-h-[2.75rem] px-2.5"
      >
        <NuxtLink
          to="/dashboard"
          :class="['flex items-center transition-all duration-300', sidebarCollapsed ? 'justify-center w-full' : 'gap-1.5 min-w-0']"
        >
          <img
            :src="logoSource"
            alt="Storvv"
            :class="[
              'shrink-0 object-contain transition-all duration-300',
              sidebarCollapsed ? 'h-4 w-auto max-w-[46px]' : 'h-5 max-w-[100px]',
            ]"
          />
        </NuxtLink>
        <button
          v-if="!sidebarCollapsed"
          @click="sidebarOpen = false"
          class="lg:hidden p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <XMarkIcon class="w-4 h-4" stroke-width="2" />
        </button>
      </div>

      <!-- Collapse toggle (desktop) - larger on large screens -->
      <button
        @click="toggleSidebar"
        class="absolute top-9 -right-3 hidden lg:flex items-center justify-center w-6 h-6 rounded-full bg-gray-200/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10"
        :title="sidebarCollapsed ? 'Expand' : 'Collapse'"
        aria-label="Toggle sidebar"
      >
        <ChevronRightIcon v-if="sidebarCollapsed" class="w-3.5 h-3.5" stroke-width="2.5" />
        <ChevronLeftIcon v-else class="w-3.5 h-3.5" stroke-width="2.5" />
      </button>

      <!-- Navigation -->
      <nav class="relative flex-1 py-1 overflow-y-auto overflow-x-hidden min-h-0" :class="sidebarCollapsed ? 'px-1.5' : 'px-2'">
        <div class="space-y-0.5 min-h-0">
          <template v-for="item in filteredNavigation" :key="item.name">
            <!-- Inventory (expandable) -->
            <div v-if="item.name === 'Inventory' && !sidebarCollapsed" class="space-y-0.5">
              <div
                :class="[
                  'group relative flex items-center justify-between w-full rounded-lg transition-all duration-200',
                  sidebarCollapsed ? 'px-1.5 py-1.5' : 'px-2 py-1.5',
                  isActive(item.href)
                    ? 'bg-gray-200/90 dark:bg-gray-700/70'
                    : 'hover:bg-gray-200/60 dark:hover:bg-gray-800/60'
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
                      isActive(item.href) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                    ]"
                    stroke-width="1.5"
                  />
                  <span class="text-xs font-medium truncate" :class="isActive(item.href) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'">
                    {{ item.name }}
                  </span>
                </NuxtLink>
                <button
                  @click.stop="inventoryExpanded = !inventoryExpanded"
                  class="p-1 rounded-full hover:bg-gray-300/60 dark:hover:bg-gray-600/60 transition-colors shrink-0"
                  :class="isActive(item.href) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'"
                >
                  <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="inventoryExpanded ? 'rotate-180' : ''" stroke-width="2" />
                </button>
              </div>
              <div v-if="inventoryExpanded && inventoryFolders.length > 0" class="pl-4 pr-1.5 py-0.5 space-y-0.5">
                <NuxtLink
                  v-for="folder in recentFolders.slice(0, 5)"
                  :key="folder.id"
                  :to="`/dashboard/inventory/${folder.id}`"
                  :class="[
                    'flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-colors',
                    route.params.id === folder.id
                      ? 'bg-gray-200/90 dark:bg-gray-700/70 text-gray-700 dark:text-gray-200 font-medium'
                      : 'text-gray-500 dark:text-gray-500 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-100',
                    { 'pointer-events-none opacity-50': switchingStore }
                  ]"
                >
                  <FolderIcon class="w-3.5 h-3.5 shrink-0" :class="route.params.id === folder.id ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'" stroke-width="1.75" />
                  <span class="truncate flex-1">{{ folder.name }}</span>
                  <ArrowRightIcon v-if="route.params.id === folder.id" class="w-3.5 h-3.5 shrink-0 text-gray-500 dark:text-gray-400" stroke-width="2" />
                </NuxtLink>
              </div>
            </div>

            <!-- Regular nav items -->
            <NuxtLink
              v-else-if="(item.name !== 'Inventory' && item.name !== 'Departments') || sidebarCollapsed"
              :to="item.href"
              :data-tutorial="item.name.toLowerCase().replace(/\s+/g, '-')"
              :class="[
                'group relative flex items-center rounded-lg transition-all duration-200',
                sidebarCollapsed ? 'justify-center w-full py-1.5' : 'px-2 py-1.5 gap-2',
                isActive(item.href)
                  ? 'bg-gray-200/90 dark:bg-gray-700/70'
                  : 'hover:bg-gray-200/60 dark:hover:bg-gray-800/60',
                { 'pointer-events-none opacity-50': switchingStore }
              ]"
              :title="sidebarCollapsed ? item.name : ''"
            >
              <component
                :is="item.icon"
                :class="[
                  'w-4 h-4 shrink-0 transition-colors',
                  sidebarCollapsed ? '' : 'mr-0',
                  isActive(item.href) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100'
                ]"
                stroke-width="1.75"
              />
              <span v-if="!sidebarCollapsed" class="text-xs font-medium truncate" :class="isActive(item.href) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'">
                {{ item.name }}
              </span>
              <!-- Tooltip when collapsed -->
              <div
                v-if="sidebarCollapsed"
                class="absolute left-full ml-1.5 z-50 inline-flex items-center w-max min-w-max max-w-none shrink-0 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none shadow-xl"
              >
                {{ item.name }}
                <div class="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
              </div>
            </NuxtLink>
          </template>
          
          <!-- Stores (super admins) - Fathom-style section -->
          <div v-if="userStore.isSuperAdmin && !sidebarCollapsed" class="mt-4 pt-3">
            <button
              type="button"
              @click="storesSectionCollapsed = !storesSectionCollapsed"
              class="flex items-center justify-between w-full px-2.5 py-1 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              <span>Stores</span>
              <ChevronDownIcon class="w-3 h-3 transition-transform duration-200" :class="storesSectionCollapsed ? '' : 'rotate-180'" stroke-width="2" />
            </button>
            <div v-if="!storesSectionCollapsed" class="mt-0.5 space-y-0.5 pl-0">
              <template v-for="store in storesList" :key="store.id">
                <div
                  :class="[
                    'flex items-center justify-between rounded-lg px-2.5 py-2 transition-all duration-200',
                    route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                      ? 'bg-gray-200/90 dark:bg-gray-700/70'
                      : currentStore?.id === store.id
                        ? 'bg-gray-200/70 dark:bg-gray-700/50'
                        : store.id !== storesStore.currentStoreId
                          ? 'opacity-50'
                          : 'hover:bg-gray-200/60 dark:hover:bg-gray-800/60'
                  ]"
                >
                  <NuxtLink
                    :to="store.id === storesStore.currentStoreId ? `/dashboard/stores/${store.id}/departments` : '#'"
                    class="flex items-center flex-1 min-w-0 gap-2"
                    :class="{ 'pointer-events-none cursor-not-allowed': switchingStore || (store.id !== storesStore.currentStoreId) }"
                    :title="store.id !== storesStore.currentStoreId ? 'Switch to this store to access it' : ''"
                    @click.prevent="store.id !== storesStore.currentStoreId ? null : null"
                  >
                    <svg class="w-4 h-4 shrink-0" :class="currentStore?.id === store.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span class="text-xs font-medium truncate" :class="currentStore?.id === store.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'">
                      {{ store.name }}
                    </span>
                    <span v-if="currentStore?.id === store.id || store.id === storesStore.currentStoreId" class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Active store"></span>
                    <span v-if="store.id !== storesStore.currentStoreId" class="text-[9px] text-gray-400 dark:text-gray-500 italic shrink-0">Inactive</span>
                  </NuxtLink>
                  <button
                    v-if="store.id === storesStore.currentStoreId"
                    @click.stop="toggleStoreExpanded(store.id)"
                    class="p-1 rounded-full hover:bg-gray-300/60 dark:hover:bg-gray-600/60 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0"
                  >
                    <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="expandedStores[store.id] ? 'rotate-180' : ''" stroke-width="2" />
                  </button>
                </div>
                <div v-if="expandedStores[store.id] && store.id === storesStore.currentStoreId" class="pl-4 pr-1.5 py-0.5 space-y-0.5">
                  <template v-for="department in getDepartmentsForStore(store.id)" :key="department.id">
                    <div class="flex items-center justify-between gap-1 rounded-lg group">
                      <NuxtLink
                        :to="`/dashboard/departments/${department.id}`"
                        class="flex items-center gap-2 flex-1 min-w-0 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
                        :class="[
                          route.params.id === department.id && route.path.startsWith('/dashboard/departments') ? 'bg-gray-200/90 dark:bg-gray-700/70 text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100',
                          { 'pointer-events-none opacity-50': switchingStore }
                        ]"
                      >
                        <BuildingOfficeIcon class="w-3.5 h-3.5 shrink-0" :class="route.params.id === department.id ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'" stroke-width="1.75" />
                        <span class="truncate flex-1">{{ department.name }}</span>
                      </NuxtLink>
                      <button
                        @click.stop="toggleDepartmentExpanded(department.id)"
                        class="p-1 rounded-full hover:bg-gray-300/60 dark:hover:bg-gray-600/60 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0"
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
                          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100"
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
                    class="block px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    View departments →
                  </NuxtLink>
                </div>
              </template>
              <div v-if="storesList.length === 0" class="px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400">No stores</div>
            </div>
          </div>
        </div>

        <!-- Recent Items -->
        <div v-if="!sidebarCollapsed" class="mt-auto pt-3">
          <RecentItemsWidget />
        </div>
      </nav>

      <!-- Bottom: user + sign out (minimal Fathom-style) -->
      <div class="shrink-0 border-t border-gray-200/40 dark:border-gray-800 px-2.5 py-2 bg-[#f8f8f8] dark:bg-gray-900" :class="sidebarCollapsed ? 'px-1.5' : ''">
        <div class="flex items-center gap-2.5" :class="sidebarCollapsed ? 'justify-center relative group' : ''">
          <div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 font-semibold text-xs shrink-0">
            {{ userInitials }}
          </div>
          <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{{ userName }}</p>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">{{ userEmail }}</p>
          </div>
          <div v-if="sidebarCollapsed" class="absolute left-full ml-1.5 z-50 inline-flex flex-col items-start w-max min-w-max max-w-none shrink-0 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none shadow-xl whitespace-nowrap">
            {{ userName }}
            <span class="block text-[11px] text-gray-400">{{ userEmail }}</span>
            <div class="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
          </div>
        </div>
        <button
          @click="handleSignOut"
          :class="[
            'mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors',
            sidebarCollapsed ? 'w-full py-2 relative group' : 'px-2.5',
            'text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-gray-100'
          ]"
          title="Sign out"
        >
          <ArrowRightOnRectangleIcon class="w-4 h-4 shrink-0" stroke-width="1.75" />
          <span v-if="!sidebarCollapsed">Sign out</span>
          <div v-if="sidebarCollapsed" class="absolute left-full ml-1.5 z-50 inline-flex items-center w-max min-w-max max-w-none shrink-0 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none shadow-xl whitespace-nowrap">
            Sign out
            <div class="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
          </div>
        </button>
        <p class="mt-1.5 text-[9px] text-gray-400 dark:text-gray-500" :class="sidebarCollapsed ? 'text-center' : 'text-left'">
          v{{ appVersion }}
        </p>
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
      :class="['min-h-screen transition-all duration-300', sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64']"
      class="w-full"
      style="min-width: 0; max-width: 100vw;"
    >
      <!-- Top Navigation (fixed so it stays visible when scrolling) -->
      <header
        :class="[
          'fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/80 dark:border-gray-700/80 backdrop-blur-md transition-[left] duration-300',
          sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-64'
        ]"
      >
        <div class="flex items-center justify-between h-11 sm:h-12 px-3 sm:px-4 lg:px-6">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              @click="sidebarOpen = true"
              class="lg:hidden flex items-center justify-center w-11 h-11 rounded-xl text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-[0.97] transition-all duration-200"
              aria-label="Open menu"
            >
              <Squares2X2Icon class="w-6 h-6" stroke-width="2" />
            </button>
            <!-- Page name -->
            <div class="hidden md:flex items-center gap-2 min-w-0">
              <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <component :is="currentPageIcon" class="w-4 h-4" stroke-width="1.75" />
              </div>
              <h1 class="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ currentPageName }}
              </h1>
            </div>
          </div>

          <div class="flex items-center gap-0.5 sm:gap-1.5 ml-auto shrink-0 min-w-0">
            <!-- Global search -->
            <button
              @click="searchStore.openSearch()"
              class="hidden md:flex items-center gap-2 pl-3 pr-2.5 py-1.5 w-48 sm:w-52 lg:w-60 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all text-xs text-gray-500 dark:text-gray-400"
              title="Search (⌘K)"
            >
              <MagnifyingGlassIcon class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" stroke-width="1.75" />
              <span class="flex-1 text-left truncate">Search...</span>
              <kbd class="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">⌘K</kbd>
            </button>

            <!-- Mobile search -->
            <button
              @click="searchStore.openSearch()"
              class="md:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
              title="Search"
              aria-label="Search"
            >
              <MagnifyingGlassIcon class="w-4 h-4" stroke-width="1.75" />
            </button>

            <StoreSelector v-if="userStore.userData?.role === 'superAdmin'" />

            <ThemeToggle />

            <!-- Notifications dropdown -->
            <div class="relative shrink-0" ref="notificationsRef">
              <button
                type="button"
                @click="notificationsOpen = !notificationsOpen"
                :class="[
                  'relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-colors shrink-0',
                  notificationsOpen
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                ]"
                title="Notifications"
                aria-label="Notifications"
                :aria-expanded="notificationsOpen"
                aria-haspopup="true"
              >
                <BellIcon class="w-4 h-4" stroke-width="1.75" />
                <span
                  v-if="unreadNotificationCount > 0"
                  class="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center px-0.5 ring-2 ring-white dark:ring-gray-900"
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
                    class="fixed z-[100] origin-top-right"
                    style="top: 3.5rem; right: 1rem; left: auto; width: min(22rem, calc(100vw - 2rem));"
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
                @click="profileMenuOpen = !profileMenuOpen"
                class="flex items-center gap-1.5 md:gap-2 p-0.5 sm:pl-1 sm:pr-1.5 md:pr-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-0"
                :class="profileMenuOpen ? 'bg-gray-100 dark:bg-gray-800' : ''"
                :aria-expanded="profileMenuOpen"
                aria-haspopup="true"
              >
                <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm ring-2 ring-white dark:ring-gray-900 shrink-0">
                  {{ userInitials }}
                </div>
                <div class="hidden md:block text-left min-w-0">
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{{ userName }}</p>
                  <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">{{ userEmail }}</p>
                </div>
                <ChevronDownIcon class="hidden md:block w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 transition-transform" :class="profileMenuOpen ? 'rotate-180' : ''" stroke-width="2" />
              </button>

              <Transition
                enter-active-class="transition ease-out duration-150"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-100"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-if="profileMenuOpen"
                  class="fixed top-12 inset-x-3 md:inset-auto md:absolute md:right-0 md:left-auto md:top-full md:mt-1.5 w-auto md:w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl py-1.5 z-[100]"
                >
                  <NuxtLink
                    to="/dashboard/profile"
                    class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    @click="profileMenuOpen = false"
                  >
                    <UserCircleIcon class="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" stroke-width="1.75" />
                    Profile
                  </NuxtLink>
                  <NuxtLink
                    to="/dashboard/settings"
                    class="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    @click="profileMenuOpen = false"
                  >
                    <Cog6ToothIcon class="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" stroke-width="1.75" />
                    Settings
                  </NuxtLink>
                  <div class="border-t border-gray-100 dark:border-gray-700 my-1.5" />
                  <button
                    @click="handleSignOut"
                    class="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors text-left"
                  >
                    <ArrowRightOnRectangleIcon class="w-4 h-4 shrink-0" stroke-width="1.75" />
                    Sign out
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <!-- Spacer so fixed nav never overlaps page content -->
      <div class="h-11 sm:h-12 shrink-0" aria-hidden="true" />

      <!-- Page Content -->
      <main class="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4 w-full" style="min-width: 0; max-width: 100%; overflow-x: hidden;">
        <slot />
      </main>
    </div>
    
    <!-- Toast Notifications -->
    <ToastContainer />
    
    <!-- Global Search -->
    <GlobalSearch />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
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

// Expanded state for Inventory folders - auto-expand when on inventory route
const inventoryExpanded = ref(true)

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
    await departmentsStore.fetchDepartments()
    // Fetch all staff so sidebar can display them
    await staffStore.fetchStaff().catch(err => {
      console.warn('[Dashboard] Error fetching staff:', err)
    })
    // Fetch inventory and receipts in parallel
    await Promise.all([
      inventoryStore.fetchFolders(),
      receiptsStore.fetchReceipts()
    ]).catch(err => {
      console.warn('[Dashboard] Error fetching inventory/receipts:', err)
    })
    // Fetch items for all folders after folders are loaded
    if (inventoryStore.folders.length > 0) {
      await Promise.all(
        inventoryStore.folders.map(folder => inventoryStore.fetchItems(folder.id))
      ).catch(err => {
        console.warn('[Dashboard] Error fetching inventory items:', err)
      })
    }
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
    // Fetch inventory and receipts in parallel
    await Promise.all([
      inventoryStore.fetchFolders(),
      receiptsStore.fetchReceipts()
    ]).catch(err => {
      console.warn('[Dashboard] Error fetching inventory/receipts:', err)
    })
    // Fetch items for all folders after folders are loaded
    if (inventoryStore.folders.length > 0) {
      await Promise.all(
        inventoryStore.folders.map(folder => inventoryStore.fetchItems(folder.id))
      ).catch(err => {
        console.warn('[Dashboard] Error fetching inventory items:', err)
      })
    }
    // Auto-expand current store for staff
    if (storesStore.currentStoreId) {
      expandedStores[storesStore.currentStoreId] = true
    }
  }
}, { immediate: true })

// Also load on mount
onMounted(async () => {
  if (authStore.currentUser) {
    if (!userStore.userData) {
      await userStore.fetchUserData(authStore.currentUser.uid)
    }
    
    if (userStore.isSuperAdmin) {
      await storesStore.fetchStores()
      await storesStore.initializeCurrentStore()
      await departmentsStore.fetchDepartments()
      // Fetch all staff so sidebar can display them
      await staffStore.fetchStaff().catch(err => {
        console.warn('[Dashboard] Error fetching staff on mount:', err)
      })
      // Fetch inventory and receipts in parallel
      await Promise.all([
        inventoryStore.fetchFolders(),
        receiptsStore.fetchReceipts()
      ]).catch(err => {
        console.warn('[Dashboard] Error fetching inventory/receipts on mount:', err)
      })
      // Fetch items for all folders after folders are loaded
      if (inventoryStore.folders.length > 0) {
        await Promise.all(
          inventoryStore.folders.map(folder => inventoryStore.fetchItems(folder.id))
        ).catch(err => {
          console.warn('[Dashboard] Error fetching inventory items on mount:', err)
        })
      }
      if (storesStore.currentStoreId) {
        expandedStores[storesStore.currentStoreId] = true
      }
    } else if (userStore.userData?.role === 'staff') {
      // Fetch staff member data first to ensure getQueryUserId works correctly
      try {
        await staffStore.fetchCurrentStaffMember()
      } catch (err) {
        console.warn('[Dashboard] Error fetching staff member on mount:', err)
      }
      await storesStore.initializeCurrentStore()
      await departmentsStore.fetchDepartments()
      // Fetch inventory and receipts in parallel
      await Promise.all([
        inventoryStore.fetchFolders(),
        receiptsStore.fetchReceipts()
      ]).catch(err => {
        console.warn('[Dashboard] Error fetching inventory/receipts on mount:', err)
      })
      // Fetch items for all folders after folders are loaded
      if (inventoryStore.folders.length > 0) {
        await Promise.all(
          inventoryStore.folders.map(folder => inventoryStore.fetchItems(folder.id))
        ).catch(err => {
          console.warn('[Dashboard] Error fetching inventory items on mount:', err)
        })
      }
      if (storesStore.currentStoreId) {
        expandedStores[storesStore.currentStoreId] = true
      }
    }
  }
})

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

// Auto-expand folders when navigating to inventory route
watch(() => route.path, (path) => {
  if (path.startsWith('/dashboard/inventory')) {
    inventoryExpanded.value = true
  }
}, { immediate: true })

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
      // Also fetch items for all folders
      if (inventoryStore.folders.length > 0) {
        await Promise.all(
          inventoryStore.folders.map(folder => inventoryStore.fetchItems(folder.id))
        ).catch(err => {
          console.warn('[Dashboard] Error fetching inventory items on route change:', err)
        })
      }
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
      // Also fetch items for all folders
      if (inventoryStore.folders.length > 0) {
        await Promise.all(
          inventoryStore.folders.map(folder => inventoryStore.fetchItems(folder.id))
        ).catch(err => {
          console.warn('[Dashboard] Error fetching inventory items on auth change:', err)
        })
      }
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
  if (profileMenuRef.value && !profileMenuRef.value.contains(target)) {
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

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

