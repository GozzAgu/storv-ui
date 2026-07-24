<template>
  <Teleport to="body">
    <div
      v-if="showTutorial"
      class="tutorial-root fixed inset-0 z-[120]"
      role="dialog"
      aria-modal="true"
      :aria-label="`Tutorial step ${currentStep} of ${totalSteps}`"
    >
      <div
        v-if="spotlightRect"
        class="tutorial-scrim absolute inset-0 transition-[clip-path] duration-300 ease-out motion-reduce:transition-none"
        :style="scrimStyle"
        aria-hidden="true"
        @click="skipTutorial"
      />

      <div
        v-if="spotlightRect"
        class="tutorial-ring pointer-events-none fixed transition-all duration-300 ease-out motion-reduce:transition-none"
        :class="{ 'tutorial-ring--locked': currentStepLocked }"
        :style="ringStyle"
        aria-hidden="true"
      />

      <div
        ref="tutorialCard"
        class="tutorial-card pointer-events-auto fixed w-[min(100%,22rem)] overflow-hidden rounded-xl border border-gray-200/90 bg-white text-gray-900 shadow-2xl transition-[top,left,opacity] duration-300 ease-out dark:border-white/10 dark:bg-[#12141c] dark:text-gray-100 motion-reduce:transition-none"
        :class="{ 'tutorial-card--visible': cardReady }"
        :style="cardPosition"
        @click.stop
      >
        <span
          v-if="arrowStyle"
          class="tutorial-card__arrow pointer-events-none absolute h-3 w-3 rotate-45 border border-gray-200/90 bg-white dark:border-white/10 dark:bg-[#12141c]"
          :style="arrowStyle"
          aria-hidden="true"
        />

        <div
          class="flex items-center justify-between gap-3 border-b border-gray-200/90 px-4 py-3 dark:border-white/10"
        >
          <p class="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            Step {{ currentStep }} of {{ totalSteps }}
          </p>
          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
            aria-label="Skip tutorial"
            @click="skipTutorial"
          >
            <XMarkIcon class="h-4 w-4" stroke-width="1.75" />
          </button>
        </div>

        <div class="space-y-3 px-4 py-4">
          <div
            class="mx-auto flex h-11 w-11 items-center justify-center rounded-lg"
            :class="
              currentStepLocked
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : 'bg-primary-600 dark:bg-primary-500 text-white'
            "
          >
            <component :is="currentStepData?.icon" class="h-5 w-5" :class="currentStepLocked ? '' : 'text-white'" />
          </div>

          <h3 class="text-center text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {{ currentStepData?.title }}
          </h3>

          <div
            v-if="currentStepLocked"
            class="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-center"
            role="status"
          >
            <p class="text-[11px] font-semibold text-amber-900 dark:text-amber-100">
              Not included on {{ currentPlanLabel }}
            </p>
            <p class="mt-0.5 text-[10px] leading-relaxed text-amber-800/90 dark:text-amber-200/85">
              Available on {{ requiredPlanLabel }}. Upgrade anytime in Settings.
            </p>
          </div>

          <p class="text-center text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            {{ stepDescription }}
          </p>
        </div>

        <div
          class="flex items-center justify-between gap-2 border-t border-gray-200/90 px-4 py-3 dark:border-white/10"
        >
          <button
            v-if="currentStep > 1"
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100"
            @click="previousStep"
          >
            Previous
          </button>
          <div v-else />

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-gray-100"
              @click="skipTutorial"
            >
              Skip
            </button>
            <button type="button" class="btn-primary btn-primary-sm" @click="nextStep">
              {{ currentStep === totalSteps ? 'Get started' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { XMarkIcon } from '~/utils/app-icons'
import { useUser } from '~/composables/useUser'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'
import { useSubscriptionFeatures } from '~/composables/useSubscriptionFeatures'
import type { SubscriptionFeature } from '~/types/subscription'
import { getMinimumPlanForFeature, getPlanDisplayName } from '~/types/subscription'

export interface TutorialStep {
  title: string
  description: string
  lockedDescription?: string
  icon: unknown
  targetSelector?: string
  fallbackTargetSelector?: string
  subscriptionFeature?: SubscriptionFeature
}

const props = defineProps<{
  tutorialSteps: TutorialStep[]
}>()

const emit = defineEmits<{
  complete: []
}>()

const SPOTLIGHT_PADDING = 8
const CARD_GAP = 16
const VIEWPORT_MARGIN = 16

const { currentUser } = useFirebaseAuth()
const { completeTutorial, getUserDocument } = useUser()
const { canUse, plan } = useSubscriptionFeatures()

const showTutorial = ref(false)
const currentStep = ref(1)
const totalSteps = computed(() => props.tutorialSteps.length)
const tutorialCard = ref<HTMLElement | null>(null)
const cardPosition = ref<Record<string, string>>({})
const arrowStyle = ref<Record<string, string> | null>(null)
const spotlightRect = ref<DOMRect | null>(null)
const cardReady = ref(false)

const currentStepData = computed(() => props.tutorialSteps[currentStep.value - 1])

const currentStepLocked = computed(() => {
  const feature = currentStepData.value?.subscriptionFeature
  return Boolean(feature && !canUse(feature))
})

const currentPlanLabel = computed(() => getPlanDisplayName(plan.value))

const requiredPlanLabel = computed(() => {
  const feature = currentStepData.value?.subscriptionFeature
  if (!feature) return 'a higher plan'
  const required = getMinimumPlanForFeature(feature)
  return required ? getPlanDisplayName(required) : 'a higher plan'
})

const stepDescription = computed(() => {
  const step = currentStepData.value
  if (!step) return ''
  if (currentStepLocked.value && step.lockedDescription) return step.lockedDescription
  return step.description
})

const scrimStyle = computed(() => {
  if (!spotlightRect.value) return {}
  return {
    clipPath: buildScrimClipPath(spotlightRect.value, SPOTLIGHT_PADDING),
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    backdropFilter: 'blur(2px)',
  }
})

const ringStyle = computed(() => {
  if (!spotlightRect.value) return {}
  const rect = spotlightRect.value
  const pad = SPOTLIGHT_PADDING
  return {
    top: `${rect.top - pad}px`,
    left: `${rect.left - pad}px`,
    width: `${rect.width + pad * 2}px`,
    height: `${rect.height + pad * 2}px`,
  }
})

function buildScrimClipPath(rect: DOMRect, padding: number) {
  const x1 = Math.max(0, rect.left - padding)
  const y1 = Math.max(0, rect.top - padding)
  const x2 = Math.min(window.innerWidth, rect.right + padding)
  const y2 = Math.min(window.innerHeight, rect.bottom + padding)
  const w = window.innerWidth
  const h = window.innerHeight

  return `polygon(evenodd, 0px 0px, ${w}px 0px, ${w}px ${h}px, 0px ${h}px, 0px 0px, ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px)`
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function resolveTargetElement(step: TutorialStep) {
  if (step.subscriptionFeature && !canUse(step.subscriptionFeature) && step.fallbackTargetSelector) {
    const fallback = document.querySelector(step.fallbackTargetSelector)
    if (fallback) return fallback
  }

  if (step.targetSelector) {
    const primary = document.querySelector(step.targetSelector)
    if (primary) return primary
  }

  if (step.fallbackTargetSelector) {
    return document.querySelector(step.fallbackTargetSelector)
  }

  return null
}

async function updateSpotlightLayout() {
  cardReady.value = false
  await nextTick()

  const step = currentStepData.value
  if (!step?.targetSelector && !step?.fallbackTargetSelector) {
    spotlightRect.value = null
    arrowStyle.value = null
    cardPosition.value = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }
    cardReady.value = true
    return
  }

  const targetElement = resolveTargetElement(step)
  if (!targetElement || !tutorialCard.value) {
    spotlightRect.value = null
    cardReady.value = true
    return
  }

  targetElement.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  await new Promise((resolve) => window.setTimeout(resolve, 180))

  const rect = targetElement.getBoundingClientRect()
  spotlightRect.value = rect

  const cardRect = tutorialCard.value.getBoundingClientRect()
  const placement = computeCardPlacement(rect, cardRect)

  cardPosition.value = {
    top: `${placement.top}px`,
    left: `${placement.left}px`,
    transform: 'none',
  }
  arrowStyle.value = placement.arrow
  cardReady.value = true
}

function computeCardPlacement(
  targetRect: DOMRect,
  cardRect: DOMRect
): { top: number; left: number; arrow: Record<string, string> | null } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const targetCenterY = targetRect.top + targetRect.height / 2
  const targetCenterX = targetRect.left + targetRect.width / 2

  const candidates: Array<{
    top: number
    left: number
    arrow: Record<string, string> | null
    score: number
  }> = []

  const placeRight = () => {
    const left = targetRect.right + CARD_GAP
    const top = clamp(
      targetCenterY - cardRect.height / 2,
      VIEWPORT_MARGIN,
      vh - cardRect.height - VIEWPORT_MARGIN
    )
    const arrowTop = clamp(targetCenterY - top - 6, 18, cardRect.height - 18)
    candidates.push({
      top,
      left,
      score: targetRect.left < vw * 0.4 ? 0 : 2,
      arrow: { top: `${arrowTop}px`, left: '-6px' },
    })
  }

  const placeLeft = () => {
    const left = targetRect.left - CARD_GAP - cardRect.width
    const top = clamp(
      targetCenterY - cardRect.height / 2,
      VIEWPORT_MARGIN,
      vh - cardRect.height - VIEWPORT_MARGIN
    )
    const arrowTop = clamp(targetCenterY - top - 6, 18, cardRect.height - 18)
    candidates.push({
      top,
      left,
      score: 3,
      arrow: { top: `${arrowTop}px`, right: '-6px' },
    })
  }

  const placeBelow = () => {
    const top = targetRect.bottom + CARD_GAP
    const left = clamp(
      targetCenterX - cardRect.width / 2,
      VIEWPORT_MARGIN,
      vw - cardRect.width - VIEWPORT_MARGIN
    )
    const arrowLeft = clamp(targetCenterX - left - 6, 18, cardRect.width - 18)
    candidates.push({
      top,
      left,
      score: 1,
      arrow: { top: '-6px', left: `${arrowLeft}px` },
    })
  }

  const placeAbove = () => {
    const top = targetRect.top - CARD_GAP - cardRect.height
    const left = clamp(
      targetCenterX - cardRect.width / 2,
      VIEWPORT_MARGIN,
      vw - cardRect.width - VIEWPORT_MARGIN
    )
    const arrowLeft = clamp(targetCenterX - left - 6, 18, cardRect.width - 18)
    candidates.push({
      top,
      left,
      score: 4,
      arrow: { bottom: '-6px', left: `${arrowLeft}px` },
    })
  }

  placeRight()
  placeBelow()
  placeLeft()
  placeAbove()

  const valid = candidates.filter(
    (c) =>
      c.left >= VIEWPORT_MARGIN &&
      c.left + cardRect.width <= vw - VIEWPORT_MARGIN &&
      c.top >= VIEWPORT_MARGIN &&
      c.top + cardRect.height <= vh - VIEWPORT_MARGIN
  )

  const best = (valid.length ? valid : candidates).sort((a, b) => a.score - b.score)[0]!
  return { top: best.top, left: best.left, arrow: best.arrow }
}

async function checkTutorialStatus() {
  if (!currentUser.value) return

  const userData = await getUserDocument(currentUser.value.uid)
  if (userData && !userData.hasCompletedTutorial && userData.hasCompletedOnboarding) {
    window.setTimeout(() => {
      showTutorial.value = true
      updateSpotlightLayout()
    }, 1000)
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

async function nextStep() {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++
  } else {
    await finishTutorial()
  }
}

async function skipTutorial() {
  await finishTutorial()
}

async function finishTutorial() {
  if (!currentUser.value) return

  try {
    await completeTutorial(currentUser.value.uid)
    showTutorial.value = false
    emit('complete')
  } catch (error) {
    console.error('Failed to complete tutorial:', error)
    showTutorial.value = false
    emit('complete')
  }
}

function onViewportChange() {
  if (showTutorial.value) updateSpotlightLayout()
}

onMounted(async () => {
  await checkTutorialStatus()
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
  if (import.meta.client) document.body.style.overflow = ''
})

watch(currentStep, () => {
  if (showTutorial.value) updateSpotlightLayout()
})

watch(showTutorial, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<style scoped>
.tutorial-ring {
  border: 2px solid rgb(110 148 214 / 0.95);
  border-radius: 0.65rem;
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.08),
    0 0 24px rgb(72 118 199 / 0.35);
}

.tutorial-ring--locked {
  border-color: rgb(245 158 11 / 0.85);
  box-shadow:
    0 0 0 1px rgb(245 158 11 / 0.15),
    0 0 24px rgb(245 158 11 / 0.2);
}

.tutorial-card {
  opacity: 0;
}

.tutorial-card--visible {
  opacity: 1;
}

.tutorial-card__arrow {
  z-index: 0;
}
</style>
