<template>
  <div class="pb-8 min-h-screen w-full overflow-x-hidden">
    <div class="mb-4 sm:mb-6">
      <h1 class="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Multi-Store Sync</h1>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Transfer items between stores and view consolidated reports</p>
    </div>

    <div
      v-if="!canAccess"
      class="rounded-xl bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-200/60 dark:ring-amber-800/50 p-3 sm:p-4 flex items-center gap-3"
    >
      <div class="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
        <ExclamationTriangleIcon class="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Access restricted</h3>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
          {{ isStaff ? 'Only super admins can access multi-store sync.' : 'Multi-Store Sync is available on Storvv Enterprise. Upgrade in Settings to unlock.' }}
        </p>
      </div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total stores</p>
              <p class="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">{{ stores.length }}</p>
            </div>
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BuildingStorefrontIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total transfers</p>
              <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">{{ transferHistory.length }}</p>
            </div>
            <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ArrowPathIcon class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="inline-flex p-0.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/50 ring-1 ring-gray-200/60 dark:ring-gray-700/50">
        <nav class="flex gap-0.5">
          <button
            @click="activeTab = 'transfer'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
              activeTab === 'transfer'
                ? 'text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/50 dark:ring-primary-400/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Transfer Items
          </button>
          <button
            @click="activeTab = 'reports'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
              activeTab === 'reports'
                ? 'text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/50 dark:ring-primary-400/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Consolidated Reports
          </button>
          <button
            @click="activeTab = 'history'"
            :class="[
              'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
              activeTab === 'history'
                ? 'text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/50 dark:ring-primary-400/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Transfer History
          </button>
        </nav>
      </div>

      <div v-if="activeTab === 'transfer'" class="mt-4 sm:mt-6 rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Move stock between warehouses</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Request a transfer → Approve → In transit (add tracking) → Complete to update stock</p>
        </div>
        <div class="p-3 sm:p-4 space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Source store</label>
            <select
              v-model="transferForm.sourceStoreId"
              @change="loadSourceStoreInventory"
              class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">Select source store</option>
              <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name || store.branchName || store.id }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Destination store</label>
            <select
              v-model="transferForm.destinationStoreId"
              @change="loadDestinationStoreFolders"
              class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">Select destination store</option>
              <option v-for="store in stores.filter(s => s.id !== transferForm.sourceStoreId)" :key="store.id" :value="store.id">{{ store.name || store.branchName || store.id }}</option>
            </select>
          </div>
          <div v-if="transferForm.destinationStoreId">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Destination folder</label>
            <select
              v-model="transferForm.destinationFolderId"
              class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">Select destination folder</option>
              <option v-for="folder in destinationFolders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Folder in the destination store where items will be transferred</p>
          </div>
          <div v-if="transferForm.sourceStoreId">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Inventory folder</label>
            <select
              v-model="transferForm.folderId"
              @change="loadFolderItems"
              class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">Select folder</option>
              <option v-for="folder in sourceFolders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
            </select>
          </div>

          <div v-if="transferForm.folderId && availableItems.length > 0" class="space-y-1.5">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select items to transfer</label>
            <div class="rounded-lg ring-1 ring-gray-200/80 dark:ring-gray-700/80 overflow-hidden max-h-52 overflow-y-auto">
              <table class="w-full text-xs">
                <thead class="bg-white/60 dark:bg-gray-800/60 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Item</th>
                    <th v-if="!currentFolderHasSerialNumbers" class="px-3 py-2 text-left text-xs !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Available</th>
                    <th v-if="!currentFolderHasSerialNumbers" class="px-3 py-2 text-left text-xs !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Qty</th>
                    <th v-else class="px-3 py-2 text-left text-xs !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Select</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200/80 dark:divide-gray-700/80 bg-white dark:bg-gray-800/40">
                  <tr v-for="item in availableItems" :key="item.id" class="hover:bg-gray-50/80 dark:hover:bg-gray-700/40">
                    <td class="px-3 py-2">
                      <div>
                        <p class="font-medium text-gray-900 dark:text-gray-100">{{ item.name || item.itemName || 'Unnamed Item' }}</p>
                        <p v-if="item.brand && item.model" class="text-xs text-gray-500 dark:text-gray-400">{{ item.brand }} {{ item.model }}</p>
                        <p v-if="item.serialNo || item.serialNumber" class="text-xs text-gray-500 dark:text-gray-400">Serial: {{ item.serialNo || item.serialNumber }}</p>
                      </div>
                    </td>
                    <td v-if="!currentFolderHasSerialNumbers" class="px-3 py-2 text-gray-600 dark:text-gray-300">{{ getAvailableQuantity(item) }}</td>
                    <td v-if="!currentFolderHasSerialNumbers" class="px-3 py-2">
                      <input
                        v-model.number="transferForm.items[item.id]"
                        type="number"
                        :max="getAvailableQuantity(item)"
                        min="0"
                        class="w-16 px-2 py-1 text-xs rounded-md ring-1 ring-gray-200/80 dark:ring-gray-600/80 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500/30"
                        placeholder="0"
                      />
                    </td>
                    <td v-else class="px-3 py-2">
                      <input
                        v-model="transferForm.items[item.id]"
                        type="checkbox"
                        :true-value="1"
                        :false-value="0"
                        class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500/30"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
            <textarea
              v-model="transferForm.notes"
              rows="2"
              class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
              placeholder="Add any notes about this transfer..."
            />
          </div>

          <div class="flex justify-end pt-1.5">
            <Button
              @click="requestTransfer"
              :disabled="!canTransfer || isTransferring"
              :loading="isTransferring"
              variant="primary"
              size="sm"
              :icon="ArrowsRightLeftIcon"
              extra-class="!rounded-lg font-medium"
            >
              {{ isTransferring ? 'Creating...' : 'Request transfer' }}
            </Button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Transfer will be created as pending. Approve → mark in transit → add tracking (optional) → complete to update stock.</p>
        </div>
      </div>

      <div v-if="activeTab === 'reports'" class="mt-4 sm:mt-6 rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Consolidated reports</h2>
        </div>
        <div class="p-3 sm:p-4 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date range</label>
              <select
                v-model="reportFilters.dateRange"
                @change="loadConsolidatedReports"
                class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Stores</label>
              <select
                v-model="reportFilters.storeIds"
                @change="loadConsolidatedReports"
                class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800/80 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="all">All stores</option>
                <option v-for="store in stores" :key="store.id" :value="store.id">{{ store.name || store.branchName || store.id }}</option>
              </select>
            </div>
            <div class="flex items-end">
              <Button
                @click="exportConsolidatedReport"
                variant="success"
                size="sm"
                :icon="ArrowDownTrayIcon"
                extra-class="!rounded-lg font-medium w-full sm:w-auto"
              >
                Export report
              </Button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="rounded-lg bg-white dark:bg-gray-800/60 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total revenue</p>
              <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(consolidatedReport.totalRevenue) }}</p>
            </div>
            <div class="rounded-lg bg-white dark:bg-gray-800/60 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total sales</p>
              <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">{{ consolidatedReport.totalSales }}</p>
            </div>
            <div class="rounded-lg bg-white dark:bg-gray-800/60 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total items</p>
              <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">{{ consolidatedReport.totalItems }}</p>
            </div>
            <div class="rounded-lg bg-white dark:bg-gray-800/60 ring-1 ring-gray-200/50 dark:ring-gray-700/50 p-3">
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Avg order value</p>
              <p class="mt-0.5 text-sm font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(consolidatedReport.avgOrderValue) }}</p>
            </div>
          </div>

          <div>
            <h3 class="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Store breakdown</h3>
            <div class="rounded-lg ring-1 ring-gray-200/80 dark:ring-gray-700/80 overflow-hidden">
              <table class="w-full text-xs">
                <thead class="bg-white/60 dark:bg-gray-800/60">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Store</th>
                    <th class="px-3 py-2 text-right text-xs !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Revenue</th>
                    <th class="px-3 py-2 text-right text-xs !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Sales</th>
                    <th class="px-3 py-2 text-right text-xs !font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">Items</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200/80 dark:divide-gray-700/80 bg-white dark:bg-gray-800/40">
                  <tr v-for="store in consolidatedReport.storeBreakdown" :key="store.id" class="hover:bg-gray-50/80 dark:hover:bg-gray-700/40">
                    <td class="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{{ store.name }}</td>
                    <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{{ formatCurrency(store.revenue) }}</td>
                    <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{{ store.sales }}</td>
                    <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{{ store.items }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'history'" class="mt-4 sm:mt-6 rounded-xl bg-gray-50 dark:bg-gray-800/80 ring-1 ring-gray-200/50 dark:ring-gray-700/50 overflow-hidden">
        <div class="p-3 sm:p-4 border-b border-gray-200/60 dark:border-gray-700/60">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Transfer history</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Warehouse-to-warehouse transfers with approval and tracking</p>
        </div>
        <div class="p-3 sm:p-4">
          <div v-if="transferHistory.length === 0" class="text-center py-8">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <ArrowsRightLeftIcon class="w-6 h-6 text-gray-400 dark:text-gray-500" stroke-width="1.5" />
            </div>
            <p class="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-0.5">No transfer history</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Create a transfer from the Transfer Items tab</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="transfer in transferHistory"
              :key="transfer.id"
              class="rounded-lg bg-white dark:bg-gray-800/60 ring-1 ring-gray-200/60 dark:ring-gray-700/60 p-3 sm:p-4 hover:ring-gray-300 dark:hover:ring-gray-600/80 transition-colors"
            >
              <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5 mb-1">
                    <ArrowsRightLeftIcon class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                    <p class="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {{ getStoreName(transfer.sourceStoreId) }} → {{ getStoreName(transfer.destinationStoreId) }}
                    </p>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatTransferProductSummary(transfer) }} · {{ formatDate(transfer.createdAt) }}
                  </p>
                  <div v-if="transfer.items && transfer.items.length > 0" class="space-y-1 mt-2">
                    <div
                      v-for="(item, idx) in transfer.items.slice(0, 3)"
                      :key="idx"
                      class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0"></span>
                      <span>{{ item.itemName || 'Item' }}<span v-if="item.quantity > 1" class="text-gray-500"> · {{ item.quantity }} units</span><span v-if="item.serialNumber" class="text-gray-500"> ({{ item.serialNumber }})</span></span>
                    </div>
                    <p v-if="transfer.items.length > 3" class="text-xs text-gray-500 dark:text-gray-500 italic pl-3.5">
                      +{{ transfer.items.length - 3 }} more
                    </p>
                  </div>
                  <div v-if="transfer.trackingNumber || transfer.carrier" class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <TruckIcon class="w-3.5 h-3.5 flex-shrink-0" />
                    <span v-if="transfer.carrier">{{ transfer.carrier }}</span>
                    <span v-if="transfer.trackingNumber" class="font-mono">{{ transfer.trackingNumber }}</span>
                  </div>
                  <p v-if="transfer.notes" class="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">{{ transfer.notes }}</p>
                </div>
                <div class="flex flex-col items-end gap-2 shrink-0">
                  <span
                    :class="[
                      'px-2 py-0.5 text-xs font-medium rounded-md capitalize',
                      getTransferStatusClass(transfer.status)
                    ]"
                  >
                    {{ getTransferStatusLabel(transfer.status) }}
                  </span>
                  <div v-if="isTransferActionable(transfer)" class="flex flex-wrap gap-1.5 justify-end">
                    <template v-if="transfer.status === 'pending_approval'">
                      <Button variant="primary" size="sm" extra-class="!rounded-lg font-medium" @click="approveTransfer(transfer)">Approve</Button>
                      <Button variant="outline" size="sm" extra-class="!rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" @click="cancelTransfer(transfer)">Cancel</Button>
                    </template>
                    <template v-else-if="transfer.status === 'in_transit'">
                      <Button variant="outline" size="sm" extra-class="!rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" :icon="TruckIcon" @click="openTrackingModal(transfer)">Tracking</Button>
                      <Button variant="primary" size="sm" extra-class="!rounded-lg font-medium" @click="completeTransfer(transfer)">Complete</Button>
                      <Button variant="outline" size="sm" extra-class="!rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" @click="cancelTransfer(transfer)">Cancel</Button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tracking modal -->
      <Modal
        v-model="showTrackingModal"
        size="sm"
      >
        <template #header>Shipment tracking</template>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Carrier</label>
            <input
              v-model="trackingForm.carrier"
              type="text"
              class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400"
              placeholder="e.g. DHL, FedEx"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tracking number</label>
            <input
              v-model="trackingForm.trackingNumber"
              type="text"
              class="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-mono"
              placeholder="e.g. 1234567890"
            />
          </div>
        </div>
        <template #footer>
          <Button variant="outline" size="sm" extra-class="!rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" @click="showTrackingModal = false">Cancel</Button>
          <Button variant="primary" size="sm" extra-class="!rounded-lg font-medium" @click="saveTracking">Save</Button>
        </template>
      </Modal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  BuildingStorefrontIcon,
  ArrowPathIcon,
  CubeIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  TruckIcon,
} from '@heroicons/vue/24/outline'
import Button from '~/components/ui/Button.vue'
import Modal from '~/components/ui/Modal.vue'
import { useStoresStore } from '~/stores/stores'
import { useInventoryStore } from '~/stores/inventory'
import { useUserStore } from '~/stores/user'
import { useAuthStore } from '~/stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { usePreferences } from '~/composables/usePreferences'
import { useToast } from '~/composables/useToast'
import { useFirestore } from '~/composables/useFirestore'

