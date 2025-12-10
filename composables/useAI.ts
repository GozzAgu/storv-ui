import { ref } from 'vue'

export const useAI = () => {
  const isGenerating = ref(false)
  const error = ref<string | null>(null)

  const generateDescription = async (folderName: string, folderType?: string): Promise<string | null> => {
    if (!folderName || folderName.trim().length === 0) {
      error.value = 'Please provide a folder name first'
      return null
    }

    isGenerating.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; description?: string; error?: string }>('/api/ai/generate-description', {
        method: 'POST',
        body: {
          folderName: folderName.trim(),
          folderType: folderType || 'general'
        }
      })

      if (response.success && response.description) {
        error.value = null
        return response.description
      } else {
        error.value = response.error || 'Failed to generate description'
        return null
      }
    } catch (err: any) {
      console.error('AI generation error:', err)
      error.value = err.message || 'Failed to generate description. Please try again.'
      return null
    } finally {
      isGenerating.value = false
    }
  }

  return {
    generateDescription,
    isGenerating,
    error
  }
}
