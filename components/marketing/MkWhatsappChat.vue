<template>
  <div ref="rootEl" class="mkw" :class="{ 'mkw--open': open }">
    <Transition name="mkw-card">
      <section
        v-if="open"
        :id="cardId"
        class="mkw__card"
        role="dialog"
        aria-label="Chat with Storvv on WhatsApp"
      >
        <header class="mkw__head">
          <span class="mkw__avatar" aria-hidden="true">
            <img src="/brand/storvv-symbol.png" alt="" width="22" height="22" @error="hideMark" />
          </span>
          <div class="mkw__who">
            <p class="mkw__name">Storvv team</p>
            <p class="mkw__status">Replies on WhatsApp</p>
          </div>
          <button type="button" class="mkw__close" aria-label="Close chat" @click="open = false">
            <X :size="16" :stroke-width="2" aria-hidden="true" />
          </button>
        </header>

        <div class="mkw__body">
          <p class="mkw__bubble">
            Hi there. Ask us anything about Storvv: pricing, setting up your store, or moving from
            your current system.
          </p>

          <p class="mkw__label">What can we help with?</p>
          <div class="mkw__topics" role="group" aria-label="Topic">
            <button
              v-for="t in topics"
              :key="t.id"
              type="button"
              class="mkw__topic"
              :aria-pressed="topic === t.id"
              @click="topic = t.id"
            >
              {{ t.label }}
            </button>
          </div>
        </div>

        <footer class="mkw__foot">
          <a
            :href="chatUrl"
            target="_blank"
            rel="noopener"
            class="mkw__start"
            @click="open = false"
          >
            <WhatsappGlyph class="mkw__start-icon" />
            Continue on WhatsApp
          </a>
          <p class="mkw__note">Opens WhatsApp with your message ready to send.</p>
        </footer>
      </section>
    </Transition>

    <button
      ref="toggleEl"
      type="button"
      class="mkw__toggle"
      :aria-expanded="open"
      :aria-controls="cardId"
      :aria-label="open ? 'Close chat' : 'Chat with us on WhatsApp'"
      @click="open = !open"
    >
      <WhatsappGlyph v-if="!open" class="mkw__toggle-icon" />
      <X v-else :size="20" :stroke-width="2" aria-hidden="true" />
      <span v-if="!open" class="mkw__toggle-text">Chat with us</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { X } from '~/icons'
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { storvvWhatsappLink } from '~/utils/storvv-whatsapp'
import { whatsappChatMessage, type WhatsappTopic } from '~/utils/whatsapp-chat-message'

/** WhatsApp's mark, so the button is recognisable at a glance. */
const WhatsappGlyph = defineComponent({
  name: 'WhatsappGlyph',
  setup:
    (_, { attrs }) =>
    () =>
      h('svg', { ...attrs, viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true' }, [
        h('path', {
          fill: 'currentColor',
          d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z',
        }),
      ]),
})

const route = useRoute()
const open = ref(false)
const topic = ref<WhatsappTopic>('question')
const toggleEl = ref<HTMLButtonElement | null>(null)
const rootEl = ref<HTMLElement | null>(null)
const cardId = `mkw-${useId()}`

const topics: { id: WhatsappTopic; label: string }[] = [
  { id: 'question', label: 'A quick question' },
  { id: 'pricing', label: 'Pricing and plans' },
  { id: 'setup', label: 'Setting up my store' },
  { id: 'demo', label: 'A walkthrough' },
]

const chatUrl = computed(() => storvvWhatsappLink(whatsappChatMessage(topic.value, route.path)))

function hideMark(event: Event) {
  ;(event.target as HTMLElement).style.display = 'none'
}

/** A tap or click anywhere outside the card and its button closes it. */
function onPointerDown(event: PointerEvent) {
  if (open.value && !rootEl.value?.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
    toggleEl.value?.focus()
  }
}

watch(
  () => route.path,
  () => {
    open.value = false
  }
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', onPointerDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('pointerdown', onPointerDown)
})
</script>

<style scoped>
.mkw {
  --mkw-green: #1fa855;
  --mkw-green-hover: #19924a;
  position: fixed;
  right: var(--s-space-3);
  bottom: calc(var(--s-space-3) + env(safe-area-inset-bottom, 0px));
  z-index: calc(var(--s-z-sticky) + 1);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

/* The button: a calm pill on wide screens, a round button on phones */
.mkw__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  min-width: 52px;
  padding: 0 16px;
  border: 0;
  border-radius: var(--s-radius-full);
  background: var(--mkw-green);
  box-shadow: 0 10px 24px -10px rgb(20 120 60 / 0.55), 0 2px 6px rgb(16 24 40 / 0.12);
  color: #fff;
  font: 600 0.9375rem / 1 var(--s-font-sans);
  cursor: pointer;
  transition: background-color 160ms ease, transform 220ms var(--s-spring, ease),
    box-shadow 200ms ease;
}

.mkw__toggle:hover {
  background: var(--mkw-green-hover);
  transform: translateY(-1px);
}