definePageMeta({
  layout: 'dashboard'
})

useHead({
  title: 'Multi-Store Sync - Storvv',
})

const { formatCurrency } = usePreferences()
const toast = useToast()
const storesStore = useStoresStore()
const inventoryStore = useInventoryStore()
const userStore = useUserStore()
const { isStaff } = usePermissions()
const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()

// Security check - only super admins with Enterprise plan can access
const canAccess = computed(() => !isStaff.value && canUseSubscriptionFeature('multi_store_sync'))

// State
const activeTab = ref<'transfer' | 'reports' | 'history'>('transfer')
const stores = ref<any[]>([])
const sourceFolders = ref<any[]>([])
const destinationFolders = ref<any[]>([])
const availableItems = ref<any[]>([])
const transferHistory = ref<any[]>([])
const isTransferring = ref(false)
const showTrackingModal = ref(false)
const selectedTransferForTracking = ref<any>(null)
const trackingForm = ref({ carrier: '', trackingNumber: '' })

// Transfer Form
const transferForm = ref({
  sourceStoreId: '',
  destinationStoreId: '',
  folderId: '',
  destinationFolderId: '',
  items: {} as Record<string, number>,
  notes: '',
})

// Report Filters
const reportFilters = ref({
  dateRange: '30',
  storeIds: 'all',
})

