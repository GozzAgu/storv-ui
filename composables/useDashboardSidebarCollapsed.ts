/**
 * Sync sidebar collapse state with the dashboard layout (localStorage + lg breakpoint).
 */
export function useDashboardSidebarCollapsed() {
  const sidebarCollapsed = ref(false)
  const isLgUp = ref(false)

  const effectiveSidebarCollapsed = computed(() => sidebarCollapsed.value && isLgUp.value)

  onMounted(() => {
    if (!import.meta.client) return

    const readCollapsed = () => {
      try {
        const saved = localStorage.getItem('sidebarCollapsed')
        if (saved !== null) sidebarCollapsed.value = saved === 'true'
      } catch {
        /* ignore */
      }
    }

    readCollapsed()

    const mq = window.matchMedia('(min-width: 1024px)')
    const syncMq = () => {
      isLgUp.value = mq.matches
    }
    syncMq()
    mq.addEventListener('change', syncMq)

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sidebarCollapsed' && e.newValue !== null) {
        sidebarCollapsed.value = e.newValue === 'true'
      }
    }
    window.addEventListener('storage', onStorage)

    const poll = window.setInterval(readCollapsed, 400)

    onUnmounted(() => {
      mq.removeEventListener('change', syncMq)
      window.removeEventListener('storage', onStorage)
      window.clearInterval(poll)
    })
  })

  return { sidebarCollapsed: effectiveSidebarCollapsed }
}