.mkw__toggle:active {
  transform: scale(0.97);
}

.mkw__toggle:focus-visible {
  outline: 2px solid var(--mkw-green);
  outline-offset: 3px;
}

.mkw--open .mkw__toggle {
  padding: 0;
  background: var(--s-surface);
  box-shadow: inset 0 0 0 1px var(--s-divider), 0 8px 20px -10px rgb(16 24 40 / 0.35);
  color: var(--s-text);
}

.mkw__toggle-icon {
  flex: none;
}

/* Just the icon, so it never covers the page; the words slide out on hover or keyboard focus */
.mkw__toggle-text {
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  white-space: nowrap;
  transition: max-width 260ms var(--s-ease-emph, ease), opacity 160ms ease,
    margin 260ms var(--s-ease-emph, ease);
}

.mkw__toggle:focus-visible .mkw__toggle-text {
  max-width: 120px;
  margin: 0 4px 0 8px;
  opacity: 1;
}

@media (hover: hover) {
  .mkw__toggle:hover .mkw__toggle-text {
    max-width: 120px;
    margin: 0 4px 0 8px;
    opacity: 1;
  }
}

@media (max-width: 639px) {
  .mkw {
    right: var(--s-space-2);
    bottom: calc(var(--s-space-2) + env(safe-area-inset-bottom, 0px));
  }

  .mkw__toggle-text {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mkw__toggle-text {
    transition: none;
  }
}

/* The card */
.mkw__card {
  width: min(340px, calc(100vw - var(--s-space-2) * 2));
  overflow: hidden;
  border-radius: 18px;
  background: var(--s-surface);
  box-shadow: inset 0 0 0 1px var(--s-divider), 0 24px 48px -20px rgb(16 24 40 / 0.4),
    0 4px 12px -4px rgb(16 24 40 / 0.12);
  color: var(--s-text);
  transform-origin: bottom right;
}

.mkw__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 12px 14px 16px;
  background: color-mix(in srgb, var(--mkw-green) 9%, var(--s-surface));
}

.mkw__avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: var(--s-radius-full);
  background: var(--s-surface);
  box-shadow: inset 0 0 0 1px var(--s-divider);
}

.mkw__who {
  flex: 1;
  min-width: 0;
}

.mkw__name {
  margin: 0;
  font: 600 0.9375rem / 1.3 var(--s-font-sans);
}

.mkw__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  color: var(--s-text-muted);
  font: 500 0.75rem / 1.2 var(--s-font-sans);
}

.mkw__status::before {
  width: 7px;
  height: 7px;
  border-radius: var(--s-radius-full);
  background: var(--mkw-green);
  content: '';
}

.mkw__close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--s-text-muted);
  cursor: pointer;
}

.mkw__close:hover {
  background: color-mix(in srgb, var(--s-text) 7%, transparent);
  color: var(--s-text);
}

.mkw__body {
  padding: 16px;
}

.mkw__bubble {
  position: relative;
  margin: 0 0 18px;
  padding: 12px 14px;
  border-radius: 4px 14px 14px 14px;
  background: color-mix(in srgb, var(--s-text) 5%, var(--s-surface));
  font: 400 0.875rem / 1.5 var(--s-font-sans);
}

.mkw__label {
  margin: 0 0 8px;
  color: var(--s-text-muted);
  font: 500 0.75rem / 1.3 var(--s-font-sans);
}

.mkw__topics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mkw__topic {
  padding: 7px 12px;
  border: 0;
  border-radius: var(--s-radius-full);
  background: color-mix(in srgb, var(--s-text) 5%, transparent);
  color: var(--s-text-2);
  font: 500 0.8125rem / 1.2 var(--s-font-sans);
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.mkw__topic:hover {
  background: color-mix(in srgb, var(--s-text) 9%, transparent);
}

.mkw__topic[aria-pressed='true'] {
  background: color-mix(in srgb, var(--mkw-green) 14%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--mkw-green) 45%, transparent);
  color: var(--s-text);
}

.mkw__foot {
  padding: 0 16px 16px;
}

.mkw__start {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  border-radius: 12px;
  background: var(--mkw-green);
  color: #fff;
  font: 600 0.9375rem / 1 var(--s-font-sans);
  text-decoration: none;
  transition: background-color 160ms ease;
}

.mkw__start:hover {
  background: var(--mkw-green-hover);
}

.mkw__start:focus-visible {
  outline: 2px solid var(--mkw-green);
  outline-offset: 2px;
}

.mkw__note {
  margin: 8px 0 0;
  color: var(--s-text-muted);
  font: 400 0.75rem / 1.4 var(--s-font-sans);
  text-align: center;
}

/* Opens from the button */
.mkw-card-enter-active {
  transition: opacity 180ms ease, transform 300ms var(--s-spring, ease);
}

.mkw-card-leave-active {
  transition: opacity 120ms ease, transform 140ms ease-in;
}

.mkw-card-enter-from,
.mkw-card-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .mkw__toggle,
  .mkw-card-enter-active,
  .mkw-card-leave-active {
    transition: none;
  }
}
</style>
