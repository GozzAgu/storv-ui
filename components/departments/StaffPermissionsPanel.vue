<template>
  <SFormSection title="Permissions" :show-title="true">
    <p class="s-field__hint">Choose how much of each area this person can use.</p>

    <ul class="s-perm">
      <li v-for="module in modules" :key="module.key" class="s-perm__module">
        <div class="s-perm__head">
          <span :id="`${baseId}-${module.key}`" class="s-perm__title">{{ module.title }}</span>
          <SBadge v-if="module.key === 'sellerLoans'" size="sm">Always on</SBadge>
        </div>
        <p class="s-perm__hint">{{ levelHint(module) }}</p>

        <div
          v-if="module.key !== 'sellerLoans'"
          class="s-tabs s-tabs--block s-perm__levels"
          role="radiogroup"
          :aria-labelledby="`${baseId}-${module.key}`"
          @keydown="onLevelKeydown(module.key, $event)"
        >
          <button
            v-for="option in LEVELS"
            :key="option.value"
            type="button"
            role="radio"
            class="s-tabs__tab"
            :data-level="option.value"
            :aria-checked="levelOf(module.key) === option.value"
            :tabindex="levelOf(module.key) === option.value ? 0 : -1"
            :disabled="disabled"
            @click="setLevel(module.key, option.value)"
          >
            {{ option.label }}
          </button>
        </div>

        <div
          v-if="showChips(module.key)"
          class="s-perm__chips"
          role="group"
          :aria-label="`${module.title} actions`"
        >
          <template v-if="module.key !== 'sellerLoans' && levelOf(module.key) === 'custom'">
            <button
              v-for="action in CRUD_ACTIONS"
              :key="action.key"
              type="button"
              class="s-perm__chip"
              :aria-pressed="modelValue[module.key][action.key]"
              :disabled="disabled"
              @click="updateModule(module.key, { [action.key]: !modelValue[module.key][action.key] })"
            >
              <Check v-if="modelValue[module.key][action.key]" :size="14" :stroke-width="2.5" aria-hidden="true" />
              {{ action.label }}
            </button>
          </template>
          <button
            v-if="module.key === 'sellerLoans'"
            type="button"
            class="s-perm__chip"
            :aria-pressed="modelValue.sellerLoans.delete"
            :disabled="disabled"
            @click="updateModule('sellerLoans', { delete: !modelValue.sellerLoans.delete })"
          >
            <Check v-if="modelValue.sellerLoans.delete" :size="14" :stroke-width="2.5" aria-hidden="true" />
            Can delete
          </button>
          <button
            v-if="module.key === 'receipts'"
            type="button"
            class="s-perm__chip"
            :aria-pressed="modelValue.receipts.refund"
            :disabled="disabled"
            @click="updateModule('receipts', { refund: !modelValue.receipts.refund })"
          >
            <Check v-if="modelValue.receipts.refund" :size="14" :stroke-width="2.5" aria-hidden="true" />
            Refund &amp; cancel orders
          </button>
        </div>
      </li>
    </ul>
  </SFormSection>
</template>

<script setup lang="ts">
import { reactive, useId } from 'vue'
import { Check } from '@lucide/vue'
import SBadge from '~/components/s/SBadge.vue'
import SFormSection from '~/components/s/SFormSection.vue'
import type {
  ModulePermission,
  PermissionModule,
  ReceiptsPermission,
  StaffPermissions,
} from '~/types/staff-permissions'

interface Props {
  modelValue: StaffPermissions
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { disabled: false })
const emit = defineEmits<{ 'update:modelValue': [StaffPermissions] }>()

type Level = 'none' | 'view' | 'manage' | 'custom'

const LEVELS: Array<{ value: Level; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'view', label: 'View' },
  { value: 'manage', label: 'Manage' },
  { value: 'custom', label: 'Custom' },
]

const CRUD_ACTIONS: Array<{ key: 'create' | 'edit' | 'delete'; label: string }> = [
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
]

const baseId = useId()

const modules: Array<{
  key: PermissionModule
  title: string
  viewHint: string
  manageHint: string
}> = [
  {
    key: 'products',
    title: 'Inventory',
    viewHint: 'Categories, items, quantities, and prices.',
    manageHint: 'Add, edit, and delete inventory.',
  },
  {
    key: 'receipts',
    title: 'Receipts',
    viewHint: 'Orders and transactions.',
    manageHint: 'Create and fully edit receipts.',
  },
  {
    key: 'leads',
    title: 'Sales leads',
    viewHint: 'Enquiry pipeline before a sale.',
    manageHint: 'Add, edit, and delete sales leads.',
  },
  {
    key: 'buybacks',
    title: 'Trade-ins',
    viewHint: 'Items bought from customers, and trade-in history.',
    manageHint: 'Record and update trade-ins.',
  },
  {
    key: 'sellerLoans',
    title: 'Stock loans',
    viewHint: 'Staff can always view, create and update stock loans.',
    manageHint: 'Staff can always view, create and update stock loans.',
  },
  {
    key: 'multiStoreSync',
    title: 'Multi-store sync',
    viewHint: 'Branch transfers and consolidated reports.',
    manageHint: 'Request, approve, and complete transfers.',
  },
]

/** Modules where the user picked Custom but hasn't granted a mix of actions yet. */
const customOpen = reactive<Partial<Record<PermissionModule, boolean>>>({})

function levelOf(key: PermissionModule): Level {
  const m = props.modelValue[key]
  if (!m.view) return 'none'
  if (customOpen[key]) return 'custom'
  if (!m.create && !m.edit && !m.delete) return 'view'
  if (m.create && m.edit && m.delete) return 'manage'
  return 'custom'
}

function showChips(key: PermissionModule): boolean {
  if (key === 'sellerLoans') return true
  if (key === 'receipts') return props.modelValue.receipts.view
  return levelOf(key) === 'custom'
}

function levelHint(module: (typeof modules)[number]): string {
  if (module.key === 'sellerLoans') return module.viewHint
  const level = levelOf(module.key)
  if (level === 'none') return 'No access.'
  if (level === 'view') return module.viewHint
  if (level === 'manage') return module.manageHint
  return 'Pick the actions this person can take.'
}

function updateModule(
  key: PermissionModule,
  patch: Partial<ModulePermission> | Partial<ReceiptsPermission>
) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: { ...props.modelValue[key], ...patch },
  })
}

function setLevel(key: PermissionModule, level: Level) {
  customOpen[key] = level === 'custom'
  if (level === 'none') {
    updateModule(
      key,
      key === 'receipts'
        ? { view: false, create: false, edit: false, delete: false, refund: false }
        : { view: false, create: false, edit: false, delete: false }
    )
  } else if (level === 'view') {
    updateModule(key, { view: true, create: false, edit: false, delete: false })
  } else if (level === 'manage') {
    updateModule(key, { view: true, create: true, edit: true, delete: true })
  } else {
    updateModule(key, { view: true })
  }
}

function onLevelKeydown(key: PermissionModule, event: KeyboardEvent) {
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
  const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
  if (!forward && !back) return
  event.preventDefault()
  const index = LEVELS.findIndex((l) => l.value === levelOf(key))
  const next = LEVELS[(index + (forward ? 1 : -1) + LEVELS.length) % LEVELS.length]!.value
  setLevel(key, next)
  const group = event.currentTarget as HTMLElement
  requestAnimationFrame(() => group.querySelector<HTMLElement>(`[data-level="${next}"]`)?.focus())
}
</script>
