<template>
 <div class="landing-page min-h-screen bg-[#fafafa] text-gray-900 antialiased">
 <header
 class="landing-header"
 :class="{ 'landing-header--menu-open': mobileMenuOpen }"
 >
 <div class="landing-header__inner">
 <NuxtLink to="/" class="landing-header__logo" @click="mobileMenuOpen = false">
 <img :src="marketingLogoSrc" alt="Storvv" width="120" height="32" />
 </NuxtLink>

 <div class="landing-header__desktop">
 <nav class="landing-header__links" aria-label="Primary">
 <a href="#features" class="landing-nav-link" @click.prevent="scrollToSection('features')">Features</a>
 <a href="#proof" class="landing-nav-link" @click.prevent="scrollToSection('proof')">Outcomes</a>
 <NuxtLink to="/demo/dashboard" class="landing-nav-link">Try demo</NuxtLink>
 <a href="#how-it-works" class="landing-nav-link" @click.prevent="scrollToSection('how-it-works')">How it works</a>
 <a href="#pricing" class="landing-nav-link" @click.prevent="scrollToSection('pricing')">Plans</a>
 <a href="#faq" class="landing-nav-link" @click.prevent="scrollToSection('faq')">FAQ</a>
 <a href="#contact" class="landing-nav-link" @click.prevent="scrollToSection('contact')">Contact</a>
 </nav>
 <NuxtLink to="/demo/dashboard" class="landing-header__cta">Try demo</NuxtLink>
 <a :href="appOriginUrl" class="landing-nav-link landing-header__start-link">Start free</a>
 </div>

 <div class="landing-header__mobile">
 <NuxtLink to="/demo/dashboard" class="landing-header__cta landing-header__cta--compact">Demo</NuxtLink>
 <button
 type="button"
 class="landing-header__menu-btn"
 :aria-expanded="mobileMenuOpen"
 aria-controls="landing-mobile-nav"
 :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
 @click="mobileMenuOpen = !mobileMenuOpen"
 >
 <XMarkIcon v-if="mobileMenuOpen" class="landing-header__menu-icon" aria-hidden="true" />
 <Bars3Icon v-else class="landing-header__menu-icon" aria-hidden="true" />
 </button>
 </div>
 </div>

 <Transition
 enter-active-class="transition duration-200 ease-out"
 enter-from-class="opacity-0"
 enter-to-class="opacity-100"
 leave-active-class="transition duration-150 ease-in"
 leave-from-class="opacity-100"
 leave-to-class="opacity-0"
 >
 <div
 v-if="mobileMenuOpen"
 id="landing-mobile-nav"
 class="landing-mobile-panel md:hidden"
 role="dialog"
 aria-modal="true"
 aria-label="Site menu"
 >
 <nav class="landing-mobile-panel__nav" aria-label="Primary">
 <a
 href="#features"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('features'); mobileMenuOpen = false"
 >Features</a>
 <a
 href="#proof"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('proof'); mobileMenuOpen = false"
 >Outcomes</a>
 <a
 href="/demo/dashboard"
 class="landing-mobile-nav-link"
 @click.prevent="navigateFromMobileMenu('/demo/dashboard')"
 >Try demo</a>
 <a
 href="#how-it-works"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('how-it-works'); mobileMenuOpen = false"
 >How it works</a>
 <a
 href="#pricing"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('pricing'); mobileMenuOpen = false"
 >Plans</a>
 <a
 href="#faq"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('faq'); mobileMenuOpen = false"
 >FAQ</a>
 <a
 href="#contact"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('contact'); mobileMenuOpen = false"
 >Contact</a>
 </nav>
 <div class="landing-mobile-panel__cta-wrap">
 <NuxtLink
 to="/demo/dashboard"
 class="landing-header__cta landing-mobile-panel__cta"
 @click="mobileMenuOpen = false"
 >
 Try demo (no signup)
 </NuxtLink>
 <a
 :href="appOriginUrl"
 class="landing-mobile-panel__secondary-cta"
 @click="mobileMenuOpen = false"
 >
 Start free on Micro
 </a>
 </div>
 </div>
 </Transition>
 </header>

 <Teleport to="body">
 <Transition
 enter-active-class="transition-opacity duration-200 ease-out"
 enter-from-class="opacity-0"
 enter-to-class="opacity-100"
 leave-active-class="transition-opacity duration-150 ease-in"
 leave-from-class="opacity-100"
 leave-to-class="opacity-0"
 >
 <button
 v-if="mobileMenuOpen"
 type="button"
 class="landing-mobile-backdrop md:hidden"
 aria-label="Close menu"
 @click="mobileMenuOpen = false"
 />
 </Transition>
 </Teleport>

 <!-- Marketing showcase: hero → who → problems → features → setup → multi-store -->
 <LandingShowcase :logo-src="marketingLogoSrc" :app-url="appOriginUrl" />

 <LandingDemo :app-url="appOriginUrl" />

 <LandingProof @navigate="scrollToSection" />

 <!-- How it works: product walkthrough -->
 <section
 id="how-it-works"
 data-section-id="how-it-works"
 class="scroll-animate scroll-animate-up relative scroll-mt-[4.75rem] grid min-h-[min(100vh,44rem)] overflow-hidden lg:min-h-[560px] lg:grid-cols-2 lg:scroll-mt-28"
 >
 <div
 class="relative flex flex-col justify-center bg-slate-950 px-5 py-12 sm:px-7 sm:py-14 lg:px-12 lg:py-20"
 >
 <div
 class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_15%_-15%,rgba(20,63,141,0.22),transparent_55%)]"
 />
 <div
 class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_110%,rgba(72,118,199,0.14),transparent_50%)]"
 />
 <div
 class="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:16px_16px]"
 />
 <div class="pointer-events-none absolute -left-24 top-1/3 h-48 w-48 rounded-full bg-primary-500/12 blur-3xl" />
 <div class="relative mx-auto max-w-lg lg:mx-0">
 <p class="text-sm font-bold uppercase tracking-[0.2em] text-primary-400 sm:text-base">
 How it works
 </p>
 <h2
 class="mt-2 bg-gradient-to-r from-white via-primary-50 to-primary-200/95 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl"
 >
 From signup to a calmer floor
 </h2>
 <p class="mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
 Five steps. Same flow whether you run one shop or several.
 </p>

 <div class="mt-7 space-y-2 sm:mt-8 sm:space-y-2.5">
 <div
 v-for="(step, idx) in howStorvvWorksSteps"
 :key="step.sectionId"
 :data-section-id="step.sectionId"
 class="group scroll-animate scroll-animate-up relative flex gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-colors duration-200 hover:border-primary-400/30"
 :class="`stagger-${idx + 1}`"
 >
 <div class="flex shrink-0 flex-col items-center">
 <span
 class="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-300 via-primary-400 to-primary-600 p-[1.5px] ring-1 ring-white/15"
 >
 <span
 class="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950 text-[10px] font-black tabular-nums tracking-tight text-white"
 >
 {{ step.num }}
 </span>
 </span>
 <div
 v-if="idx < howStorvvWorksSteps.length - 1"
 class="mt-1.5 min-h-[0.75rem] w-px flex-1 bg-gradient-to-b from-primary-400/45 via-primary-500/20 to-transparent"
 aria-hidden="true"
 />
 </div>
 <div class="flex min-w-0 flex-1 gap-2 sm:gap-2.5">
 <div
 class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary-300 ring-1 ring-white/10 transition-colors group-hover:bg-primary-500/10 group-hover:text-primary-200"
 >
 <component :is="step.icon" class="h-4 w-4" aria-hidden="true" />
 </div>
 <div class="min-w-0 pb-0.5 pt-0.5">
 <h3 class="text-sm font-semibold leading-snug text-white sm:text-base">
 {{ step.title }}
 </h3>
 <div
 class="mt-1.5 text-sm leading-relaxed text-slate-400 [&_span]:font-medium [&_span]:text-primary-100"
 v-html="step.html"
 />
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div
 class="relative flex min-h-[min(100%,28rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 p-6 sm:p-8 lg:min-h-0 lg:p-10"
 >
 <div
 class="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-primary-300/35 blur-3xl"
 />
 <div
 class="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-primary-700/40 blur-3xl"
 />
 <div
 class="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,transparent_42%,rgba(8,27,64,0.12)_100%)]"
 />
 <div class="relative w-full max-w-2xl">
 <div class="mb-3 flex justify-center sm:mb-4">
 <span
 class="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:text-[10px] sm:tracking-[0.22em]"
 >
 <span class="relative flex h-2 w-2">
 <span
 class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-200/80 opacity-50"
 />
 <span class="relative inline-flex h-2 w-2 rounded-full bg-primary-100" />
 </span>
 Inside the app
 </span>
 </div>
 <div
 class="overflow-hidden rounded-2xl border border-white/25 bg-slate-950/25 ring-1 ring-white/20 backdrop-blur-[2px]"
 >
 <div class="relative">
 <img
 :src="howStorvvWorksImages[howStorvvWorksSlide]"
 :alt="`Storvv product screenshot ${howStorvvWorksSlide + 1} of ${howStorvvWorksImages.length}`"
 class="w-full max-h-[min(72vh,520px)] object-contain object-top"
 loading="lazy"
 decoding="async"
 />
 <button
 type="button"
 class="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-900 ring-1 ring-slate-900/5 transition-colors hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
 aria-label="Previous screenshot"
 @click="
 howStorvvWorksSlide =
 (howStorvvWorksSlide - 1 + howStorvvWorksImages.length) % howStorvvWorksImages.length
 "
 >
 <ChevronLeftIcon class="h-5 w-5" aria-hidden="true" />
 </button>
 <button
 type="button"
 class="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-900 ring-1 ring-slate-900/5 transition-colors hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
 aria-label="Next screenshot"
 @click="howStorvvWorksSlide = (howStorvvWorksSlide + 1) % howStorvvWorksImages.length"
 >
 <ChevronRightIcon class="h-5 w-5" aria-hidden="true" />
 </button>
 </div>
 <div
 class="flex flex-wrap items-center justify-center gap-1.5 border-t border-white/15 bg-black/10 px-3 py-3 backdrop-blur-sm"
 aria-label="Choose screenshot"
 >
 <button
 v-for="(_, idx) in howStorvvWorksImages"
 :key="idx"
 type="button"
 :aria-pressed="idx === howStorvvWorksSlide"
 :aria-label="`Show screenshot ${idx + 1}`"
 class="h-1.5 rounded-full transition-[width,background-color] duration-300"
 :class="
 idx === howStorvvWorksSlide ? 'w-8 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/80'
 "
 @click="howStorvvWorksSlide = idx"
 />
 </div>
 </div>
 </div>
 </div>
 </section>

 <!-- About -->
 <section
 id="about"
 data-section-id="about"
 class="landing-about-section scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
 aria-labelledby="landing-about-heading"
 >
 <div class="landing-about-bg" aria-hidden="true" />

 <div class="landing-about-inner">
 <header class="landing-about-header">
 <p class="landing-label landing-label--blue landing-about-label">Why Storvv</p>
 <h2 id="landing-about-heading" class="landing-about-title">
 Three pillars for <span class="landing-about-title-accent">retail & operations</span>
 </h2>
 <p class="landing-about-lede">
 Stop stock surprises, run every branch from one login, and keep receipts and customers out of
 Excel and WhatsApp.
 </p>
 </header>

 <div class="landing-about-grid">
 <div class="landing-about-highlights">
 <article
 v-for="item in aboutHighlights"
 :key="item.num"
 class="landing-about-card landing-about-card--feature landing-about-animate"
 >
 <div class="landing-about-card-top">
 <span class="landing-about-num">{{ item.num }}</span>
 <component :is="item.icon" class="landing-about-icon" stroke-width="1.5" aria-hidden="true" />
 </div>
 <h3 class="landing-about-card-title">{{ item.title }}</h3>
 <p class="landing-about-card-desc">{{ item.description }}</p>
 <p class="landing-about-card-detail">{{ item.detail }}</p>
 </article>
 </div>

 <div class="landing-about-pillars">
 <article
 v-for="pillar in aboutPillars"
 :key="pillar.title"
 class="landing-about-card landing-about-card--pillar landing-about-animate"
 >
 <component :is="pillar.icon" class="landing-about-icon" stroke-width="1.5" aria-hidden="true" />
 <div class="landing-about-pillar-body">
 <p class="landing-about-pillar-label">{{ pillar.title }}</p>
 <p class="landing-about-card-desc">{{ pillar.body }}</p>
 </div>
 </article>
 </div>
 </div>

 <p class="landing-about-footer">
 Compare plans in
 <a href="#pricing" class="landing-about-link" @click.prevent="scrollToSection('pricing')">Pricing</a>
 or
 <a href="#contact" class="landing-about-link" @click.prevent="scrollToSection('contact')">contact us</a>.
 </p>
 </div>
 </section>

 <LandingCapabilities @navigate="scrollToSection" />

 <!-- Pricing -->
 <section id="pricing" data-section-id="pricing" class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-gradient-to-b from-white to-slate-50/65 py-20 dark:from-slate-950 dark:to-slate-900/80 lg:scroll-mt-28 lg:py-28 sm:py-24">
 <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
 <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center">
 Plans that match your stage
 </h2>
 <p class="mt-4 text-base text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto leading-relaxed">
 Start on <strong class="font-semibold text-gray-800 dark:text-gray-200">Micro</strong> (free, one store).
 Medium adds analytics and a second branch. Enterprise is for multi-store operators who need sync and transfers.
 </p>
 <p class="mt-3 text-center text-base text-primary-700 dark:text-primary-300">
 <NuxtLink to="/demo/dashboard" class="font-semibold underline-offset-2 hover:underline">Try the demo first</NuxtLink>
 (no signup required).
 </p>
 <p class="mt-2 text-center text-base text-gray-600 dark:text-gray-400">
 Showing prices in {{ pricing.currency }} based on your region.
 </p>
 <div class="flex items-center justify-center gap-3 mt-7">
 <span :class="['text-sm font-medium', !isYearly ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500']">Monthly</span>
 <button
 @click="isYearly = !isYearly"
 :class="['relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950', isYearly ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600']"
 role="switch"
 :aria-checked="isYearly"
 >
 <span :class="['inline-block h-5 w-5 rounded-full bg-white transition-transform', isYearly ? 'translate-x-6' : 'translate-x-1']" />
 </button>
 <span :class="['text-sm font-medium flex items-center gap-2', isYearly ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500']">
 Yearly
 <span v-if="isYearly" class="text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-1 rounded-full">Save 15%</span>
 </span>
 </div>
 <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
 <!-- Micro: single store, 1 dept, 2 staff. No analytics, no multi-store sync. -->
 <div data-section-id="pricing-1" class="scroll-animate scroll-animate-scale stagger-1 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col transition duration-200 ease-out">
 <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Micro</h3>
 <p class="mt-1 text-base text-gray-600 dark:text-gray-400">Single store, solo or very small team</p>
 <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">FREE</p>
 <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
 <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />1 store · 1 department · up to 2 staff</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Full inventory, receipts, returns & customers</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Dashboard, notifications & help center</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />WhatsApp receipts (10/month)</li>
 <li class="flex items-start gap-2 text-gray-500 dark:text-gray-500"><span class="shrink-0">−</span> No analytics, activity logs, or multi-store tools</li>
 </ul>
 <NuxtLink to="/demo/dashboard" class="mt-4 flex w-full items-center justify-center rounded-sm border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800">Try demo</NuxtLink>
 <a :href="appOriginUrl" class="mt-2 flex w-full items-center justify-center rounded-sm bg-gray-900 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800">Start free</a>
 </div>
 <!-- Medium: 2 stores, 10 depts, 25 staff. Analytics, duplicate folders/items. No multi-store sync. -->
 <div data-section-id="pricing-2" class="scroll-animate scroll-animate-scale stagger-2 relative rounded-3xl bg-primary-50/35 p-6 flex flex-col dark:bg-slate-900">
 <p class="absolute -top-3 right-5 rounded-full bg-primary-500 px-3 py-1 text-sm font-semibold text-white">
 Most popular
 </p>
 <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Medium</h3>
 <p class="mt-1 text-base text-gray-600 dark:text-gray-400">Growing business, multiple locations or teams</p>
 <div class="mt-4 flex items-baseline gap-2">
 <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isYearly ? mediumYearlyPrice : mediumMonthlyPrice }}</span>
 <span v-if="isYearly" class="text-sm text-gray-400 line-through">{{ mediumYearlyListPrice }}</span>
 </div>
 <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
 <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Everything in Micro</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Up to 2 stores · 10 departments · 25 staff</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Analytics, activity logs & reports</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Customer balance / credit ledger</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Unlimited WhatsApp receipts</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Duplicate categories (same branch)</li>
 <li class="flex items-start gap-2 text-gray-500 dark:text-gray-500"><span class="shrink-0">−</span> No stock transfers or copy-from-branch (Enterprise)</li>
 </ul>
 <a :href="appOriginUrl" class="btn-primary mt-6 flex w-full justify-center py-2.5">Get Started</a>
 </div>
 <!-- Enterprise: unlimited. Multi-store sync, priority support. -->
 <div data-section-id="pricing-3" class="scroll-animate scroll-animate-scale stagger-3 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col transition duration-200 ease-out">
 <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Enterprise</h3>
 <p class="mt-1 text-base text-gray-600 dark:text-gray-400">Larger operations, central management</p>
 <div class="mt-4 flex items-baseline gap-2">
 <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isYearly ? enterpriseYearlyPrice : enterpriseMonthlyPrice }}</span>
 <span v-if="isYearly" class="text-sm text-gray-400 line-through">{{ enterpriseYearlyListPrice }}</span>
 </div>
 <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
 <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Everything in Medium</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Unlimited stores, departments & staff</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Multi-store sync & stock transfers</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Copy from branch (category templates)</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Stock loans for serial inventory</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Priority support</li>
 </ul>
 <a :href="appOriginUrl" class="mt-6 flex w-full items-center justify-center rounded-sm bg-gray-900 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800">Get Started</a>
 </div>
 </div>
 </div>

 <div class="mx-auto mt-10 max-w-2xl border-t border-gray-200/90 pt-8 text-center dark:border-gray-800/80 sm:mt-12">
 <p class="text-base text-gray-600 dark:text-gray-400">
 Running 2+ branches? We onboard a small founding cohort with hands-on setup.
 <a href="#contact" class="font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300" @click.prevent="scrollToSection('contact')">Apply via contact</a>.
 </p>
 <div class="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
 <NuxtLink
 to="/demo/dashboard"
 class="inline-flex w-full items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-500 sm:w-auto"
 >
 Try the demo
 </NuxtLink>
 <a
 :href="appOriginUrl"
 class="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 sm:w-auto dark:border-gray-600 dark:bg-slate-900 dark:text-gray-100 dark:hover:bg-slate-800"
 >
 Start free on Micro
 </a>
 </div>
 </div>
 </section>

 <LandingSecurity />

 <!-- FAQ -->
 <section id="faq" data-section-id="faq" class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-[#f5f7f9] py-20 dark:bg-slate-900/55 lg:scroll-mt-28 lg:py-28 sm:py-24">
 <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
 <p class="text-base uppercase tracking-[0.12em] font-semibold text-gray-600 dark:text-gray-300 text-center">Frequently asked questions</p>
 <h2 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center">Quick answers</h2>
 <p class="mt-2 text-center text-base text-gray-600 dark:text-gray-300">Setup, plans, and how Storvv fits your store.</p>
 <div class="mt-10 space-y-3">
 <div data-section-id="faq-1" class="scroll-animate scroll-animate-scale stagger-1 rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button
 @click="toggleFaq(0)"
 class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
 >
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <ClockIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">How quickly can I get started?</h3>
 </div>
 <ChevronUpIcon
 :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(0) ? 'rotate-180' : '']"
 />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(0) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Most stores are up and running within minutes. Create your store profile, set up your first inventory folder, and you're ready to start managing sales. No coding or technical expertise needed.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <div data-section-id="faq-2" class="scroll-animate scroll-animate-scale stagger-2 rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(1)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <SparklesIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">Is Storvv difficult to learn?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(1) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(1) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Not at all. Storvv is built with simplicity in mind. The interface is intuitive and straightforward: if you can use a smartphone, you can use Storvv. We've designed it specifically for store owners and managers.</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div data-section-id="faq-3" class="scroll-animate scroll-animate-scale stagger-3 rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(2)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <ChartBarIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">Can I track in-store and online sales together?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(2) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(2) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Absolutely. Storvv provides a unified view of all your sales channels. Whether transactions happen at your physical location or through other channels, everything is consolidated in one dashboard for complete visibility.</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(3)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <FolderIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">How do custom inventory folders work?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(3) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(3) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products. Each folder can have its own template, and you can enable serial number tracking for individual items.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(4)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <DocumentTextIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">Can I import products from Excel?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(4) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(4) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Yes! Storvv supports bulk import from Excel spreadsheets. Simply upload your Excel file, and items will be automatically added to your inventory folders. You can also export your inventory data to Excel for backup or analysis.</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(5)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <UsersIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">How does customer tracking work?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(5) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(5) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Customers are automatically created when you generate receipts. They're tracked by email, phone, or address. View complete purchase history, total spending, and order counts for each customer, all without manual data entry.</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(6)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <ArrowPathIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">What are swap-in transactions?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(6) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(6) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Swap-in transactions allow customers to exchange items. When a customer swaps in an item, it's automatically added back to your inventory, and the transaction is tracked. Perfect for device exchanges, trade-ins, or returns.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(7)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <KeyIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">How do role-based permissions work?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(7) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(7) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Storvv supports three roles: Super Admin (full access), Manager (can manage assigned folders and staff), and Staff (limited access based on department). You can control folder access at the department level, ensuring staff only see relevant inventory.</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(8)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <BellAlertIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">What are low stock alerts?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(8) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(8) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Storvv automatically tracks low stock items based on your configured threshold. For serial number folders, it alerts when available items fall below the threshold. For bulk items, it counts individual items with low quantities. Get notified on your dashboard.</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(9)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <BuildingOfficeIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">Can I manage multiple stores?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(9) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(9) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Yes! Premium plans support multiple store locations. Each store has its own inventory folders, receipts, and staff. Manage everything from one centralized dashboard while keeping store data separate.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(10)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <ShieldCheckIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">Is my data secure?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(10) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(10) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Yes, absolutely. Storvv uses enterprise-grade security to protect all your data. Your information is encrypted, and we never share your data without your explicit permission.</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden">
 <button @click="toggleFaq(11)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
 <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]">
 <BanknotesIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
 </div>
 <div class="flex-1 min-w-0">
 <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">What’s the difference between Micro, Medium, and Enterprise?</h3>
 </div>
 <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none', openFaqItems.has(11) ? 'rotate-180' : '']" />
 </button>
 <div
 class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
 :class="openFaqItems.has(11) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
 >
 <div class="min-h-0 overflow-hidden">
 <div class="px-4 sm:px-5 pb-4 sm:pb-5">
 <div class="pl-11 sm:pl-12">
 <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
 <strong>Micro (free):</strong> One store, one department, up to 2 staff. Full inventory, receipts, returns, and customers; dashboard, notifications, and help center. WhatsApp receipts (10/month). No analytics, activity logs, customer balance, or multi-store tools.<br><br>
 <strong>Medium:</strong> Everything in Micro plus up to 2 stores, 10 departments and 25 staff per store, analytics and reports, activity logs, customer balance ledger, unlimited WhatsApp, and duplicate categories within a branch. No stock transfers or copy-from-branch.<br><br>
 <strong>Enterprise:</strong> Everything in Medium plus unlimited stores, departments, and staff; multi-store sync and stock transfers; <strong>Copy from branch</strong> for category templates across branches; <strong>Stock loans</strong> for serial inventory; and priority support.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 <LandingContact @open-form="showContactFormModal = true" />

 <!-- Footer -->
 <footer class="border-t border-white/[0.08] bg-slate-950 text-slate-300 dark:border-black/50 dark:bg-neutral-950">
 <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
 <div class="grid lg:grid-cols-12 gap-10 pb-10 border-b border-white/[0.08]">
 <!-- Brand -->
 <div class="lg:col-span-4 space-y-4">
 <NuxtLink to="/" class="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
 <img
 :src="footerLogoSrc"
 alt="Storvv"
 class="landing-footer-brand-img h-10 w-auto max-h-10 origin-left object-contain will-change-transform sm:h-11 sm:max-h-11 lg:scale-105"
 />
 </NuxtLink>
 <p class="text-sm text-slate-400 leading-relaxed max-w-sm">
 Store management software for modern retailers, inventory, receipts, customers, and teams in one fast system.
 </p>
 <div class="flex items-center gap-5 pt-1">
 <a
 href="https://x.com/_storvv_"
 target="_blank"
 rel="noopener noreferrer"
 class="inline-flex items-center justify-center rounded-md p-1.5 -m-1.5 text-slate-300 transition-colors hover:text-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
 aria-label="X"
 >
 <svg class="h-7 w-7 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
 </svg>
 </a>
 <a
 href="https://www.instagram.com/_storvv_"
 target="_blank"
 rel="noopener noreferrer"
 class="inline-flex items-center justify-center rounded-md p-1.5 -m-1.5 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
 aria-label="Instagram"
 >
 <svg class="h-7 w-7 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
 <defs>
 <linearGradient id="footer-instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
 <stop offset="0%" stop-color="#f09433" />
 <stop offset="50%" stop-color="#e6683c" />
 <stop offset="100%" stop-color="#bc1888" />
 </linearGradient>
 </defs>
 <path
 fill="url(#footer-instagram-gradient)"
 fill-rule="evenodd"
 d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
 clip-rule="evenodd"
 />
 </svg>
 </a>
 </div>
 </div>

 <!-- Links -->
 <div class="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
 <div>
 <h4 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Product</h4>
 <ul class="space-y-2.5">
 <li><a href="#features" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100" @click.prevent="scrollToSection('features')">Features</a></li>
 <li><a href="#capabilities-grid" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100" @click.prevent="scrollToSection('capabilities-grid')">Capabilities</a></li>
 <li><a href="#pricing" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100" @click.prevent="scrollToSection('pricing')">Plans</a></li>
 <li><a href="#faq" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100" @click.prevent="scrollToSection('faq')">FAQs</a></li>
 </ul>
 </div>
 <div>
 <h4 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Company</h4>
 <ul class="space-y-2.5">
 <li><a href="#about" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100" @click.prevent="scrollToSection('about')">About</a></li>
 <li><a href="#contact" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100" @click.prevent="scrollToSection('contact')">Contact</a></li>
 </ul>
 </div>
 <div>
 <h4 class="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Legal</h4>
 <ul class="space-y-2.5">
 <li><NuxtLink to="/privacy" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">Privacy</NuxtLink></li>
 <li><NuxtLink to="/terms" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">Terms</NuxtLink></li>
 </ul>
 </div>
 <div>
 <h4 class="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-4">Support</h4>
 <ul class="space-y-2.5">
 <li><a href="mailto:hello@storvv.com" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">hello@storvv.com</a></li>
 <li><a href="https://www.instagram.com/_storvv_" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">Instagram</a></li>
 <li><a href="https://x.com/_storvv_" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">X</a></li>
 </ul>
 </div>
 </div>
 </div>

 <!-- Bottom bar -->
 <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
 <p class="text-sm text-gray-600 dark:text-gray-400">
 &copy; {{ new Date().getFullYear() }} Storvv. All rights reserved.
 </p>
 <p class="text-sm text-gray-600 dark:text-gray-400">
 Store management for modern retailers.
 </p>
 </div>
 </div>

 <!-- Cookie consent banner -->
 <div
 v-if="!cookiesAccepted"
 class="bg-gray-100 border-t border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4 dark:bg-slate-950 dark:border-gray-800"
 >
 <p class="text-sm text-gray-600 dark:text-gray-400">
 We use cookies on our website to help us provide the best browsing experience. By continuing to use our website you are deemed to have agreed to the use of cookies.
 </p>
 <div class="flex items-center gap-3 flex-shrink-0">
 <NuxtLink to="/privacy" class="text-sm font-medium text-primary-500 hover:text-primary-600">
 Learn more
 </NuxtLink>
 <button
 @click="acceptCookies"
 class="px-4 py-2 rounded-sm bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
 >
 OK
 </button>
 </div>
 </div>
 </footer>

 <!-- Back to Top Button -->
 <Transition
 enter-active-class="transition ease-out duration-200"
 enter-from-class="opacity-0 translate-y-4"
 enter-to-class="opacity-100 translate-y-0"
 leave-active-class="transition ease-in duration-150"
 leave-from-class="opacity-100 translate-y-0"
 leave-to-class="opacity-0 translate-y-4"
 >
 <button
 v-if="showBackToTop"
 @click="scrollToTop"
 class="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center justify-center dark:bg-primary-600 dark:hover:bg-primary-500"
 aria-label="Back to top"
 >
 <ArrowUpIcon class="w-5 h-5" />
 </button>
 </Transition>

 <!-- Contact Form Modal -->
 <Modal
 :model-value="showContactFormModal"
 @update:model-value="showContactFormModal = $event"
 size="xl"
 :show-close="true"
 :blur-backdrop="false"
 >
 <template #header>
 <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Us</h3>
 </template>
 <div class="min-h-[500px]">
 <iframe
 v-if="showContactFormModal"
 src="https://forms.fillout.com/t/89G44ZqC6Zus"
 title="Contact form"
 class="w-full h-[600px] min-h-[500px] border-0 rounded-sm"
 />
 </div>
 </Modal>

 <!-- Launching Soon Modal - Disabled -->
 <!-- <Modal
 :model-value="showLaunchModal"
 @update:model-value="showLaunchModal = $event"
 size="md"
 >
 <template #header>
 <div class="text-center w-full">
 <div class="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-sm flex items-center justify-center mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
 <SparklesIcon class="w-8 h-8 text-white" />
 </div>
 </div>
 </template>
 <template #default>
 <div class="text-center py-6 px-4">
 <h3 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
 Storvv is Launching Soon!
 </h3>
 <div class="h-1 w-20 bg-gradient-to-r from-primary-500 to-primary-600 mx-auto mb-6 rounded-full"></div>
 <p class="text-lg text-gray-700 dark:text-gray-300 mb-3 leading-relaxed max-w-lg mx-auto font-medium">
 We're putting the final touches on our platform to deliver an exceptional experience for your store management needs.
 </p>
 <p class="text-base text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-md mx-auto">
 Be among the first to know when we go live. Get notified as soon as Storvv is ready to transform your business.
 </p>
 <button
 @click="showLaunchModal = false"
 class="w-full max-w-xs mx-auto bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3.5 rounded-sm font-semibold text-base hover:from-primary-700 hover:to-primary-800 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
 >
 Understood, Thank You!
 </button>
 <p class="text-sm text-gray-500 dark:text-gray-400 mt-6 font-medium">
 We'll be back soon with something amazing.
 </p>
 </div>
 </template>
 </Modal> -->
 </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, markRaw, type Component } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import MarketingSyncLoader from '~/components/marketing/MarketingSyncLoader.vue'
