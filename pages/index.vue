<template>
  <div class="landing-page landing-page--portfolio min-h-screen antialiased">
    <header class="landing-header" :class="{ 'landing-header--menu-open': mobileMenuOpen }">
      <div class="landing-header__shell">
        <div class="landing-header__pill">
          <NuxtLink to="/" class="landing-header__brand" @click="mobileMenuOpen = false">
            <img
              :src="landingNavLogoSrc"
              alt="Storvv"
              class="landing-header__logo"
              width="132"
              height="36"
            />
          </NuxtLink>

          <nav class="landing-header__links landing-header__desktop" aria-label="Primary">
            <a
              href="#features"
              class="landing-nav-link"
              @click.prevent="scrollToSection('features')"
              >Features</a
            >
            <NuxtLink to="/demo/dashboard" class="landing-nav-link">Demo</NuxtLink>
            <a href="#pricing" class="landing-nav-link" @click.prevent="scrollToSection('pricing')"
              >Plans</a
            >
            <a href="#contact" class="landing-nav-link" @click.prevent="scrollToSection('contact')"
              >Contact</a
            >
          </nav>

          <div class="landing-header__actions">
            <a :href="appOriginUrl" class="landing-header__cta">Start free</a>
            <div class="landing-header__mobile">
              <NuxtLink
                to="/demo/dashboard"
                class="landing-header__cta landing-header__cta--compact"
                >Demo</NuxtLink
              >
              <button
                type="button"
                class="landing-header__menu-btn"
                :aria-expanded="mobileMenuOpen"
                aria-controls="landing-mobile-nav"
                :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
                @click="mobileMenuOpen = !mobileMenuOpen"
              >
                <XMarkIcon
                  v-if="mobileMenuOpen"
                  class="landing-header__menu-icon"
                  aria-hidden="true"
                />
                <Bars3Icon v-else class="landing-header__menu-icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <Teleport to="body">
      <Transition name="landing-mobile-layer">
        <div v-if="mobileMenuOpen" class="landing-mobile-layer md:hidden" role="presentation">
          <button
            type="button"
            class="landing-mobile-backdrop"
            aria-label="Close menu"
            @click="mobileMenuOpen = false"
          />
          <div
            id="landing-mobile-nav"
            class="landing-mobile-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <nav class="landing-mobile-panel__nav" aria-label="Primary">
              <a
                href="#features"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    scrollToSection('features')
                    mobileMenuOpen = false
                  }
                "
                >Features</a
              >
              <a
                href="/demo/dashboard"
                class="landing-mobile-nav-link"
                @click.prevent="navigateFromMobileMenu('/demo/dashboard')"
                >Demo</a
              >
              <a
                href="#pricing"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    scrollToSection('pricing')
                    mobileMenuOpen = false
                  }
                "
                >Plans</a
              >
              <a
                href="#contact"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    scrollToSection('contact')
                    mobileMenuOpen = false
                  }
                "
                >Contact</a
              >
            </nav>
            <div class="landing-mobile-panel__cta-wrap">
              <NuxtLink
                to="/demo/dashboard"
                class="landing-header__cta landing-mobile-panel__cta"
                @click="mobileMenuOpen = false"
              >
                Explore the demo
              </NuxtLink>
              <a
                :href="appOriginUrl"
                class="landing-mobile-panel__secondary-cta"
                @click="mobileMenuOpen = false"
              >
                Start free
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Marketing showcase: hero → problems → features → setup → multi-store -->
    <LandingShowcase
      :logo-src="marketingLogoSrc"
      :dark-logo-src="landingNavLogoSrc"
      :app-url="appOriginUrl"
    />

    <LandingProof @navigate="scrollToSection" />

    <!-- Pricing -->
    <section
      id="pricing"
      data-section-id="pricing"
      class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-gradient-to-b from-white to-slate-50/65 py-20 dark:from-slate-950 dark:to-slate-900/80 lg:scroll-mt-28 lg:py-28 sm:py-24"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center"
        >
          Plans that match your stage
        </h2>
        <p
          class="mt-4 text-base text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto leading-relaxed"
        >
          Start on
          <strong class="font-semibold text-gray-800 dark:text-gray-200">Micro</strong> (free, one
          store). Medium adds analytics and a second branch. Enterprise is for multi-store operators
          who need sync and transfers.
        </p>
        <p class="mt-3 text-center text-base text-primary-700 dark:text-primary-300">
          <NuxtLink to="/demo/dashboard" class="font-semibold underline-offset-2 hover:underline"
            >Try the demo first</NuxtLink
          >
          (no signup required).
        </p>
        <p class="mt-2 text-center text-base text-gray-600 dark:text-gray-400">
          Showing prices in {{ pricing.currency }} based on your region.
        </p>
        <div class="flex items-center justify-center gap-3 mt-7">
          <span
            :class="[
              'text-sm font-medium',
              !isYearly ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500',
            ]"
            >Monthly</span
          >
          <button
            @click="isYearly = !isYearly"
            :class="[
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-slate-950',
              isYearly ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600',
            ]"
            role="switch"
            :aria-checked="isYearly"
          >
            <span
              :class="[
                'inline-block h-5 w-5 rounded-full bg-white transition-transform',
                isYearly ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
          <span
            :class="[
              'text-sm font-medium flex items-center gap-2',
              isYearly ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-500',
            ]"
          >
            Yearly
            <span
              v-if="isYearly"
              class="text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-2.5 py-1 rounded-full"
              >Save 15%</span
            >
          </span>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          <!-- Micro: single store, 1 dept, 2 staff. No analytics, no multi-store sync. -->
          <div
            data-section-id="pricing-1"
            class="scroll-animate scroll-animate-scale stagger-1 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col transition duration-200 ease-out"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Micro</h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Single store, solo or very small team
            </p>
            <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">FREE</p>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />1 store · 1 department · up
                to 2 staff
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Full inventory, receipts,
                returns & customers
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Dashboard, notifications &
                help center
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />WhatsApp receipts (10/month)
              </li>
              <li class="flex items-start gap-2 text-gray-500 dark:text-gray-500">
                <span class="shrink-0">−</span> No analytics, activity logs, or multi-store tools
              </li>
            </ul>
            <NuxtLink
              to="/demo/dashboard"
              class="mt-4 flex w-full items-center justify-center rounded-sm border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
              >Try demo</NuxtLink
            >
            <a
              :href="appOriginUrl"
              class="mt-2 flex w-full items-center justify-center rounded-sm bg-gray-900 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >Start free</a
            >
          </div>
          <!-- Medium: 2 stores, 10 depts, 25 staff. Analytics, duplicate folders/items. No multi-store sync. -->
          <div
            data-section-id="pricing-2"
            class="scroll-animate scroll-animate-scale stagger-2 relative rounded-3xl bg-primary-50/35 p-6 flex flex-col dark:bg-slate-900"
          >
            <p
              class="absolute -top-3 right-5 rounded-full bg-primary-500 px-3 py-1 text-sm font-semibold text-white"
            >
              Most popular
            </p>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Medium</h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Growing business, multiple locations or teams
            </p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{
                isYearly ? mediumYearlyPrice : mediumMonthlyPrice
              }}</span>
              <span v-if="isYearly" class="text-sm text-gray-400 line-through">{{
                mediumYearlyListPrice
              }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Everything in Micro
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Up to 2 stores · 10
                departments · 25 staff
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Analytics, activity logs &
                reports
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Customer balance / credit
                ledger
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Unlimited WhatsApp receipts
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Duplicate categories (same
                branch)
              </li>
              <li class="flex items-start gap-2 text-gray-500 dark:text-gray-500">
                <span class="shrink-0">−</span> No stock transfers or copy-from-branch (Enterprise)
              </li>
            </ul>
            <a :href="appOriginUrl" class="btn-primary mt-6 flex w-full justify-center py-2.5"
              >Get Started</a
            >
          </div>
          <!-- Enterprise: unlimited. Multi-store sync, priority support. -->
          <div
            data-section-id="pricing-3"
            class="scroll-animate scroll-animate-scale stagger-3 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col transition duration-200 ease-out"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Storvv Enterprise
            </h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Larger operations, central management
            </p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{
                isYearly ? enterpriseYearlyPrice : enterpriseMonthlyPrice
              }}</span>
              <span v-if="isYearly" class="text-sm text-gray-400 line-through">{{
                enterpriseYearlyListPrice
              }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Everything in Medium
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Unlimited stores, departments
                & staff
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Multi-store sync & stock
                transfers
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Copy from branch (category
                templates)
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Stock loans for serial
                inventory
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Priority support
              </li>
            </ul>
            <a
              :href="appOriginUrl"
              class="mt-6 flex w-full items-center justify-center rounded-sm bg-gray-900 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >Get Started</a
            >
          </div>
        </div>
      </div>

      <div
        class="mx-auto mt-10 max-w-2xl border-t border-gray-200/90 pt-8 text-center dark:border-gray-800/80 sm:mt-12"
      >
        <p class="text-base text-gray-600 dark:text-gray-400">
          Running 2+ branches? We onboard a small founding cohort with hands-on setup.
          <a
            href="#contact"
            class="font-semibold text-primary-700 underline-offset-2 hover:underline dark:text-primary-300"
            @click.prevent="scrollToSection('contact')"
            >Apply via contact</a
          >.
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

    <!-- FAQ -->
    <section
      id="faq"
      data-section-id="faq"
      class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-[#f5f7f9] py-20 dark:bg-slate-900/55 lg:scroll-mt-28 lg:py-28 sm:py-24"
    >
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p
          class="text-xs sm:text-[0.8125rem] uppercase tracking-[0.16em] font-semibold text-gray-600 dark:text-gray-300 text-center"
        >
          Frequently asked questions
        </p>
        <h2
          class="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center"
        >
          Quick answers
        </h2>
        <p class="mt-2 text-center text-base text-gray-600 dark:text-gray-300">
          Setup, plans, and how Storvv fits your store.
        </p>
        <div class="mt-10 space-y-3">
          <div
            data-section-id="faq-1"
            class="scroll-animate scroll-animate-scale stagger-1 rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(0)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <ClockIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  How quickly can I get started?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(0) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(0) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Most stores are up and running within minutes. Create your store profile, set
                      up your first inventory folder, and you're ready to start managing sales. No
                      coding or technical expertise needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            data-section-id="faq-2"
            class="scroll-animate scroll-animate-scale stagger-2 rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(1)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <SparklesIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  Is Storvv difficult to learn?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(1) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(1) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Not at all. Storvv is built with simplicity in mind. The interface is
                      intuitive and straightforward: if you can use a smartphone, you can use
                      Storvv. We've designed it specifically for store owners and managers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            data-section-id="faq-3"
            class="scroll-animate scroll-animate-scale stagger-3 rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(2)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <ChartBarIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  Can I track in-store and online sales together?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(2) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(2) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Absolutely. Storvv provides a unified view of all your sales channels. Whether
                      transactions happen at your physical location or through other channels,
                      everything is consolidated in one dashboard for complete visibility.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(3)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <FolderIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  How do custom inventory folders work?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(3) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(3) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Create unlimited inventory folders with custom templates. Define dynamic
                      fields (text, numbers, dates, currency, select, boolean) that match your
                      products. Each folder can have its own template, and you can enable serial
                      number tracking for individual items.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(4)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <DocumentTextIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  Can I import products from Excel?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(4) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(4) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Yes! Storvv supports bulk import from Excel spreadsheets. Simply upload your
                      Excel file, and items will be automatically added to your inventory folders.
                      You can also export your inventory data to Excel for backup or analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(5)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <UsersIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  How does customer tracking work?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(5) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(5) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Customers are automatically created when you generate receipts. They're
                      tracked by email, phone, or address. View complete purchase history, total
                      spending, and order counts for each customer, all without manual data entry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(6)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <ArrowPathIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  What are swap-in transactions?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(6) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(6) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Swap-in transactions allow customers to exchange items. When a customer swaps
                      in an item, it's automatically added back to your inventory, and the
                      transaction is tracked. Perfect for device exchanges, trade-ins, or returns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(7)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <KeyIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  How do role-based permissions work?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(7) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(7) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Storvv supports three roles: Super Admin (full access), Manager (can manage
                      assigned folders and staff), and Staff (limited access based on department).
                      You can control folder access at the department level, ensuring staff only see
                      relevant inventory.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(8)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <BellAlertIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  What are low stock alerts?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(8) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(8) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Storvv automatically tracks low stock items based on your configured
                      threshold. For serial number folders, it alerts when available items fall
                      below the threshold. For bulk items, it counts individual items with low
                      quantities. Get notified on your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(9)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <BuildingOfficeIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  Can I manage multiple stores?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(9) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(9) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Yes! Premium plans support multiple store locations. Each store has its own
                      inventory folders, receipts, and staff. Manage everything from one centralized
                      dashboard while keeping store data separate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(10)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <ShieldCheckIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  Is my data secure?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(10) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(10) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      Yes, absolutely. Storvv uses enterprise-grade security to protect all your
                      data. Your information is encrypted, and we never share your data without your
                      explicit permission.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-xl bg-white/55 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40 overflow-hidden"
          >
            <button
              @click="toggleFaq(11)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div
                class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-md bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.08]"
              >
                <BanknotesIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-50 pr-8">
                  What’s the difference between Micro, Medium, and Enterprise?
                </h3>
              </div>
              <ChevronUpIcon
                :class="[
                  'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  openFaqItems.has(11) ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              class="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              :class="openFaqItems.has(11) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="min-h-0 overflow-hidden">
                <div class="px-4 sm:px-5 pb-4 sm:pb-5">
                  <div class="pl-11 sm:pl-12">
                    <p
                      class="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed"
                    >
                      <strong>Micro (free):</strong> One store, one department, up to 2 staff. Full
                      inventory, receipts, returns, and customers; dashboard, notifications, and
                      help center. WhatsApp receipts (10/month). No analytics, activity logs,
                      customer balance, or multi-store tools.<br /><br />
                      <strong>Medium:</strong> Everything in Micro plus up to 2 stores, 10
                      departments and 25 staff per store, analytics and reports, activity logs,
                      customer balance ledger, unlimited WhatsApp, and duplicate categories within a
                      branch. No stock transfers or copy-from-branch.<br /><br />
                      <strong>Enterprise:</strong> Everything in Medium plus unlimited stores,
                      departments, and staff; multi-store sync and stock transfers;
                      <strong>Copy from branch</strong> for category templates across branches;
                      <strong>Stock loans</strong> for serial inventory; and priority support.
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
    <footer class="landing-footer">
      <div class="landing-footer__inner">
        <div class="landing-footer__top">
          <div>
            <NuxtLink to="/" class="landing-footer__brand">
              <img
                :src="landingNavLogoSrc"
                alt="Storvv"
                class="landing-footer__logo"
                width="140"
                height="40"
              />
            </NuxtLink>
            <p class="landing-footer__tagline">
              Store management for modern retailers. Inventory, receipts, customers, and teams in
              one calm workspace.
            </p>
          </div>

          <div>
            <p class="landing-footer__heading">Explore</p>
            <div class="landing-footer__links">
              <a
                href="#features"
                class="landing-footer__link"
                @click.prevent="scrollToSection('features')"
                >Features</a
              >
              <NuxtLink to="/demo/dashboard" class="landing-footer__link">Demo</NuxtLink>
              <a
                href="#pricing"
                class="landing-footer__link"
                @click.prevent="scrollToSection('pricing')"
                >Plans</a
              >
              <a
                href="#faq"
                class="landing-footer__link"
                @click.prevent="scrollToSection('faq')"
                >FAQ</a
              >
              <a
                href="#contact"
                class="landing-footer__link"
                @click.prevent="scrollToSection('contact')"
                >Contact</a
              >
            </div>
          </div>

          <div>
            <p class="landing-footer__heading">Connect</p>
            <div class="landing-footer__links">
              <a href="mailto:hello@storvv.com" class="landing-footer__link">hello@storvv.com</a>
              <a
                href="https://www.instagram.com/_storvv_"
                target="_blank"
                rel="noopener noreferrer"
                class="landing-footer__link"
                >Instagram</a
              >
              <a
                href="https://x.com/_storvv_"
                target="_blank"
                rel="noopener noreferrer"
                class="landing-footer__link"
                >X</a
              >
              <NuxtLink to="/privacy" class="landing-footer__link">Privacy</NuxtLink>
              <NuxtLink to="/terms" class="landing-footer__link">Terms</NuxtLink>
            </div>
          </div>
        </div>

        <div class="landing-footer__bottom">
          <p>&copy; {{ new Date().getFullYear() }} Storvv. All rights reserved.</p>
          <p>Built with Nuxt &amp; Firebase</p>
        </div>
      </div>

      <!-- Cookie consent banner -->
      <div
        v-if="!cookiesAccepted"
        class="landing-cookie-banner"
      >
        <p class="landing-cookie-banner__text">
          We use cookies on our website to help us provide the best browsing experience. By
          continuing to use our website you are deemed to have agreed to the use of cookies.
        </p>
        <div class="landing-cookie-banner__actions">
          <NuxtLink to="/privacy" class="landing-cookie-banner__link">Learn more</NuxtLink>
          <button type="button" class="landing-cookie-banner__btn" @click="acceptCookies">
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import MarketingSyncLoader from '~/components/marketing/MarketingSyncLoader.vue'
import {
  Bars3Icon,
  XMarkIcon,
  CheckIcon,
  UsersIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BanknotesIcon,
  FolderIcon,
  BellAlertIcon,
  SparklesIcon,
  ClockIcon,
  KeyIcon,
  ArrowUpIcon,
  ChevronUpIcon,
} from '@heroicons/vue/24/outline'
import { useThemeStore } from '~/stores/theme'
/** Light wordmark for setup panel (white background). */
const marketingLogoSrc = '/storvv logo 2.png'
/** Dark wordmark for nav, footer, and dark landing panels. */
const landingNavLogoSrc = '/storvv logo.png'

const themeStore = useThemeStore()

function applyLandingDocumentTheme() {
  if (!import.meta.client) return
  const html = document.documentElement
  html.classList.add('dark')
  html.style.colorScheme = 'dark'
  const meta = document.getElementById('theme-color-meta')
  if (meta) meta.setAttribute('content', '#050508')
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
  }
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
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
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
    behavior: 'smooth',
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
    applyLandingDocumentTheme()
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
      content:
        'A complete store management platform with instant inventory setup, automated sales tracking, and AI-powered insights at your fingertips.',
    },
  ],
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
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1), border-color 300ms ease-out,
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
  background-image: linear-gradient(rgba(147, 197, 253, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(147, 197, 253, 0.07) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(ellipse 110% 85% at 50% 32%, rgb(0 0 0) 22%, transparent 72%);
  -webkit-mask-image: radial-gradient(ellipse 110% 85% at 50% 32%, rgb(0 0 0) 22%, transparent 72%);
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
</style>
