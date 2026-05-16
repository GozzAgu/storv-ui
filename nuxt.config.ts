// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@pinia/nuxt'],
  ui: {
    fonts: false,
  },
  css: ['~/assets/css/main.css'],
  // Optimize CSS loading to prevent FOUC
  experimental: {
    payloadExtraction: false,
  },
  // For Capacitor: Generate static site
  ssr: false,
  nitro: {
    // On Vercel, force the serverless output so `/api/*` is a real function (not SPA fallback).
    ...(process.env.VERCEL ? { preset: 'vercel' as const } : {}),
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
    // Private keys (only available on server-side)
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
    // Plan amounts in kobo (NGN) - override via env: PAYSTACK_PLAN_MICRO_AMOUNT, etc.
    paystackPlanMicroAmount: parseInt(process.env.PAYSTACK_PLAN_MICRO_AMOUNT || '0', 10),
    paystackPlanMediumAmount: parseInt(process.env.PAYSTACK_PLAN_MEDIUM_AMOUNT || '0', 10),
    paystackPlanEnterpriseAmount: parseInt(process.env.PAYSTACK_PLAN_ENTERPRISE_AMOUNT || '0', 10),
    firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
    firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'receipts@storvv.com',
    whatsappCloudAccessToken: process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || '',
    whatsappCloudPhoneNumberId: process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || '',
    whatsappCloudApiVersion: process.env.WHATSAPP_CLOUD_API_VERSION || 'v21.0',
    // Public keys (exposed to client-side)
    public: {
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
        measurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
      },
      /** Unsigned uploads: create an upload preset (e.g. storvv-logos) set to "Unsigned" in Cloudinary. */
      cloudinaryCloudName:
        process.env.NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
      cloudinaryUploadPreset:
        process.env.NUXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || ''
    }
  },
  // Ensure proper base path for Capacitor
  app: {
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover',
        },
      ],
      script: [
        {
          key: 'capacitor-native-mark',
          innerHTML: `(function(){try{var l=location,p=l.protocol,h=l.hostname,port=l.port||'',href=l.href||'',path=l.pathname||'/';var cap=p==='capacitor:'||href.indexOf('capacitor://')===0||(h==='localhost'&&p==='https:'&&(!port||port==='443'));if(cap){var el=document.documentElement;el.classList.add('capacitor-native','styles-loaded');el.style.removeProperty('display');document.body&&document.body.style.removeProperty('display');if(path==='/'||path==='/index.html'){location.replace('/signin');}}}catch(e){}})();`,
          tagPosition: 'head',
        },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/storvv%20logo%20mobile.png'
        },
        {
          rel: 'apple-touch-icon',
          href: '/storvv%20logo%20mobile.png'
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
