<template>
  <div class="landing-page landing-page--portfolio min-h-screen antialiased">
    <header
      class="landing-header"
      :class="{ 'landing-header--menu-open': mobileMenuOpen, 'landing-header--scrolled': headerScrolled }"
    >
      <div class="landing-header__shell">
        <div class="landing-header__pill">
          <NuxtLink
            to="/"
            class="landing-header__brand"
            aria-label="Storvv home"
            @click="mobileMenuOpen = false"
          >
            <img
              :src="landingLogoSrc"
              alt=""
              class="landing-header__logo"
              width="140"
              height="40"
            />
          </NuxtLink>

          <nav class="landing-header__links landing-header__desktop" aria-label="Primary">
            <a href="#product" class="landing-nav-link" @click.prevent="scrollToSection('inventory')"
              >Product</a
            >
            <a
              href="#capabilities-grid"
              class="landing-nav-link"
              @click.prevent="scrollToSection('capabilities-grid')"
              >Features</a
            >
            <a href="#pricing" class="landing-nav-link" @click.prevent="scrollToSection('pricing')"
              >Pricing</a
            >
            <a href="#faq" class="landing-nav-link" @click.prevent="scrollToSection('faq')"
              >Resources</a
            >
          </nav>

          <div class="landing-header__actions">
            <ThemeToggle />
            <a :href="appOriginUrl" class="landing-header__sign-in">Sign in</a>
            <a :href="appOriginUrl" class="landing-header__cta">Get Started</a>
            <div class="landing-header__mobile">
              <NuxtLink
                to="/demo/dashboard"
                class="landing-header__cta landing-header__cta--compact"
                >Try demo</NuxtLink
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
                href="#product"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    scrollToSection('inventory')
                    mobileMenuOpen = false
                  }
                "
                >Product</a
              >
              <a
                href="#capabilities-grid"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    scrollToSection('capabilities-grid')
                    mobileMenuOpen = false
                  }
                "
                >Features</a
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
                >Pricing</a
              >
              <a
                href="#faq"
                class="landing-mobile-nav-link"
                @click.prevent="
                  () => {
                    scrollToSection('faq')
                    mobileMenuOpen = false
                  }
                "
                >Resources</a
              >
              <a
                :href="appOriginUrl"
                class="landing-mobile-nav-link"
                @click="mobileMenuOpen = false"
                >Sign in</a
              >
            </nav>
            <div class="landing-mobile-panel__cta-wrap">
              <a
                :href="appOriginUrl"
                class="landing-header__cta landing-mobile-panel__cta"
                @click="mobileMenuOpen = false"
              >
                Get Started
              </a>
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
      :dark-logo-src="landingLogoSrc"
      :app-url="appOriginUrl"
    />

    <LandingProof class="landing-proof--premium" />

    <LandingProductStories />

    <LandingCapabilities @navigate="scrollToSection" />

    <LandingAiShowcase />

    <LandingAppScreenshots :app-url="appOriginUrl" />

    <LandingSecurity />

    <!-- Pricing -->
    <section
      id="pricing"
      data-section-id="pricing"
      class="landing-pricing scroll-animate scroll-animate-up scroll-mt-[4.75rem] lg:scroll-mt-28"
    >
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center"
        >
          Plans that scale with your business
        </h2>
        <p
          class="mt-4 text-base text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto leading-relaxed"
        >
          Start on
          <strong class="font-semibold text-gray-800 dark:text-gray-200">Micro</strong> (free, one
          store, full sales & inventory). Medium adds analytics, sales leads, and a second branch.
          Enterprise adds transfers, stock loans, and unlimited stores. On signup, pick
          <strong class="font-semibold text-gray-800 dark:text-gray-200">Solo</strong> for a focused
          owner layout or <strong class="font-semibold text-gray-800 dark:text-gray-200">Business</strong>
          for the full team workspace. Paid plans auto-renew through Paystack; cancel anytime and keep
          access until your billing period ends.
        </p>
        <p class="mt-3 text-center text-base text-gray-700 dark:text-gray-300">
          <NuxtLink to="/demo/dashboard" class="font-semibold underline-offset-2 hover:underline"
            >Try demo</NuxtLink
          >
          (no signup required).
        </p>
        <p class="mt-2 text-center text-base text-gray-600 dark:text-gray-400">
          Showing prices in {{ pricing.currency }} based on your region.
        </p>
        <div
          class="mt-7 flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="Billing cycle"
        >
          <button
            v-for="cycle in SUBSCRIPTION_BILLING_CYCLES"
            :key="cycle"
            type="button"
            :class="[
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              selectedBillingCycle === cycle
                ? 'bg-[#1a1523] text-white dark:bg-white dark:text-[#1a1523]'
                : 'bg-white text-gray-600 hover:bg-[#eeeeef] dark:bg-[#1e1e1e] dark:text-gray-300 dark:hover:bg-[#282828]',
            ]"
            :aria-pressed="selectedBillingCycle === cycle"
            @click="selectedBillingCycle = cycle"
          >
            {{ BILLING_CYCLE_LABELS[cycle] }}
            <span
              v-if="cycle === 'yearly'"
              class="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300"
              >Save 15%</span
            >
            <span
              v-else-if="cycle === 'quarterly'"
              class="ml-1.5 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-300"
              >Save 10%</span
            >
          </button>
        </div>
        <p class="mt-3 text-center text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          Prices shown per billing cycle. Medium and Enterprise renew automatically until you cancel
          in Settings.
        </p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          <!-- Micro: single store, 1 dept, 2 staff. No analytics, no multi-store sync. -->
          <div
            data-section-id="pricing-1"
            class="scroll-animate scroll-animate-scale stagger-1 rounded-3xl bg-white dark:bg-[#1e1e1e] p-6 flex flex-col transition duration-200 ease-out"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Micro</h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Single store, ideal with Solo workspace at signup
            </p>
            <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">FREE</p>
            <p class="text-sm text-gray-500">{{ BILLING_CYCLE_PERIOD_SUFFIX[selectedBillingCycle] }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li
                v-for="(line, i) in SUBSCRIPTION_FEATURE_SUMMARY.storvv_micro"
                :key="i"
                class="flex items-center gap-2"
              >
                <CheckIcon class="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />{{ line }}
              </li>
              <li
                v-if="SUBSCRIPTION_PLAN_NOT_INCLUDED.storvv_micro"
                class="flex items-start gap-2 text-gray-500 dark:text-gray-500"
              >
                <span class="shrink-0">−</span> {{ SUBSCRIPTION_PLAN_NOT_INCLUDED.storvv_micro }}
              </li>
            </ul>
            <NuxtLink
              to="/demo/dashboard"
              class="landing-pill-cta landing-pill-cta--outline mt-4 flex w-full"
              >Try demo</NuxtLink
            >
            <a :href="appOriginUrl" class="landing-pill-cta mt-2 flex w-full">Start free</a>
          </div>
          <!-- Medium: 2 stores, 10 depts, 25 staff. Analytics, duplicate folders/items. No multi-store sync. -->
          <div
            data-section-id="pricing-2"
            class="scroll-animate scroll-animate-scale stagger-2 relative rounded-3xl bg-white p-6 flex flex-col dark:bg-[#1e1e1e]"
          >
            <p class="landing-pricing__badge">Most popular</p>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Medium</h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Growing business, multiple locations or teams
            </p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{
                formatPlanPrice('medium')
              }}</span>
              <span v-if="planListPrice('medium')" class="text-sm text-gray-400 line-through">{{
                planListPrice('medium')
              }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ BILLING_CYCLE_PERIOD_SUFFIX[selectedBillingCycle] }}</p>
            <p class="mt-0.5 text-xs text-gray-400">
              Auto-renews
              {{
                selectedBillingCycle === 'yearly'
                  ? 'yearly'
                  : selectedBillingCycle === 'quarterly'
                    ? 'each quarter'
                    : 'monthly'
              }}
            </p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li
                v-for="(line, i) in SUBSCRIPTION_FEATURE_SUMMARY.storvv_medium"
                :key="i"
                class="flex items-center gap-2"
              >
                <CheckIcon class="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />{{ line }}
              </li>
              <li
                v-if="SUBSCRIPTION_PLAN_NOT_INCLUDED.storvv_medium"
                class="flex items-start gap-2 text-gray-500 dark:text-gray-500"
              >
                <span class="shrink-0">−</span> {{ SUBSCRIPTION_PLAN_NOT_INCLUDED.storvv_medium }}
              </li>
            </ul>
            <a :href="appOriginUrl" class="landing-pill-cta mt-6 flex w-full">Get Started</a>
          </div>
          <!-- Enterprise: unlimited. Multi-store sync, priority support. -->
          <div
            data-section-id="pricing-3"
            class="scroll-animate scroll-animate-scale stagger-3 rounded-3xl bg-white dark:bg-[#1e1e1e] p-6 flex flex-col transition duration-200 ease-out"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Storvv Enterprise
            </h3>
            <p class="mt-1 text-base text-gray-600 dark:text-gray-400">
              Larger operations, central management
            </p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{
                formatPlanPrice('enterprise')
              }}</span>
              <span v-if="planListPrice('enterprise')" class="text-sm text-gray-400 line-through">{{
                planListPrice('enterprise')
              }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ BILLING_CYCLE_PERIOD_SUFFIX[selectedBillingCycle] }}</p>
            <p class="mt-0.5 text-xs text-gray-400">
              Auto-renews
              {{
                selectedBillingCycle === 'yearly'
                  ? 'yearly'
                  : selectedBillingCycle === 'quarterly'
                    ? 'each quarter'
                    : 'monthly'
              }}
            </p>
            <ul class="mt-6 space-y-2 flex-1 text-base text-gray-600 dark:text-gray-400">
              <li
                v-for="(line, i) in SUBSCRIPTION_FEATURE_SUMMARY.storvv_enterprise"
                :key="i"
                class="flex items-center gap-2"
              >
                <CheckIcon class="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />{{ line }}
              </li>
            </ul>
            <a :href="appOriginUrl" class="landing-pill-cta mt-6 flex w-full">Get Started</a>
          </div>
        </div>

        <div
          class="mt-10 max-w-4xl mx-auto rounded-2xl bg-white p-6 text-left dark:bg-[#1e1e1e] sm:p-8"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Solo vs Business workspace
          </h3>
          <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Separate from your paid plan. Choose during onboarding or switch anytime in Settings.
            Your Micro, Medium, or Enterprise limits still apply either way.
          </p>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div
              class="rounded-xl bg-[#f5f5f7] p-4 dark:bg-[#282828]"
            >
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">Solo · Just me</p>
              <p class="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                A focused workspace for running the shop yourself. Fewer menus up front: inventory,
                sales, and customers stay front and center.
              </p>
              <ul class="mt-3 space-y-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                <li>· Departments, branch switcher, and multi-store tools hidden until you need them</li>
                <li>· Turn on team, branches, or payment links in Advanced features when ready</li>
                <li>· Great for owner-operators on Micro who do not want admin clutter</li>
              </ul>
            </div>
            <div
              class="rounded-xl bg-[#f5f5f7] p-4 dark:bg-[#282828]"
            >
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Business · Growing business
              </p>
              <p class="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                The full Storvv workspace with team, branches, and admin tools as your plan allows.
              </p>
              <ul class="mt-3 space-y-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                <li>· Staff, departments, and multi-location navigation when your plan includes them</li>
                <li>· Payment links and advanced screens visible by default</li>
                <li>· Best when you already manage a team or multiple branches</li>
              </ul>
            </div>
          </div>

          <h4 class="mt-6 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Billing in Settings
          </h4>
          <p class="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            <strong class="font-medium text-gray-800 dark:text-gray-200">Plan</strong> is what you pay
            for (Micro, Medium, Enterprise). Solo and Business only change how much of the app we
            show, not your subscription price.
          </p>
          <ul class="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li class="flex gap-2">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              Live price preview before Paystack checkout (monthly, quarterly, or yearly)
            </li>
            <li class="flex gap-2">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              Billing history, renewal status, and cancel auto-renew in Settings
            </li>
            <li class="flex gap-2">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              Clear upgrade prompts when you hit plan limits (staff, WhatsApp, gated screens)
            </li>
            <li class="flex gap-2">
              <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
              Solo, Business, and subscription tools on web and the native iOS app
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mx-auto mt-8 max-w-2xl pt-6 text-center"
      >
        <NuxtLink to="/demo/dashboard" class="landing-pill-cta landing-pill-cta--outline w-full sm:w-auto">
          Try demo
        </NuxtLink>
      </div>
    </section>

    <LandingMoat />
    <LandingCaseStudies />
    <LandingPartners />

    <LandingFaq />

    <LandingContact @open-form="showContactFormModal = true" />

    <LandingFinalCta :app-url="appOriginUrl" />

    <!-- Footer -->
    <footer class="landing-footer landing-footer--premium">
      <div class="landing-footer__inner">
        <div class="landing-footer__top landing-footer__columns">
          <div>
            <NuxtLink to="/" class="landing-footer__brand">
              <img
                :src="landingLogoSrc"
                alt="Storvv"
                class="landing-footer__logo"
                width="140"
                height="40"
              />
            </NuxtLink>
            <p class="landing-footer__tagline">
              Inventory, sales, payment links, analytics, and multi-branch tools for modern
              retailers - on web and iOS.
            </p>
          </div>

          <div>
            <p class="landing-footer__col-title">Product</p>
            <div class="landing-footer__links">
              <a href="#inventory" class="landing-footer__link" @click.prevent="scrollToSection('inventory')"
                >Inventory</a
              >
              <a href="#sales" class="landing-footer__link" @click.prevent="scrollToSection('sales')"
                >Sales</a
              >
              <a
                href="#capabilities-grid"
                class="landing-footer__link"
                @click.prevent="scrollToSection('capabilities-grid')"
                >All features</a
              >
              <a href="#analytics" class="landing-footer__link" @click.prevent="scrollToSection('analytics')"
                >Analytics</a
              >
              <NuxtLink to="/demo/dashboard" class="landing-footer__link">Try demo</NuxtLink>
            </div>
          </div>

          <div>
            <p class="landing-footer__col-title">Resources</p>
            <div class="landing-footer__links">
              <a href="#pricing" class="landing-footer__link" @click.prevent="scrollToSection('pricing')"
                >Pricing</a
              >
              <a href="#faq" class="landing-footer__link" @click.prevent="scrollToSection('faq')">FAQ</a>
              <a href="#contact" class="landing-footer__link" @click.prevent="scrollToSection('contact')"
                >Contact</a
              >
            </div>
          </div>

          <div>
            <p class="landing-footer__col-title">Company</p>
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
          <p>
            Powered by Nuxt ·
            <a
              href="https://goz-portfolio-app.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              class="landing-footer__link"
              >Credits</a
            >
          </p>
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
        class="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#1a1523] text-white hover:bg-[#111018] transition-colors flex items-center justify-center dark:bg-white dark:text-[#1a1523] dark:hover:bg-[#f4f4f5]"
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
import '~/assets/css/landing.css'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Modal from '~/components/ui/Modal.vue'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLE_PERIOD_SUFFIX,
  SUBSCRIPTION_BILLING_CYCLES,
  deriveBillingAmount,
  deriveBillingListAmount,
  type SubscriptionBillingCycle,
} from '~/utils/subscription-billing'
import {
  SUBSCRIPTION_FEATURE_SUMMARY,
  SUBSCRIPTION_PLAN_NOT_INCLUDED,
} from '~/types/subscription'
import {
  Bars3Icon,
  XMarkIcon,
  CheckIcon,
  ArrowUpIcon,
} from '~/utils/app-icons'
import { useThemeStore } from '~/stores/theme'

