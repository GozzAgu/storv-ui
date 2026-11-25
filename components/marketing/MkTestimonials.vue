<template>
  <section v-if="items.length" class="mk-section" aria-labelledby="mkt-title">
    <div class="mk-container">
      <MkSectionHead
        title-id="mkt-title"
        eyebrow="Customers"
        title="Shops like yours,"
        accent="in their own words."
      />
      <ul class="mk-grid" :class="items.length >= 3 ? 'mk-grid--3' : 'mk-grid--2'">
        <li v-for="item in items" :key="item.name" class="mk-card mk-reveal mkt">
          <blockquote class="mkt__quote">“{{ item.quote }}”</blockquote>
          <figure class="mkt__who">
            <img
              v-if="item.photo"
              :src="item.photo"
              alt=""
              class="mkt__photo"
              width="40"
              height="40"
              loading="lazy"
            />
            <span v-else class="mkt__initial" aria-hidden="true">{{ item.name[0] }}</span>
            <figcaption>
              <span class="mkt__name">{{ item.name }}</span>
              <span class="mkt__role">{{ item.role }}, {{ item.business }}</span>
            </figcaption>
          </figure>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import MkSectionHead from '~/components/marketing/MkSectionHead.vue'
import { TESTIMONIALS, type Testimonial } from '~/utils/testimonials'

const props = withDefaults(defineProps<{ items?: Testimonial[] }>(), { items: () => TESTIMONIALS })
const items = props.items
</script>

<style scoped>
.mkt {
  gap: var(--s-space-3);
  justify-content: space-between;
}

.mkt__quote {
  margin: 0;
  font: 500 1.0625rem / 1.6 var(--s-font-sans);
  color: var(--s-text);
  text-wrap: pretty;
}

.mkt__who {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.mkt__photo,
.mkt__initial {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.mkt__initial {
  display: grid;
  place-items: center;
  background: var(--s-accent-soft);
  color: var(--s-accent);
  font-weight: 700;
}

.mkt__who figcaption {
  display: grid;
}

.mkt__name {
  font-weight: 700;
  color: var(--s-text);
}

.mkt__role {
  font-size: 0.875rem;
  color: var(--s-text-2);
}
</style>
