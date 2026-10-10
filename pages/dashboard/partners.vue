<template>
  <div class="ds-root s-c s-page s-partners">
    <SPageHeader title="Partners">
      <template #eyebrow>
        <p class="s-page-header__eyebrow">Operations</p>
      </template>
      <template #description>
        Connect with businesses you buy from, sell to or borrow stock from. Partners never see your
        stock, sales or customers.
      </template>
      <template v-if="overview.canManage && profile.handle" #actions>
        <SButton variant="secondary" @click="showShare = true">
          <template #leading
            ><QrCode :size="16" :stroke-width="1.75" aria-hidden="true"
          /></template>
          Share invite
        </SButton>
      </template>
    </SPageHeader>

    <SCard v-if="!loaded && loading">
      <SSkeleton :lines="3" />
    </SCard>

    <SCard v-else-if="loadError" title="Partners could not load" :description="loadError">
      <SButton variant="secondary" @click="reload">Try again</SButton>
    </SCard>

    <template v-else-if="!profile.handle">
      <SCard
        v-if="overview.canManage"
        title="Choose your trade handle"
        description="Other businesses find and add you by this name. You can change it later."
      >
        <form class="s-form s-partners__handle-form" @submit.prevent="saveProfile">
          <SInput
            v-model="handleDraft"
            label="Trade handle"
            placeholder="your-business"
            autocomplete="off"
            :hint="
              handleDraft
                ? `Partners will see @${normalizedDraft}`
                : 'Letters, numbers and hyphens.'
            "
            :error="handleDraftProblem"
            required
          >
            <template #prefix>@</template>
          </SInput>
          <SInput
            v-model="nameDraft"
            label="Name shown to partners"
            placeholder="Your business name"
            autocomplete="organization"
          />
          <div>
            <SButton
              type="submit"
              variant="primary"
              :loading="savingProfile"
              :disabled="!canSaveHandle"
            >
              Save handle
            </SButton>
          </div>
        </form>
      </SCard>
      <SCard
        v-else
        title="Partners are not set up yet"
        description="The business owner needs to choose a trade handle before you can work with partners."
      />
    </template>

    <template v-else>
      <STabs v-model="tab" :tabs="tabs" label="Partners sections" panel-id="partners-panel" />

      <div
        v-if="tab === 'loans'"
        id="partners-panel"
        class="s-partners__panel"
        role="tabpanel"
      >
        <SCard
          v-if="overview.lendBlocker"
          title="Lend stock to partners"
          description="Lending to partners is on the Enterprise plan. You can still borrow from partners on any plan."
        >
          <SButton v-if="overview.canManage" variant="secondary" to="/dashboard/settings?tab=subscription">
            See plans
          </SButton>
        </SCard>
        <SCard
          v-else
          title="Lend stock to partners"
          description="Lend serial items at an agreed price. They return them or pay you for the ones they sell."
        >
          <SButton variant="primary" :disabled="!partners.length" @click="startLend(null)">
            Lend stock
          </SButton>
        </SCard>
        <TradeLoansCard
          :loans="loans"
          :can-pay="overview.canTrade"
          :on-return="api.returnLoanItems"
          :on-pay="api.payLoan"
        />
        <SCard v-if="!loans.length">
          <SEmptyState
            title="No partner loans"
            description="Stock you lend to partners, or borrow from them, shows here with its due date."
          >
            <template #icon
              ><Handshake :size="24" :stroke-width="1.75" aria-hidden="true"
            /></template>
          </SEmptyState>
        </SCard>
      </div>

      <div
        v-else-if="overview.canTrade && tab === 'requests'"
        id="partners-panel"
        class="s-partners__panel"
        role="tabpanel"
      >
        <TradeRequestsPanel
          :requests="requests"
          :partners="partners"
          :on-ask="api.ask"
          :on-reply="api.reply"
          :on-close="api.closeRequest"
          :on-bill="canBill ? startBill : undefined"
          :on-lend="overview.lendBlocker ? undefined : startLend"
        />
        <TradeSalesCard
          :sales="sales"
          :on-pay="api.payUrl"
          :on-receipt="api.saleReceipt"
          :on-claim-stock="api.claimSaleStock"
          :on-changed="api.loadSales"
        />
      </div>

      <div
        v-else
        id="partners-panel"
        class="s-partners__panel"
        role="tabpanel"
      >
        <SCard>
          <div class="s-partners__me">
            <SAvatar :name="profile.displayName" size="lg" />
            <div class="s-partners__me-text">
              <p class="s-partners__me-name">{{ profile.displayName }}</p>
              <p class="s-partners__handle">@{{ profile.handle }}</p>
            </div>
            <SBadge v-if="profile.bankVerified" tone="success">
              <BadgeCheck :size="12" :stroke-width="2" aria-hidden="true" />
              Bank verified
            </SBadge>
            <SButton v-if="overview.canManage" variant="ghost" size="sm" @click="openEditProfile">
              Edit
            </SButton>
          </div>
        </SCard>

        <SCard
          v-if="overview.canManage"
          title="Add a partner"
          description="Enter their trade handle. They get a request to accept."
        >
          <form class="s-partners__find" @submit.prevent="findPartner">
            <SInput
              v-model="findQuery"
              label="Their trade handle"
              placeholder="their-business"
              autocomplete="off"
              :error="findError"
            >
              <template #prefix>@</template>
            </SInput>
            <SButton
              type="submit"
              variant="secondary"
              :loading="finding"
              :disabled="!findQuery.trim()"
            >
              Find
            </SButton>
          </form>

          <div v-if="found" class="s-partners__result" aria-live="polite">
            <SAvatar :name="found.partner.displayName" />
            <div class="s-list__main">
              <span class="s-list__primary">{{ found.partner.displayName }}</span>
              <span class="s-list__secondary">@{{ found.partner.handle }}</span>
            </div>
            <SBadge v-if="found.partner.bankVerified" tone="success">Bank verified</SBadge>
            <SButton
              v-if="found.relation === 'none'"
              variant="primary"
              size="sm"
              :loading="busyId === 'invite'"
              @click="sendRequest(found.partner.handle)"
            >
              Send request
            </SButton>
            <SButton
              v-else-if="found.relation === 'incoming'"
              variant="primary"
              size="sm"
              :loading="busyId === 'invite'"
              @click="sendRequest(found.partner.handle)"
            >
              Accept their request
            </SButton>
            <SBadge v-else-if="found.relation === 'outgoing'">Request sent</SBadge>
            <SBadge v-else-if="found.relation === 'active'" tone="success">Partners</SBadge>
            <SBadge v-else>This is you</SBadge>
          </div>
        </SCard>

        <SCard v-if="incoming.length || outgoing.length" title="Partner requests" flush>
          <ul class="s-list">
            <li v-for="c in incoming" :key="c.id" class="s-list__item">
              <SAvatar :name="c.partner.displayName" />
              <div class="s-list__main">
                <span class="s-list__primary">{{ c.partner.displayName }}</span>
                <span class="s-list__secondary">@{{ c.partner.handle }} · wants to connect</span>
              </div>
              <div v-if="overview.canManage" class="s-partners__row-actions">
                <SButton
                  size="sm"
                  variant="secondary"
                  :disabled="!!busyId"
                  @click="act(c, 'decline')"
                >
                  Decline
                </SButton>
                <SButton
                  size="sm"
                  variant="primary"
                  :loading="busyId === c.id"
                  @click="act(c, 'accept')"
                >
                  Accept
                </SButton>
              </div>
            </li>
            <li v-for="c in outgoing" :key="c.id" class="s-list__item">
              <SAvatar :name="c.partner.displayName" />
              <div class="s-list__main">
                <span class="s-list__primary">{{ c.partner.displayName }}</span>
                <span class="s-list__secondary">@{{ c.partner.handle }} · waiting for them</span>
              </div>
              <SButton
                v-if="overview.canManage"
                size="sm"
                variant="ghost"
                :loading="busyId === c.id"
                @click="act(c, 'cancel')"
              >
                Cancel
              </SButton>
            </li>
          </ul>
        </SCard>

        <SCard flush>
          <template #header>
            <h2 class="s-card__title">
              Partners <span class="s-partners__count">{{ partners.length }}</span>
            </h2>
          </template>
          <SEmptyState
            v-if="!partners.length"
            title="No partners yet"
            description="Share your handle or invite link with businesses you trade with."
          >
            <template #icon
              ><Network :size="24" :stroke-width="1.75" aria-hidden="true"
            /></template>
            <template v-if="overview.canManage" #actions>
              <SButton variant="secondary" @click="showShare = true">Share invite</SButton>
            </template>
          </SEmptyState>
          <ul v-else class="s-list">
            <li v-for="c in partners" :key="c.id">
              <component
                :is="overview.canManage ? 'button' : 'div'"
                :type="overview.canManage ? 'button' : undefined"
                class="s-list__item"
                :class="{ 's-list__item--interactive': overview.canManage }"
                :aria-label="overview.canManage ? `Manage ${c.partner.displayName}` : undefined"
                @click="overview.canManage && (managing = c)"
              >
                <SAvatar :name="c.partner.displayName" />
                <span class="s-list__main">
                  <span class="s-list__primary">{{ c.partner.displayName }}</span>
                  <span class="s-list__secondary">
                    @{{ c.partner.handle }} · partners since {{ formatSince(c.sinceMs) }}
                  </span>
                </span>
                <SBadge v-if="c.partner.bankVerified" tone="success">Bank verified</SBadge>
                <ChevronRight
                  v-if="overview.canManage"
                  class="s-partners__chevron"
                  :size="16"
                  :stroke-width="1.75"
                  aria-hidden="true"
                />
              </component>
            </li>
          </ul>
        </SCard>

        <SCard v-if="overview.canManage && blocked.length" title="Blocked" flush>
          <ul class="s-list">
            <li v-for="c in blocked" :key="c.id" class="s-list__item">
              <SAvatar :name="c.partner.displayName" />
              <div class="s-list__main">
                <span class="s-list__primary">{{ c.partner.displayName }}</span>
                <span class="s-list__secondary"
                  >@{{ c.partner.handle }} · cannot send you requests</span
                >
              </div>
              <SButton
                size="sm"
                variant="ghost"
                :loading="busyId === c.id"
                @click="act(c, 'unblock')"
              >
                Unblock
              </SButton>
            </li>
          </ul>
        </SCard>
      </div>
    </template>

    <SDialog
      :open="!!managing"
      :title="managing?.partner.displayName"
      :description="
        managing
          ? `@${managing.partner.handle} · partners since ${formatSince(managing.sinceMs)}`
          : ''
      "
      size="sm"
      :dismissible="!busyId"
      @update:open="(v) => !v && (managing = null)"
    >
      <p class="s-partners__note">
        Removing ends the partnership; either of you can ask again later. Blocking also stops them
        from sending you requests. They are not told either way.
      </p>
      <template #footer>
        <SButton
          variant="danger"
          :loading="busyId === `${managing?.id}:block`"
          :disabled="!!busyId"
          @click="managing && act(managing, 'block')"
        >
          Block
        </SButton>
        <SButton
          variant="secondary"
          :loading="busyId === `${managing?.id}:remove`"
          :disabled="!!busyId"
          @click="managing && act(managing, 'remove')"
        >
          Remove partner
        </SButton>
      </template>
    </SDialog>

    <SDialog v-model:open="showShare" title="Invite a partner" size="sm">
      <div class="s-partners__share">
        <img
          v-if="qrDataUrl"
          :src="qrDataUrl"
          alt="QR code for your partner invite link"
          class="s-partners__qr"
        />
        <p class="s-partners__note">
          They scan this or open the link while signed in to Storvv, then send you a request. Or
          tell them your handle: <strong>@{{ profile.handle }}</strong>
        </p>
        <div class="s-partners__link">
          <code>{{ inviteUrl }}</code>
          <SButton size="sm" variant="secondary" @click="copyToClipboard(inviteUrl, 'Invite link')">
            <template #leading><Copy :size="14" :stroke-width="2" aria-hidden="true" /></template>
            Copy
          </SButton>
        </div>
      </div>
    </SDialog>

    <SDialog
      v-model:open="showEdit"
      title="Edit trade profile"
      size="sm"
      :dismissible="!savingProfile"
    >
      <form id="trade-profile-form" class="s-form" @submit.prevent="saveProfile">
        <SInput
          v-model="handleDraft"
          label="Trade handle"
          autocomplete="off"
          hint="Your old handle stops working, and invite links you shared with it."
          :error="handleDraftProblem"
          required
        >
          <template #prefix>@</template>
        </SInput>
        <SInput v-model="nameDraft" label="Name shown to partners" autocomplete="organization" />
      </form>
      <template #footer>
        <SDialogActions
          primary-label="Save"
          :primary-loading="savingProfile"
          :primary-disabled="!canSaveHandle"
          @cancel="showEdit = false"
          @primary="saveProfile"
        />
      </template>
    </SDialog>

    <TradeLendDialog
      v-model:open="showLend"
      :partners="partners"
      :request="lendFor"
      :on-lend="api.lend"
      @lent="tab = 'loans'"
    />

    <CreateReceiptModal
      v-model="showSaleModal"
      :prefill="salePrefill"
      @receipt-created="onBillSaleCreated"
    />

    <SDialog
      :open="!!billLink"
      title="Bill sent"
      :description="
        billing ? `${billing.from.displayName} can pay it from their Partners page.` : ''
      "
      @update:open="(v) => !v && closeBill()"
    >
      <div class="s-partners__share">
        <p class="s-partners__note">
          You can also send them this payment link. It works for 48 hours and is shown only once.
        </p>
        <SInput :model-value="billLink" label="Payment link" readonly />
        <SButton size="sm" variant="secondary" @click="copyToClipboard(billLink, 'Payment link')">
          <template #leading><Copy :size="14" :stroke-width="1.75" aria-hidden="true" /></template>
          Copy link
        </SButton>
      </div>
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { BadgeCheck, ChevronRight, Copy, Handshake, Network, QrCode } from '@lucide/vue'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SDialog from '~/components/s/SDialog.vue'
import SDialogActions from '~/components/s/SDialogActions.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SInput from '~/components/s/SInput.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import STabs from '~/components/s/STabs.vue'
import CreateReceiptModal from '~/components/receipts/CreateReceiptModal.vue'
import TradeLendDialog from '~/components/trade/TradeLendDialog.vue'
import TradeLoansCard from '~/components/trade/TradeLoansCard.vue'
import TradeRequestsPanel from '~/components/trade/TradeRequestsPanel.vue'
import TradeSalesCard from '~/components/trade/TradeSalesCard.vue'
import { useAppToast } from '~/composables/useAppToast'
import { useCopy } from '~/composables/useCopy'
import { tradeErrorMessage, useTradePartners } from '~/composables/useTradePartners'
import type { ReceiptCreationPrefill } from '~/types/receipt-prefill'
import type {
  TradeAction,
  TradeConnectionView,
  TradeLookupResult,
  TradeRequestView,
} from '~/types/trade'
import { normalizeTradeHandle, tradeHandleProblem, tradeInvitePath } from '~/utils/trade-handle'

