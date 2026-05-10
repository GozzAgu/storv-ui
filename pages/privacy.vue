<template>
  <div class="min-h-screen bg-white dark:bg-slate-950">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 dark:bg-slate-950/90">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center gap-3 h-16 lg:h-20">
          <NuxtLink
            to="/"
            class="inline-flex shrink-0 rounded-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <img :src="logoSource" alt="Storvv" class="h-7 w-auto max-w-[122px] object-contain sm:h-8" />
          </NuxtLink>
          <div class="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <NuxtLink to="/" class="text-gray-600 hover:text-gray-900 font-medium transition-colors dark:text-gray-300 dark:hover:text-white text-sm sm:text-base">
              Back to Home
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <div class="pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="prose prose-lg max-w-none">
          <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">Privacy Policy</h1>
          <p class="text-gray-600 dark:text-gray-400 mb-8">Last updated: May 9, 2026</p>

          <div class="space-y-8 text-gray-700 dark:text-gray-300">
            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">1. Introduction</h2>
              <p class="mb-4">
                Welcome to Storvv ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use Storvv, our cloud-based platform for retail and store operations, including inventory organized in custom folders, point-of-sale style receipts and returns, customer records tied to transactions, team access and roles, notifications, analytics (on eligible subscription plans), and related features described on <a href="https://www.storvv.com" class="font-medium text-primary-600 underline decoration-primary-500/35 underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">storvv.com</a>.
              </p>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">2. Information We Collect</h2>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">2.1 Information You Provide</h3>
              <p class="mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Account and profile details (such as name, email, credentials managed through our authentication provider)</li>
                <li>Store and business profile information you enter (store name, address, receipt settings, and similar operational details)</li>
                <li>Operational data you create in the product inventory folders and item records, quantities, pricing, identifiers such as SKU or serials where you use those fields, receipts, returns, swaps, transfers, and activity logs your plan includes</li>
                <li>Customer-related data you record (for example contact fields and purchase history derived from receipts)</li>
                <li>Team and permission data for staff accounts and departments linked to your organization</li>
                <li>Billing identifiers and subscription status; card and bank payments are handled by our payment processor; we do not store full card numbers on Storvv servers</li>
                <li>Support and feedback messages you send us</li>
              </ul>

              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <p class="mb-4">
                We automatically collect certain information when you use our service:
              </p>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">3. How We Use Your Information</h2>
              <p class="mb-4">We use the information we collect to:</p>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">4. Information Sharing and Disclosure</h2>
              <p class="mb-4">We do not sell your personal information. We may share or allow access to information only in the following circumstances:</p>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li><strong>Infrastructure providers:</strong> We host the Service and store most operational data using Google Firebase (including Firebase Authentication and Cloud Firestore) and related Google Cloud services, which process data as described in their terms and privacy documentation.</li>
                <li><strong>Payments:</strong> Subscription and upgrade payments may be processed by Paystack Limited or other processors we integrate; payment data is handled under their privacy policy and certifications.</li>
                <li><strong>Other service providers:</strong> Analytics, email, error reporting, or similar vendors who assist in operating and improving Storvv, subject to contractual confidentiality obligations.</li>
                <li><strong>Legal requirements:</strong> When required by law, regulation, legal process, or to protect our rights, users, or the public.</li>
                <li><strong>Business transfers:</strong> In connection with a merger, acquisition, financing, or sale of assets.</li>
                <li><strong>With your consent:</strong> When you have given explicit permission.</li>
              </ul>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">5. Data Security</h2>
              <p class="mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">6. Your Rights and Choices</h2>
              <p class="mb-4">You have the right to:</p>
              <ul class="list-disc pl-6 mb-4 space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete information</li>
                <li>Request deletion of your personal data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability (receive your data in a structured format)</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p class="mb-4">
                To exercise these rights or ask questions about your data, please contact us at <a href="mailto:privacy@storvv.com" class="font-medium text-primary-600 underline decoration-primary-500/35 underline-offset-2 hover:text-primary-700 dark:text-primary-400">privacy@storvv.com</a>.
              </p>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">7. Cookies and Tracking Technologies</h2>
              <p class="mb-4">
                We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
              </p>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">8. Data Retention</h2>
              <p class="mb-4">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">9. Children's Privacy</h2>
              <p class="mb-4">
                Our service is not intended for children under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">10. International Data Transfers</h2>
              <p class="mb-4">
                Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ. By using our service, you consent to the transfer of your information to these facilities.
              </p>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">11. Changes to This Privacy Policy</h2>
              <p class="mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">12. Contact Us</h2>
              <p class="mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul class="list-none mb-4 space-y-2">
                <li><strong>Email:</strong> <a href="mailto:hello@storvv.com" class="font-medium text-primary-600 underline decoration-primary-500/35 underline-offset-2 dark:text-primary-400">hello@storvv.com</a></li>
                <li><strong>Website:</strong> <a href="https://www.storvv.com" class="font-medium text-primary-600 underline decoration-primary-500/35 underline-offset-2 dark:text-primary-400">storvv.com</a></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <NuxtLink
            to="/"
            class="mb-3 sm:mb-4 inline-flex justify-center rounded-sm outline-none ring-offset-gray-900 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary-400/40 focus-visible:ring-offset-2"
          >
            <img src="/storvv logo.png" alt="Storvv" class="h-7 w-auto max-w-[122px] object-contain sm:h-8" />
          </NuxtLink>
          <p class="text-gray-500 text-sm">
            &copy; 2026 Storvv. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ThemeToggle from '~/components/ui/ThemeToggle.vue'
import { useTheme } from '~/composables/useTheme'

const { actualTheme } = useTheme()
const logoSource = computed(() =>
  actualTheme.value === 'dark' ? '/storvv logo.png' : '/storvv logo 2.png'
)

useHead({
  title: 'Privacy Policy - Storvv',
  meta: [
    {
      name: 'description',
      content: 'Privacy Policy for Storvv retail and store operations software'
    }
  ]
})
</script>

<style scoped>
@reference "../assets/css/main.css";
.prose h2 {
  @apply border-b border-gray-200 pb-2 dark:border-gray-700;
}
.prose ul {
  @apply text-gray-700 dark:text-gray-300;
}
.prose strong {
  @apply text-gray-900 dark:text-gray-100;
}
</style>

