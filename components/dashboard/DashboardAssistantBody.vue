<template>
  <div class="s-c s-assistant" :class="`s-assistant--${variant}`">
    <div ref="messagesEl" class="s-assistant__messages">
      <div
        v-if="statusLoaded && isNativeApp && !apiBaseConfigured && !isDemoAssistant"
        class="s-notice s-assistant__setup"
      >
        The mobile app could not reach the Storvv server. Set
        <code>NUXT_PUBLIC_API_BASE=https://app.storvv.com</code>
        in <code>.env</code> and rebuild with
        <code>npm run cap:build</code>.
      </div>

      <div
        v-else-if="statusLoaded && isNativeApp && !statusReachable && !isDemoAssistant"
        class="s-notice s-assistant__setup"
      >
        Could not reach Storvv at
        <code>app.storvv.com</code>.
        Rebuild the mobile app after pulling the latest code
        (<code>npm run cap:build</code>),
        then redeploy Vercel so Capacitor API access is enabled.
      </div>

      <div
        v-else-if="statusLoaded && !configured && !isDemoAssistant"
        class="s-notice s-assistant__setup"
      >
        <template v-if="isNativeApp">
          Storvv Assistant runs on your hosted server. Set
          <code>GEMINI_API_KEY</code>
          and
          <code>GEMINI_MODEL=gemini-3.1-flash-lite</code>
          on Vercel for <code>app.storvv.com</code>,
          then redeploy.
        </template>
        <template v-else>
          Storvv Assistant needs a Gemini API key on the server. Add
          <code>GEMINI_API_KEY</code>
          to your <code>.env</code>,
          then restart the dev server (<code>npm run dev</code>),
          or set it on Vercel for production.
        </template>
      </div>

      <div v-else-if="!assistantStore.hasConversation" class="s-assistant__intro">
        <p class="s-assistant__privacy">
          <template v-if="isDemoAssistant">
            Demo assistant uses canned tips about the iOS app, sales leads, trade-ins,
            analytics, Quick Sale, stock loans, and more. Sample numbers in charts are not your real store.
          </template>
          <template v-else>
            I can explain Storvv screens, permissions, and workflows. I do not see your live stock,
            sales, or customer data.
          </template>
        </p>

        <div class="s-assistant__suggestions" role="group" :aria-labelledby="suggestionsLabelId">
          <p :id="suggestionsLabelId" class="s-assistant__caption">Try asking</p>
          <SButton
            v-for="prompt in suggestedPrompts"
            :key="prompt"
            class="s-assistant__suggestion"
            size="sm"
            :disabled="assistantStore.sending"
            @click="sendPrompt(prompt)"
          >
            {{ prompt }}
          </SButton>
        </div>

        <NuxtLink
          :to="dashPath('/help')"
          class="s-link s-assistant__help"
          @click="assistantStore.close()"
        >
          Browse Help center
        </NuxtLink>
      </div>

      <div v-else class="s-assistant__thread" aria-live="polite">
        <div
          v-for="message in assistantStore.messages"
          :key="message.id"
          class="s-assistant__message"
          :class="messageClass(message)"
        >
          <SAvatar
            v-if="message.role !== 'user'"
            class="s-assistant__avatar"
            size="sm"
            aria-hidden="true"
          >S</SAvatar>
          <div class="s-assistant__bubble">
            <span class="ds-sr-only">{{ message.role === 'user' ? 'You:' : 'Assistant:' }}</span>
            {{ message.content }}
          </div>
        </div>

        <div
          v-if="assistantStore.sending"
          class="s-assistant__message s-assistant__message--assistant"
        >
          <SAvatar class="s-assistant__avatar" size="sm" aria-hidden="true">S</SAvatar>
          <div class="s-assistant__bubble s-assistant__bubble--pending">
            <SSpinner :size="14" />
            Thinking…
          </div>
        </div>
      </div>
    </div>

    <form class="s-assistant__composer" @submit.prevent="submitDraft">
      <div ref="composerEl" class="s-assistant__field">
        <STextarea
          id="dashboard-assistant-input"
          v-model="draft"
          class="s-assistant__input"
          :rows="1"
          :placeholder="variant === 'float' ? 'Ask anything' : 'Ask about sales, inventory, staff roles…'"
          aria-label="Message Storvv Assistant"
          autocomplete="off"
          :disabled="assistantStore.sending"
          @keydown.enter.exact.prevent="submitDraft"
        />
        <SIconButton
          type="submit"
          class="s-assistant__send"
          variant="secondary"
          label="Send message"
          :disabled="!canSend"
          :loading="assistantStore.sending"
        >
          <SendHorizontal :size="16" :stroke-width="2" aria-hidden="true" />
        </SIconButton>
      </div>
      <div class="s-assistant__meta">
        <p>Powered by Gemini. Answers are guidance only.</p>
        <button
          v-if="assistantStore.hasConversation"
          type="button"
          class="s-assistant__clear"
          :disabled="assistantStore.sending"
          @click="assistantStore.clearConversation()"
        >
          Clear chat
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'
import { SendHorizontal } from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SButton from '~/components/s/SButton.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import STextarea from '~/components/s/STextarea.vue'
import { useDashboardAssistant } from '~/composables/useDashboardAssistant'
import type { AssistantMessage } from '~/stores/assistant'

withDefaults(
  defineProps<{
    variant?: 'float' | 'sheet'
  }>(),
  { variant: 'sheet' }
)

const { configured, statusLoaded, statusReachable, apiBaseConfigured, isNativeApp, isDemoAssistant, assistantStore, refreshStatus } =
  useDashboardAssistant()
const { dashPath } = useDashboardPaths()

const draft = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const composerEl = ref<HTMLElement | null>(null)
const suggestionsLabelId = `assistant-suggestions-${useId()}`

const suggestedPrompts = [
  'What is new in the Storvv iOS app?',
  'How do sales leads work?',
  'How do optional subcategories work?',
  'How do I copy categories from another branch?',
  'What is in Analytics feature insights?',
] as const

const canSend = computed(
  () =>
    (isDemoAssistant.value || (apiBaseConfigured.value && statusLoaded.value && configured.value)) &&
    draft.value.trim().length > 0 &&
    !assistantStore.sending
)

function messageClass(message: AssistantMessage): string {
  if (message.error) return 's-assistant__message--error'
  return message.role === 'user' ? 's-assistant__message--user' : 's-assistant__message--assistant'
}

function focusInput() {
  composerEl.value?.querySelector('textarea')?.focus()
}

async function scrollToBottom() {
  await nextTick()
  const el = messagesEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function submitDraft() {
  const text = draft.value.trim()
  if (!text || assistantStore.sending) return
  draft.value = ''
  await assistantStore.sendMessage(text)
  await scrollToBottom()
  focusInput()
}

async function sendPrompt(prompt: string) {
  if (assistantStore.sending) return
  await assistantStore.sendMessage(prompt)
  await scrollToBottom()
}

watch(
  () => assistantStore.isOpen,
  (open) => {
    if (!open) return
    void refreshStatus()
    const seed = assistantStore.takeDraftSeed()
    if (seed) draft.value = seed
  },
  { immediate: true }
)

watch(
  () => [assistantStore.messages.length, assistantStore.sending] as const,
  () => {
    if (assistantStore.isOpen) scrollToBottom()
  }
)
</script>
