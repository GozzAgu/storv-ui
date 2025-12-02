<template>
  <!-- Loading state while checking authentication -->
  <div v-if="checkingAuth" class="min-h-screen bg-gray-50 dark:bg-gray-900 w-full flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
      <p class="text-sm text-gray-600 dark:text-gray-400">Verifying authentication...</p>
    </div>
  </div>
  
  <!-- Dashboard content (only shown if authenticated) -->
  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden relative">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200/60 dark:border-gray-700/60 transform transition-all duration-300 ease-in-out lg:translate-x-0 shadow-xl flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        sidebarCollapsed ? 'w-20' : 'w-72'
      ]"
    >
      <!-- Background Gradient -->
      <div class="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-gray-50/30 dark:from-gray-900/50 dark:via-gray-800 dark:to-gray-900/50 pointer-events-none"></div>
      <!-- Logo -->
      <div class="relative flex items-center justify-between h-20 border-b border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm" :class="sidebarCollapsed ? 'px-2' : 'px-6'">
        <NuxtLink 
          to="/dashboard" 
          :class="[
            'flex items-center transition-all duration-300 group',
            sidebarCollapsed ? 'justify-center w-full' : 'space-x-3'
          ]"
        >
          <div class="relative flex-shrink-0">
            <img
              :key="`logo-${currentTheme}`"
              :src="currentTheme === 'dark' ? '/storv logo dark.png' : '/storv logo.png'"
              alt="Storv Logo"
              :class="[
                'transition-all duration-300 object-contain',
                sidebarCollapsed ? 'h-10 w-10' : 'h-12 w-auto'
              ]"
            />
            <div class="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-purple-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <span 
            v-if="!sidebarCollapsed" 
            class="text-2xl font-bold bg-gradient-to-r from-primary-600 via-primary-500 to-purple-600 bg-clip-text text-transparent tracking-tight"
          >
            Storv
          </span>
        </NuxtLink>
        <div class="flex items-center gap-2" v-if="!sidebarCollapsed">
          <button
            @click="toggleSidebar"
            class="hidden lg:flex p-2.5 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
            title="Collapse sidebar"
          >
            <ChevronLeftIcon class="w-5 h-5" />
          </button>
          <button
            @click="sidebarOpen = false"
            class="lg:hidden p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <button
          v-else
          @click="sidebarOpen = false"
          class="lg:hidden p-2.5 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="relative flex-1 py-6 overflow-y-auto overflow-x-hidden" :class="sidebarCollapsed ? 'px-3' : 'px-5'">
        <div class="space-y-1.5 min-h-0">
          <NuxtLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              'group relative flex items-center font-medium rounded-xl transition-all duration-300 ease-out overflow-hidden',
              sidebarCollapsed ? 'justify-center w-full py-3.5' : 'justify-start px-5 py-4',
              isActive(item.href)
                ? 'bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 text-white shadow-lg shadow-primary-500/30 dark:shadow-primary-500/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100/80 hover:to-gray-50/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/50'
            ]"
            :title="sidebarCollapsed ? item.name : ''"
          >
            <!-- Active indicator -->
            <div 
              v-if="isActive(item.href) && !sidebarCollapsed"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white/60 rounded-r-full"
            ></div>
            
            <!-- Active indicator for collapsed (circular) -->
            <div 
              v-if="isActive(item.href) && sidebarCollapsed"
              class="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600"
            ></div>
            
            <!-- Hover effect background -->
            <div 
              v-if="!isActive(item.href)"
              class="absolute inset-0 bg-gradient-to-r from-primary-50/0 via-primary-50/50 to-purple-50/0 dark:from-primary-900/0 dark:via-primary-900/30 dark:to-purple-900/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>
            
            <component 
              :is="item.icon" 
              :class="[
                'relative z-10 transition-all duration-300',
                sidebarCollapsed ? 'w-6 h-6' : 'w-6 h-6 mr-4',
                isActive(item.href)
                  ? 'text-white' 
                  : 'text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
              ]"
            />
            <span 
              v-if="!sidebarCollapsed" 
              class="relative z-10 flex-1 whitespace-nowrap text-[15px] font-semibold tracking-tight transition-all duration-300"
              :class="isActive(item.href) ? 'text-white' : 'text-gray-700 dark:text-gray-300'"
            >
              {{ item.name }}
            </span>
            
            <!-- Tooltip for collapsed state -->
            <div
              v-if="sidebarCollapsed"
              class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl"
            >
              {{ item.name }}
              <div class="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
            </div>
          </NuxtLink>
        </div>
      </nav>
      
      <!-- Bottom Section (Logout + Collapse/Expand) -->
      <div class="relative mt-auto border-t border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex-shrink-0" :class="sidebarCollapsed ? 'px-3 py-3' : 'px-5 py-4'">
        <button
          @click="handleSignOut"
          :class="[
            'group relative flex items-center font-medium rounded-xl transition-all duration-300 ease-out overflow-hidden w-full',
            sidebarCollapsed ? 'justify-center py-3' : 'justify-start px-5 py-3',
            'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          ]"
          :title="sidebarCollapsed ? 'Sign out' : ''"
        >
          <ArrowRightOnRectangleIcon 
            :class="[
              'relative z-10 transition-all duration-300',
              sidebarCollapsed ? 'w-6 h-6' : 'w-6 h-6 mr-4'
            ]"
          />
          <span 
            v-if="!sidebarCollapsed" 
            class="relative z-10 flex-1 whitespace-nowrap text-[15px] font-semibold tracking-tight"
          >
            Sign out
          </span>
          
          <!-- Tooltip for collapsed state -->
          <div
            v-if="sidebarCollapsed"
            class="absolute left-full ml-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl"
          >
            Sign out
            <div class="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-800"></div>
          </div>
        </button>
        
        <!-- Collapse/Expand Button (when collapsed) -->
        <button
          v-if="sidebarCollapsed"
          @click="toggleSidebar"
          class="w-full flex items-center justify-center p-3 mt-2 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
          title="Expand sidebar"
        >
          <ChevronRightIcon class="w-5 h-5" />
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
      :class="['min-h-screen transition-all duration-300', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72']"
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
            <!-- Search -->
            <div class="hidden md:block">
              <div class="relative">
                <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  class="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

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
                <div class="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                  class="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
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
                    class="block w-full text-left px-4 py-2.5 sm:py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:bg-gray-200 dark:active:bg-gray-600"
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
      <main class="p-4 sm:p-6 lg:p-8 w-full" style="min-width: 0; max-width: 100%; overflow-x: hidden;">
        <slot />
      </main>
    </div>
    
    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
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
} from '@heroicons/vue/24/outline'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useTheme } from '~/composables/useTheme'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useNotificationsStore } from '~/stores/notifications'