const themeStore = useThemeStore()

/** Light wordmark for light canvas. */
const marketingLogoSrc = '/storvv logo 2.png'
/** Wordmark that contrasts the current landing canvas. */
const landingLogoSrc = computed(() =>
  themeStore.actualTheme === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)

function applyLandingDocumentTheme() {
  if (!import.meta.client) return
  themeStore.initTheme()
  themeStore.applyTheme()
  const html = document.documentElement
  const isDark = html.classList.contains('dark')
  const meta = document.getElementById('theme-color-meta')
  if (meta) meta.setAttribute('content', isDark ? '#080808' : '#f5f5f7')
}

const mobileMenuOpen = ref(false)
const headerScrolled = ref(false)
const route = useRoute()

let mobileMenuMql: MediaQueryList | null = null
function closeMobileMenuIfDesktop() {
  if (mobileMenuMql?.matches) mobileMenuOpen.value = false
}

watch(
  () => themeStore.actualTheme,
  () => applyLandingDocumentTheme()
)

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
const selectedBillingCycle = ref<SubscriptionBillingCycle>('monthly')
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

type PaidPlan = 'medium' | 'enterprise'

const formatPlanPrice = (plan: PaidPlan) => {
  const monthly = pricing.value[plan].monthly
  if (selectedBillingCycle.value === 'yearly') {
    return formatPrice(pricing.value[plan].yearly)
  }
  return formatPrice(deriveBillingAmount(monthly, selectedBillingCycle.value))
}

