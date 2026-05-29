<template>
 <div class="w-full max-w-none space-y-5 pb-8 sm:space-y-6">
 <Tutorial :tutorial-steps="tutorialSteps" @complete="onTutorialComplete" />

 <header
 data-tutorial="dashboard"
 class="flex flex-col gap-3 border-b border-gray-200/80 pb-4 dark:border-gray-800/80 sm:flex-row sm:items-end sm:justify-between"
 >
 <div class="min-w-0">
 <h1 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-2xl">
 Welcome back, {{ userName }}
 </h1>
 <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
 <span class="font-medium text-gray-800 dark:text-gray-200">{{ currentStoreLabel }}</span>
 <span v-if="userRoleLabel" class="text-gray-400 dark:text-gray-500"> · {{ userRoleLabel }}</span>
 <span class="text-gray-400 dark:text-gray-500"> · {{ totalOrders }} receipts</span>
 </p>
 </div>
 </header>

 <div
 v-if="needsStoreSelection && !isLoading"
 class="rounded-xl border border-amber-200/80 bg-amber-50/90 px-5 py-8 text-center dark:border-amber-900/50 dark:bg-amber-950/30 sm:px-8"
 >
 <BuildingStorefrontIcon class="mx-auto mb-3 h-8 w-8 text-amber-700 dark:text-amber-400" stroke-width="1.5" />
 <p class="text-sm font-semibold text-amber-950 dark:text-amber-100">Select a store to load your dashboard</p>
 <p class="mx-auto mt-1 max-w-md text-xs text-amber-900/80 dark:text-amber-200/80">
 Choose a branch from the store selector in the top bar. Metrics, charts, and alerts are scoped to the active store.
 </p>
 <NuxtLink
 to="/dashboard/settings"
 class="mt-4 inline-block text-xs font-medium text-amber-950 underline underline-offset-2 dark:text-amber-100"
 >
 Manage stores in Settings
 </NuxtLink>
 </div>

 <template v-else-if="isLoading">
 <!-- Period snapshot -->
 <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
 <div
 v-for="i in 4"
 :key="`snap-${i}`"
 class="h-[4.75rem] animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06]"
 />
 </div>

 <!-- Inventory health -->
 <div class="rounded-xl bg-white p-4 dark:bg-dashboard-card">
 <div class="mb-3 flex items-center justify-between">
 <div class="h-3 w-32 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
 <div class="h-3 w-20 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
 </div>
 <div class="h-2 w-full animate-pulse rounded-full bg-gray-100 dark:bg-white/[0.06]" />
 </div>

 <!-- KPI grid -->
 <div class="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
 <div
 v-for="i in 8"
 :key="`kpi-${i}`"
 class="h-[5.5rem] animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06] sm:h-[6rem]"
 />
 </div>

 <!-- Revenue chart + payment mix -->
 <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
 <div class="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06] lg:col-span-8" />
 <div class="h-72 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06] lg:col-span-4" />
 </div>

 <!-- Low stock + activity + quick links -->
 <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
 <div
 v-for="i in 3"
 :key="`panel-${i}`"
 class="h-56 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]"
 />
 </div>
 </template>

 <template v-else>
 <!-- Period snapshot (compact, no narrative block) -->
 <div
 class="grid grid-cols-2 divide-x divide-y divide-gray-200/80 overflow-hidden rounded-lg bg-white dark:divide-gray-800/80 dark:bg-dashboard-card sm:grid-cols-4 sm:divide-y-0"
 >
 <div class="px-3 py-2.5 sm:px-4 sm:py-3">
 <p class="text-[11px] text-gray-500 dark:text-gray-400">Today</p>
 <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
 {{ todayReceiptsCount }} orders
 </p>
 <p class="text-[11px] tabular-nums text-gray-600 dark:text-gray-400">{{ formatCurrency(todaySales) }}</p>
 </div>
 <div class="px-3 py-2.5 sm:px-4 sm:py-3">
 <p class="text-[11px] text-gray-500 dark:text-gray-400">This month</p>
 <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
 {{ formatCurrency(monthSales) }}
 </p>
 <p class="text-[11px] text-gray-600 dark:text-gray-400">{{ completedReceiptsCount }} completed</p>
 </div>
 <div class="px-3 py-2.5 sm:px-4 sm:py-3">
 <p class="text-[11px] text-gray-500 dark:text-gray-400">Last 7 days</p>
 <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
 {{ salesLast7Days }} sales
 </p>
 <p class="text-[11px] tabular-nums text-gray-600 dark:text-gray-400">{{ formatCurrency(revenueLast7Days) }}</p>
 </div>
 <div class="px-3 py-2.5 sm:px-4 sm:py-3">
 <p class="text-[11px] text-gray-500 dark:text-gray-400">Inventory</p>
 <p class="mt-0.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">
 {{ sellThroughRate }}% sold
 </p>
 <p class="text-[11px] text-gray-600 dark:text-gray-400">
 {{ outstandingCount > 0 ? `${outstandingCount} balance open` : 'No open balances' }}
 </p>
 </div>
 </div>

 <!-- Inventory health (top) -->
 <section :class="panelClass">
 <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
 <div>
 <p class="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
 Inventory health
 </p>
 <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
 {{ inStockCount }} available units · {{ outOfStockCount }} sold · {{ lowStockItems.length }} low-stock lines
 </p>
 </div>
 <NuxtLink
 to="/dashboard/inventory"
 class="text-xs font-medium text-primary-700 underline underline-offset-2 dark:text-primary-400"
 >
 Open inventory
 </NuxtLink>
 </div>
 <div class="flex h-2 gap-px overflow-hidden rounded-full bg-gray-200/90 dark:bg-white/[0.08]">
 <div class="bg-emerald-500 transition-all" :style="{ width: `${inStockPercentage}%` }" title="Available" />
 <div class="bg-amber-500 transition-all" :style="{ width: `${lowStockPercentage}%` }" title="Low stock" />
 <div class="bg-slate-400 transition-all dark:bg-slate-500" :style="{ width: `${soldPercentage}%` }" title="Sold" />
 </div>
 <div class="mt-2 flex flex-wrap justify-between gap-2 text-[10px] text-gray-500 dark:text-gray-400 sm:text-[11px]">
 <span>{{ inStockPercentage }}% available</span>
 <span>{{ soldPercentage }}% sold through</span>
 <span>{{ formatCurrency(inventoryTotalValue) }} on hand (book)</span>
 </div>
 </section>

 <!-- Attention (inline, not stacked alert cards) -->
 <ul v-if="attentionItems.length > 0" class="flex flex-col gap-2">
 <li
 v-for="alert in attentionItemsTop"
 :key="alert.id"
 class="flex flex-wrap items-center justify-between gap-2 rounded-lg border-0 px-3 py-2 text-xs"
 :class="alertRowClass(alert.level)"
 >
 <span class="text-gray-800 dark:text-gray-200">
 <span class="font-medium text-gray-900 dark:text-gray-50">{{ alert.title }}.</span>
 {{ alert.description }}
 </span>
 <NuxtLink
 :to="alert.href"
 class="shrink-0 font-medium text-gray-900 underline underline-offset-2 dark:text-gray-100"
 >
 {{ alert.cta }}
 </NuxtLink>
 </li>
 </ul>

 <!-- KPI grid -->
 <div class="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
 <StatCard
 label="Total revenue"
 :value="formatCurrency(totalRevenue)"
 :subtext="revenueChangeText"
 :change="revenueChangePercent"
 :change-positive="revenueChangePositive"
 :sparkline-data="statCardRevenueSparkline.length > 1 ? statCardRevenueSparkline : undefined"
 />
 <StatCard
 label="Avg. order value"
 :value="formatCurrency(averageOrderValue)"
 :subtext="`${completedReceiptsCount} completed orders`"
 />
 <StatCard
 label="Customers"
 :value="totalCustomers.toString()"
 :subtext="`${newCustomersToday} active today`"
 :subtext-class="newCustomersToday > 0 ? 'text-emerald-600 dark:text-emerald-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'"
 />
 <StatCard
 label="Orders today"
 :value="todayReceiptsCount.toString()"
 :subtext="`${formatCurrency(todaySales)} revenue`"
 />
 <StatCard
 label="Inventory units"
 :value="totalInventoryItems.toString()"
 :subtext="`${inStockCount} available · ${outOfStockCount} sold`"
 />
 <StatCard
 label="Low stock signals"
 :value="lowStockItems.length.toString()"
 :subtext="lowStockItems.length > 0 ? 'Review restocking' : 'Within thresholds'"
 :subtext-class="lowStockItems.length > 0 ? 'text-amber-600 dark:text-amber-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'"
 />
 <StatCard
 label="Outstanding"
 :value="formatCurrency(outstandingBalanceTotal)"
 :subtext="`${outstandingCount} open balance${outstandingCount === 1 ? '' : 's'}`"
 :subtext-class="outstandingCount > 0 ? 'text-amber-600 dark:text-amber-400 text-xs font-medium' : 'text-gray-500 dark:text-gray-400 text-xs'"
 />
 <StatCard
 label="Book value"
 :value="formatCurrency(inventoryTotalValue)"
 :subtext="`${totalFolders} folders · ${serialFolderCount} serial`"
 />
 </div>

 <!-- Chart + payment mix -->
 <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
 <Card
 padding="sm"
 extra-class="!p-0 overflow-hidden lg:col-span-8 rounded-xl bg-white dark:!bg-dashboard-card"
 >
 <div
 class="flex flex-col gap-2 border-b border-gray-100/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]"
 >
 <div>
 <h2 class="text-xs font-semibold tracking-tight text-gray-900 dark:text-gray-50 sm:text-sm">
 Revenue performance
 </h2>
 <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{{ chartSubtitle }}</p>
 </div>
 <div
 class="inline-flex w-fit shrink-0 rounded-lg bg-gray-50/50 p-0.5 dark:bg-white/[0.03]"
 role="group"
 aria-label="Chart period"
 >
 <button
 v-for="opt in chartPeriodOptions"
 :key="opt.value"
 type="button"
 class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
 :class="
 chartView === opt.value
 ? 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white'
 : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
 "
 @click="chartView = opt.value"
 >
 {{ opt.label }}
 </button>
 </div>
 </div>
 <div class="relative h-[11rem] px-2 pb-3 pt-1 sm:h-[14rem] sm:px-3 lg:h-[15rem]">
 <div v-if="chartData.length === 0" class="flex h-full flex-col items-center justify-center text-center">
 <ChartBarIcon class="mb-2 h-8 w-8 text-gray-400" stroke-width="1.5" />
 <p class="text-sm font-medium text-gray-700 dark:text-gray-300">No revenue data yet</p>
 <p class="text-xs text-gray-500 dark:text-gray-400">Completed receipts will populate this chart</p>
 </div>
 <ClientOnly v-else>
 <apexchart type="area" :height="chartHeight" :options="chartOptions" :series="chartSeries" />
 <template #fallback>
 <div class="flex h-full items-center justify-center text-xs text-gray-400">Loading chart…</div>
 </template>
 </ClientOnly>
 </div>
 </Card>

 <div :class="[panelClass, 'lg:col-span-4 flex flex-col']">
 <p class="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
 Payment methods
 </p>
 <p class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Share of completed receipts by tender type</p>
 <div v-if="paymentMethodBreakdown.length === 0" class="mt-4 text-xs text-gray-500 dark:text-gray-400">
 No completed sales to analyze yet.
 </div>
 <ul v-else class="mt-4 space-y-3">
 <li v-for="slice in paymentMethodsTop" :key="slice.method">
 <div class="mb-1 flex items-baseline justify-between gap-2 text-xs">
 <span class="font-medium text-gray-800 dark:text-gray-200">{{ slice.label }}</span>
 <span class="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
 {{ slice.share }}% · {{ formatCurrency(slice.revenue) }}
 </span>
 </div>
 <div class="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
 <div
 class="h-full rounded-full bg-primary-500/70 transition-all dark:bg-primary-400/60"
 :style="{ width: `${Math.max(slice.share, 2)}%` }"
 />
 </div>
 <p class="mt-0.5 text-[10px] text-gray-500 dark:text-gray-500">{{ slice.count }} receipt{{ slice.count === 1 ? '' : 's' }}</p>
 </li>
 </ul>
 </div>
 </div>

 <!-- Sales + operations detail -->
 <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
 <section :class="panelClass">
 <p class="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
 Sales breakdown
 </p>
 <dl class="grid grid-cols-2 gap-x-4 gap-y-2.5">
 <div v-for="row in salesMetricsTop" :key="row.label" class="flex items-baseline justify-between gap-2 border-b border-gray-100/80 pb-2 dark:border-white/[0.05]">
 <dt class="text-xs text-gray-600 dark:text-gray-400">{{ row.label }}</dt>
 <dd class="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{{ row.value }}</dd>
 </div>
 </dl>
 </section>

 <section :class="panelClass">
 <p class="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
 Store operations
 </p>
 <dl class="grid grid-cols-2 gap-x-4 gap-y-2.5">
 <div v-for="row in operationsMetricsTop" :key="row.label" class="flex items-baseline justify-between gap-2 border-b border-gray-100/80 pb-2 dark:border-white/[0.05]">
 <dt class="text-xs text-gray-600 dark:text-gray-400">{{ row.label }}</dt>
 <dd class="text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{{ row.value }}</dd>
 </div>
 </dl>
 </section>
 </div>

 <!-- Recent + top products -->
 <div class="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
 <section :class="panelClass">
 <div class="mb-2.5 flex items-center justify-between gap-2 border-b border-gray-100/90 pb-2.5 dark:border-gray-800/80">
 <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Recent receipts</h2>
 <NuxtLink
 to="/dashboard/receipts"
 class="text-[11px] font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
 >
 View all
 </NuxtLink>
 </div>
 <div v-if="recentReceipts.length === 0" class="py-2 text-xs text-gray-500 dark:text-gray-400">
 No receipts yet.
 </div>
 <ul v-else class="mt-1 space-y-0">
 <li
 v-for="tx in recentReceiptsTop"
 :key="tx.id"
 class="flex items-center justify-between gap-3 border-b border-gray-100/90 py-2.5 last:border-0 dark:border-gray-800/70"
 >
 <div class="min-w-0">
 <p class="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{{ tx.customerName }}</p>
 <p class="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0 text-[11px] text-gray-500 dark:text-gray-500">
 <span class="font-medium text-gray-600 dark:text-gray-400">#{{ tx.receiptNumber }}</span>
 <span class="text-gray-400 dark:text-gray-600" aria-hidden="true">·</span>
 <span>{{ tx.paymentMethod }}</span>
 <span class="hidden text-gray-400 sm:inline dark:text-gray-600" aria-hidden="true">·</span>
 <span class="hidden sm:inline">{{ tx.statusLabel }}</span>
 <span class="text-gray-400 dark:text-gray-600" aria-hidden="true">·</span>
 <span class="shrink-0">{{ tx.time }}</span>
 </p>
 </div>
 <p class="shrink-0 text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">{{ tx.amount }}</p>
 </li>
 </ul>
 </section>

 <section :class="panelClass">
 <div class="mb-2.5 flex items-center justify-between gap-2 border-b border-gray-100/90 pb-2.5 dark:border-gray-800/80">
 <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Top products</h2>
 <NuxtLink
 to="/dashboard/analytics"
 class="text-[11px] font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
 >
 Analytics
 </NuxtLink>
 </div>
 <div v-if="topSellingItems.length === 0" class="py-2 text-xs text-gray-500 dark:text-gray-400">
 No product sales yet.
 </div>
 <ul v-else class="mt-1 space-y-0">
 <li
 v-for="item in topProductsTop"
 :key="item.id"
 class="flex items-center justify-between gap-3 border-b border-gray-100/90 py-2.5 last:border-0 dark:border-gray-800/70"
 >
 <div class="min-w-0">
 <p class="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{{ item.name }}</p>
 <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-500">{{ item.sales }} sold</p>
 </div>
 <p class="shrink-0 text-xs font-semibold tabular-nums text-gray-900 dark:text-gray-100">
 {{ formatCurrency(item.revenue) }}
 </p>
 </li>
 </ul>
 </section>
 </div>

 <!-- Low stock + activity + quick links -->
 <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3 lg:items-start">
 <section :class="[panelClass, 'lg:col-span-1']">
 <div class="mb-2.5 flex items-center justify-between gap-2 border-b border-gray-100/90 pb-2.5 dark:border-gray-800/80">
 <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Low stock</h2>
 <div class="flex items-center gap-2">
 <button
 v-if="lowStockItems.length > 0"
 type="button"
 class="text-[11px] font-medium text-primary-700 hover:text-primary-800 disabled:opacity-50 dark:text-primary-300"
 :disabled="reorderExporting"
 @click="handleExportReorderList"
 >
 {{ reorderExporting ? 'Exporting…' : 'Export reorder list' }}
 </button>
 <NuxtLink
 to="/dashboard/inventory"
 class="text-[11px] font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
 >
 Inventory
 </NuxtLink>
 </div>
 </div>
 <div v-if="lowStockItems.length === 0" class="py-2 text-xs text-gray-500 dark:text-gray-400">
 All lines above threshold.
 </div>
 <ul v-else class="mt-1 space-y-0">
 <li
 v-for="item in lowStockItemsTop"
 :key="item.id"
 class="flex items-baseline justify-between gap-2 border-b border-gray-100/90 py-2 last:border-0 dark:border-gray-800/70"
 >
 <p class="min-w-0 truncate text-xs text-gray-800 dark:text-gray-200">{{ item.name }}</p>
 <span class="shrink-0 text-xs font-medium tabular-nums text-amber-800 dark:text-amber-300">
 {{ item.quantity }}<span v-if="!item.isSerialNumber"> / {{ item.threshold }}</span>
 </span>
 </li>
 </ul>
 </section>

 <section v-if="canViewActivity" :class="[panelClass, 'lg:col-span-1']">
 <div class="mb-2.5 flex items-center justify-between border-b border-gray-100/90 pb-2.5 dark:border-gray-800/80">
 <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Recent activity</h2>
 <NuxtLink
 to="/dashboard/activity"
 class="text-[11px] font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
 >
 All logs
 </NuxtLink>
 </div>
 <div v-if="recentActivityLogs.length === 0" class="py-2 text-xs text-gray-500 dark:text-gray-400">
 No activity logged yet.
 </div>
 <ul v-else class="mt-1 space-y-0">
 <li
 v-for="log in recentActivityLogsTop"
 :key="log.id"
 class="flex gap-2 border-b border-gray-100/90 py-2 last:border-0 dark:border-gray-800/70"
 >
 <span
 class="self-start"
 :class="activityActionBadgeClass(log.action)"
 >
 {{ activityActionLabel(log.action) }}
 </span>
 <div class="min-w-0 flex-1">
 <p class="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
 {{ activityLogPreviewTitle(log) }}
 </p>
 <p class="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-500">
 {{ activityEntityTypeLabel(log.entityType) }}
 <span class="hidden sm:inline"> · {{ log.userDisplayName }}</span>
 · {{ formatActivityTime(log.createdAt) }}
 </p>
 </div>
 </li>
 </ul>
 </section>

 <section :class="[panelClass, canViewActivity ? 'lg:col-span-1' : 'lg:col-span-2']">
 <div class="mb-2.5 border-b border-gray-100/90 pb-2.5 dark:border-gray-800/80">
 <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">Shortcuts</h2>
 </div>
 <ul class="mt-1 space-y-0">
 <li v-for="link in quickLinksTop" :key="link.href" class="border-b border-gray-100/90 last:border-0 dark:border-gray-800/70">
 <NuxtLink
 :to="link.href"
 class="flex items-center justify-between gap-2 py-2.5 text-xs transition-colors hover:text-gray-900 dark:hover:text-gray-100"
 >
 <span class="font-medium text-gray-800 dark:text-gray-200">{{ link.label }}</span>
 <span class="text-gray-400 dark:text-gray-500">→</span>
 </NuxtLink>
 </li>
 </ul>
 </section>
 </div>
 </template>
 </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
 BuildingStorefrontIcon,
 ChartBarIcon,
 CubeIcon,
 Cog6ToothIcon,
 HomeIcon,
 ReceiptPercentIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import StatCard from '~/components/ui/StatCard.vue'
