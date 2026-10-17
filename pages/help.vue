<template>
  <div>
    <section class="mk-hero mk-hero--page" aria-labelledby="help-title">
      <div class="mk-hero__backdrop" aria-hidden="true" />
      <div class="mk-container">
        <div class="mk-hero__copy">
          <p class="mk-eyebrow">Help centre</p>
          <h1 id="help-title" class="mk-h1">How can we help?</h1>
          <p class="mk-lede">Short answers about running your shop on Storvv.</p>
          <div class="mk-help-search">
            <Search :size="20" class="mk-help-search__icon" aria-hidden="true" />
            <label for="help-search" class="ds-sr-only">Search help</label>
            <input
              id="help-search"
              v-model="query"
              type="search"
              class="mk-help-search__input"
              placeholder="Search, for example IMEI or refunds"
              autocomplete="off"
              aria-describedby="help-search-status"
            />
          </div>
          <p id="help-search-status" class="mk-help-search__status" aria-live="polite">
            <template v-if="searching">
              {{ resultCount }} {{ resultCount === 1 ? 'answer' : 'answers' }} found
            </template>
          </p>
        </div>
      </div>
    </section>

    <section
      v-if="!searching"
      class="mk-section mk-section--alt"
      aria-labelledby="help-topics-title"
    >
      <div class="mk-container">
        <h2 id="help-topics-title" class="ds-sr-only">Topics</h2>
        <ul class="mk-grid mk-grid--4">
          <li v-for="topic in HELP_TOPICS" :key="topic.id">
            <a :href="`#help-${topic.id}`" class="mk-card mk-card--hover mk-help-topic">
              <span class="mk-card__icon">
                <component :is="topic.icon" :size="20" aria-hidden="true" />
              </span>
              <span class="mk-card__title">{{ topic.title }}</span>
              <span class="mk-card__text">{{ topic.line }}</span>
              <span class="mk-help-topic__count">
                {{ topic.answers.length }} answers
                <ArrowRight :size="14" aria-hidden="true" />
              </span>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <section class="mk-section" aria-label="Answers">
      <div class="mk-container mk-help">
        <nav v-if="!searching" class="mk-help__nav" aria-label="Help topics">
          <p class="mk-eyebrow">Topics</p>
          <ul>
            <li v-for="topic in HELP_TOPICS" :key="topic.id">
              <a :href="`#help-${topic.id}`" class="mk-help__nav-link">{{ topic.title }}</a>
            </li>
          </ul>
        </nav>

        <div class="mk-help__groups">
          <section
            v-for="topic in results"
            :id="`help-${topic.id}`"
            :key="`${topic.id}-${query}`"
            class="mk-help__group"
            :aria-labelledby="`help-${topic.id}-title`"
          >
            <h2 :id="`help-${topic.id}-title`" class="mk-help__group-title">
              <span class="mk-card__icon" aria-hidden="true">
                <component :is="topic.icon" :size="18" />
              </span>
              {{ topic.title }}
            </h2>
            <MkFaq :items="faqItems(topic)" :initial-open="searching ? 0 : null" />
          </section>

          <div v-if="searching && results.length === 0" class="mk-help__empty">
            <p class="mk-h3">No answers match “{{ query.trim() }}”.</p>
            <p class="mk-card__text">Try another word, or email us and we will help.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="mk-section mk-section--tight-top" aria-labelledby="help-contact-title">
      <div class="mk-container">
        <div class="mk-contact-card mk-help__contact">
          <div>
            <h2 id="help-contact-title" class="mk-h3">Still need help?</h2>
            <p class="mk-card__text">Email us and a real person will reply.</p>
          </div>
          <div class="mk-actions">
            <SButton variant="primary" class="mk-btn" to="mailto:hello@storvv.com">
              Email hello@storvv.com
            </SButton>
            <NuxtLink to="/demo/dashboard" class="mk-link">
              Try the demo
              <ArrowRight :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Search } from '@lucide/vue'
import SButton from '~/components/s/SButton.vue'
import MkFaq, { type MkFaqItem } from '~/components/marketing/MkFaq.vue'
import { HELP_TOPICS, searchHelp, type HelpTopic } from '~/utils/help-centre'

definePageMeta({ layout: 'marketing' })

const query = ref('')
const searching = computed(() => query.value.trim().length > 0)
const results = computed(() => searchHelp(query.value))
const resultCount = computed(() =>
  results.value.reduce((sum, topic) => sum + topic.answers.length, 0)
)

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Answers with a link render it as markup; everything comes from utils/help-centre.ts. */
function faqItems(topic: HelpTopic): MkFaqItem[] {
  return topic.answers.map((answer) =>
    answer.link
      ? {
          q: answer.q,
          a: `${escapeHtml(answer.a)} <a href="${answer.link.to}">${escapeHtml(
            answer.link.label
          )}</a>`,
          html: true,
        }
      : { q: answer.q, a: answer.a }
  )
}

useHead({
  title: 'Help centre · Storvv',
  meta: [
    {
      name: 'description',
      content:
        'Answers about Storvv inventory, sales, customers, reports, staff, branches and plans.',
    },
  ],
})
</script>