// Consolidated Report
const consolidatedReport = ref({
  totalRevenue: 0,
  totalSales: 0,
  totalItems: 0,
  avgOrderValue: 0,
  storeBreakdown: [] as any[],
})

// Computed
const currentFolderHasSerialNumbers = computed(() => {
  const folder = sourceFolders.value.find(f => f.id === transferForm.value.folderId)
  return folder?.hasSerialNumbers || false
})

const canTransfer = computed(() => {
  return (
    transferForm.value.sourceStoreId &&
    transferForm.value.destinationStoreId &&
    transferForm.value.folderId &&
    transferForm.value.destinationFolderId &&
    Object.values(transferForm.value.items).some(qty => qty > 0)
  )
})


// Helper function to remove undefined values from object (Firestore doesn't allow undefined)
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined)
  }
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value)
      }
    }
    return cleaned
  }
  return obj
}

// Methods
const loadStores = async () => {
  try {
    await storesStore.fetchStores()
    stores.value = storesStore.stores
  } catch (error: any) {
    toast.error('Failed to load stores: ' + error.message)
  }
}

const loadSourceStoreInventory = async () => {
  if (!transferForm.value.sourceStoreId) return
  
  const storeId = transferForm.value.sourceStoreId
  
  try {
    // Switch to source store temporarily to load inventory
    const currentStoreId = storesStore.currentStoreId
    await storesStore.setCurrentStore(storeId)
    
    // Fetch folders
    await inventoryStore.fetchFolders()
    sourceFolders.value = inventoryStore.folders
    
    // Restore original store
    if (currentStoreId) {
      await storesStore.setCurrentStore(currentStoreId)
    }
  } catch (error: any) {
    toast.error('Failed to load inventory: ' + error.message)
  }
}

const loadDestinationStoreFolders = async () => {
  if (!transferForm.value.destinationStoreId) {
    destinationFolders.value = []
    transferForm.value.destinationFolderId = ''
    return
  }
  
  try {
    // Switch to destination store temporarily to load folders
    const currentStoreId = storesStore.currentStoreId
    await storesStore.setCurrentStore(transferForm.value.destinationStoreId)
    
    // Fetch folders
    await inventoryStore.fetchFolders()
    destinationFolders.value = inventoryStore.folders
    
    // Restore original store
    if (currentStoreId) {
      await storesStore.setCurrentStore(currentStoreId)
    }
  } catch (error: any) {
    toast.error('Failed to load destination folders: ' + error.message)
    destinationFolders.value = []
  }
}

