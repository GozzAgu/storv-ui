<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
 layout: 'dashboard'
})

// Redirect to receipts page with returns tab
const router = useRouter()
onMounted(() => {
 router.replace({ path: '/dashboard/receipts', query: { tab: 'returns' } })
})
</script>
<template>
 <div></div>
</template>