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

// Global error handler for unhandled promise rejections
if (import.meta.client) {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Check if it's the specific browser extension error we want to ignore
    const errorMessage = event.reason?.message || String(event.reason || '')
    
    // Ignore browser extension related errors
    if (errorMessage.includes('message channel closed') || 
        errorMessage.includes('listener indicated an asynchronous response')) {
      event.preventDefault() // Prevent the error from showing in console
      return
    }
    
    // Log other unhandled rejections for debugging
    console.warn('Unhandled promise rejection:', event.reason)
  })

  // Handle general errors
  window.addEventListener('error', (event) => {
    // Ignore browser extension related errors
    const errorMessage = event.message || String(event.error || '')
    if (errorMessage.includes('message channel closed') || 
        errorMessage.includes('listener indicated an asynchronous response')) {
      event.preventDefault()
      return
    }
  })
}
</script>