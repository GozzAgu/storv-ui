<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/30 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style="background-image: linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px); background-size: 48px 48px;"></div>
      <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary-400/25 dark:bg-primary-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-300/20 dark:bg-primary-500/15 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-[400px] w-full relative z-10">
      <div class="rounded-2xl bg-white dark:bg-gray-800/90 shadow-xl shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-200/60 dark:ring-gray-700/60 overflow-hidden">
        <div class="p-6 sm:p-8">
          <div class="text-center mb-6">
            <NuxtLink
              :to="marketingHomeUrl"
              class="inline-block mb-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 rounded-xl"
              external
              target="_blank"
            >
              <img
                src="/storvv logo 2.png"
                alt="Storvv"
                class="h-6 w-auto max-w-[120px] mx-auto object-contain"
              />
            </NuxtLink>

            <div
              class="rounded-xl bg-gray-50 dark:bg-gray-900/50 ring-1 ring-gray-200/80 dark:ring-gray-700/60 px-4 py-3 text-left"
            >
              <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Storvv is available by invitation while we&apos;re in development. Enter the access code you received to continue.
              </p>
            </div>
          </div>

          <p class="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
            Enter your access code
          </p>

          <form @submit.prevent="handleContinue" class="space-y-5">
            <div class="flex gap-2 sm:gap-2.5 justify-center" role="group" aria-label="Access code">
              <input
                v-for="i in 6"
                :key="i - 1"
                :ref="(el) => setBoxRef(i - 1, el)"
                :value="digits[i - 1] ? digits[i - 1].toUpperCase() : ''"
                type="text"
                inputmode="text"
                autocomplete="one-time-code"
                maxlength="1"
                autocapitalize="characters"
                :aria-label="`Digit ${i}`"
                class="w-10 h-11 sm:w-11 sm:h-12 text-center text-base font-semibold uppercase rounded-xl bg-gray-50 dark:bg-gray-900/60 border-0 ring-1 ring-gray-200/90 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-400/40 focus:ring-offset-0 outline-none transition-shadow caret-primary-600"
                @input="onBoxInput(i - 1, $event)"
                @keydown="onBoxKeydown(i - 1, $event)"
                @paste="onPaste"
              />
            </div>

            <div
              v-if="errorMessage"
              class="rounded-lg bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200/80 dark:ring-red-800/50 px-3 py-2.5"
            >
              <p class="text-xs text-red-700 dark:text-red-200">{{ errorMessage }}</p>
            </div>

            <Button
              type="submit"
              :disabled="isLoading || !isComplete"
              :loading="isLoading"
              variant="primary"
              size="md"
              extra-class="!w-full !rounded-2xl !py-3 text-sm font-semibold"
            >
              Continue
            </Button>
          </form>

          <p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            Think you should have access?
            <NuxtLink
              :to="contactUrl"
              class="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
              external
              target="_blank"
            >
              Get in touch
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import Button from '~/components/ui/Button.vue'
import { isValidInviteHashList, verifyInviteCodeAgainstHashes } from '~/utils/inviteGateConfig'

definePageMeta({
  layout: false,
})

useForceLightPage()

const config = useRuntimeConfig()
const route = useRoute()
const { grantAccess, hasInviteAccess, syncFromStorage } = useInviteAccess()

const marketingHomeUrl = computed(() => `${config.public.marketingSiteOrigin}/`)
const contactUrl = computed(() => `${config.public.marketingSiteOrigin}/#contact`)

function safeRedirect(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard'
  }
  return raw
}

const digits = ref<string[]>(['', '', '', '', '', ''])
const boxRefs = ref<(HTMLInputElement | null)[]>([])

function setBoxRef(i: number, el: Element | ComponentPublicInstance | null) {
  if (!el) {
    boxRefs.value[i] = null
    return
  }
  boxRefs.value[i] = el as HTMLInputElement
}

const codeNormalized = computed(() =>
  digits.value.join('').toLowerCase().replace(/[^a-z0-9]/g, '')
)

const isComplete = computed(() => codeNormalized.value.length === 6)

function focusBox(i: number) {
  nextTick(() => {
    boxRefs.value[i]?.focus()
    boxRefs.value[i]?.select?.()
  })
}

function onBoxInput(index: number, event: Event) {
  const t = event.target as HTMLInputElement
  const v = t.value
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-1)
    .toLowerCase()
  digits.value[index] = v
  t.value = v ? v.toUpperCase() : ''
  errorMessage.value = ''
  if (v && index < 5) {
    focusBox(index + 1)
  }
}

function onBoxKeydown(index: number, e: KeyboardEvent) {
  if (e.key === 'Backspace') {
    if (!digits.value[index] && index > 0) {
      e.preventDefault()
      digits.value[index - 1] = ''
      const prev = boxRefs.value[index - 1]
      if (prev) prev.value = ''
      focusBox(index - 1)
    }
  }
  if (e.key === 'ArrowLeft' && index > 0) {
    e.preventDefault()
    focusBox(index - 1)
  }
  if (e.key === 'ArrowRight' && index < 5) {
    e.preventDefault()
    focusBox(index + 1)
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = (e.clipboardData?.getData('text') || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 6)
  errorMessage.value = ''
  const next = ['', '', '', '', '', '']
  for (let i = 0; i < text.length; i++) {
    next[i] = text[i]!
  }
  digits.value = next
  for (let i = 0; i < 6; i++) {
    const el = boxRefs.value[i]
    if (el) el.value = next[i] ? next[i]!.toUpperCase() : ''
  }
  focusBox(Math.min(text.length, 5))
}

const isLoading = ref(false)
const errorMessage = ref('')

async function handleContinue() {
  if (!isComplete.value) {
    errorMessage.value = 'Enter the full 6-character code.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    if (isValidInviteHashList(config.public.inviteAccessSha256 as string)) {
      const ok = await verifyInviteCodeAgainstHashes(
        codeNormalized.value,
        config.public.inviteAccessSha256 as string
      )
      if (!ok) {
        errorMessage.value = 'Invalid access code. Please try again.'
        return
      }
    } else {
      await $fetch('/api/access/verify', {
        method: 'POST',
        body: { code: codeNormalized.value },
      })
    }
    grantAccess()
    await navigateTo(safeRedirect(route.query.redirect))
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    errorMessage.value =
      (typeof e.data?.message === 'string' && e.data.message) ||
      (typeof e.message === 'string' && e.message) ||
      'Invalid access code. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  syncFromStorage()
  if (!config.public.inviteGateEnabled) {
    navigateTo(safeRedirect(route.query.redirect))
    return
  }
  if (hasInviteAccess.value) {
    navigateTo(safeRedirect(route.query.redirect))
    return
  }
  focusBox(0)
})

useHead({
  title: 'Access — Storvv',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>
