import { computed, type Ref } from 'vue'
import type { Component } from 'vue'
import {
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  BanknotesIcon,
  ChartBarIcon,
  CubeIcon,
  CurrencyDollarIcon,
  InboxArrowDownIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
} from '~/utils/app-icons'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useCustomerBuybacksStore } from '~/stores/customerBuybacks'
import { useSellerLoanOutsStore } from '~/stores/sellerLoanOuts'
import { useCustomerAccountsStore } from '~/stores/customerAccounts'
import { useUserStore } from '~/stores/user'
import { usePreferences } from '~/composables/usePreferences'
import { usePermissions } from '~/composables/usePermissions'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import { useDashboardInsights } from '~/composables/useDashboardInsights'
import { useDashboardPaths } from '~/composables/useDashboardPaths'
import type { InventoryItem } from '~/stores/inventory'
import type { Receipt } from '~/stores/receipts'
import {
  sumReceiptCogs,
  sumReceiptGrossProfit,
  receiptLineRevenue,
} from '~/utils/inventory-item-cost'

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly'

export interface AnalyticsFeatureInsightMetric {
  label: string
  value: string
}

export interface AnalyticsFeatureInsight {
  id: string
  icon: Component
  title: string
  description: string
  highlight?: string
  metrics: AnalyticsFeatureInsightMetric[]
  href?: string
  linkLabel?: string
}

function receiptDate(receipt: Receipt): Date {
  return receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
}

function getPeriodCutoff(period: AnalyticsPeriod): Date {
  const now = new Date()
  const cutoff = new Date()
  switch (period) {
    case 'daily':
      cutoff.setDate(now.getDate() - 30)
      break
    case 'weekly':
      cutoff.setDate(now.getDate() - 84)
      break
    case 'monthly':
      cutoff.setMonth(now.getMonth() - 12)
      break
  }
  return cutoff
}

function periodLabel(period: AnalyticsPeriod): string {
  switch (period) {
    case 'daily':
      return 'Last 30 days'
    case 'weekly':
      return 'Last 12 weeks'
    case 'monthly':
      return 'Last 12 months'
  }
}

function inPeriod(date: Date | undefined, cutoff: Date): boolean {
  if (!date) return false
  const now = new Date()
  return date >= cutoff && date <= now
}

