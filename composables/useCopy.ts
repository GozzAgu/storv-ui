import { useAppToast } from './useAppToast'

export const useCopy = () => {
  const toast = useAppToast()

  const copyToClipboard = async (text: string, label: string = 'Text') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied!`)
      return true
    } catch (error: any) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        toast.success(`${label} copied!`)
        return true
      } catch (fallbackError) {
        toast.error('Failed to copy to clipboard')
        return false
      }
    }
  }

  return {
    copyToClipboard,
  }
}
