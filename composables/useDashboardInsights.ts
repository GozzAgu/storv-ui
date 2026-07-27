import { computed, type Ref } from 'vue'
import { useReceiptsStore } from '~/stores/receipts'
import { useInventoryStore } from '~/stores/inventory'
import { useDepartmentsStore } from '~/stores/departments'
import { useUserStore } from '~/stores/user'
import { usePreferences } from '~/composables/usePreferences'
import type { InventoryItem } from '~/stores/inventory'
import type { Receipt } from '~/stores/receipts'

export type DashboardAlertLevel = 'critical' | 'warning' | 'info'

export interface DashboardAlert {
  id: string
  level: DashboardAlertLevel
  title: string
  description: string
  href: string
  cta: string
}

export interface DashboardPaymentSlice {
  method: string
  label: string
  count: number
  revenue: number
  share: number
}

export interface DashboardRecentReceipt {
  id: string
  receiptNumber: string
  customerName: string
  status: Receipt['status']
  statusLabel: string
  paymentMethod: string
  time: string
  amount: string
  amountClass: string
}

export interface DashboardTopProduct {
  id: string
  name: string
  sales: number
  revenue: number
  share: number
}

export interface DashboardLowStockRow {
  id: string
  name: string
  quantity: number
  folderName: string
  folderId: string
  threshold: number
  isSerialNumber: boolean
}

export interface DashboardQuickLink {
  label: string
  description: string
  href: string
}

function receiptDate(receipt: Receipt): Date {
  return receipt.date?.toDate ? receipt.date.toDate() : new Date(receipt.date)
}

/** UTC calendar day `YYYY-MM-DD` (always a string; avoids `split('T')[0]` possibly being undefined). */
function toIsoDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return date.toLocaleDateString()
}

function statusLabel(status: Receipt['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'pending':
      return 'Pending'
    case 'refunded':
      return 'Refunded'
    case 'balance_due':
      return 'Balance due'
    case 'cancelled':
      return 'Cancelled'
    default:
      return String(status)
  }
}

function formatPaymentMethod(method: string | undefined): string {
  if (!method?.trim()) return 'Not set'
  const m = method.trim()
  return m.charAt(0).toUpperCase() + m.slice(1)
}

/**
 * Aggregates receipts, inventory, and department data for the home dashboard.
 */
