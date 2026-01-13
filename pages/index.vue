<template>
  <div class="min-h-screen bg-white antialiased">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16 lg:h-20">
            <NuxtLink to="/" class="flex items-center space-x-2 group hover:opacity-80 transition-opacity">
              <img
                src="/storv logo.png"
              alt="Storvv Logo"
              class="h-8 w-auto object-contain"
              />
            <span class="text-2xl font-bold text-gray-900 tracking-tight">
              Storvv
              </span>
            </NuxtLink>
          <div class="hidden md:flex items-center space-x-8">
            <a href="#features" @click.prevent="scrollToSection('features')" class="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Features
            </a>
            <a href="#about" @click.prevent="scrollToSection('about')" class="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors">
              About
            </a>
            <a href="#contact" @click.prevent="scrollToSection('contact')" class="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Contact
            </a>
            <NuxtLink to="/signup" class="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-700 transition-colors">
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
            <NuxtLink to="/signup" class="block w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold mt-2 text-center" @click="mobileMenuOpen = false">
              Start Free Trial
            </NuxtLink>
          </div>
        </Transition>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pt-48 lg:pb-32 bg-cover bg-center bg-no-repeat" style="background-image: url('/hero-img.jpg');">
      <!-- Overlay for better text readability - reduced opacity to show image more -->
      <div class="absolute inset-0 bg-white/50 backdrop-blur-[2px]"></div>
      <!-- Decorative background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full text-sm font-bold mb-8 shadow-xl border-2 border-white/30 backdrop-blur-md">
            <SparklesIcon class="w-4 h-4" />
            <span>Complete Store Management Platform</span>
          </div>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-900 mb-8 leading-tight tracking-tight">
            <span class="block mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">Complete Store Management</span>
            <span class="block bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(59,130,246,0.4)]">Your Way</span>
          </h1>
          <p class="text-xl sm:text-2xl lg:text-3xl text-gray-900 mb-10 leading-relaxed font-medium max-w-3xl mx-auto drop-shadow-[0_2px_3px_rgba(255,255,255,0.9)]">
            Build custom inventory systems that match your products. Process sales with professional receipts. Track customers automatically. Manage your team with precision. All from one powerful platform designed for how you actually work.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-14">
            <div class="flex items-center gap-3 text-base font-semibold text-gray-900 bg-white/98 backdrop-blur-lg px-5 py-3 rounded-xl border-2 border-white/80 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FolderIcon class="w-5 h-5 text-primary-600" />
              </div>
              <span>Flexible inventory organization</span>
            </div>
            <div class="flex items-center gap-3 text-base font-semibold text-gray-900 bg-white/98 backdrop-blur-lg px-5 py-3 rounded-xl border-2 border-white/80 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <UsersIcon class="w-5 h-5 text-primary-600" />
              </div>
              <span>Automated customer tracking</span>
            </div>
            <div class="flex items-center gap-3 text-base font-semibold text-gray-900 bg-white/98 backdrop-blur-lg px-5 py-3 rounded-xl border-2 border-white/80 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon class="w-5 h-5 text-primary-600" />
              </div>
              <span>Team collaboration tools</span>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink to="/signup" class="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-10 py-5 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-2xl hover:shadow-primary-500/50 transform hover:scale-105 inline-flex items-center justify-center gap-2 border-2 border-primary-400/30">
              Start Free Trial
              <ArrowRightIcon class="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </NuxtLink>
            <button class="bg-white/98 backdrop-blur-lg text-gray-900 border-3 border-gray-300 px-10 py-5 rounded-xl font-bold text-lg hover:border-primary-500 hover:text-primary-600 transition-all inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105">
              <DocumentTextIcon class="w-6 h-6" />
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem/Solution Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-gray-50 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-4xl mx-auto">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <ArrowPathIcon class="w-8 h-8 text-red-600" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Stop Struggling with Rigid Systems
          </h2>
          <p class="text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed">
            Most inventory systems force you to fit their structure. You end up working around limitations, using multiple tools, and spending hours on manual tasks. Your products are unique your management system should be too.
          </p>
          <div class="inline-flex items-center gap-3 bg-primary-50 px-6 py-3 rounded-full mb-8">
            <SparklesIcon class="w-6 h-6 text-primary-600" />
            <p class="text-xl sm:text-2xl font-semibold text-primary-600">
              Storvv adapts to your business, not the other way around.
          </p>
        </div>
          <p class="text-lg sm:text-xl text-gray-700 mb-12 leading-relaxed">
            Create inventory folders with custom templates that match your exact product structure. Track serial numbers when needed, handle bulk items when you don't. Process complex transactions like swaps and discounts effortlessly. Let the system automatically build your customer database from every sale.
          </p>
          <div class="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <KeyIcon class="w-6 h-6 text-primary-600" />
          </div>
              <div class="text-2xl font-bold text-primary-600 mb-2">Complete Control</div>
              <p class="text-gray-600">Design inventory systems that fit your products perfectly</p>
            </div>
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <SparklesIcon class="w-6 h-6 text-green-600" />
          </div>
              <div class="text-2xl font-bold text-primary-600 mb-2">Zero Manual Work</div>
              <p class="text-gray-600">Customers tracked automatically, inventory updates instantly</p>
            </div>
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <ServerIcon class="w-6 h-6 text-blue-600" />
          </div>
              <div class="text-2xl font-bold text-primary-600 mb-2">One System</div>
              <p class="text-gray-600">Inventory, sales, customers, and team all connected</p>
            </div>
          </div>
            </div>
          </div>
    </section>

    <!-- How It Works Section -->
    <section id="features" class="py-16 sm:py-20 lg:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Getting Started is Simple
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Five simple steps to get your store running smoothly
          </p>
        </div>

        <div class="max-w-5xl mx-auto space-y-12">
          <!-- Step 1 -->
          <div class="flex flex-col sm:flex-row gap-6 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                1
                </div>
              <div class="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckIcon class="w-3 h-3 text-white" />
                </div>
              </div>
            <div class="flex-1 bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
              <div class="flex items-center gap-3 mb-3">
                <BuildingOfficeIcon class="w-6 h-6 text-primary-600" />
                <h3 class="text-2xl font-bold text-gray-900">Set Up Your Store</h3>
            </div>
              <p class="text-lg text-gray-600 leading-relaxed">
                Begin by configuring your store information. Choose your currency, set your timezone, define payment methods, and customize settings to match your business needs. Your inventory system will be ready to use right away.
              </p>
                </div>
                </div>

          <!-- Step 2 -->
          <div class="flex flex-col sm:flex-row gap-6 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                2
              </div>
              <div class="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckIcon class="w-3 h-3 text-white" />
            </div>
                </div>
            <div class="flex-1 bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
              <div class="flex items-center gap-3 mb-3">
                <UserGroupIcon class="w-6 h-6 text-green-600" />
                <h3 class="text-2xl font-bold text-gray-900">Create Departments & Add Staff</h3>
                </div>
              <p class="text-lg text-gray-600 leading-relaxed">
                Organize your team by creating departments (like Sales, Warehouse, or Admin). Then add staff members and assign them roles—Super Admin for full access, Manager for department control, or Staff for limited access. Set folder-level permissions so each team member sees only what they need.
              </p>
              </div>
            </div>

          <!-- Step 3 -->
          <div class="flex flex-col sm:flex-row gap-6 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                3
                </div>
              <div class="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckIcon class="w-3 h-3 text-white" />
                </div>
              </div>
            <div class="flex-1 bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
              <div class="flex items-center gap-3 mb-3">
                <FolderIcon class="w-6 h-6 text-blue-600" />
                <h3 class="text-2xl font-bold text-gray-900">Organize Your Inventory</h3>
            </div>
              <p class="text-lg text-gray-600 leading-relaxed">
                Build inventory folders tailored to your products. Design custom templates with flexible field types that capture exactly what you need. Import items in bulk from Excel or add them individually. Turn on serial number tracking when you need to track unique items.
              </p>
              </div>
            </div>

          <!-- Step 4 -->
          <div class="flex flex-col sm:flex-row gap-6 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                4
                </div>
              <div class="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <CheckIcon class="w-3 h-3 text-white" />
                </div>
              </div>
            <div class="flex-1 bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
              <div class="flex items-center gap-3 mb-3">
                <ShoppingCartIcon class="w-6 h-6 text-purple-600" />
                <h3 class="text-2xl font-bold text-gray-900">Handle Sales Transactions</h3>
            </div>
              <p class="text-lg text-gray-600 leading-relaxed">
                Process sales with professional receipts formatted for A4 printing. Apply percentage or fixed discounts, manage item exchanges and swaps, and record various payment types. Every transaction automatically builds your customer database.
              </p>
              </div>
            </div>

          <!-- Step 5 -->
          <div class="flex flex-col sm:flex-row gap-6 items-start group">
            <div class="flex-shrink-0 relative">
              <div class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                5
                </div>
                </div>
            <div class="flex-1 bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
              <div class="flex items-center gap-3 mb-3">
                <ChartBarIcon class="w-6 h-6 text-orange-600" />
                <h3 class="text-2xl font-bold text-gray-900">Monitor & Analyze</h3>
              </div>
              <p class="text-lg text-gray-600 leading-relaxed">
                Access comprehensive dashboards showing revenue trends, sales patterns, and inventory health. View low stock alerts, track customer purchase history, process returns, and export reports when needed. Make data-driven decisions with real-time insights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Save Time Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <CubeIcon class="w-8 h-8 text-primary-600" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need, Nothing You Don't
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Consolidate your tools, simplify your workflow, and reduce costs with one comprehensive solution.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
              <FolderIcon class="w-6 h-6 text-primary-600" />
              </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Custom Inventory Folders</h3>
            <p class="text-gray-600">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products exactly.</p>
              </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <TagIcon class="w-6 h-6 text-blue-600" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Serial Number Tracking</h3>
            <p class="text-gray-600">Track individual items with serial numbers. Perfect for electronics, devices, or any product that requires unique identification.</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <DocumentTextIcon class="w-6 h-6 text-green-600" />
              </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Excel Import/Export</h3>
            <p class="text-gray-600">Bulk import products from Excel spreadsheets or export your inventory data. Smart duplicate detection included.</p>
              </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <ReceiptPercentIcon class="w-6 h-6 text-purple-600" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Professional Receipt System</h3>
            <p class="text-gray-600">Generate A4-optimized receipts with automatic customer tracking. Handle discounts, swap-ins, and multiple payment methods seamlessly.</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors">
              <UsersIcon class="w-6 h-6 text-pink-600" />
              </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Automatic Customer Management</h3>
            <p class="text-gray-600">Customers are automatically created from receipts. Track purchase history, total spending, and order counts effortlessly.</p>
              </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                <ArrowPathIcon class="w-6 h-6 text-orange-600" />
              </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Returns & Refunds</h3>
            <p class="text-gray-600">Process returns and refunds with ease. Automatic inventory restoration and customer history updates built right in.</p>
              </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
              <UserGroupIcon class="w-6 h-6 text-indigo-600" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Team & Department Management</h3>
            <p class="text-gray-600">Organize staff into departments with granular role-based permissions. Control folder access for managers and staff members.</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition-colors">
              <ChartBarIcon class="w-6 h-6 text-cyan-600" />
              </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Real-Time Analytics Dashboard</h3>
            <p class="text-gray-600">Comprehensive dashboard with revenue charts, sales trends, inventory status, and low stock alerts at a glance.</p>
              </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all group hover:border-primary-300">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
              <BellAlertIcon class="w-6 h-6 text-red-600" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Low Stock Alerts</h3>
            <p class="text-gray-600">Automatically track low stock items. Get alerts when inventory falls below your threshold for both serial numbers and bulk items.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Advanced Features Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <GlobeAltIcon class="w-8 h-8 text-primary-600" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Built to Scale with Your Business
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced capabilities that grow with you, from single locations to multi-store operations.
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BuildingOfficeIcon class="w-6 h-6 text-primary-600" />
                </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Multi-Store Support</h3>
            <p class="text-gray-600">Manage multiple store locations from one account. Centralized control with store-specific inventory and sales tracking.</p>
              </div>
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BellAlertIcon class="w-6 h-6 text-red-600" />
              </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Low Stock Alerts</h3>
            <p class="text-gray-600">Automatically track low stock items. Get alerts when inventory falls below your threshold for both serial numbers and bulk items.</p>
            </div>
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <DocumentTextIcon class="w-6 h-6 text-green-600" />
                </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Excel Import/Export</h3>
            <p class="text-gray-600">Bulk import products from Excel spreadsheets or export your inventory data. Smart duplicate detection included.</p>
              </div>
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ChartBarIcon class="w-6 h-6 text-blue-600" />
              </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Real-Time Analytics</h3>
            <p class="text-gray-600">Track revenue, sales trends, inventory values, and customer insights. Make data-driven decisions with comprehensive dashboards.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <BanknotesIcon class="w-8 h-8 text-primary-600" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Select the Perfect Plan for Your Business
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            From small shops to large operations, we have a plan that fits your needs
          </p>
        </div>
        
        <div class="grid sm:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <!-- Basic Plan -->
          <div class="bg-white rounded-lg border-2 border-gray-200 p-8">
            <div class="mb-6">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <p class="text-gray-600 mb-4">Ideal for Small Shops Getting Started</p>
              <div class="text-4xl font-bold text-gray-900 mb-1">FREE</div>
              <p class="text-gray-600 text-sm">to get started</p>
              </div>
            <NuxtLink to="/signup" class="block w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors mb-6 text-center">
              Get Started
            </NuxtLink>
            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">1 store location</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Up to 50 inventory items</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Custom inventory folders with templates</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Professional receipt generation</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Automatic customer tracking</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Basic analytics dashboard</span>
              </li>
            </ul>
          </div>

          <!-- Pro Plan -->
          <div class="bg-white rounded-lg border-2 border-primary-600 p-8 relative transform scale-105 shadow-lg">
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span class="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                POPULAR
              </span>
            </div>
            <div class="mb-6">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Professional</h3>
              <p class="text-gray-600 mb-4">Perfect for Growing Retail Operations</p>
              <div class="text-4xl font-bold text-gray-900 mb-1">$29</div>
              <p class="text-gray-600 text-sm">per month</p>
              </div>
            <NuxtLink to="/signup" class="block w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-6 text-center">
              Start Free Trial
            </NuxtLink>
            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Everything in Starter</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">1 store location</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Up to 2,500 inventory items</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Up to 3 users with role-based permissions</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Department and staff management</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Discounts and swap-in transactions</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Returns and refunds processing</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Excel import/export</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Low stock alerts</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Advanced analytics and reports</span>
              </li>
            </ul>
          </div>

          <!-- Premium Plan -->
          <div class="bg-white rounded-lg border-2 border-gray-200 p-8">
            <div class="mb-6">
              <h3 class="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p class="text-gray-600 mb-4">For Multi-Location Retail Chains</p>
              <div class="text-4xl font-bold text-gray-900 mb-1">$99</div>
              <p class="text-gray-600 text-sm">per month</p>
              </div>
            <NuxtLink to="/signup" class="block w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors mb-6 text-center">
              Start Free Trial
            </NuxtLink>
            <ul class="space-y-3">
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Everything in Professional</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Unlimited inventory items</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Up to 3 store locations</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Up to 10 users with advanced permissions</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Folder-level access control for departments</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Multi-currency support</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Comprehensive analytics and forecasting</span>
              </li>
              <li class="flex items-start gap-2">
                <CheckIcon class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-600">Priority customer support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust & Security Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <ShieldCheckIcon class="w-8 h-8 text-primary-600" />
              </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Security You Can Trust
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Your business data is safeguarded with industry-leading security measures and compliance protocols
          </p>
            </div>
            
        <div class="grid sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          <div class="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-center group">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheckIcon class="w-8 h-8 text-primary-600" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">High Grade Security</h3>
            <p class="text-gray-600">End-to-end encryption protects all your data</p>
          </div>
          <div class="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-center group">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <LockClosedIcon class="w-8 h-8 text-blue-600" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Data Privacy</h3>
            <p class="text-gray-600">Your data belongs to you. We never share.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
            <DocumentTextIcon class="w-8 h-8 text-primary-600" />
          </div>
          <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Common Questions
          </h2>
          <p class="text-lg sm:text-xl text-gray-600">
            Answers to help you understand Storvv better
          </p>
        </div>

        <div class="space-y-6">
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <ClockIcon class="w-5 h-5 text-primary-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">How quickly can I get started?</h3>
                <p class="text-gray-600">Most stores are up and running within minutes. Create your store profile, set up your first inventory folder, and you're ready to start managing sales. No coding or technical expertise needed.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <SparklesIcon class="w-5 h-5 text-green-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Is Storvv difficult to learn?</h3>
                <p class="text-gray-600">Not at all. Storvv is built with simplicity in mind. The interface is intuitive and straightforward—if you can use a smartphone, you can use Storvv. We've designed it specifically for store owners and managers.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ChartBarIcon class="w-5 h-5 text-blue-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Can I track in-store and online sales together?</h3>
                <p class="text-gray-600">Absolutely. Storvv provides a unified view of all your sales channels. Whether transactions happen at your physical location or through other channels, everything is consolidated in one dashboard for complete visibility.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <FolderIcon class="w-5 h-5 text-purple-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">How do custom inventory folders work?</h3>
                <p class="text-gray-600">Create unlimited inventory folders with custom templates. Define dynamic fields (text, numbers, dates, currency, select, boolean) that match your products. Each folder can have its own template, and you can enable serial number tracking for individual items.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <DocumentTextIcon class="w-5 h-5 text-orange-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Can I import products from Excel?</h3>
                <p class="text-gray-600">Yes! Storvv supports bulk import from Excel spreadsheets. Simply upload your Excel file, and items will be automatically added to your inventory folders. You can also export your inventory data to Excel for backup or analysis.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                <UsersIcon class="w-5 h-5 text-pink-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">How does customer tracking work?</h3>
                <p class="text-gray-600">Customers are automatically created when you generate receipts. They're tracked by email, phone, or address. View complete purchase history, total spending, and order counts for each customer—all without manual data entry.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <ArrowPathIcon class="w-5 h-5 text-indigo-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">What are swap-in transactions?</h3>
            <p class="text-gray-600">Swap-in transactions allow customers to exchange items. When a customer swaps in an item, it's automatically added back to your inventory, and the transaction is tracked. Perfect for device exchanges, trade-ins, or returns.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                <KeyIcon class="w-5 h-5 text-cyan-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">How do role-based permissions work?</h3>
                <p class="text-gray-600">Storvv supports three roles: Super Admin (full access), Manager (can manage assigned folders and staff), and Staff (limited access based on department). You can control folder access at the department level, ensuring staff only see relevant inventory.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <BellAlertIcon class="w-5 h-5 text-red-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">What are low stock alerts?</h3>
                <p class="text-gray-600">Storvv automatically tracks low stock items based on your configured threshold. For serial number folders, it alerts when available items fall below the threshold. For bulk items, it counts individual items with low quantities. Get notified on your dashboard.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <BuildingOfficeIcon class="w-5 h-5 text-emerald-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Can I manage multiple stores?</h3>
                <p class="text-gray-600">Yes! Premium plans support multiple store locations. Each store has its own inventory folders, receipts, and staff. Manage everything from one centralized dashboard while keeping store data separate.</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all group">
            <div class="flex items-start gap-4">
              <div class="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                <ShieldCheckIcon class="w-5 h-5 text-yellow-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-2">Is my data secure?</h3>
                <p class="text-gray-600">Yes, absolutely. Storvv uses enterprise-grade security to protect all your data. Your information is encrypted, and we never share your data without your explicit permission.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
      <!-- Decorative background elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>
      <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
          <SparklesIcon class="w-8 h-8 text-white" />
        </div>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Ready to Build Your Perfect Store System?
        </h2>
        <p class="text-lg sm:text-xl text-white/90 mb-8">
          Start your free trial and see how Storvv adapts to your business needs
        </p>
        <p class="text-lg mb-8 font-medium">
          Store owners choose Storvv because it gives them:
        </p>
        <ul class="text-left max-w-md mx-auto mb-8 space-y-3">
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FolderIcon class="w-5 h-5 text-white" />
            </div>
            <span>Complete flexibility to organize inventory their way</span>
              </li>
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <UsersIcon class="w-5 h-5 text-white" />
            </div>
            <span>Automatic customer tracking from every transaction</span>
              </li>
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ReceiptPercentIcon class="w-5 h-5 text-white" />
            </div>
            <span>Professional receipts that print perfectly every time</span>
              </li>
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <UserGroupIcon class="w-5 h-5 text-white" />
            </div>
            <span>Team management with precise access control</span>
              </li>
          <li class="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ChartBarIcon class="w-5 h-5 text-white" />
            </div>
            <span>Real-time insights into what's actually happening</span>
              </li>
            </ul>
        <p class="text-lg font-semibold mb-8">
          Experience the difference a truly flexible system makes.
        </p>
        <NuxtLink to="/signup" class="group bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-base hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 inline-flex items-center gap-2">
          Get Started Now
          <ArrowRightIcon class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </NuxtLink>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 sm:py-20 lg:py-24 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Begin Managing Smarter Today
        </h2>
        <p class="text-lg sm:text-xl text-gray-600 mb-8">
          Create your free account and discover how Storvv can transform your store operations.
        </p>
        <NuxtLink to="/signup" class="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-base hover:bg-primary-700 transition-colors inline-flex items-center gap-2">
          Start Free Trial
          <ArrowRightIcon class="w-5 h-5" />
        </NuxtLink>
      </div>
    </section>

    <!-- Footer -->
    <footer id="about" class="bg-gray-900 text-gray-400 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-8">
          <NuxtLink to="/" class="inline-block mb-4">
            <span class="text-2xl font-bold text-white">Storvv</span>
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
        <ArrowUpIcon class="w-6 h-6" />
    </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
} from '@heroicons/vue/24/outline'

const mobileMenuOpen = ref(false)
const showBackToTop = ref(false)

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

const handleScroll = () => {
  // Show button when user scrolls down more than 400px
  showBackToTop.value = window.scrollY > 400
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
  }
})

onUnmounted(() => {
  // Clean up scroll event listener
  if (import.meta.client) {
    window.removeEventListener('scroll', handleScroll)
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
