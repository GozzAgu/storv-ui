<template>
  <div class="min-h-screen bg-white antialiased">
    <!-- Navigation -->
    <nav :class="['fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-all duration-300', isScrolled ? 'shadow-lg' : 'shadow-sm']">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-12 lg:h-14">
            <NuxtLink to="/" class="flex items-center space-x-2 group hover:opacity-80 transition-opacity">
              <img
                :src="logoSource"
                alt="Storvv Logo 2"
                class="h-5 sm:h-8 w-auto object-contain"
              />
            </NuxtLink>
          <div class="hidden md:flex items-center space-x-8">
            <a href="#features" @click.prevent="scrollToSection('features')" class="text-sm text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:scale-105 relative group">
              <span>Features</span>
              <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#about" @click.prevent="scrollToSection('about')" class="text-sm text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:scale-105 relative group">
              <span>About</span>
              <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#contact" @click.prevent="scrollToSection('contact')" class="text-sm text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:scale-105 relative group">
              <span>Contact</span>
              <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <button @click="showLaunchModal = true" class="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition-all duration-200 hover:scale-105 hover:shadow-lg">
              Start Free Trial
            </button>
          </div>
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 text-gray-700"
            aria-label="Toggle menu"
          >
            <Bars3Icon v-if="!mobileMenuOpen" class="w-6 h-6" />
            <XMarkIcon v-else class="w-6 h-6" />
          </button>
        </div>
        
        <!-- Mobile Menu -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div v-if="mobileMenuOpen" class="md:hidden pb-4 space-y-3">
            <a href="#features" @click.prevent="scrollToSection('features'); mobileMenuOpen = false" class="block text-gray-700 hover:text-gray-900 font-medium py-2">
              Features
            </a>
            <a href="#about" @click.prevent="scrollToSection('about'); mobileMenuOpen = false" class="block text-gray-700 hover:text-gray-900 font-medium py-2">
              About
            </a>
            <a href="#contact" @click.prevent="scrollToSection('contact'); mobileMenuOpen = false" class="block text-gray-700 hover:text-gray-900 font-medium py-2">
              Contact
            </a>
            <button @click="showLaunchModal = true; mobileMenuOpen = false" class="block w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold mt-2 text-center">
              Start Free Trial
            </button>
          </div>
        </Transition>
      </div>
    </nav>

    <!-- Hero Section (NNPC-style) -->
    <section class="relative pt-24 sm:pt-28 lg:pt-32 pb-20 sm:pb-24 min-h-screen flex items-center overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0">
        <div class="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,63,141,0.35),transparent_55%)]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.22),transparent_55%)]"></div>
      </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <!-- Left: Copy -->
          <div class="max-w-xl">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-2 text-[11px] font-semibold text-white/80">
              <SparklesIcon class="w-4 h-4 text-primary-300" />
              <span>Effortless store operations, built for modern teams</span>
            </div>

            <h1 class="mt-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
              <span class="block text-white/90">Power Your Store</span>
              <span class="block">
                With <span class="text-primary-300">Storvv</span>
                </span>
              </h1>

            <p class="mt-5 text-base sm:text-lg text-white/70 leading-relaxed">
              Build inventory your way, generate clean receipts, track customers automatically, and collaborate with your team all in one system.
            </p>

            <div class="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                @click="showLaunchModal = true"
                class="inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 transition-colors"
              >
                Get Started
              </button>
              <button
                @click="scrollToSection('features')"
                class="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 py-3 transition-colors"
              >
                See Features
              </button>
            </div>
          </div>
          
          <!-- Right: Image + floating callouts -->
          <div class="relative">
            <!-- Circular gradient -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-[360px] h-[360px] sm:w-[430px] sm:h-[430px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_60%)]"></div>
              </div>
              
            <!-- Image circle -->
            <div class="relative mx-auto w-[340px] h-[340px] sm:w-[420px] sm:h-[420px]">
              <div class="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/20 via-primary-500/15 to-transparent blur-2xl"></div>
              <div class="relative rounded-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur">
                <img
                  ref="heroBackground"
                  src="/hero-img.jpg"
                  alt="Storvv hero"
                  class="w-full h-full object-cover hero-parallax scale-[1.02]"
                />
                </div>
                </div>

            <!-- Floating cards -->
            <div class="absolute left-0 top-8 sm:top-10">
              <div class="w-[170px] sm:w-[210px] rounded-lg border border-primary-400/30 bg-slate-950/40 backdrop-blur px-4 py-3">
                <div class="flex items-center gap-2 text-white/90 text-xs font-semibold">
                  <FolderIcon class="w-4 h-4 text-primary-300" />
                  <span>Flexible Inventory</span>
              </div>
                <p class="mt-1 text-[11px] text-white/70 leading-snug">
                  Build folders and templates that fit your products.
                </p>
            </div>
          </div>

            <div class="absolute right-0 top-6 sm:top-8">
              <div class="w-[170px] sm:w-[210px] rounded-lg border border-primary-400/30 bg-slate-950/40 backdrop-blur px-4 py-3">
                <div class="flex items-center gap-2 text-white/90 text-xs font-semibold">
                  <UsersIcon class="w-4 h-4 text-primary-300" />
                  <span>Auto Tracking</span>
                </div>
                <p class="mt-1 text-[11px] text-white/70 leading-snug">
                  Customers and sales history captured automatically.
                </p>
              </div>
        </div>
        
            <div class="absolute left-12 sm:left-16 bottom-4 sm:bottom-6">
              <div class="w-[190px] sm:w-[230px] rounded-lg border border-white/15 bg-slate-950/40 backdrop-blur px-4 py-3">
                <div class="flex items-center gap-2 text-white/90 text-xs font-semibold">
                  <UserGroupIcon class="w-4 h-4 text-white/80" />
                  <span>Team Collaboration</span>
            </div>
                <p class="mt-1 text-[11px] text-white/70 leading-snug">
                  Roles, permissions, and shared workflows in one place.
                </p>
          </div>
            </div>
          </div>
            </div>
          </div>
    </section>

    <!-- Problem/Solution Section (NNPC-style "Why Join" layout) -->
    <section
      data-section-id="problem"
      class="scroll-animate scroll-animate-up py-24 sm:py-28 lg:py-32 bg-white text-gray-900 relative overflow-hidden"
    >

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-10 sm:mb-14">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Why Choose <span class="text-primary-600">Storvv</span>?
          </h2>
          <p class="mt-3 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A modern operations layer for inventory, sales, customers, and teams—built to stay fast, clean, and flexible as you scale.
          </p>
          </div>
          
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <!-- Left: stacked imagery -->
          <div class="relative">
            <div class="relative h-[320px] sm:h-[380px] lg:h-[420px]">
              <div class="absolute left-0 top-0 w-[82%] h-[68%] rounded-2xl overflow-hidden border border-gray-200 bg-white">
                <img src="/hero-img.jpg" alt="Storvv preview" class="w-full h-full object-cover" />
            </div>
              <div class="absolute left-10 sm:left-16 top-12 w-[82%] h-[68%] rounded-2xl overflow-hidden border border-gray-200 bg-white">
                <img src="/questions.jpg" alt="Insights" class="w-full h-full object-cover" />
          </div>
              <div class="absolute left-5 sm:left-10 top-24 w-[82%] h-[68%] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.15)]">
                <img src="/nasa-Q1p7bh3SHj8-unsplash.jpg" alt="Operations" class="w-full h-full object-cover" />
            </div>
          </div>
        </div>

          <!-- Right: timeline -->
          <div class="relative">
            <div class="absolute left-[9px] top-2 bottom-2 w-px bg-primary-600/30"></div>

            <div class="space-y-10">
              <div class="relative pl-10">
                <div class="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-primary-100 border border-primary-500/50">
                  <div class="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-primary-600"></div>
                </div>
                <h3 class="text-lg sm:text-xl font-bold">Career Growth for Your Team</h3>
                <p class="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Give staff the right tools and permissions, reduce errors, and keep work flowing smoothly with clear roles and guided processes.
                </p>
                </div>
          
              <div class="relative pl-10">
                <div class="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-primary-100 border border-primary-500/50">
                  <div class="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-primary-600"></div>
              </div>
                <h3 class="text-lg sm:text-xl font-bold">Global-Level Visibility</h3>
                <p class="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  See sales trends, top products, low stock alerts, and customer insights in one dashboard so decisions are always data-backed.
                </p>
            </div>

              <div class="relative pl-10">
                <div class="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-primary-100 border border-primary-500/50">
                  <div class="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-primary-600"></div>
                </div>
                <h3 class="text-lg sm:text-xl font-bold">Sustainably Simple Operations</h3>
                <p class="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Less manual work, fewer tools, cleaner workflows Storvv keeps your store consistent and scalable without adding complexity.
                </p>
                </div>
          
              <div class="pt-2">
                <button
                  @click="showLaunchModal = true"
                  class="inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
                </div>
                </div>
              </div>
    </section>

    <!-- Investor Section -->
    <section class="py-20 sm:py-24 lg:py-28 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <!-- Left: Text Content -->
          <div class="order-2 lg:order-1">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
              For investor opportunities in Storvv
            </h2>
            <a
              href="#contact"
              @click.prevent="scrollToSection('contact')"
              class="inline-flex items-center gap-2 text-gray-900 hover:text-primary-600 font-semibold text-base sm:text-lg transition-colors group"
            >
              <span>GET STARTED</span>
              <span class="text-xl font-bold group-hover:translate-x-1 transition-transform">>></span>
            </a>
            </div>

          <!-- Right: Image -->
          <div class="order-1 lg:order-2">
            <div class="relative rounded-lg overflow-hidden shadow-lg">
              <img
                src="/nasa-Q1p7bh3SHj8-unsplash.jpg"
                alt="Business professionals"
                class="w-full h-[400px] sm:h-[500px] object-cover"
              />
                </div>
                </div>
              </div>
            </div>
    </section>

    <!-- How It Works Section -->
    <section id="features" data-section-id="features" class="scroll-animate scroll-animate-up relative overflow-hidden">
      <div class="grid lg:grid-cols-2 min-h-[600px]">
        <!-- Left: Content (Dark Background) -->
        <div class="bg-slate-900 px-6 sm:px-8 lg:px-12 py-16 sm:py-20 lg:py-24 flex flex-col justify-center">
          <div class="max-w-xl mx-auto lg:mx-0">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
              Getting Started is Simple
            </h2>
            <p class="text-lg sm:text-xl text-gray-300 mb-12 leading-relaxed">
              Five simple steps to get your store running smoothly
            </p>

            <!-- Steps -->
            <div class="space-y-8">
              <!-- Step 1 -->
              <div data-section-id="step-1" class="scroll-animate scroll-animate-up stagger-1 flex items-start gap-4 group">
                <div class="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <BuildingOfficeIcon class="w-6 h-6 text-white flex-shrink-0" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Set Up Your Store</h3>
                  <p class="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Begin by configuring your store information. Choose your currency, set your timezone, define payment methods, and customize settings to match your business needs.
                  </p>
              </div>
            </div>

              <!-- Step 2 -->
              <div data-section-id="step-2" class="scroll-animate scroll-animate-up stagger-2 flex items-start gap-4 group">
                <div class="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <UserGroupIcon class="w-6 h-6 text-white flex-shrink-0" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Create Departments & Add Staff</h3>
                  <p class="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Organize your team by creating departments. Add staff members and assign roles like Super Admin, Manager, or Staff with folder-level permissions.
                  </p>
              </div>
            </div>

              <!-- Step 3 -->
              <div data-section-id="step-3" class="scroll-animate scroll-animate-up stagger-3 flex items-start gap-4 group">
                <div class="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <FolderIcon class="w-6 h-6 text-white flex-shrink-0" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Organize Your Inventory</h3>
                  <p class="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Build inventory folders tailored to your products. Design custom templates with flexible field types. Import items in bulk from Excel or add them individually.
                  </p>
              </div>
            </div>

              <!-- Step 4 -->
              <div data-section-id="step-4" class="scroll-animate scroll-animate-up stagger-4 flex items-start gap-4 group">
                <div class="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <ShoppingCartIcon class="w-6 h-6 text-white flex-shrink-0" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Handle Sales Transactions</h3>
                  <p class="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Process sales with professional receipts. Apply discounts, manage exchanges, and record various payment types. Every transaction automatically builds your customer database.
                  </p>
                </div>
              </div>

              <!-- Step 5 -->
              <div data-section-id="step-5" class="scroll-animate scroll-animate-up stagger-5 flex items-start gap-4 group">
                <div class="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                  <ChartBarIcon class="w-6 h-6 text-white flex-shrink-0" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg sm:text-xl font-bold text-white mb-2">Monitor & Analyze</h3>
                  <p class="text-sm sm:text-base text-gray-300 leading-relaxed">
                    Access comprehensive dashboards showing revenue trends, sales patterns, and inventory health. Make data-driven decisions with real-time insights.
          </p>
        </div>
              </div>
              </div>
            </div>
          </div>

        <!-- Right: Laptop Image (Bright Background) -->
        <div class="bg-primary-500 relative flex items-center justify-center p-8 sm:p-12 lg:p-16">
          <!-- Decorative plus signs -->
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute top-10 right-20 w-8 h-8 text-white/20 text-4xl font-light">+</div>
            <div class="absolute top-32 right-32 w-6 h-6 text-white/20 text-3xl font-light">+</div>
            <div class="absolute bottom-20 right-16 w-8 h-8 text-white/20 text-4xl font-light">+</div>
            <div class="absolute bottom-32 right-40 w-6 h-6 text-white/20 text-3xl font-light">+</div>
              </div>
          
          <!-- Laptop Mockup -->
          <div class="relative z-10 w-full max-w-2xl">
            <div class="relative">
              <!-- Laptop Frame -->
              <div class="bg-gray-800 rounded-lg p-2 shadow-2xl">
                <div class="bg-white rounded overflow-hidden">
                  <!-- Browser Bar -->
                  <div class="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b border-gray-200">
                    <div class="flex gap-1.5">
                      <div class="w-3 h-3 rounded-full bg-red-400"></div>
                      <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div class="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
                      <div class="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500 text-center">
                        storvv.com/dashboard
            </div>
          </div>
                  <!-- Dashboard Preview -->
                  <div class="bg-gray-50 p-6 min-h-[400px]">
                    <div class="flex items-center gap-3 mb-6">
                      <div class="w-8 h-8 bg-primary-600 rounded-lg"></div>
              <div>
                      <div class="h-3 bg-gray-300 rounded w-24 mb-2"></div>
                      <div class="h-2 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
                    <div class="grid grid-cols-3 gap-4 mb-6">
                      <div class="bg-white rounded-lg p-4 border border-gray-200">
                        <div class="h-2 bg-gray-200 rounded w-12 mb-3"></div>
                        <div class="h-6 bg-primary-600 rounded w-20"></div>
          </div>
                      <div class="bg-white rounded-lg p-4 border border-gray-200">
                        <div class="h-2 bg-gray-200 rounded w-12 mb-3"></div>
                        <div class="h-6 bg-primary-600 rounded w-20"></div>
              </div>
                      <div class="bg-white rounded-lg p-4 border border-gray-200">
                        <div class="h-2 bg-gray-200 rounded w-12 mb-3"></div>
                        <div class="h-6 bg-primary-600 rounded w-20"></div>
              </div>
            </div>
                    <div class="bg-white rounded-lg p-4 border border-gray-200">
                      <div class="h-2 bg-gray-200 rounded w-32 mb-4"></div>
                      <div class="space-y-2">
                        <div class="h-2 bg-gray-200 rounded"></div>
                        <div class="h-2 bg-gray-200 rounded w-5/6"></div>
                        <div class="h-2 bg-gray-200 rounded w-4/6"></div>
          </div>
              </div>
              </div>
            </div>
          </div>
              <!-- Laptop Base -->
              <div class="h-2 bg-gray-700 rounded-b-lg mx-auto w-[95%]"></div>
              <div class="h-1 bg-gray-600 rounded-b-lg mx-auto w-[90%]"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Save Time Section -->
    <section data-section-id="features-list" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-32 bg-white relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <!-- Header with CTA on right -->
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <div class="flex-1">
            <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Everything You Need, Nothing You Don't
          </h2>
            <p class="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl">
              Consolidate your tools, simplify your workflow, and reduce costs with one comprehensive solution. Storvv's features are designed to help you overcome your store management challenges while transforming how you operate.
          </p>
        </div>
              <div class="flex-shrink-0">
            <a href="#features" @click.prevent="scrollToSection('features')" class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-base sm:text-lg transition-colors">
              Explore our features
              <ArrowRightIcon class="w-5 h-5" />
            </a>
              </div>
            </div>

        <!-- Carousel Container -->
        <div class="relative">
          <!-- Navigation Arrows -->
          <button
            @click="previousFeature"
            :disabled="currentFeatureIndex === 0"
            :class="[
              'absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center transition-all',
              currentFeatureIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-gray-400'
            ]"
            aria-label="Previous feature"
          >
            <ChevronLeftIcon class="w-6 h-6 text-gray-700" />
          </button>
          
          <button
            @click="nextFeature"
            :disabled="currentFeatureIndex >= features.length - visibleFeatures"
            :class="[
              'absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center transition-all',
              currentFeatureIndex >= features.length - visibleFeatures ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-gray-400'
            ]"
            aria-label="Next feature"
          >
            <ChevronRightIcon class="w-6 h-6 text-gray-700" />
          </button>

          <!-- Carousel -->
          <div class="overflow-hidden px-12">
            <div
              class="flex transition-transform duration-500 ease-in-out"
              :style="{ transform: `translateX(-${currentFeatureIndex * (100 / visibleFeatures)}%)` }"
            >
              <div
                v-for="(feature, index) in features"
                :key="index"
                class="flex-shrink-0 px-3"
                :style="{ width: `${100 / visibleFeatures}%` }"
              >
                <div class="bg-white border border-gray-200 rounded-lg p-6 h-full flex flex-col hover:border-gray-300 transition-colors">
                  <h3 class="text-xl font-bold text-gray-900 mb-4">{{ feature.title }}</h3>
                  <p class="text-gray-600 leading-relaxed mb-6 flex-1">{{ feature.description }}</p>
                  <a
                    href="#"
                    @click.prevent
                    class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors mt-auto"
                  >
                    Explore
                    <ArrowRightIcon class="w-4 h-4" />
                  </a>
                </div>
              </div>
              </div>
            </div>

          <!-- Dot Indicators -->
          <div class="flex justify-center items-center gap-2 mt-8">
            <button
              v-for="(dot, index) in totalDots"
              :key="index"
              @click="goToFeature(index * visibleFeatures)"
              :class="[
                'w-2 h-2 rounded-full transition-all',
                Math.floor(currentFeatureIndex / visibleFeatures) === index
                  ? 'bg-primary-600 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              ]"
              :aria-label="`Go to slide ${index + 1}`"
            />
                </div>
              </div>
              </div>
    </section>

    <!-- Advanced Features Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <GlobeAltIcon class="w-8 h-8 text-primary-600 flex-shrink-0" />
                </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Built to Scale with Your Business
          </h2>
          <p class="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Advanced capabilities that grow with you, from single locations to multi-store operations.
          </p>
            </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 transition-all group">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BuildingOfficeIcon class="w-6 h-6 text-primary-600 flex-shrink-0" />
                </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Multi-Store Support</h3>
            <p class="text-gray-600">Manage multiple store locations from one account. Centralized control with store-specific inventory and sales tracking.</p>
              </div>
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 transition-all group">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BellAlertIcon class="w-6 h-6 text-red-600 flex-shrink-0" />
              </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Low Stock Alerts</h3>
            <p class="text-gray-600">Automatically track low stock items. Get alerts when inventory falls below your threshold for both serial numbers and bulk items.</p>
            </div>
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 transition-all group">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DocumentTextIcon class="w-6 h-6 text-primary-600 flex-shrink-0" />
          </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Excel Import/Export</h3>
            <p class="text-gray-600">Bulk import products from Excel spreadsheets or export your inventory data. Smart duplicate detection included.</p>
          </div>
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 transition-all group">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ChartBarIcon class="w-6 h-6 text-blue-600 flex-shrink-0" />
              </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Real-Time Analytics</h3>
            <p class="text-gray-600">Track revenue, sales trends, inventory values, and customer insights. Make data-driven decisions with comprehensive dashboards.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" data-section-id="pricing" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-2xl mb-6 shadow-sm">
            <BanknotesIcon class="w-10 h-10 text-primary-600 flex-shrink-0" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Select the Perfect Plan for Your Business
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            From small shops to large operations, we have a plan that fits your needs
          </p>
          
          <!-- Billing Toggle -->
          <div class="inline-flex items-center justify-center gap-4 p-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
            <span :class="['text-sm font-semibold transition-colors px-4 py-2 rounded-full', isYearly ? 'text-gray-600' : 'text-gray-900 bg-gray-100']">Monthly</span>
            <button
              @click="isYearly = !isYearly"
              :class="[
                'relative inline-flex h-9 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isYearly ? 'bg-primary-600' : 'bg-gray-300'
              ]"
              role="switch"
              :aria-checked="isYearly"
            >
              <span
                :class="[
                  'inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-200 ease-in-out',
                  isYearly ? 'translate-x-8' : 'translate-x-1'
                ]"
              />
            </button>
            <span :class="['text-sm font-semibold transition-colors px-4 py-2 rounded-full', isYearly ? 'text-gray-900 bg-gray-100' : 'text-gray-600']">
              Yearly
              <span class="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">Save 15%</span>
            </span>
              </div>
            </div>
            
        <!-- Pricing Cards -->
        <div class="grid sm:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          <!-- Starter Plan -->
          <div data-section-id="pricing-1" class="scroll-animate scroll-animate-scale stagger-1 bg-white rounded-2xl border-2 border-gray-200 p-8 lg:p-10 hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
            <div class="mb-8">
              <h3 class="text-xl font-bold text-gray-900 mb-3">Starter</h3>
              <p class="text-gray-600 mb-6 leading-relaxed">Ideal for Small Shops Getting Started</p>
              <div class="mb-2">
                <div class="text-4xl font-bold text-gray-900">FREE</div>
                <p class="text-gray-500 text-sm mt-1">to get started</p>
              </div>
            </div>
            <button @click="showLaunchModal = true" class="w-full bg-gray-100 text-gray-900 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors mb-8 text-center border border-gray-200">
              Get Started
            </button>
            <ul class="space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">1 store location</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 50 inventory items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Custom inventory folders with templates</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Professional receipt generation</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Automatic customer tracking</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Basic analytics dashboard</span>
              </li>
            </ul>
          </div>

          <!-- Professional Plan -->
          <div data-section-id="pricing-2" class="scroll-animate scroll-animate-scale stagger-2 bg-white rounded-2xl border-2 border-primary-600 p-8 lg:p-10 relative transform scale-105 hover:scale-110 transition-all duration-300 flex flex-col z-10">
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span class="bg-primary-600 text-white px-5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
                Popular
              </span>
            </div>
            <div class="mb-8">
              <h3 class="text-xl font-bold text-gray-900 mb-3">Professional</h3>
              <p class="text-gray-600 mb-6 leading-relaxed">Perfect for Growing Retail Operations</p>
              <div class="mb-2">
                <div class="flex items-baseline gap-2">
                  <div class="text-4xl font-bold text-gray-900">{{ isYearly ? '$153' : '$15' }}</div>
                  <span v-if="isYearly" class="text-xl text-gray-400 line-through">$180</span>
              </div>
                <p class="text-gray-500 text-sm mt-1">{{ isYearly ? 'per year' : 'per month' }}</p>
                <p v-if="isYearly" class="text-primary-600 text-xs font-semibold mt-2">Save $27/year</p>
            </div>
            </div>
            <button @click="showLaunchModal = true" class="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors mb-8 text-center">
              Start Free Trial
            </button>
            <ul class="space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Everything in Starter</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">1 store location</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 2,500 inventory items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 3 users with role-based permissions</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Department and staff management</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Discounts and swap-in transactions</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Returns and refunds processing</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Excel import/export</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Low stock alerts</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Advanced analytics and reports</span>
              </li>
            </ul>
          </div>

          <!-- Enterprise Plan -->
          <div data-section-id="pricing-3" class="scroll-animate scroll-animate-scale stagger-3 bg-white rounded-2xl border-2 border-gray-200 p-8 lg:p-10 hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
            <div class="mb-8">
              <h3 class="text-xl font-bold text-gray-900 mb-3">Enterprise</h3>
              <p class="text-gray-600 mb-6 leading-relaxed">For Multi-Location Retail Chains</p>
              <div class="mb-2">
                <div class="flex items-baseline gap-2">
                  <div class="text-4xl font-bold text-gray-900">{{ isYearly ? '$255' : '$25' }}</div>
                  <span v-if="isYearly" class="text-xl text-gray-400 line-through">$300</span>
              </div>
                <p class="text-gray-500 text-sm mt-1">{{ isYearly ? 'per year' : 'per month' }}</p>
                <p v-if="isYearly" class="text-primary-600 text-xs font-semibold mt-2">Save $45/year</p>
            </div>
            </div>
            <button @click="showLaunchModal = true" class="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-8 text-center">
              Start Free Trial
            </button>
            <ul class="space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Everything in Professional</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Unlimited inventory items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 3 store locations</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 10 users with advanced permissions</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Folder-level access control for departments</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Multi-currency support</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Comprehensive analytics and forecasting</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Priority customer support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust & Security Section -->
    <section class="py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-2xl mb-8 border border-primary-100">
            <ShieldCheckIcon class="w-10 h-10 text-primary-600 flex-shrink-0" />
              </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Security You Can Trust
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Your business data is safeguarded with industry-leading security measures and compliance protocols
          </p>
            </div>
            
        <!-- Security Cards -->
        <div class="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- High Grade Security Card -->
          <div class="group relative bg-white p-10 rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-1 text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <ShieldCheckIcon class="w-10 h-10 text-white flex-shrink-0" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">High Grade Security</h3>
            <p class="text-gray-600 leading-relaxed">End-to-end encryption protects all your data</p>
          </div>
          
          <!-- Data Privacy Card -->
          <div class="group relative bg-white p-10 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <LockClosedIcon class="w-10 h-10 text-white flex-shrink-0" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Data Privacy</h3>
            <p class="text-gray-600 leading-relaxed">Your data belongs to you. We never share.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" data-section-id="faq" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-28 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-xl mb-6">
            <DocumentTextIcon class="w-8 h-8 text-primary-600 flex-shrink-0" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Common Questions
          </h2>
          <p class="text-base sm:text-lg text-gray-600 leading-relaxed">
            Answers to help you understand Storvv better
          </p>
        </div>

        <!-- FAQ Items -->
        <div class="space-y-3">
          <div data-section-id="faq-1" class="scroll-animate scroll-animate-scale stagger-1 bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <ClockIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">How quickly can I get started?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Most stores are up and running within minutes. Create your store profile, set up your first inventory folder, and you're ready to start managing sales. No coding or technical expertise needed.</p>
              </div>
            </div>
          </div>

          <div data-section-id="faq-2" class="scroll-animate scroll-animate-scale stagger-2 bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <SparklesIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Is Storvv difficult to learn?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Not at all. Storvv is built with simplicity in mind. The interface is intuitive and straightforward—if you can use a smartphone, you can use Storvv. We've designed it specifically for store owners and managers.</p>
              </div>
            </div>
          </div>

          <div data-section-id="faq-3" class="scroll-animate scroll-animate-scale stagger-3 bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Can I track in-store and online sales together?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Absolutely. Storvv provides a unified view of all your sales channels. Whether transactions happen at your physical location or through other channels, everything is consolidated in one dashboard for complete visibility.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FolderIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">How do custom inventory folders work?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products. Each folder can have its own template, and you can enable serial number tracking for individual items.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Can I import products from Excel?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Yes! Storvv supports bulk import from Excel spreadsheets. Simply upload your Excel file, and items will be automatically added to your inventory folders. You can also export your inventory data to Excel for backup or analysis.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <UsersIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">How does customer tracking work?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Customers are automatically created when you generate receipts. They're tracked by email, phone, or address. View complete purchase history, total spending, and order counts for each customer—all without manual data entry.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <ArrowPathIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">What are swap-in transactions?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Swap-in transactions allow customers to exchange items. When a customer swaps in an item, it's automatically added back to your inventory, and the transaction is tracked. Perfect for device exchanges, trade-ins, or returns.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <KeyIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">How do role-based permissions work?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Storvv supports three roles: Super Admin (full access), Manager (can manage assigned folders and staff), and Staff (limited access based on department). You can control folder access at the department level, ensuring staff only see relevant inventory.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <BellAlertIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">What are low stock alerts?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Storvv automatically tracks low stock items based on your configured threshold. For serial number folders, it alerts when available items fall below the threshold. For bulk items, it counts individual items with low quantities. Get notified on your dashboard.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Can I manage multiple stores?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Yes! Premium plans support multiple store locations. Each store has its own inventory folders, receipts, and staff. Manage everything from one centralized dashboard while keeping store data separate.</p>
              </div>
            </div>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 hover:border-primary-300 transition-colors group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon class="w-5 h-5 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Is my data secure?</h3>
                <p class="text-sm sm:text-base text-gray-600 leading-relaxed">Yes, absolutely. Storvv uses enterprise-grade security to protect all your data. Your information is encrypted, and we never share your data without your explicit permission.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
      <!-- Pattern overlay -->
      <div class="absolute inset-0 opacity-30 pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, rgb(255 255 255) 1px, transparent 0); background-size: 48px 48px;"></div>
      <!-- Decorative background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
          <SparklesIcon class="w-8 h-8 text-white flex-shrink-0" />
        </div>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
          Ready to Build Your Perfect Store System?
        </h2>
        <p class="text-base sm:text-lg text-white/90 mb-8">
          Start your free trial and see how Storvv adapts to your business needs
        </p>
        <p class="text-base mb-8 font-medium">
          Store owners choose Storvv because it gives them:
        </p>
        <ul class="text-left max-w-md mx-auto mb-8 space-y-3">
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FolderIcon class="w-5 h-5 text-white flex-shrink-0" />
            </div>
            <span>Complete flexibility to organize inventory their way</span>
              </li>
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <UsersIcon class="w-5 h-5 text-white flex-shrink-0" />
            </div>
            <span>Automatic customer tracking from every transaction</span>
              </li>
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ReceiptPercentIcon class="w-5 h-5 text-white flex-shrink-0" />
            </div>
            <span>Professional receipts that print perfectly every time</span>
              </li>
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <UserGroupIcon class="w-5 h-5 text-white flex-shrink-0" />
            </div>
            <span>Team management with precise access control</span>
              </li>
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ChartBarIcon class="w-5 h-5 text-white flex-shrink-0" />
            </div>
            <span>Real-time insights into what's actually happening</span>
              </li>
            </ul>
        <p class="text-lg font-semibold mb-8">
          Experience the difference a truly flexible system makes.
        </p>
        <button @click="showLaunchModal = true" class="group bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-base hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 inline-flex items-center gap-2">
          Get Started Now
          <ArrowRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </button>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" data-section-id="contact" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-2xl mb-8 border border-primary-100">
            <EnvelopeIcon class="w-10 h-10 text-primary-600 flex-shrink-0" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Get in Touch
        </h2>
          <p class="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Have questions? We'd love to hear from you.
        </p>
        </div>

        <!-- Contact Card -->
        <div class="bg-white rounded-2xl border-2 border-gray-200 p-10 sm:p-16 text-center group hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-1">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <EnvelopeIcon class="w-8 h-8 text-white flex-shrink-0" />
          </div>
          <a 
            href="mailto:gozieagu1@gmail.com" 
            class="inline-flex items-center gap-3 text-2xl sm:text-3xl font-bold text-primary-600 hover:text-primary-700 transition-colors group/email"
          >
            <span>gozieagu1@gmail.com</span>
            <ArrowRightIcon class="w-6 h-6 group-hover/email:translate-x-1 transition-transform flex-shrink-0" />
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer id="about" class="bg-gray-900 text-gray-400 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <NuxtLink to="/" class="inline-block mb-4 group hover:opacity-80 transition-opacity">
            <img
              src="/storvv logo.png"
              alt="Storvv Logo"
              class="h-8 w-auto object-contain mx-auto"
            />
          </NuxtLink>
          <p class="text-gray-500 max-w-2xl mx-auto">
            Complete store management solution designed for modern retailers.
            </p>
          </div>
        <div class="border-t border-gray-800 pt-8 text-center">
          <p class="text-gray-500 text-sm">
            &copy; 2025 Storvv. All rights reserved.
          </p>
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
        class="fixed bottom-8 right-8 z-50 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-300"
      aria-label="Back to top"
    >
        <ArrowUpIcon class="w-6 h-6 flex-shrink-0" />
    </button>
    </Transition>

    <!-- Launching Soon Modal -->
    <Modal
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
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTheme } from '~/composables/useTheme'
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
} from '@heroicons/vue/24/outline'