import {
 Bars3Icon,
 XMarkIcon,
 ArrowRightIcon,
 CheckIcon,
 CubeIcon,
 ReceiptPercentIcon,
 UsersIcon,
 ChartBarIcon,
 BuildingOfficeIcon,
 ArrowPathIcon,
 Square2StackIcon,
 ShieldCheckIcon,
 LockClosedIcon,
 DocumentTextIcon,
 BanknotesIcon,
 ClipboardDocumentCheckIcon,
 FolderIcon,
 TagIcon,
 ShoppingCartIcon,
 UserGroupIcon,
 BellAlertIcon,
 MagnifyingGlassIcon,
 SparklesIcon,
 ServerIcon,
 GlobeAltIcon,
 ClockIcon,
 KeyIcon,
 ArrowUpIcon,
 EnvelopeIcon,
 ChevronLeftIcon,
 ChevronRightIcon,
 ChevronUpIcon,
 ArrowsRightLeftIcon,
} from '@heroicons/vue/24/outline'
import {
 Cog6ToothIcon as Cog6ToothSolidIcon,
 UsersIcon as UsersSolidIcon,
 RectangleStackIcon as RectangleStackSolidIcon,
 ReceiptPercentIcon as ReceiptPercentSolidIcon,
 PresentationChartLineIcon as PresentationChartLineSolidIcon,
} from '@heroicons/vue/24/solid'
import { useThemeStore } from '~/stores/theme'
/** Product shots for “How Storvv works” (files in /public). */
const howStorvvWorksScreenshotFiles = [
 'Screenshot 2026-05-10 at 17.09.01.png',
 'Screenshot 2026-05-10 at 17.09.20.png',
 'Screenshot 2026-05-10 at 17.10.05.png',
 'Screenshot 2026-05-10 at 17.10.12.png',
 'Screenshot 2026-05-10 at 17.10.21.png',
 'Screenshot 2026-05-10 at 17.11.07.png',
 'Screenshot 2026-05-10 at 17.11.56.png',
 'Screenshot 2026-05-10 at 19.03.41.png',
 'Screenshot 2026-05-10 at 19.03.47.png',
] as const

