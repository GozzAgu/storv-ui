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

    <!-- Hero Section -->
    <section class="relative pt-24 pb-20 sm:pt-32 sm:pb-28 lg:pt-40 lg:pb-36 min-h-[90vh] flex items-center justify-center overflow-hidden">
      <!-- Background Image with Parallax -->
      <div class="absolute inset-0 z-0">
        <div 
          ref="heroBackground"
          class="absolute inset-0 bg-cover bg-center bg-no-repeat hero-parallax" 
          style="background-image: url('/hero-img.jpg'); transform: scale(1.1);"
        ></div>
        <!-- Dark overlay -->
        <div class="absolute inset-0 bg-black/50"></div>
        <!-- Subtle gradient overlay for depth -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div class="max-w-4xl mx-auto text-center">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-5 py-2.5 glassmorphism text-white rounded-full text-sm font-bold mb-8 shadow-lg border border-white/20 backdrop-blur-lg animate-fade-in-down hover:scale-105 hover:border-white/30 transition-all duration-300">
            <SparklesIcon class="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span>Complete Store Management Platform</span>
          </div>
          
          <!-- Main Heading -->
          <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-8 leading-tight tracking-tight animate-fade-in-down">
            <span class="block mb-3 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-fade-in-down stagger-1">Complete Store Management</span>
            <span class="block text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] animate-fade-in-down stagger-2">Your Way</span>
              </h1>
          
          <!-- Description -->
          <p class="text-lg sm:text-xl lg:text-xl text-white/90 mb-12 leading-relaxed font-medium max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] animate-fade-in-up stagger-3">
            Build custom inventory systems that match your products. Process sales with professional receipts. Track customers automatically. Manage your team with precision.
          </p>
          
          <!-- Feature Pills -->
          <div class="flex flex-wrap gap-3 justify-center items-center mb-14">
            <div class="flex items-center gap-2.5 text-sm font-semibold text-white glassmorphism px-4 py-2.5 rounded-full border border-white/20 shadow-lg hover:shadow-xl hover:border-white/30 transition-all hover:scale-105 backdrop-blur-lg">
              <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-white/30">
                <FolderIcon class="w-4 h-4 text-white flex-shrink-0" />
            </div>
              <span>Flexible inventory</span>
            </div>
            <div class="flex items-center gap-2.5 text-sm font-semibold text-white glassmorphism px-4 py-2.5 rounded-full border border-white/20 shadow-lg hover:shadow-xl hover:border-white/30 transition-all hover:scale-105 backdrop-blur-lg">
              <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-white/30">
                <UsersIcon class="w-4 h-4 text-white flex-shrink-0" />
          </div>
              <span>Auto customer tracking</span>
              </div>
            <div class="flex items-center gap-2.5 text-sm font-semibold text-white glassmorphism px-4 py-2.5 rounded-full border border-white/20 shadow-lg hover:shadow-xl hover:border-white/30 transition-all hover:scale-105 backdrop-blur-lg">
              <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-white/30">
                <UserGroupIcon class="w-4 h-4 text-white flex-shrink-0" />
                </div>
              <span>Team collaboration</span>
                </div>
              </div>
          
          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up stagger-4">
            <button @click="showLaunchModal = true" class="group glassmorphism-button bg-primary-600/90 backdrop-blur-lg text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-700/90 transition-all transform hover:scale-105 active:scale-95 inline-flex items-center justify-center gap-2 min-w-[200px] animate-pulse-glow border border-white/20">
              Start Free Trial
              <ArrowRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>
            <button class="glassmorphism bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 px-8 py-4 rounded-xl font-bold text-lg hover:border-white/50 hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2 hover:scale-105 active:scale-95 min-w-[200px]">
              <DocumentTextIcon class="w-5 h-5 flex-shrink-0" />
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem/Solution Section -->
    <section data-section-id="problem" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      <!-- Animated background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div class="absolute bottom-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>
        
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Animated Icon -->
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl mb-8 shadow-2xl transform hover:scale-110 transition-transform animate-pulse">
            <ArrowPathIcon class="w-10 h-10 text-white animate-spin-slow" />
            </div>
          
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-8 leading-tight">
            <span class="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Stop Struggling with
            </span>
            <br />
            <span class="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 bg-clip-text text-transparent">
              Rigid Systems
            </span>
          </h2>
          
          <p class="text-lg sm:text-xl text-gray-700 mb-10 leading-relaxed font-medium">
            Most inventory systems force you to fit their structure. You end up working around limitations, using multiple tools, and spending hours on manual tasks. Your products are unique your management system should be too.
          </p>
          
          <!-- Highlighted Solution Statement -->
          <div class="inline-flex items-center gap-4 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 px-8 py-4 rounded-2xl mb-10 shadow-2xl transform hover:scale-105 transition-all border-2 border-primary-400/50">
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <SparklesIcon class="w-6 h-6 text-white animate-pulse flex-shrink-0" />
            </div>
            <p class="text-lg sm:text-xl font-bold text-white">
              Storvv adapts to your business, not the other way around.
            </p>
          </div>
          
          <p class="text-lg sm:text-xl text-gray-700 mb-14 leading-relaxed max-w-3xl mx-auto">
            Create inventory folders with custom templates that match your exact product structure. Track serial numbers when needed, handle bulk items when you don't. Process complex transactions like swaps and discounts effortlessly. Let the system automatically build your customer database from every sale.
          </p>
          
          <!-- Enhanced Feature Cards -->
          <div class="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div class="group relative bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-2xl border-2 border-primary-200 transition-all transform hover:scale-105 hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative text-center">
                <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <KeyIcon class="w-8 h-8 text-white flex-shrink-0" />
            </div>
            <div class="text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-3">
            Complete Control
          </div>
                <p class="text-gray-700 font-medium leading-relaxed">Design inventory systems that fit your products perfectly</p>
            </div>
          </div>
          
            <div class="group relative bg-gradient-to-br from-white to-green-50/50 p-8 rounded-2xl border-2 border-green-200 transition-all transform hover:scale-105 hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative text-center">
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <SparklesIcon class="w-8 h-8 text-white animate-pulse flex-shrink-0" />
            </div>
                <div class="text-2xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent mb-3">
                  Zero Manual Work
                </div>
                <p class="text-gray-700 font-medium leading-relaxed">Customers tracked automatically, inventory updates instantly</p>
          </div>
        </div>

            <div class="group relative bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-2xl border-2 border-blue-200 transition-all transform hover:scale-105 hover:-translate-y-2">
              <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative text-center">
                <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <ServerIcon class="w-8 h-8 text-white flex-shrink-0" />
                </div>
                <div class="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-700 bg-clip-text text-transparent mb-3">
                  One System
                </div>
                <p class="text-gray-700 font-medium leading-relaxed">Inventory, sales, customers, and team all connected</p>
              </div>
            </div>
                </div>
                </div>
              </div>
    </section>

    <!-- How It Works Section -->
    <section id="features" data-section-id="features" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-28 bg-gradient-to-b from-white to-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-2xl mb-8 border border-primary-100">
            <ClipboardDocumentCheckIcon class="w-10 h-10 text-primary-600 flex-shrink-0" />
                </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Getting Started is Simple
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Five simple steps to get your store running smoothly
          </p>
                </div>

        <!-- Steps -->
        <div class="max-w-5xl mx-auto space-y-8">
          <!-- Step 1 -->
          <div data-section-id="step-1" class="scroll-animate scroll-animate-up stagger-1 flex flex-col sm:flex-row gap-8 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                1
              </div>
              <div class="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckIcon class="w-4 h-4 text-white flex-shrink-0" />
            </div>
                </div>
            <div class="flex-1 bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <BuildingOfficeIcon class="w-6 h-6 text-white flex-shrink-0" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">Set Up Your Store</h3>
              </div>
              <p class="text-gray-600 leading-relaxed">
                Begin by configuring your store information. Choose your currency, set your timezone, define payment methods, and customize settings to match your business needs. Your inventory system will be ready to use right away.
              </p>
              </div>
            </div>

          <!-- Step 2 -->
          <div data-section-id="step-2" class="scroll-animate scroll-animate-up stagger-2 flex flex-col sm:flex-row gap-8 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                2
                </div>
              <div class="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckIcon class="w-4 h-4 text-white flex-shrink-0" />
                </div>
              </div>
            <div class="flex-1 bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <UserGroupIcon class="w-6 h-6 text-white flex-shrink-0" />
            </div>
                <h3 class="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">Create Departments & Add Staff</h3>
                </div>
              <p class="text-gray-600 leading-relaxed">
                Organize your team by creating departments (like Sales, Warehouse, or Admin). Then add staff members and assign them roles like Super Admin for full access, Manager for department control, or Staff for limited access. Set folder-level permissions so each team member sees only what they need.
              </p>
              </div>
            </div>

          <!-- Step 3 -->
          <div data-section-id="step-3" class="scroll-animate scroll-animate-up stagger-3 flex flex-col sm:flex-row gap-8 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                3
                </div>
              <div class="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckIcon class="w-4 h-4 text-white flex-shrink-0" />
                </div>
              </div>
            <div class="flex-1 bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <FolderIcon class="w-6 h-6 text-white flex-shrink-0" />
            </div>
                <h3 class="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Organize Your Inventory</h3>
                </div>
              <p class="text-gray-600 leading-relaxed">
                Build inventory folders tailored to your products. Design custom templates with flexible field types that capture exactly what you need. Import items in bulk from Excel or add them individually. Turn on serial number tracking when you need to track unique items.
              </p>
                </div>
              </div>

          <!-- Step 4 -->
          <div data-section-id="step-4" class="scroll-animate scroll-animate-up stagger-4 flex flex-col sm:flex-row gap-8 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                4
            </div>
              <div class="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckIcon class="w-4 h-4 text-white flex-shrink-0" />
          </div>
        </div>
            <div class="flex-1 bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <ShoppingCartIcon class="w-6 h-6 text-white flex-shrink-0" />
      </div>
                <h3 class="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Handle Sales Transactions</h3>
              </div>
              <p class="text-gray-600 leading-relaxed">
                Process sales with professional receipts formatted for A4 printing. Apply percentage or fixed discounts, manage item exchanges and swaps, and record various payment types. Every transaction automatically builds your customer database.
              </p>
            </div>
        </div>

          <!-- Step 5 -->
          <div data-section-id="step-5" class="scroll-animate scroll-animate-up stagger-5 flex flex-col sm:flex-row gap-8 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                5
              </div>
              </div>
            <div class="flex-1 bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-orange-300 transition-all duration-300 transform hover:-translate-y-1">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <ChartBarIcon class="w-6 h-6 text-white flex-shrink-0" />
            </div>
                <h3 class="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">Monitor & Analyze</h3>
          </div>
              <p class="text-gray-600 leading-relaxed">
                Access comprehensive dashboards showing revenue trends, sales patterns, and inventory health. View low stock alerts, track customer purchase history, process returns, and export reports when needed. Make data-driven decisions with real-time insights.
                </p>
              </div>
            </div>
          </div>
      </div>
    </section>

    <!-- Save Time Section -->
    <section data-section-id="features-list" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-32 bg-white relative overflow-hidden">
      <!-- Subtle background pattern -->
      <div class="absolute inset-0 opacity-[0.02] pointer-events-none" style="background-image: radial-gradient(circle at 2px 2px, rgb(0 0 0) 1px, transparent 0); background-size: 48px 48px;"></div>
      
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500/10 to-primary-600/10 rounded-3xl mb-8 backdrop-blur-sm border border-primary-200/50">
            <CubeIcon class="w-10 h-10 text-primary-600" />
              </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            <span class="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Everything You Need,
            </span>
            <br />
            <span class="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 bg-clip-text text-transparent">
              Nothing You Don't
            </span>
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Consolidate your tools, simplify your workflow, and reduce costs with one comprehensive solution.
                </p>
              </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <div data-section-id="feature-1" class="scroll-animate scroll-animate-scale stagger-1 group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-primary-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <FolderIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">Custom Inventory Folders</h3>
              <p class="text-gray-600 leading-relaxed">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products exactly.</p>
            </div>
          </div>

          <div data-section-id="feature-2" class="scroll-animate scroll-animate-scale stagger-2 group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-blue-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <TagIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Serial Number Tracking</h3>
              <p class="text-gray-600 leading-relaxed">Track individual items with serial numbers. Perfect for electronics, devices, or any product that requires unique identification.</p>
            </div>
          </div>

          <div data-section-id="feature-3" class="scroll-animate scroll-animate-scale stagger-3 group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-green-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-green-50/0 to-green-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <DocumentTextIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">Excel Import/Export</h3>
              <p class="text-gray-600 leading-relaxed">Bulk import products from Excel spreadsheets or export your inventory data. Smart duplicate detection included.</p>
            </div>
          </div>

          <div class="group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-purple-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-purple-50/0 to-purple-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <ReceiptPercentIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">Professional Receipt System</h3>
              <p class="text-gray-600 leading-relaxed">Generate A4-optimized receipts with automatic customer tracking. Handle discounts, swap-ins, and multiple payment methods seamlessly.</p>
              </div>
            </div>

          <div class="group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-pink-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-pink-50/0 to-pink-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <UsersIcon class="w-7 h-7 text-white flex-shrink-0" />
          </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">Automatic Customer Management</h3>
              <p class="text-gray-600 leading-relaxed">Customers are automatically created from receipts. Track purchase history, total spending, and order counts effortlessly.</p>
        </div>
      </div>

          <div class="group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-orange-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <ArrowPathIcon class="w-7 h-7 text-white flex-shrink-0" />
        </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">Returns & Refunds</h3>
              <p class="text-gray-600 leading-relaxed">Process returns and refunds with ease. Automatic inventory restoration and customer history updates built right in.</p>
                </div>
              </div>
          
          <div class="group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-indigo-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <UserGroupIcon class="w-7 h-7 text-white flex-shrink-0" />
          </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">Team & Department Management</h3>
              <p class="text-gray-600 leading-relaxed">Organize staff into departments with granular role-based permissions. Control folder access for managers and staff members.</p>
              </div>
            </div>

          <div class="group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-cyan-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-50/0 to-cyan-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <ChartBarIcon class="w-7 h-7 text-white flex-shrink-0" />
                </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">Real-Time Analytics Dashboard</h3>
              <p class="text-gray-600 leading-relaxed">Comprehensive dashboard with revenue charts, sales trends, inventory status, and low stock alerts at a glance.</p>
              </div>
            </div>

          <div class="group relative bg-white p-8 rounded-2xl border border-gray-200/80 hover:border-red-300/50 transition-all duration-300 transform hover:-translate-y-1">
            <div class="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div class="relative">
              <div class="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <BellAlertIcon class="w-7 h-7 text-white flex-shrink-0" />
                </div>
              <h3 class="text-lg font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">Low Stock Alerts</h3>
              <p class="text-gray-600 leading-relaxed">Automatically track low stock items. Get alerts when inventory falls below your threshold for both serial numbers and bulk items.</p>
              </div>
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
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DocumentTextIcon class="w-6 h-6 text-green-600 flex-shrink-0" />
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
              <span class="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Save 15%</span>
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
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">1 store location</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 50 inventory items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Custom inventory folders with templates</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Professional receipt generation</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Automatic customer tracking</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
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
                <p v-if="isYearly" class="text-green-600 text-xs font-semibold mt-2">Save $27/year</p>
            </div>
            </div>
            <button @click="showLaunchModal = true" class="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors mb-8 text-center">
              Start Free Trial
            </button>
            <ul class="space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Everything in Starter</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">1 store location</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 2,500 inventory items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 3 users with role-based permissions</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Department and staff management</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Discounts and swap-in transactions</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Returns and refunds processing</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Excel import/export</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Low stock alerts</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
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
                <p v-if="isYearly" class="text-green-600 text-xs font-semibold mt-2">Save $45/year</p>
            </div>
            </div>
            <button @click="showLaunchModal = true" class="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-colors mb-8 text-center">
              Start Free Trial
            </button>
            <ul class="space-y-4 flex-1">
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Everything in Professional</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Unlimited inventory items</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 3 store locations</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Up to 10 users with advanced permissions</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Folder-level access control for departments</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Multi-currency support</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600 text-sm leading-relaxed">Comprehensive analytics and forecasting</span>
              </li>
              <li class="flex items-start gap-3">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
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
    <section data-section-id="faq" class="scroll-animate scroll-animate-up py-20 sm:py-24 lg:py-28 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed" style="background-image: url('/questions.jpg');">
      <!-- Overlay for readability -->
      <div class="absolute inset-0 z-0 bg-white/10"></div>
      
      <!-- Content -->
      <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-primary-50 rounded-2xl mb-8 border border-primary-100">
            <DocumentTextIcon class="w-10 h-10 text-primary-600 flex-shrink-0" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Common Questions
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 leading-relaxed">
            Answers to help you understand Storvv better
          </p>
        </div>

        <!-- FAQ Items -->
        <div class="space-y-4">
          <div data-section-id="faq-1" class="scroll-animate scroll-animate-scale stagger-1 bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-primary-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ClockIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">How quickly can I get started?</h3>
                <p class="text-gray-600 leading-relaxed">Most stores are up and running within minutes. Create your store profile, set up your first inventory folder, and you're ready to start managing sales. No coding or technical expertise needed.</p>
              </div>
            </div>
          </div>
          <div data-section-id="faq-2" class="scroll-animate scroll-animate-scale stagger-2 bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-green-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <SparklesIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">Is Storvv difficult to learn?</h3>
                <p class="text-gray-600 leading-relaxed">Not at all. Storvv is built with simplicity in mind. The interface is intuitive and straightforward if you can use a smartphone, you can use Storvv. We've designed it specifically for store owners and managers.</p>
              </div>
            </div>
          </div>
          <div data-section-id="faq-3" class="scroll-animate scroll-animate-scale stagger-3 bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-blue-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ChartBarIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Can I track in-store and online sales together?</h3>
                <p class="text-gray-600 leading-relaxed">Absolutely. Storvv provides a unified view of all your sales channels. Whether transactions happen at your physical location or through other channels, everything is consolidated in one dashboard for complete visibility.</p>
              </div>
            </div>
          </div>
          <div class="bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-purple-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <FolderIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">How do custom inventory folders work?</h3>
                <p class="text-gray-600 leading-relaxed">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products. Each folder can have its own template, and you can enable serial number tracking for individual items.</p>
              </div>
            </div>
          </div>
          <div class="bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-orange-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <DocumentTextIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">Can I import products from Excel?</h3>
                <p class="text-gray-600 leading-relaxed">Yes! Storvv supports bulk import from Excel spreadsheets. Simply upload your Excel file, and items will be automatically added to your inventory folders. You can also export your inventory data to Excel for backup or analysis.</p>
              </div>
            </div>
          </div>
          <div class="bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-pink-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <UsersIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">How does customer tracking work?</h3>
                <p class="text-gray-600 leading-relaxed">Customers are automatically created when you generate receipts. They're tracked by email, phone, or address. View complete purchase history, total spending, and order counts for each customer all without manual data entry.</p>
              </div>
            </div>
          </div>
          <div class="bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-indigo-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ArrowPathIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">What are swap-in transactions?</h3>
                <p class="text-gray-600 leading-relaxed">Swap-in transactions allow customers to exchange items. When a customer swaps in an item, it's automatically added back to your inventory, and the transaction is tracked. Perfect for device exchanges, trade-ins, or returns.</p>
              </div>
            </div>
          </div>
          <div class="bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-cyan-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <KeyIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">How do role-based permissions work?</h3>
                <p class="text-gray-600 leading-relaxed">Storvv supports three roles: Super Admin (full access), Manager (can manage assigned folders and staff), and Staff (limited access based on department). You can control folder access at the department level, ensuring staff only see relevant inventory.</p>
              </div>
            </div>
          </div>
          <div class="bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-red-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <BellAlertIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">What are low stock alerts?</h3>
                <p class="text-gray-600 leading-relaxed">Storvv automatically tracks low stock items based on your configured threshold. For serial number folders, it alerts when available items fall below the threshold. For bulk items, it counts individual items with low quantities. Get notified on your dashboard.</p>
              </div>
            </div>
          </div>
          <div class="bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-emerald-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <BuildingOfficeIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">Can I manage multiple stores?</h3>
                <p class="text-gray-600 leading-relaxed">Yes! Premium plans support multiple store locations. Each store has its own inventory folders, receipts, and staff. Manage everything from one centralized dashboard while keeping store data separate.</p>
              </div>
            </div>
          </div>
          <div class="bg-white/50 backdrop-blur-lg p-8 rounded-2xl border-2 border-white/50 hover:border-yellow-300/70 transition-all duration-300 transform hover:-translate-y-1 group">
            <div class="flex items-start gap-5">
              <div class="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ShieldCheckIcon class="w-7 h-7 text-white flex-shrink-0" />
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-yellow-600 transition-colors">Is my data secure?</h3>
                <p class="text-gray-600 leading-relaxed">Yes, absolutely. Storvv uses enterprise-grade security to protect all your data. Your information is encrypted, and we never share your data without your explicit permission.</p>
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
    // Parallax effect for hero background
    if (heroBackground.value) {
      const scrolled = window.scrollY
      const heroHeight = heroBackground.value.parentElement?.parentElement?.offsetHeight || 0
      
      // Only apply parallax when scrolling within hero section
      if (scrolled < heroHeight) {
        const parallaxSpeed = 0.3 // Slower parallax for smoother effect
        const translateY = scrolled * parallaxSpeed
        heroBackground.value.style.transform = `translate3d(0, ${translateY}px, 0) scale(1.1)`
      } else {
        // Lock position when past hero section
        const maxTranslate = heroHeight * 0.3
        heroBackground.value.style.transform = `translate3d(0, ${maxTranslate}px, 0) scale(1.1)`
      }
    }
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
