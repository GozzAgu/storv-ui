<template>
  <div
    class="dashboard-assistant__panel flex min-h-0 flex-1 flex-col"
    :class="variant === 'float' ? 'dashboard-assistant__panel--float' : ''"
  >
    <div
      ref="messagesEl"
      class="dashboard-assistant__messages min-h-0 flex-1 overflow-y-auto"
      :class="variant === 'float' ? 'dashboard-assistant__messages--float' : 'px-4 py-4 sm:px-5'"
    >
      <div
        v-if="statusLoaded && isNativeApp && !apiBaseConfigured && !isDemoAssistant"
        class="dashboard-assistant__setup rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
      >
        The mobile app could not reach the Storvv server. Set
        <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">NUXT_PUBLIC_API_BASE=https://app.storvv.com</code>
        in <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">.env</code> and rebuild with
        <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">npm run cap:build</code>.
      </div>

      <div
        v-else-if="statusLoaded && isNativeApp && !statusReachable && !isDemoAssistant"
        class="dashboard-assistant__setup rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
      >
        Could not reach Storvv at
        <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">app.storvv.com</code>.
        Rebuild the mobile app after pulling the latest code
        (<code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">npm run cap:build</code>),
        then redeploy Vercel so Capacitor API access is enabled.
      </div>

      <div
        v-else-if="statusLoaded && !configured && !isDemoAssistant"
        class="dashboard-assistant__setup rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
      >
        <template v-if="isNativeApp">
          Storvv Assistant runs on your hosted server. Set
          <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">GEMINI_API_KEY</code>
          and
          <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">GEMINI_MODEL=gemini-3.1-flash-lite</code>
          on Vercel for <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">app.storvv.com</code>,
          then redeploy.
        </template>
        <template v-else>
          Storvv Assistant needs a Gemini API key on the server. Add
          <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">GEMINI_API_KEY</code>
          to your <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">.env</code>,
          then restart the dev server (<code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">npm run dev</code>),
          or set it on Vercel for production.
        </template>
      </div>

      <div v-else-if="!assistantStore.hasConversation" class="dashboard-assistant__empty">
        <p
          class="dashboard-assistant__privacy"
          :class="variant === 'float' ? '' : 'text-sm leading-relaxed text-gray-600 dark:text-gray-400'"
        >
          <template v-if="isDemoAssistant">
            Demo assistant uses canned tips about buybacks, analytics insights, Quick Sale,
            stock loans, and more. Sample numbers in charts are not your real store.
          </template>
          <template v-else>
            I can explain Storvv screens, permissions, and workflows. I do not see your live stock,
            sales, or customer data.
            <NuxtLink
              v-if="variant === 'float'"
              :to="dashPath('/help')"
              class="dashboard-assistant__privacy-link"
              @click="assistantStore.close()"
            >Help center</NuxtLink>.
          </template>
        </p>

        <div v-if="variant === 'float'" class="dashboard-assistant__quick-replies">
          <button
            v-for="prompt in suggestedPrompts"
            :key="prompt"
            type="button"
            class="dashboard-assistant__quick-reply"
            :disabled="assistantStore.sending"
            @click="sendPrompt(prompt)"
          >
            {{ prompt }}
          </button>
        </div>

        <div v-else class="space-y-4">
          <div>
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Try asking
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="prompt in suggestedPrompts"
                :key="prompt"
                type="button"
                class="dashboard-assistant__prompt"
                :disabled="assistantStore.sending"
                @click="sendPrompt(prompt)"
              >
                {{ prompt }}
              </button>
            </div>
          </div>
          <NuxtLink
            :to="dashPath('/help')"
            class="inline-flex text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
            @click="assistantStore.close()"
          >
            Browse Help center
          </NuxtLink>
        </div>
      </div>

      <div v-else class="dashboard-assistant__thread" :class="variant === 'float' ? 'dashboard-assistant__thread--float' : 'space-y-3'">
        <div
          v-for="message in assistantStore.messages"
          :key="message.id"
          class="dashboard-assistant__message"
          :class="[messageClass(message), variant === 'float' ? 'dashboard-assistant__message--float' : '']"
        >
          <div
            v-if="variant === 'float' && message.role !== 'user'"
            class="dashboard-assistant__avatar"
            aria-hidden="true"
          >
            <span>S</span>
          </div>
          <div class="dashboard-assistant__bubble">
            <p v-if="variant !== 'float'" class="dashboard-assistant__message-label">
              {{ message.role === 'user' ? 'You' : 'Assistant' }}
            </p>
            <p class="dashboard-assistant__message-body whitespace-pre-wrap">{{ message.content }}</p>
          </div>
        </div>

        <div
          v-if="assistantStore.sending"
          class="dashboard-assistant__message dashboard-assistant__message--assistant"
          :class="variant === 'float' ? 'dashboard-assistant__message--float' : ''"
        >
          <div v-if="variant === 'float'" class="dashboard-assistant__avatar" aria-hidden="true">
            <span>S</span>
          </div>
          <div class="dashboard-assistant__bubble">
            <p v-if="variant !== 'float'" class="dashboard-assistant__message-label">Assistant</p>
            <p class="dashboard-assistant__message-body text-gray-500 dark:text-gray-400">Thinking…</p>
          </div>
        </div>
      </div>
    </div>

    <form
      class="dashboard-assistant__composer shrink-0"
      :class="[
        isNativeApp ? 'dashboard-assistant__composer--native' : '',
        variant === 'float'
          ? 'dashboard-assistant__composer--float'
          : 'border-t border-gray-200/80 px-4 py-3 dark:border-white/[0.08] sm:px-5',
      ]"
      @submit.prevent="submitDraft"
    >
      <label for="dashboard-assistant-input" class="sr-only">Message Storvv Assistant</label>

      <div v-if="variant === 'float'" class="dashboard-assistant__composer-pill">
        <input
          id="dashboard-assistant-input"
          ref="inputEl"
          v-model="draft"
          type="text"
          class="dashboard-assistant__composer-input"
          placeholder="Ask anything"
          autocomplete="off"
          :disabled="assistantStore.sending"
          @keydown.enter.exact.prevent="submitDraft"
        />
        <button
          type="submit"
          class="dashboard-assistant__composer-send"
          :disabled="!canSend"
          aria-label="Send message"
        >
          <PaperAirplaneIcon class="h-5 w-5" stroke-width="1.75" />
        </button>
      </div>

      <template v-else>
        <div class="flex items-end gap-2">
          <textarea
            id="dashboard-assistant-input"
            ref="inputEl"
            v-model="draft"
            rows="2"
            class="app-field min-h-[2.75rem] flex-1 resize-none rounded-xl px-3 py-2 text-sm dark:!bg-white/[0.04]"
            placeholder="Ask about sales, inventory, staff roles…"
            :disabled="assistantStore.sending || (!isDemoAssistant && (!apiBaseConfigured || !statusLoaded || !configured))"
            @keydown.enter.exact.prevent="submitDraft"
          />
          <Button
            type="submit"
            size="sm"
            class="shrink-0"
            :disabled="!canSend"
            :loading="assistantStore.sending"
          >
            Send
          </Button>
        </div>
        <div class="mt-2 flex items-center justify-between gap-2">
          <p class="text-[11px] text-gray-500 dark:text-gray-400">
            Powered by Gemini. Answers are guidance only.
          </p>
          <button
            v-if="assistantStore.hasConversation"
            type="button"
            class="text-[11px] font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            :disabled="assistantStore.sending"
            @click="assistantStore.clearConversation()"
          >
            Clear chat
          </button>
        </div>
      </template>

      <div
        v-if="variant === 'float' && assistantStore.hasConversation"
        class="dashboard-assistant__composer-meta"
      >
        <button
          type="button"
          class="dashboard-assistant__clear"
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
import { computed, nextTick, ref, watch } from 'vue'
import { PaperAirplaneIcon } from '~/utils/app-icons'
import Button from '~/components/ui/Button.vue'
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
const inputEl = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)