const { actualTheme } = useTheme()

const logoSource = computed(() => {
  return actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
})

const mobileMenuOpen = ref(false)
const showBackToTop = ref(false)
const isYearly = ref(false)
const showLaunchModal = ref(false)
const visibleSections = ref<Set<string>>(new Set())
const heroBackground = ref<HTMLElement | null>(null)

// Feature carousel state
const currentFeatureIndex = ref(0)
const visibleFeatures = computed(() => {
  if (typeof window === 'undefined') return 3
  return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
})

const features = [
  {
    title: 'Custom Inventory Folders',
    description: 'Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products exactly.'
  },
  {
    title: 'Serial Number Tracking',
    description: 'Track individual items with serial numbers. Perfect for electronics, devices, or any product that requires unique identification.'
  },
  {
    title: 'Excel Import/Export',
    description: 'Bulk import products from Excel spreadsheets or export your inventory data. Smart duplicate detection included.'
  },
  {
    title: 'Professional Receipt System',
    description: 'Generate A4-optimized receipts with automatic customer tracking. Handle discounts, swap-ins, and multiple payment methods seamlessly.'
  },
  {
    title: 'Automatic Customer Management',
    description: 'Customers are automatically created from receipts. Track purchase history, total spending, and order counts effortlessly.'
  },
  {
    title: 'Returns & Refunds',
    description: 'Process returns and refunds with ease. Automatic inventory restoration and customer history updates built right in.'
  },
  {
    title: 'Team & Department Management',
    description: 'Organize staff into departments with granular role-based permissions. Control folder access for managers and staff members.'
  },
  {
    title: 'Real-Time Analytics Dashboard',
    description: 'Comprehensive dashboard with revenue charts, sales trends, inventory status, and low stock alerts at a glance.'
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
html {
  scroll-behavior: smooth;
}
</style>