import Tutorial from '~/components/Tutorial.vue'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useStoresStore } from '~/stores/stores'
import { useStaffStore } from '~/stores/staff'
import { useThemeStore } from '~/stores/theme'
import { usePreferences } from '~/composables/usePreferences'
import { useDashboardInsights, type DashboardAlertLevel } from '~/composables/useDashboardInsights'
import { useAppToast } from '~/composables/useAppToast'
import { useReorderListExport } from '~/composables/useReorderListExport'
import {
 activityActionBadgeClass,
 activityActionLabel,
 activityEntityTypeLabel,
 activityLogPreviewTitle,
 fetchActivityLogs,
 type ActivityLog,
} from '~/composables/useActivityLog'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import type { InventoryItem } from '~/stores/inventory'

definePageMeta({
 layout: 'dashboard',
 middleware: 'auth',
})

const { dashboardCardPaddedClass: panelClass } = useDashboardPageChrome()

/** Max rows shown in dashboard list cards (no in-card scrolling). */
const DASHBOARD_LIST_TOP = 5

const tutorialSteps = [
 {
 title: 'Welcome to Your Dashboard',
 description:
 'Your command center summarizes revenue, inventory health, outstanding balances, and recent receipts for the active store.',
 icon: HomeIcon,
 targetSelector: '[data-tutorial="dashboard"]',
 },
 {
 title: 'Manage Your Inventory',
 description:
 'Inventory folders track serial or quantity-based stock. Low-stock signals and sell-through rates appear here automatically.',
 icon: CubeIcon,
 targetSelector: '[data-tutorial="inventory"]',
 },
 {
 title: 'Create and Track Receipts',
 description:
 'Receipts drive revenue charts, customer counts, and payment-method breakdowns. Balance-due sales surface under Needs attention.',
 icon: ReceiptPercentIcon,
 targetSelector: '[data-tutorial="receipts"]',
 },
 {
 title: 'View Analytics & Reports',
 description:
 'Open Analytics for deeper period comparisons, exports, and product-level charts beyond this overview.',
 icon: ChartBarIcon,
 targetSelector: '[data-tutorial="analytics"]',
 },
 {
 title: 'Configure Your Settings',
 description:
 'Settings is where you manage stores, departments, staff roles, and inventory thresholds that shape dashboard alerts.',
 icon: Cog6ToothIcon,
 targetSelector: '[data-tutorial="settings"]',
 },
]

