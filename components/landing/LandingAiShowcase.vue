<template>
  <section
    id="assistant"
    ref="sectionRef"
    data-section-id="landing-ai"
    class="aiw scroll-animate scroll-animate-up"
    aria-labelledby="landing-ai-title"
  >
    <div class="aiw__glow" aria-hidden="true" />

    <div class="aiw__inner">
      <div class="aiw__copy">
        <p class="aiw__eyebrow">
          <Sparkles class="h-3.5 w-3.5" aria-hidden="true" />
          Storvv Assistant
        </p>
        <h2 id="landing-ai-title" class="aiw__title">
          Your intelligent <span class="aiw__accent">retail assistant.</span>
        </h2>
        <p class="aiw__lede">
          Ask how any screen works, what your plan includes, or how to run a workflow. Answers come
          straight from the Storvv Help center.
        </p>

        <ul class="aiw__perks">
          <li v-for="perk in perks" :key="perk.title" class="aiw__perk">
            <span class="aiw__perk-icon">
              <component :is="perk.icon" class="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span class="aiw__perk-title">{{ perk.title }}</span>
              <span class="aiw__perk-body">{{ perk.body }}</span>
            </span>
          </li>
        </ul>

        <NuxtLink to="/demo/dashboard" class="aiw__cta">
          Try it in the demo
          <ArrowRight class="h-4 w-4" aria-hidden="true" />
        </NuxtLink>
      </div>

      <div class="aiw__window">
        <div class="aiw__window-head">
          <span class="aiw__avatar">
            <Sparkles class="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p class="aiw__window-name">Storvv Assistant</p>
            <p class="aiw__window-status">
              <span class="aiw__online" aria-hidden="true" />
              Answers from the Help center
            </p>
          </div>
        </div>

        <div class="aiw__thread" aria-live="polite">
          <div class="aiw__msg aiw__msg--user">
            {{ typedUser }}
            <span v-if="phase === 'typing-user'" class="aiw__caret" aria-hidden="true" />
          </div>

          <div v-if="phase === 'thinking'" class="aiw__msg aiw__msg--ai aiw__msg--thinking" aria-label="Assistant is thinking">
            <span class="aiw__dot" />
            <span class="aiw__dot" />
            <span class="aiw__dot" />
          </div>

          <div v-else-if="typedReply" class="aiw__msg aiw__msg--ai">
            <span class="aiw__msg-avatar" aria-hidden="true">
              <Sparkles class="h-3 w-3" />
            </span>
            <span>
              {{ typedReply }}
              <span v-if="phase === 'typing-reply'" class="aiw__caret" aria-hidden="true" />
            </span>
          </div>
        </div>

        <div class="aiw__suggest">
          <p class="aiw__suggest-label">Try asking</p>
          <div class="aiw__chips">
            <button
              v-for="(qa, i) in prompts"
              :key="qa.q"
              type="button"
              class="aiw__chip"
              :class="{ 'aiw__chip--active': activePrompt === i }"
              :disabled="phase === 'typing-user' || phase === 'thinking'"
              @click="play(i)"
            >
              {{ qa.q }}
            </button>
          </div>
        </div>

        <div class="aiw__input" aria-hidden="true">
          <span class="aiw__input-text">Ask anything about Storvv…</span>
          <span class="aiw__send">
            <ArrowUp class="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, ArrowUp, BookOpen, Layers, ShieldCheck, Sparkles } from '@lucide/vue'
import { useLandingReducedMotion } from '~/composables/useLandingHeroMotion'

const perks = [
  { icon: BookOpen, title: 'Knows every screen', body: 'Step-by-step help for any workflow.' },
  { icon: Layers, title: 'Plan-aware answers', body: 'Explains what Micro, Medium, and Enterprise include.' },
  { icon: ShieldCheck, title: 'Private by design', body: "It can't see your live stock or sales numbers." },
]

const prompts = [
  {
    q: 'How do sales leads work on Medium?',
    a: 'Open Sales leads to log enquiries, update status, and use Create sale to open the receipt wizard with the customer prefilled. When the receipt completes, the lead is marked Won.',
  },
  {
    q: 'What is on the free Micro plan?',
    a: 'Micro is free forever for one store, with full sales and inventory. Upgrade to Medium for analytics, sales leads, and a second branch.',
  },
  {
    q: 'What is Solo workspace?',
    a: 'Solo is a focused layout for owners who run the shop themselves. Business shows the full team navigation. You can switch any time in Settings, and it is separate from your plan.',
  },
  {
    q: 'Copy categories from another branch',
    a: 'On Enterprise, open Categories and use Copy from branch to bring over folders and subcategories from another store. Live quantities are not copied.',
  },
  {
    q: 'How do stock loans work?',
    a: 'On Enterprise, open Stock loans to lend serial items to a borrower and track who has them until they come back.',
  },
]

const prefersReducedMotion = useLandingReducedMotion()
const sectionRef = ref<HTMLElement | null>(null)
const activePrompt = ref(0)
const typedUser = ref(prompts[0].q)
const typedReply = ref(prompts[0].a)
const phase = ref<'idle' | 'typing-user' | 'thinking' | 'typing-reply' | 'done'>('idle')