const planListPrice = (plan: PaidPlan): string | null => {
  if (selectedBillingCycle.value === 'monthly') return null
  if (selectedBillingCycle.value === 'yearly') {
    return formatPrice(pricing.value[plan].yearlyList)
  }
  return formatPrice(deriveBillingListAmount(pricing.value[plan].monthly, 'quarterly'))
}

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
  headerScrolled.value = window.scrollY > 24
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
  title: 'Storvv - The retail operating system for modern businesses',
  meta: [
    {
      name: 'description',
      content:
        'Storvv: inventory with subcategories, Quick Sale, sales leads, Paystack payment links, analytics, buybacks, stock loans, and multi-store sync. Web dashboard and iOS app.',
    },
  ],
})
</script>

<style scoped>
/* Hero: unified glass surfaces (mobile sync strip + desktop floats) */
.landing-hero-float-card {
  border-radius: 1.5rem;
  border: 0;
  background: #ffffff;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transition: background-color 300ms ease-out;
}

@media (hover: hover) and (pointer: fine) {
  .landing-hero-float-card:hover {
    transform: none;
    border-color: transparent;
    background: #eeeeef;
    box-shadow: none;
  }
}

html.dark .landing-hero-float-card {
  background: #1e1e1e;
}

html.dark .landing-hero-float-card:hover {
  background: #282828;
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
  background-image: linear-gradient(rgb(26 21 35 / 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgb(26 21 35 / 0.05) 1px, transparent 1px);
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
