/**
 * Capture marketing screenshots from the interactive demo (no auth).
 * Captures the visible app shell (sidebar, top nav, and main pane) without full-page scroll.
 *
 * Usage:
 *   npm run build && npm run marketing:screenshots
 * Or with a running server:
 *   MARKETING_SCREENSHOT_BASE_URL=http://localhost:3001 node scripts/capture-marketing-screenshots.mjs
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public/marketing/screenshots')

const MAIN_SELECTOR = 'main[data-dashboard-main]'
const DEMO_STORE_ID = 'demo_store_lagos'

/** @type {import('playwright').Page} */
async function waitForPageTitle(main, title) {
  await main.locator('h1').filter({ hasText: title }).first().waitFor({ timeout: 60_000 })
}

/** @type {import('playwright').Page} */
async function waitForCaptureReady(page, slug) {
  const main = page.locator(MAIN_SELECTOR).first()
  await main.waitFor({ timeout: 60_000 })

  switch (slug) {
    case 'dashboard':
      await main.getByText('Welcome back').first().waitFor({ timeout: 60_000 })
      return
    case 'inventory':
      await waitForPageTitle(main, 'Categories')
      return
    case 'buybacks':
      await waitForPageTitle(main, 'Customer buybacks')
      return
    case 'seller-loans':
      await waitForPageTitle(main, 'Stock loans')
      return
    case 'receipts':
      await main.getByRole('tab', { name: 'Receipts', exact: true }).waitFor({ timeout: 60_000 })
      return
    case 'receipts-outstanding':
      await main.getByRole('tab', { name: /Outstanding/i }).waitFor({ timeout: 60_000 })
      return
    case 'receipts-customers':
      await main.getByRole('tab', { name: 'Customers', exact: true }).waitFor({ timeout: 60_000 })
      return
    case 'payment-links':
      await waitForPageTitle(main, 'Payment links')
      return
    case 'departments':
      await main.locator('h1').filter({ hasText: /Departments in/i }).first().waitFor({ timeout: 60_000 })
      return
    case 'analytics':
      await main.locator('h1').filter({ hasText: /Analytics/i }).first().waitFor({ timeout: 60_000 })
      return
    case 'activity':
      await waitForPageTitle(main, 'Activity Logs')
      return
    case 'multi-store-sync':
      await waitForPageTitle(main, 'Multi-Store Sync')
      return
    case 'help':
      await waitForPageTitle(main, 'Help center')
      return
    case 'settings':
      await waitForPageTitle(main, 'Settings')
      return
    case 'profile':
      await waitForPageTitle(main, 'Profile')
      return
    default:
      throw new Error(`Unknown marketing screenshot slug: ${slug}`)
  }
}

async function injectCaptureStyles(page) {
  await page.addStyleTag({
    content: `
      main[data-dashboard-main] [role="status"] { display: none !important; }
    `,
  })
}

async function captureVisibleAppShell(page, outPath) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)

  const clip = await page.evaluate(() => ({
    x: 0,
    y: 0,
    width: Math.round(window.innerWidth),
    height: Math.round(window.innerHeight),
  }))

  await page.screenshot({
    path: outPath,
    type: 'png',
    clip,
  })

  return clip
}

const CAPTURES = [
  { slug: 'dashboard', path: '/demo/dashboard' },
  { slug: 'inventory', path: '/demo/dashboard/inventory' },
  { slug: 'buybacks', path: '/demo/dashboard/buybacks' },
  { slug: 'seller-loans', path: '/demo/dashboard/seller-loans' },
  { slug: 'receipts', path: '/demo/dashboard/receipts' },
  { slug: 'receipts-outstanding', path: '/demo/dashboard/receipts?tab=outstanding' },
  { slug: 'receipts-customers', path: '/demo/dashboard/receipts?tab=customers' },
  { slug: 'payment-links', path: '/demo/dashboard/payment-links' },
  {
    slug: 'departments',
    path: `/demo/dashboard/stores/${DEMO_STORE_ID}/departments`,
  },
  { slug: 'analytics', path: '/demo/dashboard/analytics' },
  { slug: 'activity', path: '/demo/dashboard/activity' },
  { slug: 'multi-store-sync', path: '/demo/dashboard/multi-store-sync' },
  { slug: 'help', path: '/demo/dashboard/help' },
  { slug: 'settings', path: '/demo/dashboard/settings' },
  { slug: 'profile', path: '/demo/dashboard/profile' },
]

async function waitForServer(baseUrl, maxMs = 120_000) {
  const started = Date.now()
  while (Date.now() - started < maxMs) {
    try {
      const res = await fetch(baseUrl, { redirect: 'follow' })
      if (res.ok || res.status === 404) return
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server not ready at ${baseUrl}`)
}

function startPreview(port) {
  return spawn('npx', ['nuxt', 'preview', '--port', String(port)], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })
}

async function main() {
  const port = Number(process.env.MARKETING_SCREENSHOT_PORT || 3002)
  const baseUrl = (process.env.MARKETING_SCREENSHOT_BASE_URL || `http://127.0.0.1:${port}`).replace(
    /\/$/,
    ''
  )

  let previewProc = null
  const ownsServer = !process.env.MARKETING_SCREENSHOT_BASE_URL

  if (ownsServer) {
    console.log(`Starting preview on ${baseUrl}…`)
    previewProc = startPreview(port)
    previewProc.stdout?.on('data', (chunk) => process.stdout.write(chunk))
    previewProc.stderr?.on('data', (chunk) => process.stderr.write(chunk))
    await waitForServer(baseUrl)
  }

  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  })

  await context.addInitScript(() => {
    localStorage.setItem('sidebarCollapsed', 'false')
  })

  const page = await context.newPage()

  for (const capture of CAPTURES) {
    const url = `${baseUrl}${capture.path}`
    console.log(`Capturing ${capture.slug} → ${url}`)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 })
    await waitForCaptureReady(page, capture.slug)
    await injectCaptureStyles(page)
    await page.waitForTimeout(800)

    const clip = await captureVisibleAppShell(page, path.join(outDir, `${capture.slug}.png`))
    console.log(
      `  ✓ public/marketing/screenshots/${capture.slug}.png (${clip.width}×${clip.height} visible shell)`
    )
  }

  await browser.close()
  if (previewProc) {
    previewProc.kill('SIGTERM')
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