definePageMeta({
  layout: 'dashboard',
})

useHead({ title: 'Partners - Storvv' })

if (!useRuntimeConfig().public.trade) {
  await navigateTo('/dashboard', { replace: true })
}

const route = useRoute()
const toast = useAppToast()
const { copyToClipboard } = useCopy()
const {
  overview,
  loading,
  loaded,
  incoming,
  outgoing,
  partners,
  blocked,
  requests,
  sales,
  loans,
  load,
  ...api
} = useTradePartners()

const tab = ref<string>(
  route.query.tab === 'partners' || route.query.tab === 'loans' ? route.query.tab : 'requests'
)
const tabs = computed(() => {
  const waiting = requests.value.incoming.filter((r) => r.state === 'open' && !r.myReply).length
  const needsMe = loans.value.filter(
    (l) =>
      !l.settled &&
      (l.overdue || (l.direction === 'lent' && l.lines.some((x) => x.state === 'return_marked')))
  ).length
  return [
    ...(overview.value.canTrade
      ? [{ value: 'requests', label: 'Stock requests', ...(waiting ? { count: waiting } : {}) }]
      : []),
    { value: 'loans', label: 'Loans', ...(needsMe ? { count: needsMe } : {}) },
    {
      value: 'partners',
      label: 'Partners',
      ...(incoming.value.length ? { count: incoming.value.length } : {}),
    },
  ]
})

