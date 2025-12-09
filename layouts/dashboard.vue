<template>
  <!-- Loading state while checking authentication -->
  <div v-if="checkingAuth" class="min-h-screen bg-gray-50 dark:bg-gray-900 w-full flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
      <p class="text-sm text-gray-600 dark:text-gray-400">Verifying authentication...</p>
    </div>
  </div>
  
  <!-- Dashboard content (only shown if authenticated) -->
  <div v-else class="min-h-screen bg-white dark:bg-gray-900 w-full overflow-x-hidden relative">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200/60 dark:border-gray-700/60 transform transition-all duration-300 ease-in-out lg:translate-x-0 flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarCollapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- Background Gradient -->
      <div class="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 dark:from-gray-900/50 dark:via-gray-800 dark:to-gray-900/50 pointer-events-none"></div>
      <!-- Logo -->
      <div class="relative flex items-center justify-between h-20 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm" :class="sidebarCollapsed ? 'px-3' : 'px-6'">
        <NuxtLink 
          to="/dashboard" 
          :class="[
            'flex items-center transition-all duration-300 group',
            sidebarCollapsed ? 'justify-center w-full' : 'space-x-3'
          ]"
        >
          <div class="relative flex-shrink-0">
            <img
              src="/storv logo.png"
              alt="Storv Logo"
              :class="[
                'transition-all duration-300 object-contain',
                sidebarCollapsed ? 'h-8 w-8' : 'h-8 w-auto'
              ]"
            />
            <div class="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-primary-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <span 
            v-if="!sidebarCollapsed" 
            class="text-xl sm:text-4xl font-bold bg-gradient-to-r from-primary-700 via-primary-500 to-primary-600 bg-clip-text text-transparent tracking-tight"
          >
          Storv
          </span>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <!-- Mobile close button -->
        <button
          @click="sidebarOpen = false"
            class="lg:hidden p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
        </div>
      </div>
      
      <!-- Toggle button - minimal design matching Dribbble, positioned outside and lower -->
      <button
        @click="toggleSidebar"
        class="absolute top-16 -right-3 hidden lg:flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10"
        :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronRightIcon v-if="sidebarCollapsed" class="w-5 h-5" />
        <ChevronLeftIcon v-else class="w-5 h-5" />
      </button>

      <!-- Navigation -->
      <nav class="relative flex-1 py-6 overflow-y-auto overflow-x-hidden" :class="sidebarCollapsed ? 'px-3' : 'px-5'">
        <div class="space-y-1.5 min-h-0">
          <template v-for="item in navigation" :key="item.name">
            <!-- Special handling for Inventory - expandable with folders -->
            <div v-if="item.name === 'Inventory' && !sidebarCollapsed" class="space-y-1">
              <div
                :class="[
                  'group relative flex items-center justify-between w-full font-medium rounded-xl transition-all duration-200 px-5 py-4',
                  isActive(item.href)
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                ]"
              >
                <NuxtLink
                  :to="item.href"
                  class="flex items-center flex-1"
                  :class="{ 'pointer-events-none opacity-50': switchingStore }"
                >
                  <!-- Active indicator -->
                  <div 
                    v-if="isActive(item.href)"
                    class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 dark:bg-primary-500 rounded-r-full"
                  ></div>
                  
                  <component 
                    :is="item.icon" 
                    :class="[
                      'relative z-10 transition-colors w-6 h-6 mr-4',
                      isActive(item.href)
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                    ]"
                  />
                  <span 
                    class="relative z-10 whitespace-nowrap text-xs sm:text-[15px] font-semibold transition-colors"
                    :class="isActive(item.href) ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                  >
                    {{ item.name }}
                  </span>
                </NuxtLink>
                <button
                  @click.stop="inventoryExpanded = !inventoryExpanded"
                  class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  :class="[
                    isActive(item.href) ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
                  ]"
                >
                  <ChevronDownIcon 
                    :class="[
                      'w-4 h-4 transition-transform duration-200',
                      inventoryExpanded ? 'rotate-180' : ''
                    ]"
                  />
                </button>
              </div>
              
              <!-- Folders tree structure - matches Dribbble design -->
              <div v-if="inventoryExpanded && inventoryFolders.length > 0" class="pl-9 pr-5 space-y-0.5 mt-1">
                <div v-for="folder in recentFolders.slice(0, 5)" :key="folder.id" class="relative">
                  <NuxtLink
                    :to="`/dashboard/inventory/${folder.id}`"
                    :class="[
                      'group relative flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm rounded-lg transition-all duration-200',
                      route.params.id === folder.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200',
                      { 'pointer-events-none opacity-50': switchingStore }
                    ]"
                  >
                    <!-- Active indicator bar -->
                    <div 
                      v-if="route.params.id === folder.id"
                      class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 dark:bg-primary-500 rounded-r-full"
                    ></div>
                    
                    <div class="flex items-center gap-2.5 flex-1 min-w-0">
                      <FolderIcon 
                        :class="[
                          'w-4 h-4 flex-shrink-0 transition-colors',
                          route.params.id === folder.id
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                        ]"
                      />
                      <span class="truncate">{{ folder.name }}</span>
                    </div>
                    <ArrowRightIcon 
                      v-if="route.params.id === folder.id"
                      class="w-4 h-4 flex-shrink-0 text-primary-600 dark:text-primary-400"
                    />
                  </NuxtLink>
                </div>
              </div>
            </div>
            
            <!-- Regular navigation items (non-expandable) -->
            <NuxtLink
              v-else-if="(item.name !== 'Inventory' && item.name !== 'Departments') || sidebarCollapsed"
              :to="item.href"
              :class="[
                'group relative flex items-center font-medium rounded-xl transition-all duration-200',
                sidebarCollapsed ? 'justify-center w-full py-3.5' : 'justify-start px-5 py-4',
                isActive(item.href)
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                { 'pointer-events-none opacity-50': switchingStore }
              ]"
              :title="sidebarCollapsed ? item.name : ''"
            >
              <!-- Active indicator -->
              <div 
                v-if="isActive(item.href) && !sidebarCollapsed"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 dark:bg-primary-500 rounded-r-full"
              ></div>
              
              <!-- Active indicator for collapsed -->
              <div 
                v-if="isActive(item.href) && sidebarCollapsed"
                class="absolute inset-0 rounded-xl bg-primary-50 dark:bg-primary-900/20"
              ></div>
              
              <component 
                :is="item.icon" 
                :class="[
                  'relative z-10 transition-colors',
                  sidebarCollapsed ? 'w-6 h-6' : 'w-6 h-6 mr-4',
                  isActive(item.href)
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                ]"
              />
              <span 
                v-if="!sidebarCollapsed" 
                class="relative z-10 flex-1 whitespace-nowrap text-xs sm:text-[15px] font-semibold transition-colors"
                :class="isActive(item.href) ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
              >
                {{ item.name }}
              </span>
              
              <!-- Tooltip for collapsed state -->
              <div
                v-if="sidebarCollapsed"
                class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-700 dark:border-gray-600"
              >
                {{ item.name }}
                <div class="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
              </div>
            </NuxtLink>
          </template>
          
          <!-- Stores Tree (for super admins) -->
          <div v-if="userStore.isSuperAdmin && !sidebarCollapsed" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="space-y-1">
              <div class="px-5 mb-3">
                <p class="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stores</p>
              </div>
              
              <!-- Store items -->
              <div v-for="store in storesList" :key="store.id" class="space-y-0.5">
                <!-- Store header -->
                <div
                  :class="[
                    'group relative flex items-center justify-between w-full font-medium rounded-xl transition-all duration-200 px-5 py-3',
                    route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : currentStore?.id === store.id
                        ? 'bg-primary-50/50 dark:bg-primary-900/10'
                        : store.id !== storesStore.currentStoreId
                          ? 'text-gray-400 dark:text-gray-500 opacity-60'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  ]"
                >
                  <NuxtLink
                    :to="store.id === storesStore.currentStoreId ? `/dashboard/stores/${store.id}/departments` : '#'"
                    class="flex items-center flex-1 min-w-0"
                    :class="{ 
                      'pointer-events-none opacity-50 cursor-not-allowed': switchingStore || (store.id !== storesStore.currentStoreId),
                      'opacity-60': store.id !== storesStore.currentStoreId
                    }"
                    :title="store.id !== storesStore.currentStoreId ? 'Switch to this store to access it' : ''"
                    @click.prevent="store.id !== storesStore.currentStoreId ? null : null"
                  >
                    <svg 
                      class="w-5 h-5 mr-3 flex-shrink-0"
                      :class="route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                        ? 'text-primary-600 dark:text-primary-400'
                        : currentStore?.id === store.id
                          ? 'text-primary-600/80 dark:text-primary-400/80'
                          : store.id !== storesStore.currentStoreId
                            ? 'text-gray-300 dark:text-gray-600'
                            : 'text-gray-500 dark:text-gray-400'"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span 
                      class="relative z-10 whitespace-nowrap text-xs sm:text-sm font-semibold truncate transition-colors flex items-center gap-2"
                      :class="route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                        ? 'text-primary-700 dark:text-primary-300'
                        : currentStore?.id === store.id
                          ? 'text-primary-700/80 dark:text-primary-300/80'
                          : store.id !== storesStore.currentStoreId
                            ? 'text-gray-400 dark:text-gray-500'
                            : 'text-gray-700 dark:text-gray-300'"
                    >
                      {{ store.name }}
                      <!-- Green online indicator for active store -->
                      <span 
                        v-if="currentStore?.id === store.id || store.id === storesStore.currentStoreId"
                        class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                        title="Active store"
                      ></span>
                      <span v-if="store.id !== storesStore.currentStoreId" class="ml-2 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 italic">(Inactive)</span>
                    </span>
                  </NuxtLink>
                  <button
                    @click.stop="store.id === storesStore.currentStoreId ? toggleStoreExpanded(store.id) : null"
                    :disabled="store.id !== storesStore.currentStoreId"
                    class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="[
                      route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
                        ? 'text-primary-600 dark:text-primary-400'
                        : currentStore?.id === store.id
                          ? 'text-primary-600/80 dark:text-primary-400/80'
                          : store.id !== storesStore.currentStoreId
                            ? 'text-gray-300 dark:text-gray-600'
                            : 'text-gray-400 dark:text-gray-500'
                    ]"
                    :title="store.id !== storesStore.currentStoreId ? 'Switch to this store to access it' : ''"
                  >
                    <ChevronDownIcon 
                      :class="[
                        'w-4 h-4 transition-transform duration-200',
                        expandedStores[store.id] ? 'rotate-180' : ''
                      ]"
                    />
                  </button>
                </div>
                
                <!-- Departments under store - only show for current store -->
                <div v-if="expandedStores[store.id] && store.id === storesStore.currentStoreId" class="pl-9 pr-5 space-y-0.5 mt-1">
                  <div v-for="department in getDepartmentsForStore(store.id)" :key="department.id" class="space-y-0.5">
                    <!-- Department header -->
                    <div
                      :class="[
                        'group relative flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm rounded-lg transition-all duration-200',
                        route.params.id === department.id && route.path.startsWith('/dashboard/departments')
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-semibold'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                      ]"
                    >
                      <NuxtLink
                        :to="`/dashboard/departments/${department.id}`"
                        class="flex items-center gap-2.5 flex-1 min-w-0"
                        :class="{ 'pointer-events-none opacity-50': switchingStore }"
                      >
                        <BuildingOfficeIcon 
                          :class="[
                            'w-4 h-4 flex-shrink-0 transition-colors',
                            route.params.id === department.id && route.path.startsWith('/dashboard/departments')
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                          ]"
                        />
                        <span class="truncate">{{ department.name }}</span>
                      </NuxtLink>
                      <button
                        @click.stop="toggleDepartmentExpanded(department.id)"
                        class="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-2 flex-shrink-0"
                        :class="[
                          route.params.id === department.id && route.path.startsWith('/dashboard/departments')
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-400 dark:text-gray-500'
                        ]"
                        :disabled="switchingStore"
                      >
                        <ChevronDownIcon 
                          :class="[
                            'w-3 h-3 transition-transform duration-200',
                            expandedDepartments[department.id] ? 'rotate-180' : ''
                          ]"
                        />
                      </button>
                    </div>
                    
                    <!-- Staff under department -->
                    <div v-if="expandedDepartments[department.id]" class="pl-7 pr-5 space-y-0.5 mt-1">
                      <div v-for="staff in getStaffForDepartment(department.id)" :key="staff.id">
                        <NuxtLink
                          :to="department.isActive === false ? '#' : `/dashboard/departments/${department.id}`"
                          class="group relative flex items-center px-3 py-2 text-[10px] sm:text-xs rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                          :class="{ 
                            'pointer-events-none opacity-50 cursor-not-allowed': switchingStore || (department.isActive === false)
                          }"
                          :title="department.isActive === false ? 'This department is inactive' : ''"
                          @click.prevent="department.isActive === false ? null : null"
                        >
                          <UsersIcon 
                            class="w-3.5 h-3.5 flex-shrink-0 mr-2 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                          />
                          <span class="truncate">{{ staff.firstName }} {{ staff.lastName }}</span>
                        </NuxtLink>
                      </div>
                      <div v-if="getStaffForDepartment(department.id).length === 0" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                        No staff
                      </div>
                    </div>
                  </div>
                  <NuxtLink
                    v-if="getDepartmentsForStore(store.id).length === 0"
                    :to="`/dashboard/stores/${store.id}/departments`"
                    class="block px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    :class="{ 'pointer-events-none opacity-50': switchingStore && store.id !== storesStore.currentStoreId }"
                  >
                    <span class="italic">No departments</span>
                    <span class="ml-2 text-primary-600 dark:text-primary-400 hover:underline">View Departments →</span>
                  </NuxtLink>
                </div>
              </div>
              
              <!-- No stores message -->
              <div v-if="storesList.length === 0" class="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                No stores available
              </div>
            </div>
          </div>
          
          <!-- Staff view (for staff members - show only their store/department) - HIDDEN FOR STAFF -->
          <!-- "My Store" section removed for staff as requested -->
        </div>
      </nav>
      
      <!-- Bottom Section (Logout + Collapse/Expand) -->
      <div class="relative mt-auto border-t border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex-shrink-0" :class="sidebarCollapsed ? 'px-3 py-3' : 'px-5 py-4'">
        <button
          @click="handleSignOut"
          :class="[
            'group relative flex items-center justify-center font-medium rounded-xl transition-all duration-300 ease-out overflow-hidden w-full py-3',
            sidebarCollapsed ? 'px-3' : 'px-5',
            'text-red-600 dark:text-red-400',
            'border border-red-200/50 dark:border-red-800/50',
            'bg-gradient-to-r from-red-50/50 to-red-50/30 dark:from-red-900/10 dark:to-red-900/5',
            'hover:from-red-50 hover:to-red-100/80 dark:hover:from-red-900/20 dark:hover:to-red-900/15',
            'hover:border-red-300 dark:hover:border-red-700',
            'hover:shadow-md hover:shadow-red-500/10',
            'active:scale-[0.98]'
          ]"
          title="Sign out"
        >
          <!-- Animated background gradient -->
          <div class="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <ArrowRightOnRectangleIcon 
            :class="[
              'relative z-10 transition-all duration-300 w-6 h-6',
              'group-hover:scale-110 group-hover:rotate-[-5deg]'
            ]"
          />
          
          <!-- Tooltip -->
          <div
            class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-700 dark:border-gray-600"
          >
            Sign out
            <div class="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
          </div>
        </button>
        
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
      :class="['min-h-screen transition-all duration-300', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64']"
      class="w-full"
      style="min-width: 0; max-width: 100vw;"
    >
      <!-- Top Navigation -->
      <header class="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center space-x-3">
          <button
            @click="sidebarOpen = true"
              class="lg:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Bars3Icon class="w-6 h-6" />
          </button>
            <!-- Page Name -->
            <div class="hidden md:flex items-center space-x-2">
              <component :is="currentPageIcon" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ currentPageName }}
              </h1>
            </div>
          </div>

          <div class="flex items-center space-x-3 ml-auto">
            <!-- Global Search Button -->
            <button
              @click="searchStore.openSearch()"
              class="hidden md:flex items-center gap-2 px-4 py-2 w-64 border border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all text-sm bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              title="Search (Cmd/Ctrl+K)"
            >
              <MagnifyingGlassIcon class="w-5 h-5 flex-shrink-0" />
              <span class="flex-1 text-left">Search anything...</span>
              <kbd class="hidden lg:inline-flex px-2 py-0.5 text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">⌘K</kbd>
            </button>
            
            <!-- Mobile Search Button -->
            <button
              @click="searchStore.openSearch()"
              class="md:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Search"
            >
              <MagnifyingGlassIcon class="w-6 h-6" />
            </button>

            <!-- Store Selector (for super admins) -->
            <StoreSelector v-if="userStore.userData?.role === 'superAdmin'" />

            <!-- Theme Toggle Button -->
            <ThemeToggle />

            <!-- Notifications -->
            <NuxtLink
              to="/dashboard/notifications"
              class="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Notifications"
            >
              <BellIcon class="w-6 h-6" />
              <span
                v-if="unreadNotificationCount > 0"
                class="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center px-1.5"
              >
                {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
              </span>
            </NuxtLink>

            <!-- Profile Dropdown -->
            <div class="relative" ref="profileMenuRef">
              <button
                @click="profileMenuOpen = !profileMenuOpen"
                class="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {{ userInitials }}
                </div>
                <div class="hidden md:block text-left">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ userName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ userEmail }}</p>
                </div>
                <ChevronDownIcon class="hidden md:block w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>

              <!-- Profile Dropdown Menu -->
              <Transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
              >
                <div
                  v-if="profileMenuOpen"
                  class="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                  style="min-width: 160px; max-width: min(224px, calc(100vw - 2rem));"
                >
                  <NuxtLink
                    to="/dashboard/profile"
                    class="block px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                    @click="profileMenuOpen = false"
                  >
                    Profile
                  </NuxtLink>
                  <NuxtLink
                    to="/dashboard/settings"
                    class="block px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                    @click="profileMenuOpen = false"
                  >
                    Settings
                  </NuxtLink>
                  <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    @click="handleSignOut"
                    class="block w-full text-left px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                  >
                    Sign out
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 w-full" style="min-width: 0; max-width: 100%; overflow-x: hidden;">
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
  Bars3Icon,
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
} from '@heroicons/vue/24/outline'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import StoreSelector from '~/components/ui/StoreSelector.vue'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import GlobalSearch from '~/components/search/GlobalSearch.vue'
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

