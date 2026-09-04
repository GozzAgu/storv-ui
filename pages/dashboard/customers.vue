<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

definePageMeta({
  layout: 'dashboard',
})

// Redirect to receipts page with customers tab
const router = useRouter()
const route = useRoute()
onMounted(() => {
  router.replace({
    path: '/dashboard/receipts',
    query: { ...route.query, tab: 'customers' },
  })
})
</script>
<template>
  <div></div>
</template>
