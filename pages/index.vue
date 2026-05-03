<template>
  <div class="min-h-screen bg-gradient-to-b from-[#fafafa] via-[#fafafa] to-[#f5f6f8] text-gray-900 antialiased dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-gray-100">
    <!-- Nav: glass, minimal -->
    <header
      class="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/45 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 dark:border-gray-800/55 dark:bg-slate-950/85 supports-[backdrop-filter]:dark:bg-slate-950/75 transition-[border-color,background-color] duration-300 ease-out"
    >
      <nav class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 lg:h-18 gap-3">
          <NuxtLink to="/" class="flex items-center gap-2 transition-opacity hover:opacity-90">
            <img :src="marketingLogoSrc" alt="Storvv" class="h-6 sm:h-8 w-auto object-contain" />
            </NuxtLink>
          <div class="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#features" @click.prevent="scrollToSection('features')" class="text-sm font-medium text-gray-600 outline-none transition-colors duration-300 ease-out hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Features</a>
            <a href="#pricing" @click.prevent="scrollToSection('pricing')" class="text-sm font-medium text-gray-600 outline-none transition-colors duration-300 ease-out hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Plans</a>
            <a href="#about" @click.prevent="scrollToSection('about')" class="text-sm font-medium text-gray-600 outline-none transition-colors duration-300 ease-out hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">About</a>
            <a href="#contact" @click.prevent="scrollToSection('contact')" class="text-sm font-medium text-gray-600 outline-none transition-colors duration-300 ease-out hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Contact</a>
            <button
              @click="showContactFormModal = true"
              class="rounded-lg bg-gray-900 text-white text-sm font-medium px-5 py-2.5 shadow-sm outline-none transition-all duration-300 ease-out hover:bg-gray-800 hover:shadow active:scale-[0.98] dark:bg-primary-600 dark:hover:bg-primary-500"
            >
              Start free trial
            </button>
          </div>
          <div class="flex items-center gap-1.5 md:hidden">
            <button 
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="p-2 -m-2 text-gray-600 rounded-sm hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-white/10"
              aria-label="Toggle menu"
            >
              <Bars3Icon v-if="!mobileMenuOpen" class="w-6 h-6" />
              <XMarkIcon v-else class="w-6 h-6" />
            </button>
          </div>
        </div>
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-gray-200/80 dark:border-gray-800 space-y-1">
            <a href="#features" @click.prevent="scrollToSection('features'); mobileMenuOpen = false" class="block py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Features</a>
            <a href="#pricing" @click.prevent="scrollToSection('pricing'); mobileMenuOpen = false" class="block py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Plans</a>
            <a href="#about" @click.prevent="scrollToSection('about'); mobileMenuOpen = false" class="block py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">About</a>
            <a href="#contact" @click.prevent="scrollToSection('contact'); mobileMenuOpen = false" class="block py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Contact</a>
            <button @click="showContactFormModal = true; mobileMenuOpen = false" class="w-full mt-4 rounded-sm bg-gray-900 text-white text-sm font-medium py-3 dark:bg-primary-600">Start free trial</button>
          </div>
        </Transition>
    </nav>
    </header>

    <!-- Hero: professional background image -->
    <section class="relative overflow-hidden pt-24 sm:pt-28">
      <!-- Background image -->
      <div
        ref="heroBackground"
        class="absolute inset-0 bg-center bg-cover will-change-transform"
        style="background-image: url('/hero-img.jpg');"
      />
      <!-- Readability overlay + cinematic gradients -->
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/62 via-slate-950/48 to-slate-950/80" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.16),transparent_44%),radial-gradient(circle_at_82%_30%,rgba(56,189,248,0.11),transparent_42%)]" />
      <div class="absolute -top-32 -right-32 h-[520px] w-[520px] animate-blob rounded-full bg-primary-400/11 blur-3xl" />
      <div class="absolute -bottom-40 -left-32 h-[620px] w-[620px] animate-blob rounded-full bg-primary-400/9 blur-3xl animation-delay-2000" />
      <div class="absolute right-[10%] top-[18%] h-3 w-3 rounded-full bg-primary-300/25 blur-[1px]" />
      <div class="absolute left-[22%] top-[38%] h-2 w-2 rounded-full bg-cyan-300/20 blur-[1px]" />

      <div class="relative mx-auto grid max-w-6xl gap-10 px-4 pb-20 sm:px-6 sm:pb-24 lg:grid-cols-12 lg:items-end lg:gap-12 lg:px-8 lg:pb-28">
        <div class="max-w-3xl lg:col-span-7">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur px-4 py-2 text-xs font-medium text-white/80">
              <SparklesIcon class="w-4 h-4 text-primary-300" />
            Built for fast-moving retail teams
            </div>

          <h1 class="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.06]">
            Automate inventory and sales
            <span class="text-primary-300">without spreadsheets.</span>
          </h1>

          <p class="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl">
            Built for store owners and managers who need clear stock visibility fast.
          </p>
          <ul class="mt-4 space-y-2 text-sm text-white/85 max-w-2xl">
            <li class="flex items-start gap-2"><CheckIcon class="w-4 h-4 text-primary-300 mt-0.5 shrink-0" />Track products in real time across your operations</li>
            <li class="flex items-start gap-2"><CheckIcon class="w-4 h-4 text-primary-300 mt-0.5 shrink-0" />Update inventory automatically when sales happen</li>
            <li class="flex items-start gap-2"><CheckIcon class="w-4 h-4 text-primary-300 mt-0.5 shrink-0" />Get insights early to prevent stockouts and overstock</li>
          </ul>

          <!-- Live sync visual (Uiverse-style loader + Storvv messaging) -->
          <div
            class="mt-8 flex flex-col items-stretch gap-4 rounded-xl border border-white/12 bg-white/[0.06] p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:gap-5"
          >
            <MarketingSyncLoader class="mx-auto shrink-0 sm:mx-0" :size="88" />
            <div class="min-w-0 text-center sm:text-left">
              <p class="text-sm font-semibold text-white">Inventory that stays live</p>
              <p class="mt-1 text-xs leading-relaxed text-white/75 sm:max-w-sm">
                Sales and receipts keep stock moving in the background, so your team always sees the current picture not yesterday’s export.
              </p>
            </div>
          </div>

          <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <button
                @click="showContactFormModal = true"
              class="inline-flex items-center justify-center rounded-lg bg-white text-slate-950 font-medium px-7 py-3.5 shadow-sm outline-none transition-all duration-300 ease-out hover:bg-white/95 hover:shadow-md active:scale-[0.98]"
              >
              Start free trial
              </button>
              <button
                @click="scrollToSection('features')"
              class="inline-flex items-center justify-center rounded-lg border border-white/18 bg-white/[0.08] text-white font-medium px-7 py-3.5 backdrop-blur-sm outline-none transition-all duration-300 ease-out hover:border-white/25 hover:bg-white/14 active:scale-[0.98]"
              >
              See it in action
              </button>
          </div>
          
          <div class="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
            <div class="flex items-center gap-3">
              <div class="flex gap-1">
                <svg v-for="i in 5" :key="i" class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <p class="text-sm text-white/80">Made for real retail operations</p>
              </div>
            <div class="h-px sm:h-6 sm:w-px bg-white/15" />
            <div class="grid grid-cols-3 gap-6 max-w-md">
              <div>
                <p class="text-sm font-semibold text-white">24/7</p>
                <p class="text-xs text-white/70">stock visibility</p>
            </div>
              <div>
                <p class="text-sm font-semibold text-white">Auto</p>
                <p class="text-xs text-white/70">sales-to-stock sync</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-white">Clear</p>
                <p class="text-xs text-white/70">team workflows</p>
            </div>
          </div>
          </div>
        </div>

        <!-- Floating hero cards (desktop only) -->
        <div class="relative hidden min-h-[27rem] lg:col-span-5 lg:block">
          <div class="absolute top-0 right-0 w-64 rounded-2xl border border-white/14 bg-white/[0.07] p-4 shadow-lg shadow-black/10 backdrop-blur-xl transition-[transform,border-color,background-color] duration-500 ease-out hover:-translate-y-0.5">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-wide text-white/70">Inventory folders</p>
              <span class="inline-flex items-center gap-1 rounded-full bg-cyan-400/20 px-2 py-0.5 text-[11px] font-medium text-cyan-200">
                <FolderIcon class="h-3 w-3" />
                Structured
              </span>
            </div>
            <p class="mt-2 text-sm font-semibold tracking-tight text-white">Track by folders and templates</p>
            <p class="mt-1 text-xs text-white/70">Organize products, serial numbers, and custom fields per category.</p>
          </div>

          <div class="absolute top-32 right-8 w-72 rounded-2xl border border-white/12 bg-slate-900/55 p-4 shadow-xl shadow-black/25 backdrop-blur-xl transition-[transform,border-color,background-color] duration-500 ease-out hover:-translate-y-0.5">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-wide text-white/70">Sales & receipts</p>
              <BellAlertIcon class="h-4 w-4 text-primary-300" />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div class="flex items-center gap-2">
                  <ShoppingCartIcon class="h-4 w-4 text-cyan-300" />
                  <span class="text-xs text-white">Create receipts in seconds</span>
                </div>
                <span class="text-xs font-semibold text-white">Fast</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div class="flex items-center gap-2">
                  <ArrowsRightLeftIcon class="h-4 w-4 text-primary-300" />
                  <span class="text-xs text-white">Swap-ins and returns</span>
                </div>
                <span class="text-xs text-emerald-200">Built-in</span>
              </div>
            </div>
          </div>

          <div class="absolute top-[22.5rem] right-12 w-64 rounded-2xl border border-white/14 bg-white/[0.07] p-3 shadow-lg shadow-black/10 backdrop-blur-xl transition-[transform,border-color,background-color] duration-500 ease-out hover:-translate-y-0.5">
            <p class="text-[11px] font-medium text-white/80">Multi-store operations</p>
            <div class="mt-2 grid grid-cols-3 gap-2 text-center">
              <div class="min-w-0 rounded-md bg-white/10 px-1.5 py-2">
                <p class="truncate text-xs font-semibold text-white">Roles</p>
                <p class="whitespace-normal break-words text-[9px] leading-tight text-white/70">Permissions</p>
              </div>
              <div class="min-w-0 rounded-md bg-white/10 px-1.5 py-2">
                <p class="truncate text-xs font-semibold text-white">Teams</p>
                <p class="whitespace-normal break-words text-[9px] leading-tight text-white/70">Departments</p>
              </div>
              <div class="min-w-0 rounded-md bg-white/10 px-1.5 py-2">
                <p class="truncate text-xs font-semibold text-white">Stores</p>
                <p class="whitespace-normal break-words text-[9px] leading-tight text-white/70">Branches</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Clarity block: editorial layout -->
    <section data-section-id="value-clarity" class="scroll-animate scroll-animate-up border-b border-gray-100/70 bg-white py-20 dark:border-gray-800/70 dark:bg-slate-950 sm:py-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-12 gap-8 lg:gap-10 items-end">
          <div class="lg:col-span-7">
            <p class="text-[11px] uppercase tracking-[0.12em] font-semibold text-primary-600 dark:text-primary-400">Custom retail operations</p>
            <h3 class="mt-2 text-3xl sm:text-[2.25rem] font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100 max-w-xl">
              Tailored structure for stores that need clarity
            </h3>
          </div>
          <div class="lg:col-span-5">
            <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-w-md lg:ml-auto">
              Storvv helps you run inventory, checkout, and team workflows without the noise.
              Keep operations consistent across branches and make faster decisions from one clean workspace.
            </p>
          </div>
        </div>

        <div class="mt-10 grid gap-7 sm:gap-8 md:grid-cols-3">
          <div class="border-l border-gray-200 pl-5 dark:border-gray-700">
            <h4 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Designed for retail teams</h4>
            <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Built for phone, gadget, fashion, beauty, and lifestyle stores that need structure without heavy setup.
            </p>
          </div>
          <div class="border-l border-gray-200 pl-5 dark:border-gray-700">
            <h4 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Built for clear outcomes</h4>
            <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Reduce stock mistakes, speed up checkout, and keep customer history connected to every sale and return.
            </p>
          </div>
          <div class="border-l border-gray-200 pl-5 dark:border-gray-700">
            <h4 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Ready to scale operations</h4>
            <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Standardize permissions, departments, and reporting across one store or many branches.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Storvv (premium split layout) -->
    <section data-section-id="problem" class="scroll-animate scroll-animate-up bg-white py-20 dark:bg-slate-950 lg:py-28 sm:py-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <p class="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400">Why teams choose Storvv</p>
          <h2 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Why <span class="text-primary-500">Storvv</span>?
          </h2>
          <p class="mt-4 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            One operations layer for inventory, sales, customers, and teams.
          </p>
        </div>

        <div class="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div class="lg:col-span-6 rounded-sm overflow-hidden">
              <img src="/questions.jpg" alt="Why Storvv" class="w-full h-full object-cover aspect-[4/3]" />
            </div>

          <div class="lg:col-span-6">
              <div class="relative pl-10">
                <div class="absolute left-3 top-3 bottom-3 w-px bg-gray-200 dark:bg-gray-700"></div>
                <div
                  class="absolute left-3 top-3 w-px bg-primary-500/70 transition-[height] duration-500 ease-out"
                  :style="{ height: `${(whyActiveStep + 1) * 33.333}%` }"
                ></div>

                <div class="space-y-5">
                  <div class="group relative">
                    <div class="absolute left-0 top-5 -translate-x-[5px]">
                      <div class="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                        <div :class="['w-2.5 h-2.5 rounded-full transition-colors', whyActiveStep >= 0 ? 'bg-primary-500' : 'bg-gray-300']"></div>
                      </div>
                    </div>
                    <div :class="['rounded-sm p-5 sm:p-6 transition duration-200 ease-out', whyActiveStep === 0 ? 'bg-primary-50/30' : 'bg-white/90 hover:bg-gray-50/90']">
                      <div class="flex items-start gap-3">
                        <span class="inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-500">01</span>
                        <div>
                          <h3 class="text-base sm:text-lg font-semibold text-gray-900">Career growth for your team</h3>
                          <p class="mt-2 text-sm text-gray-600 leading-relaxed">
                            Right tools and permissions, fewer errors, clear roles and guided processes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="group relative">
                    <div class="absolute left-0 top-5 -translate-x-[5px]">
                      <div class="w-7 h-7 rounded-full bg-white flex items-center justify-center dark:bg-slate-900">
                        <div :class="['w-2.5 h-2.5 rounded-full transition-colors', whyActiveStep >= 1 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600']"></div>
                      </div>
                    </div>
                    <div :class="['rounded-sm p-5 sm:p-6 transition duration-200 ease-out', whyActiveStep === 1 ? 'bg-primary-50/30 dark:bg-primary-950/30' : 'bg-white/90 hover:bg-gray-50/90 dark:bg-slate-900/90 dark:hover:bg-slate-800/40']">
                      <div class="flex items-start gap-3">
                        <span class="inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-500 dark:bg-slate-800 dark:text-gray-400">02</span>
                        <div>
                          <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Visibility that scales</h3>
                          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Sales trends, top products, low stock alerts, and customer insights in one dashboard.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="group relative">
                    <div class="absolute left-0 top-5 -translate-x-[5px]">
                      <div class="w-7 h-7 rounded-full bg-white flex items-center justify-center dark:bg-slate-900">
                        <div :class="['w-2.5 h-2.5 rounded-full transition-colors', whyActiveStep >= 2 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600']"></div>
                      </div>
                    </div>
                    <div :class="['rounded-sm p-5 sm:p-6 transition duration-200 ease-out', whyActiveStep === 2 ? 'bg-primary-50/30 dark:bg-primary-950/30' : 'bg-white/90 hover:bg-gray-50/90 dark:bg-slate-900/90 dark:hover:bg-slate-800/40']">
                      <div class="flex items-start gap-3">
                        <span class="inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-500 dark:bg-slate-800 dark:text-gray-400">03</span>
                        <div>
                          <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Simple operations</h3>
                          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            Less manual work, fewer tools, cleaner workflows: consistent and scalable.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="pt-1">
                    <button
                      @click="showContactFormModal = true"
                      class="rounded-sm bg-primary-500 text-white font-medium px-6 py-3 hover:bg-primary-600 transition-colors"
                    >
                      Get started
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </section>

    <!-- How it works: dark left + primary right (reverted, cleaner) -->
    <section id="features" data-section-id="features" class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] grid min-h-[560px] lg:grid-cols-2 lg:scroll-mt-28">
      <div class="bg-slate-900 px-6 sm:px-8 lg:px-12 py-16 lg:py-24 flex flex-col justify-center">
          <div class="max-w-xl mx-auto lg:mx-0">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              How Storvv works
            </h2>
          <p class="mt-4 text-lg text-slate-300">
            Five steps to get your store running smoothly.
          </p>
          <div class="mt-10 space-y-6">
            <div data-section-id="step-1" class="scroll-animate scroll-animate-up stagger-1 flex items-start gap-4">
              <div class="flex-shrink-0 pt-0.5">
                <Cog6ToothSolidIcon class="w-7 h-7 text-primary-300" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Set up your store</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Set your store name, currency, timezone, and receipt preferences so totals, dates, and taxes appear correctly from day one. Add payment methods your team actually uses (cash, transfer, POS) and keep business settings consistent across staff accounts.</p>
              </div>
            </div>
            <div data-section-id="step-2" class="scroll-animate scroll-animate-up stagger-2 flex items-start gap-4">
              <div class="flex-shrink-0 pt-0.5">
                <UsersSolidIcon class="w-7 h-7 text-primary-300" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Departments & staff</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Create departments for how you already work (shop floor, warehouse, online orders) and invite team members with the right role. Control who can view, sell, edit, or delete items using folder-level permissions so managers and staff only access what they need.</p>
              </div>
            </div>
            <div data-section-id="step-3" class="scroll-animate scroll-animate-up stagger-3 flex items-start gap-4">
              <div class="flex-shrink-0 pt-0.5">
                <RectangleStackSolidIcon class="w-7 h-7 text-primary-300" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Organize inventory</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Structure products with custom folders and reusable templates, then add stock one-by-one or in bulk from Excel. Track key details like SKU, serial number, IMEI, cost price, and selling price so your records stay complete and searchable. On Enterprise, use <span class="font-medium text-white">Copy from branch</span> on the Folders screen to bring selected folder layouts into a new location without rebuilding every template by hand.</p>
              </div>
            </div>
            <div data-section-id="step-4" class="scroll-animate scroll-animate-up stagger-4 flex items-start gap-4">
              <div class="flex-shrink-0 pt-0.5">
                <ReceiptPercentSolidIcon class="w-7 h-7 text-primary-300" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Sales & receipts</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Process sales quickly with clean, professional receipts, apply discounts when needed, and handle returns or exchanges without losing inventory accuracy. Each transaction can capture customer details automatically, helping you build a customer database as you sell.</p>
              </div>
            </div>
            <div data-section-id="step-5" class="scroll-animate scroll-animate-up stagger-5 flex items-start gap-4">
              <div class="flex-shrink-0 pt-0.5">
                <PresentationChartLineSolidIcon class="w-7 h-7 text-primary-300" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Monitor & analyze</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Use real-time dashboards to understand revenue trends, top-selling products, low-stock alerts, and overall inventory health. Spot what is moving fast, what is tying up cash, and where to restock so you can make better decisions with confidence.</p>
                </div>
              </div>
            </div>
                </div>
                </div>
      <div class="bg-primary-400 flex items-center justify-center p-8 lg:p-12">
        <div class="w-full max-w-2xl">
          <div class="rounded-sm overflow-hidden bg-white/5 backdrop-blur-sm">
            <img src="/dash.png" alt="Storvv Dashboard" class="w-full h-auto object-contain" />
          </div>
        </div>
      </div>
    </section>

    <!-- Everything you need -->
    <section data-section-id="features-list" class="scroll-animate scroll-animate-up bg-white py-20 dark:bg-slate-950 sm:py-24 lg:py-28">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Everything you need, nothing you don't
            </h2>
            <p class="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl">
              One system to run inventory, sales, customers, and team operations without tool sprawl.
            </p>
        </div>
          <a href="#features" @click.prevent="scrollToSection('features')" class="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary-500 outline-none transition-colors duration-300 ease-out hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300">
            Explore features
            <ArrowRightIcon class="w-4 h-4" />
            </a>
            </div>
        <div class="relative">
          <button
            @click="previousFeature"
            :disabled="currentFeatureIndex === 0"
            :class="['absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/60 bg-white shadow-sm outline-none transition-all duration-300 ease-out dark:border-white/10 dark:bg-slate-900', currentFeatureIndex === 0 ? 'cursor-not-allowed opacity-40' : 'hover:border-gray-300/70 hover:bg-gray-50/90 hover:shadow dark:hover:bg-slate-800/90']"
            aria-label="Previous"
          >
            <ChevronLeftIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            @click="nextFeature"
            :disabled="currentFeatureIndex >= features.length - visibleFeatures"
            :class="['absolute right-0 top-1/2 z-10 flex h-10 w-10 translate-x-1 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200/60 bg-white shadow-sm outline-none transition-all duration-300 ease-out dark:border-white/10 dark:bg-slate-900', currentFeatureIndex >= features.length - visibleFeatures ? 'cursor-not-allowed opacity-40' : 'hover:border-gray-300/70 hover:bg-gray-50/90 hover:shadow dark:hover:bg-slate-800/90']"
            aria-label="Next"
          >
            <ChevronRightIcon class="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div class="overflow-hidden px-12">
            <div
              class="flex transition-[transform] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
              :style="{ transform: `translate3d(-${currentFeatureIndex * (100 / visibleFeatures)}%,0,0)` }"
            >
              <div v-for="(feature, index) in features" :key="index" class="flex-shrink-0 px-3" :style="{ width: `${100 / visibleFeatures}%` }">
                <div
                  class="flex h-full flex-col rounded-xl border border-gray-100/80 bg-white p-6 shadow-sm outline-none ring-1 ring-black/[0.02] transition-[background-color,border-color,box-shadow] duration-300 ease-out hover:border-gray-200/90 hover:bg-gray-50/80 hover:shadow-md dark:border-white/[0.06] dark:bg-slate-900 dark:ring-white/[0.04] dark:hover:border-white/10 dark:hover:bg-slate-800/85"
                >
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ feature.title }}</h3>
                  <p class="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{{ feature.description }}</p>
                  <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-500">Explore <ArrowRightIcon class="w-4 h-4" /></span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-center gap-2 mt-6">
            <button
              v-for="(dot, index) in totalDots"
              :key="index"
              @click="goToFeature(index * visibleFeatures)"
              :class="['h-1.5 rounded-full transition-[width,background-color] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]', Math.floor(currentFeatureIndex / visibleFeatures) === index ? 'w-6 bg-primary-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500']"
              :aria-label="`Slide ${index + 1}`"
            />
              </div>
              </div>
            </div>
    </section>

    <!-- Advanced capabilities -->
    <section data-section-id="capabilities-grid" class="scroll-animate scroll-animate-up relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div class="absolute inset-0 bg-gradient-to-br from-neutral-50/90 via-white to-neutral-50/80 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
      <div class="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]" style="background-image: linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px); background-size: 48px 48px;" />
      <div class="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary-100/15 blur-3xl dark:bg-primary-500/8" />
      <div class="absolute bottom-0 left-0 h-96 w-96 translate-y-1/2 -translate-x-1/2 rounded-full bg-primary-100/12 blur-3xl dark:bg-primary-500/6" />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-gray-100 leading-tight max-w-5xl">
            Capabilities that mirror how Storvv actually runs inventory, checkout, teams, and multi-store chains
          </h2>
        </div>
        <div
          class="mx-auto max-w-[92rem] overflow-hidden rounded-[1.25rem] bg-slate-100/65 dark:bg-white/[0.05]"
        >
          <div class="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div
              v-for="(cap, idx) in landingCapabilities"
              :key="idx"
              class="group relative bg-white px-6 py-9 text-center transition-colors duration-300 ease-out hover:bg-neutral-50/90 sm:px-7 sm:py-10 dark:bg-slate-950 dark:hover:bg-slate-900/95"
            >
              <div class="mx-auto mb-5 flex h-[4.75rem] w-[4.75rem] items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]">
                <component :is="cap.icon" class="h-[4.5rem] w-[4.5rem] shrink-0 text-gray-900 dark:text-gray-100" stroke-width="1.35" />
              </div>
              <h3 class="mb-2.5 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ cap.title }}
              </h3>
              <p class="mx-auto max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:max-w-none">
                {{ cap.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section data-section-id="use-cases" class="scroll-animate scroll-animate-up py-20 sm:py-24 bg-[#070d1d]">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary-300/90">Built for modern retail teams</p>
            <h2 class="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Who uses Storvv?
            </h2>
            <p class="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300">
              Whether you run one branch or many, Storvv keeps inventory, sales, and staff operations in one clean workflow.
            </p>
            <ul class="mt-6 space-y-3">
              <li class="flex items-start gap-2.5 text-sm text-slate-200">
                <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                Phone and gadget stores managing serial numbers and swaps.
              </li>
              <li class="flex items-start gap-2.5 text-sm text-slate-200">
                <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                Fashion and lifestyle retailers with fast-moving stock.
              </li>
              <li class="flex items-start gap-2.5 text-sm text-slate-200">
                <CheckIcon class="mt-0.5 h-4 w-4 shrink-0 text-primary-300" />
                Growing multi-branch teams standardizing operations.
              </li>
            </ul>
          </div>

          <div class="space-y-4">
            <div class="rounded-sm bg-white/10 backdrop-blur-md p-5">
              <div class="flex items-start gap-3">
                <CubeIcon class="mt-0.5 h-6 w-6 shrink-0 text-orange-300" />
                <div>
                  <p class="text-xl font-semibold tracking-tight text-white">Serial-first inventory</p>
                  <p class="mt-1 text-xs sm:text-sm text-slate-200">Track IMEI, swaps, and pricing updates with clean item history.</p>
                </div>
              </div>
            </div>

            <div class="rounded-sm bg-white/10 backdrop-blur-md p-5">
              <div class="flex items-start gap-3">
                <TagIcon class="mt-0.5 h-6 w-6 shrink-0 text-sky-300" />
                <div>
                  <p class="text-xl font-semibold tracking-tight text-white">Faster daily checkout</p>
                  <p class="mt-1 text-xs sm:text-sm text-slate-200">Receipts, returns, and customer history connected in one flow.</p>
                </div>
              </div>
            </div>

            <div class="rounded-sm bg-white/10 backdrop-blur-md p-5">
              <div class="flex items-start gap-3">
                <UserGroupIcon class="mt-0.5 h-6 w-6 shrink-0 text-emerald-300" />
                <div>
                  <p class="text-xl font-semibold tracking-tight text-white">Teams that scale</p>
                  <p class="mt-1 text-xs sm:text-sm text-slate-200">Role-based access and branch-level control for growing operations.</p>
                </div>
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
          Start free with Micro for a single store; upgrade to Medium for multiple locations and analytics; choose Enterprise for unlimited scale, stock transfers between stores, and copying folder templates across branches.
        </p>
        <p class="mt-2 text-center text-xs text-gray-500 dark:text-gray-500">
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
            <span v-if="isYearly" class="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full">Save 15%</span>
            </span>
          </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          <!-- Micro: single store, 1 dept, 2 staff. No analytics, no multi-store sync. -->
          <div data-section-id="pricing-1" class="scroll-animate scroll-animate-scale stagger-1 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col transition duration-200 ease-out">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Micro</h3>
            <p class="mt-1 text-xs text-gray-500">Single store, solo or very small team</p>
            <p class="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">FREE</p>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600">
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />1 store</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />1 department, up to 2 staff</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Full inventory & folders</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Receipts, returns & customers</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Dashboard & notifications</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Settings & profile</li>
              <li class="flex items-start gap-2 text-gray-500"><span class="shrink-0">-</span> No analytics; no multiple departments; no multi-store sync</li>
                </ul>
            <button @click="showContactFormModal = true" class="mt-6 w-full rounded-sm bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">Get started</button>
              </div>
          <!-- Medium: 5 stores, 10 depts, 25 staff. Analytics, duplicate folders/items. No multi-store sync. -->
          <div data-section-id="pricing-2" class="scroll-animate scroll-animate-scale stagger-2 relative rounded-3xl bg-primary-50/35 p-6 flex flex-col dark:bg-slate-900">
            <p class="absolute -top-3 right-5 rounded-full bg-primary-500 px-3 py-1 text-[11px] font-semibold text-white">
              Most popular
            </p>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Medium</h3>
            <p class="mt-1 text-xs text-gray-500">Growing business, multiple locations or teams</p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isYearly ? mediumYearlyPrice : mediumMonthlyPrice }}</span>
              <span v-if="isYearly" class="text-sm text-gray-400 line-through">{{ mediumYearlyListPrice }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600">
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Everything in Micro</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Up to 5 stores</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Up to 10 departments, 25 staff per store</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Analytics & reports</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Duplicate folders & products</li>
              <li class="flex items-start gap-2 text-gray-500"><span class="shrink-0">-</span> No stock transfers between stores (Enterprise only)</li>
                </ul>
            <button @click="showContactFormModal = true" class="mt-6 w-full rounded-sm bg-primary-500 text-white py-2.5 text-sm font-medium hover:bg-primary-600 transition-colors">Get started</button>
              </div>
          <!-- Enterprise: unlimited. Multi-store sync, priority support. -->
          <div data-section-id="pricing-3" class="scroll-animate scroll-animate-scale stagger-3 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col transition duration-200 ease-out">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Storvv Enterprise</h3>
            <p class="mt-1 text-xs text-gray-500">Larger operations, central management</p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ isYearly ? enterpriseYearlyPrice : enterpriseMonthlyPrice }}</span>
              <span v-if="isYearly" class="text-sm text-gray-400 line-through">{{ enterpriseYearlyListPrice }}</span>
              </div>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600">
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Everything in Medium</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Unlimited stores</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Unlimited departments & staff</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Multi-store sync & stock transfers</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Copy from branch: folder templates across stores</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Priority support</li>
                </ul>
            <button @click="showContactFormModal = true" class="mt-6 w-full rounded-sm bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">Get started</button>
              </div>
              </div>
            </div>
    </section>

    <!-- Security -->
    <section class="relative py-20 lg:py-28 overflow-hidden">
      <div class="absolute inset-0">
        <img src="/cloud security 2.jpg" alt="Security" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gray-900/75" />
                </div>
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="w-14 h-14 rounded-sm bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-6 border border-white/20">
          <ShieldCheckIcon class="w-7 h-7 text-white" />
              </div>
        <h2 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">Security you can trust</h2>
        <p class="mt-4 text-white/90 text-lg max-w-2xl mx-auto">Your data is safeguarded with industry-leading security and compliance.</p>
        <div class="mt-12 grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div class="rounded-sm bg-white/10 backdrop-blur border border-white/20 p-6 text-center">
            <ShieldCheckIcon class="w-8 h-8 text-white mx-auto mb-3" />
            <h3 class="font-semibold text-white">High-grade security</h3>
            <p class="mt-1 text-sm text-white/80">End-to-end encryption for all data.</p>
              </div>
          <div class="rounded-sm bg-white/10 backdrop-blur border border-white/20 p-6 text-center">
            <LockClosedIcon class="w-8 h-8 text-white mx-auto mb-3" />
            <h3 class="font-semibold text-white">Data privacy</h3>
            <p class="mt-1 text-sm text-white/80">Your data stays yours. We never share.</p>
            </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" data-section-id="faq" class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-[#f5f7f9] py-20 dark:bg-slate-900/55 lg:scroll-mt-28 lg:py-28 sm:py-24">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p class="text-[11px] uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 text-center">Frequently asked questions</p>
        <h2 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 text-center">Common questions</h2>
        <p class="mt-2 text-gray-600 dark:text-gray-400 text-center text-sm">Answers to help you understand Storvv and billing.</p>
        <div class="mt-10 space-y-3">
          <div data-section-id="faq-1" class="scroll-animate scroll-animate-scale stagger-1 bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button
              @click="toggleFaq(0)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <ClockIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">How quickly can I get started?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Most stores are up and running within minutes. Create your store profile, set up your first inventory folder, and you're ready to start managing sales. No coding or technical expertise needed.</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
            
          <div data-section-id="faq-2" class="scroll-animate scroll-animate-scale stagger-2 bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(1)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <SparklesIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">Is Storvv difficult to learn?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Not at all. Storvv is built with simplicity in mind. The interface is intuitive and straightforward: if you can use a smartphone, you can use Storvv. We've designed it specifically for store owners and managers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div data-section-id="faq-3" class="scroll-animate scroll-animate-scale stagger-3 bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(2)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <ChartBarIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">Can I track in-store and online sales together?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Absolutely. Storvv provides a unified view of all your sales channels. Whether transactions happen at your physical location or through other channels, everything is consolidated in one dashboard for complete visibility.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(3)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <FolderIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
            </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">How do custom inventory folders work?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products. Each folder can have its own template, and you can enable serial number tracking for individual items.</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
            
          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(4)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <DocumentTextIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">Can I import products from Excel?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Yes! Storvv supports bulk import from Excel spreadsheets. Simply upload your Excel file, and items will be automatically added to your inventory folders. You can also export your inventory data to Excel for backup or analysis.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(5)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <UsersIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">How does customer tracking work?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Customers are automatically created when you generate receipts. They're tracked by email, phone, or address. View complete purchase history, total spending, and order counts for each customer, all without manual data entry.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(6)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <ArrowPathIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">What are swap-in transactions?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Swap-in transactions allow customers to exchange items. When a customer swaps in an item, it's automatically added back to your inventory, and the transaction is tracked. Perfect for device exchanges, trade-ins, or returns.</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
            
          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(7)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <KeyIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">How do role-based permissions work?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Storvv supports three roles: Super Admin (full access), Manager (can manage assigned folders and staff), and Staff (limited access based on department). You can control folder access at the department level, ensuring staff only see relevant inventory.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(8)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <BellAlertIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">What are low stock alerts?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Storvv automatically tracks low stock items based on your configured threshold. For serial number folders, it alerts when available items fall below the threshold. For bulk items, it counts individual items with low quantities. Get notified on your dashboard.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(9)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <BuildingOfficeIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">Can I manage multiple stores?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Yes! Premium plans support multiple store locations. Each store has its own inventory folders, receipts, and staff. Manage everything from one centralized dashboard while keeping store data separate.</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
            
          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(10)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <ShieldCheckIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
          </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">Is my data secure?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Yes, absolutely. Storvv uses enterprise-grade security to protect all your data. Your information is encrypted, and we never share your data without your explicit permission.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-950 rounded-sm overflow-hidden">
            <button @click="toggleFaq(11)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100">
                <BanknotesIcon class="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 pr-8">What’s the difference between Micro, Medium, and Enterprise?</h3>
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
                    <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      <strong>Micro (free):</strong> One store, one department, up to 2 staff. Full inventory, receipts, returns, and customers; dashboard and notifications. No analytics, no multiple departments, no multi-store sync.<br><br>
                      <strong>Medium:</strong> Everything in Micro plus up to 5 stores, up to 10 departments and 25 staff per store, analytics and reports, and duplicate folders/products. No stock transfers between stores.<br><br>
                      <strong>Enterprise:</strong> Everything in Medium plus unlimited stores, departments, and staff; multi-store sync (transfer stock between locations); <strong>Copy from branch</strong> to copy selected inventory folder templates between branches without recreating fields; and priority support.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <!-- Subtle pattern overlay -->
      <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, rgb(255 255 255) 1px, transparent 0); background-size: 40px 40px;"></div>
      
      <!-- Decorative gradient orbs -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 right-0 w-96 h-96 bg-primary-400/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-primary-400/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>

      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-12 sm:mb-16">
          <div class="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-sm mb-6 border border-white/20">
            <SparklesIcon class="w-7 h-7 text-white flex-shrink-0" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Ready to simplify your store operations?
          </h2>
          <p class="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Start free, set up fast, and get full inventory and sales visibility in one place.
          </p>
      </div>

        <!-- Features Grid -->
        <div class="mb-12 sm:mb-16">
          <p class="text-center text-base sm:text-lg text-white/70 mb-8 font-medium">
            Store owners choose Storvv because it gives them:
          </p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div class="group rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 ease-out hover:border-white/16 hover:bg-white/10 hover:-translate-y-0.5">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-sm flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <FolderIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Complete flexibility to organize inventory their way
                </p>
              </div>
            </div>
            
            <div class="group rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 ease-out hover:border-white/16 hover:bg-white/10 hover:-translate-y-0.5">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-sm flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <UsersIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Automatic customer tracking from every transaction
                </p>
              </div>
            </div>
            
            <div class="group rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 ease-out hover:border-white/16 hover:bg-white/10 hover:-translate-y-0.5">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-sm flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <ReceiptPercentIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Professional receipts that print perfectly every time
                </p>
              </div>
            </div>
            
            <div class="group rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 ease-out hover:border-white/16 hover:bg-white/10 hover:-translate-y-0.5">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-sm flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <UserGroupIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Team management with precise access control
                </p>
              </div>
            </div>
            
            <div class="group rounded-xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 ease-out hover:border-white/16 hover:bg-white/10 hover:-translate-y-0.5 sm:col-span-2 lg:col-span-1">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-sm flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <ChartBarIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Real-time insights into what's actually happening
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="text-center">
          <p class="text-lg sm:text-xl font-semibold text-white/90 mb-6">
            Experience the difference a truly flexible system makes.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              @click="showContactFormModal = true"
              class="group inline-flex items-center justify-center gap-2 rounded-lg bg-white px-7 py-3.5 font-medium text-slate-950 shadow-sm outline-none transition-all duration-300 ease-out hover:bg-white/92 hover:shadow-md active:scale-[0.98]"
            >
              Start Free Trial
              <ArrowRightIcon class="h-4 w-4 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1 sm:h-5 sm:w-5" />
            </button>
            <button
              @click="scrollToSection('features')"
              class="inline-flex items-center justify-center gap-2 rounded-lg border border-white/18 bg-white/[0.08] px-7 py-3.5 font-medium text-white outline-none backdrop-blur-sm transition-all duration-300 ease-out hover:border-white/24 hover:bg-white/14 active:scale-[0.98]"
            >
              See it in action
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" data-section-id="contact" class="scroll-animate scroll-animate-up scroll-mt-[4.75rem] bg-white py-20 dark:bg-slate-950 lg:scroll-mt-28 lg:py-28 sm:py-24">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="w-14 h-14 rounded-sm bg-primary-100 dark:bg-primary-950/50 flex items-center justify-center mx-auto mb-6">
          <EnvelopeIcon class="w-7 h-7 text-primary-500 dark:text-primary-400" />
        </div>
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Get in touch</h2>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Questions, feedback, or partnership we'd love to hear from you.</p>
          <button
            @click="showContactFormModal = true"
          class="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white shadow-sm outline-none transition-all duration-300 ease-out hover:bg-primary-700 hover:shadow-md active:scale-[0.98]"
          >
          Contact us
          <ArrowRightIcon class="w-5 h-5" />
          </button>
      </div>
    </section>

    <!-- Footer -->
    <footer id="about" class="scroll-mt-[4.75rem] border-t border-gray-200/65 bg-gradient-to-b from-slate-50 to-slate-50/95 dark:border-gray-800/70 dark:from-slate-900 dark:to-slate-900 lg:scroll-mt-28">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div class="grid lg:grid-cols-12 gap-10 pb-10 border-b border-gray-200/80 dark:border-gray-800">
          <!-- Brand -->
          <div class="lg:col-span-4 space-y-4">
            <NuxtLink to="/" class="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img :src="marketingLogoSrc" alt="Storvv" class="h-7 w-auto object-contain" />
            </NuxtLink>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-sm">
              Store management software for modern retailers, inventory, receipts, customers, and teams in one fast system.
            </p>
            <div class="flex items-center gap-5 pt-1">
              <a
                href="https://x.com/_storvv_"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center rounded-md p-1.5 -m-1.5 text-gray-900 transition-colors hover:text-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-white dark:hover:text-primary-400"
                aria-label="X"
              >
                <svg class="h-7 w-7 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
              <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Product</h4>
              <ul class="space-y-2.5">
                <li><a href="#features" @click.prevent="scrollToSection('features')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">Features</a></li>
                <li><a href="#pricing" @click.prevent="scrollToSection('pricing')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">Plans</a></li>
                <li><a href="#faq" @click.prevent="scrollToSection('faq')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Company</h4>
              <ul class="space-y-2.5">
                <li><a href="#about" @click.prevent="scrollToSection('about')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">About</a></li>
                <li><a href="#contact" @click.prevent="scrollToSection('contact')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Legal</h4>
              <ul class="space-y-2.5">
                <li><NuxtLink to="/privacy" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">Privacy</NuxtLink></li>
                <li><NuxtLink to="/terms" class="text-sm text-gray-600 hover:text-gray-900 transition-colors dark:text-gray-400 dark:hover:text-gray-100">Terms</NuxtLink></li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Support</h4>
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
          <p class="text-sm text-gray-500 dark:text-gray-500">
            &copy; {{ new Date().getFullYear() }} Storvv. All rights reserved.
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
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
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue'
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
  BellIcon,
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
  ChevronDownIcon,
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

