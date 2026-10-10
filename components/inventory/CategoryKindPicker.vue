<template>
  <div class="s-c s-kind-picker">
    <div class="s-kind-picker__current" aria-live="polite">
      <span class="s-kind-picker__current-icon" aria-hidden="true">
        <component :is="categoryKindIcon(selected?.id)" :size="20" :stroke-width="1.75" />
      </span>
      <span class="s-kind-picker__current-text">
        <span class="s-kind-picker__current-label">{{ selected?.label || 'Choose a type' }}</span>
        <span class="s-kind-picker__current-meta">
          {{
            selected
              ? suggested
                ? 'Suggested from the name. Pick another if it is wrong.'
                : selected.group
              : 'The icon shows on this category and on your storefront.'
          }}
        </span>
      </span>
    </div>

    <SSearch
      v-model="query"
      placeholder="Search, e.g. perfumes, cement, phones"
      label="Search category types"
    />

    <div
      ref="listEl"
      class="s-kind-picker__list"
      role="radiogroup"
      :aria-label="ariaLabel"
      @keydown="onKeydown"
    >
      <section v-for="group in groups" :key="group.name" class="s-kind-picker__group">
        <h4 class="s-kind-picker__group-title">{{ group.name }}</h4>
        <div class="s-kind-picker__grid">
          <button
            v-for="kind in group.kinds"
            :key="kind.id"
            type="button"
            role="radio"
            class="s-kind"
            :data-kind="kind.id"
            :aria-checked="kind.id === modelValue"
            :tabindex="kind.id === focusId ? 0 : -1"
            @click="choose(kind.id)"
          >
            <span class="s-kind__icon" aria-hidden="true">
              <component :is="categoryKindIcon(kind.id)" :size="18" :stroke-width="1.75" />
            </span>
            <span class="s-kind__label">{{ kind.label }}</span>
            <Check
              v-if="kind.id === modelValue"
              class="s-kind__check"
              :size="14"
              :stroke-width="2.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>
      <p v-if="groups.length === 0" class="s-kind-picker__empty">
        No type matches “{{ query.trim() }}”. Try another word, or choose
        <button type="button" class="s-link" @click="clearAndChoose('other')">Other</button>.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Check } from '@lucide/vue'
import SSearch from '~/components/s/SSearch.vue'
import {
  CATEGORY_KIND_GROUPS,
  getCategoryKind,
  searchCategoryKinds,
  type CategoryKind,
} from '~/utils/category-kinds'
import { categoryKindIcon } from '~/utils/category-kind-icons'

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** The current value was picked automatically from the category name. */
    suggested?: boolean
    ariaLabel?: string
  }>(),
  { suggested: false, ariaLabel: 'Category type' }
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const query = ref('')
const listEl = ref<HTMLElement | null>(null)

const selected = computed(() => getCategoryKind(props.modelValue))

const groups = computed(() => {
  const matches = searchCategoryKinds(query.value)
  return CATEGORY_KIND_GROUPS.map((name) => ({
    name,
    kinds: matches.filter((k) => k.group === name),
  })).filter((g) => g.kinds.length > 0)
})

const visibleKinds = computed<CategoryKind[]>(() => groups.value.flatMap((g) => g.kinds))

/** One tab stop for the whole grid: the selected type when visible, otherwise the first. */
const focusId = computed(() => {
  const visible = visibleKinds.value
  return visible.some((k) => k.id === props.modelValue) ? props.modelValue : visible[0]?.id
})

function choose(id: string) {
  emit('update:modelValue', id)
}

function clearAndChoose(id: string) {
  query.value = ''
  choose(id)
}

function focusKind(id: string | undefined) {
  if (!id) return
  listEl.value?.querySelector<HTMLElement>(`[data-kind="${id}"]`)?.focus()
}

function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  const current = target.dataset.kind
  if (!current) return
  const ids = visibleKinds.value.map((k) => k.id)
  const index = ids.indexOf(current)
  const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  let next: string | undefined
  if (event.key in step) next = ids[(index + step[event.key]! + ids.length) % ids.length]
  else if (event.key === 'Home') next = ids[0]
  else if (event.key === 'End') next = ids[ids.length - 1]
  if (!next) return
  event.preventDefault()
  focusKind(next)
}

/** Scroll only the list (not the drawer) when the choice is out of view, e.g. a suggestion. */
async function revealSelected() {
  await nextTick()
  const list = listEl.value
  const tile = list?.querySelector<HTMLElement>(`[data-kind="${props.modelValue}"]`)
  if (!list || !tile) return
  const listBox = list.getBoundingClientRect()
  const tileBox = tile.getBoundingClientRect()
  if (tileBox.top >= listBox.top && tileBox.bottom <= listBox.bottom) return
  list.scrollTop += tileBox.top - listBox.top - list.clientHeight / 2 + tile.clientHeight / 2
}

onMounted(revealSelected)
watch(() => props.modelValue, revealSelected)
</script>