const loadFolderItems = async () => {
  if (!transferForm.value.folderId || !transferForm.value.sourceStoreId) return
  
  try {
    const currentStoreId = storesStore.currentStoreId
    await storesStore.setCurrentStore(transferForm.value.sourceStoreId)
    
    await inventoryStore.fetchItems(transferForm.value.folderId)
    const folderItems = inventoryStore.items[transferForm.value.folderId] || []
    
    // Get folder info to check if it has serial numbers
    const folder = sourceFolders.value.find(f => f.id === transferForm.value.folderId)
    const hasSerialNumbers = folder?.hasSerialNumbers || false
    
    // Filter items based on type
    if (hasSerialNumbers) {
      // For serial numbers, only show unsold items (no dateOut) that haven't been transferred
      availableItems.value = folderItems.filter(item => {
        const dateOut = item.dateOut
        const isSold = dateOut && dateOut !== null && dateOut !== ''
        if (isSold) return false
        
        // Filter out items that have been transferred
        const isTransferred = item.isTransferred || item.transferredTo
        if (isTransferred) return false
        
        return true
      })
    } else {
      // For bulk items, show items that have available quantity (not sold and quantity > 0) and haven't been transferred
      availableItems.value = folderItems.filter(item => {
        const dateOut = item.dateOut
        const isSold = dateOut && dateOut !== null && dateOut !== ''
        if (isSold) return false
        
        // Filter out items that have been transferred
        const isTransferred = item.isTransferred || item.transferredTo
        if (isTransferred) return false
        
        const quantity = item.quantity || item.Quantity || 0
        return quantity > 0
      })
    }
    
    if (currentStoreId) {
      await storesStore.setCurrentStore(currentStoreId)
    }
  } catch (error: any) {
    toast.error('Failed to load items: ' + error.message)
  }
}

const getAvailableQuantity = (item: any) => {
  // Get folder info from sourceFolders
  const folder = sourceFolders.value.find(f => f.id === transferForm.value.folderId)
  const hasSerialNumbers = folder?.hasSerialNumbers || false
  
  if (hasSerialNumbers) {
    // For serial numbers, each unsold item counts as 1
    // Since we already filtered out sold items, each item in availableItems is available
    return 1
  }
  
  // For bulk items, use quantity field
  // Make sure we're not counting sold items
  const dateOut = item.dateOut
  if (dateOut && dateOut !== null && dateOut !== '') {
    return 0 // Item is sold
  }
  
  return item.quantity || item.Quantity || 0
}

// Create a transfer request (pending approval). No stock is moved until transfer is completed.
const requestTransfer = async () => {
  if (!canTransfer.value) return

  isTransferring.value = true
  try {
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    if (!userId) throw new Error('User not authenticated')
    if (userStore.userData?.role !== 'superAdmin') throw new Error('Only super admins can transfer items')

    const db = useFirestore().getFirestoreInstance()
    if (!db) throw new Error('Firestore not initialized')

    const sourceFolder = sourceFolders.value.find(f => f.id === transferForm.value.folderId)
    const hasSerialNumbers = sourceFolder?.hasSerialNumbers || false

    const { getDoc, setDoc, serverTimestamp, collection, doc: createDoc } = await import('firebase/firestore')
    const { getStoreDocument } = await import('~/composables/useFirestorePaths')
    const pathUserId = userId

    const sourceStoreRef = getStoreDocument(db, pathUserId, transferForm.value.sourceStoreId)
    const destStoreRef = getStoreDocument(db, pathUserId, transferForm.value.destinationStoreId)
    const [sourceStoreSnap, destStoreSnap] = await Promise.all([getDoc(sourceStoreRef), getDoc(destStoreRef)])
    if (!sourceStoreSnap.exists() || !destStoreSnap.exists()) throw new Error('One or both stores not found')
    const sourceStore = sourceStoreSnap.data()
    const destStore = destStoreSnap.data()
    if (sourceStore.ownerId !== userId || destStore.ownerId !== userId) throw new Error('You do not have permission to transfer items between these stores')

    const transferredItems: any[] = []
    for (const [itemId, qty] of Object.entries(transferForm.value.items)) {
      const quantity = Number(qty)
      if (quantity <= 0) continue
      const item = availableItems.value.find(i => i.id === itemId)
      transferredItems.push({
        itemId,
        quantity,
        itemName: item?.name || item?.itemName || 'Unnamed Item',
        serialNumber: item?.serialNo || item?.serialNumber || null,
      })
    }
    if (transferredItems.length === 0) {
      toast.error('No items to transfer')
      return
    }

    const transfersRef = collection(db, 'users', pathUserId, 'storeTransfers')
    const transferRef = createDoc(transfersRef)
    await setDoc(transferRef, {
      sourceStoreId: transferForm.value.sourceStoreId,
      destinationStoreId: transferForm.value.destinationStoreId,
      folderId: transferForm.value.folderId,
      destinationFolderId: transferForm.value.destinationFolderId,
      items: transferredItems,
      itemsCount: transferredItems.length,
      hasSerialNumbers: hasSerialNumbers,
      notes: transferForm.value.notes || '',
      status: 'pending_approval',
      createdBy: userId,
      createdAt: serverTimestamp(),
    })

    toast.success('Transfer requested. Approve it from Transfer History, then complete when stock arrives.')
    transferForm.value = { sourceStoreId: '', destinationStoreId: '', folderId: '', destinationFolderId: '', items: {}, notes: '' }
    availableItems.value = []
    sourceFolders.value = []
    destinationFolders.value = []
    await loadTransferHistory()
  } catch (error: any) {
    toast.error(error.message || 'Failed to create transfer request')
  } finally {
    isTransferring.value = false
  }
}

