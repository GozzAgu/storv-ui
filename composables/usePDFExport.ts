import { ref } from 'vue'

export const usePDFExport = () => {
  const isExporting = ref(false)

  const exportTableToPDF = async (
    title: string,
    headers: string[],
    rows: (string | number)[][],
    filename: string,
    additionalInfo?: { label: string; value: string }[]
  ) => {
    if (isExporting.value) return

    isExporting.value = true

    try {
      // Dynamically import jsPDF
      const { default: jsPDF } = await import('jspdf')

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 14
      const startY = 20
      let currentY = startY

      // Title
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(title, margin, currentY)
      currentY += 10

      // Additional info (if provided)
      if (additionalInfo && additionalInfo.length > 0) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        additionalInfo.forEach((info) => {
          doc.text(`${info.label}: ${info.value}`, margin, currentY)
          currentY += 6
        })
        currentY += 4
      }

      // Date and time
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      const now = new Date()
      doc.text(
        `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        margin,
        currentY
      )
      currentY += 8

      // Table setup
      const tableStartY = currentY
      const rowHeight = 8
      const colWidths: number[] = []
      const availableWidth = pageWidth - 2 * margin
      const numCols = headers.length

      // Calculate column widths based on content type
      // Define relative widths for common column types
      const getColumnWidth = (header: string, index: number): number => {
        const headerLower = header.toLowerCase()
        // Receipt #, ID, SKU - smaller
        if (headerLower.includes('receipt') || headerLower.includes('id') || headerLower.includes('sku')) {
          return 1.2
        }
        // Date - medium
        if (headerLower.includes('date')) {
          return 1.5
        }
        // Items, Quantity, Status - small
        if (headerLower.includes('item') || headerLower.includes('quantity') || headerLower.includes('status') || headerLower.includes('payment')) {
          return 1.2
        }
        // Total, Price, Amount - medium
        if (headerLower.includes('total') || headerLower.includes('price') || headerLower.includes('amount') || headerLower.includes('value')) {
          return 1.5
        }
        // Customer, Name, Description - larger
        if (headerLower.includes('customer') || headerLower.includes('name') || headerLower.includes('description') || headerLower.includes('created by')) {
          return 2.0
        }
        // Default
        return 1.5
      }

      // Calculate total relative width
      let totalRelativeWidth = 0
      headers.forEach((header, index) => {
        totalRelativeWidth += getColumnWidth(header, index)
      })

      // Convert to actual widths
      headers.forEach((header, index) => {
        const relativeWidth = getColumnWidth(header, index)
        colWidths.push((availableWidth * relativeWidth) / totalRelativeWidth)
      })

      // Draw table header
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0) // Ensure text color is black
      let xPos = margin
      headers.forEach((header, index) => {
        const colWidth = colWidths[index] || availableWidth / numCols
        // Fill background
        doc.setFillColor(240, 240, 240)
        doc.rect(xPos, currentY, colWidth, rowHeight, 'F')
        // Set text color again after fill
        doc.setTextColor(0, 0, 0)
        // Draw header text
        const headerText = String(header || '').trim()
        if (headerText) {
          doc.text(headerText, xPos + 2, currentY + 5, {
            maxWidth: colWidth - 4,
            align: 'left',
          })
        }
        xPos += colWidth
      })
      currentY += rowHeight

      // Draw table rows
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0) // Ensure text color is set before drawing rows
      rows.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (currentY + rowHeight > pageHeight - margin) {
          doc.addPage()
          currentY = startY

          // Redraw header on new page
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0) // Ensure text color is black
          xPos = margin
          headers.forEach((header, index) => {
            const colWidth = colWidths[index] || availableWidth / numCols
            // Fill background
            doc.setFillColor(240, 240, 240)
            doc.rect(xPos, currentY, colWidth, rowHeight, 'F')
            // Set text color again after fill
            doc.setTextColor(0, 0, 0)
            // Draw header text
            const headerText = String(header || '').trim()
            if (headerText) {
              doc.text(headerText, xPos + 2, currentY + 5, {
                maxWidth: colWidth - 4,
                align: 'left',
              })
            }
            xPos += colWidth
          })
          currentY += rowHeight
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(0, 0, 0) // Ensure text color is set after new page
        }

        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(255, 255, 255)
        } else {
          doc.setFillColor(250, 250, 250)
        }

        xPos = margin
        row.forEach((cell, colIndex) => {
          const colWidth = colWidths[colIndex] || availableWidth / numCols
          // Fill background first
          doc.rect(xPos, currentY, colWidth, rowHeight, 'F')
          
          // Get cell text and ensure it's a valid string
          let cellText = '-'
          if (cell !== null && cell !== undefined && cell !== '') {
            const cellStr = String(cell).trim()
            if (cellStr && cellStr !== 'undefined' && cellStr !== 'null' && cellStr !== '[object Object]') {
              cellText = cellStr
            }
          }
          
          // Set text color to black explicitly before drawing
          doc.setTextColor(0, 0, 0)
          doc.setDrawColor(0, 0, 0)
          
          // Draw text with error handling
          try {
            // Truncate if too long to prevent overflow
            const maxChars = Math.floor((colWidth - 4) / 1.5) // Approximate character width
            if (cellText.length > maxChars) {
              cellText = cellText.substring(0, maxChars - 3) + '...'
            }
            doc.text(cellText, xPos + 2, currentY + 5, {
              maxWidth: colWidth - 4,
              align: 'left',
            })
          } catch (error) {
            // Fallback: try with a shorter string
            try {
              const shortText = cellText.substring(0, 20)
              doc.text(shortText, xPos + 2, currentY + 5)
            } catch (e) {
              // Last resort: just draw a dash
              doc.text('-', xPos + 2, currentY + 5)
            }
          }
          
          xPos += colWidth
        })
        currentY += rowHeight
      })

      // Footer
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }

      // Save PDF
      doc.save(filename)
      return true
    } catch (error: any) {
      console.error('Error exporting to PDF:', error)
      throw new Error(error.message || 'Failed to export PDF')
    } finally {
      isExporting.value = false
    }
  }

  return {
    isExporting,
    exportTableToPDF,
  }
}
