<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-primary-950/30 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" style="background-image: linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px); background-size: 48px 48px;"></div>
      <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary-400/25 dark:bg-primary-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-primary-300/20 dark:bg-primary-500/15 rounded-full blur-3xl"></div>
    </div>

    <div class="max-w-[360px] w-full relative z-10">
      <div class="text-center mb-6">
        <h1 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Dev access
        </h1>
        <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Enter the access code to continue.
        </p>
      </div>

      <div class="rounded-xl bg-white dark:bg-gray-800/90 shadow-xl shadow-gray-200/50 dark:shadow-none ring-1 ring-gray-200/60 dark:ring-gray-700/60 overflow-hidden">
        <div class="p-4 sm:p-5">
          <form class="space-y-4" @submit.prevent="submit">
            <div class="space-y-1.5">
              <label for="dev-code" class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Access code
              </label>
              <input
                id="dev-code"
                v-model="code"
                type="password"
                autocomplete="one-time-code"
                required
                class="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 border-0 ring-1 ring-gray-200/80 dark:ring-gray-600/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-xs focus:ring-2 focus:ring-primary-400/30 focus:ring-offset-0 outline-none transition-shadow"
                placeholder="••••"
              />
            </div>
            <p v-if="error" class="text-xs text-red-600 dark:text-red-400">
              {{ error }}
            </p>
            <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center py-2 px-4 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/50 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none transition-colors"
            >
              {{ loading ? 'Checking…' : 'Continue' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const config = useRuntimeConfig()
const route = useRoute()
const code = ref('')
const loading = ref(false)
const error = ref('')

const gateCookie = useCookie('storv_app_dev_gate', {
  path: '/',
  sameSite: 'lax',
  secure: import.meta.env.PROD,
})

onMounted(async () => {
  if (gateCookie.value !== '1') return
  const r = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
  await navigateTo(r || '/dashboard', { replace: true })
})

async function submit() {
  error.value = ''
  if (!config.public.appDevGate) {
    const r = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await navigateTo(r || '/dashboard', { replace: true })
    return
  }
  loading.value = true
  try {
    const expected = String(config.public.appDevAccessCode ?? '2209')
    if (code.value.trim() !== expected) {
      error.value = 'Invalid access code.'
      return
    }
    gateCookie.value = '1'
    const r = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await navigateTo(r || '/dashboard', { replace: true })
  } finally {
    loading.value = false
  }
}
</script>