/** Marketing site is light-only; logo asset for light backgrounds. */
const marketingLogoSrc = '/storvv logo 2.png'

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
const showBackToTop = ref(false)
const isYearly = ref(false)
const locale = ref('en-NG')
const pricingRegion = ref<'NG' | 'US' | 'GB' | 'EU'>('NG')
const showLaunchModal = ref(false)
const showContactFormModal = ref(false)
const cookiesAccepted = ref(true)
const whyActiveStep = ref(0)
let whyActiveStepInterval: number | null = null

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

// Feature carousel state
const currentFeatureIndex = ref(0)
const currentSlide = ref(0)
const totalSlides = 9

const nextSlide = () => {
  if (currentSlide.value < totalSlides - 1) {
    currentSlide.value++
  } else {
    currentSlide.value = 0 // Loop back to start
  }
}

const previousSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  } else {
    currentSlide.value = totalSlides - 1 // Loop to end
  }
}

const goToSlide = (index: number) => {
  currentSlide.value = index
}

const visibleFeatures = computed(() => {
  if (typeof window === 'undefined') return 3
  return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
})

interface LandingCapability {
  icon: Component
  title: string
  description: string
}

/** Advanced grid on the homepage: aligns with sidebar modules and subscription gates. */
const landingCapabilities: LandingCapability[] = [
  {
    icon: FolderIcon,
    title: 'Inventory folders',
    description:
      'Templates with rich custom fields (text, numbers, currency, dates, choices, booleans). Each folder chooses serial-number lines or bulk quantity so gadgets, apparel, or consumables can follow different rules.',
  },
  {
    icon: CubeIcon,
    title: 'Serial & bulk stock',
    description:
      'Track individual IMEI-grade units one by one or keep pooled counts for fast movers, with thresholds that respect how each folder is configured.',
  },
  {
    icon: ReceiptPercentIcon,
    title: 'Receipts & checkout',
    description:
      'Line-level discounts, multiple payments, polished layouts, printable or PDF-ready output, and receipts that stay wired to folders and inventory.',
  },
  {
    icon: ArrowsRightLeftIcon,
    title: 'Returns, refunds & swap-ins',
    description:
      'Undo sales, reopen stock correctly, log swap-ins and trade-ins inside the receipt flow so finance and warehouse stay aligned.',
  },
  {
    icon: UsersIcon,
    title: 'Customer CRM',
    description:
      'Customers form automatically from receipts. Review purchase counts, totals, notes, or contact hints without juggling a separate spreadsheet CRM.',
  },
  {
    icon: BellAlertIcon,
    title: 'Low-stock alerts',
    description:
      'Set folder-level thresholds and hear when serialized or pooled counts fall below comfortable levels.',
  },
  {
    icon: DocumentTextIcon,
    title: 'Excel import & export',
    description:
      'Bulk bring products in from spreadsheets or export catalogs for auditors and planners with duplicate-aware imports.',
  },
  {
    icon: MagnifyingGlassIcon,
    title: 'Unified search',
    description:
      'Search receipts, inventory, customers, and (for admins) departments and staff from the header, with filters that fit each role.',
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics & exports',
    description:
      'Medium and Enterprise add revenue pacing, bestselling items, busiest times, and summaries you can export for deeper analysis.',
  },
  {
    icon: UserGroupIcon,
    title: 'Departments & roles',
    description:
      'Medium and Enterprise add departments plus Super Admin, Manager, and Staff roles with granular access to folders and workflows.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Activity logs',
    description:
      'Medium and Enterprise give managers and super admins dated trails for notable inventory and configuration changes.',
  },
  {
    icon: BellIcon,
    title: 'In-app notifications',
    description:
      'Operational alerts arrive in-product so approvals, anomalies, onboarding nudges, and receipt milestones surface next to everyday work.',
  },
  {
    icon: BuildingOfficeIcon,
    title: 'Multi-store workspaces',
    description:
      'Micro stays on one flagship store; Medium expands to five separate ledgers tied to one account; Enterprise lifts store limits entirely.',
  },
  {
    icon: Square2StackIcon,
    title: 'Copy from branch',
    description:
      'Enterprise tooling duplicates folder scaffolding between branches selectively, bringing structure definitions without overwriting live quantities.',
  },
  {
    icon: ArrowPathIcon,
    title: 'Multi-store sync',
    description:
      'Enterprise-only transfers route unsold serialized or pooled stock across branches with history tracking and consolidated reporting.',
  },
  {
    icon: GlobeAltIcon,
    title: 'Regional & preferences',
    description:
      'Currency formatting, locales, onboarding, receipts, subscriptions, integrations, notifications, profile details, themes, sessions, two-factor authentication, and billing from Settings and Profile.',
  },
]

