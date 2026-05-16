<template>
  <UApp>
  <div
    v-if="capacitorBooting"
    class="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#07080c]"
    aria-busy="true"
    aria-label="Loading Storv"
  >
    <div class="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading Storv…</p>
  </div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Toast Notifications - Global -->
    <ClientOnly>
      <ToastContainer />
    </ClientOnly>
  </UApp>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ToastContainer from '~/components/ui/ToastContainer.vue'
import { isCapacitorNative, markCapacitorDocument } from '~/utils/capacitor-env'

const capacitorBooting = ref(false)

onMounted(() => {
  if (!isCapacitorNative()) return
  markCapacitorDocument()
  capacitorBooting.value = true
  const hide = () => {
    capacitorBooting.value = false
  }
  requestAnimationFrame(hide)
  setTimeout(hide, 400)
})

// Global error handler for unhandled promise rejections
if (import.meta.client) {
  // Suppress Vercel Analytics zustand deprecation warning
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ')
    // Filter out Vercel Analytics zustand deprecation warning
    if (message.includes('[DEPRECATED] Default export is deprecated') && 
        message.includes('zustand')) {
      return // Suppress this specific warning
    }
    // Call original warn for all other messages
    originalWarn.apply(console, args)
  }

  // Suppress console.error for browser extension and Vercel feedback widget errors
  const originalError = console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ')
    // Filter out browser extension and Vercel feedback widget errors
    if (message.includes('message channel closed') || 
        message.includes('listener indicated an asynchronous response') ||
        message.includes('feedback.html') ||
        message.includes('about:srcdoc')) {
      return // Suppress these specific errors
    }
    // Call original error for all other messages
    originalError.apply(console, args)
  }

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Check if it's the specific browser extension or Vercel feedback widget error we want to ignore
    const errorMessage = event.reason?.message || String(event.reason || '')
    const errorStack = event.reason?.stack || ''
    const fullError = errorMessage + ' ' + errorStack
    
    // Ignore browser extension related errors and Vercel feedback widget errors
    if (errorMessage.includes('message channel closed') || 
        errorMessage.includes('listener indicated an asynchronous response') ||
        fullError.includes('feedback.html') ||
        fullError.includes('about:srcdoc') ||
        event.reason?.source === 'extension' ||
        event.reason?.source === 'feedback') {
      event.preventDefault() // Prevent the error from showing in console
      event.stopPropagation() // Stop event propagation
      return
    }
    
    // Log other unhandled rejections for debugging
    console.warn('Unhandled promise rejection:', event.reason)
  })

  // Handle general errors
  window.addEventListener('error', (event) => {
    // Ignore browser extension related errors and Vercel feedback widget errors
    const errorMessage = event.message || String(event.error || '')
    const errorSource = event.filename || ''
    const fullError = errorMessage + ' ' + errorSource
    
    if (errorMessage.includes('message channel closed') || 
        errorMessage.includes('listener indicated an asynchronous response') ||
        fullError.includes('feedback.html') ||
        fullError.includes('about:srcdoc') ||
        errorSource.includes('extension') ||
        errorSource.includes('feedback')) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
  }, true) // Use capture phase to catch errors earlier

  // Also handle errors from iframes and other sources
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || String(event.error || '')
    const errorSource = event.filename || ''
    
    if (errorMessage.includes('message channel closed') || 
        errorMessage.includes('listener indicated an asynchronous response') ||
        errorSource.includes('feedback') ||
        errorSource.includes('about:srcdoc')) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
  }, false) // Also listen in bubble phase
}
</script>