import { defineStore } from 'pinia'
import { sanitizeAssistantReply } from '~/utils/assistant-chat'

export type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

function createMessageId(): string {
  return `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useAssistantStore = defineStore('assistant', {
  state: () => ({
    isOpen: false,
    messages: [] as AssistantMessage[],
    sending: false,
    error: null as string | null,
    draftSeed: null as string | null,
  }),

  getters: {
    hasConversation: (state) => state.messages.length > 0,
  },

  actions: {
    open(draft?: string) {
      this.isOpen = true
      this.error = null
      if (typeof draft === 'string' && draft.trim()) {
        this.draftSeed = draft.trim()
      }
    },

    close() {
      this.isOpen = false
    },

    toggle() {
      if (this.isOpen) {
        this.close()
      } else {
        this.open()
      }
    },

    clearConversation() {
      this.messages = []
      this.error = null
    },

    takeDraftSeed(): string | null {
      const seed = this.draftSeed
      this.draftSeed = null
      return seed
    },

    async sendMessage(content: string) {
      const trimmed = content.trim()
      if (!trimmed || this.sending) return

      this.error = null
      this.messages.push({
        id: createMessageId(),
        role: 'user',
        content: trimmed,
      })
      this.sending = true

      try {
        const { isDemoModeActive } = await import('~/utils/demo-mode')
        if (isDemoModeActive()) {
          const { generateDemoAssistantReply } = await import('~/utils/demo-assistant')
          await new Promise((resolve) => setTimeout(resolve, 350))
          this.messages.push({
            id: createMessageId(),
            role: 'assistant',
            content: generateDemoAssistantReply(trimmed),
          })
          return
        }

        const { authFetch } = useAuthenticatedFetch()
        const payload = {
          messages: this.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }
        const result = await authFetch<{ reply: string }>('/api/assistant/chat', {
          method: 'POST',
          body: payload,
        })

        this.messages.push({
          id: createMessageId(),
          role: 'assistant',
          content: sanitizeAssistantReply(result.reply),
        })
      } catch (error) {
        const err = error as {
          data?: { message?: string }
          statusMessage?: string
          message?: string
        }
        const message =
          err?.data?.message ||
          err?.statusMessage ||
          err?.message ||
          'Could not reach Storvv Assistant. Please try again.'
        this.error = message
        this.messages.push({
          id: createMessageId(),
          role: 'assistant',
          content: message,
          error: true,
        })
      } finally {
        this.sending = false
      }
    },
  },
})