const receiptsStore = useReceiptsStore()
const inventoryStore = useInventoryStore()
const departmentsStore = useDepartmentsStore()
const authStore = useAuthStore()
const userStore = useUserStore()
const storesStore = useStoresStore()
const staffStore = useStaffStore()
const themeStore = useThemeStore()

const { preferences } = usePreferences()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

const currencySymbol = computed(() => preferences.value.currencySymbol || '$')
const dashboardFolderItems = ref<Record<string, InventoryItem[]>>({})

const toast = useAppToast()
const { exporting: reorderExporting, exportReorderListExcel } = useReorderListExport()

async function handleExportReorderList() {
 try {
 const { count } = await exportReorderListExcel()
 toast.success(`Reorder list exported (${count} ${count === 1 ? 'line' : 'lines'})`)
 } catch (error: unknown) {
 const message = error instanceof Error ? error.message : 'Export failed'
 toast.error(message)
 }
}

const insights = useDashboardInsights(dashboardFolderItems)
const {
 formatCurrency,
 totalRevenue,
 todaySales,
 monthSales,
 totalOrders,
 averageOrderValue,
 todayReceiptsCount,
 completedReceiptsCount,
 outstandingCount,
 outstandingBalanceTotal,
 totalCustomers,
 newCustomersToday,
 totalInventoryItems,
 totalFolders,
 inventoryTotalValue,
 serialFolderCount,
 inStockCount,
 outOfStockCount,
 sellThroughRate,
 inStockPercentage,
 soldPercentage,
 lowStockPercentage,
 dailyRevenueData,
 weeklyRevenueData,
 monthlyRevenueData,
 revenueChangePercent,
 revenueChangePositive,
 statCardRevenueSparkline,
 revenueChangeText,
 topSellingItems,
 lowStockItems,
 paymentMethodBreakdown,
 recentReceipts,
 attentionItems,
 quickLinks,
 operationsMetrics,
 salesMetrics,
 salesLast7Days,
 revenueLast7Days,
} = insights

