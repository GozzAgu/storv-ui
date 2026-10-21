<template>
  <SCard v-if="queuedCount || failedCount" class="s-offline-sales" flush>
    <template #header>
      <div class="s-offline-sales__head">
        <WifiOff :size="16" :stroke-width="2" aria-hidden="true" />
        <h2 class="s-card__title">Sales saved offline</h2>
        <SBadge v-if="queuedCount" tone="warning">{{ queuedCount }} waiting</SBadge>
        <SBadge v-if="failedCount" tone="error">{{ failedCount }} not recorded</SBadge>
      </div>
    </template>
    <template v-if="queuedCount" #actions>
      <SButton size="sm" :loading="syncing" :disabled="!online" @click="syncNow">
        {{ online ? 'Sync now' : 'Waiting for internet' }}
      </SButton>
    </template>

    <ul class="s-list" aria-label="Sales saved offline on this device">
      <li v-for="sale in failed" :key="sale.saleId" class="s-list__item">
        <div class="s-list__main">
          <p class="s-offline-sales__title">
            {{ sale.summary }}
            <SBadge tone="error">Not recorded</SBadge>
          </p>
          <p class="s-offline-sales__meta">
            Saved {{ when(sale.queuedAt) }} · {{ sale.lastError || 'Refused by the server' }}
          </p>
        </div>
        <div class="s-offline-sales__actions">
          <SButton size="sm" :disabled="!online || syncing" @click="retry(sale.saleId)">
            Try again
          </SButton>
          <SButton size="sm" variant="ghost" @click="askDismiss(sale)">Dismiss</SButton>
        </div>
      </li>
      <li v-for="sale in queued" :key="sale.saleId" class="s-list__item">
        <div class="s-list__main">
          <p class="s-offline-sales__title">
            {{ sale.summary }}
            <SBadge tone="warning">Waiting to sync</SBadge>
          </p>
          <p class="s-offline-sales__meta">
            Saved {{ when(sale.queuedAt)
            }}<template v-if="sale.lastError"> · Last try: {{ sale.lastError }}</template>
          </p>
        </div>
      </li>
    </ul>

    <SDialog
      v-model:open="dismissOpen"
      title="Dismiss this sale?"
      description="It was never recorded. Re-enter it as a new sale if the customer still paid, or it won’t appear in your takings."
      size="sm"
      role="alertdialog"
    >
      <template #footer>
        <SButton data-autofocus @click="dismissOpen = false">Keep it</SButton>
        <SButton variant="danger" @click="confirmDismiss">Dismiss</SButton>
      </template>
    </SDialog>
  </SCard>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { WifiOff } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import { useAppToast } from '~/composables/useAppToast'
import { useSalesApi } from '~/composables/useSalesApi'
import { useSalesOutbox } from '~/composables/useSalesOutbox'
import type { FailedSale } from '~/utils/sales-outbox'

const emit = defineEmits<{ recorded: [] }>()

const { queued, failed, queuedCount, failedCount, retry: requeue, dismiss } = useSalesOutbox()
const { flushQueued } = useSalesApi()
const toast = useAppToast()

const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const syncing = ref(false)
const dismissOpen = ref(false)
const toDismiss = ref<FailedSale | null>(null)

const setOnline = () => (online.value = navigator.onLine)
onMounted(() => {
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOnline)
})
onBeforeUnmount(() => {
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOnline)
})

function when(iso: string): string {
  const date = new Date(iso)
  if (!Number.isFinite(date.getTime())) return 'earlier'
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function syncNow() {
  if (syncing.value) return
  syncing.value = true
  try {
    const result = await flushQueued()
    if (result.recorded.length) {
      const n = result.recorded.length
      toast.success(`${n} sale${n === 1 ? '' : 's'} recorded`)
      emit('recorded')
    }
    if (result.failed.length) {
      const n = result.failed.length
      toast.error(`${n} sale${n === 1 ? '' : 's'} could not be recorded. See the reasons below.`)
    }
  } finally {
    syncing.value = false
  }
}

async function retry(saleId: string) {
  requeue(saleId)
  await syncNow()
}

function askDismiss(sale: FailedSale) {
  toDismiss.value = sale
  dismissOpen.value = true
}

function confirmDismiss() {
  if (toDismiss.value) dismiss(toDismiss.value.saleId)
  toDismiss.value = null
  dismissOpen.value = false
}
</script>

<style scoped>
.s-offline-sales__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-space-1);
  color: var(--s-text);
}

.s-offline-sales__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-space-1);
  margin: 0;
  font: var(--s-text-body-strong, 600 0.875rem / 1.25rem var(--s-font-sans));
  color: var(--s-text);
}

.s-offline-sales__meta {
  margin: 2px 0 0;
  font: var(--s-text-small);
  color: var(--s-text-2);
}

.s-offline-sales__actions {
  display: flex;
  flex: none;
  gap: var(--s-space-1);
}

@media (max-width: 639px) {
  .s-offline-sales :deep(.s-list__item) {
    flex-wrap: wrap;
  }
}
</style>
