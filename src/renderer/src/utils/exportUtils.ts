import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'
import { format, parseISO } from 'date-fns'
import type { Transaction } from '../types/transaction'

// ── Theme-aware color helpers ─────────────────────────────────────────────────

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function rgb(varName: string): [number, number, number] {
  const parts = cssVar(varName).split(/\s+/).map(Number)
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
}

// ── CSV export ────────────────────────────────────────────────────────────────

export function generateCsv(transactions: Transaction[]): string {
  const rows = transactions.map((t) => ({
    Date:        format(parseISO(t.timestamp), 'yyyy-MM-dd'),
    Time:        format(parseISO(t.timestamp), 'HH:mm'),
    Type:        t.type.charAt(0).toUpperCase() + t.type.slice(1),
    Category:    t.type === 'savings' ? (t.category || 'Uncategorized') : '',
    Description: t.description,
    Amount:
      t.type === 'income' ? t.amount : t.type === 'savings' ? t.amount : -t.amount,
  }))
  return Papa.unparse(rows, { header: true })
}

// ── PDF export ────────────────────────────────────────────────────────────────

export function generatePdfDataUri(
  transactions: Transaction[],
  periodLabel: string
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const inkPrimary   = rgb('--color-ink-primary')
  const inkMuted     = rgb('--color-ink-muted')
  const accentRgb    = rgb('--color-accent')
  const incomeRgb    = rgb('--color-income')
  const expenseRgb   = rgb('--color-expense')
  const savingsRgb   = rgb('--color-savings')
  const surface0     = rgb('--color-surface-0')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...inkPrimary)
  doc.text('Budget Report', 14, 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...inkMuted)
  doc.text(`Period: ${periodLabel}`, 14, 31)
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, 37)

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const totalSavings = transactions
    .filter((t) => t.type === 'savings')
    .reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpense

  const typeLabel = (type: string) => type.charAt(0).toUpperCase() + type.slice(1)
  const typeSign  = (type: string) =>
    type === 'income' ? '+' : type === 'savings' ? '→' : '−'

  const rows = transactions.map((t) => [
    format(parseISO(t.timestamp), 'dd MMM yyyy'),
    format(parseISO(t.timestamp), 'HH:mm'),
    typeLabel(t.type),
    t.type === 'savings' ? (t.category || 'Uncategorized') : '—',
    t.description || '—',
    `${typeSign(t.type)} ${t.amount.toLocaleString()}`,
  ])

  autoTable(doc, {
    head: [['Date', 'Time', 'Type', 'Category', 'Description', 'Amount']],
    body: rows,
    startY: 44,
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: accentRgb, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: surface0 },
    columnStyles: { 5: { halign: 'right' } },
  })

  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  doc.setFontSize(9)
  doc.setTextColor(...incomeRgb)
  doc.text(`Total Income: +${totalIncome.toLocaleString()}`, 14, finalY)
  doc.setTextColor(...expenseRgb)
  doc.text(`Total Expense: −${totalExpense.toLocaleString()}`, 14, finalY + 6)
  if (totalSavings > 0) {
    doc.setTextColor(...savingsRgb)
    doc.text(`Total Savings: →${totalSavings.toLocaleString()}`, 14, finalY + 12)
  }

  const netY = totalSavings > 0 ? finalY + 20 : finalY + 14
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...(net >= 0 ? incomeRgb : expenseRgb))
  doc.text(
    `Net (Income − Expense): ${net >= 0 ? '+' : '−'}${Math.abs(net).toLocaleString()}`,
    14,
    netY
  )

  return doc.output('datauristring')
}
