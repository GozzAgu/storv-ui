<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'dashboard',
})

// Redirect to receipts page with customers tab
const router = useRouter()
onMounted(() => {
  router.replace({ path: '/dashboard/receipts', query: { tab: 'customers' } })
})
</script>
<template>
  <div></div>
</template>
