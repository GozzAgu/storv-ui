<template>
  <div class="ds-root dsx">
    <header class="dsx__head">
      <div>
        <p class="ds-overline">Storvv design system</p>
        <h1 class="ds-title">Foundations</h1>
      </div>
      <button type="button" class="dsx__toggle" @click="toggleDark">
        {{ isDark ? 'Light mode' : 'Dark mode' }}
      </button>
    </header>

    <section class="dsx__section" aria-labelledby="dsx-color">
      <h2 id="dsx-color" class="ds-heading">Color</h2>
      <div v-for="group in colorGroups" :key="group.label" class="dsx__group">
        <p class="ds-overline">{{ group.label }}</p>
        <ul class="dsx__swatches">
          <li v-for="token in group.tokens" :key="token" class="dsx__swatch">
            <span class="dsx__chip" :style="{ background: `var(${token})` }" />
            <code class="ds-caption ds-text-2">{{ token }}</code>
          </li>
        </ul>
      </div>
    </section>

    <section class="dsx__section" aria-labelledby="dsx-type">
      <h2 id="dsx-type" class="ds-heading">Typography</h2>
      <div class="dsx__type">
        <p v-for="step in typeScale" :key="step.cls" class="dsx__type-row">
          <span class="ds-caption ds-text-muted dsx__type-label">{{ step.label }}</span>
          <span :class="step.cls">{{ step.sample }}</span>
        </p>
        <p class="dsx__type-row">
          <span class="ds-caption ds-text-muted dsx__type-label">Tabular numbers</span>
          <span class="ds-heading ds-num">₦1,240,000.00 · ₦35,000.00</span>
        </p>
      </div>
    </section>

    <section class="dsx__section" aria-labelledby="dsx-space">
      <h2 id="dsx-space" class="ds-heading">Spacing</h2>
      <ul class="dsx__spaces">
        <li v-for="space in spacing" :key="space" class="dsx__space">
          <span class="dsx__bar" :style="{ width: `var(${space})` }" />
          <code class="ds-caption ds-text-2">{{ space }}</code>
        </li>
      </ul>
    </section>

    <section class="dsx__section" aria-labelledby="dsx-shape">
      <h2 id="dsx-shape" class="ds-heading">Radius and elevation</h2>
      <div class="dsx__shapes">
        <div
          v-for="radius in radii"
          :key="radius"
          class="dsx__shape"
          :style="{ borderRadius: `var(${radius})` }"
        >
          <code class="ds-caption ds-text-2">{{ radius }}</code>
        </div>
        <div
          v-for="shadow in shadows"
          :key="shadow"
          class="dsx__shape dsx__shape--raised"
          :style="{ boxShadow: `var(${shadow})` }"
        >
          <code class="ds-caption ds-text-2">{{ shadow }}</code>
        </div>
      </div>
    </section>

    <section class="dsx__section" aria-labelledby="dsx-components">
      <h2 id="dsx-components" class="ds-heading">Components</h2>

      <SPageHeader title="Inventory" description="Products, stock levels and categories.">
        <template #actions>
          <SButton>Export</SButton>
          <SButton variant="primary">
            <template #leading><Plus :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
            Add product
          </SButton>
        </template>
      </SPageHeader>

      <div class="dsx__group">
        <p class="ds-overline">Buttons</p>
        <div class="dsx__row">
          <SButton variant="primary">Primary</SButton>
          <SButton>Secondary</SButton>
          <SButton variant="ghost">Ghost</SButton>
          <SButton variant="danger">Delete</SButton>
          <SButton variant="primary" loading>Saving</SButton>
          <SButton disabled>Disabled</SButton>
          <SButton size="sm">Small</SButton>
          <SButton size="lg" variant="primary">Large</SButton>
          <SIconButton label="Notifications" :badge="4">
            <Bell :size="20" :stroke-width="1.75" aria-hidden="true" />
          </SIconButton>
          <SIconButton label="Filters" variant="secondary">
            <SlidersHorizontal :size="20" :stroke-width="1.75" aria-hidden="true" />
          </SIconButton>
        </div>
      </div>

      <div class="dsx__group">
        <p class="ds-overline">Badges and avatars</p>
        <div class="dsx__row">
          <SBadge v-for="tone in badgeTones" :key="tone" :tone="tone" dot>{{ tone }}</SBadge>
          <SAvatar name="Ada Obi" size="sm" />
          <SAvatar name="Kunle Bello" />
          <SAvatar name="Storvv" size="lg" />
          <SSpinner label="Loading" />
        </div>
      </div>

      <div class="dsx__group">
        <p class="ds-overline">Stats</p>
        <div class="dsx__stats">
          <SStat label="Revenue today" value="₦1,240,000" :delta="12.4" hint="vs yesterday" />
          <SStat label="Orders" value="38" :delta="-3.1" hint="vs yesterday" />
          <SStat label="Low stock" value="7" hint="Below reorder level" />
        </div>
      </div>

      <div class="dsx__group">
        <p class="ds-overline">Tabs</p>
        <STabs v-model="tab" :tabs="tabs" label="Sales status" />
      </div>

      <div class="dsx__cards">
        <SCard title="Form controls" description="Labels, hints and errors are wired for screen readers.">
          <div class="dsx__form">
            <SInput v-model="form.name" label="Product name" placeholder="e.g. iPhone 15 Pro" required />
            <SInput
              v-model="form.price"
              label="Selling price"
              type="number"
              inputmode="decimal"
              hint="Customers see this price on receipts."
            >
              <template #prefix>₦</template>
            </SInput>
            <SInput v-model="form.email" label="Supplier email" type="email" error="Enter a valid email address." />
            <SSelect v-model="form.category" label="Category" :options="categories" placeholder="Choose a category" />
            <STextarea v-model="form.notes" label="Notes" :maxlength="200" />
            <SCheckbox v-model="form.track" label="Track stock" description="Warn me when stock runs low." />
            <SCheckbox v-model="form.publish" variant="switch" label="Show on storefront" />
          </div>
          <template #footer>
            <SButton variant="ghost">Cancel</SButton>
            <SButton variant="primary" @click="dialogOpen = true">Save product</SButton>
          </template>
        </SCard>

        <div class="dsx__stack">
          <SCard title="Loading">
            <div class="dsx__stack">
              <SSkeleton height="24px" width="40%" />
              <SSkeleton :lines="3" />
              <SSkeleton circle width="40px" height="40px" />
            </div>
          </SCard>

          <SCard flush>
            <SEmptyState
              title="No products yet"
              description="Add your first product to start tracking stock and sales."
            >
              <template #icon><Package :size="24" :stroke-width="1.75" aria-hidden="true" /></template>
              <template #actions><SButton variant="primary">Add product</SButton></template>
            </SEmptyState>
          </SCard>

          <SCard title="Overlays">
            <div class="dsx__row">
              <SPopover role="menu" label="Product actions" align="start">
                <template #trigger="{ open, toggle }">
                  <SButton aria-haspopup="menu" :aria-expanded="open" @click.stop="toggle">
                    Actions
                    <template #trailing><ChevronDown :size="16" :stroke-width="1.75" aria-hidden="true" /></template>
                  </SButton>
                </template>
                <template #default="{ close }">
                  <div class="s-popover__group">
                    <button type="button" role="menuitem" class="s-menu-row" @click="close">
                      <Pencil class="s-menu-row__icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
                      <span class="s-menu-row__label">Edit</span>
                    </button>
                    <button type="button" role="menuitem" class="s-menu-row s-menu-row--danger" @click="close">
                      <Trash2 class="s-menu-row__icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
                      <span class="s-menu-row__label">Delete</span>
                    </button>
                  </div>
                </template>
              </SPopover>
              <SButton @click="sheetOpen = true">Open side sheet</SButton>
              <SButton variant="danger" @click="dialogOpen = true">Confirm dialog</SButton>
            </div>
          </SCard>
        </div>
      </div>
    </section>

    <SDialog
      v-model:open="dialogOpen"
      title="Delete product?"
      description="This removes it from inventory. Sales history is kept."
      size="sm"
      role="alertdialog"
    >
      <template #footer>
        <SButton data-autofocus @click="dialogOpen = false">Cancel</SButton>
        <SButton variant="danger" @click="dialogOpen = false">Delete</SButton>
      </template>
    </SDialog>

    <SDialog v-model:open="sheetOpen" title="Filters" placement="right">
      <div class="dsx__form">
        <SSelect v-model="form.category" label="Category" :options="categories" placeholder="Any category" />
        <SCheckbox v-model="form.track" label="Only tracked items" />
      </div>
      <template #footer>
        <SButton variant="ghost" @click="sheetOpen = false">Reset</SButton>
        <SButton variant="primary" @click="sheetOpen = false">Apply</SButton>
      </template>
    </SDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  Bell,
  ChevronDown,
  Package,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from '@lucide/vue'
