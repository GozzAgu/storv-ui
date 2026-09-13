<template>
  <section
    id="assistant"
    ref="sectionRef"
    data-section-id="landing-ai"
    class="landing-ai scroll-animate scroll-animate-up"
    aria-labelledby="landing-ai-title"
  >
    <div class="landing-ai__inner landing-ai__inner--split">
      <div class="landing-ai__copy">
        <p class="landing-story__eyebrow">Storvv Assistant</p>
        <h2 id="landing-ai-title" class="landing-ai__title">Your intelligent retail assistant.</h2>
        <p class="landing-ai__lede">
          Ask how screens work, what your plan includes, and how to run workflows like copy-from-branch,
          sales leads, or stock loans - powered by the same Help center knowledge base (no access to
          your live stock or sales numbers).
        </p>

        <div class="landing-ai__chat landing-glass" role="presentation">
          <div class="landing-ai__msg landing-ai__msg--user">
            {{ typedUser || (inView ? '' : userPrompt) }}
            <span
              v-if="phase === 'typing-user'"
              class="landing-ai__caret"
              aria-hidden="true"
            />
          </div>
          <div v-if="phase !== 'typing-user' || typedReply" class="landing-ai__msg landing-ai__msg--ai">
            {{ typedReply || (prefersReducedMotion && inView ? assistantReply : '') }}
            <span
              v-if="phase === 'typing-reply'"
              class="landing-ai__caret"
              aria-hidden="true"
            />
          </div>
        </div>

        <div class="landing-ai__chips" aria-label="Suggested prompts">
          <span v-for="chip in chips" :key="chip" class="landing-ai__chip">{{ chip }}</span>
        </div>
      </div>

      <div class="landing-ai__visual" aria-hidden="true">
        <img
          src="/marketing/illustrations/ai-workflow-icon.png"
          alt=""
          class="landing-ai__visual-img"
          loading="lazy"
          width="320"
          height="320"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useLandingReducedMotion } from '~/composables/useLandingHeroMotion'

const chips = [
  'What is Solo workspace?',
  'What is on the free Micro plan?',
  'How do I upgrade my subscription?',
  'How do payment links work?',
  'Copy categories from another branch',
]

const userPrompt = 'How do sales leads work on Medium?'
const assistantReply =
  'Open Sales leads to log enquiries, update status, and use Create sale to open the receipt wizard with the customer prefilled. When the receipt completes, the lead is marked Won.'

const prefersReducedMotion = useLandingReducedMotion()
const sectionRef = ref<HTMLElement | null>(null)
const inView = ref(false)
const typedUser = ref('')
const typedReply = ref('')
const phase = ref<'idle' | 'typing-user' | 'typing-reply' | 'done'>('idle')

let observer: IntersectionObserver | null = null
let typeTimer: ReturnType<typeof setTimeout> | null = null

function clearTypeTimer() {
  if (typeTimer) clearTimeout(typeTimer)
  typeTimer = null
}

function typeText(
  full: string,
  target: 'user' | 'reply',
  speedMs: number,
  onDone: () => void
) {
  let i = 0
  const tick = () => {
    i += 1
    if (target === 'user') typedUser.value = full.slice(0, i)
    else typedReply.value = full.slice(0, i)
    if (i < full.length) {
      typeTimer = setTimeout(tick, speedMs)
    } else {
      onDone()
    }
  }
  tick()
}

function startStream() {
  if (phase.value !== 'idle') return
  if (prefersReducedMotion.value) {
    typedUser.value = userPrompt
    typedReply.value = assistantReply
    phase.value = 'done'
    return
  }
  phase.value = 'typing-user'
  typeText(userPrompt, 'user', 28, () => {
    phase.value = 'typing-reply'
    typeTimer = setTimeout(() => {
      typeText(assistantReply, 'reply', 16, () => {
        phase.value = 'done'
      })
    }, 350)
  })
}

onMounted(() => {
  if (!import.meta.client || !sectionRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        inView.value = true
        startStream()
        observer?.disconnect()
      }
    },
    { threshold: 0.4 }
  )
  observer.observe(sectionRef.value)
})

onBeforeUnmount(() => {
  clearTypeTimer()
  observer?.disconnect()
})
</script>

<style scoped>
.landing-ai__inner--split {
  max-width: 68rem;
  text-align: left;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 2.5rem;
}

@media (min-width: 900px) {
  .landing-ai__inner--split {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 3rem;
  }
}

.landing-ai__copy {
  flex: 1 1 auto;
  min-width: 0;
}

.landing-ai__visual {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 11rem;
  height: 11rem;
  border-radius: 1.5rem;
  background: #ffffff;
}

@media (min-width: 900px) {
  .landing-ai__visual {
    width: 14rem;
    height: 14rem;
  }
}

.landing-ai__visual-img {
  width: 62%;
  height: 62%;
  object-fit: contain;
}

html.dark .landing-ai__visual {
  background: #1e1e1e;
}

.landing-ai__caret {
  display: inline-block;
  width: 0.45em;
  height: 1em;
  margin-left: 0.1em;
  vertical-align: text-bottom;
  background: currentColor;
  animation: landing-ai-caret 0.9s steps(1) infinite;
}

@keyframes landing-ai-caret {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-ai__caret {
    animation: none;
    opacity: 0;
  }
}
</style>
