<template>
  <div class="min-h-screen bg-white antialiased">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 lg:h-20">
          <div class="flex items-center">
            <NuxtLink to="/" class="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              Storv
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
            <NuxtLink to="/signup" class="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5">
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
            <NuxtLink to="/signup" class="block w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold mt-2 text-center" @click="mobileMenuOpen = false">
              Get Started
            </NuxtLink>
          </div>
        </Transition>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-white pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-40 lg:pb-32">
      <div class="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-purple-50/30"></div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div class="text-center lg:text-left space-y-8">
            <div class="space-y-6">
              <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight tracking-tight">
                Take Control of Your
                <span class="block bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
                  Inventory
                </span>
              </h1>
              <p class="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Streamline your inventory management with Storv. Track, organize, and optimize your stock 
                with ease. Built for businesses that demand efficiency.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <NuxtLink to="/signup" class="group bg-gradient-to-r from-primary-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
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
                  <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 h-20"></div>
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
    <section id="features" class="py-16 sm:py-20 lg:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Powerful Features
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your inventory effectively
          </p>
        </div>
        
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <CubeIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Real-Time Tracking</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed">
              Monitor your inventory in real-time with instant updates and accurate stock levels.
            </p>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ChartBarIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Analytics Dashboard</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed">
              Get insights into your inventory trends with comprehensive analytics and reports.
            </p>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BellAlertIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Smart Alerts</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed">
              Never run out of stock with intelligent alerts for low inventory levels.
            </p>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BoltIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Fast & Reliable</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed">
              Built for speed and reliability, ensuring your operations never slow down.
            </p>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheckIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed">
              Your data is protected with enterprise-grade security and encryption.
            </p>
          </div>
          
          <div class="group relative bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <DevicePhoneMobileIcon class="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-3">Mobile Ready</h3>
            <p class="text-sm sm:text-base text-gray-600 leading-relaxed">
              Access your inventory from anywhere, anytime with our responsive design.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your business needs
          </p>
        </div>
        
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto items-start">
          <!-- Free Tier -->
          <div class="relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
            <div class="mb-6 sm:mb-8">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Free</h3>
              <div class="flex items-baseline">
                <span class="text-4xl sm:text-5xl font-extrabold text-gray-900">$0</span>
                <span class="text-gray-600 ml-2 text-base sm:text-lg">/month</span>
              </div>
              <p class="text-gray-600 mt-4 text-sm sm:text-base">Perfect for getting started</p>
            </div>
            
            <NuxtLink to="/signup" class="block w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors mb-6 sm:mb-8 text-sm sm:text-base text-center">
              Get Started
            </NuxtLink>
            
            <ul class="space-y-3 sm:space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 100 items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Basic inventory tracking</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">1 user</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Mobile app access</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Email support</span>
              </li>
            </ul>
          </div>

          <!-- Starter Tier - $10/month -->
          <div class="relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-primary-500 shadow-xl sm:shadow-2xl transform lg:scale-105 z-10 h-full flex flex-col sm:-mt-2 sm:mb-2">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
              <span class="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                Most Popular
              </span>
            </div>
            <div class="mb-6 sm:mb-8 pt-2">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <div class="flex items-baseline">
                <span class="text-4xl sm:text-5xl font-extrabold text-gray-900">$10</span>
                <span class="text-gray-600 ml-2 text-base sm:text-lg">/month</span>
              </div>
              <p class="text-gray-600 mt-4 text-sm sm:text-base">Ideal for small businesses</p>
            </div>
            
            <NuxtLink to="/signup" class="block w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5 mb-6 sm:mb-8 text-sm sm:text-base text-center">
              Start Free Trial
            </NuxtLink>
            
            <ul class="space-y-3 sm:space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 1,000 items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Real-time tracking</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Basic analytics</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Up to 5 users</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Smart alerts</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Priority support</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Data export</span>
              </li>
            </ul>
          </div>

          <!-- Pro Tier - $35/month -->
          <div class="relative bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl h-full flex flex-col sm:col-span-2 lg:col-span-1">
            <div class="mb-6 sm:mb-8">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pro</h3>
              <div class="flex items-baseline">
                <span class="text-4xl sm:text-5xl font-extrabold text-gray-900">$35</span>
                <span class="text-gray-600 ml-2 text-base sm:text-lg">/month</span>
              </div>
              <p class="text-gray-600 mt-4 text-sm sm:text-base">For growing enterprises</p>
            </div>
            
            <NuxtLink to="/signup" class="block w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-6 sm:mb-8 text-sm sm:text-base text-center">
              Start Free Trial
            </NuxtLink>
            
            <ul class="space-y-3 sm:space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Unlimited items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Advanced analytics</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Custom reports</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Unlimited users</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">API access</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">24/7 priority support</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Advanced integrations</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm sm:text-base">Dedicated account manager</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-primary-500 via-purple-600 to-pink-600 overflow-hidden">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
          Ready to Transform Your Inventory Management?
        </h2>
        <p class="text-lg sm:text-xl text-white/90 mb-8 sm:mb-10">
          Join thousands of businesses already using Storv
        </p>
        <NuxtLink to="/signup" class="bg-white text-primary-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2">
          Get Started Free
          <ArrowRightIcon class="w-5 h-5" />
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer id="about" class="bg-gray-900 text-gray-400">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8 sm:mb-12">
          <div class="col-span-2">
            <h3 class="text-2xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent mb-4">
              Storv
            </h3>
            <p class="text-gray-500 max-w-sm text-sm sm:text-base">
              Modern inventory management for modern businesses.
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
import { ref, onMounted } from 'vue'
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
} from '@heroicons/vue/24/outline'

const mobileMenuOpen = ref(false)

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
  // Check if there's a hash in the URL
  if (window.location.hash) {
    const sectionId = window.location.hash.substring(1) // Remove the #
    // Small delay to ensure page is fully loaded
    setTimeout(() => {
      scrollToSection(sectionId)
    }, 100)
  }
})

// SEO and metadata
useHead({
  title: 'Storv - Modern Inventory Management',
  meta: [
    {
      name: 'description',
      content: 'Streamline your inventory management with Storv. Track, organize, and optimize your stock with ease.'
    }
  ]
})
</script>

<style scoped>
/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
</style>