import { useThemeStore } from '~/stores/theme'
import SAvatar from '~/components/s/SAvatar.vue'
import SBadge from '~/components/s/SBadge.vue'
import SButton from '~/components/s/SButton.vue'
import SCard from '~/components/s/SCard.vue'
import SCheckbox from '~/components/s/SCheckbox.vue'
import SDialog from '~/components/s/SDialog.vue'
import SEmptyState from '~/components/s/SEmptyState.vue'
import SIconButton from '~/components/s/SIconButton.vue'
import SInput from '~/components/s/SInput.vue'
import SPageHeader from '~/components/s/SPageHeader.vue'
import SPopover from '~/components/s/SPopover.vue'
import SSelect from '~/components/s/SSelect.vue'
import SSkeleton from '~/components/s/SSkeleton.vue'
import SSpinner from '~/components/s/SSpinner.vue'
import SStat from '~/components/s/SStat.vue'
import STabs from '~/components/s/STabs.vue'
import STextarea from '~/components/s/STextarea.vue'

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

definePageMeta({ layout: false })
useHead({ title: 'Design system - Storvv', meta: [{ name: 'robots', content: 'noindex' }] })

const themeStore = useThemeStore()
themeStore.initTheme()
const isDark = computed(() => themeStore.actualTheme === 'dark')
const toggleDark = () => themeStore.setTheme(isDark.value ? 'light' : 'dark')