// Execute the actual stock move (used when completing an in_transit transfer).
const executeTransfer = async (transfer: any) => {
  const authStore = useAuthStore()
  const userId = authStore.currentUser?.uid
  if (!userId) throw new Error('User not authenticated')

  const db = useFirestore().getFirestoreInstance()
  if (!db) throw new Error('Firestore not initialized')

  const { getDoc, setDoc, updateDoc, serverTimestamp, query, where, getDocs, collection, doc } = await import('firebase/firestore')
  const { deleteDoc } = await import('firebase/firestore')
  const { getInventoryItemDocument, getInventoryItemsCollection, getStoreDocument } = await import('~/composables/useFirestorePaths')
  const pathUserId = userId

  const sourceStoreId = transfer.sourceStoreId
  const destinationStoreId = transfer.destinationStoreId
  const folderId = transfer.folderId
  const destinationFolderId = transfer.destinationFolderId
  const hasSerialNumbers = transfer.hasSerialNumbers || false
  const itemsToTransfer = (transfer.items || []).map((i: any) => ({ itemId: i.itemId, quantity: i.quantity || 1 }))

  const transferredItems: any[] = []
  const errors: string[] = []

  try {
  for (const { itemId, quantity } of itemsToTransfer) {
      try {
        const sourceItemRef = getInventoryItemDocument(db, pathUserId, sourceStoreId, itemId)
        const sourceItemSnap = await getDoc(sourceItemRef)
        
        if (!sourceItemSnap.exists()) {
          errors.push(`Item ${itemId} not found`)
          continue
        }

        const sourceItem = sourceItemSnap.data()
        
        // Check if item is sold
        if (sourceItem.dateOut) {
          errors.push(`Item ${itemId} has already been sold`)
          continue
        }

        if (hasSerialNumbers) {
          // For serial numbers, transfer the item itself (move, not duplicate)
          if (quantity !== 1) {
            errors.push(`Serial number items can only be transferred one at a time`)
            continue
          }

          // Create new item in destination store
          // Use pathUserId to ensure Firestore rules allow access
          const destItemsRef = getInventoryItemsCollection(db, pathUserId, destinationStoreId)
          const newItemRef = doc(destItemsRef)
          const { createdBy: _createdBy, dateOut: _dateOut, id: _id, ...itemDataWithoutSystemFields } = sourceItem
          const cleanedItemData = removeUndefined(itemDataWithoutSystemFields)
          const originalDateIn = sourceItem.dateIn || sourceItem.DateIn || null
          await setDoc(newItemRef, {
            ...cleanedItemData,
            id: newItemRef.id,
            folderId: destinationFolderId,
            storeId: destinationStoreId,
            dateIn: originalDateIn,
            createdBy: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            transferredFrom: sourceStoreId,
            transferredFromFolder: folderId,
            transferredAt: serverTimestamp(),
            isTransferred: true,
          })
          await deleteDoc(sourceItemRef)
          transferredItems.push({ itemId, itemName: sourceItem.name || sourceItem.itemName || 'Unnamed Item', quantity: 1, serialNumber: sourceItem.serialNo || sourceItem.serialNumber || null })
        } else {
          const availableQty = sourceItem.quantity || sourceItem.Quantity || 0
          if (availableQty < quantity) {
            errors.push(`Insufficient quantity for item ${itemId}. Available: ${availableQty}, Requested: ${quantity}`)
            continue
          }
          const newQty = availableQty - quantity
          if (newQty <= 0) {
            await deleteDoc(sourceItemRef)
          } else {
            await updateDoc(sourceItemRef, { quantity: newQty, Quantity: newQty, updatedAt: serverTimestamp() })
          }
          const destItemsRef = getInventoryItemsCollection(db, pathUserId, destinationStoreId)
          const existingItemsQuery = query(
            destItemsRef,
            where('folderId', '==', destinationFolderId),
            where('name', '==', sourceItem.name || sourceItem.itemName || '')
          )
          const existingItemsSnap = await getDocs(existingItemsQuery)
          if (existingItemsSnap.empty) {
            const newItemRef = doc(destItemsRef)
            const { createdBy: _, ...itemDataWithoutCreatedBy } = sourceItem
            const cleanedItemData = removeUndefined(itemDataWithoutCreatedBy)
            const originalDateIn = sourceItem.dateIn || sourceItem.DateIn || null
            await setDoc(newItemRef, {
              ...cleanedItemData,
              id: newItemRef.id,
              folderId: destinationFolderId,
              storeId: destinationStoreId,
              dateIn: originalDateIn,
              quantity,
              Quantity: quantity,
              createdBy: userId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              transferredFrom: sourceStoreId,
              transferredFromFolder: folderId,
              transferredAt: serverTimestamp(),
            })
          } else {
            const existingItem = existingItemsSnap.docs[0]
            if (existingItem) {
              const existingQty = existingItem.data().quantity || existingItem.data().Quantity || 0
              const existingData = existingItem.data()
              const originalDateIn = existingData.dateIn || existingData.DateIn || (sourceItem.dateIn || sourceItem.DateIn || null)
              await updateDoc(existingItem.ref, {
                quantity: existingQty + quantity,
                Quantity: existingQty + quantity,
                dateIn: originalDateIn,
                transferredAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
            }
          }
          transferredItems.push({ itemId, itemName: sourceItem.name || sourceItem.itemName || 'Unnamed Item', quantity })
        }
      } catch (error: any) {
        errors.push(`Error transferring item ${itemId}: ${error.message}`)
      }
    }

    const transferRef = doc(db, 'users', pathUserId, 'storeTransfers', transfer.id)
    await updateDoc(transferRef, {
      status: errors.length > 0 ? 'partial' : 'completed',
      completedAt: serverTimestamp(),
      completedBy: userId,
      items: transferredItems.length ? transferredItems : transfer.items,
      itemsCount: transferredItems.length || (transfer.items || []).length,
    })

    if (errors.length > 0) {
      toast.warning(`Transfer completed with ${errors.length} errors. ${transferredItems.length} items moved.`)
    } else {
      toast.success(`Stock updated: ${transferredItems.length} items moved to ${getStoreName(destinationStoreId)}.`)
    }
    await loadTransferHistory()
  } catch (err: any) {
    toast.error(err?.message || 'Failed to complete transfer')
    throw err
  }
}

const approveTransfer = async (transfer: any) => {
  const authStore = useAuthStore()
  const userId = authStore.currentUser?.uid
  if (!userId) return
  const db = useFirestore().getFirestoreInstance()
  if (!db) return
  const { updateDoc, serverTimestamp, doc } = await import('firebase/firestore')
  const pathUserId = userId
  const transferRef = doc(db, 'users', pathUserId, 'storeTransfers', transfer.id)
  await updateDoc(transferRef, { status: 'in_transit', approvedAt: serverTimestamp(), approvedBy: userId })
  toast.success('Transfer approved. Stock is in transit.')
  await loadTransferHistory()
}

const cancelTransfer = async (transfer: any) => {
  const authStore = useAuthStore()
  const userId = authStore.currentUser?.uid
  if (!userId) return
  const db = useFirestore().getFirestoreInstance()
  if (!db) return
  const { updateDoc, doc } = await import('firebase/firestore')
  const pathUserId = userId
  const transferRef = doc(db, 'users', pathUserId, 'storeTransfers', transfer.id)
  await updateDoc(transferRef, { status: 'cancelled' })
  toast.success('Transfer cancelled.')
  await loadTransferHistory()
}

const openTrackingModal = (t: any) => {
  selectedTransferForTracking.value = t
  trackingForm.value = { carrier: t.carrier || '', trackingNumber: t.trackingNumber || '' }
  showTrackingModal.value = true
}

const saveTracking = async () => {
  const t = selectedTransferForTracking.value
  if (!t) return
  const authStore = useAuthStore()
  const userId = authStore.currentUser?.uid
  if (!userId) return
  const db = useFirestore().getFirestoreInstance()
  if (!db) return
  const { updateDoc, doc } = await import('firebase/firestore')
  const pathUserId = userId
  const transferRef = doc(db, 'users', pathUserId, 'storeTransfers', t.id)
  await updateDoc(transferRef, { carrier: trackingForm.value.carrier || null, trackingNumber: trackingForm.value.trackingNumber || null })
  showTrackingModal.value = false
  selectedTransferForTracking.value = null
  trackingForm.value = { carrier: '', trackingNumber: '' }
  toast.success('Tracking info saved.')
  await loadTransferHistory()
}

const completeTransfer = async (transfer: any) => {
  isTransferring.value = true
  try {
    await executeTransfer(transfer)
  } catch (e) {
    // error already toasts in executeTransfer
  } finally {
    isTransferring.value = false
  }
}

const loadTransferHistory = async () => {
  try {
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    
    if (!userId) {
      console.log('[TransferHistory] No user ID')
      return
    }

    // Wait for user data to be loaded if not already
    if (!userStore.userData) {
      await userStore.fetchUserData(userId)
    }

    // Verify user is super admin
    if (userStore.userData?.role !== 'superAdmin') {
      console.log('[TransferHistory] User is not super admin, role:', userStore.userData?.role)
      return
    }

    // Get Firestore instance
    const db = useFirestore().getFirestoreInstance()
    if (!db) {
      console.error('[TransferHistory] Firestore not initialized')
      return
    }

    // Import Firebase functions
    const { collection, query, orderBy, getDocs, getDoc, where: firestoreWhere } = await import('firebase/firestore')
    const pathUserId = userId

    console.log('[TransferHistory] Loading transfer history for userId:', pathUserId, 'auth.uid:', authStore.currentUser?.uid)

    // Fetch transfer history from Firestore
    // The path must match: users/{userId}/storeTransfers where userId == request.auth.uid
    const transfersRef = collection(db, 'users', pathUserId, 'storeTransfers')
    
    try {
      // Try with orderBy first, if it fails due to missing index, try without
      let transfersQuery
      try {
        transfersQuery = query(transfersRef, orderBy('createdAt', 'desc'))
      } catch (queryError: any) {
        // If orderBy fails, try without it (might be missing index)
        console.warn('[TransferHistory] orderBy failed, trying without:', queryError.message)
        transfersQuery = query(transfersRef)
      }
      
      const transfersSnap = await getDocs(transfersQuery)

      console.log('[TransferHistory] Successfully loaded', transfersSnap.docs.length, 'transfers')

      // Sort manually if orderBy didn't work
      const transfers = transfersSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
        }
      })

      // Sort by createdAt descending if available
      const sortedTransfers: any[] = transfers.sort((a: any, b: any) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt ? new Date(a.createdAt) : new Date(0))
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt ? new Date(b.createdAt) : new Date(0))
        return bDate.getTime() - aDate.getTime()
      })

      // Fetch item details for transfers that don't have item names stored (backward compatibility)
      const { getInventoryItemDocument, getInventoryItemsCollection } = await import('~/composables/useFirestorePaths')
      
      for (const transfer of sortedTransfers) {
        if (transfer.items && Array.isArray(transfer.items)) {
          for (const item of transfer.items as any[]) {
            // If item already has itemName, use it (for new transfers)
            if (item.itemName && item.itemName !== 'Item' && item.itemName !== 'Item (deleted or moved)') {
              continue
            }
            
            // Try to fetch item name if not stored
            if (!item.itemName || item.itemName === 'Item' || item.itemName === 'Item (deleted or moved)') {
              try {
                const sourceStoreId = (transfer as any).sourceStoreId
                const destinationStoreId = (transfer as any).destinationStoreId
                const destinationFolderId = (transfer as any).destinationFolderId
                
                // First, try to find in destination store (where item was moved to)
                // Search for items that were transferred from the source store
                if (destinationStoreId && destinationFolderId) {
                  try {
                    const destItemsRef = getInventoryItemsCollection(db, pathUserId, destinationStoreId)
                    const transferredItemsQuery = query(
                      destItemsRef,
                      firestoreWhere('folderId', '==', destinationFolderId),
                      firestoreWhere('transferredFrom', '==', sourceStoreId),
                      firestoreWhere('isTransferred', '==', true)
                    )
                    const transferredItemsSnap = await getDocs(transferredItemsQuery)
                    
                    if (!transferredItemsSnap.empty) {
                      // Find the item that matches the original itemId or was transferred around the same time
                      const transferredItems = transferredItemsSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                      })) as any[]
                      
                      // Try to match by original itemId if stored, or just use the first one if only one item
                      let matchedItem: any = null
                      if (transferredItems.length === 1) {
                        matchedItem = transferredItems[0]
                      } else {
                        // Try to find by matching transferredFromFolder and itemId
                        matchedItem = transferredItems.find((ti: any) => {
                          const transferredFromFolder = ti.transferredFromFolder || ti.folderId
                          return transferredFromFolder === (transfer as any).folderId
                        })
                        if (!matchedItem && transferredItems.length > 0) {
                          matchedItem = transferredItems[0] // Fallback to first item
                        }
                      }
                      
                      if (matchedItem) {
                        item.itemName = matchedItem.name || matchedItem.itemName || 'Unnamed Item'
                        if (matchedItem.serialNo || matchedItem.serialNumber) {
                          item.serialNumber = matchedItem.serialNo || matchedItem.serialNumber
                        }
                        continue // Successfully found, skip other attempts
                      }
                    }
                  } catch (queryError) {
                    console.warn('[TransferHistory] Error querying transferred items:', queryError)
                  }
                }
                
                // Fallback: Try source store (item might still be there if transfer failed or was partial)
                if (sourceStoreId && item.itemId) {
                  try {
                    const itemRef = getInventoryItemDocument(db, pathUserId, sourceStoreId, item.itemId)
                    const itemSnap = await getDoc(itemRef)
                    if (itemSnap.exists()) {
                      const itemData = itemSnap.data() as any
                      item.itemName = itemData.name || itemData.itemName || 'Unnamed Item'
                      if (itemData.serialNo || itemData.serialNumber) {
                        item.serialNumber = itemData.serialNo || itemData.serialNumber
                      }
                      continue // Successfully found
                    }
                  } catch (sourceError) {
                    console.warn('[TransferHistory] Error fetching from source store:', sourceError)
                  }
                }
                
                // If still no name found, use itemId as fallback
                if (!item.itemName || item.itemName === 'Item' || item.itemName === 'Item (deleted or moved)') {
                  item.itemName = `Item ${item.itemId?.substring(0, 8) || 'Unknown'}`
                }
              } catch (fetchError) {
                console.warn('[TransferHistory] Error fetching item details:', fetchError)
                // Final fallback
                if (!item.itemName || item.itemName === 'Item' || item.itemName === 'Item (deleted or moved)') {
                  item.itemName = `Item ${item.itemId?.substring(0, 8) || 'Unknown'}`
                }
              }
            }
          }
        }
      }

      transferHistory.value = sortedTransfers
    } catch (queryError: any) {
      console.error('[TransferHistory] Query error:', queryError)
      // If it's a permission error, provide more helpful message
      if (queryError.code === 'permission-denied' || queryError.message?.includes('permission')) {
        console.error('[TransferHistory] Permission denied. Check:')
        console.error('  1. User is logged in as super admin:', userStore.userData?.role)
        console.error('  2. pathUserId matches auth.uid:', pathUserId, '===', authStore.currentUser?.uid)
        console.error('  3. Firestore rules allow read access to users/{userId}/storeTransfers')
        // Don't show error toast if it's just that there are no transfers yet
        if (queryError.message?.includes('index')) {
          throw new Error('Firestore index required. Please create a composite index for storeTransfers collection on createdAt field.')
        }
        throw new Error('Permission denied. Please ensure you are logged in as a super admin and Firestore rules are properly configured.')
      }
      // If it's an index error, try without orderBy
      if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
        console.log('[TransferHistory] Index error, trying without orderBy')
        const transfersQuery = query(transfersRef)
        const transfersSnap = await getDocs(transfersQuery)
        transferHistory.value = transfersSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as object),
        }))
        return
      }
      throw queryError
    }
  } catch (error: any) {
    console.error('[TransferHistory] Failed to load transfer history:', error)
    // Only show toast if it's not a silent return
    if (error.message && !error.message.includes('No user ID') && !error.message.includes('not super admin')) {
      toast.error('Failed to load transfer history: ' + error.message)
    }
  }
}