function topN<T>(items: T[], limit = DASHBOARD_LIST_TOP): T[] {
 return items.slice(0, limit)
}

const attentionItemsTop = computed(() => topN(attentionItems.value))
const paymentMethodsTop = computed(() => topN(paymentMethodBreakdown.value))
const salesMetricsTop = computed(() => topN(salesMetrics.value))
const operationsMetricsTop = computed(() => topN(operationsMetrics.value))
const recentReceiptsTop = computed(() => topN(recentReceipts.value))
const topProductsTop = computed(() => topN(topSellingItems.value))
const lowStockItemsTop = computed(() => topN(lowStockItems.value))
const recentActivityLogsTop = computed(() => topN(recentActivityLogs.value))
const quickLinksTop = computed(() => topN(quickLinks.value))

const isLoading = ref(true)
const chartView = ref<'daily' | 'weekly' | 'monthly'>('monthly')
const recentActivityLogs = ref<ActivityLog[]>([])

const chartPeriodOptions = [
 { value: 'daily' as const, label: 'Daily' },
 { value: 'weekly' as const, label: 'Weekly' },
 { value: 'monthly' as const, label: 'Monthly' },
]

const isManager = computed(
 () => userStore.userData?.role === 'staff' && staffStore.getCurrentStaffMember?.role === 'manager'
)
const canViewActivity = computed(
 () => (userStore.isSuperAdmin || isManager.value) && canUseSubscriptionFeature('activity_logs')
)