const { actualTheme } = useTheme()
const authStore = useAuthStore()
const userStore = useUserStore()
const notificationsStore = useNotificationsStore()

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

// Logo theme detection - sync with actual DOM state for immediate responsiveness
const logoTheme = ref<'light' | 'dark'>('light')

// Initialize logo theme on mount and watch for changes
onMounted(() => {
  // Function to update logo theme based on current DOM state
  const updateLogoTheme = () => {
    if (import.meta.client) {
      const isDark = document.documentElement.classList.contains('dark')
      logoTheme.value = isDark ? 'dark' : 'light'
    }
  }
  
  // Initial update
  updateLogoTheme()
  
  // Watch for theme changes via actualTheme
  watch(actualTheme, () => {
    updateLogoTheme()
  }, { immediate: true })
  
  // Also watch for DOM class changes (when theme is applied)
  const observer = new MutationObserver(() => {
    updateLogoTheme()
  })
  
  if (import.meta.client) {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    observer.disconnect()
  })
})

const currentTheme = computed(() => logoTheme.value)

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Inventory', href: '/dashboard/inventory', icon: CubeIcon },
  { name: 'Receipts', href: '/dashboard/receipts', icon: ReceiptPercentIcon },
  { name: 'Departments', href: '/dashboard/departments', icon: BuildingOfficeIcon },
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

// Cache user profile info to prevent UI flickering during staff creation (sign out/sign in process)
const cachedUserName = ref<string | null>(null)
const cachedUserEmail = ref<string | null>(null)
const cachedUserId = ref<string | null | undefined>(null)

// User profile data - use cached values during staff creation to prevent UI bug
const userName = computed(() => {
  const currentUserId = authStore.currentUser?.uid
  
  // If we have a cached name, keep using it (prevents flicker during staff creation)
  // Use cache if: same user OR no current user (during sign out/in for staff creation)
  if (cachedUserName.value && cachedUserId.value) {
    if (cachedUserId.value === currentUserId || !currentUserId) {
      return cachedUserName.value
    }
  }
  
  // Try to get name from Firestore userData first
  if (userStore.userData?.name && currentUserId) {
    const name = userStore.userData.name ?? null
    // Cache it for this user
    if (name) {
      cachedUserName.value = name
      cachedUserId.value = currentUserId ?? null
      return name
    }
  }
  // Fallback to Firebase Auth displayName
  if (authStore.currentUser?.displayName && currentUserId) {
    const name = authStore.currentUser.displayName ?? null
    if (name) {
      cachedUserName.value = name
      cachedUserId.value = currentUserId ?? null
      return name
    }
  }
  // Fallback to email prefix (part before @)
  const currentEmail = authStore.currentUser?.email
  if (currentEmail && currentUserId) {
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
  
  // If we have cached email and it's for the same user, keep using it
  if (cachedUserEmail.value && cachedUserId.value === currentUserId) {
    return cachedUserEmail.value
  }
  
  const email = authStore.currentUser?.email || ''
  
  // Cache it for this user
  if (email && currentUserId) {
    cachedUserEmail.value = email
    cachedUserId.value = currentUserId ?? null
  }
  
  // If no current user but we have cached data, use cache (prevents flicker)
  if (!email && cachedUserEmail.value) {
    return cachedUserEmail.value
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
})

// Watch for auth state changes to fetch user data and protect routes
watch(() => authStore.currentUser, async (user, oldUser) => {
  // Check if staff creation is in progress - don't redirect during temporary sign-out
  const isStaffCreationInProgress = import.meta.client 
    ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
    : false
  
  // Redirect to signin if user logs out (but not during staff creation)
  if (import.meta.client && !authStore.loading && !user && !isStaffCreationInProgress) {
    return navigateTo('/signin')
  }
  
  // Only fetch if:
  // 1. User exists
  // 2. We don't have userData OR the user changed (not just signed back in)
  // This prevents refetching during staff creation when super admin signs out/in
  if (user?.uid) {
    const hasUserData = userStore.userData && userStore.userData.uid === user.uid
    const userChanged = oldUser?.uid !== user.uid
    
    if (!hasUserData || userChanged) {
      userStore.fetchUserData(user.uid)
    }
  }
}, { immediate: true })

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

