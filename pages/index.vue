<template>
  <div class="min-h-screen bg-white">
    <!-- Navigation -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 lg:h-20">
          <div class="flex items-center">
            <h1 class="text-2xl lg:text-3xl font-bold font-display bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
              Storv
            </h1>
          </div>
          <div class="hidden md:flex items-center space-x-8">
            <a href="#features" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Features
            </a>
            <a href="#pricing" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Pricing
            </a>
            <a href="#about" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              About
            </a>
            <button class="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5">
              Get Started
            </button>
          </div>
          <button class="md:hidden p-2 text-gray-600 hover:text-gray-900">
            <Bars3Icon class="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div class="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div class="space-y-8 animate-fade-in">
            <div class="space-y-6">
              <h1 class="text-5xl lg:text-7xl font-extrabold font-display text-gray-900 leading-tight tracking-tight">
                Take Control of Your
                <span class="bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
                  Inventory
                </span>
              </h1>
              <p class="text-xl text-gray-600 leading-relaxed max-w-xl">
                Streamline your inventory management with Storv. Track, organize, and optimize your stock 
                with ease. Built for businesses that demand efficiency.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-4">
              <button class="group bg-gradient-to-r from-primary-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button class="bg-white text-primary-600 border-2 border-primary-200 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 hover:border-primary-300 transition-all duration-300 flex items-center justify-center gap-2">
                <PlayIcon class="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
          
          <!-- Dashboard Preview -->
          <div class="relative animate-slide-up">
            <div class="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-200/50">
              <!-- Browser Window -->
              <div class="flex items-center gap-2 mb-4">
                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div class="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              
              <!-- Dashboard Content -->
              <div class="space-y-4">
                <div class="grid grid-cols-3 gap-4">
                  <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 h-24 animate-pulse"></div>
                  <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 h-24 animate-pulse delay-75"></div>
                  <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 h-24 animate-pulse delay-150"></div>
                </div>
                <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 h-48"></div>
                <div class="grid grid-cols-2 gap-4">
                  <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 h-32"></div>
                  <div class="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 h-32"></div>
                </div>
              </div>
            </div>
            
            <!-- Floating Elements -->
            <div class="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl shadow-xl opacity-20 blur-xl"></div>
            <div class="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-xl opacity-20 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl lg:text-5xl font-extrabold font-display text-gray-900 mb-4 tracking-tight">
            Powerful Features
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your inventory effectively
          </p>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <CubeIcon class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Real-Time Tracking</h3>
            <p class="text-gray-600 leading-relaxed">
              Monitor your inventory in real-time with instant updates and accurate stock levels.
            </p>
          </div>
          
          <div class="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ChartBarIcon class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Analytics Dashboard</h3>
            <p class="text-gray-600 leading-relaxed">
              Get insights into your inventory trends with comprehensive analytics and reports.
            </p>
          </div>
          
          <div class="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div class="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BellAlertIcon class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Smart Alerts</h3>
            <p class="text-gray-600 leading-relaxed">
              Never run out of stock with intelligent alerts for low inventory levels.
            </p>
          </div>
          
          <div class="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BoltIcon class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Fast & Reliable</h3>
            <p class="text-gray-600 leading-relaxed">
              Built for speed and reliability, ensuring your operations never slow down.
            </p>
          </div>
          
          <div class="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheckIcon class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
            <p class="text-gray-600 leading-relaxed">
              Your data is protected with enterprise-grade security and encryption.
            </p>
          </div>
          
          <div class="group relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div class="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <DevicePhoneMobileIcon class="w-7 h-7 text-white" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Mobile Ready</h3>
            <p class="text-gray-600 leading-relaxed">
              Access your inventory from anywhere, anytime with our responsive design.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-24 bg-gray-50 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-4xl lg:text-5xl font-extrabold font-display text-gray-900 mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your business needs
          </p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto relative pt-6 items-start">
          <!-- Free Tier -->
          <div class="relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-2xl shadow-lg h-full">
            <div class="mb-8">
              <h3 class="text-2xl font-bold font-display text-gray-900 mb-2">Free</h3>
              <div class="flex items-baseline">
                <span class="text-5xl font-extrabold text-gray-900">$0</span>
                <span class="text-gray-600 ml-2">/month</span>
              </div>
              <p class="text-gray-600 mt-4">Perfect for getting started</p>
            </div>
            
            <button class="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors mb-8">
              Get Started
            </button>
            
            <ul class="space-y-4">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Up to 100 items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Basic inventory tracking</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">1 user</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Mobile app access</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Email support</span>
              </li>
            </ul>
          </div>

          <!-- Starter Tier - $10/month -->
          <div class="relative bg-white rounded-2xl p-8 border-2 border-primary-500 shadow-2xl transform lg:scale-105 z-10 h-full">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span class="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap">
                Most Popular
              </span>
            </div>
            <div class="mb-8 pt-1">
              <h3 class="text-2xl font-bold font-display text-gray-900 mb-2">Starter</h3>
              <div class="flex items-baseline">
                <span class="text-5xl font-extrabold text-gray-900">$10</span>
                <span class="text-gray-600 ml-2">/month</span>
              </div>
              <p class="text-gray-600 mt-4">Ideal for small businesses</p>
            </div>
            
            <button class="w-full bg-gradient-to-r from-primary-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 hover:-translate-y-0.5 mb-8">
              Start Free Trial
            </button>
            
            <ul class="space-y-4">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Up to 1,000 items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Real-time tracking</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Basic analytics</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Up to 5 users</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Smart alerts</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Priority support</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Data export</span>
              </li>
            </ul>
          </div>

          <!-- Pro Tier - $35/month -->
          <div class="relative bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-2xl shadow-lg h-full">
            <div class="mb-8">
              <h3 class="text-2xl font-bold font-display text-gray-900 mb-2">Pro</h3>
              <div class="flex items-baseline">
                <span class="text-5xl font-extrabold text-gray-900">$35</span>
                <span class="text-gray-600 ml-2">/month</span>
              </div>
              <p class="text-gray-600 mt-4">For growing enterprises</p>
            </div>
            
            <button class="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-8">
              Start Free Trial
            </button>
            
            <ul class="space-y-4">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Unlimited items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Advanced analytics</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Custom reports</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Unlimited users</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">API access</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">24/7 priority support</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Advanced integrations</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Dedicated account manager</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-24 bg-gradient-to-r from-primary-500 via-purple-600 to-pink-600 overflow-hidden">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-4xl lg:text-5xl font-extrabold font-display text-white mb-6 tracking-tight">
          Ready to Transform Your Inventory Management?
        </h2>
        <p class="text-xl text-white/90 mb-10">
          Join thousands of businesses already using Storv
        </p>
        <button class="bg-white text-primary-600 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 inline-flex items-center gap-2">
          Get Started Free
          <ArrowRightIcon class="w-5 h-5" />
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div class="lg:col-span-2">
            <h3 class="text-2xl font-bold font-display bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent mb-4">
              Storv
            </h3>
            <p class="text-gray-500 max-w-sm">
              Modern inventory management for modern businesses.
            </p>
          </div>
          
          <div>
            <h4 class="text-white font-semibold mb-4">Product</h4>
            <ul class="space-y-3">
              <li><a href="#" class="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Updates</a></li>
            </ul>
          </div>
          
          <div>
            <h4 class="text-white font-semibold mb-4">Company</h4>
            <ul class="space-y-3">
              <li><a href="#" class="hover:text-white transition-colors">About</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4 class="text-white font-semibold mb-4">Legal</h4>
            <ul class="space-y-3">
              <li><a href="#" class="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" class="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div class="border-t border-gray-800 pt-8 text-center">
          <p class="text-gray-500">
            &copy; 2025 Storv. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {
  Bars3Icon,
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
