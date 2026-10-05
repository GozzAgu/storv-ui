<template>
  <section id="assistant" ref="sectionRef" class="mk-section" aria-labelledby="mk-assistant-title">
    <div class="mk-container">
      <div class="mk-split">
        <div class="mk-split__copy mk-reveal">
          <p class="mk-eyebrow">Storvv Assistant</p>
          <h2 id="mk-assistant-title" class="mk-h2">
            Answers while you work, <span class="mk-accent">on every screen.</span>
          </h2>
          <p class="mk-lede">
            Ask how a screen works, what your plan includes, or how to run a workflow. Answers come
            straight from the Storvv Help center.
          </p>
          <ul class="mk-checks">
            <li v-for="perk in perks" :key="perk.title">
              <Check :size="16" aria-hidden="true" />
              <span
                ><strong>{{ perk.title }}.</strong> {{ perk.body }}</span
              >
            </li>
          </ul>
          <div class="mk-actions">
            <NuxtLink to="/demo/dashboard" class="mk-link">
              Try it in the demo
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>

        <div class="mk-chat mk-reveal">
          <div class="mk-chat__head">
            <span class="mk-chat__avatar" aria-hidden="true">
              <Sparkles :size="18" />
            </span>
            <div>
              <p class="mk-chat__name">Storvv Assistant</p>
              <p class="mk-chat__status">Answers from the Help center</p>
            </div>
          </div>

          <div class="mk-chat__thread">
            <Transition name="mk-fade" mode="out-in">
              <div :key="active" class="mk-chat__pair">
                <p class="mk-chat__msg mk-chat__msg--user">{{ current.q }}</p>
                <p v-if="phase === 'thinking'" class="mk-chat__msg mk-chat__msg--ai">
                  <span class="mk-typing" aria-hidden="true"><span /><span /><span /></span>
                  <span class="ds-sr-only">Storvv Assistant is typing</span>
                </p>
                <p v-else class="mk-chat__msg mk-chat__msg--ai mk-chat__type" aria-hidden="true">
                  <span class="mk-chat__ghost">{{ current.a }}</span>
                  <span class="mk-chat__typed"
                    >{{ typed }}<span v-if="phase === 'typing'" class="mk-caret"
                  /></span>
                </p>
              </div>
            </Transition>
            <p class="ds-sr-only" aria-live="polite">{{ phase === 'done' ? current.a : '' }}</p>
          </div>

          <p class="mk-chat__label">Try asking</p>
          <div class="mk-chat__prompts">
            <button
              v-for="(prompt, i) in prompts"
              :key="prompt.q"
              type="button"
              class="mk-chip"
              :aria-pressed="active === i"
              @click="choose(i)"
            >
              {{ prompt.short }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, Check, Sparkles } from '@lucide/vue'

const perks = [
  { title: 'Knows every screen', body: 'Step-by-step help for any workflow.' },
  { title: 'Plan-aware', body: 'Explains what Micro, Medium, and Enterprise include.' },
  { title: 'Private by design', body: "It can't see your live stock or sales numbers." },
]

const prompts = [
  {
    short: 'Free plan',
    q: 'What is on the free Micro plan?',
    a: 'Micro is free forever for one store, with full sales and inventory. Upgrade to Medium for analytics, sales leads, and a second branch.',
  },
  {
    short: 'Sales leads',
    q: 'How do sales leads work on Medium?',
    a: 'Open Sales leads to log enquiries, update status, and use Create sale to open the receipt wizard with the customer prefilled. When the receipt completes, the lead is marked Won.',
  },
  {
    short: 'Solo workspace',
    q: 'What is Solo workspace?',
    a: 'Solo is a focused layout for owners who run the shop themselves. Business shows the full team navigation. You can switch any time in Settings, and it is separate from your plan.',
  },
  {
    short: 'Copy from branch',
    q: 'How do I copy categories from another branch?',
    a: 'On Enterprise, open Categories and use Copy from branch to bring over folders and subcategories from another store. Live quantities are not copied.',
  },
]

const THINK_MS = 700
const CHAR_MS = 18
const HOLD_MS = 4500

const sectionRef = ref<HTMLElement | null>(null)
const active = ref(0)
const typed = ref(prompts[0]!.a)
const phase = ref<'thinking' | 'typing' | 'done'>('done')
const current = computed(() => prompts[active.value] ?? prompts[0]!)

let timer: ReturnType<typeof setTimeout> | undefined
let autoplay = true
let inView = false
let reducedMotion = false
let observer: IntersectionObserver | null = null

function stop() {
  clearTimeout(timer)
  timer = undefined
}

function play(index: number) {
  stop()
  active.value = index
  const answer = prompts[index]!.a
  if (reducedMotion) {
    typed.value = answer
    phase.value = 'done'
    return
  }
  typed.value = ''
  phase.value = 'thinking'
  timer = setTimeout(() => {
    phase.value = 'typing'
    let length = 0
    const tick = () => {
      length = Math.min(answer.length, length + 2)
      typed.value = answer.slice(0, length)
      if (length < answer.length) {
        timer = setTimeout(tick, CHAR_MS)
        return
      }
      phase.value = 'done'
      if (autoplay && inView) {
        timer = setTimeout(() => play((index + 1) % prompts.length), HOLD_MS)
      }
    }
    tick()
  }, THINK_MS)
}

function choose(index: number) {
  autoplay = false
  play(index)
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion || !sectionRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.some((entry) => entry.isIntersecting)
      if (visible === inView) return
      inView = visible
      if (!visible) {
        stop()
        typed.value = current.value.a
        phase.value = 'done'
      } else if (autoplay) {
        play(active.value)
      }
    },
    { threshold: 0.4 }
  )
  observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
})
</script>
