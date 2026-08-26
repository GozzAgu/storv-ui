<template>
  <div class="ios-analytics-head">
    <slot name="period" />

    <div class="ios-analytics-actions" role="toolbar" aria-label="Report actions">
      <button
        type="button"
        class="ios-analytics-actions__btn"
        :disabled="isExporting"
        @click="showExportSheet = true"
      >
        {{ isExporting ? 'Exporting…' : 'Export' }}
      </button>
      <button
        type="button"
        class="ios-analytics-actions__btn ios-analytics-actions__btn--secondary"
        :disabled="isImporting"
        @click="onImportClick"
      >
        {{ isImporting ? 'Importing…' : 'Import' }}
      </button>
    </div>

    <input
      ref="importInputRef"
      type="file"
      accept=".xlsx,.xls,.csv"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      @change="onImportFile"
    />

    <DashboardNativeSheet
      v-model="showExportSheet"
      title="Export report"
      subtitle="Choose a format"
      variant="picker"
      aria-label="Export report format"
    >
      <IosGroupedSection>
        <IosNativeListRow
          title="PDF report"
          subtitle="Share or print"
          :show-chevron="false"
          @click="exportFormat('pdf')"
        />
        <IosNativeListRow
          title="Excel spreadsheet"
          subtitle="CSV-compatible workbook"
          :show-chevron="false"
          @click="exportFormat('excel')"
        />
      </IosGroupedSection>
    </DashboardNativeSheet>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DashboardNativeSheet from '~/components/dashboard/DashboardNativeSheet.vue'
import IosGroupedSection from '~/components/ios/IosGroupedSection.vue'
import IosNativeListRow from '~/components/ios/IosNativeListRow.vue'
import { useIosHaptics } from '~/composables/useIosHaptics'

defineProps<{
  isExporting?: boolean
}>()

const emit = defineEmits<{
  export: [format: 'pdf' | 'excel']
  import: [file: File]
}>()

const { impact } = useIosHaptics()

const showExportSheet = ref(false)
const isImporting = ref(false)
const importInputRef = ref<HTMLInputElement | null>(null)

function exportFormat(format: 'pdf' | 'excel') {
  void impact('light')
  showExportSheet.value = false
  emit('export', format)
}

function onImportClick() {
  void impact('light')
  importInputRef.value?.click()
}

function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  void impact('medium')
  isImporting.value = true
  try {
    emit('import', file)
  } finally {
    isImporting.value = false
  }
}
</script>