const howStorvvWorksImages = howStorvvWorksScreenshotFiles.map((name) => `/${encodeURIComponent(name)}`)
const howStorvvWorksSlide = ref(0)

/** Landing “How Storvv works”: compact copy + icons (static HTML only for descriptions). */
const howStorvvWorksSteps = [
 {
 sectionId: 'step-1',
 num: '01',
 icon: markRaw(Cog6ToothSolidIcon),
 title: 'Try the demo or sign up',
 html: 'Explore with sample branches first, then create your store on <span class="font-medium text-primary-100">Micro (free)</span>.',
 },
 {
 sectionId: 'step-2',
 num: '02',
 icon: markRaw(UsersSolidIcon),
 title: 'Add your team',
 html: 'Invite staff with roles. Limit folder access so people only see what they need.',
 },
 {
 sectionId: 'step-3',
 num: '03',
 icon: markRaw(RectangleStackSolidIcon),
 title: 'Load inventory',
 html: 'Import from Excel or build folders with SKUs and serials.<br /><span class="text-slate-500">Enterprise: <span class="font-medium text-primary-100">copy layouts from another branch</span>.</span>',
 },
 {
 sectionId: 'step-4',
 num: '04',
 icon: markRaw(ReceiptPercentSolidIcon),
 title: 'Sell and receipt',
 html: 'Ring sales, discounts, returns, and split payments. Capture customers as you go.',
 },
 {
 sectionId: 'step-5',
 num: '05',
 icon: markRaw(PresentationChartLineSolidIcon),
 title: 'Track performance',
 html: 'Dashboards for bestsellers, low stock, and daily pace. Export more on higher plans.',
 },
]