export function useAnalyticsFeatureInsights(
  selectedPeriod: Ref<AnalyticsPeriod>,
  folderItems: Ref<Record<string, InventoryItem[]>>
) {
  const receiptsStore = useReceiptsStore()
  const inventoryStore = useInventoryStore()
  const departmentsStore = useDepartmentsStore()
  const buybacksStore = useCustomerBuybacksStore()
  const sellerLoansStore = useSellerLoanOutsStore()
  const customerAccountsStore = useCustomerAccountsStore()
  const userStore = useUserStore()
  const { formatCurrency } = usePreferences()
  const { canViewProfitAndCost } = usePermissions()
  const { canUse: canUseSubscriptionFeature } = useSubscriptionFeatures()
  const { dashPath } = useDashboardPaths()

  const dashboardInsights = useDashboardInsights(folderItems)
  const {
    outstandingCount,
    outstandingBalanceTotal,
    inStockCount,
    outOfStockCount,
    inventoryTotalValue,
    sellThroughRate,
    totalFolders,
    totalDepartments,
    totalStaff,
  } = dashboardInsights

  const periodCutoff = computed(() => getPeriodCutoff(selectedPeriod.value))
  const periodText = computed(() => periodLabel(selectedPeriod.value))

  const filteredReceipts = computed(() =>
    receiptsStore.receipts.filter((r) => inPeriod(receiptDate(r), periodCutoff.value))
  )

  const completedInPeriod = computed(() =>
    filteredReceipts.value.filter((r) => r.status === 'completed')
  )

  const pendingInPeriod = computed(() =>
    filteredReceipts.value.filter((r) => r.status === 'pending')
  )

  const refundedInPeriod = computed(() =>
    filteredReceipts.value.filter((r) => r.status === 'refunded')
  )

  const balanceDueInPeriod = computed(() =>
    filteredReceipts.value.filter((r) => r.status === 'balance_due')
  )

  const periodRevenue = computed(() =>
    completedInPeriod.value.reduce((sum, r) => sum + (r.total || 0), 0)
  )

  const periodOrders = computed(() => filteredReceipts.value.length)

  const periodAov = computed(() =>
    completedInPeriod.value.length > 0
      ? periodRevenue.value / completedInPeriod.value.length
      : 0
  )

  const itemsSoldInPeriod = computed(() => {
    let count = 0
    completedInPeriod.value.forEach((r) => {
      r.items?.forEach((item) => {
        count += item.quantity || 0
      })
    })
    return count
  })

  const refundAmountInPeriod = computed(() =>
    refundedInPeriod.value.reduce((sum, r) => sum + (r.total || 0), 0)
  )

  const refundRateInPeriod = computed(() => {
    const total = completedInPeriod.value.length + refundedInPeriod.value.length
    return total > 0 ? (refundedInPeriod.value.length / total) * 100 : 0
  })

  const uniqueCustomersInPeriod = computed(() => {
    const keys = new Set<string>()
    filteredReceipts.value.forEach((r) => {
      const key = r.customerEmail?.trim() || r.customerPhone?.trim()
      if (key) keys.add(key)
    })
    return keys.size
  })

  const repeatPurchaseRate = computed(() => {
    const customerOrders = new Map<string, number>()
    filteredReceipts.value.forEach((receipt) => {
      const key = receipt.customerEmail?.trim() || receipt.customerPhone?.trim()
      if (!key) return
      customerOrders.set(key, (customerOrders.get(key) || 0) + 1)
    })
    const repeatCustomers = Array.from(customerOrders.values()).filter((c) => c > 1).length
    return customerOrders.size > 0 ? (repeatCustomers / customerOrders.size) * 100 : 0
  })

  function lookupInventoryItem(itemId: string): InventoryItem | null {
    for (const list of Object.values(inventoryStore.items)) {
      const hit = list.find((i) => i.id === itemId)
      if (hit) return hit
    }
    return null
  }

  const periodGrossProfit = computed(() =>
    sumReceiptGrossProfit(completedInPeriod.value, lookupInventoryItem)
  )

  const periodCogs = computed(() =>
    sumReceiptCogs(completedInPeriod.value, lookupInventoryItem)
  )

  const grossMarginPercent = computed(() => {
    const revenue = completedInPeriod.value.reduce(
      (sum, receipt) => sum + receiptLineRevenue(receipt),
      0
    )
    if (revenue <= 0) return null
    return (periodGrossProfit.value / revenue) * 100
  })

  const buybacksInPeriod = computed(() =>
    buybacksStore.buybacks.filter(
      (b) => b.status === 'completed' && inPeriod(b.createdAt, periodCutoff.value)
    )
  )

  const buybackPaidInPeriod = computed(() =>
    buybacksInPeriod.value.reduce((sum, b) => sum + (b.purchasePrice || 0), 0)
  )

  const activeLoans = computed(() =>
    sellerLoansStore.loans.filter((loan) => loan.status === 'active')
  )

  const unitsOnLoan = computed(() =>
    activeLoans.value.reduce((sum, loan) => sum + (loan.lines?.length || 0), 0)
  )

  const loansReturnedInPeriod = computed(() =>
    sellerLoansStore.loans.filter(
      (loan) => loan.status === 'returned' && inPeriod(loan.returnedAt, periodCutoff.value)
    )
  )

  const loansSoldInPeriod = computed(() =>
    sellerLoansStore.loans.filter(
      (loan) => loan.status === 'sold' && inPeriod(loan.soldAt, periodCutoff.value)
    )
  )

  const customerAccounts = computed(() =>
    Object.values(customerAccountsStore.accountsByContactKey)
  )

  const accountsWithBalance = computed(() =>
    customerAccounts.value.filter((a) => (a.accountBalance || 0) > 0)
  )

  const totalCreditOwed = computed(() =>
    accountsWithBalance.value.reduce((sum, a) => sum + (a.accountBalance || 0), 0)
  )

  const featureInsights = computed((): AnalyticsFeatureInsight[] => {
    const insights: AnalyticsFeatureInsight[] = [
      {
        id: 'sales',
        icon: ReceiptPercentIcon,
        title: 'Sales & orders',
        description: `Completed sales and order volume · ${periodText.value.toLowerCase()}`,
        highlight: formatCurrency(periodRevenue.value),
        metrics: [
          { label: 'Completed', value: String(completedInPeriod.value.length) },
          { label: 'Items sold', value: String(itemsSoldInPeriod.value) },
          { label: 'Orders', value: String(periodOrders.value) },
          { label: 'Avg. order', value: formatCurrency(periodAov.value) },
        ],
        href: dashPath('/receipts'),
        linkLabel: 'Open sales',
      },
      {
        id: 'returns',
        icon: ArrowUturnLeftIcon,
        title: 'Returns & refunds',
        description: `Refunded sales in ${periodText.value.toLowerCase()}`,
        highlight:
          refundedInPeriod.value.length > 0
            ? formatCurrency(refundAmountInPeriod.value)
            : 'No refunds',
        metrics: [
          { label: 'Refunded', value: String(refundedInPeriod.value.length) },
          { label: 'Refund rate', value: `${refundRateInPeriod.value.toFixed(1)}%` },
          { label: 'Pending', value: String(pendingInPeriod.value.length) },
          { label: 'Balance due', value: String(balanceDueInPeriod.value.length) },
        ],
        href: dashPath('/receipts'),
        linkLabel: 'Review sales',
      },
      {
        id: 'outstanding',
        icon: BanknotesIcon,
        title: 'Outstanding balances',
        description: 'Open balances needing follow-up (all time)',
        highlight: formatCurrency(outstandingBalanceTotal.value),
        metrics: [
          { label: 'Open balances', value: String(outstandingCount.value) },
          {
            label: 'In period',
            value: String(balanceDueInPeriod.value.length),
          },
        ],
        href: dashPath('/receipts?tab=outstanding'),
        linkLabel: 'Review balances',
      },
      {
        id: 'inventory',
        icon: CubeIcon,
        title: 'Inventory',
        description: 'Stock on hand and sell-through',
        highlight: formatCurrency(inventoryTotalValue.value),
        metrics: [
          { label: 'Available units', value: String(inStockCount.value) },
          { label: 'Sold units', value: String(outOfStockCount.value) },
          { label: 'Categories', value: String(totalFolders.value) },
          { label: 'Sell-through', value: `${sellThroughRate.value}%` },
        ],
        href: dashPath('/inventory'),
        linkLabel: 'Open inventory',
      },
      {
        id: 'customers',
        icon: UserGroupIcon,
        title: 'Customers',
        description: `Unique buyers · ${periodText.value.toLowerCase()}`,
        highlight: `${uniqueCustomersInPeriod.value} customer${
          uniqueCustomersInPeriod.value === 1 ? '' : 's'
        }`,
        metrics: [
          {
            label: 'Repeat rate',
            value: `${repeatPurchaseRate.value.toFixed(0)}%`,
          },
          { label: 'Completed sales', value: String(completedInPeriod.value.length) },
        ],
        href: dashPath('/receipts?tab=customers'),
        linkLabel: 'View customers',
      },
      {
        id: 'operations',
        icon: ChartBarIcon,
        title: 'Operations',
        description: 'Team and branch structure',
        metrics: [
          { label: 'Departments', value: String(totalDepartments.value) },
          { label: 'Staff', value: String(totalStaff.value) },
          { label: 'Categories', value: String(totalFolders.value) },
          {
            label: 'Book value',
            value: formatCurrency(inventoryTotalValue.value),
          },
        ],
        href: dashPath('/settings'),
        linkLabel: 'Settings',
      },
    ]

    if (canViewProfitAndCost.value) {
      insights.splice(5, 0, {
        id: 'profit',
        icon: CurrencyDollarIcon,
        title: 'Profit & cost',
        description: `Gross profit on completed sales · ${periodText.value.toLowerCase()}`,
        highlight: formatCurrency(periodGrossProfit.value),
        metrics: [
          { label: 'COGS', value: formatCurrency(periodCogs.value) },
          {
            label: 'Gross margin',
            value:
              grossMarginPercent.value !== null
                ? `${grossMarginPercent.value.toFixed(1)}%`
                : '-',
          },
        ],
        href: dashPath('/inventory'),
        linkLabel: 'Unit costs',
      })
    }

    if (userStore.isSuperAdmin) {
      insights.push({
        id: 'buybacks',
        icon: InboxArrowDownIcon,
        title: 'Customer buybacks',
        description: `Trade-ins recorded · ${periodText.value.toLowerCase()}`,
        highlight:
          buybacksInPeriod.value.length > 0
            ? formatCurrency(buybackPaidInPeriod.value)
            : 'No buybacks',
        metrics: [
          { label: 'Buybacks', value: String(buybacksInPeriod.value.length) },
          { label: 'Total paid', value: formatCurrency(buybackPaidInPeriod.value) },
        ],
        href: dashPath('/buybacks'),
        linkLabel: 'View buybacks',
      })
    }

    if (canUseSubscriptionFeature('customer_balance')) {
      insights.push({
        id: 'customer-balance',
        icon: CurrencyDollarIcon,
        title: 'Customer balance',
        description: 'Credit ledger balances owed to the store',
        highlight: formatCurrency(totalCreditOwed.value),
        metrics: [
          {
            label: 'Accounts owing',
            value: String(accountsWithBalance.value.length),
          },
          { label: 'Total owed', value: formatCurrency(totalCreditOwed.value) },
        ],
        href: dashPath('/receipts?tab=customers'),
        linkLabel: 'Manage balances',
      })
    }

    if (canUseSubscriptionFeature('seller_loans')) {
      insights.push({
        id: 'stock-loans',
        icon: ArchiveBoxIcon,
        title: 'Stock loans',
        description: 'Serialized inventory lent to borrowers',
        highlight: `${activeLoans.value.length} active loan${
          activeLoans.value.length === 1 ? '' : 's'
        }`,
        metrics: [
          { label: 'Units on loan', value: String(unitsOnLoan.value) },
          { label: 'Returned', value: String(loansReturnedInPeriod.value.length) },
          { label: 'Sold (borrower)', value: String(loansSoldInPeriod.value.length) },
        ],
        href: dashPath('/seller-loans'),
        linkLabel: 'View loans',
      })
    }

    return insights
  })

  return {
    featureInsights,
    periodText,
    inStockCount,
    outOfStockCount,
    inStockPercentage: dashboardInsights.inStockPercentage,
    soldPercentage: dashboardInsights.soldPercentage,
    lowStockPercentage: dashboardInsights.lowStockPercentage,
    lowStockItems: dashboardInsights.lowStockItems,
    inventoryTotalValue,
  }
}
