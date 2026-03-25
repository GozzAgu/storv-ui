// https://nuxt.com/docs/api/configuration/nuxt-config
import { isValidInviteHashList } from './utils/inviteGateConfig'

const inviteAccessCode = (process.env.INVITE_ACCESS_CODE || '').trim()
const inviteAccessSha256Raw = (process.env.NUXT_PUBLIC_INVITE_ACCESS_SHA256 || '').trim()

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  // Optimize CSS loading to prevent FOUC
  experimental: {
    payloadExtraction: false,
  },
  // For Capacitor: Generate static site
  ssr: false,
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true
    }
  },
  vite: {
    css: {
      devSourcemap: false,
    },
  },
  runtimeConfig: {
    /**
     * Server-side invite codes for `nuxt build` / deployments with a Nitro server (`POST /api/access/verify`).
     * For static `nuxt generate` hosting, use NUXT_PUBLIC_INVITE_ACCESS_SHA256 instead.
     */
    inviteAccessCode,
    // Private keys (only available on server-side)
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
    // Plan amounts in kobo (NGN) - override via env: PAYSTACK_PLAN_MICRO_AMOUNT, etc.
    paystackPlanMicroAmount: parseInt(process.env.PAYSTACK_PLAN_MICRO_AMOUNT || '0', 10),
    paystackPlanMediumAmount: parseInt(process.env.PAYSTACK_PLAN_MEDIUM_AMOUNT || '0', 10),
    paystackPlanEnterpriseAmount: parseInt(process.env.PAYSTACK_PLAN_ENTERPRISE_AMOUNT || '0', 10),
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
    firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
    // Public keys (exposed to client-side)
    public: {
      /** True when invite verification is configured at build time (server codes and/or public SHA-256 list). */
      inviteGateEnabled: inviteAccessCode.length > 0 || isValidInviteHashList(inviteAccessSha256Raw),
      /**
       * Comma-separated SHA-256 hex digests of allowed codes. Generate e.g.
       * `printf '%s' 'yourcode' | shasum -a 256` (use the same normalization as the UI: lowercase a-z, 0-9).
       */
      inviteAccessSha256: inviteAccessSha256Raw,
      /** Marketing site for “Get in touch” link on the access page */
      marketingSiteOrigin: (process.env.NUXT_PUBLIC_MARKETING_SITE_ORIGIN || 'https://www.storvv.com').replace(
        /\/$/,
        ''
      ),
      appVersion: '1.0',
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
        measurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
      }
    }
  },
  // Ensure proper base path for Capacitor
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/4.png'
        },
        {
          rel: 'apple-touch-icon',
          href: '/4.png'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
          media: 'print',
          onload: 'this.media="all"'
        }
      ]
    }
  }
})
