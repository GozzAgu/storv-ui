import { resolveApiPath } from '~/utils/api-url'
import { isApiBaseConfigured } from '~/utils/capacitor-api-base'
import { isDemoModeActive } from '~/utils/demo-mode'

export function useDashboardAssistant() {
  const { isNativeApp } = useCapacitorNativeApp()
  const configured = useState('storvv-assistant-configured', () => false)
  const statusLoaded = useState('storvv-assistant-status-loaded', () => false)
  const statusReachable = useState('storvv-assistant-status-reachable', () => true)
  const assistantStore = useAssistantStore()
  const isDemoAssistant = computed(() => import.meta.client && isDemoModeActive())
  let statusRequest: Promise<void> | null = null

  const apiBaseConfigured = computed(() => {
    if (!isNativeApp.value) return true
    return isApiBaseConfigured()
  })

  async function refreshStatus() {
    if (!import.meta.client) return
    if (isDemoModeActive()) {
      configured.value = true
      statusReachable.value = true
      statusLoaded.value = true
      return
    }
    if (!apiBaseConfigured.value) {
      configured.value = false
      statusReachable.value = false
      statusLoaded.value = true
      return
    }
    if (!statusRequest) {
      statusRequest = (async () => {
        try {
          const statusUrl: string = resolveApiPath('/api/assistant/status')
          const result = (await $fetch(statusUrl)) as { configured: boolean }
          configured.value = Boolean(result.configured)
          statusReachable.value = true
        } catch (error) {
          console.warn('[Storvv Assistant] status check failed', error)
          configured.value = false
          statusReachable.value = false
        } finally {
          statusLoaded.value = true
          statusRequest = null
        }
      })()
    }
    await statusRequest
  }

  function openAssistant(draft?: string) {
    assistantStore.open(draft)
    void refreshStatus()
  }

  return {
    configured,
    statusLoaded,
    statusReachable,
    apiBaseConfigured,
    isNativeApp,
    isDemoAssistant,
    assistantStore,
    openAssistant,
    refreshStatus,
  }
}

export function buildAssistantTopicPrompt(topic: string): string {
  const trimmed = topic.trim()
  if (!trimmed) return 'How do I use this part of Storvv?'
  return `How does ${trimmed} work in Storvv?`
}
