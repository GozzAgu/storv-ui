<template>
  <div class="overflow-x-auto">
    <table :class="['dashboard-table', tableClass]">
      <!-- Header -->
      <thead v-if="columns && columns.length > 0">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="[
              column.sortable
                ? 'dashboard-table__th--sortable cursor-pointer select-none'
                : '',
              column.class || '',
              headerClass,
            ]"
            @click="column.sortable ? handleSort(column.key) : null"
          >
            <div class="dashboard-table__head-label">
              <span>{{ column.label }}</span>
              <span
                v-if="column.sortable"
                class="dashboard-table__sort"
                :class="{
                  'dashboard-table__sort--active': sortBy === column.key,
                  'dashboard-table__sort--desc': sortBy === column.key && sortOrder === 'desc',
                }"
                aria-hidden="true"
              >
                <ChevronUpIcon class="dashboard-table__sort-icon dashboard-table__sort-icon--up" />
                <ChevronDownIcon class="dashboard-table__sort-icon dashboard-table__sort-icon--down" />
              </span>
            </div>
          </th>
          <th v-if="showActions" class="dashboard-table__col-actions">Actions</th>
        </tr>
      </thead>

      <!-- Body -->
      <tbody>
        <tr v-for="(row, index) in sortedData" :key="getRowKey(row, index)" :class="rowClass">
          <td v-for="column in columns" :key="column.key" :class="[column.class || '', cellClass]">
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="getValue(row, column.key)"
              :column="column"
            >
              <span :class="[getValueClass(column), 'dashboard-table__primary']">
                {{ formatValue(getValue(row, column.key), column) }}
              </span>
            </slot>
          </td>
          <td
            v-if="showActions"
            class="dashboard-table__col-actions"
          >
            <slot name="actions" :row="row" :index="index">
              <div class="dashboard-table__action-group">
                <button
                  v-if="onEdit"
                  type="button"
                  class="dashboard-table__action-btn"
                  @click="handleEdit(row, index)"
                >
                  <PencilSquareIcon class="h-4 w-4" />
                </button>
                <button
                  v-if="onDelete"
                  type="button"
                  class="dashboard-table__action-btn"
                  @click="handleDelete(row, index)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
              </div>
            </slot>
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-if="!sortedData || sortedData.length === 0">
          <td
            :colspan="(columns?.length || 0) + (showActions ? 1 : 0)"
            class="px-2 py-8 text-center"
          >
            <slot name="empty">
              <div class="flex flex-col items-center justify-center">
                <div
                  class="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-2"
                >
                  <InboxIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100">
                  No data available
                </p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  There are no items to display
                </p>
              </div>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
  InboxIcon,
} from '~/utils/app-icons'
import { tableMoneyClass } from '~/utils/table-money-styles'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any) => string
  class?: string
  valueClass?: string
  /** Renders amount in green (credit / currency columns). */
  type?: 'currency' | 'text' | 'number'
}

interface Props {
  columns?: TableColumn[]
  data?: any[]
  rowKey?: string | ((row: any) => string | number)
  showActions?: boolean
  onEdit?: (row: any, index: number) => void
  onDelete?: (row: any, index: number) => void
  tableClass?: string
  headerClass?: string
  rowClass?: string
  cellClass?: string
  defaultSort?: {
    key: string
    order: 'asc' | 'desc'
  }
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  data: () => [],
  showActions: false,
  tableClass: '',
  headerClass: '',
  rowClass: '',
  cellClass: '',
  defaultSort: undefined,
})

const emit = defineEmits<{
  sort: [{ key: string; order: 'asc' | 'desc' }]
}>()

const sortBy = ref<string | null>(props.defaultSort?.key || null)
const sortOrder = ref<'asc' | 'desc'>(props.defaultSort?.order || 'asc')

const getValue = (row: any, key: string) => {
  return key.split('.').reduce((obj, k) => obj?.[k], row)
}

const getValueClass = (column: TableColumn) => {
  if (column.type === 'currency') return tableMoneyClass()
  return column.valueClass || 'text-gray-900 dark:text-gray-100'
}

const formatValue = (value: any, column: TableColumn) => {
  if (column.formatter) {
    return column.formatter(value)
  }
  return value ?? '-'
}

const getRowKey = (row: any, index: number) => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  if (typeof props.rowKey === 'string') {
    return getValue(row, props.rowKey)
  }
  return index
}

const sortedData = computed(() => {
  if (!sortBy.value || !props.data) {
    return props.data
  }

  const sorted = [...props.data].sort((a, b) => {
    const aVal = getValue(a, sortBy.value!)
    const bVal = getValue(b, sortBy.value!)

    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder.value === 'asc' ? aVal - bVal : bVal - aVal
    }

    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()

    if (sortOrder.value === 'asc') {
      return aStr.localeCompare(bStr)
    } else {
      return bStr.localeCompare(aStr)
    }
  })

  return sorted
})

const handleSort = (key: string) => {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = key
    sortOrder.value = 'asc'
  }

  emit('sort', { key: sortBy.value, order: sortOrder.value })
}

const handleEdit = (row: any, index: number) => {
  if (props.onEdit) {
    props.onEdit(row, index)
  }
}

const handleDelete = (row: any, index: number) => {
  if (props.onDelete) {
    props.onDelete(row, index)
  }
}
</script>
