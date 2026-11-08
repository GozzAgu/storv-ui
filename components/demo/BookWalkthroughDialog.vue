<template>
  <SDialog
    v-model:open="state.open"
    :title="copy.title"
    :description="sent ? undefined : copy.description"
    size="md"
    :dismissible="!sending"
  >
    <div v-if="sent" class="s-walk__done" role="status">
      <span class="s-walk__done-icon" aria-hidden="true">
        <CheckCircle2 :size="28" :stroke-width="1.75" />
      </span>
      <p class="s-walk__done-title">Thanks, {{ firstName }}. We'll be in touch.</p>
      <p class="s-walk__done-text">
        Someone from Storvv will reach you {{ contactPhrase }} within one business day to set up a
        time that suits you.
      </p>
      <div v-if="bookingUrl || whatsappLink" class="s-walk__done-actions">
        <SButton
          v-if="bookingUrl"
          variant="primary"
          :to="bookingUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackDemoAction('calendar_click')"
        >
          <template #leading><CalendarDays :size="16" aria-hidden="true" /></template>
          Pick a time now
        </SButton>
        <SButton
          v-if="whatsappLink"
          variant="secondary"
          :to="whatsappLink"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackDemoAction('whatsapp_click')"
        >
          <template #leading><MessageCircle :size="16" aria-hidden="true" /></template>
          Chat on WhatsApp
        </SButton>
      </div>
    </div>

    <form v-else :id="formId" class="s-walk" novalidate @submit.prevent="submit">
      <ul v-if="state.variant !== 'exit'" class="s-walk__points">
        <li v-for="point in points" :key="point">
          <Check :size="14" :stroke-width="2.25" aria-hidden="true" />
          {{ point }}
        </li>
      </ul>

      <div class="s-walk__grid">
        <SInput
          v-model="form.name"
          label="Your name"
          autocomplete="name"
          required
          :error="errors.name"
        />
        <SInput
          v-model="form.business"
          label="Business name"
          autocomplete="organization"
          hint="Optional"
        />
        <SInput
          v-model="form.phone"
          label="WhatsApp or phone"
          type="tel"
          inputmode="tel"
          autocomplete="tel"
          placeholder="+234 803 000 0000"
          :error="errors.phone"
        />
        <SInput
          v-model="form.email"
          label="Email"
          type="email"
          inputmode="email"
          autocomplete="email"
          :error="errors.email"
        />
      </div>
      <p class="s-walk__either">Give us at least one way to reach you.</p>

      <template v-if="state.variant !== 'exit'">
        <div class="s-walk__grid">
          <SSelect
            v-model="form.branches"
            label="How many branches?"
            placeholder="Choose"
            :options="branchOptions"
          />
          <SInput
            v-model="form.sells"
            label="What do you sell?"
            placeholder="Phones, laptops, cars…"
            :maxlength="DEMO_LEAD_LIMITS.sells"
          />
        </div>

        <fieldset v-if="form.phone && form.email" class="s-walk__contact">
          <legend>Best way to reach you</legend>
          <div class="s-walk__segmented" role="radiogroup">
            <label v-for="option in contactOptions" :key="option.value">
              <input v-model="form.preferredContact" type="radio" :value="option.value" />
              <span>{{ option.label }}</span>
            </label>
          </div>
        </fieldset>

        <STextarea
          v-model="form.message"
          label="Anything we should know?"
          hint="Optional"
          :rows="2"
          :maxlength="DEMO_LEAD_LIMITS.message"
        />
      </template>

      <!-- Left empty by people; bots fill it in. -->
      <div class="s-walk__trap" aria-hidden="true">
        <label>Website <input v-model="form.website" tabindex="-1" autocomplete="off" /></label>
      </div>

      <p v-if="errors.form" class="s-walk__error" role="alert">{{ errors.form }}</p>
      <p class="s-walk__privacy">
        We only use these details to arrange your walkthrough. See our
        <NuxtLink to="/privacy" target="_blank">privacy policy</NuxtLink>.
      </p>
    </form>

    <template #footer>
      <template v-if="sent">
        <SButton :variant="state.variant === 'exit' ? 'primary' : 'secondary'" @click="close">
          {{ state.variant === 'exit' ? 'Exit demo' : 'Done' }}
        </SButton>
      </template>
      <template v-else>
        <SButton :disabled="sending" @click="dismiss">{{ copy.cancel }}</SButton>
        <SButton variant="primary" type="submit" :form="formId" :loading="sending">
          {{ copy.submit }}
        </SButton>
      </template>
    </template>
  </SDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, useId, watch } from 'vue'