/** Marketing site is light-only; logo asset for light backgrounds. */
const marketingLogoSrc = '/storvv logo 2.png'
/** Light wordmark on dark footer (matches dashboard sidebar dark theme). */
const footerLogoSrc = '/storvv logo.png'

const themeStore = useThemeStore()

function applyLandingLightDocument() {
 if (!import.meta.client) return
 const html = document.documentElement
 html.classList.remove('dark')
 html.style.colorScheme = 'light'
 const meta = document.getElementById('theme-color-meta')
 if (meta) meta.setAttribute('content', '#fafafa')
}

const mobileMenuOpen = ref(false)
const route = useRoute()

let mobileMenuMql: MediaQueryList | null = null
function closeMobileMenuIfDesktop() {
 if (mobileMenuMql?.matches) mobileMenuOpen.value = false
}

async function navigateFromMobileMenu(path: string) {
 await navigateTo(path)
 mobileMenuOpen.value = false
}

watch(
 () => route.path,
 () => {
 mobileMenuOpen.value = false
 },
)

watch(mobileMenuOpen, (open) => {
 if (!import.meta.client) return
 document.body.style.overflow = open ? 'hidden' : ''
})
const showBackToTop = ref(false)
const isYearly = ref(false)
const locale = ref('en-NG')
const pricingRegion = ref<'NG' | 'US' | 'GB' | 'EU'>('NG')
const showLaunchModal = ref(false)
const showContactFormModal = ref(false)
const runtimeConfig = useRuntimeConfig()
const appOriginUrl = computed(() => {
 const o = runtimeConfig.public.appOrigin
 return typeof o === 'string' && o.length > 0 ? o : 'https://app.storvv.com'
})
const cookiesAccepted = ref(true)

