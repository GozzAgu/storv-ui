<template>
  <div
    class="dash-table-skeleton"
    :class="flush ? '' : 'data-table-shell dash-table-shell'"
    aria-busy="true"
    :aria-label="ariaLabel"
  >
    <div v-if="showToolbar" class="dash-table-skeleton__toolbar">
      <span class="dash-skeleton dash-skeleton--line dash-skeleton--search" />
      <span class="dash-skeleton dash-skeleton--line dash-skeleton--select" />
    </div>
    <div class="overflow-x-auto">
      <table class="dashboard-table min-w-full">
        <thead>
          <tr>
            <th
              v-for="(column, index) in columns"
              :key="columnKey(column, index)"
              :class="column.class"
              scope="col"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row">
            <td
              v-for="(column, index) in columns"
              :key="`${row}-${columnKey(column, index)}`"
              :class="column.class"
            >
              <div
                v-if="columnLeading(column, index) !== 'none'"
                class="flex min-w-0 items-center gap-2.5"
              >
                <span
                  v-if="hasLeadingMark(column, index)"
                  class="dash-skeleton"
                  :class="
                    columnLeading(column, index) === 'avatar'
                      ? 'dash-skeleton--avatar'
                      : 'dash-skeleton--thumb'
                  "
                />
                <div class="min-w-0 flex-1 space-y-1.5">
                  <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-title" />
                  <span
                    v-if="showLeadingMeta(column, index)"
                    class="dash-skeleton dash-skeleton--line dash-skeleton--line-meta"
                  />
                </div>
              </div>
              <div v-else-if="(column.lines || 1) > 1" class="space-y-1.5">
                <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-title" />
                <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-meta" />
              </div>
              <span
                v-else
                class="dash-skeleton dash-skeleton--line"
                :style="{ width: column.bone || '68%' }"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
export type DashTableSkeletonLeading = 'icon' | 'avatar' | 'text' | 'none'

export type DashTableSkeletonColumn = {
  id?: string
  label: string
  class?: string
  bone?: string
  lines?: 1 | 2
  leading?: DashTableSkeletonLeading
}

const props = withDefaults(
  defineProps<{
    columns: DashTableSkeletonColumn[]
    rows?: number
    leading?: DashTableSkeletonLeading
    leadingMeta?: boolean
    showToolbar?: boolean
    flush?: boolean
    ariaLabel?: string
  }>(),
  {
    rows: 8,
    leading: 'icon',
    showToolbar: false,
    flush: false,
    ariaLabel: 'Loading table',
  }
)

function columnKey(column: DashTableSkeletonColumn, index: number) {
  return column.id || `${column.label}-${index}`
}

function columnLeading(column: DashTableSkeletonColumn, index: number): DashTableSkeletonLeading {
  return column.leading ?? (index === 0 ? props.leading : 'none')
}

function hasLeadingMark(column: DashTableSkeletonColumn, index: number) {
  const leading = columnLeading(column, index)
  return leading === 'avatar' || leading === 'icon'
}

function showLeadingMeta(column: DashTableSkeletonColumn, index: number) {
  const leading = columnLeading(column, index)
  if (leading === 'none') return false
  if (props.leadingMeta !== undefined) return props.leadingMeta
  return leading === 'icon' || leading === 'avatar' || leading === 'text'
}
</script>
