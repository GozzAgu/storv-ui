<template>
  <section class="mk-section mko" aria-labelledby="mko-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mko-title"
        eyebrow="Getting started"
        title="Set up in an afternoon,"
        accent="with help when you need it."
        lede="Bring the stock list you already have, add your team and start selling. If you get stuck, we reply the same day."
      >
        <NuxtLink to="/help" class="mk-pill-link">Visit the help centre</NuxtLink>
      </MkSectionHead>

      <ul class="mko__grid">
        <li class="mko__card mk-reveal" style="--i: 0">
          <div class="mko__copy">
            <h3 class="mko__title">Bring your stock list</h3>
            <p class="mko__text">
              Import an Excel file into any category. Storvv shows what was added and what was
              skipped, so nothing goes missing.
            </p>
          </div>
          <div class="mk-tint--sand mko__visual" aria-hidden="true">
            <div class="mko-file">
              <FileSpreadsheet :size="20" :stroke-width="1.75" />
              <span>stock-list.xlsx</span>
            </div>
            <div class="mko-row"><span>Added</span><b>248</b></div>
            <div class="mko-row"><span>Skipped</span><b>3</b></div>
            <div class="mko-pill"><Check :size="14" />Import finished</div>
          </div>
        </li>

        <li class="mko__card mk-reveal" style="--i: 1">
          <div class="mko__copy">
            <h3 class="mko__title">Add your branches and team</h3>
            <p class="mko__text">
              Give each person a role, so cashiers sell, managers approve and only you see the
              profit.
            </p>
          </div>
          <div class="mk-tint--lilac mko__visual" aria-hidden="true">
            <div v-for="person in team" :key="person.name" class="mko-person">
              <span class="mko-avatar">{{ person.name[0] }}</span>
              <span class="mko-person__who">
                <b>{{ person.name }}</b>
                <span>{{ person.role }}</span>
              </span>
            </div>
          </div>
        </li>

        <li class="mko__card mk-reveal" style="--i: 2">
          <div class="mko__copy">
            <h3 class="mko__title">Sell from the devices you have</h3>
            <p class="mko__text">
              Storvv runs in the browser on a phone, tablet or laptop. No special hardware, no
              installation.
            </p>
          </div>
          <div class="mk-tint--sky mko__visual mko__visual--devices" aria-hidden="true">
            <span class="mko-device"><Smartphone :size="22" :stroke-width="1.75" /></span>
            <span class="mko-line" />
            <span class="mko-device mko-device--main"><StorvvMark :size="28" /></span>
            <span class="mko-line" />
            <span class="mko-device"><Laptop :size="22" :stroke-width="1.75" /></span>
          </div>
        </li>

        <li class="mko__card mk-reveal" style="--i: 3">
          <div class="mko__copy">
            <h3 class="mko__title">Answers the same day</h3>
            <p class="mko__text">
              Ask us anything by email or the contact form, and find step-by-step guides in the help
              centre.
            </p>
          </div>
          <div class="mk-tint--sage mko__visual" aria-hidden="true">
            <p class="mko-bubble">How do I import my stock list?</p>
            <p class="mko-bubble mko-bubble--reply">
              Open the category in Inventory, then choose Import Excel.
            </p>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Check, FileSpreadsheet, Laptop, Smartphone } from '@lucide/vue'
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import StorvvMark from '~/components/shell/StorvvMark.vue'

const team = [
  { name: 'Amaka', role: 'Cashier · Ikeja' },
  { name: 'Tunde', role: 'Manager · Lekki' },
  { name: 'Ifeoma', role: 'Stock keeper' },
]
</script>