const colorGroups = [
  {
    label: 'Neutrals',
    tokens: ['--s-bg', '--s-surface', '--s-surface-2', '--s-surface-hover', '--s-border', '--s-border-strong'],
  },
  { label: 'Text', tokens: ['--s-text', '--s-text-2', '--s-text-muted'] },
  {
    label: 'Accent',
    tokens: ['--s-accent', '--s-accent-hover', '--s-accent-active', '--s-accent-soft'],
  },
  {
    label: 'Status',
    tokens: [
      '--s-success',
      '--s-success-soft',
      '--s-warning',
      '--s-warning-soft',
      '--s-error',
      '--s-error-soft',
      '--s-info',
      '--s-info-soft',
    ],
  },
]

const typeScale = [
  { label: 'Display', cls: 'ds-display', sample: 'How is the business doing?' },
  { label: 'Page title', cls: 'ds-title', sample: 'Inventory' },
  { label: 'Section heading', cls: 'ds-heading', sample: 'Low stock' },
  { label: 'Body large', cls: 'ds-body-lg', sample: 'Stock, sales, receipts, and your team in one workspace.' },
  { label: 'Body', cls: 'ds-body', sample: 'Products live inside subcategories. Open one to manage stock.' },
  { label: 'Small', cls: 'ds-small ds-text-2', sample: '7 items · ₦11.2m total value' },
  { label: 'Caption', cls: 'ds-caption ds-text-muted', sample: 'Updated 2 minutes ago' },
  { label: 'Overline', cls: 'ds-overline', sample: 'Operations' },
]

