import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { clampFabPosition } from '~/utils/viewportClamp'

function clamp(
 left: number,
 top: number,
 width: number,
 height: number
): { left: number; top: number } {
 if (typeof window === 'undefined') return { left, top }
 return clampFabPosition(left, top, width, height, window.innerWidth, window.innerHeight)
}

/**
 * Draggable fixed FAB: stores top/left in localStorage. Use a dedicated drag handle only
 * so primary FAB buttons keep normal clicks.
 */
export function useDraggableFab(storageKey: string, anchorClass: string) {
 const rootRef = ref<HTMLElement | null>(null)
 const left = ref<number | null>(null)
 const top = ref<number | null>(null)
 const ready = ref(false)

 let defaultLeft = 0
 let defaultTop = 0
 let dragging = false
 let dragStart = { x: 0, y: 0, left: 0, top: 0 }
 let captureEl: HTMLElement | null = null
 let capturePointerId = -1

 function applySavedOrDefault() {
 const el = rootRef.value
 if (!el) return
 const r = el.getBoundingClientRect()
 const w = r.width
 const h = r.height

 try {
 const raw = localStorage.getItem(storageKey)
 if (raw) {
 const p = JSON.parse(raw) as { left?: number; top?: number }
 if (typeof p.left === 'number' && typeof p.top === 'number') {
 const c = clamp(p.left, p.top, w, h)
 left.value = c.left
 top.value = c.top
 ready.value = true
 return
 }
 }
 } catch {
 // ignore
 }

 defaultLeft = r.left
 defaultTop = r.top
 left.value = r.left
 top.value = r.top
 ready.value = true
 }

 function persist() {
 if (left.value == null || top.value == null) return
 try {
 localStorage.setItem(storageKey, JSON.stringify({ left: left.value, top: top.value }))
 } catch {
 // ignore
 }
 }

 function onResize() {
 const el = rootRef.value
 if (!el || left.value == null || top.value == null) return
 const r = el.getBoundingClientRect()
 const c = clamp(left.value, top.value, r.width, r.height)
 left.value = c.left
 top.value = c.top
 persist()
 }

 onMounted(() => {
 nextTick(() => {
 applySavedOrDefault()
 })
 window.addEventListener('resize', onResize)
 })

 onUnmounted(() => {
 window.removeEventListener('resize', onResize)
 })

 function onHandlePointerDown(e: PointerEvent) {
 if (left.value == null || top.value == null) return
 e.preventDefault()
 e.stopPropagation()
 dragging = true
 dragStart = {
 x: e.clientX,
 y: e.clientY,
 left: left.value,
 top: top.value,
 }
 const target = e.currentTarget as HTMLElement
 captureEl = target
 capturePointerId = e.pointerId
 try {
 target.setPointerCapture(e.pointerId)
 } catch {
 // ignore
 }
 window.addEventListener('pointermove', onPointerMove)
 window.addEventListener('pointerup', onPointerUp, { capture: true })
 }

 function onPointerMove(e: PointerEvent) {
 if (!dragging || left.value == null || top.value == null) return
 const el = rootRef.value
 if (!el) return
 const r = el.getBoundingClientRect()
 const dx = e.clientX - dragStart.x
 const dy = e.clientY - dragStart.y
 const next = clamp(dragStart.left + dx, dragStart.top + dy, r.width, r.height)
 left.value = next.left
 top.value = next.top
 }

 function onPointerUp() {
 if (!dragging) return
 dragging = false
 window.removeEventListener('pointermove', onPointerMove)
 window.removeEventListener('pointerup', onPointerUp, { capture: true })
 try {
 if (captureEl && capturePointerId >= 0) {
 captureEl.releasePointerCapture(capturePointerId)
 }
 } catch {
 // ignore
 }
 captureEl = null
 capturePointerId = -1
 persist()
 }

 const fabStyle = computed(() => {
 if (!ready.value || left.value == null || top.value == null) {
 return undefined
 }
 return {
 left: `${left.value}px`,
 top: `${top.value}px`,
 right: 'auto',
 bottom: 'auto',
 } as Record<string, string>
 })

 /** Classes used only until first position is measured (default anchor). */
 const anchorClasses = computed(() => (ready.value ? '' : anchorClass))

 return {
 rootRef,
 ready,
 fabStyle,
 anchorClasses,
 onHandlePointerDown,
 }
}
