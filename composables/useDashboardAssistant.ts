import { resolveApiPath } from '~/utils/api-url'

export function useDashboardAssistant() {
  const config = useRuntimeConfig()
  const { isNativeApp } = useCapacitorNativeApp()
  const configured = useState('storvv-assistant-configured', () => false)
  const statusLoaded = useState('storvv-assistant-status-loaded', () => false)
  const assistantStore = useAssistantStore()
  let statusRequest: Promise<void> | null = null

  const apiBaseConfigured = computed(() => {
    if (!isNativeApp.value) return true
    return Boolean(String(config.public.apiBase || '').trim())
  })

  async function refreshStatus() {
    if (!import.meta.client) return
    if (!apiBaseConfigured.value) {
      configured.value = false
      statusLoaded.value = true
      return
    }
    if (!statusRequest) {
      statusRequest = (async () => {
        try {
          const result = (await $fetch(resolveApiPath('/api/assistant/status') as string)) as {
            configured: boolean
          }
          configured.value = Boolean(result.configured)
        } catch (error) {
          console.warn('[Storvv Assistant] status check failed', error)
        } finally {
          statusLoaded.value = true
          statusRequest = null
        }
      })()
    }
    await statusRequest
  }

  if (import.meta.client) {
    onMounted(() => {
      void refreshStatus()
    })
  }

  function openAssistant(draft?: string) {
    assistantStore.open(draft)
    void refreshStatus()
  }

  return {
    configured,
    statusLoaded,
    apiBaseConfigured,
    isNativeApp,
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
