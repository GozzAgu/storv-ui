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
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 pointer-events-auto transform transition-all duration-300"
        :style="cardPosition"
      >
        <!-- Step Indicator -->
        <div class="flex items-center justify-between mb-6">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Step {{ currentStep }} of {{ totalSteps }}
          </span>
          <button
            @click="skipTutorial"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Tutorial Content -->
        <div class="space-y-4">
          <div class="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 mb-4 mx-auto">
            <component :is="tutorialSteps[currentStep - 1]?.icon" class="h-8 w-8 text-white" />
          </div>
          
          <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
            {{ tutorialSteps[currentStep - 1]?.title }}
          </h3>
          
          <p class="text-gray-600 dark:text-gray-400 text-center">
            {{ tutorialSteps[currentStep - 1]?.description }}
          </p>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
          >
            Previous
          </button>
          <div v-else></div>

          <div class="flex items-center gap-2">
            <button
              @click="skipTutorial"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
            >
              Skip
            </button>
            <button
              @click="nextStep"
              class="px-6 py-2 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300"
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