const profile = computed(() => overview.value.profile)
const loadError = ref('')

const handleDraft = ref('')
const nameDraft = ref('')
const savingProfile = ref(false)
const showEdit = ref(false)
const normalizedDraft = computed(() => normalizeTradeHandle(handleDraft.value))
const handleDraftProblem = computed(() =>
  handleDraft.value.trim() ? tradeHandleProblem(normalizedDraft.value) ?? '' : ''
)
const canSaveHandle = computed(() => !!normalizedDraft.value && !handleDraftProblem.value)

const findQuery = ref('')
const finding = ref(false)
const findError = ref('')
const found = ref<TradeLookupResult | null>(null)

const busyId = ref('')
const managing = ref<TradeConnectionView | null>(null)
const showShare = ref(false)
const qrDataUrl = ref('')

const inviteUrl = computed(() =>
  import.meta.client && profile.value.handle
    ? `${window.location.origin}${tradeInvitePath(profile.value.handle)}`
    : ''
)

const sinceFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
function formatSince(ms: number) {
  return ms ? sinceFormat.format(ms) : 'today'
}

function fillDrafts() {
  handleDraft.value = profile.value.handle || profile.value.suggestedHandle
  nameDraft.value = profile.value.displayName
}

async function reload() {
  loadError.value = ''
  try {
    await load()
    fillDrafts()
    if (!overview.value.canTrade && tab.value === 'requests') tab.value = 'loans'
    if (profile.value.handle) {
      await Promise.all([
        api.loadLoans(),
        ...(overview.value.canTrade ? [api.loadRequests(), api.loadSales()] : []),
      ])
    }
  } catch (e) {
    loadError.value = tradeErrorMessage(e, 'Check your connection and try again.')
  }
}

