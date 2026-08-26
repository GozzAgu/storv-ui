// https://nuxt.com/docs/api/configuration/nuxt-config
import { CAPACITOR_SHELL_INLINE_SCRIPT } from './utils/capacitor-shell-inline'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV === 'development' },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  ui: {
    fonts: false,
  },
  css: ['~/assets/css/main.css'],
  // Optimize CSS loading to prevent FOUC
  experimental: {
    payloadExtraction: false,
    // Avoid dev-time fetch to /_nuxt/builds/meta/dev.json (breaks E2E and static shells).
    appManifest: false,
  },
  // For Capacitor: Generate static site
  ssr: false,
  nitro: {
    // On Vercel, force the serverless output so `/api/*` is a real function (not SPA fallback).
    ...(process.env.VERCEL ? { preset: 'vercel' as const } : {}),
    prerender: {
      routes: ['/'],
      crawlLinks: true,
    },
  },
  vite: {
    css: {
      devSourcemap: false,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('firebase')) return 'vendor-firebase'
            if (id.includes('apexcharts') || id.includes('vue3-apexcharts')) return 'vendor-charts'
            if (id.includes('/xlsx/') || id.includes('xlsx')) return 'vendor-xlsx'
            if (id.includes('jspdf')) return 'vendor-jspdf'
            if (id.includes('html5-qrcode')) return 'vendor-scanner'
            if (id.includes('html2canvas')) return 'vendor-html2canvas'
            if (id.includes('@nuxt/ui') || id.includes('@headlessui')) return 'vendor-ui'
          },
        },
      },
    },
  },
  runtimeConfig: {
    // Private keys (only available on server-side)
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
    // Plan amounts in kobo (NGN) - monthly base; optional Quarterly/Yearly overrides via env.
    paystackPlanMicroAmount: parseInt(process.env.PAYSTACK_PLAN_MICRO_AMOUNT || '0', 10),
    paystackPlanMediumAmount: parseInt(process.env.PAYSTACK_PLAN_MEDIUM_AMOUNT || '0', 10),
    paystackPlanEnterpriseAmount: parseInt(process.env.PAYSTACK_PLAN_ENTERPRISE_AMOUNT || '0', 10),
    paystackPlanMediumAmountQuarterly: parseInt(
      process.env.PAYSTACK_PLAN_MEDIUM_AMOUNT_QUARTERLY || '0',
      10
    ),
    paystackPlanEnterpriseAmountQuarterly: parseInt(
      process.env.PAYSTACK_PLAN_ENTERPRISE_AMOUNT_QUARTERLY || '0',
      10
    ),
    paystackPlanMediumAmountYearly: parseInt(
      process.env.PAYSTACK_PLAN_MEDIUM_AMOUNT_YEARLY || '0',
      10
    ),
    paystackPlanEnterpriseAmountYearly: parseInt(
      process.env.PAYSTACK_PLAN_ENTERPRISE_AMOUNT_YEARLY || '0',
      10
    ),
    // Platform fee (%) retained by Storvv on each payment-link sale (Paystack subaccount percentage_charge).
    paymentLinkPlatformFeePercent: parseFloat(process.env.PAYMENT_LINK_PLATFORM_FEE_PERCENT || '0'),
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
    firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'receipts@storvv.com',
    whatsappCloudAccessToken: process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || '',
    whatsappCloudPhoneNumberId: process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || '',
    whatsappCloudApiVersion: process.env.WHATSAPP_CLOUD_API_VERSION || 'v21.0',
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    // Public keys (exposed to client-side)
    public: {
      /** Initial hint only; client refreshes via /api/assistant/status */
      assistantConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.NUXT_GEMINI_API_KEY),
      appVersion: '0.1',
      /** Comma-separated extra hostnames treated like www (marketing-only), e.g. preview domains */
      marketingHosts: (process.env.NUXT_PUBLIC_MARKETING_HOSTS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      /** App subdomain hostname(s); default app.storvv.com */
      appHost: process.env.NUXT_PUBLIC_APP_HOST || 'app.storvv.com',
      /** Origin used when sending users from www → app (no trailing slash) */
      appOrigin: process.env.NUXT_PUBLIC_APP_ORIGIN || 'https://app.storvv.com',
      paystackPublicKey: process.env.NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      /** Optional: base URL for a separate API server when using a static frontend. Staff creation is client-side and does not require a server. */
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
      firebase: {
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
      },
      /** Unsigned uploads: create an upload preset (e.g. storvv-logos) set to "Unsigned" in Cloudinary. */
      cloudinaryCloudName:
        process.env.NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
      cloudinaryUploadPreset:
        process.env.NUXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
        process.env.CLOUDINARY_UPLOAD_PRESET ||
        '',
    },
  },
  // Ensure proper base path for Capacitor
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      meta: [
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=overlays-content',
        },
      ],
      script: [
        {
          key: 'capacitor-native-mark',
          innerHTML: CAPACITOR_SHELL_INLINE_SCRIPT,
          tagPosition: 'head',
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/storvv%20logo%20mobile.png',
        },
        {
          rel: 'apple-touch-icon',
          href: '/storvv%20logo%20mobile.png',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Pixelify+Sans:wght@400;600&display=swap',
          media: 'print',
          onload: 'this.media="all"',
        },
      ],
    },
  },
  hooks: {
    'pages:extend'(pages) {
      const mirrored: typeof pages = []
      for (const page of pages) {
        if (page.path?.startsWith('/dashboard')) {
          mirrored.push({
            ...page,
            name: page.name ? `demo-${String(page.name)}` : undefined,
            path: page.path.replace(/^\/dashboard/, '/demo/dashboard'),
          })
        }
      }
      pages.push(...mirrored)
    },
  },
})