const EU_COUNTRY_CODES = new Set([
 'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
])

const pricingByRegion = {
 NG: {
 currency: 'NGN',
 medium: { monthly: 10000, yearly: 100000, yearlyList: 120000 },
 enterprise: { monthly: 25000, yearly: 200000, yearlyList: 300000 },
 },
 US: {
 currency: 'USD',
 medium: { monthly: 7, yearly: 70, yearlyList: 84 },
 enterprise: { monthly: 19, yearly: 190, yearlyList: 228 },
 },
 GB: {
 currency: 'GBP',
 medium: { monthly: 6, yearly: 60, yearlyList: 72 },
 enterprise: { monthly: 15, yearly: 150, yearlyList: 180 },
 },
 EU: {
 currency: 'EUR',
 medium: { monthly: 7, yearly: 70, yearlyList: 84 },
 enterprise: { monthly: 17, yearly: 170, yearlyList: 204 },
 },
} as const

const pricing = computed(() => pricingByRegion[pricingRegion.value])

const formatPrice = (amount: number) =>
 new Intl.NumberFormat(locale.value, {
 style: 'currency',
 currency: pricing.value.currency,
 maximumFractionDigits: 0,
 }).format(amount)

const mediumMonthlyPrice = computed(() => formatPrice(pricing.value.medium.monthly))
const mediumYearlyPrice = computed(() => formatPrice(pricing.value.medium.yearly))
const mediumYearlyListPrice = computed(() => formatPrice(pricing.value.medium.yearlyList))
const enterpriseMonthlyPrice = computed(() => formatPrice(pricing.value.enterprise.monthly))
const enterpriseYearlyPrice = computed(() => formatPrice(pricing.value.enterprise.yearly))
const enterpriseYearlyListPrice = computed(() => formatPrice(pricing.value.enterprise.yearlyList))