const needsStoreSelection = computed(() => !storesStore.currentStoreId)

const currentStoreLabel = computed(() => {
 const store = storesStore.currentStore
 if (!store) return 'No store selected'
 return store.name || 'Active store'
})

const userRoleLabel = computed(() => {
 const role = userStore.userData?.role
 if (role === 'superAdmin') return 'Super admin'
 if (role === 'admin') return 'Admin'
 if (role === 'staff') return isManager.value ? 'Manager' : 'Staff'
 if (role === 'user') return 'User'
 return ''
})

const userName = computed(() => {
 if (import.meta.server) return 'User'
 if (userStore.userData?.name) return userStore.userData.name.split(' ')[0] || 'User'
 if (authStore.currentUser?.displayName) return authStore.currentUser.displayName.split(' ')[0] || 'User'
 if (authStore.currentUser?.email) return authStore.currentUser.email.split('@')[0]
 return 'User'
})

const chartData = computed(() => {
 switch (chartView.value) {
 case 'weekly':
 return weeklyRevenueData.value
 case 'monthly':
 return monthlyRevenueData.value
 default:
 return dailyRevenueData.value
 }
})

const chartSubtitle = computed(() => {
 switch (chartView.value) {
 case 'weekly':
 return 'Last 12 weeks · completed sales only'
 case 'monthly':
 return 'Last 12 months · completed sales only'
 default:
 return 'Last 30 days · completed sales only'
 }
})

