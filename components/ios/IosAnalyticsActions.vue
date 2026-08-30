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
    </div>

    <IosDrawer
      v-model="showExportSheet"
      title="Export report"
      subtitle="Choose a format"
      variant="assistant"
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
    </IosDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IosDrawer from '~/components/ios/IosDrawer.vue'
import IosGroupedSection from '~/components/ios/IosGroupedSection.vue'
import IosNativeListRow from '~/components/ios/IosNativeListRow.vue'
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