const detectPricingRegion = () => {
 const browserLocale = Intl.DateTimeFormat().resolvedOptions().locale || 'en-NG'
 locale.value = browserLocale

 const regionCode = browserLocale.split('-')[1]?.toUpperCase()
 if (regionCode === 'NG') {
 pricingRegion.value = 'NG'
 return
 }
 if (regionCode === 'GB') {
 pricingRegion.value = 'GB'
 return
 }
 if (regionCode === 'US') {
 pricingRegion.value = 'US'
 return
 }
 if (regionCode && EU_COUNTRY_CODES.has(regionCode)) {
 pricingRegion.value = 'EU'
 return
 }

 const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
 if (timeZone.startsWith('Africa/Lagos')) {
 pricingRegion.value = 'NG'
 return
 }
 if (timeZone.startsWith('Europe/London')) {
 pricingRegion.value = 'GB'
 return
 }
 if (timeZone.startsWith('Europe/')) {
 pricingRegion.value = 'EU'
 return
 }

 pricingRegion.value = 'US'
}

const acceptCookies = () => {
 cookiesAccepted.value = true
 if (import.meta.client) localStorage.setItem('storvv-cookies-accepted', 'true')
}

const visibleSections = ref<Set<string>>(new Set())
const openFaqItems = ref<Set<number>>(new Set())