export function useDashboardInsights(folderItems: Ref<Record<string, InventoryItem[]>>) {
  const receiptsStore = useReceiptsStore()
  const inventoryStore = useInventoryStore()
  const departmentsStore = useDepartmentsStore()
  const userStore = useUserStore()
  const { formatCurrency: formatCurrencyFromPrefs } = usePreferences()
  const formatCurrency = formatCurrencyFromPrefs

  const completedReceipts = computed(() =>
    receiptsStore.receipts.filter((r) => r.status === 'completed')
  )

  const totalRevenue = computed(() => receiptsStore.totalSales)
  const todaySales = computed(() => receiptsStore.todaySales)
  const monthSales = computed(() => receiptsStore.monthSales)

  const totalOrders = computed(() => receiptsStore.receipts.length)

  const averageOrderValue = computed(() => {
    const n = completedReceipts.value.length
    if (n === 0) return 0
    return totalRevenue.value / n
  })

  const todayReceiptsCount = computed(() => {
    const today = new Date().toDateString()
    return receiptsStore.receipts.filter((r) => receiptDate(r).toDateString() === today).length
  })

  const completedReceiptsCount = computed(() => completedReceipts.value.length)
  const pendingReceiptsCount = computed(
    () => receiptsStore.receipts.filter((r) => r.status === 'pending').length
  )
  const refundedReceiptsCount = computed(
    () => receiptsStore.receipts.filter((r) => r.status === 'refunded').length
  )
  const balanceDueReceiptsCount = computed(
    () => receiptsStore.receipts.filter((r) => r.status === 'balance_due').length
  )

  const refundAmount = computed(() =>
    receiptsStore.receipts
      .filter((r) => r.status === 'refunded')
      .reduce((sum, r) => sum + r.total, 0)
  )

  const outstandingReceipts = computed(() =>
    receiptsStore.receipts.filter((r) => {
      if (typeof r.balanceDue === 'number' && r.balanceDue > 0) return true
      return r.status === 'balance_due'
    })
  )

  const outstandingCount = computed(() => outstandingReceipts.value.length)
  const outstandingBalanceTotal = computed(() =>
    outstandingReceipts.value.reduce((sum, r) => {
      if (typeof r.balanceDue === 'number') return sum + r.balanceDue
      return sum + Math.max(0, r.total - (r.amountPaid ?? 0))
    }, 0)
  )

  const itemsSoldCount = computed(() => {
    let count = 0
    completedReceipts.value.forEach((receipt) => {
      receipt.items?.forEach((item) => {
        count += item.quantity
      })
    })
    return count
  })

  const uniqueCustomers = computed(() => {
    const customersMap = new Map<string, { name: string; email: string; lastOrder: Date }>()
    receiptsStore.receipts.forEach((receipt) => {
      const key = receipt.customerEmail?.trim() || receipt.customerPhone?.trim()
      if (!key) return
      const existing = customersMap.get(key)
      const d = receiptDate(receipt)
      if (!existing || d > existing.lastOrder) {
        customersMap.set(key, {
          name: receipt.customerName,
          email: receipt.customerEmail || key,
          lastOrder: d,
        })
      }
    })
    return Array.from(customersMap.values())
  })

  const totalCustomers = computed(() => uniqueCustomers.value.length)
  const newCustomersToday = computed(() => {
    const today = new Date().toDateString()
    return uniqueCustomers.value.filter((c) => c.lastOrder.toDateString() === today).length
  })

  const totalInventoryItems = computed(() => inventoryStore.totalItems)
  const totalFolders = computed(() => inventoryStore.totalFolders)
  const inventoryTotalValue = computed(() => inventoryStore.totalValue)
  const lowStockCount = computed(() =>
    inventoryStore.lowStockFolders.reduce((sum, folder) => sum + folder.lowStockCount, 0)
  )

  const serialFolderCount = computed(
    () => inventoryStore.folders.filter((f) => f.hasSerialNumbers).length
  )

  const inStockCount = computed(() => {
    let count = 0
    inventoryStore.folders.forEach((folder) => {
      const items = folderItems.value[folder.id] || []
      items.forEach((item) => {
        const dateOutValue = item.dateOut
        const hasDateOut =
          dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
        if (!hasDateOut) count++
      })
    })
    return count
  })

  const outOfStockCount = computed(() => {
    let count = 0
    inventoryStore.folders.forEach((folder) => {
      const items = folderItems.value[folder.id] || []
      items.forEach((item) => {
        const dateOutValue = item.dateOut
        const hasDateOut =
          dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
        if (hasDateOut) count++
      })
    })
    return count
  })

  const sellThroughRate = computed(() => {
    if (totalInventoryItems.value === 0) return 0
    return Math.round((outOfStockCount.value / totalInventoryItems.value) * 100)
  })

  const inStockPercentage = computed(() => {
    if (totalInventoryItems.value === 0) return 0
    return Math.round((inStockCount.value / totalInventoryItems.value) * 100)
  })

  const soldPercentage = computed(() => {
    if (totalInventoryItems.value === 0) return 0
    return Math.round((outOfStockCount.value / totalInventoryItems.value) * 100)
  })

  const lowStockPercentage = computed(() => {
    if (totalInventoryItems.value === 0 || lowStockCount.value === 0) return 0
    return Math.min(100, Math.round((lowStockCount.value / totalInventoryItems.value) * 100))
  })

  const totalDepartments = computed(() => departmentsStore.totalDepartments)
  const totalStaff = computed(() => departmentsStore.totalStaff)

  const dailyRevenueData = computed(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setHours(0, 0, 0, 0)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyTotals = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(date.getDate() + i)
      dailyTotals.set(toIsoDateKey(date), 0)
    }

    receiptsStore.receipts.forEach((receipt) => {
      if (receipt.status !== 'completed') return
      const d = receiptDate(receipt)
      d.setHours(0, 0, 0, 0)
      if (d >= thirtyDaysAgo) {
        const dateKey = toIsoDateKey(d)
        dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + receipt.total)
      }
    })

    return Array.from(dailyTotals.entries())
      .map(([date, revenue]) => ({
        date: new Date(date),
        revenue,
        dateKey: date,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  })

  const weeklyRevenueData = computed(() => {
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setHours(0, 0, 0, 0)
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 12 * 7)

    const dayOfWeek = twelveWeeksAgo.getDay()
    const diff = twelveWeeksAgo.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const startOfWeek = new Date(twelveWeeksAgo.setDate(diff))
    startOfWeek.setHours(0, 0, 0, 0)

    const weeklyTotals = new Map<string, { revenue: number; startDate: Date; endDate: Date }>()
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(startOfWeek)
      weekStart.setDate(weekStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weeklyTotals.set(`Week ${i + 1}`, {
        revenue: 0,
        startDate: new Date(weekStart),
        endDate: new Date(weekEnd),
      })
    }

    receiptsStore.receipts.forEach((receipt) => {
      if (receipt.status !== 'completed') return
      const d = receiptDate(receipt)
      d.setHours(0, 0, 0, 0)
      if (d >= startOfWeek) {
        const daysDiff = Math.floor((d.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24))
        const weekIndex = Math.floor(daysDiff / 7)
        if (weekIndex >= 0 && weekIndex < 12) {
          const weekKey = `Week ${weekIndex + 1}`
          const weekData = weeklyTotals.get(weekKey)
          if (weekData) weekData.revenue += receipt.total
        }
      }
    })

    return Array.from(weeklyTotals.values())
      .map((week, index) => ({
        date: week.startDate,
        revenue: week.revenue,
        dateKey: `Week ${index + 1}`,
        endDate: week.endDate,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  })

  const monthlyRevenueData = computed(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    now.setDate(1)

    const monthlyTotals: Array<{ revenue: number; date: Date; dateKey: string }> = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now)
      monthDate.setMonth(monthDate.getMonth() - i)
      monthlyTotals.push({
        revenue: 0,
        date: new Date(monthDate),
        dateKey: monthDate.toLocaleDateString('en-US', { month: 'short' }),
      })
    }

    receiptsStore.receipts.forEach((receipt) => {
      if (receipt.status !== 'completed') return
      const d = receiptDate(receipt)
      d.setHours(0, 0, 0, 0)
      d.setDate(1)
      const monthIndex = monthlyTotals.findIndex((month) => month.date.getTime() === d.getTime())
      if (monthIndex >= 0 && monthlyTotals[monthIndex]) {
        monthlyTotals[monthIndex].revenue += receipt.total
      }
    })

    return monthlyTotals
  })

  const revenueChangePercent = computed(() => {
    const daily = dailyRevenueData.value
    if (!daily || daily.length < 30) return null
    const recent = daily.slice(-15).reduce((s, d) => s + d.revenue, 0)
    const previous = daily.slice(-30, -15).reduce((s, d) => s + d.revenue, 0)
    if (previous === 0) return recent > 0 ? '+100%' : null
    const pct = Math.round(((recent - previous) / previous) * 100)
    if (pct === 0) return null
    return pct > 0 ? `+${pct}%` : `${pct}%`
  })

  const revenueChangePositive = computed(() => {
    const p = revenueChangePercent.value
    if (!p) return null
    return p.startsWith('+')
  })

  const statCardRevenueSparkline = computed(() => {
    const daily = dailyRevenueData.value
    if (!daily || daily.length < 2) return [] as number[]
    return daily.slice(-14).map((d) => d.revenue)
  })

  const revenueChangeText = computed(() => {
    if (totalRevenue.value === 0) return 'No completed sales yet'
    return `${formatCurrency(monthSales.value)} this month`
  })

  const topSellingItems = computed((): DashboardTopProduct[] => {
    const itemSales = new Map<string, { name: string; sales: number; revenue: number }>()
    completedReceipts.value.forEach((receipt) => {
      receipt.items?.forEach((item) => {
        const existing = itemSales.get(item.itemName) || {
          name: item.itemName,
          sales: 0,
          revenue: 0,
        }
        existing.sales += item.quantity
        existing.revenue += item.price * item.quantity
        itemSales.set(item.itemName, existing)
      })
    })
    const totalRev = Array.from(itemSales.values()).reduce((s, i) => s + i.revenue, 0) || 1
    return Array.from(itemSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, index) => ({
        id: `item-${index}`,
        name: item.name,
        sales: item.sales,
        revenue: item.revenue,
        share: Math.round((item.revenue / totalRev) * 100),
      }))
  })

  const lowStockItems = computed((): DashboardLowStockRow[] => {
    const list: DashboardLowStockRow[] = []
    const lowStockThreshold =
      userStore.userData?.storeDetails?.settings?.inventory?.lowStockThreshold || 10

    inventoryStore.folders.forEach((folder) => {
      const items = folderItems.value[folder.id] || []

      if (folder.hasSerialNumbers) {
        let availableCount = 0
        items.forEach((item) => {
          const dateOutValue = item.dateOut
          const hasDateOut =
            dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
          if (!hasDateOut) availableCount++
        })
        if (availableCount > 0 && availableCount <= lowStockThreshold) {
          list.push({
            id: folder.id,
            name: folder.name,
            quantity: availableCount,
            folderName: folder.name,
            folderId: folder.id,
            threshold: lowStockThreshold,
            isSerialNumber: true,
          })
        }
        return
      }

      const quantityField = folder.template?.fields?.find(
        (f) => f.name.toLowerCase() === 'quantity' || f.name.toLowerCase() === 'qty'
      )?.name
      if (!quantityField) return

      items.forEach((item) => {
        const dateOutValue = item.dateOut
        const hasDateOut =
          dateOutValue !== null && dateOutValue !== undefined && dateOutValue !== ''
        if (hasDateOut) return
        if (item[quantityField] === undefined) return
        const quantity =
          typeof item[quantityField] === 'number'
            ? item[quantityField]
            : parseFloat(String(item[quantityField])) || 0
        if (quantity > 0 && quantity <= lowStockThreshold) {
          const nameField =
            folder.template?.fields?.find(
              (f) => f.name.toLowerCase() === 'name' || f.name.toLowerCase() === 'item'
            )?.name || 'name'
          const itemName = item[nameField] || item.name || 'Unnamed item'
          list.push({
            id: item.id,
            name: String(itemName),
            quantity,
            folderName: folder.name,
            folderId: folder.id,
            threshold: lowStockThreshold,
            isSerialNumber: false,
          })
        }
      })
    })

    return list.sort((a, b) => a.quantity - b.quantity)
  })

  const paymentMethodBreakdown = computed((): DashboardPaymentSlice[] => {
    const map = new Map<string, { count: number; revenue: number }>()
    completedReceipts.value.forEach((receipt) => {
      const raw = receipt.paymentMethod?.trim() || 'other'
      const key = raw.toLowerCase()
      const row = map.get(key) || { count: 0, revenue: 0 }
      row.count += 1
      row.revenue += receipt.total
      map.set(key, row)
    })
    const total = completedReceipts.value.length || 1
    return Array.from(map.entries())
      .map(([method, data]) => ({
        method,
        label: formatPaymentMethod(method === 'other' ? '' : method),
        count: data.count,
        revenue: data.revenue,
        share: Math.round((data.count / total) * 100),
      }))
      .sort((a, b) => b.revenue - a.revenue)
  })

  const recentReceipts = computed((): DashboardRecentReceipt[] =>
    receiptsStore.receipts
      .slice()
      .sort((a, b) => receiptDate(b).getTime() - receiptDate(a).getTime())
      .slice(0, 5)
      .map((receipt) => {
        const isRefund = receipt.status === 'refunded'
        return {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber || receipt.id.slice(0, 8),
          customerName: receipt.customerName || 'Walk-in customer',
          status: receipt.status,
          statusLabel: statusLabel(receipt.status),
          paymentMethod: formatPaymentMethod(receipt.paymentMethod),
          time: getTimeAgo(receiptDate(receipt)),
          amount: isRefund ? `-${formatCurrency(receipt.total)}` : formatCurrency(receipt.total),
          amountClass: isRefund
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-900 dark:text-gray-100',
        }
      })
  )

  const salesLast7Days = computed(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    cutoff.setHours(0, 0, 0, 0)
    return completedReceipts.value.filter((r) => receiptDate(r) >= cutoff).length
  })

  const revenueLast7Days = computed(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    cutoff.setHours(0, 0, 0, 0)
    return completedReceipts.value
      .filter((r) => receiptDate(r) >= cutoff)
      .reduce((s, r) => s + r.total, 0)
  })

  const executiveSummary = computed(() => {
    const parts: string[] = []
    if (todayReceiptsCount.value > 0) {
      parts.push(
        `Today: ${todayReceiptsCount.value} order${
          todayReceiptsCount.value === 1 ? '' : 's'
        } and ${formatCurrency(todaySales.value)} in completed sales.`
      )
    } else {
      parts.push('No orders recorded today yet.')
    }
    if (monthSales.value > 0) {
      parts.push(
        `Month to date: ${formatCurrency(monthSales.value)} across ${
          completedReceiptsCount.value
        } completed sale${completedReceiptsCount.value === 1 ? '' : 's'}.`
      )
    }
    if (outstandingCount.value > 0) {
      parts.push(
        `${outstandingCount.value} open balance${
          outstandingCount.value === 1 ? '' : 'es'
        } totaling ${formatCurrency(outstandingBalanceTotal.value)} need follow-up.`
      )
    }
    if (lowStockItems.value.length > 0) {
      parts.push(
        `${lowStockItems.value.length} inventory line${
          lowStockItems.value.length === 1 ? '' : 's'
        } are at or below your low-stock threshold.`
      )
    }
    if (salesLast7Days.value > 0) {
      parts.push(
        `Last 7 days: ${salesLast7Days.value} completed sale${
          salesLast7Days.value === 1 ? '' : 's'
        } (${formatCurrency(revenueLast7Days.value)}).`
      )
    }
    return parts.join(' ')
  })

  const attentionItems = computed((): DashboardAlert[] => {
    const items: DashboardAlert[] = []
    if (outstandingCount.value > 0) {
      items.push({
        id: 'outstanding',
        level: 'critical',
        title: 'Outstanding balances',
        description: `${outstandingCount.value} sale${
          outstandingCount.value === 1 ? '' : 's'
        } with ${formatCurrency(outstandingBalanceTotal.value)} still owed.`,
        href: '/dashboard/receipts?tab=outstanding',
        cta: 'Review balances',
      })
    }
    if (pendingReceiptsCount.value > 0) {
      items.push({
        id: 'pending',
        level: 'warning',
        title: 'Pending sales',
        description: `${pendingReceiptsCount.value} sale${
          pendingReceiptsCount.value === 1 ? ' is' : 's are'
        } awaiting completion.`,
        href: '/dashboard/receipts',
        cta: 'Open sales',
      })
    }
    if (lowStockItems.value.length > 0) {
      items.push({
        id: 'low-stock',
        level: 'warning',
        title: 'Low stock',
        description: `${lowStockItems.value.length} folder or SKU${
          lowStockItems.value.length === 1 ? '' : 's'
        } need restocking attention.`,
        href: '/dashboard/inventory',
        cta: 'View inventory',
      })
    }
    if (totalRevenue.value === 0 && receiptsStore.receipts.length === 0) {
      items.push({
        id: 'get-started',
        level: 'info',
        title: 'Get started',
        description:
          'Create your first sale to populate sales metrics, customer insights, and revenue trends.',
        href: '/dashboard/receipts',
        cta: 'Create sale',
      })
    } else if (salesLast7Days.value === 0 && completedReceiptsCount.value > 0) {
      items.push({
        id: 'quiet-week',
        level: 'info',
        title: 'Quiet week',
        description:
          'No completed sales in the last 7 days. Review pricing, stock levels, or follow up with customers.',
        href: '/dashboard/analytics',
        cta: 'View analytics',
      })
    }
    return items
  })

  const quickLinks = computed((): DashboardQuickLink[] => [
    {
      label: 'Sales',
      description: 'Create sales, returns, and customer records',
      href: '/dashboard/receipts',
    },
    {
      label: 'Inventory',
      description: 'Folders, SKUs, serial units, and stock levels',
      href: '/dashboard/inventory',
    },
    {
      label: 'Analytics',
      description: 'Trends, exports, and period comparisons',
      href: '/dashboard/analytics',
    },
    {
      label: 'Activity logs',
      description: 'Who changed inventory and when',
      href: '/dashboard/activity',
    },
    {
      label: 'Departments',
      description: 'Teams, managers, and staff access',
      href: '/dashboard/settings',
    },
    {
      label: 'Help center',
      description: 'Guides for sales, loans, and sync',
      href: '/dashboard/help',
    },
  ])

  const operationsMetrics = computed(() => [
    { label: 'Inventory folders', value: String(totalFolders.value) },
    { label: 'Serial-tracked folders', value: String(serialFolderCount.value) },
    { label: 'Departments', value: String(totalDepartments.value) },
    { label: 'Staff members', value: String(totalStaff.value) },
    { label: 'Inventory book value', value: formatCurrency(inventoryTotalValue.value) },
    { label: 'Units sold (all time)', value: String(itemsSoldCount.value) },
  ])

  const salesMetrics = computed(() => [
    { label: 'Completed', value: String(completedReceiptsCount.value) },
    { label: 'Pending', value: String(pendingReceiptsCount.value) },
    { label: 'Refunded', value: String(refundedReceiptsCount.value) },
    { label: 'Balance due', value: String(balanceDueReceiptsCount.value) },
    { label: 'Refund value', value: formatCurrency(refundAmount.value) },
    { label: 'Avg. order value', value: formatCurrency(averageOrderValue.value) },
  ])

  return {
    formatCurrency,
    totalRevenue,
    todaySales,
    monthSales,
    totalOrders,
    averageOrderValue,
    todayReceiptsCount,
    completedReceiptsCount,
    pendingReceiptsCount,
    refundedReceiptsCount,
    balanceDueReceiptsCount,
    refundAmount,
    outstandingCount,
    outstandingBalanceTotal,
    itemsSoldCount,
    totalCustomers,
    newCustomersToday,
    totalInventoryItems,
    totalFolders,
    inventoryTotalValue,
    lowStockCount,
    serialFolderCount,
    inStockCount,
    outOfStockCount,
    sellThroughRate,
    inStockPercentage,
    soldPercentage,
    lowStockPercentage,
    totalDepartments,
    totalStaff,
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
    executiveSummary,
    attentionItems,
    quickLinks,
    operationsMetrics,
    salesMetrics,
    salesLast7Days,
    revenueLast7Days,
  }
}
