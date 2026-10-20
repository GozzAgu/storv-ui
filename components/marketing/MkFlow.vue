<template>
  <section id="how-it-works" class="mk-section mk-section--alt mkf" aria-labelledby="mkf-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mkf-title"
        eyebrow="How Storvv works"
        title="From delivery to daily report."
        accent="Nothing typed twice."
        lede="Follow your stock from the day it arrives to the report that shows it sold."
      />

      <ol class="mkf__rail mk-reveal" aria-label="Steps">
        <li v-for="(step, i) in steps" :key="step.id" class="mkf__rail-item">
          <a :href="`#flow-${step.id}`" class="mkf__rail-link">
            <span class="mkf__rail-icon">
              <component :is="step.icon" :size="20" :stroke-width="1.75" aria-hidden="true" />
            </span>
            <span class="mkf__rail-num">0{{ i + 1 }}</span>
            <span class="mkf__rail-label">{{ step.short }}</span>
          </a>
        </li>
      </ol>

      <ol class="mkf__steps">
        <li
          v-for="(step, i) in steps"
          :id="`flow-${step.id}`"
          :key="step.id"
          class="mkf__step"
          :class="{ 'mkf__step--reverse': i % 2 === 1 }"
        >
          <div class="mkf__copy mk-reveal">
            <p class="mkf__num">Step 0{{ i + 1 }}</p>
            <h3 class="mkf__title">{{ step.title }}</h3>
            <p class="mkf__text">{{ step.text }}</p>
            <ul class="mk-checks">
              <li v-for="point in step.points" :key="point.text">
                <Check :size="16" aria-hidden="true" />
                <span>
                  {{ point.text }}
                  <span v-if="point.plan" class="mk-tag mk-tag--accent">{{ point.plan }}</span>
                </span>
              </li>
            </ul>
          </div>

          <div class="mkf__visual mk-reveal">
            <MkFrame
              v-if="step.shot"
              class="mkf__frame"
              :src="step.shot.src"
              :alt="step.shot.alt"
              :url="step.shot.url"
            />

            <div v-else-if="step.id === 'receive'" class="mkf-ui" aria-hidden="true">
              <div class="mkf-ui__head">
                <span class="mkf-ui__icon"><FileSpreadsheet :size="16" /></span>
                <span class="mkf-ui__who">
                  <span class="mkf-ui__strong">stock-october.xlsx</span>
                  <span class="mkf-ui__muted">Imported into Phones · Lagos</span>
                </span>
                <span class="mkf-ui__chip mkf-ui__chip--success">Done</span>
              </div>
              <div class="mkf-ui__stats">
                <span><b>248</b> added</span>
                <span><b>3</b> skipped</span>
                <span><b>12</b> categories</span>
              </div>
              <div v-for="row in received" :key="row.name" class="mkf-ui__row">
                <span class="mkf-ui__who">
                  <span class="mkf-ui__strong">{{ row.name }}</span>
                  <span class="mkf-ui__muted">{{ row.meta }}</span>
                </span>
                <span class="mkf-ui__qty">{{ row.qty }}</span>
              </div>
              <div class="mkf-ui__scan"><ScanBarcode :size="16" />Scan with your phone camera</div>
            </div>

            <div v-else-if="step.id === 'update'" class="mkf-ui mkf-ui--updates" aria-hidden="true">
              <div class="mkf-ui__sale">
                <span class="mkf-ui__icon mkf-ui__icon--brand"><ReceiptText :size="16" /></span>
                <span class="mkf-ui__who">
                  <span class="mkf-ui__strong">Sale #1043 · ₦485,000</span>
                  <span class="mkf-ui__muted">iPhone 13 128GB · Ada Okonkwo</span>
                </span>
                <span class="mkf-ui__chip mkf-ui__chip--success">Paid ₦365,000</span>
              </div>
              <div v-for="update in updates" :key="update.label" class="mkf-ui__row">
                <span class="mkf-ui__icon"><component :is="update.icon" :size="16" /></span>
                <span class="mkf-ui__who">
                  <span class="mkf-ui__strong">{{ update.label }}</span>
                  <span class="mkf-ui__muted">{{ update.value }}</span>
                </span>
                <Check :size="16" class="mkf-ui__tick" />
              </div>
            </div>

            <div v-else class="mkf-ui mkf-ui--report" aria-hidden="true">
              <div class="mkf-ui__report-head">
                <span>
                  <span class="mkf-ui__muted">Revenue · this month</span>
                  <span class="mkf-ui__big">₦8.4m</span>
                </span>
                <span class="mkf-ui__chip mkf-ui__chip--success">+24%</span>
              </div>
              <div class="mkf-ui__bars">
                <span v-for="(h, n) in chart" :key="n" :style="{ '--h': h }" />
              </div>
              <div v-for="row in branches" :key="row.name" class="mkf-ui__row">
                <span class="mkf-ui__who">
                  <span class="mkf-ui__strong">{{ row.name }}</span>
                  <span class="mkf-ui__muted">Top: {{ row.top }}</span>
                </span>
                <span class="mkf-ui__qty">{{ row.total }}</span>
              </div>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  Check,
  FileSpreadsheet,
  FolderTree,
  HandCoins,
  MessageCircle,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  ScanBarcode,
} from '@lucide/vue'
import MkFrame from '~/components/marketing/MkFrame.vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'