const toggleFaq = (index: number) => {
 const next = new Set(openFaqItems.value)
 if (next.has(index)) next.delete(index)
 else next.add(index)
 openFaqItems.value = next
}

const aboutHighlights = [
  {
    num: '01',
    icon: CubeIcon,
    title: 'Stop losing money on stock',
    description: 'Live inventory per branch with low-stock visibility.',
    detail: 'Know what sold and what’s left before a customer walks away.',
  },
  {
    num: '02',
    icon: BuildingOfficeIcon,
    title: 'One dashboard, many branches',
    description: 'Switch stores in one click. Compare branches without merged spreadsheets.',
    detail: 'Enterprise: transfers, consolidated reports, central oversight.',
  },
  {
    num: '03',
    icon: SparklesIcon,
    title: 'Receipts & customers together',
    description: 'Sales history and buyer profiles in one search.',
    detail: 'WhatsApp receipts and customer history on eligible plans.',
  },
] as const

const aboutPillars = [
 {
 title: 'Retail to procurement',
 body: 'Stock, sales, and buying workflows in one place, from shop floor to back office.',
 icon: Square2StackIcon,
 },
 {
 title: 'Demo-first',
 body: 'Try the full dashboard with sample data before you create an account.',
 icon: UserGroupIcon,
 },
 {
 title: 'Start free',
 body: 'Micro stays free for one store. Upgrade when you add branches or need analytics.',
 icon: BuildingOfficeIcon,
 },
] as const

