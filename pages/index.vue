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
            <NuxtLink to="/signin" class="bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-primary-700 transition-all duration-200 hover:scale-105 hover:shadow-lg">
              Start Free Trial
            </NuxtLink>
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
          enter-active-class="transition ease-out duration-300"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-200"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-100 mt-3 pt-4 pb-4">
            <div class="space-y-1">
              <a 
                href="#features" 
                @click.prevent="scrollToSection('features'); mobileMenuOpen = false" 
                class="block px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
              Features
            </a>
              <a 
                href="#about" 
                @click.prevent="scrollToSection('about'); mobileMenuOpen = false" 
                class="block px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
              About
            </a>
              <a 
                href="#contact" 
                @click.prevent="scrollToSection('contact'); mobileMenuOpen = false" 
                class="block px-3 py-3 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
              >
                Contact
              </a>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100">
              <NuxtLink 
                to="/signin"
                @click="mobileMenuOpen = false" 
                class="w-full bg-primary-600 text-white px-4 py-3 rounded-lg font-semibold text-sm hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md block text-center"
              >
                Start Free Trial
              </NuxtLink>
            </div>
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
              <NuxtLink
                to="/signin"
                class="inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm sm:text-base font-semibold px-4 sm:px-6 py-2 sm:py-3 transition-colors w-auto"
              >
                Get Started
              </NuxtLink>
              <button
                @click="scrollToSection('features')"
                class="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm sm:text-base font-semibold px-4 sm:px-6 py-2 sm:py-3 transition-colors w-auto"
              >
                See Features
              </button>
            </div>
          </div>
          
          <!-- Right: Image + floating callouts -->
          <div class="relative">
            <!-- Circular gradient -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-[300px] h-[300px] sm:w-[520px] sm:h-[520px] lg:w-[600px] lg:h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_60%)]"></div>
              </div>
              
            <!-- Image circle -->
            <div class="relative mx-auto w-[280px] h-[280px] sm:w-[500px] sm:h-[500px] lg:w-[580px] lg:h-[580px]">
              <div class="absolute inset-0 rounded-full bg-gradient-to-br from-primary-500/20 via-primary-500/15 to-transparent blur-2xl"></div>
              <div class="relative rounded-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur">
                <img
                  ref="heroBackground"
                  src="/cloud security.jpg"
                  alt="Storvv hero"
                  class="w-full h-full object-cover hero-parallax scale-[1.02]"
                />
                </div>
                </div>

            <!-- Floating cards -->
            <div class="absolute left-0 top-4 sm:top-10 lg:top-12">
              <div class="w-[140px] sm:w-[210px] lg:w-[240px] rounded-lg border border-primary-400/30 bg-slate-950/40 backdrop-blur px-3 py-2 sm:px-4 sm:py-3">
                <div class="flex items-center gap-1.5 sm:gap-2 text-white/90 text-[10px] sm:text-sm font-semibold">
                  <FolderIcon class="w-3 h-3 sm:w-5 sm:h-5 text-primary-300" />
                  <span>Flexible Inventory</span>
              </div>
                <p class="mt-1 text-[10px] sm:text-xs text-white/70 leading-snug">
                  Build folders and templates that fit your products.
                </p>
            </div>
          </div>

            <div class="absolute right-0 top-2 sm:top-8 lg:top-10">
              <div class="w-[140px] sm:w-[210px] lg:w-[240px] rounded-lg border border-primary-400/30 bg-slate-950/40 backdrop-blur px-3 py-2 sm:px-4 sm:py-3">
                <div class="flex items-center gap-1.5 sm:gap-2 text-white/90 text-[10px] sm:text-sm font-semibold">
                  <UsersIcon class="w-3 h-3 sm:w-5 sm:h-5 text-primary-300" />
                  <span>Auto Tracking</span>
                </div>
                <p class="mt-1 text-[10px] sm:text-xs text-white/70 leading-snug">
                  Customers and sales history captured automatically.
                </p>
              </div>
        </div>
        
            <div class="absolute left-8 sm:left-16 lg:left-20 bottom-2 sm:bottom-6 lg:bottom-8">
              <div class="w-[150px] sm:w-[230px] lg:w-[260px] rounded-lg border border-white/15 bg-slate-950/40 backdrop-blur px-3 py-2 sm:px-4 sm:py-3">
                <div class="flex items-center gap-1.5 sm:gap-2 text-white/90 text-[10px] sm:text-sm font-semibold">
                  <UserGroupIcon class="w-3 h-3 sm:w-5 sm:h-5 text-white/80" />
                  <span>Team Collaboration</span>
            </div>
                <p class="mt-1 text-[10px] sm:text-xs text-white/70 leading-snug">
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
            A modern operations layer for inventory, sales, customers, and teams built to stay fast, clean, and flexible as you scale.
          </p>
          </div>
          
        <div class="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <!-- Left: single image -->
          <div class="relative">
            <div class="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <img src="/questions.jpg" alt="Questions" class="w-full h-full object-cover" />
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
                <NuxtLink
                  to="/signin"
                  class="inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm sm:text-base font-semibold px-4 sm:px-6 py-2 sm:py-3 transition-colors"
                >
                  Get Started
                </NuxtLink>
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
                src="/invest.jpg"
                alt="Investor opportunities"
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

          <!-- Dashboard Image -->
          <div class="relative z-10 w-full max-w-2xl">
            <div class="relative rounded-lg overflow-hidden shadow-2xl">
              <img
                src="/dash.png"
                alt="Storvv Dashboard"
                class="w-full h-auto object-contain"
              />
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
    <section class="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <!-- Background with patterns -->
      <div class="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50"></div>
      <!-- Subtle grid pattern -->
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px); background-size: 40px 40px;"></div>
      <!-- Decorative circles -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Large Heading -->
        <div class="mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight max-w-5xl">
            Advanced capabilities that grow with you, from single locations to multi-store operations
          </h2>
          </div>

        <!-- Four Feature Boxes -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl">
          <div class="text-center group relative">
            <div class="w-20 h-20 mx-auto mb-6 flex items-center justify-center transition-transform group-hover:scale-110">
              <BuildingOfficeIcon class="w-20 h-20 text-gray-900 stroke-1" stroke-width="1.5" />
              </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-3">Multi-Store Support</h3>
            <p class="text-sm text-gray-600 leading-relaxed opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 max-w-xs mx-auto">
              Manage multiple store locations from one account. Centralized control with store-specific inventory and sales tracking.
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
              Track revenue, sales trends, inventory values, and customer insights. Make data-driven decisions with comprehensive dashboards.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" data-section-id="pricing" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 tracking-tight">
            Find your perfect plan
          </h2>
          
          <!-- Billing Toggle -->
          <div class="flex items-center justify-center gap-4">
            <span :class="['text-sm font-semibold transition-colors', !isYearly ? 'text-gray-900' : 'text-gray-600']">Monthly</span>
            <button
              @click="isYearly = !isYearly"
              :class="[
                'relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                isYearly ? 'bg-primary-600' : 'bg-gray-300'
              ]"
              role="switch"
              :aria-checked="isYearly"
            >
              <span
                :class="[
                  'inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm',
                  isYearly ? 'translate-x-7' : 'translate-x-1'
                ]"
              />
            </button>
            <span :class="['text-sm font-semibold transition-colors flex items-center gap-2', isYearly ? 'text-gray-900' : 'text-gray-600']">
              Yearly
              <span v-if="isYearly" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Save 15%</span>
            </span>
          </div>
        </div>

        <!-- Pricing Cards -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <!-- Storvv Micro -->
          <div data-section-id="pricing-1" class="scroll-animate scroll-animate-scale stagger-1 bg-white rounded-lg border border-gray-200 p-8 hover:border-primary-300 transition-all duration-300 flex flex-col">
            <!-- Icon: 1 block -->
            <div class="w-16 h-16 mx-auto mb-6 flex flex-col items-center justify-center">
              <div class="w-12 h-8 bg-primary-600 rounded border-2 border-primary-700 relative">
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-orange-500"></div>
                </div>
              </div>
            <h3 class="text-xl font-bold text-gray-900 mb-6 text-center">Storvv Micro</h3>
            <div class="mb-6">
              <p class="text-sm font-semibold text-gray-700 mb-4">Includes:</p>
              <ul class="space-y-3">
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Up to 10 active users</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">1 Store location</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Optional Support</span>
                  </li>
                </ul>
              </div>
            <div class="mb-6">
              <p class="text-lg font-bold text-gray-900">FREE / {{ isYearly ? 'annually' : 'monthly' }}:</p>
            </div>
            <NuxtLink to="/signin" class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-colors inline-flex items-center justify-center">
              Get Started
            </NuxtLink>
            </div>

          <!-- Storvv Medium -->
          <div data-section-id="pricing-2" class="scroll-animate scroll-animate-scale stagger-2 bg-white rounded-lg border border-gray-200 p-8 hover:border-primary-300 transition-all duration-300 flex flex-col">
            <!-- Icon: 2 blocks -->
            <div class="w-16 h-16 mx-auto mb-6 flex flex-col items-center justify-center gap-1">
              <div class="w-12 h-6 bg-orange-500 rounded border-2 border-orange-600 relative">
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                </div>
              <div class="w-12 h-6 bg-primary-600 rounded border-2 border-primary-700 relative">
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
              </div>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-6 text-center">Storvv Medium</h3>
            <div class="mb-6">
              <p class="text-sm font-semibold text-gray-700 mb-4">Includes:</p>
              <ul class="space-y-3">
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Up to 100 active users</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Up to 3 Store locations</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Priority Support</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Multi-Store Sync</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Analytics Dashboard</span>
                  </li>
                </ul>
              </div>
            <div class="mb-6">
              <div class="flex items-baseline gap-2">
                <p class="text-lg font-bold text-gray-900">{{ isYearly ? '$153.00' : '$15.00' }} / {{ isYearly ? 'annually' : 'monthly' }}:</p>
                <span v-if="isYearly" class="text-sm text-gray-400 line-through">$180</span>
              </div>
              <p v-if="isYearly" class="text-sm text-green-600 font-semibold mt-1">Save $27/year</p>
            </div>
            <NuxtLink to="/signin" class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-colors inline-flex items-center justify-center">
              Get Started
            </NuxtLink>
            </div>

          <!-- Storvv Enterprise -->
          <div data-section-id="pricing-3" class="scroll-animate scroll-animate-scale stagger-3 bg-white rounded-lg border border-gray-200 p-8 hover:border-primary-300 transition-all duration-300 flex flex-col">
            <!-- Icon: 3 blocks -->
            <div class="w-16 h-16 mx-auto mb-6 flex flex-col items-center justify-center gap-0.5">
              <div class="w-12 h-5 bg-primary-600 rounded border-2 border-primary-700 relative">
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
                </div>
              <div class="w-12 h-5 bg-primary-600 rounded border-2 border-primary-700 relative">
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
              </div>
              <div class="w-12 h-5 bg-primary-600 rounded border-2 border-primary-700 relative">
                <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
              </div>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-6 text-center">Storvv Enterprise</h3>
            <div class="mb-6">
              <p class="text-sm font-semibold text-gray-700 mb-4">Includes:</p>
              <ul class="space-y-3">
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Unlimited active users</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Unlimited Store locations</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">24/7 Priority Support</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Multi-Store Sync</span>
                  </li>
                  <li class="flex items-center gap-2">
                  <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span class="text-sm text-gray-600">Analytics Dashboard</span>
                  </li>
                </ul>
              </div>
            <div class="mb-6">
              <div class="flex items-baseline gap-2">
                <p class="text-lg font-bold text-gray-900">{{ isYearly ? '$255.00' : '$25.00' }} / {{ isYearly ? 'annually' : 'monthly' }}:</p>
                <span v-if="isYearly" class="text-sm text-gray-400 line-through">$300</span>
            </div>
              <p v-if="isYearly" class="text-sm text-green-600 font-semibold mt-1">Save $45/year</p>
                </div>
            <NuxtLink to="/signin" class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-colors inline-flex items-center justify-center">
              Get Started
            </NuxtLink>
              </div>
              </div>
            </div>
    </section>

    <!-- Trust & Security Section -->
    <section class="relative py-20 sm:py-24 lg:py-28 overflow-hidden">
      <!-- Background Image -->
      <div class="absolute inset-0">
        <img
          src="/cloud security 2.jpg"
          alt="Cloud Security"
          class="w-full h-full object-cover"
        />
        <!-- Overlay for readability -->
        <div class="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/70 to-gray-900/80"></div>
                </div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-8 border border-white/20">
            <ShieldCheckIcon class="w-10 h-10 text-white flex-shrink-0" />
              </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Security You Can Trust
          </h2>
          <p class="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Your business data is safeguarded with industry-leading security measures and compliance protocols
          </p>
              </div>
            
        <!-- Security Cards -->
        <div class="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <!-- High Grade Security Card -->
          <div class="group relative bg-white/10 backdrop-blur-lg p-10 rounded-2xl border-2 border-white/20 hover:border-primary-400/50 transition-all duration-300 transform hover:-translate-y-1 text-center">
            <div class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white/30">
              <ShieldCheckIcon class="w-10 h-10 text-white flex-shrink-0" />
            </div>
            <h3 class="text-xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors">High Grade Security</h3>
            <p class="text-white/90 leading-relaxed">End-to-end encryption protects all your data</p>
          </div>

          <!-- Data Privacy Card -->
          <div class="group relative bg-white/10 backdrop-blur-lg p-10 rounded-2xl border-2 border-white/20 hover:border-primary-400/50 transition-all duration-300 transform hover:-translate-y-1 text-center">
            <div class="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white/30">
              <LockClosedIcon class="w-10 h-10 text-white flex-shrink-0" />
            </div>
            <h3 class="text-xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors">Data Privacy</h3>
            <p class="text-white/90 leading-relaxed">Your data belongs to you. We never share.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq" data-section-id="faq" class="scroll-animate scroll-animate-up py-16 sm:py-20 lg:py-24 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-12 sm:mb-16">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-primary-50 rounded-xl mb-4">
            <DocumentTextIcon class="w-6 h-6 text-primary-600 flex-shrink-0" />
          </div>
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
            Common Questions
          </h2>
          <p class="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Answers to help you understand Storvv better
          </p>
        </div>
        
        <!-- FAQ Items -->
        <div class="space-y-3">
          <div data-section-id="faq-1" class="scroll-animate scroll-animate-scale stagger-1 bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors duration-200">
            <button
              @click="toggleFaq(0)"
              class="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left group"
            >
              <div class="flex-shrink-0 w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <ClockIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">How quickly can I get started?</h3>
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
                <SparklesIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">Is Storvv difficult to learn?</h3>
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
                <ChartBarIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">Can I track in-store and online sales together?</h3>
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
                <FolderIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">How do custom inventory folders work?</h3>
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
                <DocumentTextIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">Can I import products from Excel?</h3>
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
                <UsersIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">How does customer tracking work?</h3>
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
                <ArrowPathIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">What are swap-in transactions?</h3>
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
                <KeyIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">How do role-based permissions work?</h3>
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
                <BellAlertIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">What are low stock alerts?</h3>
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
                <BuildingOfficeIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">Can I manage multiple stores?</h3>
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
                <ShieldCheckIcon class="w-4 h-4 text-primary-600 flex-shrink-0" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors pr-8">Is my data secure?</h3>
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
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-20 sm:py-24 lg:py-28 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <!-- Subtle pattern overlay -->
      <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, rgb(255 255 255) 1px, transparent 0); background-size: 40px 40px;"></div>
      
      <!-- Decorative gradient orbs -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
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
                <div class="flex-shrink-0 w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-500/30 transition-colors">
                  <FolderIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Complete flexibility to organize inventory their way
                </p>
              </div>
            </div>
            
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-500/30 transition-colors">
                  <UsersIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Automatic customer tracking from every transaction
                </p>
              </div>
            </div>
            
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-500/30 transition-colors">
                  <ReceiptPercentIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Professional receipts that print perfectly every time
                </p>
              </div>
            </div>
            
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-500/30 transition-colors">
                  <UserGroupIcon class="w-5 h-5 text-white flex-shrink-0" />
                </div>
                <p class="text-sm sm:text-base text-white/90 leading-relaxed pt-1.5">
                  Team management with precise access control
                </p>
              </div>
            </div>
            
            <div class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div class="flex items-start gap-4">
                <div class="flex-shrink-0 w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center border border-primary-400/30 group-hover:bg-primary-500/30 transition-colors">
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
    <NuxtLink
            to="/signin"
            class="group inline-flex items-center gap-2 bg-white text-slate-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started Now
            <ArrowRightIcon class="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
    </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" data-section-id="contact" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-28 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Need some information? Reach out to us
        </h2>
          </div>
          
        <!-- Two Column Layout -->
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <!-- Left: Image -->
          <div class="order-2 lg:order-1 hidden lg:block">
            <div class="rounded-lg overflow-hidden">
              <img
                src="/contact.jpg"
                alt="Contact us"
                class="w-full h-[500px] object-cover"
              />
            </div>
          </div>

          <!-- Right: Contact Form -->
          <div class="order-1 lg:order-2">
            <form @submit.prevent="handleContactSubmit" class="space-y-6">
              <!-- Full Name -->
          <div>
                <label for="fullName" class="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  v-model="contactForm.fullName"
                  type="text"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="Enter your full name"
                />
          </div>
          
              <!-- Email Address -->
          <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  v-model="contactForm.email"
                  type="email"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="Enter your email address"
                />
          </div>
          
              <!-- Select One -->
          <div>
                <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                  Select One
                </label>
                <div class="relative">
                  <select
                    id="subject"
                    v-model="contactForm.subject"
                    required
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none appearance-none bg-white transition-colors"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Support</option>
                    <option value="sales">Sales</option>
                    <option value="partnership">Partnership</option>
                  </select>
                  <ChevronDownIcon class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
              <!-- Message -->
          <div>
                <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                  Example Text
                </label>
                <textarea
                  id="message"
                  v-model="contactForm.message"
                  required
                  rows="5"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors resize-none"
                  placeholder="Enter your message"
                ></textarea>
          </div>

              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="isSubmittingContact"
                class="w-full bg-gray-900 text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>SEND MESSAGE</span>
                <span class="text-lg sm:text-xl font-bold">>></span>
              </button>
            </form>
        </div>
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
          <p class="text-gray-500 max-w-2xl mx-auto mb-6">
            Complete store management solution designed for modern retailers.
          </p>
          
          <!-- Social Media Links -->
          <div class="flex items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/_storvv_?igsh=cmxpOGViczZscGFh&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
              aria-label="Follow us on Instagram"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd" />
              </svg>
            </a>
            <a
              href="https://x.com/_storvv_?s=21"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 text-gray-400 hover:text-white transition-all duration-200 hover:scale-110"
              aria-label="Follow us on Twitter"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
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
  ChevronDownIcon,
  ChevronUpIcon,
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

// Contact form state
const contactForm = ref({
  fullName: '',
  email: '',
  subject: '',
  message: ''
})

const isSubmittingContact = ref(false)

const handleContactSubmit = async () => {
  isSubmittingContact.value = true
  // Here you would typically send the form data to your backend
  // For now, we'll just show a success message
  setTimeout(() => {
    isSubmittingContact.value = false
    // Reset form
    contactForm.value = {
      fullName: '',
      email: '',
      subject: '',
      message: ''
    }
    // You could show a toast notification here
    alert('Thank you for your message! We\'ll get back to you soon.')
  }, 1000)
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
