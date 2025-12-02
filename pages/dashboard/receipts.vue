<template>
  <ClientOnly>
    <div class="space-y-6 pb-24 min-h-screen w-full">
      <!-- Loading State -->
      <div v-if="isInitialLoading">
        <Card padding="none">
          <div class="p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipts...</p>
          </div>
        </Card>
      </div>
    
    <!-- Actual Content -->
    <template v-else>
    <!-- Page Header -->
      <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Sales</h1>
      <p class="mt-1 text-gray-600 dark:text-gray-400">Manage receipts, customers, and returns</p>
    </div>

    <!-- Tab Navigation -->
    <Card padding="none" class="overflow-hidden">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex -mb-px">
          <button
            @click="activeTab = 'receipts'"
            :class="[
              'px-6 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'receipts'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            <div class="flex items-center gap-2">
              <ReceiptPercentIcon class="w-5 h-5" />
              <span>Receipts</span>
            </div>
          </button>
          <button
            @click="activeTab = 'customers'"
            :class="[
              'px-6 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'customers'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            <div class="flex items-center gap-2">
              <UsersIcon class="w-5 h-5" />
              <span>Customers</span>
            </div>
          </button>
          <button
            @click="activeTab = 'returns'"
            :class="[
              'px-6 py-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'returns'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            ]"
          >
            <div class="flex items-center gap-2">
              <ArrowPathIcon class="w-5 h-5" />
              <span>Returns</span>
            </div>
          </button>
        </nav>
      </div>
    </Card>

    <!-- Receipts Tab Content -->
    <template v-if="activeTab === 'receipts'">

    <!-- Stats Cards - Hidden on large screens -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:hidden">
      <Card padding="md" extra-class="border-l-4 border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Receipts</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100 min-h-[2.5rem]">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>{{ receiptsStore.totalReceipts }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">All time</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ReceiptPercentIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
    </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              ${{ formatCurrency(totalSales) }}
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">All time revenue</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CurrencyDollarIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Sales</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100 min-h-[2.5rem]">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>${{ formatCurrency(todaySales) }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500 min-h-[1rem]">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>{{ todayReceipts }} receipts</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <CalendarIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      <Card padding="md" extra-class="border-l-4 border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
            <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100 min-h-[2.5rem]">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>${{ formatCurrency(monthSales) }}</span>
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500 min-h-[1rem]">
              <span v-if="receiptsStore.loading">-</span>
              <span v-else>{{ monthReceipts }} receipts</span>
            </p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ChartBarIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters - Hidden on large screens -->
    <Card padding="md" class="lg:hidden">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1 relative">
          <MagnifyingGlassIcon class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by receipt number, customer..."
            class="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
          />
        </div>
        <select
          v-model="statusFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          v-model="dateFilter"
          class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-w-[160px]"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <Button
          variant="outline"
          @click="resetFilters"
          :icon="ArrowPathIcon"
        >
          Reset
        </Button>
      </div>
    </Card>

    <!-- Receipts Table -->
    <div>
      <!-- Compact Header (Visible only on large screens) -->
      <div class="hidden lg:block border-b border-gray-200 dark:border-gray-700 mb-6">
        <div class="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
          <!-- Compact Stats -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <ReceiptPercentIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Receipts:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>{{ receiptsStore.totalReceipts }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <CurrencyDollarIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Sales:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">${{ formatCurrency(totalSales) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <CalendarIcon class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Today:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>${{ formatCurrency(todaySales) }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <ChartBarIcon class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span class="text-xs text-gray-600 dark:text-gray-400">Month:</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span v-if="receiptsStore.loading">-</span>
                <span v-else>${{ formatCurrency(monthSales) }}</span>
              </span>
            </div>
          </div>
          <!-- Compact Filters -->
          <div class="flex items-center gap-3">
            <div class="relative">
              <MagnifyingGlassIcon class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-48"
              />
            </div>
            <select
              v-model="statusFilter"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              v-model="dateFilter"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              @click="resetFilters"
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Reset filters"
            >
              <ArrowPathIcon class="w-4 h-4" />
          </button>
          </div>
        </div>
      </div>
      <div v-if="receiptsStore.loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipts...</p>
      </div>
      <div v-else class="overflow-x-auto mb-6">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Receipt #
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Customer
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Date
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Items
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Total
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Payment
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Status
              </th>
              <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Created By
              </th>
              <th class="px-3 sm:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 min-w-[160px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="receipt in paginatedReceipts"
              :key="receipt.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ receipt.receiptNumber }}
                  </div>
                  <span
                    v-if="receipt.isSwapIn"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    title="Swap-in transaction"
                  >
                    Swap
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ receipt.customerName }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ receipt.customerEmail }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ formatDate(receipt.date) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatTime(receipt.date) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ receipt.itemsCount }} items
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ${{ formatCurrency(receipt.total) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {{ receipt.paymentMethod }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                    receipt.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : receipt.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  ]"
                >
                  {{ receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900 dark:text-gray-100">
                  {{ getCreatorName(receipt.actualCreator || receipt.createdBy) }}
                </div>
              </td>
              <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-right min-w-[160px]">
                <div class="flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    @click="handleViewReceipt(receipt)"
                    class="flex-shrink-0 p-1.5 sm:p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                    title="View"
                  >
                    <EyeIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    @click="handlePrintReceipt(receipt)"
                    class="flex-shrink-0 p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Print"
                  >
                    <PrinterIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    v-if="receipt.status === 'completed' && canManage"
                    @click="handleRefundReceipt(receipt)"
                    class="flex-shrink-0 p-1.5 sm:p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    title="Refund"
                  >
                    <ArrowPathIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                  <button
                    v-if="canManage"
                    @click="handleDeleteReceipt(receipt)"
                    class="flex-shrink-0 p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <TrashIcon class="w-5 h-5 flex-shrink-0" />
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="filteredReceipts.length === 0">
              <td colspan="8" class="px-6 py-12">
                <div class="text-center">
                  <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <ReceiptPercentIcon class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'No receipts found' : 'No receipts yet' }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {{ searchQuery || statusFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first receipt to get started' }}
                  </p>
                  <Button
                    v-if="!searchQuery && statusFilter === 'all' && dateFilter === 'all'"
                    variant="primary"
                    :icon="PlusIcon"
                    @click="openCreateReceiptModal"
                  >
                    Create First Receipt
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fixed Pagination -->
    <div
      v-if="filteredReceipts.length > 0"
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-30 transition-all duration-300"
      :class="sidebarCollapsed ? 'lg:left-20' : 'lg:left-72'"
    >
      <Pagination
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredReceipts.length"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Floating Action Button -->
    <button
      v-if="!isInitialLoading && filteredReceipts.length > 0 && canCreate"
      @click="openCreateReceiptModal"
      class="fixed bottom-24 right-8 w-14 h-14 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
      title="Create new receipt"
    >
      <PlusIcon class="w-6 h-6" />
    </button>

      <!-- Create Receipt Modal -->
      <CreateReceiptModal
        v-model="showCreateReceiptModal"
        @receipt-created="handleReceiptCreated"
      />

      <!-- View Receipt Modal -->
      <ViewReceiptModal
        v-model="showViewReceiptModal"
        :receipt="selectedReceipt"
      />

      <!-- Return Receipt Modal -->
      <ReturnReceiptModal
        v-model="showReturnReceiptModal"
        :receipt="selectedReceipt"
        @returned="handleReceiptReturned"
      />

      <!-- Delete Receipt Modal -->
      <DeleteReceiptModal
        v-model="showDeleteReceiptModal"
        :receipt="selectedReceipt"
        @deleted="handleReceiptDeleted"
      />
    </template>

    <!-- Customers Tab Content -->
    <template v-if="activeTab === 'customers'">
      <!-- Customers content will be added here -->
      <div class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">Customers tab coming soon...</p>
      </div>
    </template>

    <!-- Returns Tab Content -->
    <template v-if="activeTab === 'returns'">
      <!-- Returns content will be added here -->
      <div class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">Returns tab coming soon...</p>
      </div>
    </template>
    </template>
    </div>
    <template #fallback>
      <div class="space-y-6 pb-24 min-h-screen w-full">
        <Card padding="none">
          <div class="p-12 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading receipts...</p>
          </div>
        </Card>
  </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  PlusIcon,
  ReceiptPercentIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  EyeIcon,
  PrinterIcon,
  UsersIcon,
  UserCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/vue/24/outline'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Pagination from '~/components/ui/Pagination.vue'
// @ts-ignore
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
// @ts-ignore
import ViewReceiptModal from '~/components/receipts/ViewReceiptModal.vue'
// @ts-ignore
import ReturnReceiptModal from '~/components/receipts/ReturnReceiptModal.vue'
// @ts-ignore
import DeleteReceiptModal from '~/components/receipts/DeleteReceiptModal.vue'
import { useReceiptsStore, type Receipt } from '~/stores/receipts'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { useUser } from '~/composables/useUser'
import { useFirestore } from '~/composables/useFirestore'
import { useStaffStore } from '~/stores/staff'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

definePageMeta({
  layout: 'dashboard',
  ssr: false
})

useHead({
  title: 'Receipts - Storv',
})

const receiptsStore = useReceiptsStore()
const authStore = useAuthStore()
const { canManage, canCreate } = usePermissions()
const { getUserDocument } = useUser()
const { getFirestoreInstance } = useFirestore()
const staffStore = useStaffStore()

// Store creator names by UID
const creatorNames = ref<Record<string, string>>({})
const loadingCreators = ref(false)

// Tab management
const route = useRoute()
const router = useRouter()
const activeTab = ref<'receipts' | 'customers' | 'returns'>((route.query.tab as any) || 'receipts')

// Watch for tab changes and update URL
watch(activeTab, (newTab) => {
  router.replace({ query: { ...route.query, tab: newTab } })
})

// Initialize loading state synchronously on client
const isInitialLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')
const dateFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sidebarCollapsed = ref(false)

// Customers tab state
const customersSearchQuery = ref('')
const customersSortBy = ref('name')
const customersCurrentPage = ref(1)
const customersItemsPerPage = ref(9)

// Returns tab state
const returnsSearchQuery = ref('')
const returnsStatusFilter = ref('all')
const returnsReasonFilter = ref('all')
const returnsCurrentPage = ref(1)
const returnsItemsPerPage = ref(10)

// Load sidebar state from localStorage
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

// Watch for sidebar state changes
if (import.meta.client) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'sidebarCollapsed' && e.newValue !== null) {
      sidebarCollapsed.value = e.newValue === 'true'
    }
  })
  // Also check periodically for changes (since storage event doesn't fire on same window)
  setInterval(() => {
    try {
      const savedState = localStorage.getItem('sidebarCollapsed')
      if (savedState !== null) {
        const newValue = savedState === 'true'
        if (newValue !== sidebarCollapsed.value) {
          sidebarCollapsed.value = newValue
        }
      }
    } catch (e) {
      // Ignore
    }
  }, 100)
}

const receipts = computed(() => receiptsStore.receipts)
const totalSales = computed(() => receiptsStore.totalSales)
const todaySales = computed(() => {
  const today = new Date().toDateString()
  return receiptsStore.receipts
    .filter(r => r.status === 'completed' && new Date(r.date).toDateString() === today)
    .reduce((sum, r) => sum + r.total, 0)
})

const todayReceipts = computed(() => {
  const today = new Date().toDateString()
  return receiptsStore.receipts.filter(r => new Date(r.date).toDateString() === today).length
})

const monthSales = computed(() => receiptsStore.monthSales)

const monthReceipts = computed(() => {
  const now = new Date()
  return receiptsStore.receipts.filter(r => {
    const receiptDate = new Date(r.date)
    return receiptDate.getMonth() === now.getMonth() &&
      receiptDate.getFullYear() === now.getFullYear()
  }).length
})

const filteredReceipts = computed(() => {
  let result = [...receipts.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r =>
      r.receiptNumber.toLowerCase().includes(query) ||
      r.customerName.toLowerCase().includes(query) ||
      r.customerEmail.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(r => r.status === statusFilter.value)
  }

  // Date filter
  if (dateFilter.value !== 'all') {
    const now = new Date()
    result = result.filter(r => {
      const receiptDate = new Date(r.date)
      switch (dateFilter.value) {
        case 'today':
          return receiptDate.toDateString() === now.toDateString()
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return receiptDate >= weekAgo
        case 'month':
          return receiptDate.getMonth() === now.getMonth() &&
            receiptDate.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }

  // Sort by date (newest first)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return result
})

const paginatedReceipts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredReceipts.value.slice(start, end)
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatDate = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatTime = (date: string | Date) => {
  const dateObj = date instanceof Date ? date : new Date(date)
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  dateFilter.value = 'all'
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const showCreateReceiptModal = ref(false)

const openCreateReceiptModal = () => {
  showCreateReceiptModal.value = true
}

const handleReceiptCreated = async (receipt: Receipt) => {
  // Receipt is already added to store by the modal, but we need to refresh to ensure it appears
  showCreateReceiptModal.value = false
  // Refresh receipts list to ensure staff-created receipts appear
  await receiptsStore.fetchReceipts()
  // Reload creator names after receipts are refreshed
  await loadCreatorNames()
}

const selectedReceipt = ref<Receipt | null>(null)
const showViewReceiptModal = ref(false)
const showReturnReceiptModal = ref(false)
const showDeleteReceiptModal = ref(false)

const handleViewReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showViewReceiptModal.value = true
}

const handlePrintReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showViewReceiptModal.value = true
  // Small delay to allow modal to open, then trigger print
  setTimeout(() => {
    const printBtn = document.querySelector('[data-print-pdf]') as HTMLButtonElement
    if (printBtn) {
      printBtn.click()
    }
  }, 300)
}

const handleRefundReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showReturnReceiptModal.value = true
}

const handleReceiptReturned = async (receipt: Receipt) => {
  showReturnReceiptModal.value = false
  selectedReceipt.value = null
  // Refresh receipts list
  await receiptsStore.fetchReceipts()
}

const handleDeleteReceipt = (receipt: Receipt) => {
  selectedReceipt.value = receipt
  showDeleteReceiptModal.value = true
}

const handleReceiptDeleted = async (receipt: Receipt) => {
  showDeleteReceiptModal.value = false
  selectedReceipt.value = null
  // Refresh receipts list
  await receiptsStore.fetchReceipts()
  // Reload creator names
  await loadCreatorNames()
}

// Function to fetch creator name for a given UID
const getCreatorName = (uid: string): string => {
  if (!uid) return 'Unknown'
  return creatorNames.value[uid] || 'Loading...'
}

// Load creator names for all unique creator UIDs in receipts
const loadCreatorNames = async () => {
  if (loadingCreators.value || receipts.value.length === 0) return
  
  loadingCreators.value = true
  const db = getFirestoreInstance()
  if (!db) {
    loadingCreators.value = false
    return
  }

  try {
    // Get unique creator UIDs from receipts (use actualCreator if available, otherwise createdBy)
    const uniqueCreatorUids = [...new Set(receipts.value.map(r => (r as any).actualCreator || r.createdBy).filter(Boolean))]
    
    // Fetch names for all unique creators
    await Promise.all(uniqueCreatorUids.map(async (uid) => {
      if (creatorNames.value[uid]) return // Already loaded
      
      try {
        // First try to get from users collection (super admin)
        const userData = await getUserDocument(uid)
        if (userData?.name) {
          creatorNames.value[uid] = userData.name
          return
        }
        
        // If not found, try to get from staff collection (staff member)
        const staffRef = collection(db, 'staff')
        const staffQuery = query(staffRef, where('authUid', '==', uid))
        const staffSnapshot = await getDocs(staffQuery)
        
        if (!staffSnapshot.empty && staffSnapshot.docs.length > 0) {
          const staffDoc = staffSnapshot.docs[0]
          if (staffDoc) {
            const staffData = staffDoc.data()
            const fullName = `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim()
            if (fullName) {
              creatorNames.value[uid] = fullName
              return
            }
          }
        }
        
        // If still not found, use UID as fallback
        creatorNames.value[uid] = 'Unknown User'
      } catch (error: any) {
        console.warn(`Failed to fetch creator name for ${uid}:`, error.message)
        creatorNames.value[uid] = 'Unknown User'
      }
    }))
  } catch (error: any) {
    console.error('Error loading creator names:', error)
  } finally {
    loadingCreators.value = false
  }
}

// Load receipts on mount
onMounted(async () => {
  // Only run on client
  if (import.meta.server) return
  
  // Set initial loading state
  isInitialLoading.value = true
  
  // Wait for auth to finish loading before loading receipts
  if (authStore.loading) {
    let resolved = false
    await new Promise((resolve) => {
      const unwatch = watch(() => authStore.loading, (val) => {
        if (!val && !resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      })
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          unwatch()
          resolve(true)
        }
      }, 5000)
    })
  }
  
  // Only load receipts if user is authenticated
  if (authStore.currentUser) {
    try {
      await receiptsStore.fetchReceipts()
      // Load creator names after receipts are loaded
      await loadCreatorNames()
    } catch (error: any) {
      console.error('Error loading receipts:', error.message || error)
    }
  }
  
  // Hide initial loading state after a minimum time to prevent flash
  await new Promise(resolve => setTimeout(resolve, 300))
  isInitialLoading.value = false
})

// Watch for auth state changes
watch(() => authStore.currentUser, async (user) => {
  if (user && receiptsStore.receipts.length === 0) {
    try {
      await receiptsStore.fetchReceipts()
      // Load creator names after receipts are loaded
      await loadCreatorNames()
    } catch (error: any) {
      console.error('Error loading receipts:', error.message || error)
    }
  }
}, { immediate: false })

// Watch for receipts changes and load creator names
watch(() => receiptsStore.receipts, async (newReceipts) => {
  if (newReceipts && newReceipts.length > 0) {
    await loadCreatorNames()
  }
}, { immediate: false })
</script>