import { CalendarDays, Check, CheckCircle2, MessageCircle } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import SDialog from '~/components/s/SDialog.vue'
import SInput from '~/components/s/SInput.vue'
import SSelect from '~/components/s/SSelect.vue'
import STextarea from '~/components/s/STextarea.vue'
import { markRequested, useWalkthrough } from '~/composables/useWalkthrough'
import { clearDemoSession } from '~/utils/demo-mode'
import { flushDemoActivity, getDemoInsightIds, trackDemoAction } from '~/utils/demo-tracker'
import {
  DEMO_LEAD_LIMITS,
  validateDemoLead,
  type DemoLeadContact,
  type DemoLeadInput,
} from '~/utils/demo-insights'

const { state, bookingUrl, whatsappUrl } = useWalkthrough()

const formId = useId()
const sending = ref(false)
const sent = ref(false)

const emptyForm = () => ({
  name: '',
  business: '',
  phone: '',
  email: '',
  branches: '' as string,
  sells: '',
  message: '',
  preferredContact: 'whatsapp' as DemoLeadContact,
  website: '',
})
const form = reactive(emptyForm())
const errors = reactive<{ name?: string; phone?: string; email?: string; form?: string }>({})

const COPY = {
  book: {
    title: 'Book a walkthrough',
    description:
      'A free 20-minute call where someone from Storvv shows you around and helps set up your store.',
    submit: 'Request walkthrough',
    cancel: 'Cancel',
  },
  exit: {
    title: 'Before you go',
    description:
      'Want us to set Storvv up with your real stock and branches? Leave your details and we’ll walk you through it, free.',
    submit: 'Yes, contact me',
    cancel: 'No thanks, exit',
  },
  save: {
    title: 'Ready to use this for real?',
    description:
      'What you just did is saved only in this browser. We can set up your real store with you, import your stock, and get your team selling.',
    submit: 'Set it up with me',
    cancel: 'Keep exploring',
  },
} as const

const copy = computed(() => COPY[state.value.variant])

const points = [
  'See Storvv with your own products and branches',
  'Get help importing your stock',
  'No cost, no commitment',
]

const branchOptions = [
  { label: '1 branch', value: '1' },
  { label: '2–3 branches', value: '2-3' },
  { label: '4–10 branches', value: '4-10' },
  { label: 'More than 10', value: '10+' },
]

const contactOptions: Array<{ label: string; value: DemoLeadContact }> = [
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Call', value: 'call' },
  { label: 'Email', value: 'email' },
]

const firstName = computed(() => form.name.trim().split(/\s+/)[0] || 'there')
const contactPhrase = computed(() => {
  const preferred =
    form.phone && form.email ? form.preferredContact : form.phone ? 'whatsapp' : 'email'
  return preferred === 'email' ? 'by email' : preferred === 'call' ? 'by phone' : 'on WhatsApp'
})
const whatsappLink = computed(() =>
  whatsappUrl(
    `Hi Storvv, I'm ${form.name.trim() || 'interested'}${
      form.business.trim() ? ` from ${form.business.trim()}` : ''
    }. I just requested a walkthrough.`
  )
)

// Each opening starts clean, unless they were halfway through typing.
watch(
  () => state.value.open,
  (open) => {
    if (!open) return
    if (sent.value) {
      sent.value = false
      Object.assign(form, emptyForm())
    }
    Object.assign(errors, { name: undefined, phone: undefined, email: undefined, form: undefined })
  }
)

