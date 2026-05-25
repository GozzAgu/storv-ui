<template>
 <div class="min-h-screen bg-gradient-to-b from-[#fafafa] via-[#fafafa] to-[#f5f6f8] text-gray-900 antialiased dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-gray-100">
 <!-- Nav: glass, minimal -->
 <header
 class="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/45 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 dark:border-gray-800/55 dark:bg-slate-950/85 supports-[backdrop-filter]:dark:bg-slate-950/75 transition-[border-color,background-color] duration-300 ease-out"
 >
 <nav class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
 <div class="flex h-16 items-center justify-between gap-3 overflow-visible">
 <NuxtLink to="/" class="flex items-center overflow-visible transition-opacity hover:opacity-90">
 <img
 :src="marketingLogoSrc"
 alt="Storvv"
 class="h-9 w-auto max-h-9 origin-left object-contain will-change-transform sm:h-10 sm:max-h-10 lg:scale-110 lg:origin-left xl:scale-[1.18]"
 />
 </NuxtLink>
 <div class="hidden md:flex items-center gap-6 lg:gap-8">
 <a href="#features" class="landing-nav-link" @click.prevent="scrollToSection('features')">Features</a>
 <a href="#pricing" class="landing-nav-link" @click.prevent="scrollToSection('pricing')">Plans</a>
 <a href="#about" class="landing-nav-link" @click.prevent="scrollToSection('about')">About</a>
 <a href="#contact" class="landing-nav-link" @click.prevent="scrollToSection('contact')">Contact</a>
 <a
 :href="appOriginUrl"
 class="rounded-lg bg-gray-900 text-white text-sm font-medium px-5 py-2.5 shadow-sm outline-none transition-all duration-300 ease-out hover:bg-gray-800 hover:shadow active:scale-[0.98] dark:bg-primary-600 dark:hover:bg-primary-500"
 >
 Get Started
 </a>
 </div>
 <div class="flex items-center gap-1.5 md:hidden">
 <button
 type="button"
 @click="mobileMenuOpen = !mobileMenuOpen"
 class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-transparent text-gray-900 outline-none transition-[color,transform] duration-200 ease-out hover:text-gray-700 active:scale-[0.96] dark:text-white dark:hover:text-white/85"
 :aria-expanded="mobileMenuOpen"
 aria-controls="landing-mobile-nav"
 aria-label="Toggle menu"
 >
 <Bars3Icon v-if="!mobileMenuOpen" class="h-7 w-7" stroke-width="2" />
 <XMarkIcon v-else class="h-7 w-7" stroke-width="2" />
 </button>
 </div>
 </div>
 </nav>
 </header>

 <!-- Mobile: full-screen menu (vertical list, Buckhill-style) -->
 <Teleport to="body">
 <Transition
 enter-active-class="transition ease-out duration-200"
 enter-from-class="opacity-0"
 enter-to-class="opacity-100"
 leave-active-class="transition ease-in duration-150"
 leave-from-class="opacity-100"
 leave-to-class="opacity-0"
 >
 <div
 v-if="mobileMenuOpen"
 id="landing-mobile-nav"
 class="fixed inset-0 z-[100] flex max-h-[100dvh] flex-col bg-white md:hidden dark:bg-slate-950"
 role="dialog"
 aria-modal="true"
 aria-label="Site menu"
 >
 <div
 class="flex h-14 min-h-[3.5rem] shrink-0 items-center justify-between overflow-visible border-b border-gray-200/90 px-4 sm:px-6 dark:border-gray-800"
 >
 <NuxtLink
 to="/"
 class="flex items-center overflow-visible transition-opacity hover:opacity-90"
 @click="mobileMenuOpen = false"
 >
 <img
 :src="marketingLogoSrc"
 alt="Storvv"
 class="h-9 w-auto max-h-9 origin-left object-contain will-change-transform scale-110 sm:h-10 sm:max-h-10 sm:scale-125"
 />
 </NuxtLink>
 <button
 type="button"
 class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-900 outline-none transition-[color,transform] duration-200 ease-out hover:bg-gray-100 active:scale-[0.96] dark:text-white dark:hover:bg-white/10"
 aria-label="Close menu"
 @click="mobileMenuOpen = false"
 >
 <XMarkIcon class="h-7 w-7" stroke-width="2" />
 </button>
 </div>

 <nav class="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6" aria-label="Primary">
 <a
 href="#features"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('features'); mobileMenuOpen = false"
 >Features</a>
 <a
 href="#pricing"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('pricing'); mobileMenuOpen = false"
 >Plans</a>
 <a
 href="#about"
 class="landing-mobile-nav-link"
 @click.prevent="scrollToSection('about'); mobileMenuOpen = false"
 >About</a>
 <a
 href="#contact"
 class="landing-mobile-nav-link landing-mobile-nav-link--last"
 @click.prevent="scrollToSection('contact'); mobileMenuOpen = false"
 >Contact</a>
 </nav>

 <div class="shrink-0 border-t border-gray-200/90 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 dark:border-gray-800 dark:bg-slate-950">
 <a
 :href="appOriginUrl"
 class="flex w-full items-center justify-center rounded-full bg-gray-900 py-3.5 text-center text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-gray-800 active:scale-[0.98] dark:bg-primary-600 dark:hover:bg-primary-500"
 @click="mobileMenuOpen = false"
 >
 Get Started
 </a>
 </div>
 </div>
 </Transition>
 </Teleport>

 <!-- Hero: photo + futuristic HUD layering (clean, high contrast) -->
 <section class="landing-hero relative isolate overflow-hidden pt-24 sm:pt-28">
 <!-- Background image -->
 <div
 ref="heroBackground"
 class="absolute inset-0 bg-center bg-cover will-change-transform"
 style="background-image: url('/hero-img.jpg');"
 />
 <!-- Readability: deeper vignette, Storvv primary light (no teal shift) -->
 <div class="absolute inset-0 bg-gradient-to-b from-slate-950/72 via-slate-950/48 to-slate-950/[0.78]" aria-hidden="true" />
 <div
 class="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(59,130,246,0.11),transparent_55%),radial-gradient(circle_at_12%_22%,rgba(59,130,246,0.15),transparent_46%),radial-gradient(circle_at_88%_25%,rgba(37,99,235,0.11),transparent_44%)]"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent"
 aria-hidden="true"
 />
 <div
 class="landing-hero-grid pointer-events-none absolute inset-0 z-[1] opacity-[0.28] sm:opacity-[0.34]"
 aria-hidden="true"
 />
 <div class="pointer-events-none absolute -top-32 -right-32 z-0 h-[520px] w-[520px] animate-blob rounded-full bg-primary-400/14 blur-3xl" />
 <div class="pointer-events-none absolute -bottom-40 -left-32 z-0 h-[620px] w-[620px] animate-blob rounded-full bg-primary-500/10 blur-3xl animation-delay-2000" />
 <div
 class="pointer-events-none absolute inset-x-[6%] bottom-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
 aria-hidden="true"
 />

 <div
 class="relative z-[2] mx-auto grid max-w-6xl gap-12 px-4 pb-28 sm:gap-14 sm:px-6 sm:pb-36 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-8 lg:pb-44 xl:pb-48"
 >
 <div class="max-w-xl lg:col-span-6 xl:col-span-7">
 <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
 <p class="font-mono text-[10px] font-semibold uppercase tracking-[0.32em] text-primary-300">
 Ops console
 </p>
 <span class="hidden h-3 w-px bg-primary-500/35 sm:block" aria-hidden="true" />
 <span class="rounded-md border-0 bg-white/[0.05] px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-primary-200/95">
 v2026</span>
 </div>

 <div
 class="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-white/92 shadow-[inset_0_1px_0_0_rgba(255,255,255,.06)] backdrop-blur-xl sm:rounded-2xl"
 >
 <SparklesIcon class="h-3.5 w-3.5 shrink-0 text-primary-300" />
 Built for retail teams
 </div>

 <h1 class="landing-hero-headline mt-6 overflow-visible sm:mt-7 lg:mt-8">
 <span class="block text-[1.875rem] font-extralight leading-[1.16] tracking-[-0.03em] text-white/92 sm:text-[2.2rem] sm:leading-[1.12] lg:text-[2.75rem] lg:leading-[1.1] xl:text-[3.05rem]">
 Inventory and sales,</span>
 <span
 class="landing-hero-gradient-heading mt-1.5 block bg-gradient-to-r from-white via-white to-primary-200 bg-clip-text pb-[0.08em] text-[2.05rem] font-semibold leading-[1.22] tracking-[-0.025em] text-transparent [-webkit-background-clip:text] sm:mt-2 sm:text-[2.45rem] sm:leading-[1.2] lg:text-[3.05rem] lg:leading-[1.18] xl:text-[3.35rem] xl:leading-[1.16]"
 >
 always in sync.</span>
 </h1>

 <p class="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-white/82 sm:mt-6 sm:max-w-lg sm:text-[0.975rem]">
 One calm workspace for stock, receipts, and permissions: on-hand counts and sales history without spreadsheet chaos.
 </p>

 <div class="mt-7 flex flex-wrap gap-2 sm:gap-2.5">
 <span class="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,.04)]">
 Live stock</span>
 <span class="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,.04)]">
 Receipt-linked updates</span>
 <span class="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,.04)]">
 Multi-store ready</span>
 </div>

 <!-- Compact sync hint (mobile / tablet only; desktop uses floating card) -->
 <div class="landing-hero-float-card mt-9 flex items-center gap-4 p-[1.125rem] lg:hidden">
 <MarketingSyncLoader class="shrink-0" :size="60" />
 <p class="min-w-0 text-xs leading-relaxed text-white/85">
 Receipts and sales keep inventory current automatically. No exports.
 </p>
 </div>

 <div class="mt-9 flex flex-col gap-3 sm:mt-11 sm:flex-row sm:items-center sm:gap-4">
 <a
 :href="appOriginUrl"
 class="inline-flex min-h-[2.875rem] items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_12px_40px_-18px_rgba(59,130,246,0.45)] outline-none transition-all duration-300 ease-out hover:bg-white/97 active:scale-[0.98]"
 >
 Get Started
 </a>
 <button
 type="button"
 class="inline-flex min-h-[2.875rem] items-center justify-center rounded-xl border border-white/[0.2] bg-white/[0.07] px-7 py-3 text-sm font-semibold text-white outline-none backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,.06),0_0_0_1px_rgba(59,130,246,0.12)] transition-all duration-300 ease-out hover:border-primary-400/35 hover:bg-white/[0.11] active:scale-[0.98]"
 @click="scrollToSection('features')"
 >
 See it in action
 </button>
 </div>
 </div>

 <!-- Floating hero cards (desktop only) -->
 <div class="relative hidden min-h-[28rem] lg:col-span-6 lg:block xl:col-span-5">
 <div class="landing-hero-float-card absolute right-0 top-0 w-[19.5rem] p-4 xl:w-[20.5rem]">
 <div class="flex items-start gap-4">
 <MarketingSyncLoader class="shrink-0" :size="76" />
 <div class="min-w-0 pt-0.5">
 <p class="text-sm font-semibold tracking-tight text-white">Always current</p>
 <p class="mt-1 text-xs leading-relaxed text-white/75">
 Sales and receipts flow into stock so everyone sees the same numbers.
 </p>
 </div>
 </div>
 </div>

 <div class="landing-hero-float-card absolute right-6 top-[11.5rem] w-[17.5rem] p-4 xl:right-4 xl:w-[18.25rem]">
 <div class="flex items-center justify-between gap-2">
 <p class="text-xs font-semibold uppercase tracking-[0.12em] text-white/82">Inventory</p>
 <span
 class="inline-flex shrink-0 items-center gap-1 rounded-full border-0 bg-primary-500/[0.18] px-2 py-1 text-xs font-medium text-primary-50"
 >
 <FolderIcon class="h-3 w-3" />
 Categories
 </span>
 </div>
 <p class="mt-2 text-[0.8125rem] font-semibold leading-snug tracking-tight text-white/95">Templates that match how you sell</p>
 <p class="mt-1 text-xs leading-relaxed text-white/74">Serials, custom fields, and categories, organized, not generic.</p>
 </div>

 <div class="landing-hero-float-card absolute right-10 top-[23.5rem] w-[19rem] p-4 xl:right-6 xl:w-[19.5rem]">
 <div class="mb-2.5 flex items-center justify-between">
 <p class="text-xs font-semibold uppercase tracking-[0.12em] text-white/82">Checkout</p>
 <BellAlertIcon class="h-4 w-4 text-primary-300/90" />
 </div>
 <div class="space-y-2">
 <div class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
 <ShoppingCartIcon class="h-4 w-4 shrink-0 text-primary-200/95" />
 <span class="min-w-0 truncate text-[0.8125rem] text-white/88">Receipts in seconds</span>
 </div>
 <div class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
 <ArrowsRightLeftIcon class="h-4 w-4 shrink-0 text-primary-300/90" />
 <span class="min-w-0 truncate text-[0.8125rem] text-white/88">Returns &amp; swap-ins</span>
 </div>
 </div>
 <div class="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
 <p class="text-xs font-medium uppercase tracking-wide text-white/75">Scale</p>
 <div class="flex shrink-0 flex-wrap justify-end gap-1.5">
 <span class="rounded-lg border border-white/12 bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/85">Roles</span>
 <span class="rounded-lg border border-white/12 bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/85">Teams</span>
 <span class="rounded-lg border border-white/12 bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/85">Stores</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 <!-- Why Storvv -->
 <section
 data-section-id="problem"
 class="landing-why-section scroll-animate scroll-animate-up border-b border-slate-200 bg-white py-14 dark:border-gray-800 dark:bg-slate-950 sm:py-16 lg:py-20"
 aria-labelledby="landing-why-heading"
 >
 <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
 <header class="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
 <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
 Why teams choose Storvv</p>
 <h2
 id="landing-why-heading"
 class="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-gray-50 sm:text-3xl"
 >
 Stock, sales, and staff <span class="text-primary-600 dark:text-primary-400">in one layer</span>.
 </h2>
 <p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-gray-400 sm:text-[15px]">
 Fewer spreadsheets, clearer accountability.</p>
 </header>

 <div class="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,304px)_1fr] lg:items-start lg:gap-12">
 <figure
 class="landing-why-figure m-0 mx-auto w-full max-w-sm overflow-hidden rounded-sm border border-slate-200 bg-slate-50 lg:mx-0 lg:max-w-none dark:bg-slate-900/60"
 >
 <div class="relative aspect-[4/3] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
 <img
 :src="whySectionPhotoSrc"
 alt=""
 width="912"
 height="684"
 class="landing-why-figure-photo h-full w-full object-cover object-center"
 decoding="async"
 />
 </div>
 <figcaption class="border-t border-slate-200 px-4 py-2.5 text-xs leading-snug text-slate-600 dark:text-gray-400">
 Fewer loose ends when receipts, inventory, and permissions share one backbone.</figcaption>
 </figure>

 <ul
 class="m-0 list-none divide-y divide-slate-200 rounded-sm border border-slate-200 bg-white p-0 dark:divide-gray-700 dark:bg-slate-950"
 aria-label="What teams get"
 >
 <li v-for="(pillar, i) in whyPillars" :key="pillar.title">
 <article class="flex gap-4 p-5 sm:p-6">
 <div
 class="mt-0.5 grid size-10 shrink-0 place-items-center rounded-sm border border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-gray-200"
 >
 <component :is="pillar.icon" class="size-[1.125rem]" stroke-width="1.75" aria-hidden="true" />
 </div>
 <div class="min-w-0 flex-1">
 <p class="text-[11px] font-semibold tabular-nums leading-none text-slate-400 dark:text-gray-500">
 {{ String(i + 1).padStart(2, '0') }}</p>
 <h3 class="mt-1 text-base font-semibold tracking-tight text-slate-900 dark:text-gray-50">
 {{ pillar.title }}</h3>
 <p class="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-gray-400">
 {{ pillar.body }}</p>
 </div>
 </article>
 </li>
 </ul>
 </div>

 <div
 class="mt-10 flex flex-col items-center gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-end sm:gap-6"
 >
 <a
 href="#pricing"
 class="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold leading-none text-slate-700 underline decoration-slate-400/80 underline-offset-[4px] transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
 @click.prevent="scrollToSection('pricing')"
 >View plans</a>
 <a
 :href="appOriginUrl"
 class="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm border border-slate-900 bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:border-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500"
 >
 Get started <ArrowRightIcon class="size-4" aria-hidden="true" />
 </a>
 </div>
 </div>
 </section>

 <!-- Who uses Storvv: futuristic HUD, Storvv primary blue accents -->
 <section
 id="use-cases"
 data-section-id="use-cases"
 class="landing-who-uses-section scroll-animate scroll-animate-up relative overflow-hidden border-b border-primary-950/90 bg-[#030712] py-20 dark:border-primary-950 sm:py-28 lg:py-36"
 >
 <div class="absolute inset-0 bg-[#030712]" aria-hidden="true" />
 <div
 class="landing-who-uses-grid pointer-events-none absolute inset-0 opacity-[0.4] sm:opacity-[0.45]"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_88%_58%_at_48%_-8%,rgba(59,130,246,0.11),transparent_55%)]"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_48%_at_100%_92%,rgba(37,99,235,0.12),transparent_52%)]"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute -left-[20%] top-[-12%] h-[min(100vw,44rem)] w-[min(100vw,44rem)] rounded-full bg-primary-600/[0.07] blur-[min(140px,12vw)]"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute -right-[12%] bottom-[-26%] h-[min(92vw,38rem)] w-[min(92vw,38rem)] rounded-full bg-primary-500/[0.06] blur-[min(120px,10vw)]"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-400/55 to-transparent"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute inset-x-[10%] bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
 aria-hidden="true"
 />

 <div class="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
 <div class="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
 <div class="flex min-w-0 flex-col gap-1.5">
 <p class="font-mono text-[10px] font-semibold uppercase tracking-[0.38em] text-primary-400 sm:text-[11px]">
 Retail ops grid
 </p>
 <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
 Built for modern retail teams
 </p>
 </div>
 <div class="flex shrink-0 items-center gap-2.5">
 <span class="relative flex h-2 w-2">
 <span class="relative block h-2 w-2 rounded-[1px] bg-primary-400 shadow-[0_0_14px_rgba(96,165,250,0.65)]" />
 </span>
 <span class="font-mono text-[10px] font-medium tracking-[0.24em] text-slate-500">ACTIVE</span>
 </div>
 </div>

 <div class="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-12 lg:gap-12 lg:items-start">
 <div class="lg:col-span-5">
 <h2 class="text-[clamp(1.875rem,4.2vw,2.875rem)] font-light leading-[1.08] tracking-[-0.03em] text-white">
 <span class="block text-slate-200">Who uses</span>
 <span class="mt-2 block bg-gradient-to-r from-white via-primary-200 to-primary-300 bg-clip-text font-semibold text-transparent sm:mt-1.5">
 Storvv?
 </span>
 </h2>
 <p class="mt-7 max-w-md text-[0.9375rem] leading-[1.7] text-slate-300 sm:text-base">
 One backbone for POS, serialized stock, and staff. Quiet layout with loud clarity at every counter and branch you run.
 </p>

 <div class="mt-10 divide-y divide-white/[0.07] border-y border-white/[0.08]">
 <div class="landing-who-uses-row grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-1 py-4 sm:gap-x-6 sm:py-5">
 <span class="font-mono text-[11px] font-semibold tabular-nums tracking-wider text-primary-400">01</span>
 <div>
 <p class="text-sm font-semibold tracking-wide text-white sm:text-[0.9375rem]">Gadget &amp; IMEI desks</p>
 <p class="mt-1 text-sm leading-relaxed text-slate-400">
 Serial lines, swaps, and traceable history without brittle spreadsheets.</p>
 </div>
 </div>
 <div class="landing-who-uses-row grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-1 py-4 sm:gap-x-6 sm:py-5">
 <span class="font-mono text-[11px] font-semibold tabular-nums tracking-wider text-primary-400/90">02</span>
 <div>
 <p class="text-sm font-semibold tracking-wide text-white sm:text-[0.9375rem]">Fast-turn retail floors</p>
 <p class="mt-1 text-sm leading-relaxed text-slate-400">
 Fashion and lifestyle aisles stay on pace through peak hours and returns.</p>
 </div>
 </div>
 <div class="landing-who-uses-row grid grid-cols-[auto_1fr] items-start gap-x-5 gap-y-1 py-4 sm:gap-x-6 sm:py-5">
 <span class="font-mono text-[11px] font-semibold tabular-nums tracking-wider text-primary-400/90">03</span>
 <div>
 <p class="text-sm font-semibold tracking-wide text-white sm:text-[0.9375rem]">Multi-branch HQ</p>
 <p class="mt-1 text-sm leading-relaxed text-slate-400">
 Standard workflows across stores while each location owns its lane.</p>
 </div>
 </div>
 </div>
 </div>

 <div class="lg:col-span-7">
 <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
 <article
 class="landing-who-uses-glass group relative overflow-hidden rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] pb-px shadow-[inset_0_1px_0_0_rgba(255,255,255,.05)] backdrop-blur-2xl sm:col-span-2 sm:flex sm:min-h-[11.75rem]"
 >
 <div
 class="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gradient-to-bl from-primary-400/[0.18] via-primary-600/[0.06] to-transparent opacity-95 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
 aria-hidden="true"
 />
 <div class="relative flex flex-1 flex-col gap-6 p-6 sm:flex-row sm:items-stretch sm:p-7">
 <span class="absolute right-6 top-6 font-mono text-[9px] font-semibold tracking-[0.28em] text-primary-300">
 SYNC
 </span>
 <div class="relative shrink-0">
 <div
 class="flex size-12 items-center justify-center rounded-xl border-0 bg-gradient-to-br from-primary-500/25 to-primary-600/[0.08] text-primary-100 shadow-[inset_0_1px_0_0_rgba(147,197,253,0.2)] sm:size-14 sm:rounded-2xl"
 >
 <CubeIcon class="size-7" stroke-width="1.25" aria-hidden="true" />
 </div>
 </div>
 <div class="relative min-w-0 flex-1 sm:flex sm:flex-col sm:justify-center sm:pr-14">
 <h3 class="text-lg font-semibold tracking-tight text-white sm:text-xl">
 Serialized inventory, one ledger</h3>
 <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">
 IMEI anchors, pooled counts, receipts, and swaps stay aligned so supervisors audit with confidence.</p>
 </div>
 <div
 class="relative hidden shrink-0 self-stretch border-l border-white/[0.08] py-1 pl-6 sm:flex sm:flex-col sm:items-center sm:justify-between sm:pb-2 sm:pt-1"
 >
 <span class="font-mono text-[9px] font-medium tracking-[0.22em] text-slate-400">DEPTH</span>
 <CheckIcon class="size-7 text-primary-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.45)]" aria-hidden="true" />
 </div>
 </div>
 </article>

 <article
 class="landing-who-uses-glass relative overflow-hidden rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] p-6 pb-px shadow-[inset_0_1px_0_0_rgba(255,255,255,.05)] backdrop-blur-2xl sm:rounded-[1.35rem] sm:p-7"
 >
 <div
 class="pointer-events-none absolute -bottom-14 -left-12 h-40 w-40 rounded-full bg-gradient-to-tr from-primary-500/[0.14] to-transparent blur-2xl"
 aria-hidden="true"
 />
 <div class="relative">
 <div
 class="inline-flex size-11 items-center justify-center rounded-xl border-0 bg-gradient-to-br from-primary-500/22 to-transparent text-primary-100 shadow-[inset_0_1px_0_0_rgba(147,197,253,0.14)] sm:size-[3.15rem]"
 >
 <TagIcon class="size-[1.4rem]" stroke-width="1.25" aria-hidden="true" />
 </div>
 <p class="mt-5 font-mono text-[9px] font-medium tracking-[0.26em] text-primary-400/80">VELO</p>
 <h3 class="mt-2.5 text-[0.9375rem] font-semibold tracking-tight text-white">Faster checkout</h3>
 <p class="mt-2 text-sm leading-relaxed text-slate-300">
 Discount lines, refunds, and splits keep stock and CRM in sync at the register.</p>
 </div>
 </article>

 <article
 class="landing-who-uses-glass relative overflow-hidden rounded-[1.25rem] border border-white/[0.07] bg-white/[0.03] p-6 pb-px shadow-[inset_0_1px_0_0_rgba(255,255,255,.05)] backdrop-blur-2xl sm:rounded-[1.35rem] sm:p-7"
 >
 <div
 class="pointer-events-none absolute -bottom-12 -right-10 h-36 w-36 rounded-full bg-gradient-to-tl from-primary-600/[0.14] to-transparent blur-2xl"
 aria-hidden="true"
 />
 <div class="relative">
 <div
 class="inline-flex size-11 items-center justify-center rounded-xl border-0 bg-gradient-to-br from-primary-500/22 to-transparent text-primary-100 shadow-[inset_0_1px_0_0_rgba(147,197,253,0.14)] sm:size-[3.15rem]"
 >
 <UserGroupIcon class="size-[1.4rem]" stroke-width="1.25" aria-hidden="true" />
 </div>
 <p class="mt-5 font-mono text-[9px] font-medium tracking-[0.26em] text-primary-400/80">ROLES</p>
 <h3 class="mt-2.5 text-[0.9375rem] font-semibold tracking-tight text-white">Branch-grade access</h3>
 <p class="mt-2 text-sm leading-relaxed text-slate-300">
 Permissions match floor and HQ separately, without fragile shared master logins.</p>
 </div>
 </article>
 </div>
 </div>
 </div>
 </div>
 </section>

 <!-- About -->
 <section
 id="about"
 data-section-id="about"
 class="landing-about-chart scroll-animate scroll-animate-up scroll-mt-[4.75rem] border-y border-primary-100/40 bg-gradient-to-b from-primary-50/70 via-white to-sky-50/40 py-20 dark:border-gray-800/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 sm:py-24 lg:scroll-mt-28 lg:py-28"
 >
 <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div
 class="pointer-events-none absolute inset-0 opacity-50 dark:opacity-25"
 aria-hidden="true"
 style="background-image: radial-gradient(ellipse 55% 45% at 12% 15%, rgb(59 130 246 / 0.11), transparent 55%), radial-gradient(ellipse 50% 40% at 92% 85%, rgb(14 165 233 / 0.09), transparent 50%)"
 />
 <div class="pointer-events-none absolute left-[6%] top-0 h-56 w-56 rounded-full bg-primary-400/18 blur-3xl dark:bg-primary-500/14" />
 <div class="pointer-events-none absolute bottom-0 right-[8%] h-48 w-48 rounded-full bg-sky-300/30 blur-3xl dark:bg-cyan-500/12" />

 <div class="relative mx-auto max-w-3xl text-center">
 <p class="text-sm font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
 About Storvv
 </p>
 <h2 class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
 Store software that respects how retail really runs
 </h2>
 <p class="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
 We focus on clarity over noise: fewer tabs, fewer surprises, and a layout your team can learn in days, not weeks.
 </p>
 </div>

 <div class="relative mx-auto mt-14 max-w-[92rem] lg:mt-20">
 <div
 class="overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-slate-200/55 via-primary-100/35 to-sky-100/45 p-px shadow-lg shadow-primary-900/[0.06] dark:from-slate-800/80 dark:via-slate-900/60 dark:to-primary-950/40 dark:shadow-black/30"
 >
 <div class="grid grid-cols-1 gap-px overflow-hidden rounded-[1.2rem] bg-slate-200/70 dark:bg-white/[0.08] lg:grid-cols-3">
 <div
 class="landing-about-cell group flex min-h-[15rem] flex-col bg-gradient-to-br from-white from-35% via-white to-primary-50/55 px-6 py-8 text-left transition-[background-color,transform,box-shadow] duration-300 ease-out hover:shadow-md hover:shadow-primary-500/8 sm:min-h-[16rem] sm:px-7 sm:py-9 lg:min-h-[17.5rem] dark:from-slate-950 dark:via-slate-950 dark:to-primary-950/35 dark:hover:bg-slate-900/98"
 :style="{ transitionDelay: '32ms' }"
 >
 <div class="flex items-start justify-between gap-3">
 <span
 class="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-700 dark:bg-primary-400/15 dark:text-primary-200"
 >
 01
 </span>
 <div
 class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/14 to-primary-600/5 text-primary-600 transition-transform duration-300 ease-out group-hover:scale-[1.03] dark:from-primary-400/18 dark:to-primary-500/5 dark:text-primary-300"
 >
 <CubeIcon class="h-5 w-5 shrink-0" stroke-width="1.5" />
 </div>
 </div>
 <h3 class="mt-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
 One calm system for the floor
 </h3>
 <p class="mt-2 flex-1 text-sm leading-snug text-gray-600 dark:text-gray-400">
 Inventory, checkout, and notes in one workspace.</p>
 <p class="mt-2 text-sm leading-snug text-gray-600 dark:text-gray-400">
 Shape folders to your aisles and keep receipts sane when traffic spikes.
 </p>
 </div>

 <div
 class="landing-about-cell group flex min-h-[15rem] flex-col bg-gradient-to-br from-white from-35% via-sky-50/30 to-primary-50/50 px-6 py-8 text-left transition-[background-color,transform,box-shadow] duration-300 ease-out hover:shadow-md hover:shadow-sky-500/8 sm:min-h-[16rem] sm:px-7 sm:py-9 lg:min-h-[17.5rem] dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/25 dark:hover:bg-slate-900/98"
 :style="{ transitionDelay: '84ms' }"
 >
 <div class="flex items-start justify-between gap-3">
 <span
 class="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-700 dark:bg-primary-400/15 dark:text-primary-200"
 >
 02
 </span>
 <div
 class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/14 to-primary-600/5 text-primary-600 transition-transform duration-300 ease-out group-hover:scale-[1.03] dark:from-primary-400/18 dark:to-primary-500/5 dark:text-primary-300"
 >
 <SparklesIcon class="h-5 w-5 shrink-0" stroke-width="1.5" />
 </div>
 </div>
 <h3 class="mt-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
 Tools that feel obvious
 </h3>
 <p class="mt-2 flex-1 text-sm leading-snug text-gray-600 dark:text-gray-400">
 Owners keep the overview; managers and staff stay inside clear guardrails.</p>
 <p class="mt-2 text-sm leading-snug text-gray-600 dark:text-gray-400">
 Upgrade plans when branches or analytics need to grow.</p>
 </div>

 <div
 class="grid min-h-full grid-cols-1 gap-px self-stretch bg-slate-200/50 sm:grid-cols-3 lg:grid-cols-1 lg:grid-rows-3 dark:bg-white/[0.06]"
 >
 <div
 v-for="(pillar, idx) in aboutPillars"
 :key="pillar.title"
 class="landing-about-cell group flex min-h-[12rem] flex-col bg-gradient-to-br from-white to-primary-50/40 px-5 py-7 text-left transition-[background-color,transform,box-shadow] duration-300 ease-out hover:shadow-sm hover:shadow-primary-500/5 sm:min-h-[14rem] sm:px-6 sm:py-8 lg:min-h-0 lg:flex-1 dark:from-slate-950 dark:to-primary-950/30 dark:hover:bg-slate-900/95"
 :style="{ transitionDelay: `${136 + idx * 52}ms` }"
 >
 <div class="flex items-start justify-between gap-3">
 <span class="text-sm font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
 {{ pillar.title }}
 </span>
 <div
 class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/14 to-primary-600/5 text-primary-600 transition-transform duration-300 ease-out group-hover:scale-[1.03] dark:from-primary-400/18 dark:to-primary-500/5 dark:text-primary-300"
 >
 <component :is="pillar.icon" class="h-5 w-5 shrink-0" stroke-width="1.5" />
 </div>
 </div>
 <p class="mt-3 flex-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
 {{ pillar.body }}
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <p class="relative mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
 See the walkthrough with screenshots in
 <a
 href="#features"
 class="font-medium text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
 @click.prevent="scrollToSection('features')"
 >How Storvv works</a>
 or
 <a
 href="#contact"
 class="font-medium text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
 @click.prevent="scrollToSection('contact')"
 >talk to us</a>.
 </p>
 </div>
 </section>

 <!-- How it works: high-impact timeline + gradient preview strip -->
 <section
 id="features"
 data-section-id="features"
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
 <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-400 sm:text-[11px]">
 The playbook
 </p>
 <h2
 class="mt-1.5 bg-gradient-to-r from-white via-primary-50 to-primary-200/95 bg-clip-text text-xl font-bold tracking-tight text-transparent sm:text-2xl"
 >
 How Storvv works
 </h2>
 <p class="mt-2 max-w-md text-[11px] font-medium leading-relaxed text-slate-400 sm:text-xs sm:leading-relaxed">
 Five crisp steps from a fresh account to a floor that runs calmer, every day.
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
 <h3 class="text-[12px] font-semibold leading-snug text-white sm:text-[13px]">
 {{ step.title }}
 </h3>
 <div
 class="mt-1 text-[11px] leading-[1.55] text-slate-400 sm:text-xs sm:leading-relaxed [&_span]:font-medium [&_span]:text-primary-100"
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

 <!-- Product: core → supporting → enterprise → more features (tabs) -->
 <section
 id="capabilities-grid"
 data-section-id="capabilities-grid"
 class="scroll-animate scroll-animate-up relative scroll-mt-[4.75rem] lg:scroll-mt-28"
 >
 <!-- Intro strip -->
 <div class="relative overflow-hidden border-b border-gray-100 bg-white py-12 dark:border-gray-800 dark:bg-slate-950 sm:py-14">
 <div
 class="pointer-events-none absolute inset-0 opacity-35 dark:opacity-20"
 aria-hidden="true"
 style="background-image: radial-gradient(ellipse 72% 55% at 18% 0%, rgb(59 130 246 / 0.07), transparent 50%)"
 />
 <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Product</p>
 <h2 class="mt-2 max-w-3xl text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl lg:text-4xl">
 Built for scanning: three big ideas first, then everything else.
 </h2>
 <p class="mt-3 max-w-2xl text-sm leading-snug text-gray-600 dark:text-gray-400">
 Core differentiators up front. Compact add-ons next. Enterprise lifts the ceiling. Dive into tabs for the rest.</p>
 <p class="mt-2 text-xs text-gray-500 dark:text-gray-500">
 Questions?
 <a
 href="#faq"
 class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
 @click.prevent="scrollToSection('faq')"
 >FAQ</a>
 · After sign-in, open Help for walkthroughs.
 </p>
 </div>
 </div>

 <!-- Band 1: Core props (classic gap-px grid) -->
 <div id="core-highlights" class="relative border-b border-gray-100 bg-white py-12 dark:border-gray-800 dark:bg-slate-950 sm:py-16">
 <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">Core value props</h3>
 <p class="mt-1 max-w-2xl text-sm leading-snug text-gray-600 dark:text-gray-400">
 Inventory, receipts, and team structure: the three things scanners should remember.</p>
 </div>
 <div class="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
 <div
 class="mx-auto max-w-[92rem] overflow-hidden rounded-[1.25rem] bg-slate-100/65 dark:bg-white/[0.05]"
 >
 <div class="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
 <div
 v-for="cap in landingCoreGridItems"
 :key="cap.title"
 class="group relative bg-white px-6 py-9 text-center transition-colors duration-300 ease-out hover:bg-neutral-50/90 sm:px-7 sm:py-10 dark:bg-slate-950 dark:hover:bg-slate-900/95"
 >
 <div
 class="mx-auto mb-5 flex h-[4.75rem] w-[4.75rem] items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
 >
 <component :is="cap.icon" class="h-[4.5rem] w-[4.5rem] shrink-0 text-gray-900 dark:text-gray-100" stroke-width="1.35" />
 </div>
 <h3 class="mb-2.5 text-lg font-semibold text-gray-900 dark:text-gray-100">{{ cap.title }}</h3>
 <p class="mx-auto max-w-sm text-sm leading-snug text-gray-600 dark:text-gray-400 sm:max-w-none">
 {{ cap.description }}</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- Band 2: Supporting -->
 <div class="relative border-b border-gray-100 bg-neutral-50/95 py-12 dark:border-gray-800 dark:bg-slate-900/85 sm:py-16">
 <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">Supporting features</h3>
 <p class="mt-1 max-w-2xl text-sm leading-snug text-gray-600 dark:text-gray-400">
 Same airy grid styling as above, with dense copy tightened to ~two lines.</p>
 </div>
 <div class="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
 <div
 class="mx-auto max-w-[92rem] overflow-hidden rounded-[1.25rem] bg-slate-100/65 dark:bg-white/[0.05]"
 >
 <div class="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
 <div
 v-for="cap in landingSupportingGridItems"
 :key="cap.title"
 class="group relative bg-white px-6 py-9 text-center transition-colors duration-300 ease-out hover:bg-neutral-50/90 sm:px-7 sm:py-10 dark:bg-slate-950 dark:hover:bg-slate-900/95"
 >
 <div
 class="mx-auto mb-5 flex h-[4.75rem] w-[4.75rem] items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
 >
 <component :is="cap.icon" class="h-[4.5rem] w-[4.5rem] shrink-0 text-gray-900 dark:text-gray-100" stroke-width="1.35" />
 </div>
 <h3 class="mb-2.5 text-lg font-semibold text-gray-900 dark:text-gray-100">{{ cap.title }}</h3>
 <p class="mx-auto max-w-xs text-sm leading-snug text-gray-600 dark:text-gray-400 sm:max-w-none">
 {{ cap.description }}</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- Band 3: Enterprise (same grid chrome, rhythm via band headline) -->
 <div id="enterprise-features" class="relative border-b border-gray-100 bg-white py-12 dark:border-gray-800 dark:bg-slate-950 sm:py-16">
 <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div class="flex flex-wrap items-start justify-between gap-4">
 <div class="max-w-2xl">
 <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Enterprise</p>
 <h3 class="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">For chains & auditors</h3>
 <p class="mt-1 text-sm leading-snug text-gray-600 dark:text-gray-400">
 Mirrors the Enterprise column on pricing so procurement teams know what expands.</p>
 </div>
 <a
 href="#pricing"
 class="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:border-primary-200 hover:text-primary-800 dark:bg-slate-900 dark:text-gray-100 dark:hover:border-primary-500/50"
 @click.prevent="scrollToSection('pricing')"
 >Compare plans</a>
 </div>
 </div>
 <div class="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
 <div class="mx-auto max-w-[92rem] overflow-hidden rounded-[1.25rem] bg-slate-100/65 dark:bg-white/[0.05]">
 <div class="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
 <div
 v-for="cap in landingEnterpriseGridItems"
 :key="cap.title"
 class="group relative bg-white px-6 py-9 text-center transition-colors duration-300 ease-out hover:bg-neutral-50/90 sm:px-7 sm:py-10 dark:bg-slate-950 dark:hover:bg-slate-900/95"
 >
 <div
 class="mx-auto mb-5 flex h-[4.75rem] w-[4.75rem] items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
 >
 <component :is="cap.icon" class="h-[4.5rem] w-[4.5rem] shrink-0 text-gray-900 dark:text-gray-100" stroke-width="1.35" />
 </div>
 <h3 class="mb-2.5 text-lg font-semibold text-gray-900 dark:text-gray-100">{{ cap.title }}</h3>
 <p class="mx-auto max-w-xs text-sm leading-snug text-gray-600 dark:text-gray-400 sm:max-w-none">
 {{ cap.description }}</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <!-- Band 4: More features (tabs + same classic grid rows) -->
 <div id="more-features" class="relative bg-neutral-50/95 py-12 dark:bg-slate-900/85 sm:py-16">
 <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-xl">More features</h3>
 <p class="mt-1 max-w-2xl text-sm leading-snug text-gray-600 dark:text-gray-400">
 Pick a category: each tab inherits the centered icon grid you see above.</p>
 <div
 class="landing-more-features-tablist mt-6 flex flex-wrap gap-2"
 role="tablist"
 aria-label="Feature categories"
 >
 <button
 v-for="tab in landingMoreFeatureTabs"
 :key="tab.id"
 type="button"
 role="tab"
 :aria-selected="moreFeaturesTab === tab.id"
 class="landing-more-features-tab rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
 :class="
 moreFeaturesTab === tab.id
 ? 'border-primary-500 bg-primary-600 text-white shadow-sm dark:border-primary-400 dark:bg-primary-500'
 : 'border-gray-200/90 bg-white text-gray-700 hover:border-primary-200 hover:text-primary-800 dark:bg-slate-950 dark:text-gray-300 dark:hover:border-primary-500/40'
 "
 @click="moreFeaturesTab = tab.id"
 >
 {{ tab.label }}
 </button>
 </div>
 </div>
 <div class="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
 <div
 role="tabpanel"
 class="mx-auto max-w-[92rem] overflow-hidden rounded-[1.25rem] bg-slate-100/65 dark:bg-white/[0.05]"
 :aria-label="`Features in ${moreFeaturesTab}`"
 >
 <div class="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
 <div
 v-for="row in landingMoreFeaturesPanelModel.rows"
 :key="row.title"
 class="group relative bg-white px-6 py-9 text-center transition-colors duration-300 ease-out hover:bg-neutral-50/90 sm:px-7 sm:py-10 dark:bg-slate-950 dark:hover:bg-slate-900/95"
 >
 <div
 class="mx-auto mb-5 flex h-[4.75rem] w-[4.75rem] items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
 >
 <component
 :is="landingMoreFeaturesPanelModel.icon"
 class="h-[4.5rem] w-[4.5rem] shrink-0 text-gray-900 dark:text-gray-100"
 stroke-width="1.35"
 />
 </div>
 <h3 class="mb-2.5 text-lg font-semibold text-gray-900 dark:text-gray-100">{{ row.title }}</h3>
 <p class="mx-auto max-w-xs text-sm leading-snug text-gray-600 dark:text-gray-400 sm:max-w-none">
 {{ row.blurb }}</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 <!-- Pricing -->
 <section id="pricing" data-section-id="pricing" class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-gradient-to-b from-white to-slate-50/65 py-20 dark:from-slate-950 dark:to-slate-900/80 lg:scroll-mt-28 lg:py-28 sm:py-24">
 <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
 <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center">
 Plans that fit your size
 </h2>
 <p class="mt-4 text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto">
 Start free with Micro for a single store; upgrade to Medium for analytics, teams, and a second branch; choose Enterprise for unlimited scale, stock transfers, and copy-from-branch.
 </p>
 <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
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
 <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Single store, solo or very small team</p>
 <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">FREE</p>
 <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
 <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />1 store · 1 department · up to 2 staff</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Full inventory, receipts, returns & customers</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Dashboard, notifications & help center</li>
 <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />WhatsApp receipts (10/month)</li>
 <li class="flex items-start gap-2 text-gray-500 dark:text-gray-500"><span class="shrink-0">−</span> No analytics, activity logs, or multi-store tools</li>
 </ul>
 <a :href="appOriginUrl" class="mt-6 flex w-full items-center justify-center rounded-sm bg-gray-900 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800">Get Started</a>
 </div>
 <!-- Medium: 2 stores, 10 depts, 25 staff. Analytics, duplicate folders/items. No multi-store sync. -->
 <div data-section-id="pricing-2" class="scroll-animate scroll-animate-scale stagger-2 relative rounded-3xl bg-primary-50/35 p-6 flex flex-col dark:bg-slate-900">
 <p class="absolute -top-3 right-5 rounded-full bg-primary-500 px-3 py-1 text-sm font-semibold text-white">
 Most popular
 </p>
 <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Medium</h3>
 <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Growing business, multiple locations or teams</p>
 <div class="mt-4 flex items-baseline gap-2">
 <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isYearly ? mediumYearlyPrice : mediumMonthlyPrice }}</span>
 <span v-if="isYearly" class="text-sm text-gray-400 line-through">{{ mediumYearlyListPrice }}</span>
 </div>
 <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
 <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
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
 <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Larger operations, central management</p>
 <div class="mt-4 flex items-baseline gap-2">
 <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isYearly ? enterpriseYearlyPrice : enterpriseMonthlyPrice }}</span>
 <span v-if="isYearly" class="text-sm text-gray-400 line-through">{{ enterpriseYearlyListPrice }}</span>
 </div>
 <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
 <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
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
 <p class="text-sm text-gray-600 dark:text-gray-400">
 Ready to try the workspace? You can start on Micro and move up when your team is ready.
 </p>
 <a
 :href="appOriginUrl"
 class="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 sm:w-auto dark:bg-primary-600 dark:hover:bg-primary-500"
 >
 Get Started
 </a>
 </div>
 </section>

 <!-- Security & trust: calm gradient layout (no busy photo overlay) -->
 <section
 data-section-id="security"
 class="scroll-animate scroll-animate-up relative overflow-hidden border-t border-white/[0.06] bg-[#06080f] py-16 sm:py-20 lg:py-[5.25rem]"
 >
 <div
 class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-5%,rgba(20,63,141,0.16),transparent_58%)]"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute -right-20 top-[38%] h-72 w-72 -translate-y-1/2 rounded-full bg-primary-500/[0.07] blur-3xl dark:bg-primary-400/[0.08]"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-sky-500/[0.05] blur-3xl"
 aria-hidden="true"
 />
 <div
 class="pointer-events-none absolute inset-0 opacity-[0.04]"
 aria-hidden="true"
 style="background-image: linear-gradient(rgb(255 255 255 / 0.08) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.08) 1px, transparent 1px); background-size: 48px 48px;"
 />

 <div class="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
 <div class="mx-auto max-w-2xl text-center">
 <p class="text-sm font-semibold uppercase tracking-[0.14em] text-slate-300">Trust</p>
 <h2 class="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
 Security you can trust
 </h2>
 <p class="mt-3 text-[15px] leading-relaxed text-slate-300 sm:text-base">
 Sensible safeguards for inventory, receipts, and team access. No flashy stock-photo clutter, just what matters for everyday operations.
 </p>
 </div>

 <div class="mx-auto mt-11 grid max-w-4xl gap-4 sm:mt-14 sm:grid-cols-3 sm:gap-5">
 <div
 class="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.035] px-5 py-5 text-left shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-sm transition-colors hover:border-white/[0.11] hover:bg-white/[0.045] sm:text-center sm:py-6"
 >
 <span
 class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-primary-200 sm:mx-auto"
 >
 <ShieldCheckIcon class="h-5 w-5" stroke-width="1.75" aria-hidden="true" />
 </span>
 <h3 class="text-sm font-semibold text-white sm:text-[15px]">Secure connections</h3>
 <p class="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
 Sessions use HTTPS in transit. Your workspace runs on hardened, cloud-hosted infrastructure engineered for uptime.
 </p>
 </div>
 <div
 class="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.035] px-5 py-5 text-left shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-sm transition-colors hover:border-white/[0.11] hover:bg-white/[0.045] sm:text-center sm:py-6"
 >
 <span
 class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-primary-200 sm:mx-auto"
 >
 <KeyIcon class="h-5 w-5" stroke-width="1.75" aria-hidden="true" />
 </span>
 <h3 class="text-sm font-semibold text-white sm:text-[15px]">Role-based control</h3>
 <p class="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
 Super admins, managers, and staff each see appropriate actions. Sensitive inventory setup stays restricted to admins.
 </p>
 </div>
 <div
 class="flex flex-col rounded-xl border border-white/[0.08] bg-white/[0.035] px-5 py-5 text-left shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-sm transition-colors hover:border-white/[0.11] hover:bg-white/[0.045] sm:text-center sm:py-6"
 >
 <span
 class="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-primary-200 sm:mx-auto"
 >
 <LockClosedIcon class="h-5 w-5" stroke-width="1.75" aria-hidden="true" />
 </span>
 <h3 class="text-sm font-semibold text-white sm:text-[15px]">Your operational data</h3>
 <p class="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
 We treat your store data as yours to run the service. Read how we handle it in our Privacy and Terms policies.
 </p>
 </div>
 </div>

 <p class="mx-auto mt-10 max-w-lg text-center text-sm leading-relaxed text-slate-400">
 <NuxtLink
 to="/privacy"
 class="font-medium text-slate-300 underline decoration-slate-500/60 underline-offset-2 transition-colors hover:text-white"
 >
 Privacy policy
 </NuxtLink>
 <span class="text-slate-600">&nbsp;·&nbsp;</span>
 <NuxtLink
 to="/terms"
 class="font-medium text-slate-300 underline decoration-slate-500/60 underline-offset-2 transition-colors hover:text-white"
 >
 Terms of service
 </NuxtLink>
 </p>
 </div>
 </section>

 <!-- FAQ -->
 <section id="faq" data-section-id="faq" class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-[#f5f7f9] py-20 dark:bg-slate-900/55 lg:scroll-mt-28 lg:py-28 sm:py-24">
 <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
 <p class="text-sm uppercase tracking-[0.12em] font-semibold text-gray-600 dark:text-gray-300 text-center">Frequently asked questions</p>
 <h2 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center">Common questions</h2>
 <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">Answers to help you understand Storvv and billing.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Most stores are up and running within minutes. Create your store profile, set up your first inventory folder, and you're ready to start managing sales. No coding or technical expertise needed.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Not at all. Storvv is built with simplicity in mind. The interface is intuitive and straightforward: if you can use a smartphone, you can use Storvv. We've designed it specifically for store owners and managers.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Absolutely. Storvv provides a unified view of all your sales channels. Whether transactions happen at your physical location or through other channels, everything is consolidated in one dashboard for complete visibility.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products. Each folder can have its own template, and you can enable serial number tracking for individual items.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Yes! Storvv supports bulk import from Excel spreadsheets. Simply upload your Excel file, and items will be automatically added to your inventory folders. You can also export your inventory data to Excel for backup or analysis.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Customers are automatically created when you generate receipts. They're tracked by email, phone, or address. View complete purchase history, total spending, and order counts for each customer, all without manual data entry.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Swap-in transactions allow customers to exchange items. When a customer swaps in an item, it's automatically added back to your inventory, and the transaction is tracked. Perfect for device exchanges, trade-ins, or returns.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Storvv supports three roles: Super Admin (full access), Manager (can manage assigned folders and staff), and Staff (limited access based on department). You can control folder access at the department level, ensuring staff only see relevant inventory.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Storvv automatically tracks low stock items based on your configured threshold. For serial number folders, it alerts when available items fall below the threshold. For bulk items, it counts individual items with low quantities. Get notified on your dashboard.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Yes! Premium plans support multiple store locations. Each store has its own inventory folders, receipts, and staff. Manage everything from one centralized dashboard while keeping store data separate.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Yes, absolutely. Storvv uses enterprise-grade security to protect all your data. Your information is encrypted, and we never share your data without your explicit permission.</p>
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
 <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
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

 <!-- Contact -->
 <section
 id="contact"
 data-section-id="contact"
 class="landing-contact-chart scroll-animate scroll-animate-up scroll-mt-[4.75rem] border-y border-gray-100/70 bg-gradient-to-b from-[#f7f8fa] via-white to-[#fafafa] pt-20 pb-10 dark:border-gray-800/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 sm:pt-24 sm:pb-12 lg:scroll-mt-28 lg:pt-24 lg:pb-10"
 >
 <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
 <div class="pointer-events-none absolute left-[6%] top-0 h-44 w-44 rounded-full bg-primary-400/10 blur-3xl dark:bg-primary-500/10" />
 <div class="pointer-events-none absolute bottom-0 right-[8%] h-36 w-36 rounded-full bg-slate-300/20 blur-3xl dark:bg-slate-600/12" />

 <div class="relative mx-auto max-w-3xl text-center">
 <p class="text-sm font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-400">
 Contact
 </p>
 <h2 class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-gray-100">
 Get in touch
 </h2>
 <p class="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-400">
 Questions, feedback, or partnership ideas. We read every message and reply as soon as we can.
 </p>
 </div>

 <div class="relative mx-auto mt-12 max-w-[92rem] lg:mt-16">
 <div class="overflow-hidden rounded-[1.25rem] bg-slate-100/65 dark:bg-white/[0.05]">
 <div class="grid grid-cols-1 gap-px lg:grid-cols-3">
 <div
 class="landing-contact-cell group flex min-h-[12rem] flex-col bg-white px-6 py-8 text-left transition-[background-color,box-shadow] duration-300 ease-out hover:bg-neutral-50/90 hover:shadow-sm sm:min-h-[13rem] sm:px-7 sm:py-9 lg:min-h-[14.5rem] dark:bg-slate-950 dark:hover:bg-slate-900/95"
 :style="{ transitionDelay: '28ms' }"
 >
 <div class="flex items-start justify-between gap-3">
 <span
 class="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-700 dark:bg-primary-400/15 dark:text-primary-200"
 >
 01
 </span>
 <div
 class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/14 to-primary-600/5 text-primary-600 transition-transform duration-300 ease-out group-hover:scale-[1.03] dark:from-primary-400/18 dark:to-primary-500/5 dark:text-primary-300"
 >
 <EnvelopeIcon class="h-5 w-5 shrink-0" stroke-width="1.5" />
 </div>
 </div>
 <h3 class="mt-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
 Say hello
 </h3>
 <p class="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
 Tell us what you are trying to solve, what store type you run, or what would make Storvv a better fit. We use it to prioritize what we build next.
 </p>
 </div>

 <div
 class="landing-contact-cell group flex min-h-[12rem] flex-col bg-white px-6 py-8 text-left transition-[background-color,box-shadow] duration-300 ease-out hover:bg-neutral-50/90 hover:shadow-sm sm:min-h-[13rem] sm:px-7 sm:py-9 lg:min-h-[14.5rem] dark:bg-slate-950 dark:hover:bg-slate-900/95"
 :style="{ transitionDelay: '80ms' }"
 >
 <div class="flex items-start justify-between gap-3">
 <span
 class="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-700 dark:bg-primary-400/15 dark:text-primary-200"
 >
 02
 </span>
 <div
 class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/14 to-primary-600/5 text-primary-600 transition-transform duration-300 ease-out group-hover:scale-[1.03] dark:from-primary-400/18 dark:to-primary-500/5 dark:text-primary-300"
 >
 <GlobeAltIcon class="h-5 w-5 shrink-0" stroke-width="1.5" />
 </div>
 </div>
 <h3 class="mt-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
 Email us directly
 </h3>
 <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
 For anything quick or informal, you can skip the form.
 </p>
 <a
 href="mailto:hello@storvv.com"
 class="mt-4 inline-flex w-fit text-sm font-semibold text-primary-600 underline-offset-2 transition-colors hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
 >
 hello@storvv.com
 </a>
 </div>

 <div
 class="landing-contact-cell group flex min-h-[12rem] flex-col justify-between bg-white px-6 py-8 text-left transition-[background-color,box-shadow] duration-300 ease-out hover:bg-neutral-50/90 hover:shadow-sm sm:min-h-[13rem] sm:px-7 sm:py-9 lg:min-h-[14.5rem] dark:bg-slate-950 dark:hover:bg-slate-900/95"
 :style="{ transitionDelay: '132ms' }"
 >
 <div class="flex items-start justify-between gap-3">
 <span
 class="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-primary-500/10 text-sm font-bold text-primary-700 dark:bg-primary-400/15 dark:text-primary-200"
 >
 03
 </span>
 <div
 class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/14 to-primary-600/5 text-primary-600 transition-transform duration-300 ease-out group-hover:scale-[1.03] dark:from-primary-400/18 dark:to-primary-500/5 dark:text-primary-300"
 >
 <DocumentTextIcon class="h-5 w-5 shrink-0" stroke-width="1.5" />
 </div>
 </div>
 <div>
 <h3 class="mt-4 text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">
 Structured form
 </h3>
 <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
 Share details in one place. Best for demos, partnerships, or longer questions.
 </p>
 </div>
 <button
 type="button"
 class="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-base sm:w-auto active:scale-[0.98]"
 @click="showContactFormModal = true"
 >
 Contact us
 <ArrowRightIcon class="h-5 w-5 shrink-0" />
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

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
import whySectionPhotoSrc from '~/assets/marketing/questions.jpg'

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
 title: 'Set up your store',
 html: 'Name, currency, timezone, receipts, taxes, and payments your team uses. Everyone sees the same clean defaults.',
 },
 {
 sectionId: 'step-2',
 num: '02',
 icon: markRaw(UsersSolidIcon),
 title: 'Departments & staff',
 html: 'Invite people with roles, then tighten folder access so staff only touches what matters.',
 },
 {
 sectionId: 'step-3',
 num: '03',
 icon: markRaw(RectangleStackSolidIcon),
 title: 'Organize inventory',
 html: 'Templates, Excel imports, SKU and serial-ready fields.<br /><span class="text-slate-500">Enterprise: <span class="font-medium text-primary-100">Copy from branch</span> for layouts without rebuilding stock.</span>',
 },
 {
 sectionId: 'step-4',
 num: '04',
 icon: markRaw(ReceiptPercentSolidIcon),
 title: 'Sales & receipts',
 html: 'Sell fast with discounts, swaps, returns, multi-pay receipts, light CRM capture as you go.',
 },
 {
 sectionId: 'step-5',
 num: '05',
 icon: markRaw(PresentationChartLineSolidIcon),
 title: 'Monitor & analyze',
 html: 'Dashboards, bestselling lines, lows, pacing. Upgrade when you want deeper exports.',
 },
]

