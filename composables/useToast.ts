import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

const toasts = ref<Toast[]>([])

let toastIdCounter = 0

export const useToast = () => {
  const addToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
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
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }
  
  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  const success = (message: string, duration?: number) => {
    return addToast(message, 'success', duration)
  }
  
  const error = (message: string, duration?: number) => {
    return addToast(message, 'error', duration || 7000) // Errors stay longer
  }
  
  const warning = (message: string, duration?: number) => {
    return addToast(message, 'warning', duration)
  }
  
  const info = (message: string, duration?: number) => {
    return addToast(message, 'info', duration)
  }
  
  const clearAll = () => {
    toasts.value = []
  }
  
  return {
    toasts,
    success,
    error,
    warning,
    info,
    addToast,
    removeToast,
    clearAll
  }
}

