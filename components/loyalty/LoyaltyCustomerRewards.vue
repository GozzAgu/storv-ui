<template>
  <section
    v-if="state !== 'hidden'"
    class="s-customer__balance"
    aria-label="Rewards"
    :aria-busy="state === 'loading'"
  >
    <div>
      <p class="s-customer__balance-label">Rewards</p>
      <p v-if="state === 'loading'" class="s-customer__balance-value">…</p>
      <p v-else-if="member" class="s-customer__balance-value">
        {{ member.points.toLocaleString() }} {{ member.points === 1 ? 'point' : 'points' }}
      </p>
      <p v-else class="s-customer__balance-value">No points yet</p>
      <p v-if="member?.next" class="s-customer__balance-label">
        {{ formatCurrency(member.next.remaining) }} more this year to reach {{ member.next.name }}
      </p>
    </div>
    <SBadge v-if="member" :tone="tierTone(member.tier.id)">{{ member.tier.name }}</SBadge>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import SBadge from '~/components/s/SBadge.vue'
import { loyaltyUiFlag, useLoyalty, type LoyaltyMemberView } from '~/composables/useLoyalty'
import { loyaltyTierTone as tierTone } from '~/utils/loyalty'

const props = defineProps<{ phone?: string | null; email?: string | null }>()

const loyalty = useLoyalty()
const { formatCurrency } = usePreferences()
const member = ref<LoyaltyMemberView | null>(null)
const state = ref<'hidden' | 'loading' | 'ready'>('hidden')
let latest = 0

watch(
  () => [props.phone, props.email],
  async ([phone, email]) => {
    member.value = null
    if (!loyaltyUiFlag() || (!phone && !email)) {
      state.value = 'hidden'
      return
    }
    const request = ++latest
    state.value = 'loading'
    try {
      const found = await loyalty.findMember({
        phone: phone || undefined,
        email: email || undefined,
      })
      if (request !== latest) return
      member.value = found
      state.value = 'ready'
    } catch {
      if (request === latest) state.value = 'hidden'
    }
  },
  { immediate: true }
)
</script>