type WhyPillar = { title: string; body: string; icon: Component }

/** “Why Storvv”: three outcomes (paired with bundled photo in markup). */
const whyPillars: WhyPillar[] = [
 {
 title: 'Career growth for your team',
 body: 'Roles and scoped access so shifts run consistently and mistakes at the till drop.',
 icon: markRaw(UsersIcon),
 },
 {
 title: 'Visibility that scales',
 body: 'Trends, fast sellers, low stock, and light CRM cues in dashboards instead of spreadsheets.',
 icon: markRaw(ChartBarIcon),
 },
 {
 title: 'Simple operations',
 body: 'One workflow for inventory, receipts, and handoffs, repeatable as you hire and expand.',
 icon: markRaw(ArrowPathIcon),
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

let mobileMenuMql: MediaQueryList | null = null
function closeMobileMenuIfDesktop() {
 if (mobileMenuMql?.matches) mobileMenuOpen.value = false
}

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
const heroBackground = ref<HTMLElement | null>(null)
const openFaqItems = ref<Set<number>>(new Set())

const toggleFaq = (index: number) => {
 const next = new Set(openFaqItems.value)
 if (next.has(index)) next.delete(index)
 else next.add(index)
 openFaqItems.value = next
}

/** Homepage feature grids: centered icon stack (classic marketing grid cells). */
interface LandingFeatureGridCell {
 icon: Component
 title: string
 description: string
}

interface LandingMoreTab {
 id: string
 label: string
 /** Icon reused for cells in this tab panel (classic grid parity). */
 gridIcon: Component
 items: { title: string; blurb: string }[]
}

const landingCoreGridItems: LandingFeatureGridCell[] = [
 {
 icon: FolderIcon,
 title: 'Inventory tracking',
 description:
 'Serial lines or pooled counts with rich folders. Search ties items, IMEIs, receipts, and alerts together.',
 },
 {
 icon: ReceiptPercentIcon,
 title: 'Receipts & sales',
 description:
 'Discount lines, swaps, refunds, split payments. Each checkout keeps stock and customer history aligned.',
 },
 {
 icon: UserGroupIcon,
 title: 'Teams & departments',
 description:
 'Super Admin, Manager, Staff scoped to folders. Medium+ scales departments without retraining the floor.',
 },
]

const landingSupportingGridItems: LandingFeatureGridCell[] = [
 {
 icon: BellAlertIcon,
 title: 'Low-stock alerts',
 description: 'Per-folder thresholds so bestsellers shout before shelves go empty.',
 },
 {
 icon: DocumentTextIcon,
 title: 'Excel import & export',
 description: 'Bulk load spreadsheets and export clean catalogs when finance asks.',
 },
 {
 icon: ShieldCheckIcon,
 title: 'Activity logs',
 description: 'Medium+: dated trails supervisors can skim before approving changes.',
 },
 {
 icon: UsersIcon,
 title: 'CRM from receipts',
 description: 'Customer profiles accumulate every time optional fields hit a receipt.',
 },
 {
 icon: MagnifyingGlassIcon,
 title: 'Unified search',
 description: 'One header search for inventory, receipts, CRM, plus admin lookups.',
 },
 {
 icon: ChartBarIcon,
 title: 'Analytics & exports',
 description: 'Medium+: pacing, tops, busiest hours, then CSV-friendly summaries.',
 },
]

const landingEnterpriseGridItems: LandingFeatureGridCell[] = [
 {
 icon: BanknotesIcon,
 title: 'Stock loans',
 description: 'Lend serialized lines then sell via receipts or borrower-only flows.',
 },
 {
 icon: ArrowPathIcon,
 title: 'Branch transfers',
 description: 'Move unsold units with lineage that satisfies consolidated reporting.',
 },
 {
 icon: Square2StackIcon,
 title: 'Copy from branch',
 description: 'Clone folder templates Enterprise-wide without overwriting live qty.',
 },
 {
 icon: LockClosedIcon,
 title: 'Permissions & audits',
 description: 'Tighter governance across branches with enterprise-grade oversight.',
 },
]

const landingMoreFeatureTabs: LandingMoreTab[] = [
 {
 id: 'inventory',
 label: 'Inventory',
 gridIcon: CubeIcon,
 items: [
 { title: 'Returns & swap-ins', blurb: 'Walk back a receipt without orphaned stock.' },
 { title: 'Serial vs pooled', blurb: 'Pick fidelity per gadget, apparel, or consumable folder.' },
 { title: 'Templates & duplicates', blurb: 'Reuse folder shapes; Medium+ dedup helpers.' },
 ],
 },
 {
 id: 'sales',
 label: 'Sales',
 gridIcon: ReceiptPercentIcon,
 items: [
 { title: 'Layouts & printers', blurb: 'Readable labels for counter and auditors.' },
 { title: 'Multi-payment tenders', blurb: 'Combine cash + transfer (+POS) cleanly.' },
 { title: 'Customer capture', blurb: 'Capture only what merchandising needs.' },
 ],
 },
 {
 id: 'teams',
 label: 'Teams',
 gridIcon: UserGroupIcon,
 items: [
 { title: 'Invites & sessions', blurb: 'Provision fast without sharing master accounts.' },
 { title: 'Department slices', blurb: 'Mirror floor vs back office vs ecommerce pods.' },
 { title: 'Notifications', blurb: 'Approve, restock, nudge staff where they work.' },
 ],
 },
 {
 id: 'reporting',
 label: 'Reporting',
 gridIcon: ChartBarIcon,
 items: [
 { title: 'Dashboard pulse', blurb: 'Quick revenue + inventory health readouts.' },
 { title: 'Exports', blurb: 'Push CSV-friendly summaries (plan-gated).' },
 { title: 'Transfer history', blurb: 'Enterprise sync leaves an audit-friendly trail.' },
 ],
 },
 {
 id: 'platform',
 label: 'Platform',
 gridIcon: GlobeAltIcon,
 items: [
 { title: 'Stores per plan', blurb: 'Micro: 1 · Medium: 2 · Enterprise: unlimited.' },
 { title: 'Locales & currency', blurb: 'Match receipts to how each market prices.' },
 { title: 'Profile & security', blurb: 'Themes, 2FA, billing, sessions in one hub.' },
 ],
 },
]

const moreFeaturesTab = ref<LandingMoreTab['id']>('inventory')

const landingMoreFeaturesPanelModel = computed(() => {
 const tab =
 landingMoreFeatureTabs.find((t) => t.id === moreFeaturesTab.value) ?? landingMoreFeatureTabs[0]!
 return { icon: tab.gridIcon, rows: tab.items }
})

const aboutPillars = [
 {
 title: 'Focus',
 body: 'Stock, sales, and customers linked the way your books expect.',
 icon: Square2StackIcon,
 },
 {
 title: 'Team',
 body: 'Roles and permissions that match how shops delegate day to day.',
 icon: UserGroupIcon,
 },
 {
 title: 'Scale',
 body: 'From one branch to several, without starting your setup from zero.',
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

let rafId: number | null = null

const handleScroll = () => {
 // Show button when user scrolls down more than 400px
 showBackToTop.value = window.scrollY > 400

 // Use requestAnimationFrame for smooth parallax
 if (rafId !== null) {
 cancelAnimationFrame(rafId)
 }
 
 rafId = requestAnimationFrame(() => {
 // Parallax effect for hero media
 if (!heroBackground.value) return

 const scrolled = window.scrollY
 const heroSection = heroBackground.value.closest('section')
 const heroHeight = heroSection?.offsetHeight || 0

 // Only apply parallax when scrolling within hero section
 if (heroHeight > 0 && scrolled < heroHeight) {
 const parallaxSpeed = 0.12
 const translateY = scrolled * parallaxSpeed
 heroBackground.value.style.transform = `translate3d(0, ${translateY}px, 0) scale(1.06)`
 return
 }

 // Lock position when past hero section
 const maxTranslate = heroHeight * 0.12
 heroBackground.value.style.transform = `translate3d(0, ${maxTranslate}px, 0) scale(1.06)`
 })
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
 if (rafId !== null) {
 cancelAnimationFrame(rafId)
 }
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

/* Top nav in-page links: primary underline draws in from the left */
.landing-nav-link {
 position: relative;
 display: inline-block;
 padding-bottom: 2px;
 font-size: 0.875rem;
 line-height: 1.25rem;
 font-weight: 500;
 color: rgb(75 85 99);
 outline: none;
 transition: color 0.25s ease-out;
}
.landing-nav-link:hover,
.landing-nav-link:focus-visible {
 color: rgb(17 24 39);
}
.landing-nav-link::after {
 content: '';
 position: absolute;
 left: 0;
 right: 0;
 bottom: 0;
 height: 2px;
 border-radius: 9999px;
 background: rgb(59 130 246);
 transform: scaleX(0);
 transform-origin: left center;
 transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
 opacity: 0.9;
 pointer-events: none;
}
@media (hover: hover) and (pointer: fine) {
 .landing-nav-link:hover::after {
 transform: scaleX(1);
 }
}
.landing-nav-link:focus-visible::after {
 transform: scaleX(1);
}

/* Full-screen mobile menu: block links (desktop .landing-nav-link is inline-block) */
.landing-mobile-nav-link {
 display: block;
 width: 100%;
 border-bottom: 1px solid rgb(243 244 246);
 padding-top: 1rem;
 padding-bottom: 1rem;
 font-size: 1.125rem;
 line-height: 1.75rem;
 font-weight: 600;
 color: rgb(17 24 39);
 outline: none;
 transition: color 0.2s ease-out, background-color 0.2s ease-out;
}
.landing-mobile-nav-link:hover,
.landing-mobile-nav-link:focus-visible {
 color: rgb(59 130 246);
}
.landing-mobile-nav-link--last {
 border-bottom-width: 0;
}
.dark .landing-mobile-nav-link {
 border-bottom-color: rgb(31 41 55);
 color: rgb(243 244 246);
}
.dark .landing-mobile-nav-link:hover,
.dark .landing-mobile-nav-link:focus-visible {
 color: rgb(96 165 250);
}

@media (prefers-reduced-motion: reduce) {
 .landing-nav-link::after {
 transition: none;
 }
}

/* About grid: staggered reveal when scroll-animate adds .visible */
.landing-about-chart .landing-about-cell {
 opacity: 0;
 transform: translate3d(0, 0.75rem, 0);
 transition:
 opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
 transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
 background-color 0.3s ease-out,
 box-shadow 0.3s ease-out;
}

.landing-about-chart.visible .landing-about-cell {
 opacity: 1;
 transform: translate3d(0, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
 .landing-about-chart .landing-about-cell {
 opacity: 1 !important;
 transform: none !important;
 transition: none !important;
 }
}

/* Contact grid: staggered reveal when scroll-animate adds .visible */
.landing-contact-chart .landing-contact-cell {
 opacity: 0;
 transform: translate3d(0, 0.75rem, 0);
 transition:
 opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
 transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),
 background-color 0.3s ease-out,
 box-shadow 0.3s ease-out;
}

.landing-contact-chart.visible .landing-contact-cell {
 opacity: 1;
 transform: translate3d(0, 0, 0);
}

@media (prefers-reduced-motion: reduce) {
 .landing-contact-chart .landing-contact-cell {
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

/* Who uses Storvv: HUD grid (masked blueprint) */
.landing-who-uses-grid {
 background-image:
 linear-gradient(rgba(96, 165, 250, 0.09) 1px, transparent 1px),
 linear-gradient(90deg, rgba(96, 165, 250, 0.09) 1px, transparent 1px);
 background-size: 48px 48px;
 mask-image: radial-gradient(ellipse 88% 72% at 50% 40%, rgb(0 0 0) 12%, transparent 72%);
 -webkit-mask-image: radial-gradient(
 ellipse 88% 72% at 50% 40%,
 rgb(0 0 0) 12%,
 transparent 72%
 );
}

@media (hover: hover) and (pointer: fine) {
 .landing-who-uses-glass {
 transition:
 border-color 0.3s ease-out,
 background-color 0.3s ease-out,
 box-shadow 0.3s ease-out;
 }
 .landing-who-uses-glass:hover {
 border-color: rgba(147, 197, 253, 0.22);
 background: rgba(255, 255, 255, 0.045);
 box-shadow:
 inset 0 1px 0 rgba(255, 255, 255, 0.06),
 0 0 0 1px rgba(59, 130, 246, 0.07);
 }
}
</style>
