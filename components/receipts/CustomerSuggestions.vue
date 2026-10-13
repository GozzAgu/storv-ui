<template>
  <ul
    v-if="customers.length > 0"
    class="s-popover s-popover--start s-new-sale__suggest"
    role="listbox"
    aria-label="Existing customers"
  >
    <li
      v-for="customer in customers"
      :key="customer.id"
      class="s-menu-row"
      role="option"
      aria-selected="false"
      @mousedown.prevent="emit('pick', customer)"
    >
      <SAvatar :name="customer.name" size="sm" />
      <span class="s-menu-row__text">
        <span class="s-menu-row__label">{{ customer.name }}</span>
        <span v-if="customer.email || customer.phone" class="s-menu-row__meta">
          {{ [customer.phone, customer.email].filter(Boolean).join(' · ') }}
        </span>
      </span>
      <span class="s-new-sale__suggest-count">
        {{ customer.totalOrders }} order{{ customer.totalOrders !== 1 ? 's' : '' }}
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts" generic="T extends { id: string; name: string; email?: string; phone?: string; totalOrders: number }">
import SAvatar from '~/components/s/SAvatar.vue'

defineProps<{ customers: T[] }>()
const emit = defineEmits<{ pick: [customer: T] }>()
</script>
