<template>
  <ul class="mk-faq">
    <li
      v-for="(item, i) in items"
      :key="item.q"
      class="mk-faq__item"
      :class="{ 'mk-faq__item--open': open === i }"
    >
      <h3>
        <button
          :id="`${baseId}-q-${i}`"
          type="button"
          class="mk-faq__q"
          :aria-expanded="open === i"
          :aria-controls="`${baseId}-a-${i}`"
          @click="open = open === i ? null : i"
        >
          <span class="mk-faq__q-text">{{ item.q }}</span>
          <span v-if="item.soon" class="mk-tag">Coming soon</span>
          <Plus class="mk-faq__icon" :size="18" aria-hidden="true" />
        </button>
      </h3>
      <div
        :id="`${baseId}-a-${i}`"
        class="mk-faq__a"
        role="region"
        :aria-labelledby="`${baseId}-q-${i}`"
        :inert="open !== i || undefined"
      >
        <div class="mk-faq__a-inner">
          <!-- Answers are static copy written in this repo -->
          <div v-if="item.html" v-html="item.a" />
          <div v-else>{{ item.a }}</div>
        </div>
      </div>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { Plus } from '@lucide/vue'

export interface MkFaqItem {
  q: string
  a: string
  /** `a` contains markup (links, emphasis). */
  html?: boolean
  soon?: boolean
}

defineProps<{ items: MkFaqItem[] }>()

const baseId = useId()
const open = ref<number | null>(0)
</script>