const chartSeries = computed(() => {
 if (chartData.value.length === 0) return []
 const seriesName =
 chartView.value === 'weekly'
 ? 'Weekly revenue'
 : chartView.value === 'monthly'
 ? 'Monthly revenue'
 : 'Daily revenue'
 const dataToUse = chartView.value === 'monthly' ? chartData.value.slice(-12) : chartData.value
 return [
 {
 name: seriesName,
 data: dataToUse.map((item) => item.revenue),
 },
 ]
})

const isMobile = ref(false)
if (import.meta.client) {
 isMobile.value = window.innerWidth < 640
 window.addEventListener('resize', () => {
 isMobile.value = window.innerWidth < 640
 })
}
const chartHeight = computed(() => (isMobile.value ? 176 : 220))

const chartOptions = computed(() => {
 const isDark = themeStore.actualTheme === 'dark'
 const lineColor = isDark ? '#93C5FD' : '#4876c7'
 const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)'
 const labelColor = isDark ? '#A1A1AA' : '#64748B'

 return {
 chart: {
 type: 'area',
 height: chartHeight.value,
 toolbar: { show: false },
 zoom: { enabled: false },
 fontFamily: 'inherit',
 background: 'transparent',
 animations: { enabled: true, easing: 'easeinout', speed: 600 },
 },
 dataLabels: { enabled: false },
 stroke: { curve: 'smooth', width: 2, colors: [lineColor] },
 fill: {
 type: 'gradient',
 gradient: {
 shadeIntensity: 0,
 opacityFrom: 0.2,
 opacityTo: 0,
 stops: [0, 100],
 colorStops: [
 { offset: 0, color: lineColor, opacity: 0.22 },
 { offset: 100, color: lineColor, opacity: 0 },
 ],
 },
 },
 xaxis: {
 categories: (() => {
 const data = chartView.value === 'monthly' ? chartData.value.slice(-12) : chartData.value
 return data.map((item, index) => {
 if (chartView.value === 'weekly') return `W${index + 1}`
 if (chartView.value === 'monthly') return item.date.toLocaleDateString('en-US', { month: 'short' })
 return item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
 })
 })(),
 labels: {
 style: { colors: labelColor, fontSize: '11px', fontWeight: 400 },
 rotate: chartView.value === 'monthly' ? 0 : -45,
 rotateAlways: false,
 offsetY: 4,
 },
 axisBorder: { show: false },
 axisTicks: { show: false },
 },
 yaxis: {
 labels: {
 style: { colors: labelColor, fontSize: '11px', fontWeight: 400 },
 formatter: (value: number) => {
 const symbol = currencySymbol.value || '$'
 if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}k`
 return `${symbol}${Math.round(value)}`
 },
 },
 axisBorder: { show: false },
 axisTicks: { show: false },
 },
 grid: {
 borderColor: 'transparent',
 xaxis: { lines: { show: false } },
 yaxis: { lines: { show: true, color: gridColor } },
 padding: { top: 8, right: 4, bottom: 36, left: 4 },
 },
 tooltip: {
 theme: isDark ? 'dark' : 'light',
 y: { formatter: (value: number) => formatCurrency(value) },
 },
 theme: { mode: isDark ? 'dark' : 'light' },
 colors: [lineColor],
 legend: { show: false },
 markers: { size: 0, hover: { size: 4 } },
 }
})

function alertRowClass(level: DashboardAlertLevel): string {
 switch (level) {
 case 'critical':
 return 'border-red-200/70 bg-red-50/40 dark:border-red-900/35 dark:bg-red-950/20'
 case 'warning':
 return 'border-amber-200/70 bg-amber-50/40 dark:border-amber-900/35 dark:bg-amber-950/20'
 default:
 return 'border-gray-200/80 bg-gray-50/60 dark:border-gray-800/80 dark:bg-white/[0.02]'
 }
}

function formatActivityTime(createdAt: ActivityLog['createdAt']): string {
 const d =
 createdAt instanceof Date
 ? createdAt
 : typeof createdAt === 'object' && createdAt && 'toDate' in createdAt
 ? (createdAt as { toDate: () => Date }).toDate()
 : new Date()
 const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
 if (seconds < 60) return 'just now'
 const minutes = Math.floor(seconds / 60)
 if (minutes < 60) return `${minutes}m ago`
 const hours = Math.floor(minutes / 60)
 if (hours < 24) return `${hours}h ago`
 return d.toLocaleDateString()
}

const onTutorialComplete = () => {}

const loadDashboardData = async () => {
 try {
 if (authStore.loading) {
 let attempts = 0
 while (authStore.loading && attempts < 100) {
 await new Promise((resolve) => setTimeout(resolve, 100))
 attempts++
 }
 }

 if (!authStore.currentUser) return

 if (!userStore.userData || userStore.userData.uid !== authStore.currentUser.uid) {
 await userStore.fetchUserData(authStore.currentUser.uid)
 }

 await Promise.all([
 receiptsStore.fetchReceipts(),
 inventoryStore.fetchFolders(),
 departmentsStore.fetchDepartments(),
 ])

 if (inventoryStore.folders.length > 0) {
 const map: Record<string, InventoryItem[]> = {}
 await Promise.all(
 inventoryStore.folders.map(async (folder) => {
 map[folder.id] = await inventoryStore.fetchItemsAllChunked(folder.id)
 })
 )
 dashboardFolderItems.value = map
 } else {
 dashboardFolderItems.value = {}
 }

 if (canViewActivity.value) {
 recentActivityLogs.value = await fetchActivityLogs(DASHBOARD_LIST_TOP)
 } else {
 recentActivityLogs.value = []
 }

 } catch (error) {
 console.error('Error loading dashboard data:', error)
 }
}

onMounted(async () => {
 isLoading.value = true
 await loadDashboardData()
 isLoading.value = false
})

watch(
 () => storesStore.currentStoreId,
 async (id, prev) => {
 if (id && id !== prev && authStore.currentUser) {
 isLoading.value = true
 await loadDashboardData()
 isLoading.value = false
 }
 }
)

watch(
 () => authStore.currentUser,
 async (newUser) => {
 if (newUser && !isLoading.value) {
 await loadDashboardData()
 }
 }
)

useHead({
 title: 'Dashboard - Storvv',
})
</script>
