<template>
  <div class="min-h-screen bg-white antialiased relative">
    <!-- Background Pattern -->
    <div class="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.025] z-0 pattern-overlay"></div>
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 lg:h-20">
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center space-x-3 group hover:opacity-80 transition-opacity">
              <img
                src="/storv logo.png"
                alt="Storv Logo"
                class="h-8 w-auto object-contain"
              />
              <span class="text-4xl font-bold bg-gradient-to-r from-primary-700 via-primary-500 to-primary-600 bg-clip-text text-transparent tracking-tight">
                Storv
              </span>
            </NuxtLink>
          </div>
          <div class="hidden md:flex items-center space-x-8">
            <a href="#features" @click.prevent="scrollToSection('features')" class="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 cursor-pointer">
              Features
            </a>
            <a href="#pricing" @click.prevent="scrollToSection('pricing')" class="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 cursor-pointer">
              Pricing
            </a>
            <a href="#about" @click.prevent="scrollToSection('about')" class="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 cursor-pointer">
              About
            </a>
            <NuxtLink to="/signin" class="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
              Sign In
            </NuxtLink>
            <NuxtLink to="/signup" class="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5">
              Get Started
            </NuxtLink>
          </div>
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
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
            <a href="#features" @click.prevent="scrollToSection('features'); mobileMenuOpen = false" class="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors cursor-pointer">
              Features
            </a>
            <a href="#pricing" @click.prevent="scrollToSection('pricing'); mobileMenuOpen = false" class="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors cursor-pointer">
              Pricing
            </a>
            <a href="#about" @click.prevent="scrollToSection('about'); mobileMenuOpen = false" class="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors cursor-pointer">
              About
            </a>
            <NuxtLink to="/signin" class="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors" @click="mobileMenuOpen = false">
              Sign In
            </NuxtLink>
            <NuxtLink to="/signup" class="block w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl font-semibold mt-2 text-center" @click="mobileMenuOpen = false">
              Get Started
            </NuxtLink>
          </div>
        </Transition>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32 z-10">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-primary-50/30"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div class="text-center lg:text-left space-y-8">
            <div class="space-y-6">
              <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
                Complete Store
                <span class="block bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                  Management System
                </span>
              </h1>
              <p class="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Complete inventory management, sales tracking, customer management, team organization, and business analytics all in one powerful, intuitive platform. Built for modern retailers and businesses of all sizes.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <NuxtLink to="/signup" class="group bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </NuxtLink>
              <button class="bg-white text-primary-600 border-2 border-primary-200 px-8 py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-primary-50 hover:border-primary-300 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm">
                <PlayIcon class="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
          
          <!-- Dashboard Preview -->
          <div class="relative hidden lg:block">
            <div class="relative bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 transform hover:scale-[1.02] transition-transform duration-500">
              <!-- Browser Window -->
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div class="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              
              <!-- Dashboard Content -->
              <div class="space-y-4">
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 h-20"></div>
                  <div class="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-4 h-20"></div>
                  <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 h-20"></div>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 h-40"></div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 h-28"></div>
                  <div class="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 h-28"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-16 sm:py-20 lg:py-24 bg-white relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Powerful Features for Your Business
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your store efficiently from inventory to analytics
          </p>
        </div>
        
        <!-- Main Features Grid -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <CubeIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Advanced Inventory Management</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
              Create custom inventory folders with flexible templates, dynamic fields, and serial number tracking. Organize products your way with complete control.
            </p>
            <ul class="space-y-2 text-sm text-gray-500">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Custom folder templates with dynamic fields</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Serial number tracking per item</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Excel import/export functionality</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Real-time stock availability tracking</span>
              </li>
            </ul>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ReceiptPercentIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Smart Receipt System</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
              Generate professional receipts with A4-optimized printing. Handle sales, swaps, discounts, and payments all in one seamless workflow.
            </p>
            <ul class="space-y-2 text-sm text-gray-500">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>A4-optimized receipt printing</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Swap-in transaction support</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Automatic discount application</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Multiple payment methods tracking</span>
              </li>
            </ul>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <UsersIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Automatic Customer Management</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
              Customers are automatically created and updated from receipts. Track purchase history, spending, and customer relationships effortlessly.
            </p>
            <ul class="space-y-2 text-sm text-gray-500">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Auto-creation from receipts</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Track by email, phone, or address</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Complete purchase history</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Total orders and spending analytics</span>
              </li>
            </ul>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ArrowPathIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Returns & Refunds</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
              Process returns and refunds with ease. Automatic inventory updates and customer history management built right in.
            </p>
            <ul class="space-y-2 text-sm text-gray-500">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Easy refund processing</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Automatic inventory restoration</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Return reason tracking</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Customer history updates</span>
              </li>
            </ul>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BuildingOfficeIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Team & Access Control</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
              Organize teams into departments with granular role-based permissions. Super Admins, Managers, and Staff with appropriate access levels.
            </p>
            <ul class="space-y-2 text-sm text-gray-500">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Department organization</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Role-based permissions</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Folder-level access control</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Staff management tools</span>
              </li>
            </ul>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ChartBarIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Real-Time Analytics & Dashboard</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
              Comprehensive dashboard with revenue charts, sales trends, inventory status, and key performance metrics at a glance.
            </p>
            <ul class="space-y-2 text-sm text-gray-500">
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Revenue tracking and charts</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Sales trend analysis</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Inventory value calculations</span>
              </li>
              <li class="flex items-center gap-2">
                <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>Real-time statistics</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Additional Features Grid -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-12 sm:pt-16 pb-12 sm:pb-16">
          <h3 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 sm:mb-12 text-center">
            <span class="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-600 bg-clip-text text-transparent">Additional Powerful Features</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            <div class="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:z-10 cursor-pointer">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <BoltIcon class="w-6 h-6 text-white" />
                </div>
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Discount Management</h4>
                <div class="text-left w-full space-y-1.5">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Details:</p>
                  <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Individual or bulk discounts</span>
                    </li>
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Track original & discounted prices</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:z-10 cursor-pointer">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <ArrowPathIcon class="w-6 h-6 text-white" />
                </div>
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Swap-In Transactions</h4>
                <div class="text-left w-full space-y-1.5">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Details:</p>
                  <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Device swaps & exchanges</span>
                    </li>
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Auto-update inventory</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:z-10 cursor-pointer">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <BellAlertIcon class="w-6 h-6 text-white" />
                </div>
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Activity Notifications</h4>
                <div class="text-left w-full space-y-1.5">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Details:</p>
                  <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Real-time activity notifications</span>
                    </li>
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Track receipts & inventory</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="group relative bg-gradient-to-br from-violet-600 to-primary-700 rounded-xl p-5 shadow-md border border-violet-500 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:z-10 cursor-pointer">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md border-2 border-white/30">
                  <ShieldCheckIcon class="w-6 h-6 text-white" />
                </div>
                <h4 class="text-base font-bold text-white mb-3">Role-Based Security</h4>
                <div class="text-left w-full space-y-1.5">
                  <p class="text-xs font-medium text-white/80">Details:</p>
                  <ul class="space-y-1 text-xs text-white/90">
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Granular permissions system</span>
                    </li>
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Super Admins, Managers, Staff</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:z-10 cursor-pointer">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <DevicePhoneMobileIcon class="w-6 h-6 text-white" />
                </div>
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Excel Import/Export</h4>
                <div class="text-left w-full space-y-1.5">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Details:</p>
                  <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Bulk import via Excel</span>
                    </li>
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Smart duplicate detection</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:z-10 cursor-pointer">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Multi-Currency Support</h4>
                <div class="text-left w-full space-y-1.5">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Details:</p>
                  <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Multiple currencies support</span>
                    </li>
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Auto formatting by locale</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:z-10 cursor-pointer">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Payment Configuration</h4>
                <div class="text-left w-full space-y-1.5">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Details:</p>
                  <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Configure payment methods</span>
                    </li>
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Customize receipt settings</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:z-10 cursor-pointer">
              <div class="flex flex-col items-center text-center">
                <div class="w-12 h-12 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Data Export & Backup</h4>
                <div class="text-left w-full space-y-1.5">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Details:</p>
                  <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Export CSV or JSON formats</span>
                    </li>
                    <li class="flex items-start">
                      <span class="mr-1.5">•</span>
                      <span>Full backup & restore</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- What Storv Includes Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-gray-50 relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Everything You Need in One Platform
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Storv combines all essential store management tools into a single, powerful solution
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CubeIcon class="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Inventory System</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  Manage unlimited products with custom folders, templates, and fields. Track serial numbers, import/export via Excel, and monitor stock in real-time.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ReceiptPercentIcon class="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Sales & Receipts</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  Generate professional receipts, process sales, handle swap-ins, apply discounts, and track all transactions with A4-optimized printing.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <UsersIcon class="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Customer Management</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  Automatically track customers from receipts. View purchase history, total spending, order counts, and manage customer relationships effortlessly.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <ArrowPathIcon class="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Returns & Refunds</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  Process returns and refunds seamlessly. Automatically restore items to inventory and update customer records with return tracking.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BuildingOfficeIcon class="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Team Organization</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  Organize staff into departments with role-based permissions. Control access at folder and action levels for managers and staff members.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <ChartBarIcon class="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  Real-time insights with revenue charts, sales trends, inventory values, and comprehensive statistics to guide your business decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-white relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Getting Started is Easy
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Follow these simple steps to transform your store operations
          </p>
        </div>

        <div class="max-w-4xl mx-auto">
          <div class="space-y-8">
            <!-- Step 1 -->
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              <div class="flex-shrink-0">
                <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  1
                </div>
              </div>
              <div class="flex-1 bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
                <h3 class="text-xl font-bold text-gray-900 mb-3">Create Your Account & Setup</h3>
                <p class="text-gray-600 mb-4">
                  Sign up for free and complete the quick onboarding process. Set up your store information, choose your preferences (currency, region, language, timezone), and configure your settings.
                </p>
                <ul class="space-y-2 text-sm text-gray-500">
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Enter store name, address, and contact details</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Configure currency, region, and timezone</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Set up payment methods and preferences</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              <div class="flex-shrink-0">
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  2
                </div>
              </div>
              <div class="flex-1 bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
                <h3 class="text-xl font-bold text-gray-900 mb-3">Organize Your Inventory</h3>
                <p class="text-gray-600 mb-4">
                  Create inventory folders and add your products. Use custom templates with dynamic fields, track serial numbers, or bulk import from Excel spreadsheets.
                </p>
                <ul class="space-y-2 text-sm text-gray-500">
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Create folders with custom templates (e.g., Electronics, Clothing)</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Add items manually or import via Excel</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Enable serial number tracking if needed</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              <div class="flex-shrink-0">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  3
                </div>
              </div>
              <div class="flex-1 bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
                <h3 class="text-xl font-bold text-gray-900 mb-3">Manage Your Team (Optional)</h3>
                <p class="text-gray-600 mb-4">
                  Set up departments and add staff members. Assign roles (Manager or Staff) and configure access permissions for inventory folders.
                </p>
                <ul class="space-y-2 text-sm text-gray-500">
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Create departments (e.g., Sales, Warehouse, Admin)</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Invite staff members and assign roles</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Configure folder access for managers</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Step 4 -->
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              <div class="flex-shrink-0">
                <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  4
                </div>
              </div>
              <div class="flex-1 bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
                <h3 class="text-xl font-bold text-gray-900 mb-3">Start Processing Sales</h3>
                <p class="text-gray-600 mb-4">
                  Create receipts for sales transactions. Apply discounts, handle swap-ins, track payments, and generate professional receipts. Customers are automatically created and tracked.
                </p>
                <ul class="space-y-2 text-sm text-gray-500">
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Select items from inventory for sale</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Apply discounts if applicable</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Generate and print professional receipts</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Step 5 -->
            <div class="flex flex-col sm:flex-row gap-6 items-start">
              <div class="flex-shrink-0">
                <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  5
                </div>
              </div>
              <div class="flex-1 bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
                <h3 class="text-xl font-bold text-gray-900 mb-3">Monitor & Analyze</h3>
                <p class="text-gray-600 mb-4">
                  Use the dashboard to track revenue, view sales trends, monitor inventory status, and access customer insights. Process returns, manage notifications, and export data when needed.
                </p>
                <ul class="space-y-2 text-sm text-gray-500">
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>View real-time revenue and sales charts</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Track customer purchase history</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <CheckIcon class="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Process returns and manage inventory</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="mt-12 text-center">
            <NuxtLink to="/signup" class="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-1">
              Start Your Free Trial
              <ArrowRightIcon class="w-5 h-5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-16 sm:py-20 lg:py-24 bg-gray-50 relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your business needs
          </p>
        </div>
        
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto items-start">
          <!-- Free Tier -->
          <div class="relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
            <div class="mb-6 sm:mb-8">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div class="flex items-baseline">
                <span class="text-4xl sm:text-5xl font-extrabold text-gray-900">$0</span>
                <span class="text-gray-600 ml-2 text-base sm:text-lg">/month</span>
              </div>
              <p class="text-gray-600 mt-4 text-sm sm:text-base">Try it out risk-free</p>
            </div>
            
            <NuxtLink to="/signup" class="block w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors mb-6 sm:mb-8 text-sm sm:text-base text-center">
              Get Started
            </NuxtLink>
            
            <ul class="space-y-3 sm:space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">1 store location</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 50 items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">1 user account</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Basic receipts & sales</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Customer tracking</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Email support</span>
              </li>
            </ul>
          </div>

          <!-- Starter Tier - $15/month -->
          <div class="relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-primary-500 shadow-xl sm:shadow-2xl transform lg:scale-105 z-10 h-full flex flex-col sm:-mt-2 sm:mb-2">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
              <span class="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                Most Popular
              </span>
            </div>
            <div class="mb-6 sm:mb-8 pt-2">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div class="flex items-baseline">
                <span class="text-4xl sm:text-5xl font-extrabold text-gray-900">$15</span>
                <span class="text-gray-600 ml-2 text-base sm:text-lg">/month</span>
              </div>
              <p class="text-gray-600 mt-4 text-sm sm:text-base">Perfect for small businesses</p>
            </div>
            
            <NuxtLink to="/signup" class="block w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5 mb-6 sm:mb-8 text-sm sm:text-base text-center">
              Start Free Trial
            </NuxtLink>
            
            <ul class="space-y-3 sm:space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">1 store location</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 2,500 items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 3 users</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Advanced inventory management</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Discounts & swap-ins</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Returns & refunds</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Real-time analytics</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Excel import/export</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Priority email support</span>
              </li>
            </ul>
          </div>

          <!-- Professional Tier - $39/month -->
          <div class="relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
            <div class="mb-6 sm:mb-8">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Professional</h3>
              <div class="flex items-baseline">
                <span class="text-4xl sm:text-5xl font-extrabold text-gray-900">$39</span>
                <span class="text-gray-600 ml-2 text-base sm:text-lg">/month</span>
              </div>
              <p class="text-gray-600 mt-4 text-sm sm:text-base">For growing businesses</p>
            </div>
            
            <NuxtLink to="/signup" class="block w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-6 sm:mb-8 text-sm sm:text-base text-center">
              Start Free Trial
            </NuxtLink>
            
            <ul class="space-y-3 sm:space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 3 store locations</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 10,000 items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 10 users</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Team & department management</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Role-based permissions</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Advanced analytics & reports</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Multi-currency support</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Activity notifications</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Priority support</span>
              </li>
            </ul>
          </div>

          <!-- Enterprise Tier - $99/month -->
          <div class="relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
            <div class="mb-6 sm:mb-8">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div class="flex items-baseline">
                <span class="text-4xl sm:text-5xl font-extrabold text-gray-900">$99</span>
                <span class="text-gray-600 ml-2 text-base sm:text-lg">/month</span>
              </div>
              <p class="text-gray-600 mt-4 text-sm sm:text-base">For large operations</p>
            </div>
            
            <NuxtLink to="/signup" class="block w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-6 sm:mb-8 text-sm sm:text-base text-center">
              Start Free Trial
            </NuxtLink>
            
            <ul class="space-y-3 sm:space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Unlimited store locations</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Unlimited items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Unlimited users</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">API access & webhooks</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Custom reports & analytics</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Advanced integrations</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">24/7 priority support</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Dedicated account manager</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Custom onboarding & training</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-primary-500 via-primary-600 to-pink-600 overflow-hidden z-10">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
          Ready to Transform Your Store Operations?
        </h2>
        <p class="text-lg sm:text-xl text-white/90 mb-8 sm:mb-10">
          Join stores using Storv to manage inventory, sales, customers, and teams all in one place
        </p>
        <NuxtLink to="/signup" class="bg-white text-primary-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2">
          Get Started Free
          <ArrowRightIcon class="w-5 h-5" />
        </NuxtLink>
      </div>
    </section>

    <!-- Back to Top Button -->
    <button
      v-if="showBackToTop"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
      aria-label="Back to top"
    >
      <ChevronUpIcon class="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
    </button>

    <!-- Footer -->
    <footer id="about" class="bg-gray-900 text-gray-400 relative z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8 sm:mb-12">
          <div class="col-span-2">
            <h3 class="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent mb-4">
              Storv
            </h3>
            <p class="text-gray-500 max-w-sm text-sm sm:text-base">
              Complete store management solution with advanced inventory tracking, sales management, customer relationships, returns processing, team organization, discounts, swap-ins, and powerful analytics—all in one intuitive platform.
            </p>
          </div>
          
          <div>
            <h4 class="text-white font-semibold mb-4 text-sm sm:text-base">Product</h4>
            <ul class="space-y-2 sm:space-y-3">
              <li><a href="#" class="hover:text-white transition-colors text-sm sm:text-base">Features</a></li>
              <li><a href="#" class="hover:text-white transition-colors text-sm sm:text-base">Pricing</a></li>
              <li><a href="#" class="hover:text-white transition-colors text-sm sm:text-base">Updates</a></li>
            </ul>
          </div>
          
          <div>
            <h4 class="text-white font-semibold mb-4 text-sm sm:text-base">Company</h4>
            <ul class="space-y-2 sm:space-y-3">
              <li><a href="#" class="hover:text-white transition-colors text-sm sm:text-base">About</a></li>
              <li><a href="#" class="hover:text-white transition-colors text-sm sm:text-base">Blog</a></li>
              <li><a href="#" class="hover:text-white transition-colors text-sm sm:text-base">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 class="text-white font-semibold mb-4 text-sm sm:text-base">Legal</h4>
            <ul class="space-y-2 sm:space-y-3">
              <li><NuxtLink to="/privacy" class="hover:text-white transition-colors text-sm sm:text-base">Privacy</NuxtLink></li>
              <li><NuxtLink to="/terms" class="hover:text-white transition-colors text-sm sm:text-base">Terms</NuxtLink></li>
              <li><a href="#" class="hover:text-white transition-colors text-sm sm:text-base">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div class="border-t border-gray-800 pt-6 sm:pt-8 text-center">
          <p class="text-gray-500 text-sm sm:text-base">
            &copy; 2025 Storv. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightIcon,
  PlayIcon,
  CubeIcon,
  ChartBarIcon,
  BellAlertIcon,
  BoltIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  ReceiptPercentIcon,
  UsersIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  ChevronUpIcon,
} from '@heroicons/vue/24/outline'