const suggestedPrompts = [
  'How do optional subcategories work?',
  'How do I copy categories from another branch?',
  'How do I create a branch with my region cities?',
  'How do customer buybacks work?',
  'What is in Analytics feature insights?',
] as const

const canSend = computed(
  () =>
    (isDemoAssistant.value || (apiBaseConfigured.value && statusLoaded.value && configured.value)) &&
    draft.value.trim().length > 0 &&
    !assistantStore.sending
)

function messageClass(message: AssistantMessage): string {
  if (message.error) return 'dashboard-assistant__message--error'
  return message.role === 'user'
    ? 'dashboard-assistant__message--user'
    : 'dashboard-assistant__message--assistant'
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
    nextTick(() => inputEl.value?.focus())
  }
)

watch(
  () => [assistantStore.messages.length, assistantStore.sending] as const,
  () => {
    if (assistantStore.isOpen) scrollToBottom()
  }
)
</script>

<style scoped>
.dashboard-assistant__panel:not(.dashboard-assistant__panel--float) {
  min-height: min(70vh, calc(100dvh - 8rem));
}

.dashboard-assistant__messages {
  overscroll-behavior: contain;
}

.dashboard-assistant__messages--float {
  position: relative;
  z-index: 0;
  padding: 0.75rem 1.125rem 0.5rem;
}

