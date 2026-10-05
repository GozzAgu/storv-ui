<template>
  <div class="s-buddies" aria-hidden="true">
    <div class="s-buddies__stage">
      <div class="s-buddies__say s-buddies__say--left">
        <Transition name="s-bubble" mode="out-in">
          <p :key="reaction.left.text" class="s-buddies__bubble s-buddies__bubble--left">
            {{ reaction.left.text }}
          </p>
        </Transition>
      </div>

      <div class="s-buddies__faces">
        <AuthBuddy
          class="s-buddies__face s-buddies__face--left"
          variant="ada"
          :mood="reaction.left.mood"
          :look="reaction.look"
        />
        <AuthBuddy
          class="s-buddies__face s-buddies__face--right"
          variant="tunde"
          :mood="reaction.right.mood"
          :look="reaction.look"
        />
      </div>

      <div class="s-buddies__say s-buddies__say--right">
        <Transition name="s-bubble" mode="out-in">
          <p :key="reaction.right.text" class="s-buddies__bubble s-buddies__bubble--right">
            {{ reaction.right.text }}
          </p>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AuthBuddy from '~/components/auth/AuthBuddy.vue'
import { getBuddyReaction, type BuddyState } from '~/utils/auth-buddies'

const props = defineProps<BuddyState>()

const reaction = computed(() => getBuddyReaction(props))
</script>