const scrollToSection = (sectionId: string) => {
 const element = document.getElementById(sectionId)
 if (element && import.meta.client) {
 element.scrollIntoView({
 behavior: 'smooth',
 block: 'start',
 })
 }
}

const scrollToTop = () => {
 window.scrollTo({
 top: 0,
 behavior: 'smooth'
 })
 }

const handleScroll = () => {
 showBackToTop.value = window.scrollY > 400
}

// Intersection Observer for scroll animations
const setupScrollAnimations = () => {
 if (!import.meta.client) return
 
 const observer = new IntersectionObserver(
 (entries) => {
 entries.forEach((entry) => {
 if (entry.isIntersecting) {
 const id = entry.target.getAttribute('data-section-id')
 if (id) {
 visibleSections.value.add(id)
 entry.target.classList.add('visible')
 }
 }
 })
 },
 {
 threshold: 0.1,
 rootMargin: '0px 0px -52px 0px',
 }
 )
 
 // Observe all scroll-animate elements with data-section-id
 const animateElements = document.querySelectorAll('.scroll-animate[data-section-id]')
 animateElements.forEach((el) => {
 // Check if element is already in viewport on load
 const rect = el.getBoundingClientRect()
 const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
 if (isInViewport) {
 el.classList.add('visible')
 }
 observer.observe(el)
 })
}

onMounted(() => {
 if (import.meta.client) {
 applyLandingLightDocument()
 detectPricingRegion()
 mobileMenuMql = window.matchMedia('(min-width: 768px)')
 mobileMenuMql.addEventListener('change', closeMobileMenuIfDesktop)
 }

 if (import.meta.client && !localStorage.getItem('storvv-cookies-accepted')) {
 cookiesAccepted.value = false
 }
 if (import.meta.client && window.location.hash) {
 const sectionId = window.location.hash.substring(1)
 setTimeout(() => {
 scrollToSection(sectionId)
 }, 100)
 }

 // Add scroll event listener
 if (import.meta.client) {
 window.addEventListener('scroll', handleScroll)
 // Check initial scroll position
 handleScroll()
 
 // Setup scroll animations
 setTimeout(() => {
 setupScrollAnimations()
 }, 100)
 }

})

onUnmounted(() => {
 // Clean up scroll event listener
 if (import.meta.client) {
 document.body.style.overflow = ''
 mobileMenuMql?.removeEventListener('change', closeMobileMenuIfDesktop)
 mobileMenuMql = null
 themeStore.applyTheme()
 window.removeEventListener('scroll', handleScroll)
 }
})

useHead({
 title: 'Storvv - Effortless Store Management for Ambitious Businesses',
 meta: [
 {
 name: 'description',
 content: 'A complete store management platform with instant inventory setup, automated sales tracking, and AI-powered insights at your fingertips.'
 }
 ]
})
</script>

<style scoped>
/* Hero: unified glass surfaces (mobile sync strip + desktop floats) */
.landing-hero-float-card {
 border-radius: 1rem;
 border: 1px solid rgba(255, 255, 255, 0.2);
 background: rgba(255, 255, 255, 0.072);
 box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
 backdrop-filter: blur(20px);
 -webkit-backdrop-filter: blur(20px);
 transition:
 transform 500ms cubic-bezier(0.16, 1, 0.3, 1),
 border-color 300ms ease-out,
 background-color 300ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
 .landing-hero-float-card:hover {
 transform: translateY(-1px);
 border-color: rgba(255, 255, 255, 0.26);
 background: rgba(255, 255, 255, 0.085);
 box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
 }
}

@media (prefers-reduced-motion: reduce) {
 .landing-hero-float-card,
 .landing-hero-float-card:hover {
 transition: none;
 transform: none;
 }
}

/* Hero: faint blueprint mesh (readable center, fades at edges) */
.landing-hero-grid {
 background-image:
 linear-gradient(rgba(147, 197, 253, 0.07) 1px, transparent 1px),
 linear-gradient(90deg, rgba(147, 197, 253, 0.07) 1px, transparent 1px);
 background-size: 52px 52px;
 mask-image: radial-gradient(ellipse 110% 85% at 50% 32%, rgb(0 0 0) 22%, transparent 72%);
 -webkit-mask-image: radial-gradient(
 ellipse 110% 85% at 50% 32%,
 rgb(0 0 0) 22%,
 transparent 72%
 );
}

/* Hero headline: bg-clip-text + tight leading can shear descenders (y, g); give glyphs room */
.landing-hero-headline {
 overflow: visible;
}
.landing-hero-gradient-heading {
 overflow: visible;
 box-decoration-break: clone;
 -webkit-box-decoration-break: clone;
 background-clip: text;
 -webkit-background-clip: text;
}

/* About section: scroll reveal */
.landing-about-section .landing-about-animate {
 opacity: 0;
 transform: translate3d(0, 0.75rem, 0);
 transition:
 opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
 transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}

.landing-about-section.visible .landing-about-animate {
 opacity: 1;
 transform: translate3d(0, 0, 0);
}

.landing-about-section.visible .landing-about-highlights .landing-about-animate:nth-child(1) {
 transition-delay: 60ms;
}

.landing-about-section.visible .landing-about-highlights .landing-about-animate:nth-child(2) {
 transition-delay: 120ms;
}

.landing-about-section.visible .landing-about-pillars .landing-about-animate:nth-child(1) {
 transition-delay: 100ms;
}

.landing-about-section.visible .landing-about-pillars .landing-about-animate:nth-child(2) {
 transition-delay: 160ms;
}

.landing-about-section.visible .landing-about-pillars .landing-about-animate:nth-child(3) {
 transition-delay: 220ms;
}

@media (prefers-reduced-motion: reduce) {
 .landing-about-section .landing-about-animate {
 opacity: 1 !important;
 transform: none !important;
 transition: none !important;
 }
}

/* Why Storvv: tame hero render slightly */
.landing-why-figure-photo {
 filter: saturate(0.88) contrast(0.96) brightness(0.98);
}

.dark .landing-why-figure-photo {
 filter: saturate(0.78) contrast(1.03) brightness(0.84);
}

</style>
