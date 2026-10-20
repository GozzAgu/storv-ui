<template>
  <section class="mk-section mkx" aria-labelledby="mkx-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mkx-title"
        eyebrow="Compare"
        title="Swap the notebook"
        accent="for something that keeps up."
        lede="How Storvv compares with a notebook or spreadsheet, and with till software installed on one computer."
      />

      <div class="mkx__wrap mk-reveal">
        <table class="mkx__table">
          <caption class="ds-sr-only">
            Storvv compared with notebooks and spreadsheets, and with installed till software
          </caption>
          <thead>
            <tr>
              <td />
              <th scope="col" class="mkx__us">
                <img :src="logoSrc" alt="Storvv" class="mkx__logo" width="82" height="22" />
              </th>
              <th scope="col">Notebook or spreadsheet</th>
              <th scope="col">Installed till software</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.label">
              <th scope="row">{{ row.label }}</th>
              <td class="mkx__us">
                <span class="mkx__cell">
                  <Check :size="16" class="mkx__yes" aria-hidden="true" />{{ row.us }}
                </span>
              </td>
              <td>{{ row.sheet }}</td>
              <td>{{ row.legacy }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { useMarketingLogo } from '~/composables/useMarketingSite'

const logoSrc = useMarketingLogo()

const rows = [
  {
    label: 'Stock levels',
    us: 'Live in every branch',
    sheet: 'Counted by hand',
    legacy: 'On the shop computer only',
  },
  {
    label: 'When the internet drops',
    us: 'Keep selling, syncs later',
    sheet: 'Not affected',
    legacy: 'Depends on the setup',
  },
  {
    label: 'Receipts',
    us: 'WhatsApp or PDF',
    sheet: 'Handwritten',
    legacy: 'Printed only',
  },
  {
    label: 'Who owes you',
    us: 'Balance on every customer',
    sheet: 'A separate list',
    legacy: 'Often an add-on',
  },
  {
    label: 'Trade-ins and IMEI',
    us: 'Built in',
    sheet: 'Written down',
    legacy: 'Rarely supported',
  },
  {
    label: 'Getting started',
    us: 'About 10 minutes',
    sheet: 'Immediate, but slow to keep up',
    legacy: 'Installation and training',
  },
  {
    label: 'Cost to start',
    us: 'Free for one store',
    sheet: 'Free',
    legacy: 'Licence and hardware',
  },
]
</script>
