<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden relative">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200/60 dark:border-gray-700/60 transform transition-all duration-300 ease-in-out lg:translate-x-0 shadow-xl',
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
              :key="currentTheme"
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
        <div class="space-y-1.5">
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
      
      <!-- Collapse/Expand Button (at bottom) -->
      <div v-if="sidebarCollapsed" class="relative px-3 py-3 border-t border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <button
          @click="toggleSidebar"
          class="w-full flex items-center justify-center p-3 text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
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
            <button class="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <BellIcon class="w-6 h-6" />
              <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

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
                <ChevronDownIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
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
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                >
                  <NuxtLink
                    to="/dashboard/profile"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="profileMenuOpen = false"
                  >
                    Profile
                  </NuxtLink>
                  <NuxtLink
                    to="/dashboard/settings"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="profileMenuOpen = false"
                  >
                    Settings
                  </NuxtLink>
                  <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    @click="handleSignOut"
                    class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
} from '@heroicons/vue/24/outline'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useTheme } from '~/composables/useTheme'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'

const { actualTheme } = useTheme()
const authStore = useAuthStore()
const userStore = useUserStore()
const sidebarOpen = ref(false)
const profileMenuOpen = ref(false)
const profileMenuRef = ref<HTMLElement | null>(null)

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

const currentTheme = computed(() => actualTheme.value || 'light')

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Inventory', href: '/dashboard/inventory', icon: CubeIcon },
  { name: 'Receipts', href: '/dashboard/receipts', icon: ReceiptPercentIcon },
  { name: 'Returns', href: '/dashboard/returns', icon: ArrowPathIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UsersIcon },
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

// User profile data
const userName = computed(() => {
  // Try to get name from Firestore userData first
  if (userStore.userData?.name) {
    return userStore.userData.name
  }
  // Fallback to Firebase Auth displayName
  if (authStore.currentUser?.displayName) {
    return authStore.currentUser.displayName
  }
  // Fallback to email prefix (part before @)
  if (authStore.currentUser?.email) {
    return authStore.currentUser.email.split('@')[0]
  }
  return 'User'
})

const userEmail = computed(() => {
  return authStore.currentUser?.email || ''
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // Fetch user data if authenticated and not already loaded
  if (authStore.currentUser?.uid && !userStore.userData) {
    userStore.fetchUserData(authStore.currentUser.uid)
  }
})

// Watch for auth state changes to fetch user data
watch(() => authStore.currentUser, (user) => {
  if (user?.uid && !userStore.userData) {
    userStore.fetchUserData(user.uid)
  }
}, { immediate: true })

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