const canBill = computed(
  () => overview.value.sellBlocker === null || overview.value.sellBlocker === 'no_payout'
)
const billing = ref<TradeRequestView | null>(null)
const showSaleModal = ref(false)
const billLink = ref('')
const salePrefill = computed<ReceiptCreationPrefill | null>(() =>
  billing.value
    ? {
        customerName: billing.value.from.displayName,
        itemSearchQuery: billing.value.item,
        notes: `Partner sale to @${billing.value.from.handle}`,
        paymentSettlement: 'balance_due',
      }
    : null
)

function startBill(r: TradeRequestView) {
  if (overview.value.sellBlocker === 'no_payout') {
    toast.error('Connect your payout account under Payment links before billing partners.')
    return
  }
  billing.value = r
  showSaleModal.value = true
}

async function onBillSaleCreated(receipt: { id: string; status?: string }) {
  const r = billing.value
  if (!r) return
  if (receipt.status !== 'balance_due') {
    toast.error('That sale was recorded as paid, so it was not sent to your partner.')
    billing.value = null
    return
  }
  try {
    const { url } = await api.billPartner(r.id, receipt.id)
    billLink.value = url
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'The sale was saved but could not be sent to your partner'))
    billing.value = null
  }
}

const showLend = ref(false)
const lendFor = ref<TradeRequestView | null>(null)

