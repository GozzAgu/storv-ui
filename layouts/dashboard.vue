<template>
 <!-- Loading state while checking authentication -->
 <div v-if="checkingAuth" class="min-h-screen bg-gray-50 dark:bg-gray-900 w-full flex items-center justify-center">
 <div class="text-center">
 <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
 <p class="text-sm text-gray-600 dark:text-gray-400">Verifying authentication...</p>
 </div>
 </div>
 
 <!-- Dashboard content (only shown if authenticated) -->
 <div
 v-else
 :class="[
 'dashboard-layout-root w-full overflow-x-clip relative bg-gray-100 dark:bg-[#07080c]',
 isNativeApp
 ? 'dashboard-layout-root--native h-[100dvh] max-h-[100dvh] overflow-hidden'
 : 'min-h-screen',
 ]"
 >
 <!-- Sidebar (web / tablet — native app uses bottom nav) -->
 <aside
 v-if="!isNativeApp"
 class="dashboard-sidebar"
 :class="[
 /* z above DashboardFixedFooter (z-50) so collapsed-nav + sign-out tooltips paint over the pagination bar */
 'fixed inset-y-0 left-0 z-[55] flex max-lg:transform-gpu max-lg:will-change-transform lg:will-change-auto flex-col border-r border-gray-200/50 bg-gray-50/98 backdrop-blur-xl transition-[transform,width] max-lg:duration-[420ms] max-lg:ease-[cubic-bezier(0.16,1,0.3,1)] lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:border-white/[0.06] dark:!bg-dashboard-card/95 lg:translate-x-0',
 sidebarOpen ? 'translate-x-0' : '-translate-x-full',
 effectiveSidebarCollapsed ? 'w-[72px]' : 'w-64',
 ]"
 >
 <!-- Logo / Brand -->
 <div
 :class="sidebarLogoBarClass"
 >
 <NuxtLink
 :to="dashPath('')"
 :class="[
 'flex items-center transition-all duration-300',
 effectiveSidebarCollapsed ? 'relative group justify-center w-full' : 'gap-1.5 min-w-0 flex-1',
 ]"
 >
 <img
 :src="sidebarLogoSrc"
 alt="Storvv"
 :class="sidebarLogoImgClass"
 />
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
 class="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-1"
 :class="effectiveSidebarCollapsed ? 'px-1.5' : 'px-2'"
 >
 <div class="min-h-0 space-y-0">
 <template v-for="item in filteredNavigation" :key="item.name">
 <!-- Inventory (expandable) -->
 <div v-if="item.name === 'Inventory' && !effectiveSidebarCollapsed" class="space-y-0.5">
 <div
 :class="[ 'group relative mx-0.5 flex w-full max-w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors duration-200', !isActive(item.href) ? 'hover:bg-gray-100/90 dark:hover:bg-white/[0.05]' : '' ]"
 >
 <NuxtLink
 :to="item.href"
 class="flex min-w-0 flex-1 items-center gap-2.5"
 :class="{ 'pointer-events-none opacity-50': switchingStore }"
 >
 <component
 :is="isActive(item.href) ? item.iconSolid : item.icon"
 :class="[ 'w-4 h-4 shrink-0 transition-colors', isActive(item.href) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-100' ]"
 :stroke-width="isActive(item.href) ? undefined : 1.5"
 />
 <span class="truncate text-[13px] leading-snug" :class="isActive(item.href) ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-normal text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-100'">
 {{ item.name }}
 </span>
 </NuxtLink>
 <button
 type="button"
 @click.stop="inventoryExpanded = !inventoryExpanded"
 class="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
 :class="isActive(item.href) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'"
 :aria-expanded="inventoryExpanded"
 aria-label="Toggle inventory categories"
 >
 <span class="group relative inline-flex">
 <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="inventoryExpanded ? 'rotate-180' : ''" stroke-width="2" />
 </span>
 </button>
 </div>
 <div v-if="inventoryExpanded && inventoryFolders.length > 0" class="ml-1.5 space-y-0 /50 py-0.5 pl-3 dark:border-white/[0.08]">
 <NuxtLink
 v-for="folder in recentFolders.slice(0, 5)"
 :key="folder.id"
 :to="dashPath(`/inventory/${folder.id}`)"
 :class="[ 'group relative flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors', route.params.id !== folder.id ? 'text-gray-500 hover:bg-gray-100/90 dark:text-gray-400 dark:hover:bg-white/[0.05]' : '', { 'pointer-events-none opacity-50': switchingStore } ]"
 >
 <FolderIcon
 v-if="route.params.id !== folder.id"
 class="w-3.5 h-3.5 shrink-0 text-gray-500 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-200"
 :stroke-width="1.75"
 />
 <FolderIconSolid v-else class="w-3.5 h-3.5 shrink-0 text-gray-900 dark:text-gray-100" />
 <span class="flex-1 truncate leading-snug" :class="route.params.id === folder.id ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-normal group-hover:text-gray-800 dark:group-hover:text-gray-100'">{{ folder.name }}</span>
 </NuxtLink>
 </div>
 </div>

 <!-- Regular nav items -->
 <NuxtLink
 v-else-if="(item.name !== 'Inventory' && item.name !== 'Departments') || effectiveSidebarCollapsed"
 :to="item.href"
 :data-tutorial="item.name.toLowerCase().replace(/\s+/g, '-')"
 :class="[ 'group relative flex items-center transition-[transform,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]', effectiveSidebarCollapsed ? 'mx-0.5 w-full justify-center rounded-lg py-1.5 active:scale-[0.98] motion-reduce:active:scale-100' : 'mx-0.5 gap-2 rounded-lg px-2 py-1.5', !isActive(item.href) && effectiveSidebarCollapsed ? 'text-gray-500 hover:bg-gray-100/90 dark:text-gray-400 dark:hover:bg-white/[0.06]' : !isActive(item.href) ? 'text-gray-500 hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-100' : 'text-gray-900 dark:text-gray-100', { 'pointer-events-none opacity-50': switchingStore } ]"
 >
 <component
 :is="isActive(item.href) ? item.iconSolid : item.icon"
 :class="[ 'w-4 h-4 shrink-0 transition-colors', effectiveSidebarCollapsed ? '' : 'mr-0', isActive(item.href) ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-100' ]"
 :stroke-width="isActive(item.href) ? undefined : 1.75"
 />
 <span v-if="!effectiveSidebarCollapsed" class="truncate text-[13px] leading-snug" :class="isActive(item.href) ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-normal text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-100'">
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
            class="mt-1.5 rounded-xl border-0 bg-gray-50/95 p-1.5 dark:bg-white/[0.04]"
 >
 <button
 type="button"
 @click="storesSectionCollapsed = !storesSectionCollapsed"
 class="group relative flex w-full items-center justify-between rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-200"
 :aria-expanded="!storesSectionCollapsed"
 >
 <span>Branches</span>
 <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="storesSectionCollapsed ? '' : 'rotate-180'" stroke-width="2" />
 </button>
 <div v-if="!storesSectionCollapsed" class="mt-1 space-y-0.5 pl-0">
 <template v-for="store in storesList" :key="store.id">
 <div
 :class="[ 'flex items-center justify-between rounded-lg px-2 py-2 transition-colors duration-200', store.id !== storesStore.currentStoreId ? 'opacity-40' : '', store.id === storesStore.currentStoreId && !(route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')) ? 'hover:bg-gray-100/90 dark:hover:bg-white/[0.05]' : '' ]"
 >
 <NuxtLink
 :to="store.id === storesStore.currentStoreId ? `/dashboard/stores/${store.id}/departments` : '#'"
 class="group relative flex min-w-0 flex-1 items-center gap-2"
 :class="{ 'pointer-events-none cursor-not-allowed': switchingStore || (store.id !== storesStore.currentStoreId) }"
 @click.prevent="store.id !== storesStore.currentStoreId ? null : null"
 >
 <BuildingStorefrontIcon
 v-if="!(route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments'))"
 class="h-4 w-4 shrink-0"
 :class="currentStore?.id === store.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-800 dark:group-hover:text-gray-200'"
 :stroke-width="1.75"
 aria-hidden="true"
 />
 <BuildingStorefrontIconSolid
 v-else
 class="h-4 w-4 shrink-0 text-gray-900 dark:text-gray-100"
 aria-hidden="true"
 />
 <span
 class="truncate text-[13px] leading-snug"
 :class="route.params.storeId === store.id && route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments') ? 'font-bold text-gray-900 dark:text-gray-100' : currentStore?.id === store.id ? 'font-medium text-gray-900 dark:text-gray-100' : 'font-normal text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-100'"
 >
 {{ store.name }}
 </span>
 <span v-if="currentStore?.id === store.id || store.id === storesStore.currentStoreId" class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25" title="Active store"></span>
 <span v-if="store.id !== storesStore.currentStoreId" class="text-[9px] text-gray-400 dark:text-gray-500 italic shrink-0">Inactive</span>
 </NuxtLink>
 <button
 v-if="store.id === storesStore.currentStoreId"
 type="button"
 @click.stop="toggleStoreExpanded(store.id)"
 class="group relative shrink-0 rounded-lg p-1 text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-800 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
 :aria-expanded="!!expandedStores[store.id]"
 aria-label="Toggle departments"
 >
 <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="expandedStores[store.id] ? 'rotate-180' : ''" stroke-width="2" />
 </button>
 </div>
 <div v-if="expandedStores[store.id] && store.id === storesStore.currentStoreId" class="ml-0.5 space-y-0.5 /50 py-0.5 pl-2.5 pr-0.5 dark:border-white/[0.08]">
 <template v-for="department in getDepartmentsForStore(store.id)" :key="department.id">
 <div class="group flex items-center justify-between gap-1 rounded-lg">
 <NuxtLink
 :to="`/dashboard/departments/${department.id}`"
 class="group relative flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors"
 :class="[ route.params.id === department.id && route.path.startsWith('/dashboard/departments') ? '' : 'text-gray-500 hover:bg-gray-100/90 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-100', { 'pointer-events-none opacity-50': switchingStore } ]"
 >
 <BuildingOfficeIcon
 v-if="!(route.params.id === department.id && route.path.startsWith('/dashboard/departments'))"
 class="w-3.5 h-3.5 shrink-0 text-gray-500 group-hover:text-gray-700 dark:text-gray-500 dark:group-hover:text-gray-200"
 :stroke-width="1.75"
 />
 <BuildingOfficeIconSolid v-else class="w-3.5 h-3.5 shrink-0 text-gray-900 dark:text-gray-100" />
 <span class="flex-1 truncate leading-snug" :class="route.params.id === department.id && route.path.startsWith('/dashboard/departments') ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-normal group-hover:text-gray-800 dark:group-hover:text-gray-100'">{{ department.name }}</span>
 </NuxtLink>
 <button
 type="button"
 @click.stop="toggleDepartmentExpanded(department.id)"
 class="group relative shrink-0 rounded-lg p-1 text-gray-500 transition-colors hover:bg-black/[0.04] hover:text-gray-800 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
 :aria-expanded="expandedDepartments[department.id]"
 aria-label="Toggle staff list"
 >
 <ChevronDownIcon class="w-3.5 h-3.5 transition-transform duration-200" :class="expandedDepartments[department.id] ? 'rotate-180' : ''" stroke-width="2" />
 </button>
 </div>
 <div v-if="expandedDepartments[department.id]" class="space-y-0.5 pb-0.5 pl-4 pr-0.5">
 <template v-if="getStaffForDepartment(department.id).length > 0">
 <NuxtLink
 v-for="member in getStaffForDepartment(department.id)"
 :key="member.id"
 :to="`/dashboard/departments/${department.id}`"
 class="group relative flex items-center gap-2 rounded-md px-2 py-2 text-[13px] text-gray-500 transition-colors hover:bg-gray-100/90 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-100"
 >
 <span class="h-1 w-1 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500"></span>
 <span class="truncate">{{ (member.firstName && member.lastName) ? `${member.firstName} ${member.lastName}` : (member.email || 'Staff') }}</span>
 </NuxtLink>
 </template>
 <p v-else class="rounded-md px-2 py-2 text-[13px] text-gray-400 dark:text-gray-500">No staff</p>
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
 <div v-if="storesList.length === 0" class="px-2.5 py-2 text-xs text-gray-500 dark:text-gray-400">No stores</div>
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
 class="shrink-0 border-t border-gray-200/35 bg-white/30 backdrop-blur-md dark:border-white/[0.06] dark:bg-white/[0.02]"
 :class="effectiveSidebarCollapsed ? 'px-1.5 pb-2.5 pt-2.5' : 'px-2.5 pb-3 pt-2.5'"
 >
 <div
 class="rounded-lg bg-white p-2.5 dark:!bg-dashboard-card"
 :class="effectiveSidebarCollapsed ? 'px-1.5' : ''"
 >
 <div class="flex items-center gap-2.5" :class="effectiveSidebarCollapsed ? 'relative justify-center group' : ''">
 <div
 class="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-primary-400 via-primary-500 to-primary-700 text-[11px] font-bold text-white ring-1 ring-inset ring-white/25 dark:ring-white/15"
 >
 <span class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/15 to-transparent" aria-hidden="true" />
 <span class="relative">{{ userInitials }}</span>
 </div>
 <div v-if="!effectiveSidebarCollapsed" class="min-w-0 flex-1">
 <p class="truncate text-xs font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100">{{ userName }}</p>
 <p class="mt-0.5 truncate text-[10px] leading-snug text-gray-500 dark:text-gray-400">{{ userEmail }}</p>
 </div>
 <DashboardHoverTooltip v-if="effectiveSidebarCollapsed">
 {{ userName }}
 <span class="mt-0.5 block text-[11px] font-normal text-gray-400">{{ userEmail }}</span>
 </DashboardHoverTooltip>
 </div>
 <button
 @click="handleSignOut"
 :class="[
 'mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-colors',
 effectiveSidebarCollapsed ? 'relative group' : 'px-1',
 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.04] dark:hover:text-gray-200',
 ]"
 >
 <ArrowRightOnRectangleIcon class="h-4 w-4 shrink-0 opacity-80" stroke-width="1.75" />
 <span v-if="!effectiveSidebarCollapsed">Sign out</span>
 <DashboardHoverTooltip v-if="effectiveSidebarCollapsed">
 Sign out
 </DashboardHoverTooltip>
 </button>
 <p class="mt-2 text-[9px] tabular-nums tracking-wide text-gray-400 dark:text-gray-500" :class="effectiveSidebarCollapsed ? 'text-center' : 'text-left'">
 V{{ appVersion }}
 </p>
 </div>
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
 'min-h-screen transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
 sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
 ],
 ]"
 style="min-width: 0; max-width: 100vw;"
 >
 <!-- Top Navigation (fixed so it stays visible when scrolling) -->
 <header
 :class="[
 'dashboard-top-nav fixed top-0 right-0 isolate border-b border-gray-200/45 bg-white/92 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0c12]/92',
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
 isNativeApp ? 'dashboard-top-nav-native-row h-11' : 'h-11 sm:h-12',
 ]"
 >
 <!-- Mobile nav trigger (web drawer) -->
 <button
 v-if="!isNativeApp"
 type="button"
 class="dashboard-sidebar-open-trigger group flex h-8 shrink-0 items-center gap-0.5 rounded-lg /55 bg-white/90 py-1 pl-1.5 pr-2 text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-gray-300 dark:hover:bg-white/[0.08] lg:hidden"
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

 <!-- Native: Storvv logo (links home) -->
 <div v-if="isNativeApp" class="flex min-w-0 flex-1 items-center">
 <NuxtLink
 :to="dashPath('')"
 class="flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/35"
 aria-label="Storv home"
 >
 <img
 src="/storvv logo mobile.png"
 alt="Storv"
 class="h-8 w-8 object-contain"
 width="32"
 height="32"
 decoding="async"
 />
 </NuxtLink>
 </div>

 <!-- Page title -->
 <div v-else class="hidden min-w-0 shrink-0 md:block lg:min-w-[7.5rem]">
 <p class="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
 Workspace
 </p>
 <div class="mt-0.5 flex min-w-0 items-center gap-1.5">
 <component
 :is="currentPageIcon"
 class="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500"
 stroke-width="1.75"
 aria-hidden="true"
 />
 <h1 class="min-w-0 truncate text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-100">
 {{ currentPageName }}
 </h1>
 </div>
 </div>

 <!-- Desktop search -->
 <button
 v-if="!isNativeApp"
 type="button"
 class="dashboard-topnav-search group relative hidden h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-transparent bg-gray-100/70 px-2.5 text-gray-600 transition-colors hover:border-gray-200/60 hover:bg-white focus:outline-none focus-visible:border-primary-500/30 focus-visible:ring-2 focus-visible:ring-primary-500/20 dark:bg-white/[0.04] dark:text-gray-300 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.06] md:flex md:max-w-[16rem] lg:max-w-[18rem] xl:max-w-[20rem]"
 @click="searchStore.openSearch()"
 >
 <MagnifyingGlassIcon
 class="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500"
 stroke-width="1.75"
 />
 <span class="flex-1 truncate text-left text-[11px] font-medium text-gray-500 dark:text-gray-400">
 Search workspace
 </span>
 <kbd
 class="hidden shrink-0 rounded bg-white/90 px-1.5 py-px font-mono text-[9px] font-medium text-gray-400 dark:border-white/10 dark:bg-white/[0.06] dark:text-gray-500 lg:inline"
 >
 ⌘K
 </kbd>
 </button>

 <div class="flex-1 md:hidden" aria-hidden="true" />

 <!-- Actions toolbar -->
 <div
 class="dashboard-topnav-actions relative z-10 ml-auto flex shrink-0 items-center gap-1 rounded-xl bg-gray-50/80 p-0.5 backdrop-blur-sm dark:border-white/[0.07] dark:bg-white/[0.03] sm:gap-0.5 sm:p-1"
 >
 <button
 type="button"
 class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200 md:hidden"
 aria-label="Search"
 @click="searchStore.openSearch()"
 >
 <MagnifyingGlassIcon class="h-4 w-4" stroke-width="1.75" />
 </button>

 <span
 class="hidden h-4 w-px shrink-0 bg-gray-200/70 dark:bg-white/10 md:block"
 aria-hidden="true"
 />

 <StoreSelector
 v-if="userStore.userData?.role === 'superAdmin'"
 :class="isNativeApp ? 'max-w-[5.25rem] shrink' : 'shrink-0'"
 />

 <ThemeToggle class="shrink-0" />

 <div class="relative z-[130] h-8 w-8 shrink-0" ref="notificationsRef">
 <button
 type="button"
 class="group relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
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
 enter-active-class="transition ease-out duration-150"
 enter-from-class="opacity-0 scale-95"
 enter-to-class="opacity-100 scale-100"
 leave-active-class="transition ease-in duration-100"
 leave-from-class="opacity-100 scale-100"
 leave-to-class="opacity-0 scale-95"
 >
 <div
 v-if="notificationsOpen"
 ref="notificationsPanelRef"
 class="absolute right-0 top-[calc(100%+0.375rem)] z-[140] w-80 max-w-[calc(100vw-1.5rem)] origin-top-right pointer-events-auto"
 @click.stop
 >
 <NotificationsPanel variant="dropdown" @close="notificationsOpen = false" />
 </div>
 </Transition>
 </div>

 <span
 class="hidden h-4 w-px shrink-0 bg-gray-200/70 dark:bg-white/10 sm:block"
 aria-hidden="true"
 />

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
 :class="isNativeApp ? 'dashboard-top-nav-spacer-native' : 'h-11 sm:h-12'"
 aria-hidden="true"
 />

 <!-- Page Content (same soft entrance as auth pages; re-runs on route change) -->
 <main
 data-dashboard-main
 :class="[
 'w-full min-w-0 max-w-full px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-4',
 isNativeApp
 ? 'dashboard-native-main min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain'
 : 'overflow-x-clip overflow-y-visible',
 ]"
 >
 <div
 :key="route.path"
 class="min-w-0 opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none animate-auth-fade-up [animation-delay:40ms]"
 >
 <DemoModeBanner v-if="isDemoDashboard" />
 <slot />
 </div>
 </main>

 <!-- Native: forms/drawers render in-app (between top bar and bottom nav), not over the whole screen -->
 <div
 v-if="isNativeApp"
 id="dashboard-native-overlay-host"
 class="dashboard-native-overlay-host"
 aria-hidden="true"
 />
 </div>
 
 <!-- Toast Notifications -->
 <ToastContainer />
 
 <!-- Global Search -->
 <GlobalSearch />

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
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import {
 XMarkIcon,
 HomeIcon,
 CubeIcon,
 ReceiptPercentIcon,
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
 ChartBarIcon,
 ArrowsRightLeftIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
 BuildingStorefrontIcon,
 BanknotesIcon,
} from '@heroicons/vue/24/outline'
import {
 HomeIcon as HomeIconSolid,
 CubeIcon as CubeIconSolid,
 ReceiptPercentIcon as ReceiptPercentIconSolid,
 ChartBarIcon as ChartBarIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ArrowsRightLeftIcon as ArrowsRightLeftIconSolid,
 BookOpenIcon as BookOpenIconSolid,
 Cog6ToothIcon as Cog6ToothIconSolid,
 UserCircleIcon as UserCircleIconSolid,
 FolderIcon as FolderIconSolid,
 BuildingStorefrontIcon as BuildingStorefrontIconSolid,
 BuildingOfficeIcon as BuildingOfficeIconSolid,
 BanknotesIcon as BanknotesIconSolid,
} from '@heroicons/vue/24/solid'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import DashboardHoverTooltip from '~/components/ui/DashboardHoverTooltip.vue'
import DemoModeBanner from '~/components/demo/DemoModeBanner.vue'
import DashboardNativeBottomNav from '~/components/dashboard/DashboardNativeBottomNav.vue'
import DashboardProfileMenu from '~/components/dashboard/DashboardProfileMenu.vue'
import { splitNativeBottomNav } from '~/utils/dashboard-native-nav'
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
import { getAuthWaitMs, waitForAuthStore } from '~/utils/wait-for-auth'

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
const { eligibleStores } = usePlanEligibleStores()
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
const { isNativeApp } = useCapacitorNativeApp()
const sidebarOpen = ref(false)