const { actualTheme } = useTheme()
const authStore = useAuthStore()
const userStore = useUserStore()
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


const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Inventory', href: '/dashboard/inventory', icon: CubeIcon },
  { name: 'Receipts', href: '/dashboard/receipts', icon: ReceiptPercentIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
]

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

// Load stores and departments when user data is available
watch([() => authStore.currentUser, () => userStore.userData], async ([user, userData]) => {
  if (!user) return
  
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
  if (!userData && user && !isStaffCreationInProgress) {
    await userStore.fetchUserData(user.uid)
  }
  
  const finalUserData = userStore.userData
  
  if (finalUserData?.role === 'superAdmin') {
    await storesStore.fetchStores()
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
    // Auto-expand current store
    if (storesStore.currentStoreId) {
      expandedStores[storesStore.currentStoreId] = true
    }
  } else if (finalUserData?.role === 'staff') {
    // Fetch staff member data first to ensure getQueryUserId works correctly
    try {
      await staffStore.fetchCurrentStaffMember()
    } catch (err) {
      console.warn('[Dashboard] Error fetching staff member:', err)
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
  return inventoryStore.folders
})

const recentFolders = computed(() => {
  return [...inventoryFolders.value].sort((a, b) => {
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
const cachedUserName = ref<string | null>(null)
const cachedUserEmail = ref<string | null>(null)
const cachedUserId = ref<string | null | undefined>(null)

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
      }
      // Cache email from auth if available
      if (authStore.currentUser?.email && authStore.currentUser.uid === userData.uid) {
        cachedUserEmail.value = authStore.currentUser.email
        cachedUserId.value = authStore.currentUser.uid
      }
    }
  }
}, { immediate: true })

// User profile data - use cached values during staff creation to prevent UI bug
const userName = computed(() => {
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
  if (cachedUserName.value && cachedUserId.value === currentUserId) {
    return cachedUserName.value
  }
  
  // If no current user but we have cached data, use cache (prevents flicker during sign out)
  if (!currentUserId && cachedUserName.value) {
    return cachedUserName.value
  }
  
  // Try to get name from Firestore userData first
  // During staff creation, ignore userData if it's for staff (preserve super admin cache)
  if (userStore.userData?.name && currentUserId) {
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
      return name
    }
  }
  // Fallback to email prefix (part before @)
  const currentEmail = authStore.currentUser?.email
  if (currentEmail && currentUserId && !isStaffCreationInProgress) {
    const emailPrefix = currentEmail.split('@')[0]!
    cachedUserName.value = emailPrefix
    cachedUserEmail.value = currentEmail
    cachedUserId.value = currentUserId ?? null
    return emailPrefix
  }
  
  // If no current user but we have cached data, use cache (prevents flicker)
  if (cachedUserName.value) {
    return cachedUserName.value
  }
  
  return 'User'
})