function startLend(r: TradeRequestView | null) {
  lendFor.value = r
  showLend.value = true
}

function closeBill() {
  billLink.value = ''
  billing.value = null
}

function openEditProfile() {
  fillDrafts()
  showEdit.value = true
}

async function saveProfile() {
  if (!canSaveHandle.value || savingProfile.value) return
  savingProfile.value = true
  try {
    await api.saveProfile(normalizedDraft.value, nameDraft.value)
    showEdit.value = false
    toast.success(`Your handle is @${profile.value.handle}`)
    await findInviteFromLink()
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not save your handle'))
  } finally {
    savingProfile.value = false
  }
}

async function findPartner() {
  const handle = normalizeTradeHandle(findQuery.value)
  found.value = null
  findError.value = ''
  if (!handle) return
  finding.value = true
  try {
    found.value = await api.lookup(handle)
  } catch (e) {
    findError.value = tradeErrorMessage(e, 'Could not search right now')
  } finally {
    finding.value = false
  }
}

async function sendRequest(handle: string) {
  busyId.value = 'invite'
  try {
    const accepting = found.value?.relation === 'incoming'
    await api.invite(handle)
    found.value = found.value && { ...found.value, relation: accepting ? 'active' : 'outgoing' }
    toast.success(accepting ? 'You are now partners' : 'Request sent')
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'Could not send the request'))
  } finally {
    busyId.value = ''
  }
}

const DONE: Record<TradeAction, string> = {
  accept: 'You are now partners',
  decline: 'Request declined',
  cancel: 'Request cancelled',
  remove: 'Partner removed',
  block: 'Business blocked',
  unblock: 'Business unblocked',
}

async function act(c: TradeConnectionView, action: TradeAction) {
  busyId.value = managing.value ? `${c.id}:${action}` : c.id
  try {
    await api.respond(c.id, action)
    managing.value = null
    toast.success(DONE[action])
  } catch (e) {
    toast.error(tradeErrorMessage(e, 'That did not work. Refresh and try again.'))
  } finally {
    busyId.value = ''
  }
}

watch([showShare, inviteUrl], async ([open, url]) => {
  if (!open || !url) return
  try {
    qrDataUrl.value = await QRCode.toDataURL(url, {
      margin: 1,
      width: 224,
      color: { dark: '#1a1523', light: '#ffffff' },
    })
  } catch {
    qrDataUrl.value = ''
  }
})

/** An invite link (?connect=handle) fills in and looks up that business once we have a handle. */
async function findInviteFromLink() {
  const connect = normalizeTradeHandle(route.query.connect)
  if (!connect || found.value || !overview.value.canManage || !profile.value.handle) return
  tab.value = 'partners'
  findQuery.value = connect
  await findPartner()
}

watch(
  () => route.query.tab,
  (t) => {
    if (t === 'loans' || t === 'partners' || (t === 'requests' && overview.value.canTrade)) {
      tab.value = t
      if (t === 'loans') api.loadLoans().catch(() => undefined)
    }
  }
)

onMounted(async () => {
  await reload()
  await findInviteFromLink()
})
</script>
