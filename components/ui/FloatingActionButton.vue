<script setup lang="ts">
import { ref, computed } from 'vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface Action {
  id: string
  label: string
  icon: any
  action: () => void
  color?: 'primary' | 'green' | 'blue' | 'orange' | 'purple'
}

interface Props {
  actions?: Action[]
  mainAction?: Action
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

const props = withDefaults(defineProps<Props>(), {
  actions: () => [],
  position: 'bottom-right',
})

const isOpen = ref(false)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const handleAction = (action: Action) => {
  action.action()
  isOpen.value = false
}

const positionClasses = computed(() => {
  switch (props.position) {
    case 'bottom-left':
      return 'bottom-6 left-6'
    case 'top-right':
      return 'top-6 right-6'
    case 'top-left':
      return 'top-6 left-6'
    default:
      return 'bottom-6 right-6'
  }
})

const getColorClasses = (color?: string) => {
  switch (color) {
    case 'green':
      return 'bg-green-600 hover:bg-green-700 text-white'
    case 'blue':
      return 'bg-blue-600 hover:bg-blue-700 text-white'
    case 'orange':
      return 'bg-orange-600 hover:bg-orange-700 text-white'
    case 'purple':
      return 'bg-purple-600 hover:bg-purple-700 text-white'
    default:
      return 'bg-primary-500 hover:bg-primary-600 text-white'
  }
}
</script>

<template>
  <div :class="['fixed z-50', positionClasses]">
    <!-- Action Menu -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-2"
    >
      <div
        v-if="isOpen && actions && actions.length > 0"
        class="mb-3 space-y-2"
      >
        <button
          v-for="(action, index) in actions"
          :key="action.id"
          @click="handleAction(action)"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105',
            getColorClasses(action.color),
            'min-w-[180px]'
          ]"
          :style="{ 
            animationDelay: `${index * 50}ms`,
            transform: isOpen ? 'translateY(0)' : 'translateY(10px)'
          }"
        >
          <component :is="action.icon" class="w-5 h-5 flex-shrink-0" />
          <span class="font-medium text-sm">{{ action.label }}</span>
        </button>
      </div>
    </Transition>

    <!-- Main FAB Button -->
    <button
      @click="mainAction ? handleAction(mainAction) : (actions && actions.length > 0 ? toggleMenu() : null)"
      :class="[
        'w-14 h-14 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center',
        mainAction 
          ? getColorClasses(mainAction.color)
          : isOpen 
            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
            : 'bg-primary-500 hover:bg-primary-600 text-white'
      ]"
    >
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 rotate-90"
        enter-to-class="opacity-100 rotate-0"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 rotate-0"
        leave-to-class="opacity-0 -rotate-90"
      >
        <XMarkIcon v-if="isOpen && !mainAction && actions && actions.length > 0" key="close" class="w-6 h-6 text-white" />
        <component v-else-if="mainAction" :is="mainAction.icon" key="main" class="w-6 h-6 text-white" />
        <PlusIcon v-else key="plus" class="w-6 h-6 text-white" />
      </Transition>
    </button>

    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
    <div
      v-if="isOpen && actions && actions.length > 0"
      @click="isOpen = false"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
    ></div>
    </Transition>
  </div>
</template>