const userEmail = computed(() => {
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
  if (cachedUserEmail.value && cachedUserId.value === currentUserId) {
    return cachedUserEmail.value
  }
  
  // If no current user but we have cached data, use cache (prevents flicker during sign out)
  if (!currentUserId && cachedUserEmail.value) {
    return cachedUserEmail.value
  }
  
  const email = authStore.currentUser?.email || ''
  
  // Cache it for this user (only if not staff creation and it's super admin)
  if (email && currentUserId && !isStaffCreationInProgress) {
    // Only cache if userStore indicates this is a super admin (or we don't have userData yet)
    if (userStore.userData?.role === 'superAdmin' || !userStore.userData) {
      cachedUserEmail.value = email
      cachedUserId.value = currentUserId ?? null
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
    await signOut()
    navigateTo('/signin')
  } catch (error) {
    console.error('Sign out error:', error)
    // Still navigate even if sign out fails
  navigateTo('/signin')
  }
}

// Close dropdowns on outside click
const handleClickOutside = (event: MouseEvent) => {
  if (profileMenuRef.value && !profileMenuRef.value.contains(event.target as Node)) {
    profileMenuOpen.value = false
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
  if (!authStore.loading && !authStore.currentUser) {
    checkingAuth.value = false
    return navigateTo('/signin')
  }
  
  checkingAuth.value = false
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  
  // Check authentication first
  if (import.meta.client) {
    await checkAuth()
  }
  
  // Fetch user data if authenticated and not already loaded
  if (authStore.currentUser?.uid && !userStore.userData) {
    userStore.fetchUserData(authStore.currentUser.uid)
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
  if (user?.uid) {
    const hasUserData = userStore.userData && userStore.userData.uid === user.uid
    const userChanged = oldUser?.uid !== user.uid
    
    // Only fetch if we don't have data for this user or if user actually changed
    // Don't fetch during staff creation to prevent overwriting super admin data
    if ((!hasUserData || userChanged) && !isStaffCreationInProgress) {
      userStore.fetchUserData(user.uid)
    }
  }
}, { immediate: true })

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