const features = [
  {
    title: 'Custom Inventory Folders',
    description: 'Create unlimited folders with your own fields (text, numbers, dates, currency, select, boolean). Each folder can have serial number tracking or bulk quantities. Organize inventory your way.'
  },
  {
    title: 'Serial Number & Bulk Tracking',
    description: 'Track items by serial number for devices and electronics, or by quantity for bulk stock. Low-stock thresholds and alerts keep you ahead of restocking.'
  },
  {
    title: 'Excel Import & Export',
    description: 'Bulk import products from Excel or export inventory for backup and analysis. Duplicate detection and column mapping make setup fast.'
  },
  {
    title: 'Professional Receipts & Sales',
    description: 'Generate clean, A4-optimized receipts. Apply discounts, record swap-ins and returns, and support multiple payment methods. Every sale links to your customer list.'
  },
  {
    title: 'Automatic Customer History',
    description: 'Customers are created from receipts (email, phone, or name). View purchase history, total spend, and order counts without manual data entry.'
  },
  {
    title: 'Returns, Refunds & Swap-Ins',
    description: 'Process returns and refunds with one click; inventory updates automatically. Swap-in transactions track exchanges and trade-ins back into stock.'
  },
  {
    title: 'Departments & Staff Roles',
    description: 'Create departments and assign staff with Super Admin, Manager, or Staff roles. Control which inventory folders each department can access.'
  },
  {
    title: 'Dashboard & Analytics',
    description: 'Overview dashboard with quick stats. On Medium and Enterprise: full analytics with revenue trends, busiest times, product performance, and exportable reports.'
  },
  {
    title: 'Multiple Stores',
    description: 'Medium and Enterprise support multiple store locations. Each store has its own inventory, receipts, and staff; manage all from one account.'
  },
  {
    title: 'Multi-Store Sync (Enterprise)',
    description: 'Transfer stock between stores, view consolidated reports, and keep a full transfer history. Built for chains and central warehouses.'
  },
  {
    title: 'Copy from branch (Enterprise)',
    description: 'On the Inventory Folders page, pick a source branch and select which folder templates to copy into your current branch. Brings layouts and field definitions only (not product stock), so new locations stay consistent.'
  },
  {
    title: 'In-App Notifications',
    description: 'Stay updated with notifications for sales, low stock, and important account activity, all in one feed.'
  },
  {
    title: 'Settings & Profile',
    description: 'Configure currency, timezone, and language per profile. Store-level settings, theme and notifications preferences, and secure account management.'
  }
]

const totalDots = computed(() => {
  return Math.ceil(features.length / visibleFeatures.value)
})

const nextFeature = () => {
  const maxIndex = features.length - visibleFeatures.value
  if (currentFeatureIndex.value < maxIndex) {
    currentFeatureIndex.value = Math.min(currentFeatureIndex.value + visibleFeatures.value, maxIndex)
  }
}

const previousFeature = () => {
  if (currentFeatureIndex.value > 0) {
    currentFeatureIndex.value = Math.max(currentFeatureIndex.value - visibleFeatures.value, 0)
  }
}

const goToFeature = (index: number) => {
  currentFeatureIndex.value = index
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

  // Auto-advance "Why Storvv" active step
  if (import.meta.client) {
    whyActiveStepInterval = window.setInterval(() => {
      whyActiveStep.value = (whyActiveStep.value + 1) % 3
    }, 3000)
  }
})

onUnmounted(() => {
  // Clean up scroll event listener
  if (import.meta.client) {
    themeStore.applyTheme()
    window.removeEventListener('scroll', handleScroll)
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }
    if (whyActiveStepInterval !== null) {
      clearInterval(whyActiveStepInterval)
      whyActiveStepInterval = null
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

