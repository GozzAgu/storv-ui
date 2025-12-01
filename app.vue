<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Toast Notifications - Global -->
  <ClientOnly>
    <ToastContainer />
  </ClientOnly>
</template>

<script setup lang="ts">
import ToastContainer from '~/components/ui/ToastContainer.vue'
</script>