const steps = [
  {
    id: 'receive',
    short: 'Receive stock',
    icon: PackagePlus,
    title: 'Add stock the way it arrives',
    text: 'Type products in, scan barcodes with your phone camera, or import your Excel list into any category. Storvv tells you what was added and what was skipped.',
    points: [
      { text: 'Import from Excel (.xlsx or .xls)' },
      { text: 'Track by serial or IMEI, or by quantity' },
      { text: 'Scan barcodes with the camera you already have' },
    ],
  },
  {
    id: 'organise',
    short: 'Organise',
    icon: FolderTree,
    title: 'Give every item a place',
    text: 'Group products into categories and departments for each branch. Set a low-stock level and Storvv flags it before the shelf is empty.',
    points: [
      { text: 'Categories and departments' },
      { text: 'Low-stock alerts and a reorder list' },
      { text: 'Switch branch from one menu' },
    ],
    shot: {
      src: '/marketing/app/inventory.webp',
      url: 'app.storvv.com/inventory',
      alt: 'Storvv inventory for the Lagos branch: categories with stock value, item counts and a low-stock flag',
    },
  },
  {
    id: 'sell',
    short: 'Sell',
    icon: ReceiptText,
    title: 'Ring it up at the till',
    text: "Search or scan, take cash, transfer, card or a split, and send the receipt on WhatsApp or as a PDF. If the internet drops, keep selling: sales sync when you're back online.",
    points: [
      { text: 'Quick Sale for walk-in customers' },
      { text: 'Split payments across methods' },
      { text: 'Returns and refunds on the same receipt' },
    ],
    shot: {
      src: '/marketing/app/sales.webp',
      url: 'app.storvv.com/sales',
      alt: 'Storvv sales: receipts with customers, items, totals, profit and payment status',
    },
  },
  {
    id: 'update',
    short: 'Everything updates',
    icon: RefreshCw,
    title: 'One sale updates everything',
    text: "Complete a sale and the stock count drops, the receipt goes out, the customer's balance changes and today's numbers move. Nobody re-types anything.",
    points: [
      { text: 'Stock counts per branch, live' },
      { text: 'Part payments and what each customer owes', plan: 'Medium' },
      { text: 'Every change in the activity log', plan: 'Medium' },
    ],
  },
  {
    id: 'move',
    short: 'Transfer & reorder',
    icon: ArrowLeftRight,
    title: 'Move stock to where it sells',
    text: 'Send stock between branches with an approval trail, lend stock to other dealers and get it back, and export a reorder list of everything running low.',
    points: [
      { text: 'Branch-to-branch transfers', plan: 'Enterprise' },
      { text: 'Stock loans with who has what', plan: 'Enterprise' },
      { text: 'Export a reorder list in one click' },
    ],
    shot: {
      src: '/marketing/app/branches.webp',
      url: 'app.storvv.com/transfers',
      alt: 'Storvv transfers: stock moving between branches with approval status',
    },
  },
  {
    id: 'report',
    short: 'Reports',
    icon: BarChart3,
    title: 'See what sold, where, and what you made',
    text: "The overview shows today's revenue, top products and low stock on every plan. Medium adds reports by branch, staff and product, with PDF and Excel export.",
    points: [
      { text: 'Overview on every plan' },
      { text: 'Reports by branch, staff and product', plan: 'Medium' },
      { text: 'Export to PDF and Excel', plan: 'Medium' },
    ],
  },
]

const received = [
  { name: 'iPhone 13 128GB', meta: 'IMEI tracked · Phones', qty: '14' },
  { name: 'AirPods Pro', meta: 'Quantity · Accessories', qty: '36' },
  { name: '20W USB-C charger', meta: 'Quantity · Accessories', qty: '120' },
]

const updates = [
  { icon: Boxes, label: 'Stock', value: 'iPhone 13 128GB · 13 left at Lagos' },
  { icon: MessageCircle, label: 'Receipt', value: 'Sent to Ada on WhatsApp' },
  { icon: HandCoins, label: 'Customer balance', value: 'Ada owes ₦120,000' },
  { icon: BarChart3, label: 'Today', value: '+₦485,000 revenue' },
]

const chart = [0.38, 0.52, 0.46, 0.64, 0.58, 0.72, 0.68, 0.84, 0.78, 1]

const branches = [
  { name: 'Lagos', top: 'iPhone 13', total: '₦4.9m' },
  { name: 'Abuja', top: 'AirPods Pro', total: '₦2.2m' },
  { name: 'Port Harcourt', top: 'USB-C charger', total: '₦1.3m' },
]
</script>
