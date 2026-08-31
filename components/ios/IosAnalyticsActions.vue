<template>
  <div class="ios-analytics-head">
    <div class="ios-analytics-period-card">
      <slot name="period" />
    </div>

    <div class="ios-analytics-actions" role="toolbar" aria-label="Report actions">
      <Button
        type="button"
        variant="outline"
        size="sm"
        extra-class="ios-analytics-actions__btn"
        :disabled="isExporting"
        @click="showExportSheet = true"
      >
        {{ isExporting ? 'Exporting…' : 'Export' }}
      </Button>
    </div>

    <IosDrawer
      v-model="showExportSheet"
      title="Export report"
      subtitle="Choose a format"
      variant="menu"
      footer-variant="menu"
      body-padding="p-0"
      aria-label="Export report format"
    >
      <div class="ios-drawer-menu">
        <section class="ios-drawer-menu__section">
          <div class="ios-drawer-menu__group">
            <ul class="ios-drawer-menu__list">
              <li>
                <button
                  type="button"
                  class="ios-drawer-menu__row"
                  @click="exportFormat('pdf')"
                >
                  <span class="ios-drawer-menu__label">PDF report</span>
                  <span class="ios-drawer-menu__meta">Share or print</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  class="ios-drawer-menu__row"
                  @click="exportFormat('excel')"
                >
                  <span class="ios-drawer-menu__label">Excel spreadsheet</span>
                  <span class="ios-drawer-menu__meta">CSV-compatible workbook</span>
                </button>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </IosDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Button from '~/components/ui/Button.vue'
import IosDrawer from '~/components/ios/IosDrawer.vue'
import { useIosHaptics } from '~/composables/useIosHaptics'

defineProps<{
  isExporting?: boolean
}>()

const emit = defineEmits<{
  export: [format: 'pdf' | 'excel']
}>()

const { impact } = useIosHaptics()

const showExportSheet = ref(false)

function exportFormat(format: 'pdf' | 'excel') {
  void impact('light')
  showExportSheet.value = false
  emit('export', format)
}
</script>