const loadConsolidatedReports = async () => {
  try {
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    
    if (!userId) return

    // Verify user is super admin
    if (userStore.userData?.role !== 'superAdmin') {
      return
    }

    // Get Firestore instance
    const db = useFirestore().getFirestoreInstance()
    if (!db) {
      console.error('Firestore not initialized')
      return
    }

    // Import Firebase functions
    const { collection, query, where, getDocs, Timestamp } = await import('firebase/firestore')
    const { getReceiptsCollection } = await import('~/composables/useFirestorePaths')
    const pathUserId = userId

    // Calculate date range
    const days = reportFilters.value.dateRange === 'all' ? null : parseInt(reportFilters.value.dateRange)
    const startDate = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null

    // Get stores to include
    const storesToInclude = reportFilters.value.storeIds === 'all' 
      ? stores.value 
      : stores.value.filter(s => s.id === reportFilters.value.storeIds)

    let totalRevenue = 0
    let totalSales = 0
    let totalItems = 0
    const storeBreakdown: any[] = []

    // Aggregate data from each store
    for (const store of storesToInclude) {
      const receiptsRef = getReceiptsCollection(db, pathUserId, store.id)
      let receiptsQuery: any = query(receiptsRef)
      
      if (startDate) {
        receiptsQuery = query(receiptsRef, where('date', '>=', Timestamp.fromDate(startDate)))
      }
      
      const receiptsSnap = await getDocs(receiptsQuery)
      const receipts = receiptsSnap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as object),
      }))

      const storeRevenue = receipts.reduce((sum, r: any) => sum + (r.total || 0), 0)
      const storeSales = receipts.length
      const storeItems = receipts.reduce((sum, r: any) => sum + (r.itemsCount || 0), 0)

      totalRevenue += storeRevenue
      totalSales += storeSales
      totalItems += storeItems

      storeBreakdown.push({
        id: store.id,
        name: store.name || store.branchName || store.id,
        revenue: storeRevenue,
        sales: storeSales,
        items: storeItems,
      })
    }

    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

    consolidatedReport.value = {
      totalRevenue,
      totalSales,
      totalItems,
      avgOrderValue,
      storeBreakdown,
    }
  } catch (error: any) {
    console.error('Failed to load consolidated report:', error)
    toast.error('Failed to load consolidated report: ' + error.message)
  }
}

