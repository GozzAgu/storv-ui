import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

// Shared state - singleton pattern to ensure all instances use the same toasts array
const toasts = ref<Toast[]>([])

let toastIdCounter = 0

// Store timeout IDs to allow cleanup
const toastTimeouts = new Map<string, NodeJS.Timeout>()

export const useToast = () => {
  const addToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
    // Only add toast on client side
    if (import.meta.server) {
      console.log(`[Toast ${type}]: ${message}`)
      return ''
    }

    const id = `toast-${++toastIdCounter}-${Date.now()}`
    const toast: Toast = {
      id,
      message,
      type,
      duration
    }
    
    toasts.value.push(toast)
    
    // Auto remove after duration
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        removeToast(id)
        toastTimeouts.delete(id)
      }, duration)
      toastTimeouts.set(id, timeoutId)
    }
    
    return id
  }
  
  const removeToast = (id: string) => {
    // Clear timeout if exists
    const timeoutId = toastTimeouts.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      toastTimeouts.delete(id)
    }

    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const success = (message: string, duration?: number) => {
    return addToast(message, 'success', duration || 5000)
  }
  
  const error = (message: string, duration?: number) => {
    return addToast(message, 'error', duration || 7000) // Errors stay longer
  }
  
  const warning = (message: string, duration?: number) => {
    return addToast(message, 'warning', duration || 5000)
  }
  
  const info = (message: string, duration?: number) => {
    return addToast(message, 'info', duration || 5000)
  }
  
  const clearAll = () => {
    // Clear all timeouts
    toastTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
    toastTimeouts.clear()
    
    toasts.value = []
  }
  
  return {
    toasts, // Return ref directly - Vue's reactivity will handle it
    success,
    error,
    warning,
    info,
    addToast,
    removeToast,
    clearAll
  }
}

