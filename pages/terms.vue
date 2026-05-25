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
 <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">Terms of Service</h1>
 <p class="text-gray-600 dark:text-gray-400 mb-8">Last updated: May 9, 2026</p>

 <div class="space-y-8 text-gray-700 dark:text-gray-300">
 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">1. Agreement to Terms</h2>
 <p class="mb-4">
 By accessing or using Storvv ("the Service"), you agree to these Terms of Service ("Terms") and our <NuxtLink to="/privacy" class="font-medium text-primary-600 underline decoration-primary-500/35 underline-offset-2 hover:text-primary-700 dark:text-primary-400">Privacy Policy</NuxtLink>. If you disagree with any part of these Terms, you may not access the Service.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">2. Description of Service</h2>
 <p class="mb-4">
 Storvv is a cloud software service for retail and store operations. Depending on your subscription, features may include custom inventory folders and templates, stock and serial tracking, receipts and returns, customer records tied to transactions, staff accounts with role-based access, dashboards and notifications, analytics and reporting, multi-location management, inventory transfers between locations, duplication of folders or items, audit-style activity logs, and other capabilities described on <a href="https://www.storvv.com" class="font-medium text-primary-600 underline decoration-primary-500/35 underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">storvv.com</a> or in-product. Features and limits vary by plan (see below).
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">3. User Accounts</h2>
 <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">3.1 Account Creation</h3>
 <p class="mb-4">
 To use our Service, you must create an account. You agree to:
 </p>
 <ul class="list-disc pl-6 mb-4 space-y-2">
 <li>Provide accurate, current, and complete information</li>
 <li>Maintain and update your information to keep it accurate</li>
 <li>Maintain the security of your password and account</li>
 <li>Accept responsibility for all activities under your account</li>
 <li>Notify us immediately of any unauthorized use</li>
 </ul>

 <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">3.2 Account Eligibility</h3>
 <p class="mb-4">
 You must be at least 18 years old to use our Service. By using Storvv, you represent and warrant that you meet this age requirement.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">4. Acceptable Use</h2>
 <p class="mb-4">You agree not to:</p>
 <ul class="list-disc pl-6 mb-4 space-y-2">
 <li>Use the Service for any unlawful purpose or in violation of applicable laws</li>
 <li>Upload or collect personal data without a lawful basis, or use the Service to violate privacy rights of customers, staff, or others</li>
 <li>Violate or infringe upon the rights of others</li>
 <li>Transmit any harmful code, viruses, or malicious software</li>
 <li>Attempt to gain unauthorized access to the Service or related systems</li>
 <li>Interfere with or disrupt the Service or servers</li>
 <li>Use automated systems to access the Service without permission</li>
 <li>Copy, modify, or create derivative works of the Service</li>
 <li>Reverse engineer, decompile, or disassemble the Service</li>
 </ul>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">5. Subscription and Payment</h2>
 <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">5.1 Subscription plans</h3>
 <p class="mb-4">
 Storvv is offered in tiers such as <strong>Storvv Micro</strong> (free, with limits on stores, departments, staff, and certain features), <strong>Storvv Medium</strong>, and <strong>Storvv Enterprise</strong>, each with different limits and capabilities. Current plan details, limits, and prices are shown in the product and on our public site; we may change plans and pricing with reasonable notice where required.
 </p>

 <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">5.2 Billing and payment processor</h3>
 <p class="mb-4">
 Paid upgrades are processed through a third-party payment provider (for example Paystack). By purchasing a paid plan, you agree to that provider’s terms and privacy policy. You authorize us and our payment partners to charge your chosen payment method for applicable fees, taxes, and renewals on the schedule shown at checkout.
 </p>

 <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">5.3 Renewals and cancellation</h3>
 <p class="mb-4">
 Subscriptions renew according to the billing cycle you select unless canceled in accordance with the controls we provide (for example through your Paystack subscription or account settings where available). Canceling stops future renewal; access for the current prepaid period continues unless we state otherwise at the time of cancellation.
 </p>

 <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">5.4 Taxes and refunds</h3>
 <p class="mb-4">
 Fees may be stated excluding applicable taxes unless we specify otherwise. Refunds, if any, are governed by the policy communicated at purchase and mandatory consumer laws in your jurisdiction. The Micro plan has no subscription fee and is not refundable as a subscription product.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">6. Intellectual Property</h2>
 <p class="mb-4">
 The Service and its original content, features, and functionality are owned by Storvv and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not use our trademarks, logos, or other proprietary information without our prior written consent.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">7. User Content</h2>
 <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">7.1 Ownership</h3>
 <p class="mb-4">
 You retain ownership of your operational and business data that you submit to the Service ("User Content"), subject to applicable law. You grant Storvv a worldwide, non-exclusive license to host, reproduce, transmit, display, and process User Content solely to operate, secure, improve, and support the Service for you, including backups, redundancy, and machine-readable processing, and as described in our Privacy Policy.
 </p>

 <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mt-6 mb-3">7.2 Responsibility</h3>
 <p class="mb-4">
 You are solely responsible for your User Content. You represent and warrant that you have all necessary rights to your User Content and that it does not violate any laws or infringe upon any third-party rights.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">8. Service Availability</h2>
 <p class="mb-4">
 We strive to provide reliable service but do not guarantee that the Service will be available at all times. We may experience downtime due to maintenance, updates, or unforeseen circumstances. We are not liable for any loss or damage resulting from Service unavailability.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">9. Data Backup and Loss</h2>
 <p class="mb-4">
 While we implement backup and recovery procedures, you are responsible for maintaining backups of your important data. We are not liable for any loss of data or content.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">10. Termination</h2>
 <p class="mb-4">
 We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service will cease immediately.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">11. Disclaimer of Warranties</h2>
 <p class="mb-4">
 THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">12. Limitation of Liability</h2>
 <p class="mb-4">
 TO THE MAXIMUM EXTENT PERMITTED BY LAW, STORVV SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">13. Indemnification</h2>
 <p class="mb-4">
 You agree to indemnify and hold harmless Storvv, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of the Service, violation of these Terms, or infringement of any rights of another.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">14. Governing Law and Disputes</h2>
 <p class="mb-4">
 These Terms are governed by the laws that apply to Storvv’s operation of the Service, without regard to conflict-of-law rules that would require applying another jurisdiction’s laws, except where mandatory consumer protection laws in your country give you non-waivable rights, in which case those laws prevail to the minimum extent required.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">15. Changes to Terms</h2>
 <p class="mb-4">
 We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
 </p>
 </section>

 <section>
 <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 sm:mt-8 mb-3 sm:mb-4">16. Contact Information</h2>
 <p class="mb-4">
 If you have any questions about these Terms, please contact us:
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
 title: 'Terms of Service - Storvv',
 meta: [
 {
 name: 'description',
 content: 'Terms of Service for Storvv retail and store operations software'
 }
 ]
})
</script>

<style scoped>
@reference "../assets/css/main.css";
.prose h2 {
 @apply border-b border-gray-200 pb-2;
}
.prose ul {
 @apply text-gray-700 dark:text-gray-300;
}
.prose strong {
 @apply text-gray-900 dark:text-gray-100;
}
</style>

