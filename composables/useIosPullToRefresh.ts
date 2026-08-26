const IOS_PTR_HANDLER_KEY = 'ios-ptr-handler'

/** Pages register their refresh logic (home, sales, analytics, etc.). */
export function useIosPullToRefreshRegister(handler: () => Promise<void>) {
  const registered = useState<(() => Promise<void>) | null>(IOS_PTR_HANDLER_KEY, () => null)

  onMounted(() => {
    registered.value = handler
  })

  onUnmounted(() => {
    if (registered.value === handler) {
      registered.value = null
    }
  })
}

export function useIosPullToRefreshHandler() {
  return useState<(() => Promise<void>) | null>(IOS_PTR_HANDLER_KEY, () => null)
}
