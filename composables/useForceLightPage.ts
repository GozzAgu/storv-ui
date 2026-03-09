/**
 * Force the page to always render in light mode (no dark mode).
 * Use on signin, signup, forgot-password, and landing page.
 * On unmount, the user's theme preference is restored.
 */
export const useForceLightPage = () => {
  const { applyTheme } = useTheme()

  onMounted(() => {
    if (import.meta.client) {
      document.documentElement.classList.remove('dark')
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.client) {
      applyTheme()
    }
  })
}
