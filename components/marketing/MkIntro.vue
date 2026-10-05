<template>
  <section class="mk-section mk-section--tight-top" aria-labelledby="mk-intro-title">
    <div class="mk-container">
      <div class="mk-intro mk-reveal">
        <div class="mk-intro__title">
          <p class="mk-intro__label">Welcome to Storvv</p>
          <h2 id="mk-intro-title" class="mk-intro__heading">
            One workspace, made for businesses however they sell.
          </h2>
        </div>
        <p class="mk-intro__text">
          Stop juggling notebooks, spreadsheets and separate apps. Stock, sales, receipts and
          customers live in one dashboard, so there's less to reconcile and more time on the shop
          floor.
        </p>
      </div>
    </div>

    <ul class="mk-photos" aria-label="Businesses that run on Storvv">
      <li v-for="photo in photos" :key="photo.src" class="mk-photo mk-reveal">
        <img
          class="mk-photo__img"
          :src="photo.src"
          :alt="photo.alt"
          width="864"
          height="1152"
          loading="lazy"
          decoding="async"
        />
        <span class="mk-photo__tag">{{ photo.label }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
const photos = [
  {
    src: '/marketing/people/car-dealer.webp',
    label: 'Car dealers',
    alt: 'A smiling car dealer holding up a key fob and a tablet in front of a white SUV in his showroom',
  },
  {
    src: '/marketing/people/gadget-store.webp',
    label: 'Gadget stores',
    alt: 'A gadget store attendant showing a smartwatch to a customer across a table of phones',
  },
  {
    src: '/marketing/people/electronics.webp',
    label: 'Electronics',
    alt: 'An electronics store owner holding a tablet beside shelves of TVs and boxed speakers',
  },
  {
    src: '/marketing/people/supermarket.webp',
    label: 'Supermarkets',
    alt: 'A supermarket manager scanning stock on a shelf of fresh produce',
  },
  {
    src: '/marketing/people/procurement.webp',
    label: 'Procurement',
    alt: 'A procurement officer checking an order on a tablet beside pallets of cartons in a warehouse',
  },
]
</script>