let observer: IntersectionObserver | null = null
let timer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (timer) clearTimeout(timer)
  timer = null
}

function typeInto(target: typeof typedUser, full: string, speedMs: number, onDone: () => void) {
  let i = 0
  const tick = () => {
    i += 1
    target.value = full.slice(0, i)
    if (i < full.length) timer = setTimeout(tick, speedMs)
    else onDone()
  }
  tick()
}

function play(index: number) {
  clearTimer()
  activePrompt.value = index
  const { q, a } = prompts[index]

  if (prefersReducedMotion.value) {
    typedUser.value = q
    typedReply.value = a
    phase.value = 'done'
    return
  }

  typedReply.value = ''
  phase.value = 'typing-user'
  typeInto(typedUser, q, 26, () => {
    phase.value = 'thinking'
    timer = setTimeout(() => {
      phase.value = 'typing-reply'
      typeInto(typedReply, a, 14, () => {
        phase.value = 'done'
      })
    }, 900)
  })
}

onMounted(() => {
  if (!import.meta.client || !sectionRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        play(0)
        observer?.disconnect()
      }
    },
    { threshold: 0.4 }
  )
  observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  clearTimer()
  observer?.disconnect()
})
</script>

<style scoped>
.aiw {
  position: relative;
  overflow: hidden;
  padding: clamp(4rem, 8vw, 6.5rem) 1.25rem;
  background: #ffffff;
}

.aiw__glow {
  position: absolute;
  inset: 10% -10% auto 35%;
  height: 80%;
  background:
    radial-gradient(40% 50% at 60% 40%, rgb(91 127 224 / 0.12), transparent 70%),
    radial-gradient(35% 45% at 35% 70%, rgb(20 63 141 / 0.1), transparent 70%);
  pointer-events: none;
}

.aiw__inner {
  position: relative;
  max-width: 68rem;
  margin: 0 auto;
  display: grid;
  gap: 3rem;
  align-items: center;
}

@media (min-width: 960px) {
  .aiw__inner {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 4rem;
  }
}

.aiw__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 9999px;
  background: rgb(91 127 224 / 0.1);
  color: #143f8d;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.aiw__title {
  margin-top: 1rem;
  font-size: clamp(1.9rem, 4vw, 2.85rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.08;
  color: #0f172a;
}

.aiw__accent {
  background: linear-gradient(90deg, #5b7fe0, #143f8d, #5b7fe0);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: aiw-shine 6s linear infinite;
}

@keyframes aiw-shine {
  to {
    background-position: 200% center;
  }
}

.aiw__lede {
  margin-top: 1rem;
  font-size: 1.02rem;
  line-height: 1.65;
  color: #475569;
}

.aiw__perks {
  margin-top: 1.6rem;
  display: grid;
  gap: 0.6rem;
}

.aiw__perk {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 0.95rem;
  border-radius: 1rem;
  background: #f5f5f7;
  transition: transform 220ms ease, background-color 220ms ease;
}

.aiw__perk:hover {
  transform: translateX(4px);
  background: #eef0fb;
}

.aiw__perk-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.7rem;
  background: linear-gradient(145deg, #5b7fe0, #143f8d);
  color: #ffffff;
}

.aiw__perk-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.aiw__perk-body {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #64748b;
}

.aiw__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.75rem;
  padding: 0.85rem 1.5rem;
  border-radius: 9999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 10px 24px -12px rgb(15 23 42 / 0.6);
  transition: transform 200ms ease;
}

.aiw__cta:hover {
  transform: translateY(-2px);
}

/* Chat window */
.aiw__window {
  display: flex;
  flex-direction: column;
  border-radius: 1.5rem;
  background: #ffffff;
  border: 1px solid rgb(15 23 42 / 0.12);
  box-shadow:
    0 0 0 8px #f5f5f7,
    0 0 0 9px rgb(15 23 42 / 0.06),
    0 40px 80px -30px rgb(30 42 120 / 0.45);
  overflow: hidden;
}

.aiw__window-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgb(15 23 42 / 0.06);
  background: linear-gradient(180deg, #f7f9fe, #ffffff);
}

.aiw__avatar {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.8rem;
  background: linear-gradient(145deg, #5b7fe0, #143f8d);
  color: #ffffff;
  box-shadow: 0 8px 18px -8px rgb(91 127 224 / 0.7);
}

.aiw__window-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
}

.aiw__window-status {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: #64748b;
}

.aiw__online {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: #10b981;
  box-shadow: 0 0 0 3px rgb(16 185 129 / 0.2);
}

.aiw__thread {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 13.5rem;
  padding: 1.25rem;
}

.aiw__msg {
  max-width: 88%;
  padding: 0.75rem 0.95rem;
  border-radius: 1.1rem;
  font-size: 0.88rem;
  line-height: 1.55;
}

.aiw__msg--user {
  align-self: flex-end;
  min-height: 2.6rem;
  border-bottom-right-radius: 0.35rem;
  background: #0f172a;
  color: #ffffff;
}