function closeMobileSidebarOverlay() {
 if (sidebarOpen.value) sidebarOpen.value = false
}
const notificationsOpen = ref(false)
const notificationsRef = ref<HTMLElement | null>(null)
const notificationsPanelRef = ref<HTMLElement | null>(null)
/** Never block the whole shell on auth — show UI with a short gate only (Capacitor-safe). */
const checkingAuth = ref(false)

const toggleNotifications = () => {
 notificationsOpen.value = !notificationsOpen.value
}

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

const sidebarLogoBarClass = computed(() => {
 /** Fixed height: logo uses scale inside this strip so the row never grows. */
 const bar =
 'flex h-12 min-h-[3rem] shrink-0 items-center justify-between overflow-visible border-b border-gray-200/40 bg-gray-50/90 px-3 backdrop-blur-sm dark:border-white/[0.06] dark:bg-white/[0.03]'
 return [bar]
})

const sidebarLogoImgClass = computed(() => {
 const base =
 'shrink-0 object-contain transition-[height,width,max-width,transform] duration-300 ease-in-out will-change-transform'
 if (effectiveSidebarCollapsed.value) {
 return [
 base,
 'mx-auto object-center',
 'h-8 w-8 max-h-8 max-w-8 origin-center scale-110 sm:scale-125',
 ]
 }
 return [
 base,
 'object-left origin-left',
 'h-8 w-auto max-h-8 max-w-[calc(100%-0.5rem)] sm:h-9 sm:max-h-9',
 'scale-110 sm:scale-125 lg:scale-[1.32]',
 ]
})