.dashboard-assistant__privacy {
  margin: 0 0 1rem;
  font-size: 0.75rem;
  line-height: 1.55;
  color: var(--dash-overlay-muted, var(--saas-muted, #64748b));
}

.dashboard-assistant__privacy-link {
  font-weight: 600;
  color: var(--dash-overlay-ink, var(--saas-ink, #0f172a));
  text-decoration: underline;
  text-underline-offset: 2px;
}

.dashboard-assistant__quick-replies {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--dash-overlay-border, var(--saas-glass-border, rgb(15 23 42 / 0.08)));
  border-radius: 0.875rem;
  background: transparent;
}

.dashboard-assistant__quick-reply {
  padding: 0.8125rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--dash-overlay-ink, var(--saas-ink, #0f172a));
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--dash-overlay-divider, rgb(15 23 42 / 0.06));
  transition: background-color 0.15s ease;
}

.dashboard-assistant__quick-reply:last-child {
  border-bottom: 0;
}

.dashboard-assistant__quick-reply:hover:not(:disabled) {
  background: rgb(15 23 42 / 0.04);
}

html.dark .dashboard-assistant__quick-reply:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.05);
}

.dashboard-assistant__quick-reply:disabled {
  opacity: 0.55;
}

.dashboard-assistant__prompt {
  border-radius: 9999px;
  border: 1px solid rgb(20 63 141 / 0.12);
  background: rgb(20 63 141 / 0.05);
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(30 58 95);
  transition: background-color 0.15s ease;
}

.dashboard-assistant__prompt:hover:not(:disabled) {
  background: rgb(20 63 141 / 0.1);
}

html.dark .dashboard-assistant__prompt {
  border-color: rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.05);
  color: rgb(226 232 240);
}

