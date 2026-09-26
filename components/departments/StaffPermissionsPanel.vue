<template>
  <IosFormSection title="Permissions" :show-title="true" :grid="false" fixed>
    <p class="staff-permissions-panel__lede dash-drawer-hint">
      Choose what this person can see and change. View is required before manage options unlock.
    </p>

    <div class="staff-permissions-panel">
      <div
        v-for="module in modules"
        :key="module.key"
        class="staff-permissions-panel__module"
      >
        <p class="staff-permissions-panel__module-title">{{ module.title }}</p>
        <IosFormToggle
          :model-value="modelValue[module.key].view"
          label="View"
          :hint="module.viewHint"
          :disabled="disabled"
          @update:model-value="onViewToggle(module.key, $event)"
        />
        <template v-if="modelValue[module.key].view">
          <IosFormToggle
            :model-value="isManaging(modelValue[module.key])"
            label="Manage"
            :hint="module.manageHint"
            :disabled="disabled"
            @update:model-value="onManageToggle(module.key, $event)"
          />
          <div
            class="staff-permissions-panel__actions"
            role="group"
            :aria-label="`${module.title} actions`"
          >
            <Checkbox
              :model-value="modelValue[module.key].create"
              label="Create"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateModule(module.key, { create: $event })"
            />
            <Checkbox
              :model-value="modelValue[module.key].edit"
              label="Edit"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateModule(module.key, { edit: $event })"
            />
            <Checkbox
              :model-value="modelValue[module.key].delete"
              label="Delete"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateModule(module.key, { delete: $event })"
            />
          </div>
          <div v-if="module.key === 'receipts'" class="staff-permissions-panel__refund">
            <Checkbox
              :model-value="modelValue.receipts.refund"
              label="Refund & cancel outstanding orders"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__refund-control"
              @update:model-value="updateModule('receipts', { refund: $event })"
            />
            <p class="dash-drawer-hint">Separate from full edit access.</p>
          </div>
        </template>
      </div>
    </div>
  </IosFormSection>
</template>

<script setup lang="ts">
import { IosFormSection, IosFormToggle } from '~/components/ios/forms'
import Checkbox from '~/components/ui/Checkbox.vue'
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

type CrudModule = Exclude<PermissionModule, never>

const modules: Array<{
  key: CrudModule
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
    title: 'Customer buybacks',
    viewHint: 'Customer sell-ins and buyback history.',
    manageHint: 'Record and update customer buybacks.',
  },
  {
    key: 'sellerLoans',
    title: 'Stock loans',
    viewHint: 'Always on for staff. Devices loaned to sellers or retailers.',
    manageHint: 'Always on for staff. Create and update stock loans.',
  },
  {
    key: 'multiStoreSync',
    title: 'Multi-Store Sync',
    viewHint: 'Branch transfers and consolidated reports.',
    manageHint: 'Request, approve, and complete transfers.',
  },
]

function isManaging(module: ModulePermission): boolean {
  return module.create || module.edit || module.delete
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

function onViewToggle(key: PermissionModule, value: boolean) {
  if (value) {
    updateModule(key, { view: true })
    return
  }
  if (key === 'receipts') {
    updateModule(key, {
      view: false,
      create: false,
      edit: false,
      delete: false,
      refund: false,
    })
    return
  }
  updateModule(key, { view: false, create: false, edit: false, delete: false })
}

function onManageToggle(key: PermissionModule, value: boolean) {
  updateModule(key, { create: value, edit: value, delete: value })
}
</script>

<style scoped>
.staff-permissions-panel__lede {
  margin: 0 0 0.875rem;
}

.staff-permissions-panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.staff-permissions-panel__module {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.75rem;
  background: rgb(26 21 35 / 0.04);
}

:global(html.dark) .staff-permissions-panel__module {
  background: rgb(255 255 255 / 0.04);
}

.staff-permissions-panel__module-title {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--dash-overlay-muted);
}

.staff-permissions-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.125rem;
}

.staff-permissions-panel__action {
  margin: 0 !important;
  min-height: 2rem;
  align-items: center !important;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.72);
  gap: 0.5rem;
  color: var(--dash-overlay-ink);
}

.staff-permissions-panel__action :deep(.app-checkbox__box) {
  margin-top: 0;
}

.staff-permissions-panel__action :deep(.app-checkbox__label) {
  font-size: 0.75rem;
  font-weight: 550;
  color: var(--dash-overlay-ink) !important;
}

.staff-permissions-panel__action.app-checkbox--checked :deep(.app-checkbox__label) {
  color: var(--dash-overlay-ink) !important;
}

:global(html.dark) .staff-permissions-panel__action {
  background: rgb(255 255 255 / 0.1);
}

.staff-permissions-panel__refund {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-top: 0.125rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgb(26 21 35 / 0.06);
}

:global(html.dark) .staff-permissions-panel__refund {
  border-top-color: rgb(255 255 255 / 0.08);
}

.staff-permissions-panel__refund-control {
  margin: 0 !important;
  align-items: flex-start;
}

.staff-permissions-panel__refund-control :deep(.app-checkbox__label) {
  font-size: 0.8125rem;
  font-weight: 550;
  line-height: 1.35;
}

.staff-permissions-panel__refund > .dash-drawer-hint {
  margin: 0;
  padding-left: 1.625rem;
}
</style>