const mobileMenuOpen = ref(false)
const showBackToTop = ref(false)

// Handle scroll to show/hide back to top button
const handleScroll = () => {
  if (import.meta.client) {
    showBackToTop.value = window.scrollY > 300
  }
}

const scrollToTop = () => {
  if (import.meta.client) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }
}

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    const navHeight = 80 // Approximate height of the fixed navigation bar (lg:h-20)
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - navHeight

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

// Handle hash navigation on page load
onMounted(() => {
  // Add scroll listener
  if (import.meta.client) {
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial scroll position
  }
  
  // Check if there's a hash in the URL
  if (import.meta.client && window.location.hash) {
    const sectionId = window.location.hash.substring(1) // Remove the #
    // Small delay to ensure page is fully loaded
    setTimeout(() => {
      scrollToSection(sectionId)
    }, 100)
  }
})

// Cleanup scroll listener
onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScroll)
  }
})

// SEO and metadata
useHead({
  title: 'Storv - Complete Store Management System',
  meta: [
    {
      name: 'description',
      content: 'Manage inventory, track sales, handle customers, process returns, and organize your team—all in one powerful platform. Built for modern retailers.'
    }
  ]
})
</script>

<style scoped>
/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Background Pattern */
.pattern-overlay {
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

:global(.dark) .pattern-overlay {
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
}
</style>
