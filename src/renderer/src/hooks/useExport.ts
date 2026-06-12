import { useCallback } from 'react'
import { format, addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek } from 'date-fns'
import type { Transaction, Period } from '../types/transaction'
import { generateCsv, generatePdfDataUri } from '../utils/exportUtils'

function getPeriodLabel(period: Period, offset: number): string {
  const now = new Date()
  switch (period) {
    case 'daily':
      return format(addDays(now, offset), 'dd-MMM-yyyy')
    case 'weekly': {
      const d = addWeeks(now, offset)
      const start = startOfWeek(d, { weekStartsOn: 1 })
      const end = endOfWeek(d, { weekStartsOn: 1 })
      return `${format(start, 'dd MMM')} – ${format(end, 'dd MMM yyyy')}`
    }
    case 'monthly':
      return format(addMonths(now, offset), 'MMMM-yyyy')
    case 'yearly':
      return format(addYears(now, offset), 'yyyy')
  }
}

export function useExport() {
  const exportCsv = useCallback(
    async (transactions: Transaction[], period: Period, offset: number) => {
      const label = getPeriodLabel(period, offset)
      const csv = generateCsv(transactions)
      const filename = `budget-${label.replace(/\s+/g, '-').toLowerCase()}.csv`
      return window.api.saveCsv(csv, filename)
    },
    []
  )

  const exportPdf = useCallback(
    async (transactions: Transaction[], period: Period, offset: number) => {
      const label = getPeriodLabel(period, offset)
      const dataUri = generatePdfDataUri(transactions, label)
      const filename = `budget-${label.replace(/\s+/g, '-').toLowerCase()}.pdf`
      return window.api.savePdf(dataUri, filename)
    },
    []
  )

  return { exportCsv, exportPdf }
}