async function submit() {
  if (sending.value) return
  Object.assign(errors, { name: undefined, phone: undefined, email: undefined, form: undefined })

  const ids = getDemoInsightIds()
  const payload = {
    ...form,
    source: state.value.source,
    visitorId: ids?.visitorId ?? null,
    sessionId: ids?.sessionId ?? null,
  }
  const check = validateDemoLead(payload)
  if (!check.ok) {
    const field = check.field as keyof DemoLeadInput | undefined
    if (field === 'name' || field === 'phone' || field === 'email') errors[field] = check.message
    else errors.form = check.message
    return
  }

  sending.value = true
  try {
    // Send activity first so the request can be matched to what they did.
    flushDemoActivity()
    await $fetch('/api/demo/leads', { method: 'POST', body: payload })
    markRequested()
    sent.value = true
  } catch (err) {
    const data = (err as { data?: { message?: string; data?: { field?: string } } })?.data
    const field = data?.data?.field
    const message = data?.message || 'We couldn’t send that. Please try again in a moment.'
    if (field === 'name' || field === 'phone' || field === 'email') errors[field] = message
    else
      errors.form =
        (err as { statusCode?: number })?.statusCode === 429
          ? 'Too many requests from this connection. Please try again in a few minutes.'
          : message
  } finally {
    sending.value = false
  }
}

function exitDemo() {
  trackDemoAction('exit')
  flushDemoActivity()
  clearDemoSession()
  void navigateTo('/')
}

/** Cancel: on the exit prompt this still leaves the demo, as they asked. */
function dismiss() {
  const variant = state.value.variant
  state.value.open = false
  if (variant === 'book') return
  trackDemoAction('prompt_dismissed')
  if (variant === 'exit') exitDemo()
}

function close() {
  const variant = state.value.variant
  state.value.open = false
  if (variant === 'exit') exitDemo()
}
</script>

<style scoped>
.s-walk {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-2);
}

.s-walk__points {
  display: flex;
  flex-direction: column;
  gap: var(--s-space-half);
  margin: 0;
  padding: var(--s-space-1-5) var(--s-space-2);
  border-radius: var(--s-radius-lg, var(--s-radius));
  background: var(--s-surface-2);
  list-style: none;
  font: var(--s-text-small);
  color: var(--s-text);
}

.s-walk__points li {
  display: flex;
  align-items: center;
  gap: var(--s-space-1);
}

.s-walk__points svg {
  flex: none;
  color: var(--s-success, var(--s-accent));
}

.s-walk__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-space-1-5) var(--s-space-2);
}

@media (max-width: 560px) {
  .s-walk__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.s-walk__either {
  margin: calc(var(--s-space-1) * -1) 0 0;
  color: var(--s-text-muted);
  font: var(--s-text-small);
}

.s-walk__contact {
  margin: 0;
  padding: 0;
  border: 0;
}

.s-walk__contact legend {
  margin-bottom: var(--s-space-half);
  color: var(--s-text);
  font: var(--s-text-small);
  font-weight: 500;
}

.s-walk__segmented {
  display: inline-flex;
  padding: 2px;
  border-radius: var(--s-radius);
  background: var(--s-surface-2);
}

.s-walk__segmented label {
  position: relative;
  cursor: pointer;
}

.s-walk__segmented input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.s-walk__segmented span {
  display: block;
  padding: 0.3rem 0.85rem;
  border-radius: calc(var(--s-radius) - 2px);
  color: var(--s-text-muted);
  font: var(--s-text-small);
  font-weight: 500;
}

.s-walk__segmented input:checked + span {
  background: var(--s-surface);
  color: var(--s-text);
  box-shadow: var(--s-shadow-sm, 0 1px 2px rgb(0 0 0 / 0.08));
}

.s-walk__segmented input:focus-visible + span {
  outline: 2px solid var(--s-focus, var(--s-accent));
  outline-offset: 1px;
}

.s-walk__trap {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.s-walk__error {
  margin: 0;
  color: var(--s-error, #c0392b);
  font: var(--s-text-small);
}

.s-walk__privacy {
  margin: 0;
  color: var(--s-text-muted);
  font: var(--s-text-small);
}

.s-walk__privacy a {
  color: inherit;
  text-decoration: underline;
}

.s-walk__done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--s-space-1);
  padding: var(--s-space-2) 0;
  text-align: center;
}

.s-walk__done-icon {
  color: var(--s-success, var(--s-accent));
}

.s-walk__done-title {
  margin: 0;
  color: var(--s-text);
  font: var(--s-text-body);
  font-weight: 600;
}

.s-walk__done-text {
  max-width: 34ch;
  margin: 0;
  color: var(--s-text-muted);
  font: var(--s-text-small);
}

.s-walk__done-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--s-space-1);
  margin-top: var(--s-space-1);
}
</style>
