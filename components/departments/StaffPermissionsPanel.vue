<template>
  <IosFormSection title="Permissions" :show-title="true" :grid="false" fixed>
    <p class="staff-permissions-panel__lede dash-drawer-hint">
      Choose what this person can see and change. View is required before manage options unlock.
    </p>

    <div class="staff-permissions-panel">
      <div class="staff-permissions-panel__module">
        <p class="staff-permissions-panel__module-title">Inventory</p>
        <IosFormToggle
          :model-value="modelValue.products.view"
          label="View"
          hint="Categories, items, quantities, and prices."
          :disabled="disabled"
          @update:model-value="onProductsViewToggle"
        />
        <template v-if="modelValue.products.view">
          <IosFormToggle
            :model-value="isManaging(modelValue.products)"
            label="Manage"
            hint="Add, edit, and delete inventory."
            :disabled="disabled"
            @update:model-value="onProductsManageToggle"
          />
          <div class="staff-permissions-panel__actions" role="group" aria-label="Inventory actions">
            <Checkbox
              :model-value="modelValue.products.create"
              label="Create"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateProducts({ create: $event })"
            />
            <Checkbox
              :model-value="modelValue.products.edit"
              label="Edit"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateProducts({ edit: $event })"
            />
            <Checkbox
              :model-value="modelValue.products.delete"
              label="Delete"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateProducts({ delete: $event })"
            />
          </div>
        </template>
      </div>

      <div class="staff-permissions-panel__module">
        <p class="staff-permissions-panel__module-title">Receipts</p>
        <IosFormToggle
          :model-value="modelValue.receipts.view"
          label="View"
          hint="Orders and transactions."
          :disabled="disabled"
          @update:model-value="onReceiptsViewToggle"
        />
        <template v-if="modelValue.receipts.view">
          <IosFormToggle
            :model-value="isManaging(modelValue.receipts)"
            label="Manage"
            hint="Create and fully edit receipts."
            :disabled="disabled"
            @update:model-value="onReceiptsManageToggle"
          />
          <div class="staff-permissions-panel__actions" role="group" aria-label="Receipt actions">
            <Checkbox
              :model-value="modelValue.receipts.create"
              label="Create"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateReceipts({ create: $event })"
            />
            <Checkbox
              :model-value="modelValue.receipts.edit"
              label="Edit"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateReceipts({ edit: $event })"
            />
            <Checkbox
              :model-value="modelValue.receipts.delete"
              label="Delete"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__action"
              @update:model-value="updateReceipts({ delete: $event })"
            />
          </div>
          <div class="staff-permissions-panel__refund">
            <Checkbox
              :model-value="modelValue.receipts.refund"
              label="Refund & cancel outstanding orders"
              size="sm"
              :disabled="disabled"
              wrapper-class="staff-permissions-panel__refund-control"
              @update:model-value="updateReceipts({ refund: $event })"
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
import type { ModulePermission, ReceiptsPermission, StaffPermissions } from '~/types/staff-permissions'

interface Props {
  modelValue: StaffPermissions
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { disabled: false })
const emit = defineEmits<{ 'update:modelValue': [StaffPermissions] }>()

function isManaging(module: ModulePermission): boolean {
  return module.create || module.edit || module.delete
}

function updateProducts(patch: Partial<ModulePermission>) {
  emit('update:modelValue', {
    ...props.modelValue,
    products: { ...props.modelValue.products, ...patch },
  })
}

function updateReceipts(patch: Partial<ReceiptsPermission>) {
  emit('update:modelValue', {
    ...props.modelValue,
    receipts: { ...props.modelValue.receipts, ...patch },
  })
}

function onProductsViewToggle(value: boolean) {
  updateProducts(
    value ? { view: true } : { view: false, create: false, edit: false, delete: false }
  )
}

function onReceiptsViewToggle(value: boolean) {
  updateReceipts(
    value
      ? { view: true }
      : { view: false, create: false, edit: false, delete: false, refund: false }
  )
}

function onProductsManageToggle(value: boolean) {
  updateProducts({ create: value, edit: value, delete: value })
}

function onReceiptsManageToggle(value: boolean) {
  updateReceipts({ create: value, edit: value, delete: value })
}
</script>

<style scoped>
.staff-permissions-panel__lede {
  margin: 0 0 0.875rem;
}

.staff-permissions-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.staff-permissions-panel__module {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.875rem;
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
