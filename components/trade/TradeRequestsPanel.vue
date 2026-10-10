<template>
  <div class="s-trade-reqs">
    <SCard title="Asked of you" flush>
      <template #actions>
        <span v-if="awaitingReply" class="s-trade-reqs__pending"
          >{{ awaitingReply }} waiting for your reply</span
        >
      </template>
      <p v-if="!requests.incoming.length" class="s-list__empty">
        When a partner asks whether you have something, it shows here.
      </p>
      <ul v-else class="s-list">
        <li
          v-for="r in requests.incoming"
          :key="r.id"
          class="s-list__item s-trade-req"
          :class="{ 's-trade-req--done': r.state !== 'open' }"
        >
          <span class="s-trade-req__icon" aria-hidden="true">
            <component :is="categoryKindIcon(r.categoryKind)" :size="18" :stroke-width="1.75" />
          </span>
          <div class="s-list__main">
            <span class="s-list__primary">{{ itemLabel(r) }}</span>
            <span class="s-list__secondary">{{ r.from.displayName }} · {{ timing(r) }}</span>
            <span v-if="r.note" class="s-trade-req__note">“{{ r.note }}”</span>
          </div>
          <div class="s-trade-req__end">
            <template v-if="r.myReply">
              <SBadge :tone="r.myReply.status === 'have' ? 'success' : 'neutral'">
                {{ replyLabel(r.myReply) }}
              </SBadge>
              <SButton v-if="r.state === 'open'" size="sm" variant="ghost" @click="openReply(r)">
                Change
              </SButton>
            </template>
            <SBadge v-else-if="r.state !== 'open'">{{ stateLabel(r) }}</SBadge>
            <template v-else>
              <SButton
                size="sm"
                variant="secondary"
                :loading="busyId === `${r.id}:no`"
                :disabled="!!busyId"
                @click="sayNo(r)"
              >
                Don't have
              </SButton>
              <SButton size="sm" variant="primary" :disabled="!!busyId" @click="openReply(r)">
                I have it
              </SButton>
            </template>
          </div>
        </li>
      </ul>
    </SCard>

    <SCard title="Your requests" flush>
      <template #actions>
        <SButton
          variant="primary"
          size="sm"
          :disabled="!partners.length"
          :title="partners.length ? '' : 'Add a partner first'"
          @click="openAsk"
        >
          <template #leading><Plus :size="14" :stroke-width="2" aria-hidden="true" /></template>
          Ask partners
        </SButton>
      </template>
      <SEmptyState
        v-if="!requests.outgoing.length"
        title="Need something you don't have?"
        :description="
          partners.length
            ? 'Ask your partners in one go. They reply with whether they have it and their price.'
            : 'Add partners first, then ask them for stock in one go.'
        "
      >
        <template #icon
          ><PackageSearch :size="24" :stroke-width="1.75" aria-hidden="true"
        /></template>
      </SEmptyState>
      <ul v-else class="s-list">
        <li v-for="r in requests.outgoing" :key="r.id">
          <button
            type="button"
            class="s-list__item s-list__item--interactive s-trade-req"
            :class="{ 's-trade-req--done': r.state !== 'open' }"
            :aria-label="`Replies for ${itemLabel(r)}`"
            @click="viewing = r"
          >
            <span class="s-trade-req__icon" aria-hidden="true">
              <component :is="categoryKindIcon(r.categoryKind)" :size="18" :stroke-width="1.75" />
            </span>
            <span class="s-list__main">
              <span class="s-list__primary">{{ itemLabel(r) }}</span>
              <span class="s-list__secondary">
                Asked {{ r.recipientCount }} partner{{ r.recipientCount === 1 ? '' : 's' }} ·
                {{ timing(r) }}
              </span>
            </span>
            <SBadge v-if="r.haveCount" tone="success"
              >{{ r.haveCount }} {{ r.haveCount === 1 ? 'has' : 'have' }} it</SBadge
            >
            <SBadge v-else-if="r.state !== 'open'">{{ stateLabel(r) }}</SBadge>
            <SBadge v-else>{{
              r.replyCount ? `${r.replyCount} replied` : 'No replies yet'
            }}</SBadge>
            <ChevronRight
              class="s-partners__chevron"
              :size="16"
              :stroke-width="1.75"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </SCard>

    <SDialog
      v-model:open="showAsk"
      title="Ask partners"
      description="They reply with whether they have it and their price. Requests close after 48 hours."
      :dismissible="!asking"
    >
      <form id="trade-ask-form" class="s-form" @submit.prevent="submitAsk">
        <SInput
          v-model="askItem"
          label="What do you need?"
          placeholder="e.g. iPhone 15 Pro Max 256GB"
          maxlength="120"
          required
        />
        <SInput
          v-model="askQty"
          label="Quantity"
          inputmode="numeric"
          :error="askQtyError"
          class="s-trade-reqs__qty"
        />
        <STextarea
          v-model="askNote"
          label="Details (optional)"
          placeholder="Colour, condition, when you need it…"
          :rows="2"
          maxlength="280"
        />
        <fieldset class="s-trade-reqs__to">
          <legend class="s-trade-reqs__legend">Ask</legend>
          <SCheckbox v-model="askAll" :label="`All partners (${partners.length})`" />
          <div v-if="!askAll" class="s-trade-reqs__choose">
            <SCheckbox
              v-for="p in partners"
              :key="p.id"
              :model-value="askTo.includes(p.partner.handle)"
              :label="p.partner.displayName"
              :description="`@${p.partner.handle}`"
              @update:model-value="(on) => toggleTo(p.partner.handle, on)"
            />
          </div>
        </fieldset>
      </form>
      <template #footer>
        <SDialogActions
          primary-label="Send request"
          :primary-loading="asking"
          :primary-disabled="!canAsk"
          @cancel="showAsk = false"
          @primary="submitAsk"
        />
      </template>
    </SDialog>

    <SDialog
      v-model:open="showReply"
      :title="replying ? `Reply to ${replying.from.displayName}` : ''"
      :description="replying ? itemLabel(replying) : ''"
      size="sm"
      :dismissible="!busyId"
    >
      <form id="trade-reply-form" class="s-form" @submit.prevent="submitHave">
        <SInput
          v-model="replyPrice"
          label="Your price per unit (optional)"
          inputmode="decimal"
          placeholder="0"
          :error="replyPriceError"
        >
          <template #prefix>₦</template>
        </SInput>
        <SInput
          v-model="replyQty"
          label="How many you can supply"
          inputmode="numeric"
          :error="replyQtyError"
        />
        <SInput
          v-model="replyNote"
          label="Note (optional)"
          placeholder="e.g. Can deliver today"
          maxlength="200"
        />
      </form>
      <template #footer>
        <SButton
          v-if="replying?.myReply?.status === 'have'"
          variant="secondary"
          :disabled="!!busyId"
          @click="replying && sayNo(replying)"
        >
          I don't have it
        </SButton>
        <SButton
          variant="primary"
          :loading="busyId === `${replying?.id}:have`"
          :disabled="!!busyId || !!replyPriceError || !!replyQtyError"
          @click="submitHave"
        >
          Send reply
        </SButton>
      </template>
    </SDialog>

    <SDialog
      :open="!!viewing"
      :title="viewing ? itemLabel(viewing) : ''"
      :description="
        viewing
          ? `Asked ${viewing.recipientCount} partner${
              viewing.recipientCount === 1 ? '' : 's'
            } · ${timing(viewing)}`
          : ''
      "
      :dismissible="!busyId"
      @update:open="(v) => !v && (viewing = null)"
    >
      <p v-if="viewing?.note" class="s-trade-req__note s-trade-reqs__view-note">
        “{{ viewing.note }}”
      </p>
      <p v-if="viewing && !viewing.replies.length" class="s-partners__note">
        No replies yet. Partners get a notification and have until
        {{ formatTime(viewing.expiresAtMs) }} to answer.
      </p>
      <ul v-else-if="viewing" class="s-list s-trade-reqs__replies">
        <li v-for="reply in viewing.replies" :key="reply.partner.handle" class="s-list__item">
          <SAvatar :name="reply.partner.displayName" size="sm" />
          <div class="s-list__main">
            <span class="s-list__primary">{{ reply.partner.displayName }}</span>
            <span v-if="reply.status === 'have'" class="s-list__secondary">
              {{ replyDetail(reply) }}<template v-if="reply.note"> · “{{ reply.note }}”</template>
            </span>
          </div>
          <span v-if="reply.status === 'have' && reply.priceKobo !== null" class="s-list__value">
            {{ formatPrice(reply.priceKobo) }} <span class="s-trade-reqs__each">each</span>
          </span>
          <SBadge v-else-if="reply.status === 'dont_have'">Doesn't have it</SBadge>
          <SBadge v-else tone="success">Has it</SBadge>
        </li>
      </ul>
      <template v-if="viewing?.state === 'open'" #footer>
        <SButton
          variant="secondary"
          :loading="busyId === `${viewing.id}:close`"
          @click="viewing && closeIt(viewing)"
        >
          Close request
        </SButton>
      </template>
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight, PackageSearch, Plus } from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SInput from '~/components/s/SInput.vue'
import STextarea from '~/components/s/STextarea.vue'
import { useAppToast } from '~/composables/useAppToast'
import { tradeErrorMessage } from '~/composables/useTradePartners'
import type {
  NewTradeRequestInput,
  TradeConnectionView,
  TradeReplyInput,
  TradeRequestView,
  TradeRequestsList,
} from '~/types/trade'
import { categoryKindIcon } from '~/utils/category-kind-icons'