const spacing = [
  '--s-space-half',
  '--s-space-1',
  '--s-space-2',
  '--s-space-3',
  '--s-space-4',
  '--s-space-5',
  '--s-space-6',
  '--s-space-8',
]
const radii = ['--s-radius-sm', '--s-radius', '--s-radius-lg', '--s-radius-full']
const shadows = ['--s-shadow-sm', '--s-shadow-md', '--s-shadow-lg']

const badgeTones = ['neutral', 'accent', 'success', 'warning', 'error', 'info'] as const
const tabs = [
  { value: 'all', label: 'All', count: 128 },
  { value: 'paid', label: 'Paid', count: 112 },
  { value: 'pending', label: 'Pending', count: 9 },
  { value: 'refunded', label: 'Refunded', count: 7 },
]
const tab = ref('all')
const categories = [
  { label: 'Phones', value: 'phones' },
  { label: 'Laptops', value: 'laptops' },
  { label: 'Accessories', value: 'accessories' },
]
const form = reactive({
  name: '',
  price: '' as string | number,
  email: 'orders@',
  category: '',
  notes: '',
  track: true,
  publish: false,
})
const dialogOpen = ref(false)
const sheetOpen = ref(false)
</script>

<style scoped>
.dsx {
  min-height: 100vh;
  padding-block: var(--s-space-6);
  padding-inline: max(var(--s-space-3), calc((100% - var(--s-content-max)) / 2));
}

.dsx__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s-space-2);
  margin-bottom: var(--s-space-6);
}

.dsx__toggle {
  height: var(--s-control-h);
  padding: 0 var(--s-space-2);
  border: 1px solid var(--s-border);
  border-radius: var(--s-radius);
  background: var(--s-surface);
  color: var(--s-text);
  font: var(--s-text-body);
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--s-duration-fast) var(--s-ease);
}

.dsx__toggle:hover {
  background: var(--s-surface-hover);
}

.dsx__section {
  display: grid;
  gap: var(--s-space-3);
  padding: var(--s-space-4) 0;
  border-top: 1px solid var(--s-border);
}

.dsx__group {
  display: grid;
  gap: var(--s-space-1);
}

.dsx__swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: var(--s-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.dsx__swatch {
  display: grid;
  gap: var(--s-space-1);
}

.dsx__chip {
  display: block;
  height: var(--s-space-6);
  border: 1px solid var(--s-border);
  border-radius: var(--s-radius);
}

.dsx__type {
  display: grid;
  gap: var(--s-space-2);
}

.dsx__type-row {
  display: grid;
  grid-template-columns: 160px 1fr;
  align-items: baseline;
  gap: var(--s-space-2);
}

.dsx__spaces {
  display: grid;
  gap: var(--s-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.dsx__space {
  display: flex;
  align-items: center;
  gap: var(--s-space-2);
}

.dsx__bar {
  display: block;
  height: var(--s-space-1);
  border-radius: var(--s-radius-sm);
  background: var(--s-accent);
}

.dsx__shapes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: var(--s-space-2);
}

.dsx__shape {
  display: grid;
  place-items: center;
  height: 96px;
  border: 1px solid var(--s-border);
  background: var(--s-surface);
}

.dsx__shape--raised {
  border-color: transparent;
  border-radius: var(--s-radius-lg);
}

.dsx__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-space-1);
}

.dsx__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--s-space-2);
}

.dsx__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  align-items: start;
  gap: var(--s-space-3);
}

.dsx__stack,
.dsx__form {
  display: grid;
  gap: var(--s-space-2);
}

@media (max-width: 640px) {
  .dsx__type-row {
    grid-template-columns: 1fr;
    gap: var(--s-space-half);
  }
}
</style>
