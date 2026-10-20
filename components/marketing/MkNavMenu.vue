<template>
  <div
    ref="rootEl"
    class="mkm"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focusout="onFocusOut"
  >
    <button
      ref="triggerEl"
      type="button"
      class="mk-nav-link mkm__trigger"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="onClick"
    >
      {{ label }}
      <ChevronDown :size="14" class="mkm__chevron" aria-hidden="true" />
    </button>

    <Transition name="mkm">
      <div v-if="open" :id="panelId" class="mkm__panel">
        <div class="mkm__main">
          <NuxtLink :to="heading.to" class="mkm__heading" @click="close()">
            {{ heading.label }}
            <ArrowRight :size="20" aria-hidden="true" />
          </NuxtLink>
          <p class="mkm__lede">{{ lede }}</p>
          <ul class="mkm__grid">
            <li v-for="item in items" :key="item.title">
              <NuxtLink
                :to="item.to"
                class="mkm__item"
                :class="item.tint ? `mk-tint--${item.tint}` : undefined"
                @click="close()"
              >
                <component
                  :is="item.icon"
                  :size="20"
                  :stroke-width="1.75"
                  class="mkm__icon"
                  aria-hidden="true"
                />
                <span class="mkm__title">{{ item.title }}</span>
                <span class="mkm__text">{{ item.text }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="mkm__side">
          <p class="mkm__side-heading">{{ side.heading }}</p>
          <p class="mkm__lede">{{ side.lede }}</p>
          <ul class="mkm__list">
            <li v-for="item in side.items" :key="item.label">
              <NuxtLink
                v-if="item.to"
                :to="item.to"
                class="mkm__list-item mkm__list-link"
                @click="close()"
              >
                <component :is="item.icon" :size="18" :stroke-width="1.75" aria-hidden="true" />
                {{ item.label }}
              </NuxtLink>
              <span v-else class="mkm__list-item">
                <component :is="item.icon" :size="18" :stroke-width="1.75" aria-hidden="true" />
                {{ item.label }}
              </span>
            </li>
          </ul>
          <NuxtLink v-if="side.link" :to="side.link.to" class="mkm__demo" @click="close()">
            {{ side.link.label }}
            <ArrowRight :size="16" aria-hidden="true" />
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch, type Component } from 'vue'
import { ArrowRight, ChevronDown } from '@lucide/vue'

export interface MkNavMenuItem {
  icon: Component
  title: string
  text: string
  to: string
  /** Area tint for the icon, e.g. 'sand' (see `.mk-tint--*`). */
  tint?: string
}

export interface MkNavMenuSideItem {
  icon: Component
  label: string
  to?: string
}

defineProps<{
  label: string
  heading: { label: string; to: string }
  lede: string
  items: MkNavMenuItem[]
  side: {
    heading: string
    lede: string
    items: MkNavMenuSideItem[]
    link?: { label: string; to: string }
  }
}>()

const route = useRoute()
const panelId = useId()
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
let leaveTimer: ReturnType<typeof setTimeout> | undefined
let hoverOpenedAt = 0

function close(returnFocus = false) {
  if (!open.value) return
  open.value = false
  if (returnFocus) triggerEl.value?.focus()
}

/* Hover opens it with a mouse; touch and keyboard use the button */
function onEnter(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  clearTimeout(leaveTimer)
  if (!open.value) hoverOpenedAt = Date.now()
  open.value = true
}

/* A click right after hover opened the menu means "open", not "close it again" */
function onClick() {
  if (open.value && Date.now() - hoverOpenedAt < 600) return
  open.value = !open.value
}

function onLeave(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  clearTimeout(leaveTimer)
  leaveTimer = setTimeout(() => (open.value = false), 150)
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null
  if (next && rootEl.value?.contains(next)) return
  open.value = false
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  const hadFocus = rootEl.value?.contains(document.activeElement)
  close(!!hadFocus)
}

function onDocumentPointerdown(event: PointerEvent) {
  if (!rootEl.value?.contains(event.target as Node)) close()
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('keydown', onDocumentKeydown)
    document.addEventListener('pointerdown', onDocumentPointerdown)
  } else {
    document.removeEventListener('keydown', onDocumentKeydown)
    document.removeEventListener('pointerdown', onDocumentPointerdown)
  }
})

watch(
  () => route.fullPath,
  () => (open.value = false)
)

onBeforeUnmount(() => {
  clearTimeout(leaveTimer)
  document.removeEventListener('keydown', onDocumentKeydown)
  document.removeEventListener('pointerdown', onDocumentPointerdown)
})
</script>