const exportConsolidatedReport = async () => {
  try {
    const authStore = useAuthStore()
    const userId = authStore.currentUser?.uid
    
    if (!userId) {
      toast.error('User not authenticated')
      return
    }

    // Load report data first if not already loaded
    if (consolidatedReport.value.totalSales === 0 && consolidatedReport.value.storeBreakdown.length === 0) {
      await loadConsolidatedReports()
    }

    // Generate PDF using jsPDF
    const { default: jsPDF } = await import('jspdf')

    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('Consolidated Report', 14, 20)
    
    // Add date range
    doc.setFontSize(10)
    const dateRangeText = reportFilters.value.dateRange === 'all' 
      ? 'All Time' 
      : `Last ${reportFilters.value.dateRange} days`
    doc.text(`Date Range: ${dateRangeText}`, 14, 30)
    
    // Add summary
    doc.setFontSize(12)
    doc.text('Summary', 14, 40)
    doc.setFontSize(10)
    doc.text(`Total Revenue: ${formatCurrency(consolidatedReport.value.totalRevenue)}`, 14, 48)
    doc.text(`Total Sales: ${consolidatedReport.value.totalSales}`, 14, 54)
    doc.text(`Total Items: ${consolidatedReport.value.totalItems}`, 14, 60)
    doc.text(`Average Order Value: ${formatCurrency(consolidatedReport.value.avgOrderValue)}`, 14, 66)

    // Add store breakdown table (simple table without autoTable)
    if (consolidatedReport.value.storeBreakdown.length > 0) {
      let yPos = 80
      doc.setFontSize(12)
      doc.text('Store Breakdown', 14, yPos)
      yPos += 8
      
      // Table header
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Store', 14, yPos)
      doc.text('Revenue', 70, yPos)
      doc.text('Sales', 120, yPos)
      doc.text('Items', 150, yPos)
      yPos += 6
      
      // Table rows
      doc.setFont('helvetica', 'normal')
      for (const store of consolidatedReport.value.storeBreakdown) {
        if (yPos > 280) {
          doc.addPage()
          yPos = 20
        }
      doc.text(store.name || '', 14, yPos)
      doc.text(formatCurrency(store.revenue || 0), 70, yPos)
      doc.text((store.sales || 0).toString(), 120, yPos)
      doc.text((store.items || 0).toString(), 150, yPos)
        yPos += 6
      }
    }

    // Save PDF
    const fileName = `consolidated-report-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    toast.success('Report exported successfully!')
  } catch (error: any) {
    console.error('Export error:', error)
    toast.error('Export failed: ' + error.message)
  }
}

const getStoreName = (storeId: string) => {
  const store = stores.value.find(s => s.id === storeId)
  return store?.name || store?.branchName || storeId
}

const formatTransferProductSummary = (transfer: any) => {
  const items = transfer.items || []
  const totalUnits = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0)
  if (items.length === 0) return `${transfer.itemsCount ?? 0} items`
  if (items.length === 1 && totalUnits === 1) return '1 item'
  return `${totalUnits} units · ${items.length} product${items.length === 1 ? '' : 's'}`
}

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  pending_approval: 'Pending approval',
  in_transit: 'In transit',
  completed: 'Completed',
  completed_partial: 'Completed (partial)',
  partial: 'Completed (partial)',
  cancelled: 'Cancelled',
}

const getTransferStatusLabel = (status: string) => {
  return TRANSFER_STATUS_LABELS[status] || (status || 'Pending')
}

const getTransferStatusClass = (status: string) => {
  switch (status) {
    case 'pending_approval':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'in_transit':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'completed':
    case 'partial':
    case 'completed_partial':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'cancelled':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
  }
}

const isTransferActionable = (transfer: any) => {
  const s = (transfer.status || '').toLowerCase()
  return s === 'pending_approval' || s === 'in_transit'
}

const formatDate = (date: any) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Lifecycle
onMounted(async () => {
  if (canAccess.value) {
    await loadStores()
    // Load transfer history after a short delay to ensure user data is loaded
    setTimeout(async () => {
      await loadTransferHistory()
    }, 500)
    await loadConsolidatedReports()
  }
})
</script>
