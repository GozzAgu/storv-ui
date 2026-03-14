<template>
  <div v-if="showTutorial" class="fixed inset-0 z-50 overflow-hidden">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-black/60 transition-opacity"
      @click="skipTutorial"
    ></div>

    <!-- Tutorial Content -->
    <div class="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
      <div
        ref="tutorialCard"
        class="bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-gray-200/60 dark:ring-gray-700/60 shadow-2xl max-w-md w-full pointer-events-auto transform transition-all duration-300 overflow-hidden"
        :style="cardPosition"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/60">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
            Step {{ currentStep }} of {{ totalSteps }}
          </span>
          <button
            @click="skipTutorial"
            class="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/80 rounded-lg transition-colors"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-3 sm:p-4 space-y-3">
          <div class="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 mx-auto">
            <component :is="tutorialSteps[currentStep - 1]?.icon" class="h-6 w-6 text-white" />
          </div>
          
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center tracking-tight">
            {{ tutorialSteps[currentStep - 1]?.title }}
          </h3>
          
          <p class="text-xs text-gray-600 dark:text-gray-400 text-center leading-relaxed">
            {{ tutorialSteps[currentStep - 1]?.description }}
          </p>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between gap-2 p-3 sm:p-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            class="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
          >
            Previous
          </button>
          <div v-else></div>

          <div class="flex items-center gap-2">
            <button
              @click="skipTutorial"
              class="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
            >
              Skip
            </button>
            <button
              @click="nextStep"
              class="px-3.5 py-1.5 text-xs font-semibold bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              {{ currentStep === totalSteps ? 'Get Started' : 'Next' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { 
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  ReceiptPercentIcon,
  UsersIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/outline'
import { useUser } from '~/composables/useUser'
import { useFirebaseAuth } from '~/composables/useFirebaseAuth'

interface TutorialStep {
  title: string
  description: string
  icon: any
  targetSelector?: string
}

const props = defineProps<{
  tutorialSteps: TutorialStep[]
}>()

const emit = defineEmits<{
  complete: []
}>()

const { currentUser } = useFirebaseAuth()
const { completeTutorial, getUserDocument } = useUser()

const showTutorial = ref(false)
const currentStep = ref(1)
const totalSteps = computed(() => props.tutorialSteps.length)
const tutorialCard = ref<HTMLElement | null>(null)
const cardPosition = ref({})

// Check if user needs tutorial
onMounted(async () => {
  await checkTutorialStatus()
})

const checkTutorialStatus = async () => {
  if (!currentUser.value) return

  const userData = await getUserDocument(currentUser.value.uid)
  if (userData && !userData.hasCompletedTutorial && userData.hasCompletedOnboarding) {
    // Wait a bit before showing tutorial
    setTimeout(() => {
      showTutorial.value = true
      if (props.tutorialSteps[currentStep.value - 1]?.targetSelector) {
        updateCardPosition()
      }
    }, 1000)
  }
}

const updateCardPosition = async () => {
  await nextTick()
  const step = props.tutorialSteps[currentStep.value - 1]
  if (!step?.targetSelector || !tutorialCard.value) return

  const targetElement = document.querySelector(step.targetSelector)
  if (!targetElement) return

  const rect = targetElement.getBoundingClientRect()
  const cardRect = tutorialCard.value.getBoundingClientRect()
  
  // Position card near target element
  const top = rect.bottom + 20
  const left = rect.left + (rect.width / 2) - (cardRect.width / 2)
  
  // Ensure card stays within viewport
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  let finalLeft = Math.max(16, Math.min(left, viewportWidth - cardRect.width - 16))
  let finalTop = Math.max(16, Math.min(top, viewportHeight - cardRect.height - 16))
  
  cardPosition.value = {
    position: 'absolute',
    top: `${finalTop}px`,
    left: `${finalLeft}px`,
    transform: 'none'
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    if (props.tutorialSteps[currentStep.value - 1]?.targetSelector) {
      updateCardPosition()
    }
  }
}

const nextStep = async () => {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++
    if (props.tutorialSteps[currentStep.value - 1]?.targetSelector) {
      updateCardPosition()
    }
  } else {
    await finishTutorial()
  }
}

const skipTutorial = async () => {
  await finishTutorial()
}

const finishTutorial = async () => {
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
</script>

