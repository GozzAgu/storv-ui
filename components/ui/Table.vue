<template>
  <div class="overflow-x-auto">
    <table :class="['w-full', tableClass]">
      <!-- Header -->
      <thead v-if="columns && columns.length > 0" class="border-b border-gray-200/90 bg-gray-50/95 dark:border-gray-800/80 dark:!bg-dashboard-card/90">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="[ 'bg-gray-50/95 px-3 py-2.5 text-left text-[11px] !font-semibold text-gray-600 dark:!bg-dashboard-card/90 dark:text-gray-400 uppercase tracking-wide', column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 select-none' : '', column.class || '', headerClass ]"
            @click="column.sortable ? handleSort(column.key) : null"
          >
            <div class="flex items-center gap-1.5">
              <span>{{ column.label }}</span>
              <span
                v-if="column.sortable"
                class="flex flex-col"
              >
                <ChevronUpIcon
                  :class="[ 'w-3 h-3', sortBy === column.key && sortOrder === 'asc' ? 'text-primary-500 dark:text-primary-400' : 'text-gray-300 dark:text-gray-600' ]"
                />
                <ChevronDownIcon
                  :class="[ 'w-3 h-3 -mt-1', sortBy === column.key && sortOrder === 'desc' ? 'text-primary-500 dark:text-primary-400' : 'text-gray-300 dark:text-gray-600' ]"
                />
              </span>
            </div>
          </th>
          <th
            v-if="showActions"
            class="bg-gray-50/95 px-3 py-2.5 text-right text-[11px] !font-semibold text-gray-600 dark:!bg-dashboard-card/90 dark:text-gray-400 uppercase tracking-wide"
          >
            Actions
          </th>
        </tr>
      </thead>

      <!-- Body -->
      <tbody class="divide-y divide-gray-100 bg-white dark:divide-gray-800/80 dark:!bg-dashboard-card">
        <tr
          v-for="(row, index) in sortedData"
          :key="getRowKey(row, index)"
          :class="[ 'transition-colors hover:bg-gray-50/90 dark:hover:bg-white/[0.04]', rowClass ]"
        >
          <td
            v-for="column in columns"
            :key="column.key"
            :class="['whitespace-nowrap px-3 py-2.5 text-xs', column.class || '', cellClass]"
          >
            <slot
              :name="`cell-${column.key}`"
              :row="row"
              :value="getValue(row, column.key)"
              :column="column"
            >
              <span :class="getValueClass(column)">
                {{ formatValue(getValue(row, column.key), column) }}
              </span>
            </slot>
          </td>
          <td
            v-if="showActions"
            class="whitespace-nowrap px-3 py-2.5 text-right text-xs font-medium"
          >
            <slot
              name="actions"
              :row="row"
              :index="index"
            >
              <div class="flex items-center justify-end gap-1.5">
                <button
                  v-if="onEdit"
                  @click="handleEdit(row, index)"
                  class="text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                  title="Edit"
                >
                  <PencilSquareIcon class="w-4 h-4" />
                </button>
                <button
                  v-if="onDelete"
                  @click="handleDelete(row, index)"
                  class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  title="Delete"
                >
                  <TrashIcon class="w-4 h-4" />
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
                <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-2">
                  <InboxIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
                <p class="text-xs font-medium text-gray-900 dark:text-gray-100">No data available</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">There are no items to display</p>
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
} from '@heroicons/vue/24/outline'

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any) => string
  class?: string
  valueClass?: string
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