const props = defineProps<{
  requests: TradeRequestsList
  partners: TradeConnectionView[]
  onAsk: (input: NewTradeRequestInput) => Promise<void>
  onReply: (requestId: string, input: TradeReplyInput) => Promise<void>
  onClose: (requestId: string) => Promise<void>
}>()

const toast = useAppToast()
const busyId = ref('')

const awaitingReply = computed(
  () => props.requests.incoming.filter((r) => r.state === 'open' && !r.myReply).length
)

const priceFormat = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

function formatPrice(kobo: number) {
  return priceFormat.format(kobo / 100)
}

function formatTime(ms: number) {
  return timeFormat.format(ms)
}

function itemLabel(r: Pick<TradeRequestView, 'item' | 'quantity'>) {
  return r.quantity > 1 ? `${r.quantity} × ${r.item}` : r.item
}

function ago(ms: number) {
  const mins = Math.max(0, Math.round((Date.now() - ms) / 60_000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`
}

function timing(r: TradeRequestView) {
  if (r.state !== 'open') return ago(r.createdAtMs)
  const left = Math.max(1, Math.round((r.expiresAtMs - Date.now()) / 3_600_000))
  return `${ago(r.createdAtMs)} · closes in ${left}h`
}

function stateLabel(r: TradeRequestView) {
  return r.state === 'closed' ? 'Closed' : 'Expired'
}

function replyLabel(reply: TradeReplyInput) {
  if (reply.status === 'dont_have') return "You don't have it"
  return reply.priceKobo !== null ? `You have it · ${formatPrice(reply.priceKobo)}` : 'You have it'
}

function replyDetail(reply: TradeReplyInput) {
  if (reply.status === 'dont_have') return 'No'
  return reply.quantity ? `Can supply ${reply.quantity}` : 'Has it'
}

function parseWhole(value: string): number | null {
  const t = String(value ?? '').trim()
  if (!t) return null
  return /^\d+$/.test(t) ? Number(t) : NaN
}

/* Ask partners */
const showAsk = ref(false)
const asking = ref(false)
const askItem = ref('')
const askQty = ref('1')
const askNote = ref('')
const askAll = ref(true)
const askTo = ref<string[]>([])

const askQtyValue = computed(() => parseWhole(askQty.value) ?? 1)
const askQtyError = computed(() =>
  Number.isNaN(askQtyValue.value) || askQtyValue.value < 1 || askQtyValue.value > 100_000
    ? 'Enter a whole number from 1 to 100,000.'
    : ''
)
const canAsk = computed(
  () =>
    askItem.value.trim().length >= 2 &&
    !askQtyError.value &&
    (askAll.value || askTo.value.length > 0) &&
    !asking.value
)

function openAsk() {
  askItem.value = ''
  askQty.value = '1'
  askNote.value = ''
  askAll.value = true
  askTo.value = []
  showAsk.value = true
}

function toggleTo(handle: string, on: boolean) {
  askTo.value = on ? [...askTo.value, handle] : askTo.value.filter((h) => h !== handle)
}

async function submitAsk() {
  if (!canAsk.value) return
  asking.value = true
  try {
    await props.onAsk({
      item: askItem.value.trim(),
      quantity: askQtyValue.value,
      note: askNote.value.trim(),
      to: askAll.value ? [] : askTo.value,
    })
    showAsk.value = false
    toast.success('Request sent to your partners')
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not send the request'))
  } finally {
    asking.value = false
  }
}

/* Reply */
const showReply = ref(false)
const replying = ref<TradeRequestView | null>(null)
const replyPrice = ref('')
const replyQty = ref('')
const replyNote = ref('')

const replyPriceKobo = computed(() => {
  const t = replyPrice.value.replace(/[,\s₦]/g, '')
  if (!t) return null
  return /^\d+(\.\d{1,2})?$/.test(t) ? Math.round(Number(t) * 100) : NaN
})
const replyPriceError = computed(() =>
  Number.isNaN(replyPriceKobo.value) ? 'Enter an amount like 150000 or 1500.50.' : ''
)
const replyQtyValue = computed(() => parseWhole(replyQty.value))
const replyQtyError = computed(() =>
  replyQtyValue.value !== null && (Number.isNaN(replyQtyValue.value) || replyQtyValue.value < 1)
    ? 'Enter a whole number.'
    : ''
)

function openReply(r: TradeRequestView) {
  replying.value = r
  const prev = r.myReply?.status === 'have' ? r.myReply : null
  replyPrice.value = prev?.priceKobo != null ? String(prev.priceKobo / 100) : ''
  replyQty.value = String(prev?.quantity ?? r.quantity)
  replyNote.value = prev?.note ?? ''
  showReply.value = true
}

async function send(r: TradeRequestView, input: TradeReplyInput, key: string) {
  busyId.value = `${r.id}:${key}`
  try {
    await props.onReply(r.id, input)
    showReply.value = false
    toast.success(
      input.status === 'have' ? `${r.from.displayName} will see your reply` : 'Reply sent'
    )
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not send your reply'))
  } finally {
    busyId.value = ''
  }
}

function sayNo(r: TradeRequestView) {
  return send(r, { status: 'dont_have', priceKobo: null, quantity: null, note: '' }, 'no')
}

function submitHave() {
  const r = replying.value
  if (!r || replyPriceError.value || replyQtyError.value) return
  return send(
    r,
    {
      status: 'have',
      priceKobo: replyPriceKobo.value as number | null,
      quantity: replyQtyValue.value,
      note: replyNote.value.trim(),
    },
    'have'
  )
}

/* View replies */
const viewing = ref<TradeRequestView | null>(null)

async function closeIt(r: TradeRequestView) {
  busyId.value = `${r.id}:close`
  try {
    await props.onClose(r.id)
    viewing.value = null
    toast.success('Request closed')
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not close the request'))
  } finally {
    busyId.value = ''
  }
}
</script>
