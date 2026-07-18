<template>
  <div class="ldg w-full max-w-none space-y-6 pb-10 sm:space-y-7">
    <Tutorial :tutorial-steps="tutorialSteps" @complete="onTutorialComplete" />

    <header data-tutorial="dashboard" class="ldg-tear flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <p class="ldg-eyebrow">Store ledger</p>
        <h1 class="ldg-display mt-1 text-xl text-[#1C1B19] dark:text-[#F2EFE9] sm:text-[1.7rem]">
          Welcome back, {{ userName }}
        </h1>
        <p class="mt-1.5 text-sm text-[#706A5C] dark:text-[#A39C8E]">
          <span class="font-medium text-[#1C1B19] dark:text-[#F2EFE9]">{{ currentStoreLabel }}</span>
          <span v-if="userRoleLabel" class="text-[#B7AF9E] dark:text-[#5C574C]"> · </span>
          <span v-if="userRoleLabel">{{ userRoleLabel }}</span>
          <span class="text-[#B7AF9E] dark:text-[#5C574C]"> · </span>
          <span class="ldg-num">{{ totalOrders }} receipts</span>
        </p>
      </div>
    </header>

    <div
      v-if="needsStoreSelection && !isLoading"
      class="rounded-lg border border-dashed border-[#C99A4A]/50 bg-[#C99A4A]/[0.06] px-5 py-8 text-center dark:border-[#E0AD5F]/40 dark:bg-[#E0AD5F]/[0.05] sm:px-8"
    >
      <BuildingStorefrontIcon class="mx-auto mb-3 h-8 w-8 text-[#A9762E] dark:text-[#E0AD5F]" stroke-width="1.5" />
      <p class="ldg-display text-sm text-[#1C1B19] dark:text-[#F2EFE9]">Select a store to load your dashboard</p>
      <p class="mx-auto mt-1 max-w-md text-xs text-[#8A8172] dark:text-[#A39C8E]">
        Choose a branch from the store selector in the top bar. Metrics, charts, and alerts are scoped to the active
        store.
      </p>
      <NuxtLink
        to="/dashboard/settings"
        class="mt-4 inline-block text-xs font-medium text-[#A9762E] underline underline-offset-2 dark:text-[#E0AD5F]"
      >
        Manage stores in Settings
      </NuxtLink>
    </div>

    <template v-else-if="isLoading">
      <div class="ldg-card p-4">
        <div class="mb-3 flex items-center justify-between">
          <div class="h-3 w-32 animate-pulse rounded bg-[#1C1B19]/[0.06] dark:bg-white/[0.06]" />
          <div class="h-3 w-20 animate-pulse rounded bg-[#1C1B19]/[0.06] dark:bg-white/[0.06]" />
        </div>
        <div class="h-2 w-full animate-pulse rounded-full bg-[#1C1B19]/[0.06] dark:bg-white/[0.06]" />
      </div>

      <div class="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
        <div
          v-for="i in 5"
          :key="`kpi-${i}`"
          class="h-[5.5rem] animate-pulse rounded-lg bg-[#1C1B19]/[0.06] dark:bg-white/[0.06] sm:h-[6rem]"
        />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <div class="h-72 animate-pulse rounded-lg bg-[#1C1B19]/[0.06] dark:bg-white/[0.06] lg:col-span-8" />
        <div class="h-72 animate-pulse rounded-lg bg-[#1C1B19]/[0.06] dark:bg-white/[0.06] lg:col-span-4" />
      </div>

      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <div
          v-for="i in 3"
          :key="`panel-${i}`"
          class="h-56 animate-pulse rounded-lg bg-[#1C1B19]/[0.06] dark:bg-white/[0.06]"
        />
      </div>
    </template>

    <template v-else>
      <!-- Inventory health -->
      <section class="ldg-card p-4">
        <div class="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p class="ldg-eyebrow">Inventory health</p>
            <p class="mt-1 text-[11px] text-[#8A8172] dark:text-[#A39C8E]">
              <span class="ldg-num">{{ inStockCount }}</span> available units ·
              <span class="ldg-num">{{ outOfStockCount }}</span> sold ·
              <span class="ldg-num">{{ lowStockItems.length }}</span> low-stock lines
            </p>
          </div>
          <NuxtLink
            to="/dashboard/inventory"
            class="text-xs font-medium text-[#A9762E] underline underline-offset-2 dark:text-[#E0AD5F]"
          >
            Open inventory
          </NuxtLink>
        </div>
        <div class="flex h-1.5 gap-px overflow-hidden rounded-full bg-[#1C1B19]/[0.07] dark:bg-white/[0.08]">
          <div class="bg-[#3F8F7C] transition-all dark:bg-[#5FC2A8]" :style="{ width: `${inStockPercentage}%` }" title="Available" />
          <div class="bg-[#B9791C] transition-all dark:bg-[#E3A94C]" :style="{ width: `${lowStockPercentage}%` }" title="Low stock" />
          <div class="bg-[#B7AF9E] transition-all dark:bg-[#5C574C]" :style="{ width: `${soldPercentage}%` }" title="Sold" />
        </div>
        <div class="mt-2 flex flex-wrap justify-between gap-2 text-[10px] text-[#8A8172] dark:text-[#A39C8E] sm:text-[11px]">
          <span class="ldg-num">{{ inStockPercentage }}% available</span>
          <span class="ldg-num">{{ soldPercentage }}% sold through</span>
          <span class="ldg-num">{{ formatCurrency(inventoryTotalValue) }} on hand (book)</span>
        </div>
      </section>

      <!-- Attention -->
      <ul v-if="attentionItems.length > 0" class="flex flex-col gap-2">
        <li
          v-for="alert in attentionItemsTop"
          :key="alert.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-md px-3 py-2 text-xs"
          :class="alertRowClass(alert.level)"
        >
          <span class="text-[#4A453B] dark:text-[#C9C3B6]">
            <span class="font-medium text-[#1C1B19] dark:text-[#F2EFE9]">{{ alert.title }}.</span>
            {{ alert.description }}
          </span>
          <NuxtLink :to="alert.href" class="shrink-0 font-medium text-[#1C1B19] underline underline-offset-2 dark:text-[#F2EFE9]">
            {{ alert.cta }}
          </NuxtLink>
        </li>
      </ul>

      <!-- KPI grid -->
      <div class="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5">
        <StatCard
          label="Total revenue"
          :value="formatCurrency(totalRevenue)"
          :subtext="revenueChangeText"
          :change="revenueChangePercent"
          :change-positive="revenueChangePositive"
          :sparkline-data="statCardRevenueSparkline.length > 1 ? statCardRevenueSparkline : undefined"
        />
        <StatCard label="Orders today" :value="todayReceiptsCount.toString()" :subtext="`${formatCurrency(todaySales)} revenue`" />
        <StatCard
          label="Customers"
          :value="totalCustomers.toString()"
          :subtext="`${newCustomersToday} active today`"
          :subtext-class="
            newCustomersToday > 0
              ? 'text-[#3F8F7C] dark:text-[#5FC2A8] text-xs font-medium'
              : 'text-[#8A8172] dark:text-[#A39C8E] text-xs'
          "
        />
        <StatCard
          label="Low stock signals"
          :value="lowStockItems.length.toString()"
          :subtext="lowStockItems.length > 0 ? 'Review restocking' : 'Within thresholds'"
          :subtext-class="
            lowStockItems.length > 0
              ? 'text-[#B9791C] dark:text-[#E3A94C] text-xs font-medium'
              : 'text-[#8A8172] dark:text-[#A39C8E] text-xs'
          "
        />
        <StatCard
          label="Outstanding"
          :value="formatCurrency(outstandingBalanceTotal)"
          :subtext="`${outstandingCount} open balance${outstandingCount === 1 ? '' : 's'}`"
          :subtext-class="
            outstandingCount > 0
              ? 'text-[#B9791C] dark:text-[#E3A94C] text-xs font-medium'
              : 'text-[#8A8172] dark:text-[#A39C8E] text-xs'
          "
        />
      </div>

      <!-- Chart + payment mix -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <Card padding="sm" extra-class="!p-0 overflow-hidden lg:col-span-8 ldg-card">
          <div class="ldg-tear flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="ldg-display text-xs text-[#1C1B19] dark:text-[#F2EFE9] sm:text-sm">Revenue performance</h2>
              <p class="mt-0.5 text-[11px] text-[#8A8172] dark:text-[#A39C8E]">{{ chartSubtitle }}</p>
            </div>
            <div class="inline-flex w-fit shrink-0 rounded-md bg-[#1C1B19]/[0.04] p-0.5 dark:bg-white/[0.04]" role="group" aria-label="Chart period">
              <button
                v-for="opt in chartPeriodOptions"
                :key="opt.value"
                type="button"
                class="rounded px-2.5 py-1 text-xs font-medium transition-colors"
                :class="
                  chartView === opt.value
                    ? 'bg-white text-[#1C1B19] shadow-sm dark:bg-white/10 dark:text-[#F2EFE9]'
                    : 'text-[#8A8172] hover:text-[#1C1B19] dark:text-[#A39C8E] dark:hover:text-[#F2EFE9]'
                "
                @click="chartView = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="relative h-[11rem] px-2 pb-3 pt-1 sm:h-[14rem] sm:px-3 lg:h-[15rem]">
            <div v-if="chartData.length === 0" class="flex h-full flex-col items-center justify-center text-center">
              <ChartBarIcon class="mb-2 h-8 w-8 text-[#B7AF9E]" stroke-width="1.5" />
              <p class="text-sm font-medium text-[#4A453B] dark:text-[#C9C3B6]">No revenue data yet</p>
              <p class="text-xs text-[#8A8172] dark:text-[#A39C8E]">Completed receipts will populate this chart</p>
            </div>
            <ClientOnly v-else>
              <apexchart type="area" :height="chartHeight" :options="chartOptions" :series="chartSeries" />
              <template #fallback>
                <div class="flex h-full items-center justify-center text-xs text-[#8A8172]">Loading chart…</div>
              </template>
            </ClientOnly>
          </div>
        </Card>

        <div class="ldg-card flex flex-col p-4 lg:col-span-4">
          <p class="ldg-eyebrow">Payment methods</p>
          <p class="mt-1 text-[11px] text-[#8A8172] dark:text-[#A39C8E]">Share of completed receipts by tender type</p>
          <div v-if="paymentMethodBreakdown.length === 0" class="mt-4 text-xs text-[#8A8172] dark:text-[#A39C8E]">
            No completed sales to analyze yet.
          </div>
          <ul v-else class="mt-4 space-y-3">
            <li v-for="slice in paymentMethodsTop" :key="slice.method">
              <div class="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span class="font-medium text-[#4A453B] dark:text-[#C9C3B6]">{{ slice.label }}</span>
                <span class="ldg-num shrink-0 text-[#8A8172] dark:text-[#A39C8E]">
                  {{ slice.share }}% · {{ formatCurrency(slice.revenue) }}
                </span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-[#1C1B19]/[0.06] dark:bg-white/[0.08]">
                <div class="h-full rounded-full bg-[#C99A4A]/70 transition-all dark:bg-[#E0AD5F]/60" :style="{ width: `${Math.max(slice.share, 2)}%` }" />
              </div>
              <p class="ldg-num mt-0.5 text-[10px] text-[#B7AF9E] dark:text-[#5C574C]">
                {{ slice.count }} receipt{{ slice.count === 1 ? '' : 's' }}
              </p>
            </li>
          </ul>
        </div>
      </div>

      <PaymentLinksSummaryCard v-if="canUseSubscriptionFeature('payment_links') || showNativeComingSoon" card-class="ldg-card p-4" />

      <!-- Business metrics -->
      <section class="ldg-card p-4">
        <div class="mb-3 flex items-center justify-between gap-2">
          <p class="ldg-eyebrow">Business metrics</p>
          <NuxtLink to="/dashboard/analytics" class="text-[11px] font-medium text-[#8A8172] hover:text-[#1C1B19] dark:text-[#A39C8E] dark:hover:text-[#F2EFE9]">
            Full analytics
          </NuxtLink>
        </div>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="row in businessMetricsTop"
            :key="row.label"
            class="flex items-baseline justify-between gap-2 border-b border-dotted border-[#1C1B19]/10 pb-2 dark:border-white/10"
          >
            <dt class="text-xs text-[#8A8172] dark:text-[#A39C8E]">{{ row.label }}</dt>
            <dd class="ldg-num text-xs font-semibold text-[#1C1B19] dark:text-[#F2EFE9]">{{ row.value }}</dd>
          </div>
        </dl>
      </section>

      <!-- Recent + top products -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
        <section class="ldg-card p-4">
          <div class="ldg-tear mb-2.5 flex items-center justify-between gap-2 pb-2.5">
            <h2 class="ldg-display text-sm text-[#1C1B19] dark:text-[#F2EFE9]">Recent receipts</h2>
            <NuxtLink to="/dashboard/receipts" class="text-[11px] font-medium text-[#8A8172] hover:text-[#1C1B19] dark:text-[#A39C8E] dark:hover:text-[#F2EFE9]">
              View all
            </NuxtLink>
          </div>
          <div v-if="recentReceipts.length === 0" class="py-2 text-xs text-[#8A8172] dark:text-[#A39C8E]">No receipts yet.</div>
          <ul v-else class="mt-1 space-y-0">
            <li
              v-for="tx in recentReceiptsTop"
              :key="tx.id"
              class="flex items-center justify-between gap-3 border-b border-dotted border-[#1C1B19]/10 py-2.5 last:border-0 dark:border-white/10"
            >
              <div class="min-w-0">
                <p class="truncate text-xs font-medium text-[#1C1B19] dark:text-[#F2EFE9]">{{ tx.customerName }}</p>
                <p class="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0 text-[11px] text-[#B7AF9E] dark:text-[#5C574C]">
                  <span class="ldg-num font-medium text-[#8A8172] dark:text-[#A39C8E]">#{{ tx.receiptNumber }}</span>
                  <span aria-hidden="true">·</span>
                  <span>{{ tx.paymentMethod }}</span>
                  <span class="hidden sm:inline" aria-hidden="true">·</span>
                  <span class="hidden sm:inline">{{ tx.statusLabel }}</span>
                  <span aria-hidden="true">·</span>
                  <span class="ldg-num shrink-0">{{ tx.time }}</span>
                </p>
              </div>
              <p class="ldg-num shrink-0 text-xs font-semibold text-[#1C1B19] dark:text-[#F2EFE9]">{{ tx.amount }}</p>
            </li>
          </ul>
        </section>

        <section class="ldg-card p-4">
          <div class="ldg-tear mb-2.5 flex items-center justify-between gap-2 pb-2.5">
            <h2 class="ldg-display text-sm text-[#1C1B19] dark:text-[#F2EFE9]">Top products</h2>
            <NuxtLink to="/dashboard/analytics" class="text-[11px] font-medium text-[#8A8172] hover:text-[#1C1B19] dark:text-[#A39C8E] dark:hover:text-[#F2EFE9]">
              Analytics
            </NuxtLink>
          </div>
          <div v-if="topSellingItems.length === 0" class="py-2 text-xs text-[#8A8172] dark:text-[#A39C8E]">No product sales yet.</div>
          <ul v-else class="mt-1 space-y-0">
            <li
              v-for="item in topProductsTop"
              :key="item.id"
              class="flex items-center justify-between gap-3 border-b border-dotted border-[#1C1B19]/10 py-2.5 last:border-0 dark:border-white/10"
            >
              <div class="min-w-0">
                <p class="truncate text-xs font-medium text-[#1C1B19] dark:text-[#F2EFE9]">{{ item.name }}</p>
                <p class="ldg-num mt-0.5 text-[11px] text-[#B7AF9E] dark:text-[#5C574C]">{{ item.sales }} sold</p>
              </div>
              <p class="ldg-num shrink-0 text-xs font-semibold text-[#1C1B19] dark:text-[#F2EFE9]">{{ formatCurrency(item.revenue) }}</p>
            </li>
          </ul>
        </section>
      </div>

      <!-- Low stock + activity + shortcuts -->
      <div class="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3 lg:items-start">
        <section class="ldg-card p-4 lg:col-span-1">
          <div class="ldg-tear mb-2.5 flex items-center justify-between gap-2 pb-2.5">
            <h2 class="ldg-display text-sm text-[#1C1B19] dark:text-[#F2EFE9]">Low stock</h2>
            <div class="flex items-center gap-2">
              <button
                v-if="lowStockItems.length > 0"
                type="button"
                class="text-[11px] font-medium text-[#A9762E] hover:text-[#8A5F23] disabled:opacity-50 dark:text-[#E0AD5F]"
                :disabled="reorderExporting"
                @click="handleExportReorderList"
              >
                {{ reorderExporting ? 'Exporting…' : 'Export reorder list' }}
              </button>
              <NuxtLink to="/dashboard/inventory" class="text-[11px] font-medium text-[#8A8172] hover:text-[#1C1B19] dark:text-[#A39C8E] dark:hover:text-[#F2EFE9]">
                Inventory
              </NuxtLink>
            </div>
          </div>
          <div v-if="lowStockItems.length === 0" class="py-2 text-xs text-[#8A8172] dark:text-[#A39C8E]">All lines above threshold.</div>
          <ul v-else class="mt-1 space-y-0">
            <li
              v-for="item in lowStockItemsTop"
              :key="item.id"
              class="flex items-baseline justify-between gap-2 border-b border-dotted border-[#1C1B19]/10 py-2 last:border-0 dark:border-white/10"
            >
              <p class="min-w-0 truncate text-xs text-[#4A453B] dark:text-[#C9C3B6]">{{ item.name }}</p>
              <span class="ldg-num shrink-0 text-xs font-medium text-[#B9791C] dark:text-[#E3A94C]">
                {{ item.quantity }}<span v-if="!item.isSerialNumber"> / {{ item.threshold }}</span>
              </span>
            </li>
          </ul>
        </section>

        <section v-if="canViewActivity" class="ldg-card p-4 lg:col-span-1">
          <div class="ldg-tear mb-2.5 flex items-center justify-between pb-2.5">
            <h2 class="ldg-display text-sm text-[#1C1B19] dark:text-[#F2EFE9]">Recent activity</h2>
            <NuxtLink to="/dashboard/activity" class="text-[11px] font-medium text-[#8A8172] hover:text-[#1C1B19] dark:text-[#A39C8E] dark:hover:text-[#F2EFE9]">
              All logs
            </NuxtLink>
          </div>
          <div v-if="recentActivityLogs.length === 0" class="py-2 text-xs text-[#8A8172] dark:text-[#A39C8E]">No activity logged yet.</div>
          <ul v-else class="mt-1 space-y-0">
            <li
              v-for="log in recentActivityLogsTop"
              :key="log.id"
              class="flex gap-2 border-b border-dotted border-[#1C1B19]/10 py-2 last:border-0 dark:border-white/10"
            >
              <span class="self-start" :class="activityActionBadgeClass(log.action)">{{ activityActionLabel(log.action) }}</span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-medium text-[#1C1B19] dark:text-[#F2EFE9]">{{ activityLogPreviewTitle(log) }}</p>
                <p class="mt-0.5 truncate text-[11px] text-[#B7AF9E] dark:text-[#5C574C]">
                  {{ activityEntityTypeLabel(log.entityType) }}
                  <span class="hidden sm:inline"> · {{ log.userDisplayName }}</span>
                  · <span class="ldg-num">{{ formatActivityTime(log.createdAt) }}</span>
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section class="ldg-card p-4" :class="canViewActivity ? 'lg:col-span-1' : 'lg:col-span-2'">
          <div class="ldg-tear mb-2.5 pb-2.5">
            <h2 class="ldg-display text-sm text-[#1C1B19] dark:text-[#F2EFE9]">Shortcuts</h2>
          </div>
          <ul class="mt-1 space-y-0">
            <li v-for="link in quickLinksTop" :key="link.href" class="border-b border-dotted border-[#1C1B19]/10 last:border-0 dark:border-white/10">
              <NuxtLink :to="link.href" class="flex items-center justify-between gap-2 py-2.5 text-xs transition-colors hover:text-[#1C1B19] dark:hover:text-[#F2EFE9]">
                <span class="font-medium text-[#4A453B] dark:text-[#C9C3B6]">{{ link.label }}</span>
                <span class="text-[#B7AF9E] dark:text-[#5C574C]">→</span>
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
import PaymentLinksSummaryCard from '~/components/payments/PaymentLinksSummaryCard.vue'
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
const { showNativeComingSoon } = usePaymentLinksLaunch()

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
  totalOrders,
  todayReceiptsCount,
  outstandingCount,
  outstandingBalanceTotal,
  totalCustomers,
  newCustomersToday,
  inventoryTotalValue,
  inStockCount,
  outOfStockCount,
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
} = insights

function topN<T>(items: T[], limit = DASHBOARD_LIST_TOP): T[] {
  return items.slice(0, limit)
}

const attentionItemsTop = computed(() => topN(attentionItems.value))
const paymentMethodsTop = computed(() => topN(paymentMethodBreakdown.value))
const businessMetricsTop = computed(() => [...salesMetrics.value, ...operationsMetrics.value])
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
  if (authStore.currentUser?.displayName)
    return authStore.currentUser.displayName.split(' ')[0] || 'User'
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
  // Ledger palette: verdigris line on a warm ink/paper backdrop.
  const lineColor = isDark ? '#5FC2A8' : '#3F8F7C'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(28, 27, 25, 0.06)'
  const labelColor = isDark ? '#A39C8E' : '#8A8172'

  return {
    chart: {
      type: 'area',
      height: chartHeight.value,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
      background: 'transparent',
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2, colors: [lineColor] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0,
        opacityFrom: 0.22,
        opacityTo: 0,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: lineColor, opacity: 0.24 },
          { offset: 100, color: lineColor, opacity: 0 },
        ],
      },
    },
    xaxis: {
      categories: (() => {
        const data = chartView.value === 'monthly' ? chartData.value.slice(-12) : chartData.value
        return data.map((item, index) => {
          if (chartView.value === 'weekly') return `W${index + 1}`
          if (chartView.value === 'monthly')
            return item.date.toLocaleDateString('en-US', { month: 'short' })
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
      return 'border border-[#AE463B]/25 bg-[#AE463B]/[0.06] dark:border-[#E2786C]/25 dark:bg-[#E2786C]/[0.06]'
    case 'warning':
      return 'border border-[#B9791C]/25 bg-[#B9791C]/[0.06] dark:border-[#E3A94C]/25 dark:bg-[#E3A94C]/[0.06]'
    default:
      return 'border border-[#1C1B19]/10 bg-[#1C1B19]/[0.02] dark:border-white/10 dark:bg-white/[0.02]'
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

<style scoped>
/* ---------------------------------------------------------------------
   Ledger design system
   A dashboard styled after a well-kept receipt ledger: warm ink/paper
   tones, brass + verdigris accents (not the default blue/gray SaaS
   palette), Space Grotesk for headers, Inter for body copy, and
   IBM Plex Mono for every number so figures read like they came off a
   till tape. The signature motif is a perforated "ticket tear" rule
   used only at major section boundaries.
   --------------------------------------------------------------------- */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

.ldg {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}

.ldg-display {
  font-family: 'Space Grotesk', ui-sans-serif, sans-serif;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.ldg-eyebrow {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8a8172;
}
:global(.dark) .ldg-eyebrow {
  color: #a39c8e;
}

.ldg-num {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

/* Card surface: warm paper in light mode, keeps existing token in dark. */
.ldg-card {
  background: #ffffff;
  border: 1px solid rgba(28, 27, 25, 0.09);
  border-radius: 0.65rem;
}
:global(.dark) .ldg-card {
  background: var(--color-dashboard-card, #161a1f);
  border-color: rgba(255, 255, 255, 0.08);
}

/* Signature: perforated ticket-tear divider, used at section boundaries only */
.ldg-tear {
  position: relative;
  border-bottom: none;
}
.ldg-tear::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background-image: radial-gradient(circle, rgba(28, 27, 25, 0.22) 1px, transparent 1.3px);
  background-size: 7px 1px;
  background-repeat: repeat-x;
}
:global(.dark) .ldg-tear::after {
  background-image: radial-gradient(circle, rgba(242, 239, 233, 0.22) 1px, transparent 1.3px);
}
</style>