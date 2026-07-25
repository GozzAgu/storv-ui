<template>
  <div class="dashboard-assistant">
    <Teleport v-if="!isNativeApp" to="body">
      <button
        type="button"
        class="dashboard-assistant__fab"
        :aria-expanded="assistantStore.isOpen"
        aria-controls="dashboard-assistant-panel"
        aria-label="Open Storvv Assistant"
        @click="assistantStore.toggle()"
      >
        <SparklesIcon class="h-5 w-5" stroke-width="1.75" />
        <span class="sr-only">Storvv Assistant</span>
      </button>
    </Teleport>
    <button
      v-else
      type="button"
      class="dashboard-assistant__fab dashboard-assistant__fab--native"
      :aria-expanded="assistantStore.isOpen"
      aria-controls="dashboard-assistant-panel"
      aria-label="Open Storvv Assistant"
      @click="assistantStore.toggle()"
    >
      <SparklesIcon class="h-5 w-5" stroke-width="1.75" />
      <span class="sr-only">Storvv Assistant</span>
    </button>

    <SidePanel
      id="dashboard-assistant-panel"
      v-model="assistantStore.isOpen"
      title="Storvv Assistant"
      subtitle="Ask how to use inventory, receipts, roles, and plans."
      size="md"
      dense
      content-padding="p-0"
      blur-backdrop
    >
      <div class="dashboard-assistant__panel flex min-h-0 flex-1 flex-col">
        <div ref="messagesEl" class="dashboard-assistant__messages min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div
            v-if="statusLoaded && isNativeApp && !apiBaseConfigured"
            class="dashboard-assistant__setup rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
          >
            The iOS app could not reach the Storvv server. Set
            <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">NUXT_PUBLIC_API_BASE=https://app.storvv.com</code>
            in <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">.env</code> and rebuild with
            <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">npm run cap:build:ios</code>.
          </div>

          <div
            v-else-if="statusLoaded && isNativeApp && !statusReachable"
            class="dashboard-assistant__setup rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
          >
            Could not reach Storvv at
            <code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">app.storvv.com</code>.
            Rebuild the iOS app after pulling the latest code
            (<code class="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">npm run cap:build:ios</code>),
            then redeploy Vercel so Capacitor API access is enabled.
          </div>

          <div
            v-else-if="statusLoaded && !configured"
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

          <div v-else-if="!assistantStore.hasConversation" class="dashboard-assistant__empty space-y-4">
            <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              I can explain Storvv screens, permissions, and workflows. I do not see your live stock,
              sales, or customer data.
            </p>
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
              to="/dashboard/help"
              class="inline-flex text-sm font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
              @click="assistantStore.close()"
            >
              Browse Help center
            </NuxtLink>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="message in assistantStore.messages"
              :key="message.id"
              class="dashboard-assistant__message"
              :class="messageClass(message)"
            >
              <p class="dashboard-assistant__message-label">
                {{ message.role === 'user' ? 'You' : 'Assistant' }}
              </p>
              <p class="dashboard-assistant__message-body whitespace-pre-wrap">{{ message.content }}</p>
            </div>

            <div v-if="assistantStore.sending" class="dashboard-assistant__message dashboard-assistant__message--assistant">
              <p class="dashboard-assistant__message-label">Assistant</p>
              <p class="dashboard-assistant__message-body text-gray-500 dark:text-gray-400">Thinking…</p>
            </div>
          </div>
        </div>

        <form
          class="dashboard-assistant__composer shrink-0 border-t border-gray-200/80 px-4 py-3 dark:border-white/[0.08] sm:px-5"
          :class="isNativeApp ? 'dashboard-assistant__composer--native' : ''"
          @submit.prevent="submitDraft"
        >
          <label for="dashboard-assistant-input" class="sr-only">Message Storvv Assistant</label>
          <div class="flex items-end gap-2">
            <textarea
              id="dashboard-assistant-input"
              ref="inputEl"
              v-model="draft"
              rows="2"
              class="app-field min-h-[2.75rem] flex-1 resize-none rounded-xl px-3 py-2 text-sm dark:!bg-white/[0.04]"
              placeholder="Ask about receipts, inventory, staff roles…"
              :disabled="!apiBaseConfigured || !statusLoaded || !configured || assistantStore.sending"
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
        </form>
      </div>
    </SidePanel>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { SparklesIcon } from '~/utils/app-icons'
import SidePanel from '~/components/ui/SidePanel.vue'
import Button from '~/components/ui/Button.vue'
import { useDashboardAssistant } from '~/composables/useDashboardAssistant'
import type { AssistantMessage } from '~/stores/assistant'

const { configured, statusLoaded, statusReachable, apiBaseConfigured, isNativeApp, assistantStore, refreshStatus } =
  useDashboardAssistant()

const draft = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLTextAreaElement | null>(null)

const suggestedPrompts = [
  'How do I create a receipt?',
  'What can store managers do?',
  'Which plan includes Analytics?',
  'How do stock loans work?',
] as const

const canSend = computed(
  () =>
    apiBaseConfigured.value &&
    statusLoaded.value &&
    configured.value &&
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
.dashboard-assistant__fab {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  border: 1px solid rgb(20 63 141 / 0.12);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  color: rgb(20 63 141);
  box-shadow: 0 16px 40px rgb(15 23 42 / 0.14);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.dashboard-assistant__fab:hover {
  transform: translateY(-1px);
  box-shadow: 0 20px 44px rgb(15 23 42 / 0.18);
}

.dashboard-assistant__fab--native {
  bottom: calc(env(safe-area-inset-bottom, 0px) + 4.75rem);
}

html.dark .dashboard-assistant__fab {
  border-color: rgb(255 255 255 / 0.1);
  background: linear-gradient(180deg, rgb(24 28 38) 0%, rgb(18 20 28) 100%);
  color: rgb(154 181 227);
  box-shadow: 0 18px 44px rgb(0 0 0 / 0.45);
}

.dashboard-assistant__panel {
  min-height: min(70vh, calc(100dvh - 8rem));
}

.dashboard-assistant__messages {
  overscroll-behavior: contain;
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

.dashboard-assistant__message {
  border-radius: 1rem;
  padding: 0.75rem 0.875rem;
}

.dashboard-assistant__message--user {
  margin-left: 1.5rem;
  background: rgb(20 63 141 / 0.08);
}

.dashboard-assistant__message--assistant {
  margin-right: 1.5rem;
  background: rgb(248 250 252);
}

.dashboard-assistant__message--error {
  margin-right: 1.5rem;
  background: rgb(254 242 242);
  color: rgb(153 27 27);
}

html.dark .dashboard-assistant__message--user {
  background: rgb(20 63 141 / 0.18);
}

html.dark .dashboard-assistant__message--assistant {
  background: rgb(255 255 255 / 0.04);
}

html.dark .dashboard-assistant__message--error {
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
  color: rgb(15 23 42);
}

html.dark .dashboard-assistant__message-body {
  color: rgb(241 245 249);
}

.dashboard-assistant__message--error .dashboard-assistant__message-body {
  color: inherit;
}
</style>