const navigation: Array<{
 name: string
 segment: string
 href?: string
 icon: any
 iconSolid: any
 requiresSuperAdmin?: boolean
 requiresManagerOrSuperAdmin?: boolean
 subscriptionFeature?: SubscriptionFeature
}> = [
 { name: 'Dashboard', segment: '', icon: HomeIcon, iconSolid: HomeIconSolid, subscriptionFeature: 'dashboard' },
 { name: 'Inventory', segment: '/inventory', icon: CubeIcon, iconSolid: CubeIconSolid, subscriptionFeature: 'inventory' },
 { name: 'Stock loans', segment: '/seller-loans', icon: BanknotesIcon, iconSolid: BanknotesIconSolid, subscriptionFeature: 'seller_loans', requiresManagerOrSuperAdmin: true },
 { name: 'Receipts', segment: '/receipts', icon: ReceiptPercentIcon, iconSolid: ReceiptPercentIconSolid, subscriptionFeature: 'receipts' },
 { name: 'Analytics', segment: '/analytics', icon: ChartBarIcon, iconSolid: ChartBarIconSolid, subscriptionFeature: 'analytics' },
  { name: 'Activity Logs', segment: '/activity', icon: ClipboardDocumentListIcon, iconSolid: ClipboardDocumentListIconSolid, subscriptionFeature: 'activity_logs', requiresManagerOrSuperAdmin: true },
 { name: 'Multi-Store Sync', segment: '/multi-store-sync', icon: ArrowsRightLeftIcon, iconSolid: ArrowsRightLeftIconSolid, requiresSuperAdmin: true, subscriptionFeature: 'multi_store_sync' },
 { name: 'Help center', segment: '/help', icon: BookOpenIcon, iconSolid: BookOpenIconSolid },
 { name: 'Settings', segment: '/settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid, subscriptionFeature: 'settings' },
 { name: 'Profile', segment: '/profile', icon: UserCircleIcon, iconSolid: UserCircleIconSolid, subscriptionFeature: 'profile' },
]

// Filter navigation based on user role and subscription plan
const filteredNavigation = computed(() => {
 const isManager = userStore.userData?.role === 'staff' && staffStore.getCurrentStaffMember?.role === 'manager'
 const canSeeManagerOnlyFeatures = userStore.isSuperAdmin || isManager
 return navigation
 .filter(item => {
 if (item.requiresSuperAdmin && !userStore.isSuperAdmin) return false
 if (item.requiresManagerOrSuperAdmin && !canSeeManagerOnlyFeatures) return false
 if (item.subscriptionFeature && !canUseSubscriptionFeature(item.subscriptionFeature)) return false
 return true
 })
 .map(item => ({
 ...item,
 href: dashPath(item.segment),
 }))
})

const nativePrimaryNav = computed(() => splitNativeBottomNav(filteredNavigation.value).primary)
const nativeMoreNav = computed(() => splitNativeBottomNav(filteredNavigation.value).more)

const route = useRoute()
const { dashPath, isDemoDashboard, matchesDashboardPath } = useDashboardPaths()

const isActive = (href: string) => {
 const currentPath = route.path
 
 // Only consider nav items the user actually sees (same list as the sidebar).
 const hasLongerMatch = filteredNavigation.value.some(item => {
 const otherHref = item.href
 if (otherHref === href) return false
 if (otherHref.length <= href.length) return false
 return currentPath.startsWith(otherHref)
 })
 
 // If there's a longer match, this route shouldn't be active
 if (hasLongerMatch) {
 return false
 }
 
 // Exact match
 if (currentPath === href) {
 return true
 }
 
 // For routes other than dashboard home, allow matching child routes
 if (href !== dashPath('') && currentPath.startsWith(href + '/')) {
 return true
 }
 
 return false
}

const currentPage = computed(() => {
 return filteredNavigation.value.find(item => isActive(item.href)) || filteredNavigation.value[0]
})

const currentPageName = computed(() => {
 return currentPage.value?.name || 'Dashboard'
})

const currentPageIcon = computed(() => {
 return currentPage.value?.icon || HomeIcon
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
watch([() => authStore.currentUser, () => userStore.userData, () => authStore.loading], async ([user, userData, loading]) => {
 if (!user || loading) return // Wait for auth to be ready
 
 // Check if staff creation is in progress - don't update userData during this time
 const isStaffCreationInProgress = import.meta.client 
 ? sessionStorage.getItem('staff_creation_in_progress') === 'true'
 : false
 
 // During staff creation, don't fetch or update userData to preserve super admin's data
 if (isStaffCreationInProgress) {
 // console.log('[Dashboard] Staff creation in progress - skipping userData fetch to preserve super admin data')
 return
 }
 
 // Fetch user data if not loaded (only if not during staff creation)
 // IMPORTANT: Only fetch when auth is ready (not loading)
 if (!userData && user && !isStaffCreationInProgress && !loading) {
 try {
 await userStore.fetchUserData(user.uid)
 // console.log('[Dashboard] User data fetched in stores watch:', userStore.userData)
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
 // Inventory item lists are loaded on-demand (folder page, dashboard home, search), avoiding N queries on every route.
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
 // console.log('[Dashboard] Staff member found:', staffMember.storeId)
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

watch(
 () => userStore.userData?.subscription,
 async () => {
 if (userStore.userData?.role !== 'superAdmin' || !storesStore.stores.length) return
 await storesStore.applyPlanToCurrentStoreSelection()
 }
)

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

// Super-admins: only plan-eligible branches (oldest-first when over limit). Staff: full assigned list.
const storesList = computed(() => {
 const allStores =
 userStore.userData?.role === 'superAdmin' ? eligibleStores.value : storesStore.stores
 const current = currentStore.value
 if (!current || !allStores.some(s => s.id === current.id)) return allStores
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
 if (route.path.startsWith('/dashboard/departments')) return true
 return route.path.startsWith('/dashboard/stores/') && route.path.includes('/departments')
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
 if (isDemoDashboard.value) {
 const { clearDemoSession } = await import('~/utils/demo-mode')
 clearDemoSession()
 return navigateTo('/')
 }
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
 // console.log('[Dashboard] User data fetched successfully:', userStore.userData)
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
 if (isStaffCreationInProgress) {
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
 // console.log('[Dashboard] User data fetched in watch:', userStore.userData)
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

