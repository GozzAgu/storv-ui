import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
 label: string
 onClick: () => void
}

export interface Toast {
 id: string
 message: string
 type: ToastType
 duration?: number
 action?: ToastAction
}

const toasts = ref<Toast[]>([])

let toastIdCounter = 0

const toastTimeouts = new Map<string, NodeJS.Timeout>()
const pendingCommits = new Map<string, NodeJS.Timeout>()

export const useAppToast = () => {
 const addToast = (message: string, type: ToastType = 'info', duration: number = 5000) => {
 if (import.meta.server) {
 // console.log(`[Toast ${type}]: ${message}`)
 return ''
 }

 const id = `toast-${++toastIdCounter}-${Date.now()}`
 const toast: Toast = {
 id,
 message,
 type,
 duration,
 }

 toasts.value.push(toast)

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
 const timeoutId = toastTimeouts.get(id)
 if (timeoutId) {
 clearTimeout(timeoutId)
 toastTimeouts.delete(id)
 }

 const index = toasts.value.findIndex((t) => t.id === id)
 if (index > -1) {
 toasts.value.splice(index, 1)
 }
 }

 const success = (message: string, duration?: number) => {
 return addToast(message, 'success', duration || 5000)
 }

 const error = (message: string, duration?: number) => {
 return addToast(message, 'error', duration || 7000)
 }

 const warning = (message: string, duration?: number) => {
 return addToast(message, 'warning', duration || 5000)
 }

 const info = (message: string, duration?: number) => {
 return addToast(message, 'info', duration || 5000)
 }

 const deletedWithUndo = (
 message: string,
 onUndo: () => void,
 onCommit: () => void | Promise<void>,
 duration: number = 5000
 ) => {
 if (import.meta.server) {
 return
 }

 const id = `toast-${++toastIdCounter}-${Date.now()}`
 let cancelled = false

 const commitTimer = setTimeout(async () => {
 pendingCommits.delete(id)
 if (cancelled) return
 removeToast(id)
 try {
 await onCommit()
 } catch (err) {
 console.error('[Toast] Commit failed:', err)
 }
 }, duration)
 pendingCommits.set(id, commitTimer)

 const handleUndo = () => {
 cancelled = true
 const timer = pendingCommits.get(id)
 if (timer) {
 clearTimeout(timer)
 pendingCommits.delete(id)
 }
 removeToast(id)
 onUndo()
 }

 const toast: Toast = {
 id,
 message,
 type: 'success',
 duration: 0,
 action: { label: 'Undo', onClick: handleUndo },
 }
 toasts.value.push(toast)
 return id
 }

 const clearAll = () => {
 toastTimeouts.forEach((timeoutId) => clearTimeout(timeoutId))
 toastTimeouts.clear()
 pendingCommits.forEach((timeoutId) => clearTimeout(timeoutId))
 pendingCommits.clear()

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
 deletedWithUndo,
 clearAll,
 }
}
