import { onBeforeUnmount, onMounted, watch } from 'vue'
import { isDemoModeActive, clearDemoSession } from '~/utils/demo-mode'
import { demoEngagement, flushDemoActivity, trackDemoAction } from '~/utils/demo-tracker'
import { hasRequested, useWalkthrough } from '~/composables/useWalkthrough'
import type { DemoAction } from '~/utils/demo-insights'

const PROMPTED_KEY = 'storvv-demo-prompted'
const SIGNUP_TOAST_KEY = 'storvv-demo-signup-nudge-shown'

/** Real work in the demo that only lives in this browser. */
const SAVE_MOMENTS: readonly DemoAction[] = ['sale_created', 'item_added', 'store_created']

/** Never ask before they have had a proper look. */
const MIN_SECONDS_BEFORE_SAVE_PROMPT = 45
const MIN_SECONDS_BEFORE_EXIT_PROMPT = 60
const MIN_PAGES_BEFORE_EXIT_PROMPT = 3
const MIN_PAGES_FOR_SIGNUP_TOAST = 4

function sessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return true
  }
}

function setSessionFlag(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  } catch {
    /* ignore */
  }
}

function anyDialogOpen(): boolean {
  return Boolean(document.querySelector('.s-dialog-layer, [role="dialog"][aria-modal="true"]'))
}

/**
 * The demo's gentle prompts, at most one walkthrough prompt per visit:
 * - after real work (a sale, new stock): "Ready to use this for real?"
 * - when leaving after a proper look: "Before you go"
 * - otherwise, after a few pages: a quiet "Create a free account" toast
 * Nothing is asked of anyone who has already requested a walkthrough.
 */
export function useDemoConversionNudge(opts: { watchRoute?: boolean } = {}) {
  const { open } = useWalkthrough()
  const toast = useAppToast()
  const route = useRoute()
  let waitTimer: ReturnType<typeof setInterval> | null = null

  function canPrompt() {
    return import.meta.client && !hasRequested() && !sessionFlag(PROMPTED_KEY)
  }

  function promptWhenFree(variant: 'save' | 'exit') {
    if (!canPrompt()) return
    setSessionFlag(PROMPTED_KEY)
    // Let the sale or item dialog finish first; give up after a minute.
    let waited = 0
    if (waitTimer) clearInterval(waitTimer)
    waitTimer = setInterval(() => {
      waited += 1
      if (!anyDialogOpen()) {
        clearInterval(waitTimer!)
        waitTimer = null
        open(variant === 'save' ? 'demo_save' : 'demo_exit', variant)
      } else if (waited > 60) {
        clearInterval(waitTimer!)
        waitTimer = null
      }
    }, 1000)
  }

  function onAction(event: Event) {
    const name = (event as CustomEvent<DemoAction>).detail
    if (!SAVE_MOMENTS.includes(name)) return
    if (demoEngagement().seconds < MIN_SECONDS_BEFORE_SAVE_PROMPT) return
    promptWhenFree('save')
  }

  function maybeSignupToast() {
    if (!import.meta.client || !isDemoModeActive()) return
    if (hasRequested() || sessionFlag(SIGNUP_TOAST_KEY) || sessionFlag(PROMPTED_KEY)) return
    if (demoEngagement().pages < MIN_PAGES_FOR_SIGNUP_TOAST) return
    setSessionFlag(SIGNUP_TOAST_KEY)
    toast.info('Enjoying the demo? Create a free account to save your own store data.', {
      duration: 8000,
      action: {
        label: 'Sign up',
        onClick: () => {
          trackDemoAction('signup_click')
          void navigateTo('/signup')
        },
      },
    })
  }

  /** Exit demo: ask once if they had a proper look, otherwise just leave. */
  function requestExit() {
    const { seconds, pages } = demoEngagement()
    const engaged =
      seconds >= MIN_SECONDS_BEFORE_EXIT_PROMPT || pages >= MIN_PAGES_BEFORE_EXIT_PROMPT
    if (engaged && canPrompt()) {
      setSessionFlag(PROMPTED_KEY)
      open('demo_exit', 'exit')
      return
    }
    trackDemoAction('exit')
    flushDemoActivity()
    clearDemoSession()
    void navigateTo('/')
  }

  if (opts.watchRoute !== false) {
    onMounted(() => {
      window.addEventListener('storvv:demo-action', onAction)
      maybeSignupToast()
    })
    watch(
      () => route.path,
      () => setTimeout(maybeSignupToast, 0)
    )
    onBeforeUnmount(() => {
      window.removeEventListener('storvv:demo-action', onAction)
      if (waitTimer) clearInterval(waitTimer)
    })
  }

  return { requestExit, maybeShowNudge: maybeSignupToast }
}
