<template>
  <div class="space-y-2.5" aria-hidden="true">
    <article
      v-for="i in count"
      :key="i"
      class="rounded-xl bg-white p-3 shadow-none dark:!bg-dashboard-card"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1 space-y-1.5">
          <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-title" />
          <span class="dash-skeleton dash-skeleton--line dash-skeleton--line-meta" />
          <span class="dash-skeleton dash-skeleton--chip" style="width: 3.75rem; height: 1.15rem" />
        </div>
        <span class="dash-skeleton dash-skeleton--chip" />
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 6,
  }
)
</script>
