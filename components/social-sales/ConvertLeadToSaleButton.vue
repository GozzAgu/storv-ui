<template>
  <Button
    variant="primary"
    size="sm"
    :icon="ReceiptPercentIcon"
    :extra-class="headerBtnClass"
    :disabled="disabled"
    @click="emit('convert')"
  >
    Convert to sale
  </Button>
</template>

<script setup lang="ts">
import Button from '~/components/ui/Button.vue'
import { ReceiptPercentIcon } from '~/utils/app-icons'

defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{ convert: [] }>()

const { headerBtnClass } = useDashboardPageChrome()
</script>
