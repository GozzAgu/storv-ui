<template>
  <div class="min-h-screen bg-[#fafafa] text-gray-900 antialiased">
    <!-- Nav: glass, minimal -->
    <header
      :class="[
        'fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl transition-shadow duration-300 border-b border-gray-200/70',
        isScrolled ? 'shadow-sm' : 'shadow-none'
      ]"
    >
      <nav class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 lg:h-18">
          <NuxtLink to="/" class="flex items-center gap-2 transition-opacity hover:opacity-90">
            <img src="/storvv logo 2.png" alt="Storvv" class="h-6 sm:h-8 w-auto object-contain" />
            </NuxtLink>
          <div class="hidden md:flex items-center gap-8">
            <a href="#features" @click.prevent="scrollToSection('features')" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" @click.prevent="scrollToSection('pricing')" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Plans</a>
            <a href="#about" @click.prevent="scrollToSection('about')" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">About</a>
            <a href="#contact" @click.prevent="scrollToSection('contact')" class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
            <button
              @click="showContactFormModal = true"
              class="rounded-full bg-gray-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-gray-800 transition-colors"
            >
              Start free trial
            </button>
          </div>
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 -m-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <Bars3Icon v-if="!mobileMenuOpen" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
        </div>
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-gray-200/80 space-y-1">
            <a href="#features" @click.prevent="scrollToSection('features'); mobileMenuOpen = false" class="block py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900">Features</a>
            <a href="#pricing" @click.prevent="scrollToSection('pricing'); mobileMenuOpen = false" class="block py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900">Plans</a>
            <a href="#about" @click.prevent="scrollToSection('about'); mobileMenuOpen = false" class="block py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900">About</a>
            <a href="#contact" @click.prevent="scrollToSection('contact'); mobileMenuOpen = false" class="block py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900">Contact</a>
            <button @click="showContactFormModal = true; mobileMenuOpen = false" class="w-full mt-4 rounded-full bg-gray-900 text-white text-sm font-medium py-3">Start free trial</button>
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
      <!-- Readability overlay (dark) -->
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/60 to-slate-950/80" />
      <div class="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-primary-400/10 blur-3xl" />
      <div class="absolute -bottom-40 -left-32 w-[620px] h-[620px] rounded-full bg-primary-400/10 blur-3xl" />

      <div class="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 lg:pb-28">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur px-4 py-2 text-xs font-medium text-white/80">
              <SparklesIcon class="w-4 h-4 text-primary-300" />
            Built for fast-moving retail teams
            </div>

          <h1 class="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.06]">
            Run inventory, sales, and staff
            <span class="text-primary-300">without the chaos.</span>
              </h1>

          <p class="mt-6 text-lg text-white/80 leading-relaxed max-w-2xl">
            Storvv is an all-in-one retail system: custom inventory folders, serial number tracking, professional receipts and returns, automatic customer history, departments and staff roles, analytics and low-stock alerts, and—on higher plans—multiple stores and stock transfers between locations.
            </p>

          <div class="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                @click="showContactFormModal = true"
              class="inline-flex items-center justify-center rounded-full bg-white text-slate-950 font-medium px-7 py-3.5 hover:bg-white/90 transition-colors"
              >
              Start free trial
              </button>
              <button
                @click="scrollToSection('features')"
              class="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 text-white font-medium px-7 py-3.5 hover:bg-white/15 transition-colors"
              >
              See how it works
              </button>
          </div>
          
          <div class="mt-10 flex flex-col sm:flex-row sm:items-center gap-6">
            <div class="flex items-center gap-3">
              <div class="flex gap-1">
                <svg v-for="i in 5" :key="i" class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <p class="text-sm text-white/80">Trusted by retailers like you</p>
              </div>
            <div class="h-px sm:h-6 sm:w-px bg-white/15" />
            <div class="grid grid-cols-3 gap-6 max-w-md">
              <div>
                <p class="text-sm font-semibold text-white">Minutes</p>
                <p class="text-xs text-white/70">to get started</p>
            </div>
              <div>
                <p class="text-sm font-semibold text-white">Unlimited</p>
                <p class="text-xs text-white/70">inventory folders</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-white">Clean</p>
                <p class="text-xs text-white/70">receipts & reports</p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Storvv (progress / timeline style) -->
    <section data-section-id="problem" class="scroll-animate scroll-animate-up py-20 lg:py-28 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Why <span class="text-primary-500">Storvv</span>?
          </h2>
          <p class="mt-4 text-gray-600 max-w-xl mx-auto">
            One operations layer for inventory, sales, customers, and teams—fast, clean, and flexible as you scale.
          </p>
          </div>
          
        <div class="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <!-- Left: image -->
          <div class="lg:col-span-6 rounded-2xl overflow-hidden shadow-lg ring-1 ring-gray-200/50">
            <img src="/questions.jpg" alt="Why Storvv" class="w-full h-full object-cover aspect-[4/3]" />
          </div>
          
          <!-- Right: progress rail -->
          <div class="lg:col-span-6">
            <div class="relative pl-10">
              <!-- rail -->
              <div class="absolute left-3 top-2 bottom-2 w-px bg-gray-200"></div>
              <div
                class="absolute left-3 top-2 w-px bg-primary-500/70 transition-[height] duration-500 ease-out"
                :style="{ height: `${(whyActiveStep + 1) * 33.333}%` }"
              ></div>

            <div class="space-y-10">
                <!-- Step 1 -->
                <div class="group relative">
                  <div class="absolute left-0 top-1.5 -translate-x-[5px]">
                    <div class="w-7 h-7 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center">
                      <div :class="['w-2.5 h-2.5 rounded-full transition-colors', whyActiveStep >= 0 ? 'bg-primary-500' : 'bg-gray-300']"></div>
            </div>
                  </div>
                  <div :class="['rounded-2xl border bg-white p-5 transition-colors', whyActiveStep === 0 ? 'border-primary-200' : 'border-gray-200/80 hover:border-primary-200']">
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-semibold text-gray-500">01</span>
                        <h3 class="text-base font-semibold text-gray-900">Career growth for your team</h3>
                      </div>
                    </div>
                    <p class="mt-2 text-sm text-gray-600 leading-relaxed">
                      Right tools and permissions, fewer errors, clear roles and guided processes.
                    </p>
                  </div>
          </div>
          
                <!-- Step 2 -->
                <div class="group relative">
                  <div class="absolute left-0 top-1.5 -translate-x-[5px]">
                    <div class="w-7 h-7 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center">
                      <div :class="['w-2.5 h-2.5 rounded-full transition-colors', whyActiveStep >= 1 ? 'bg-primary-500' : 'bg-gray-300']"></div>
            </div>
                  </div>
                  <div :class="['rounded-2xl border bg-white p-5 transition-colors', whyActiveStep === 1 ? 'border-primary-200' : 'border-gray-200/80 hover:border-primary-200']">
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-semibold text-gray-500">02</span>
                        <h3 class="text-base font-semibold text-gray-900">Visibility that scales</h3>
                      </div>
                    </div>
                    <p class="mt-2 text-sm text-gray-600 leading-relaxed">
                      Sales trends, top products, low stock alerts, and customer insights in one dashboard.
                    </p>
                  </div>
          </div>
          
                <!-- Step 3 -->
                <div class="group relative">
                  <div class="absolute left-0 top-1.5 -translate-x-[5px]">
                    <div class="w-7 h-7 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center">
                      <div :class="['w-2.5 h-2.5 rounded-full transition-colors', whyActiveStep >= 2 ? 'bg-primary-500' : 'bg-gray-300']"></div>
            </div>
                  </div>
                  <div :class="['rounded-2xl border bg-white p-5 transition-colors', whyActiveStep === 2 ? 'border-primary-200' : 'border-gray-200/80 hover:border-primary-200']">
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-semibold text-gray-500">03</span>
                        <h3 class="text-base font-semibold text-gray-900">Simple operations</h3>
                      </div>
                    </div>
                    <p class="mt-2 text-sm text-gray-600 leading-relaxed">
                      Less manual work, fewer tools, cleaner workflows—consistent and scalable.
                    </p>
                  </div>
        </div>

              <div class="pt-2">
                <button
                  @click="showContactFormModal = true"
                    class="rounded-full bg-primary-500 text-white font-medium px-6 py-3 hover:bg-primary-600 transition-colors"
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
    <section id="features" data-section-id="features" class="scroll-animate scroll-animate-up grid lg:grid-cols-2 min-h-[560px]">
      <div class="bg-slate-900 px-6 sm:px-8 lg:px-12 py-16 lg:py-24 flex flex-col justify-center">
          <div class="max-w-xl mx-auto lg:mx-0">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Getting started is simple
            </h2>
          <p class="mt-4 text-lg text-slate-300">
            Five steps to get your store running smoothly.
          </p>
          <div class="mt-10 space-y-6">
            <div data-section-id="step-1" class="scroll-animate scroll-animate-up stagger-1 flex items-start gap-4">
              <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-400 flex items-center justify-center">
                <BuildingOfficeIcon class="w-5 h-5 text-white" />
                </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Set up your store</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Configure currency, timezone, payment methods, and settings to match your business.</p>
              </div>
            </div>
            <div data-section-id="step-2" class="scroll-animate scroll-animate-up stagger-2 flex items-start gap-4">
              <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-400 flex items-center justify-center">
                <UserGroupIcon class="w-5 h-5 text-white" />
                </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Departments & staff</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Create departments and assign roles with folder-level permissions.</p>
              </div>
            </div>
            <div data-section-id="step-3" class="scroll-animate scroll-animate-up stagger-3 flex items-start gap-4">
              <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-400 flex items-center justify-center">
                <FolderIcon class="w-5 h-5 text-white" />
                </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Organize inventory</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Custom folders and templates; bulk import from Excel or add products individually.</p>
              </div>
            </div>
            <div data-section-id="step-4" class="scroll-animate scroll-animate-up stagger-4 flex items-start gap-4">
              <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-400 flex items-center justify-center">
                <ShoppingCartIcon class="w-5 h-5 text-white" />
                </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Sales & receipts</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Professional receipts, discounts, exchanges; every sale builds your customer database.</p>
              </div>
            </div>
            <div data-section-id="step-5" class="scroll-animate scroll-animate-up stagger-5 flex items-start gap-4">
              <div class="flex-shrink-0 w-11 h-11 rounded-xl bg-primary-400 flex items-center justify-center">
                <ChartBarIcon class="w-5 h-5 text-white" />
                </div>
              <div>
                <h3 class="text-lg font-semibold text-white">Monitor & analyze</h3>
                <p class="mt-1 text-sm text-slate-300 leading-relaxed">Dashboards for revenue, sales patterns, and inventory health.</p>
                </div>
              </div>
            </div>
                </div>
                </div>
      <div class="bg-primary-400 flex items-center justify-center p-8 lg:p-12">
        <div class="w-full max-w-2xl">
          <div class="rounded-xl overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm">
            <img src="/dash.png" alt="Storvv Dashboard" class="w-full h-auto object-contain" />
          </div>
        </div>
      </div>
    </section>

    <!-- Everything you need -->
    <section data-section-id="features-list" class="scroll-animate scroll-animate-up py-20 lg:py-28 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
              Everything you need, nothing you don't
          </h2>
            <p class="mt-3 text-gray-600 max-w-2xl">
              One solution: consolidate tools, simplify workflow, reduce costs.
          </p>
        </div>
          <a href="#features" @click.prevent="scrollToSection('features')" class="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium text-sm shrink-0">
            Explore features
            <ArrowRightIcon class="w-4 h-4" />
            </a>
            </div>
        <div class="relative">
          <button
            @click="previousFeature"
            :disabled="currentFeatureIndex === 0"
            :class="['absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center transition-all -translate-x-1', currentFeatureIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50']"
            aria-label="Previous"
          >
            <ChevronLeftIcon class="w-5 h-5 text-gray-600" />
          </button>
          <button
            @click="nextFeature"
            :disabled="currentFeatureIndex >= features.length - visibleFeatures"
            :class="['absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center transition-all translate-x-1', currentFeatureIndex >= features.length - visibleFeatures ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50']"
            aria-label="Next"
          >
            <ChevronRightIcon class="w-5 h-5 text-gray-600" />
          </button>
          <div class="overflow-hidden px-12">
            <div class="flex transition-transform duration-300 ease-out" :style="{ transform: `translateX(-${currentFeatureIndex * (100 / visibleFeatures)}%)` }">
              <div v-for="(feature, index) in features" :key="index" class="flex-shrink-0 px-3" :style="{ width: `${100 / visibleFeatures}%` }">
                <div class="h-full rounded-2xl border border-gray-200 bg-white p-6 hover:border-gray-300 transition-colors flex flex-col">
                  <h3 class="text-lg font-semibold text-gray-900">{{ feature.title }}</h3>
                  <p class="mt-2 text-sm text-gray-600 leading-relaxed flex-1">{{ feature.description }}</p>
                  <span class="mt-4 inline-flex items-center gap-1.5 text-primary-500 text-sm font-medium">Explore <ArrowRightIcon class="w-4 h-4" /></span>
              </div>
              </div>
            </div>
          </div>
          <div class="flex justify-center gap-2 mt-6">
            <button
              v-for="(dot, index) in totalDots"
              :key="index"
              @click="goToFeature(index * visibleFeatures)"
              :class="['h-1.5 rounded-full transition-all', Math.floor(currentFeatureIndex / visibleFeatures) === index ? 'bg-primary-500 w-6' : 'bg-gray-300 w-1.5 hover:bg-gray-400']"
              :aria-label="`Slide ${index + 1}`"
            />
              </div>
              </div>
            </div>
    </section>

    <!-- Advanced Features Section (original: grid bg, large icons, hover-reveal description) -->
    <section class="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px); background-size: 40px 40px;" />
      <div class="absolute top-0 right-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight max-w-5xl">
            Advanced capabilities that grow with you, from single locations to multi-store operations
          </h2>
          </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl">
          <div class="text-center group relative">
            <div class="w-20 h-20 mx-auto mb-6 flex items-center justify-center transition-transform group-hover:scale-110">
              <BuildingOfficeIcon class="w-20 h-20 text-gray-900 stroke-1" stroke-width="1.5" />
              </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Multi-Store Support</h3>
            <p class="text-sm text-gray-600 leading-relaxed opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 max-w-xs mx-auto">
              Manage multiple store locations from one account (Medium: up to 5; Enterprise: unlimited). Each store has its own inventory, receipts, and staff.
            </p>
          </div>
          <div class="text-center group relative">
            <div class="w-20 h-20 mx-auto mb-6 flex items-center justify-center transition-transform group-hover:scale-110">
              <BellAlertIcon class="w-20 h-20 text-gray-900 stroke-1" stroke-width="1.5" />
              </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Low Stock Alerts</h3>
            <p class="text-sm text-gray-600 leading-relaxed opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 max-w-xs mx-auto">
              Automatically track low stock items. Get alerts when inventory falls below your threshold for both serial numbers and bulk items.
            </p>
          </div>
          <div class="text-center group relative">
            <div class="w-20 h-20 mx-auto mb-6 flex items-center justify-center transition-transform group-hover:scale-110">
              <DocumentTextIcon class="w-20 h-20 text-gray-900 stroke-1" stroke-width="1.5" />
              </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Excel Import/Export</h3>
            <p class="text-sm text-gray-600 leading-relaxed opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 max-w-xs mx-auto">
              Bulk import products from Excel spreadsheets or export your inventory data. Smart duplicate detection included.
            </p>
          </div>
          <div class="text-center group relative">
            <div class="w-20 h-20 mx-auto mb-6 flex items-center justify-center transition-transform group-hover:scale-110">
              <ChartBarIcon class="w-20 h-20 text-gray-900 stroke-1" stroke-width="1.5" />
              </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Real-Time Analytics</h3>
            <p class="text-sm text-gray-600 leading-relaxed opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 max-w-xs mx-auto">
              Available on Medium and Enterprise. Revenue charts, sales trends, busiest times, and exportable reports so you can make data-driven decisions.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" data-section-id="pricing" class="scroll-animate scroll-animate-up py-20 lg:py-28 bg-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center">
          Plans that fit your size
        </h2>
        <p class="mt-4 text-gray-600 text-center max-w-2xl mx-auto">
          Start free with Micro for a single store; upgrade to Medium for multiple locations and analytics; choose Enterprise for unlimited scale and stock transfers between stores.
        </p>
        <div class="flex items-center justify-center gap-3 mt-6">
          <span :class="['text-sm font-medium', !isYearly ? 'text-gray-900' : 'text-gray-500']">Monthly</span>
          <button
            @click="isYearly = !isYearly"
            :class="['relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2', isYearly ? 'bg-primary-500' : 'bg-gray-300']"
            role="switch"
            :aria-checked="isYearly"
          >
            <span :class="['inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', isYearly ? 'translate-x-6' : 'translate-x-1']" />
          </button>
          <span :class="['text-sm font-medium flex items-center gap-2', isYearly ? 'text-gray-900' : 'text-gray-500']">
            Yearly
            <span v-if="isYearly" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Save 15%</span>
          </span>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          <!-- Micro: single store, 1 dept, 2 staff. No analytics, no multi-store sync. -->
          <div data-section-id="pricing-1" class="scroll-animate scroll-animate-scale stagger-1 rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-primary-200 transition-colors">
            <h3 class="text-lg font-semibold text-gray-900">Storvv Micro</h3>
            <p class="mt-1 text-xs text-gray-500">Single store, solo or very small team</p>
            <p class="mt-4 text-2xl font-bold text-gray-900">FREE</p>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600">
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />1 store</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />1 department, up to 2 staff</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Full inventory & folders</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Receipts, returns & customers</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Dashboard & notifications</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Settings & profile</li>
              <li class="flex items-start gap-2 text-gray-500"><span class="shrink-0">—</span> No analytics; no multiple departments; no multi-store sync</li>
            </ul>
            <button @click="showContactFormModal = true" class="mt-6 w-full rounded-full bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">Get started</button>
          </div>
          <!-- Medium: 5 stores, 10 depts, 25 staff. Analytics, duplicate folders/items. No multi-store sync. -->
          <div data-section-id="pricing-2" class="scroll-animate scroll-animate-scale stagger-2 rounded-2xl border-2 border-primary-200 bg-white p-6 flex flex-col shadow-lg shadow-primary-500/5">
            <h3 class="text-lg font-semibold text-gray-900">Storvv Medium</h3>
            <p class="mt-1 text-xs text-gray-500">Growing business, multiple locations or teams</p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900">{{ isYearly ? 'N100,000' : 'N10,000' }}</span>
              <span v-if="isYearly" class="text-sm text-gray-400 line-through">N120,000</span>
            </div>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600">
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Everything in Micro</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Up to 5 stores</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Up to 10 departments, 25 staff per store</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Analytics & reports</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Duplicate folders & products</li>
              <li class="flex items-start gap-2 text-gray-500"><span class="shrink-0">—</span> No stock transfers between stores (Enterprise only)</li>
            </ul>
            <button @click="showContactFormModal = true" class="mt-6 w-full rounded-full bg-primary-500 text-white py-2.5 text-sm font-medium hover:bg-primary-600 transition-colors">Get started</button>
          </div>
          <!-- Enterprise: unlimited. Multi-store sync, priority support. -->
          <div data-section-id="pricing-3" class="scroll-animate scroll-animate-scale stagger-3 rounded-2xl border border-gray-200 bg-white p-6 flex flex-col hover:border-primary-200 transition-colors">
            <h3 class="text-lg font-semibold text-gray-900">Storvv Enterprise</h3>
            <p class="mt-1 text-xs text-gray-500">Larger operations, central management</p>
            <div class="mt-4 flex items-baseline gap-2">
              <span class="text-2xl font-bold text-gray-900">{{ isYearly ? 'N200,000' : 'N25,000' }}</span>
              <span v-if="isYearly" class="text-sm text-gray-400 line-through">N300,000</span>
            </div>
            <p class="text-sm text-gray-500">{{ isYearly ? '/ year' : '/ month' }}</p>
            <ul class="mt-6 space-y-2 flex-1 text-sm text-gray-600">
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Everything in Medium</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Unlimited stores</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Unlimited departments & staff</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Multi-store sync & stock transfers</li>
              <li class="flex items-center gap-2"><CheckIcon class="w-4 h-4 text-primary-500 shrink-0" />Priority support</li>
            </ul>
            <button @click="showContactFormModal = true" class="mt-6 w-full rounded-full bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors">Get started</button>
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
        <div class="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-6 border border-white/20">
          <ShieldCheckIcon class="w-7 h-7 text-white" />
              </div>
        <h2 class="text-3xl sm:text-4xl font-bold text-white tracking-tight">Security you can trust</h2>
        <p class="mt-4 text-white/90 text-lg max-w-2xl mx-auto">Your data is safeguarded with industry-leading security and compliance.</p>
        <div class="mt-12 grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div class="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 text-center">
            <ShieldCheckIcon class="w-8 h-8 text-white mx-auto mb-3" />
            <h3 class="font-semibold text-white">High-grade security</h3>
            <p class="mt-1 text-sm text-white/80">End-to-end encryption for all data.</p>
              </div>
          <div class="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 text-center">
            <LockClosedIcon class="w-8 h-8 text-white mx-auto mb-3" />
            <h3 class="font-semibold text-white">Data privacy</h3>
            <p class="mt-1 text-sm text-white/80">Your data stays yours. We never share.</p>
            </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" data-section-id="faq" class="scroll-animate scroll-animate-up py-20 lg:py-28 bg-slate-50">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center">Common questions</h2>
        <p class="mt-2 text-gray-600 text-center text-sm">Answers to help you understand Storvv.</p>
        <div class="mt-10 space-y-2">
          <div data-section-id="faq-1" class="scroll-animate scroll-animate-scale stagger-1 bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors">
            <button
              @click="toggleFaq(0)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <ClockIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">How quickly can I get started?</h3>
              </div>
              <ChevronUpIcon 
                :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(0) ? 'rotate-180' : '']" 
              />
            </button>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[500px]"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 max-h-[500px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-show="openFaqItems.has(0)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Most stores are up and running within minutes. Create your store profile, set up your first inventory folder, and you're ready to start managing sales. No coding or technical expertise needed.</p>
                </div>
              </div>
            </Transition>
            </div>
            
          <div data-section-id="faq-2" class="scroll-animate scroll-animate-scale stagger-2 bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(1)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <SparklesIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">Is Storvv difficult to learn?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(1) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(1)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Not at all. Storvv is built with simplicity in mind. The interface is intuitive and straightforward—if you can use a smartphone, you can use Storvv. We've designed it specifically for store owners and managers.</p>
                </div>
              </div>
            </Transition>
          </div>

          <div data-section-id="faq-3" class="scroll-animate scroll-animate-scale stagger-3 bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(2)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <ChartBarIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">Can I track in-store and online sales together?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(2) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(2)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Absolutely. Storvv provides a unified view of all your sales channels. Whether transactions happen at your physical location or through other channels, everything is consolidated in one dashboard for complete visibility.</p>
                </div>
              </div>
            </Transition>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(3)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <FolderIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
            </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">How do custom inventory folders work?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(3) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(3)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products. Each folder can have its own template, and you can enable serial number tracking for individual items.</p>
                </div>
              </div>
            </Transition>
            </div>
            
          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(4)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <DocumentTextIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">Can I import products from Excel?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(4) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(4)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Yes! Storvv supports bulk import from Excel spreadsheets. Simply upload your Excel file, and items will be automatically added to your inventory folders. You can also export your inventory data to Excel for backup or analysis.</p>
                </div>
              </div>
            </Transition>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(5)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <UsersIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">How does customer tracking work?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(5) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(5)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Customers are automatically created when you generate receipts. They're tracked by email, phone, or address. View complete purchase history, total spending, and order counts for each customer—all without manual data entry.</p>
                </div>
              </div>
            </Transition>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(6)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <ArrowPathIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">What are swap-in transactions?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(6) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(6)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Swap-in transactions allow customers to exchange items. When a customer swaps in an item, it's automatically added back to your inventory, and the transaction is tracked. Perfect for device exchanges, trade-ins, or returns.</p>
                </div>
              </div>
            </Transition>
            </div>
            
          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(7)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <KeyIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">How do role-based permissions work?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(7) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(7)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Storvv supports three roles: Super Admin (full access), Manager (can manage assigned folders and staff), and Staff (limited access based on department). You can control folder access at the department level, ensuring staff only see relevant inventory.</p>
                </div>
              </div>
            </Transition>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(8)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <BellAlertIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">What are low stock alerts?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(8) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(8)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Storvv automatically tracks low stock items based on your configured threshold. For serial number folders, it alerts when available items fall below the threshold. For bulk items, it counts individual items with low quantities. Get notified on your dashboard.</p>
                </div>
              </div>
            </Transition>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(9)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">Can I manage multiple stores?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(9) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(9)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Yes! Premium plans support multiple store locations. Each store has its own inventory folders, receipts, and staff. Manage everything from one centralized dashboard while keeping store data separate.</p>
                </div>
              </div>
            </Transition>
            </div>
            
          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(10)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
          </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">Is my data secure?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(10) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(10)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">Yes, absolutely. Storvv uses enterprise-grade security to protect all your data. Your information is encrypted, and we never share your data without your explicit permission.</p>
                </div>
              </div>
            </Transition>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button @click="toggleFaq(11)" class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <BanknotesIcon class="w-4 h-4 text-primary-500 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-500 transition-colors pr-8">What’s the difference between Micro, Medium, and Enterprise?</h3>
              </div>
              <ChevronUpIcon :class="['w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaqItems.has(11) ? 'rotate-180' : '']" />
            </button>
            <Transition enter-active-class="transition-all duration-200 ease-out" enter-from-class="opacity-0 max-h-0" enter-to-class="opacity-100 max-h-[500px]" leave-active-class="transition-all duration-200 ease-in" leave-from-class="opacity-100 max-h-[500px]" leave-to-class="opacity-0 max-h-0">
              <div v-show="openFaqItems.has(11)" class="px-4 sm:px-5 pb-4 sm:pb-5">
                <div class="pl-11 sm:pl-12">
                  <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    <strong>Micro (free):</strong> One store, one department, up to 2 staff. Full inventory, receipts, returns, and customers; dashboard and notifications. No analytics, no multiple departments, no multi-store sync.<br><br>
                    <strong>Medium:</strong> Everything in Micro plus up to 5 stores, up to 10 departments and 25 staff per store, analytics and reports, and duplicate folders/products. No stock transfers between stores.<br><br>
                    <strong>Enterprise:</strong> Everything in Medium plus unlimited stores, departments, and staff; multi-store sync (transfer stock between locations); and priority support.
                  </p>
                </div>
              </div>
            </Transition>
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
          <div class="inline-flex items-center justify-center w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl mb-6 border border-white/20">
            <SparklesIcon class="w-7 h-7 text-white flex-shrink-0" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Ready to Build Your Perfect Store System?
        </h2>
          <p class="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Start your free trial and see how Storvv adapts to your business needs
        </p>
      </div>

        <!-- Features Grid -->
        <div class="mb-12 sm:mb-16">
          <p class="text-center text-base sm:text-lg text-white/70 mb-8 font-medium">
            Store owners choose Storvv because it gives them:
          </p>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <FolderIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Complete flexibility to organize inventory their way
                </p>
              </div>
            </div>
            
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <UsersIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Automatic customer tracking from every transaction
                </p>
              </div>
            </div>
            
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <ReceiptPercentIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Professional receipts that print perfectly every time
                </p>
              </div>
            </div>
            
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
                  <UserGroupIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Team management with precise access control
                </p>
              </div>
            </div>
            
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-400/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-400/30 transition-colors">
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
    <button
            @click="showContactFormModal = true"
            class="group inline-flex items-center gap-2 bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started Now
            <ArrowRightIcon class="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </button>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" data-section-id="contact" class="scroll-animate scroll-animate-up py-20 lg:py-28 bg-white">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-6">
          <EnvelopeIcon class="w-7 h-7 text-primary-500" />
        </div>
        <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Get in touch</h2>
        <p class="mt-4 text-gray-600">Questions, feedback, or partnership we’d love to hear from you.</p>
          <button
            @click="showContactFormModal = true"
          class="mt-8 inline-flex items-center gap-2 rounded-full bg-primary-600 text-white font-medium px-6 py-3 hover:bg-primary-700 transition-colors"
          >
          Contact us
          <ArrowRightIcon class="w-5 h-5" />
          </button>
      </div>
    </section>

    <!-- Footer -->
    <footer id="about" class="bg-slate-50 border-t border-gray-200/80">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div class="grid lg:grid-cols-12 gap-10 pb-10 border-b border-gray-200/80">
          <!-- Brand -->
          <div class="lg:col-span-4 space-y-4">
            <NuxtLink to="/" class="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
              <img src="/storvv logo 2.png" alt="Storvv" class="h-7 w-auto object-contain" />
            </NuxtLink>
            <p class="text-sm text-gray-600 leading-relaxed max-w-sm">
              Store management software for modern retailers, inventory, receipts, customers, and teams in one fast system.
            </p>
            <div class="flex items-center gap-4 pt-1">
              <a
                href="https://x.com/_storvv_"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                aria-label="X"
              >
                <svg class="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/_storvv_"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                aria-label="Instagram"
              >
                <svg class="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd"/>
                </svg>
              </a>
          </div>
        </div>

          <!-- Links -->
          <div class="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Product</h4>
              <ul class="space-y-2.5">
                <li><a href="#features" @click.prevent="scrollToSection('features')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#pricing" @click.prevent="scrollToSection('pricing')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Plans</a></li>
                <li><a href="#faq" @click.prevent="scrollToSection('faq')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Company</h4>
              <ul class="space-y-2.5">
                <li><a href="#about" @click.prevent="scrollToSection('about')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#contact" @click.prevent="scrollToSection('contact')" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Legal</h4>
              <ul class="space-y-2.5">
                <li><NuxtLink to="/privacy" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Privacy</NuxtLink></li>
                <li><NuxtLink to="/terms" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Terms</NuxtLink></li>
              </ul>
            </div>
            <div>
              <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Support</h4>
              <ul class="space-y-2.5">
                <li><a href="mailto:support@storvv.com" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">support@storvv.com</a></li>
                <li><a href="https://www.instagram.com/_storvv_" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">Instagram</a></li>
                <li><a href="https://x.com/_storvv_" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-600 hover:text-gray-900 transition-colors">X</a></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p class="text-sm text-gray-500">
            &copy; {{ new Date().getFullYear() }} Storvv. All rights reserved.
          </p>
          <p class="text-sm text-gray-500">
            Store management for modern retailers.
          </p>
        </div>
      </div>

      <!-- Cookie consent banner -->
      <div
        v-if="!cookiesAccepted"
        class="bg-gray-100 border-t border-gray-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4"
      >
        <p class="text-sm text-gray-600">
          We use cookies on our website to help us provide the best browsing experience. By continuing to use our website you are deemed to have agreed to the use of cookies.
        </p>
        <div class="flex items-center gap-3 flex-shrink-0">
          <NuxtLink to="/privacy" class="text-sm font-medium text-primary-500 hover:text-primary-600">
            Learn more
          </NuxtLink>
          <button
            @click="acceptCookies"
            class="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
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
      class="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
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
    >
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Us</h3>
      </template>
      <div class="min-h-[500px]">
        <iframe
          v-if="showContactFormModal"
          src="https://forms.fillout.com/t/89G44ZqC6Zus"
          title="Contact form"
          class="w-full h-[600px] min-h-[500px] border-0 rounded-md"
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
          <div class="mx-auto w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
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
            class="w-full max-w-xs mx-auto bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3.5 rounded-lg font-semibold text-base hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Modal from '~/components/ui/Modal.vue'
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

