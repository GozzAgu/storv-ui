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
      <div class="relative flex items-center justify-between h-16 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm" :class="sidebarCollapsed ? 'px-3' : 'px-4'">
        <NuxtLink 
          to="/dashboard" 
          :class="[
            'flex items-center transition-all duration-300 group',
            sidebarCollapsed ? 'justify-center w-full' : 'space-x-2.5'
          ]"
        >
          <div class="relative flex-shrink-0">
            <img
              :src="logoSource"
              alt="Storvv Logo"
              :class="[
                'transition-all duration-300 object-contain',
                sidebarCollapsed ? 'h-12 w-12' : 'h-10 w-24'
              ]"
            />
            <div class="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-primary-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </NuxtLink>
        <div class="flex items-center gap-2">
          <!-- Mobile close button -->
        <button
          @click="sidebarOpen = false"
            class="lg:hidden p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-all duration-200"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
        </div>
      </div>
      
      <!-- Toggle button - minimal design matching Dribbble, positioned outside and lower -->
      <button
        @click="toggleSidebar"
        class="absolute top-14 -right-3 hidden lg:flex items-center justify-center w-7 h-7 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all z-10"
        :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronRightIcon v-if="sidebarCollapsed" class="w-4 h-4" />
        <ChevronLeftIcon v-else class="w-4 h-4" />
      </button>

      <!-- Navigation -->
      <nav class="relative flex-1 py-4 overflow-y-auto overflow-x-hidden" :class="sidebarCollapsed ? 'px-2' : 'px-3'">
        <div class="space-y-1 min-h-0">
          <template v-for="item in filteredNavigation" :key="item.name">
            <!-- Special handling for Inventory - expandable with folders -->
            <div v-if="item.name === 'Inventory' && !sidebarCollapsed" class="space-y-1">
              <div
                :class="[
                  'group relative flex items-center justify-between w-full font-medium rounded-md transition-all duration-200 px-3 py-2',
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
                    class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-600 dark:bg-primary-500 rounded-r-full"
                  ></div>
                  
                  <component 
                    :is="item.icon" 
                    :class="[
                      'relative z-10 transition-colors w-5 h-5 mr-3',
                      isActive(item.href)
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                    ]"
                  />
                  <span 
                    class="relative z-10 whitespace-nowrap text-xs font-medium transition-colors"
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
              <div v-if="inventoryExpanded && inventoryFolders.length > 0" class="pl-7 pr-3 space-y-0.5 mt-1">
                <div v-for="folder in recentFolders.slice(0, 5)" :key="folder.id" class="relative">
                  <NuxtLink
                    :to="`/dashboard/inventory/${folder.id}`"
                    :class="[
                      'group relative flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200',
                      route.params.id === folder.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200',
                      { 'pointer-events-none opacity-50': switchingStore }
                    ]"
                  >
                    <!-- Active indicator bar -->
                    <div 
                      v-if="route.params.id === folder.id"
                      class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary-600 dark:bg-primary-500 rounded-r-full"
                    ></div>
                    
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <FolderIcon 
                        :class="[
                          'w-3.5 h-3.5 flex-shrink-0 transition-colors',
                          route.params.id === folder.id
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                        ]"
                      />
                      <span class="truncate">{{ folder.name }}</span>
                    </div>
                    <ArrowRightIcon 
                      v-if="route.params.id === folder.id"
                      class="w-3.5 h-3.5 flex-shrink-0 text-primary-600 dark:text-primary-400"
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
                'group relative flex items-center font-medium rounded-md transition-all duration-200',
                sidebarCollapsed ? 'justify-center w-full py-2' : 'justify-start px-3 py-2',
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
                class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-600 dark:bg-primary-500 rounded-r-full"
              ></div>
              
              <!-- Active indicator for collapsed -->
              <div 
                v-if="isActive(item.href) && sidebarCollapsed"
                class="absolute inset-0 rounded-md bg-primary-50 dark:bg-primary-900/20"
              ></div>
              
              <component 
                :is="item.icon" 
                :class="[
                  'relative z-10 transition-colors',
                  sidebarCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3',
                  isActive(item.href)
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'
                ]"
              />
              <span 
                v-if="!sidebarCollapsed" 
                class="relative z-10 flex-1 whitespace-nowrap text-xs font-medium transition-colors"
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
          <div v-if="userStore.isSuperAdmin && !sidebarCollapsed" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="space-y-1">
              <div class="px-3 mb-2">
                <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stores</p>
              </div>
              
              <!-- Store items -->
              <div v-for="store in storesList" :key="store.id" class="space-y-0.5">
                <!-- Store header -->
                <div
                  :class="[
                    'group relative flex items-center justify-between w-full font-medium rounded-md transition-all duration-200 px-3 py-2',
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
                      class="w-4 h-4 mr-2.5 flex-shrink-0"
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
                      class="relative z-10 whitespace-nowrap text-xs font-medium truncate transition-colors flex items-center gap-1.5"
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
                <div v-if="expandedStores[store.id] && store.id === storesStore.currentStoreId" class="pl-7 pr-3 space-y-0.5 mt-1">
                  <div v-for="department in getDepartmentsForStore(store.id)" :key="department.id" class="space-y-0.5">
                    <!-- Department header -->
                    <div
                      :class="[
                        'group relative flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-all duration-200',
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
                            'w-3.5 h-3.5 flex-shrink-0 transition-colors',
                            route.params.id === department.id && route.path.startsWith('/dashboard/departments')
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                          ]"
                        />
                        <span class="truncate">{{ department.name }}</span>
                      </NuxtLink>
                      <button
                        @click.stop="toggleDepartmentExpanded(department.id)"
                        class="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ml-1.5 flex-shrink-0"
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
                    <div v-if="expandedDepartments[department.id]" class="pl-6 pr-3 space-y-0.5 mt-1">
                      <div v-for="staff in getStaffForDepartment(department.id)" :key="staff.id">
                        <NuxtLink
                          :to="department.isActive === false ? '#' : `/dashboard/departments/${department.id}`"
                          class="group relative flex items-center px-2.5 py-1.5 text-[10px] rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                          :class="{ 
                            'pointer-events-none opacity-50 cursor-not-allowed': switchingStore || (department.isActive === false)
                          }"
                          :title="department.isActive === false ? 'This department is inactive' : ''"
                          @click.prevent="department.isActive === false ? null : null"
                        >
                          <UsersIcon 
                            class="w-3 h-3 flex-shrink-0 mr-1.5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                          />
                          <span class="truncate">{{ staff.firstName }} {{ staff.lastName }}</span>
                        </NuxtLink>
                      </div>
                      <div v-if="getStaffForDepartment(department.id).length === 0" class="px-2.5 py-1.5 text-[10px] text-gray-500 dark:text-gray-400 italic">
                        No staff
                      </div>
                    </div>
                  </div>
                  <NuxtLink
                    v-if="getDepartmentsForStore(store.id).length === 0"
                    :to="`/dashboard/stores/${store.id}/departments`"
                    class="block px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    :class="{ 'pointer-events-none opacity-50': switchingStore && store.id !== storesStore.currentStoreId }"
                  >
                    <span class="italic">No departments</span>
                    <span class="ml-2 text-primary-600 dark:text-primary-400 hover:underline">View Departments →</span>
                  </NuxtLink>
                </div>
              </div>
              
              <!-- No stores message -->
              <div v-if="storesList.length === 0" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                No stores available
              </div>
            </div>
          </div>
          
          <!-- Staff view (for staff members - show only their store/department) - HIDDEN FOR STAFF -->
          <!-- "My Store" section removed for staff as requested -->
        </div>
        
        <!-- Recent Items Widget -->
        <div v-if="!sidebarCollapsed" class="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <RecentItemsWidget />
        </div>
      </nav>
      
      <!-- Bottom Section (User Profile + Logout) -->
      <div class="relative mt-auto border-t border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex-shrink-0" :class="sidebarCollapsed ? 'px-2 py-2.5' : 'px-3 py-3'">
        <div class="space-y-2">
          <!-- User Profile -->
          <div class="group relative flex items-center gap-2" :class="sidebarCollapsed ? 'justify-center' : ''">
            <div class="w-7 h-7 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
              {{ userInitials }}
            </div>
            <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{{ userName }}</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400 truncate">{{ userEmail }}</p>
            </div>
            <!-- Tooltip for collapsed state -->
            <div
              v-if="sidebarCollapsed"
              class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-700 dark:border-gray-600"
            >
              <p class="font-medium">{{ userName }}</p>
              <p class="text-xs text-gray-300">{{ userEmail }}</p>
              <div class="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
            </div>
          </div>
          
          <!-- Logout Button -->
          <button
            @click="handleSignOut"
            :class="[
              'group relative flex items-center justify-center font-medium rounded-md transition-all duration-300 ease-out overflow-hidden py-2',
              sidebarCollapsed ? 'px-2.5 w-auto' : 'px-3 w-full',
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
                'relative z-10 transition-all duration-300',
                sidebarCollapsed ? 'w-4 h-4' : 'w-4 h-4 mr-1.5',
                'group-hover:scale-110 group-hover:rotate-[-5deg]'
              ]"
            />
            <span v-if="!sidebarCollapsed" class="relative z-10 text-xs font-medium">Sign out</span>
            
            <!-- Tooltip (only show when collapsed) -->
            <div
              v-if="sidebarCollapsed"
              class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none border border-gray-700 dark:border-gray-600"
            >
              Sign out
              <div class="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
            </div>
          </button>
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
      :class="['min-h-screen transition-all duration-300', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64']"
      class="w-full"
      style="min-width: 0; max-width: 100vw;"
    >
      <!-- Top Navigation -->
      <header class="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between h-16 px-2 sm:px-3 lg:px-4">
          <div class="flex items-center space-x-1.5 sm:space-x-2">
          <button
            @click="sidebarOpen = true"
              class="lg:hidden p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Bars3Icon class="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
            <!-- Page Name -->
            <div class="hidden md:flex items-center space-x-1 sm:space-x-1.5">
              <component :is="currentPageIcon" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              <h1 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                {{ currentPageName }}
              </h1>
            </div>
          </div>

          <div class="flex items-center space-x-1.5 sm:space-x-2 ml-auto">
            <!-- Global Search Button -->
            <button
              @click="searchStore.openSearch()"
              class="hidden md:flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 w-48 sm:w-52 border border-gray-300 dark:border-gray-700 rounded-md hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all text-xs bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              title="Search (Cmd/Ctrl+K)"
            >
              <MagnifyingGlassIcon class="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span class="flex-1 text-left">Search anything...</span>
              <kbd class="hidden lg:inline-flex px-1 py-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">⌘K</kbd>
            </button>
            
            <!-- Mobile Search Button -->
            <button
              @click="searchStore.openSearch()"
              class="md:hidden p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Search"
            >
              <MagnifyingGlassIcon class="w-4 h-4 sm:w-4 sm:h-4" />
            </button>

            <!-- Store Selector (for super admins) -->
            <StoreSelector v-if="userStore.userData?.role === 'superAdmin'" />

            <!-- Theme Toggle Button -->
            <ThemeToggle />

            <!-- Notifications -->
            <NuxtLink
              to="/dashboard/notifications"
              class="relative p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Notifications"
            >
              <BellIcon class="w-4 h-4 sm:w-4 sm:h-4" />
              <span
                v-if="unreadNotificationCount > 0"
                class="absolute top-0 right-0 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center px-0.5"
              >
                {{ unreadNotificationCount > 99 ? '99+' : unreadNotificationCount }}
              </span>
            </NuxtLink>

            <!-- Profile Dropdown -->
            <div class="relative" ref="profileMenuRef">
              <button
                @click="profileMenuOpen = !profileMenuOpen"
                class="flex items-center space-x-1 sm:space-x-1.5 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div class="w-6 h-6 sm:w-6 sm:h-6 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-[10px] sm:text-[10px]">
                  {{ userInitials }}
                </div>
                <div class="hidden md:block text-left">
                  <p class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ userName }}</p>
                  <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ userEmail }}</p>
                </div>
                <ChevronDownIcon class="hidden md:block w-3 h-3 sm:w-3 sm:h-3 text-gray-400 dark:text-gray-500" />
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
                  class="absolute right-0 mt-2 w-40 sm:w-44 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 z-50"
                  style="min-width: 160px; max-width: min(176px, calc(100vw - 2rem));"
                >
                  <NuxtLink
                    to="/dashboard/profile"
                    class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                    @click="profileMenuOpen = false"
                  >
                    <UserCircleIcon class="w-3.5 h-3.5 flex-shrink-0" />
                    Profile
                  </NuxtLink>
                  <NuxtLink
                    to="/dashboard/settings"
                    class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                    @click="profileMenuOpen = false"
                  >
                    <Cog6ToothIcon class="w-3.5 h-3.5 flex-shrink-0" />
                    Settings
                  </NuxtLink>
                  <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    @click="handleSignOut"
                    class="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
                  >
                    <ArrowRightOnRectangleIcon class="w-3.5 h-3.5 flex-shrink-0" />
                    Sign out
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 w-full" style="min-width: 0; max-width: 100%; overflow-x: hidden;">
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
  ArrowsRightLeftIcon,
} from '@heroicons/vue/24/outline'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import StoreSelector from '~/components/ui/StoreSelector.vue'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import GlobalSearch from '~/components/search/GlobalSearch.vue'
import RecentItemsWidget from '~/components/ui/RecentItemsWidget.vue'
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

const logoSource = computed(() => {
  return actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
})
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
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Multi-Store Sync', href: '/dashboard/multi-store-sync', icon: ArrowsRightLeftIcon, requiresSuperAdmin: true },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
]

// Filter navigation based on user role
const filteredNavigation = computed(() => {
  return navigation.filter(item => {
    if (item.requiresSuperAdmin) {
      return userStore.isSuperAdmin
    }
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
    // Only cache if userStore indicates this is a super admin (or we don't have userData yet)
    if (userStore.userData?.role === 'superAdmin' || !userStore.userData) {
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
    // Clear cached user data from localStorage on sign out
    clearCachedUser()
    await signOut()
    navigateTo('/signin')
  } catch (error) {
    console.error('Sign out error:', error)
    // Still navigate even if sign out fails
    clearCachedUser()
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
    
    // If user changed, clear old cache and load new user's cache
    if (userChanged && !isStaffCreationInProgress) {
      // Clear old cache
      cachedUserName.value = null
      cachedUserEmail.value = null
      cachedUserId.value = null
      
      // Load new user's cache from localStorage
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

