<template>
  <Teleport to="body">
    <div
      v-if="showTutorial"
      class="s-c s-tour"
      role="dialog"
      aria-modal="true"
      :aria-label="`Tutorial step ${currentStep} of ${totalSteps}`"
    >
      <div
        v-if="spotlightRect"
        class="s-tour__scrim"
        :style="scrimStyle"
        aria-hidden="true"
        @click="skipTutorial"
      />

      <div
        v-if="spotlightRect"
        class="s-tour__ring"
        :class="{ 's-tour__ring--locked': currentStepLocked }"
        :style="ringStyle"
        aria-hidden="true"
      />

      <div
        ref="tutorialCard"
        class="s-tour__card"
        :class="{ 's-tour__card--visible': cardReady }"
        :style="cardPosition"
        @click.stop
      >
        <span
          v-if="arrowStyle"
          class="s-tour__arrow"
          :style="arrowStyle"
          aria-hidden="true"
        />

        <div class="s-tour__head">
          <p class="s-tour__step">Step {{ currentStep }} of {{ totalSteps }}</p>
          <SIconButton label="Skip tutorial" size="sm" @click="skipTutorial">
            <X :size="16" :stroke-width="1.75" aria-hidden="true" />
          </SIconButton>
        </div>

        <div class="s-tour__body">
          <span
            class="s-tour__icon"
            :class="{ 's-tour__icon--locked': currentStepLocked }"
            aria-hidden="true"
          >
            <component :is="currentStepData?.icon" :size="20" :stroke-width="1.75" />
          </span>

          <h3 class="s-tour__title">
            {{ currentStepData?.title }}
          </h3>

          <div v-if="currentStepLocked" class="s-notice s-tour__lock" role="status">
            <p class="s-tour__lock-title">Not included on {{ currentPlanLabel }}</p>
            <p>Available on {{ requiredPlanLabel }}. Upgrade anytime in Settings.</p>
          </div>

          <p class="s-tour__copy">
            {{ stepDescription }}
          </p>
        </div>

        <div class="s-tour__foot">
          <SButton v-if="currentStep > 1" variant="ghost" size="sm" @click="previousStep">
            Previous
          </SButton>
          <span v-else />

          <div class="s-tour__actions">
            <SButton variant="ghost" size="sm" @click="skipTutorial">Skip</SButton>
            <SButton variant="primary" size="sm" @click="nextStep">
              {{ currentStep === totalSteps ? 'Get started' : 'Next' }}
            </SButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SIconButton from '~/components/s/SIconButton.vue'
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
const route = useRoute()
const router = useRouter()

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

  const forceReplay = route.query.tutorial === 'replay'
  const userData = await getUserDocument(currentUser.value.uid)
  const shouldShow =
    forceReplay ||
    Boolean(userData && !userData.hasCompletedTutorial && userData.hasCompletedOnboarding)

  if (shouldShow) {
    if (forceReplay && import.meta.client) {
      const nextQuery = { ...route.query }
      delete nextQuery.tutorial
      router.replace({ path: route.path, query: nextQuery, hash: route.hash })
    }

    window.setTimeout(() => {
      currentStep.value = 1
      showTutorial.value = true
      updateSpotlightLayout()
    }, forceReplay ? 300 : 1000)
  }
}

/** Replay the tour without persisting completion until the user finishes or skips. */
function startTutorial() {
  currentStep.value = 1
  showTutorial.value = true
  updateSpotlightLayout()
}

defineExpose({ startTutorial })

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