useForceLightPage()

const mobileMenuOpen = ref(false)
const showBackToTop = ref(false)
const isYearly = ref(false)
const showLaunchModal = ref(false)
const showContactFormModal = ref(false)
const cookiesAccepted = ref(true)
const whyActiveStep = ref(0)
let whyActiveStepInterval: number | null = null

const acceptCookies = () => {
  cookiesAccepted.value = true
  if (import.meta.client) localStorage.setItem('storvv-cookies-accepted', 'true')
}

const visibleSections = ref<Set<string>>(new Set())
const heroBackground = ref<HTMLElement | null>(null)
const openFaqItems = ref<Set<number>>(new Set())

const toggleFaq = (index: number) => {
  if (openFaqItems.value.has(index)) {
    openFaqItems.value.delete(index)
  } else {
    openFaqItems.value.add(index)
  }
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

const features = [
  {
    title: 'Custom Inventory Folders',
    description: 'Create unlimited folders with your own fields (text, numbers, dates, currency, select, boolean). Each folder can have serial number tracking or bulk quantities—organize inventory your way.'
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
    description: 'Overview dashboard with quick stats. On Medium and Enterprise: full analytics—revenue trends, busiest times, product performance, and exportable reports.'
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
    title: 'In-App Notifications',
    description: 'Stay updated with notifications for sales, low stock, and important account activity—all in one feed.'
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
  if (element) {
    const navHeight = 80
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - navHeight

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

const isScrolled = ref(false)

let rafId: number | null = null

const handleScroll = () => {
  // Show button when user scrolls down more than 400px
  showBackToTop.value = window.scrollY > 400
  // Update nav shadow based on scroll
  isScrolled.value = window.scrollY > 20
  
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
      const parallaxSpeed = 0.18
      const translateY = scrolled * parallaxSpeed
      heroBackground.value.style.transform = `translate3d(0, ${translateY}px, 0) scale(1.06)`
      return
    }

    // Lock position when past hero section
    const maxTranslate = heroHeight * 0.18
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
      rootMargin: '0px 0px -100px 0px',
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

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
