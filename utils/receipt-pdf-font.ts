import type { jsPDF } from 'jspdf'

/** jsPDF built-in monospace — closest match to receipt UI without embedding custom fonts */
export const RECEIPT_PDF_FONT = 'courier'

export type ReceiptPdfFontStyle = 'normal' | 'bold' | 'italic' | 'bolditalic'

export function setReceiptPdfFont(pdf: jsPDF, style: ReceiptPdfFontStyle = 'normal'): void {
  pdf.setFont(RECEIPT_PDF_FONT, style)
}