.dashboard-assistant__thread--float {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.dashboard-assistant__message {
  border-radius: 1rem;
  padding: 0.75rem 0.875rem;
}

.dashboard-assistant__message--float {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  padding: 0;
  border-radius: 0;
  background: transparent;
}

.dashboard-assistant__message--float.dashboard-assistant__message--user {
  margin-left: 2rem;
  justify-content: flex-end;
}

.dashboard-assistant__message--float.dashboard-assistant__message--assistant,
.dashboard-assistant__message--float.dashboard-assistant__message--error {
  margin-right: 0.5rem;
}

.dashboard-assistant__avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  background: #143f8d;
  color: #fff;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

html.dark .dashboard-assistant__avatar {
  background: rgb(154 181 227 / 0.18);
  color: #9ab5e3;
}

.dashboard-assistant__bubble {
  min-width: 0;
}

.dashboard-assistant__message--float .dashboard-assistant__bubble {
  max-width: 100%;
  border-radius: 1.125rem;
  padding: 0.75rem 0.9375rem;
}

.dashboard-assistant__message--float.dashboard-assistant__message--assistant .dashboard-assistant__bubble {
  border-bottom-left-radius: 0.375rem;
  background: rgb(15 23 42 / 0.04);
}

html.dark .dashboard-assistant__message--float.dashboard-assistant__message--assistant .dashboard-assistant__bubble {
  background: rgb(255 255 255 / 0.06);
}

.dashboard-assistant__message--float.dashboard-assistant__message--user .dashboard-assistant__bubble {
  border-bottom-right-radius: 0.375rem;
  background: var(--saas-accent-soft, rgb(20 63 141 / 0.1));
}

.dashboard-assistant__message--float.dashboard-assistant__message--error .dashboard-assistant__bubble {
  background: rgb(254 242 242);
  color: rgb(153 27 27);
}

html.dark .dashboard-assistant__message--float.dashboard-assistant__message--error .dashboard-assistant__bubble {
  background: rgb(127 29 29 / 0.25);
  color: rgb(252 165 165);
}

.dashboard-assistant__message--user:not(.dashboard-assistant__message--float) {
  margin-left: 1.5rem;
  background: rgb(20 63 141 / 0.08);
}

.dashboard-assistant__message--assistant:not(.dashboard-assistant__message--float) {
  margin-right: 1.5rem;
  background: rgb(248 250 252);
}

.dashboard-assistant__message--error:not(.dashboard-assistant__message--float) {
  margin-right: 1.5rem;
  background: rgb(254 242 242);
  color: rgb(153 27 27);
}

html.dark .dashboard-assistant__message--user:not(.dashboard-assistant__message--float) {
  background: rgb(20 63 141 / 0.18);
}

html.dark .dashboard-assistant__message--assistant:not(.dashboard-assistant__message--float) {
  background: rgb(255 255 255 / 0.04);
}

html.dark .dashboard-assistant__message--error:not(.dashboard-assistant__message--float) {
  background: rgb(127 29 29 / 0.25);
  color: rgb(252 165 165);
}

.dashboard-assistant__message-label {
  margin-bottom: 0.25rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(100 116 139);
}

.dashboard-assistant__message-body {
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--dash-overlay-ink, var(--saas-ink, #0f172a));
}

.dashboard-assistant__message--error .dashboard-assistant__message-body {
  color: inherit;
}

.dashboard-assistant__composer--float {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  padding: 0.5rem 1rem 1rem;
  pointer-events: auto;
  background: transparent;
}

.dashboard-assistant__composer-pill {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 3rem;
  padding: 0.375rem 0.5rem 0.375rem 1rem;
  border-radius: 9999px;
  background: #f3f4f6;
  border: 1px solid rgb(15 23 42 / 0.08);
}

html.dark .dashboard-assistant__composer-pill {
  background: rgb(255 255 255 / 0.05);
  border-color: rgb(255 255 255 / 0.08);
}

.dashboard-assistant__composer-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  padding: 0.5rem 0;
  font-size: 0.9375rem;
  line-height: 1.4;
  color: var(--dash-overlay-ink, var(--saas-ink, #0f172a));
  outline: none;
  pointer-events: auto;
  -webkit-user-select: text;
  user-select: text;
}

.dashboard-assistant__composer-input:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.dashboard-assistant__composer-input::placeholder {
  color: var(--dash-overlay-muted, var(--saas-muted, #94a3b8));
}

.dashboard-assistant__composer-send {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: var(--dash-overlay-muted, #64748b);
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.dashboard-assistant__composer-send:hover:not(:disabled) {
  color: var(--saas-accent, #143f8d);
  background: var(--saas-accent-soft, rgb(20 63 141 / 0.08));
}

.dashboard-assistant__composer-send:disabled {
  opacity: 0.35;
}

.dashboard-assistant__composer-meta {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
  padding: 0 0.25rem;
}

.dashboard-assistant__clear {
  font-size: 0.6875rem;
  font-weight: 500;
  color: rgb(148 163 184);
  background: transparent;
  border: 0;
  padding: 0;
}

.dashboard-assistant__clear:hover:not(:disabled) {
  color: rgb(71 85 105);
}

html.dark .dashboard-assistant__clear:hover:not(:disabled) {
  color: rgb(226 232 240);
}
</style>