.aiw__msg--ai {
  align-self: flex-start;
  display: flex;
  gap: 0.6rem;
  border-bottom-left-radius: 0.35rem;
  background: #eef2fb;
  color: #0c2360;
}

.aiw__msg-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.4rem;
  height: 1.4rem;
  margin-top: 0.05rem;
  border-radius: 0.45rem;
  background: linear-gradient(145deg, #5b7fe0, #143f8d);
  color: #ffffff;
}

.aiw__msg--thinking {
  gap: 0.3rem;
  align-items: center;
  padding: 0.95rem 1.1rem;
}

.aiw__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: #5b7fe0;
  animation: aiw-bounce 1.1s ease-in-out infinite;
}

.aiw__dot:nth-child(2) {
  animation-delay: 0.15s;
}

.aiw__dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes aiw-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

.aiw__caret {
  display: inline-block;
  width: 0.45em;
  height: 1em;
  margin-left: 0.1em;
  vertical-align: text-bottom;
  background: currentColor;
  animation: aiw-caret 0.9s steps(1) infinite;
}

@keyframes aiw-caret {
  50% {
    opacity: 0;
  }
}

.aiw__suggest {
  padding: 0 1.25rem 1rem;
}

.aiw__suggest-label {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.aiw__chips {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.aiw__chip {
  padding: 0.45rem 0.8rem;
  border-radius: 9999px;
  background: #ffffff;
  border: 1px solid rgb(91 127 224 / 0.22);
  font-size: 0.78rem;
  font-weight: 600;
  color: #1b2a6b;
  transition: all 200ms ease;
}

.aiw__chip:hover:not(:disabled) {
  background: rgb(91 127 224 / 0.08);
  transform: translateY(-1px);
}

.aiw__chip--active {
  background: linear-gradient(145deg, #5b7fe0, #143f8d);
  border-color: transparent;
  color: #ffffff;
}

.aiw__chip--active:hover:not(:disabled) {
  background: linear-gradient(145deg, #5b7fe0, #143f8d);
}

.aiw__chip:disabled {
  cursor: default;
}

.aiw__input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 1rem 1rem;
  padding: 0.45rem 0.45rem 0.45rem 1rem;
  border-radius: 9999px;
  background: #f5f5f7;
  box-shadow: inset 0 0 0 1px rgb(15 23 42 / 0.06);
}

.aiw__input-text {
  flex: 1;
  font-size: 0.85rem;
  color: #94a3b8;
}

.aiw__send {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: #0f172a;
  color: #ffffff;
}

/* Dark */
html.dark .aiw {
  background: #0d0d0d;
}

html.dark .aiw__glow {
  background:
    radial-gradient(40% 50% at 60% 40%, rgb(169 188 245 / 0.14), transparent 70%),
    radial-gradient(35% 45% at 35% 70%, rgb(112 144 240 / 0.1), transparent 70%);
}

html.dark .aiw__eyebrow {
  background: rgb(169 188 245 / 0.14);
  color: #c7d5f0;
}

html.dark .aiw__title,
html.dark .aiw__perk-title,
html.dark .aiw__window-name {
  color: #ffffff;
}

html.dark .aiw__accent {
  background-image: linear-gradient(90deg, #c7d5f0, #a9bcf5, #c7d5f0);
}

html.dark .aiw__lede {
  color: rgb(255 255 255 / 0.72);
}

html.dark .aiw__perk-body,
html.dark .aiw__window-status {
  color: rgb(255 255 255 / 0.55);
}

html.dark .aiw__perk {
  background: #161616;
}

html.dark .aiw__perk:hover {
  background: #171a22;
}

html.dark .aiw__cta {
  background: #ffffff;
  color: #0f172a;
}

html.dark .aiw__window {
  background: #141414;
  border-color: rgb(255 255 255 / 0.08);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.03),
    0 40px 80px -30px rgb(91 127 224 / 0.35);
}

html.dark .aiw__window-head {
  background: #15181f;
  border-bottom-color: rgb(255 255 255 / 0.06);
}

html.dark .aiw__msg--user {
  background: #ffffff;
  color: #0f172a;
}

html.dark .aiw__msg--ai {
  background: #161b2a;
  color: #e9eff8;
}

html.dark .aiw__chip {
  background: transparent;
  border-color: rgb(199 213 240 / 0.3);
  color: #c7d5f0;
}

html.dark .aiw__chip--active {
  background: linear-gradient(145deg, #5b7fe0, #4876c7);
  color: #ffffff;
}

html.dark .aiw__input {
  background: #1c1c1c;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.06);
}

html.dark .aiw__send {
  background: #ffffff;
  color: #0f172a;
}

@media (prefers-reduced-motion: reduce) {
  .aiw__accent,
  .aiw__dot,
  .aiw__caret {
    animation: none;
  }

  .aiw__caret {
    opacity: 0;
  }

  .aiw__perk,
  .aiw__chip,
  .aiw__cta {
    transition: none;
  }
}
</style>
