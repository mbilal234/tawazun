import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense' | 'savings'
  category: string
  description: string
  timestamp: string
}

const CSV_HEADER = 'id,amount,type,category,description,timestamp\n'
const OLD_CSV_HEADER = 'id,amount,type,description,timestamp'
const DEFAULT_CATEGORIES = ['Savings Account', 'Mutual Funds', 'Other Investments']

function getFilePath(): string {
  return path.join(app.getPath('userData'), 'transactions.csv')
}

function getCategoriesFilePath(): string {
  return path.join(app.getPath('userData'), 'savings-categories.json')
}

function escapeField(val: string | number): string {
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function migrateIfNeeded(): void {
  const filePath = getFilePath()
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  const firstLine = content.split('\n')[0].trim()
  if (firstLine !== OLD_CSV_HEADER) return

  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  })

  const rows = result.data
    .map((row) =>
      [
        row['id'] ?? '',
        row['amount'] ?? '0',
        row['type'] ?? 'expense',
        '',
        row['description'] ?? '',
        row['timestamp'] ?? '',
      ]
        .map(escapeField)
        .join(',')
    )
    .join('\n')

  fs.writeFileSync(filePath, CSV_HEADER + (rows ? rows + '\n' : ''), 'utf8')
}

export function readAllTransactions(): Transaction[] {
  migrateIfNeeded()
  const filePath = getFilePath()
  if (!fs.existsSync(filePath)) return []

  const content = fs.readFileSync(filePath, 'utf8')
  if (!content.trim() || content.trim() === CSV_HEADER.trim()) return []

  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  })

  return result.data.map((row) => ({
    id: row['id'] ?? '',
    amount: Number(row['amount'] ?? 0),
    type: (row['type'] as 'income' | 'expense' | 'savings') ?? 'expense',
    category: row['category'] ?? '',
    description: row['description'] ?? '',
    timestamp: row['timestamp'] ?? '',
  }))
}

export function appendTransaction(
  transaction: Omit<Transaction, 'id'>
): Transaction {
  migrateIfNeeded()
  const filePath = getFilePath()
  const newTransaction: Transaction = {
    ...transaction,
    id: crypto.randomUUID(),
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, CSV_HEADER, 'utf8')
  }

  const row = [
    newTransaction.id,
    newTransaction.amount,
    newTransaction.type,
    newTransaction.category,
    newTransaction.description,
    newTransaction.timestamp,
  ]
    .map(escapeField)
    .join(',')

  fs.appendFileSync(filePath, row + '\n', 'utf8')
  return newTransaction
}

export function deleteTransactionById(id: string): boolean {
  const filePath = getFilePath()
  const all = readAllTransactions()
  const filtered = all.filter((t) => t.id !== id)
  if (filtered.length === all.length) return false

  const rows = filtered
    .map((t) =>
      [t.id, t.amount, t.type, t.category, t.description, t.timestamp]
        .map(escapeField)
        .join(',')
    )
    .join('\n')

  fs.writeFileSync(filePath, CSV_HEADER + (rows ? rows + '\n' : ''), 'utf8')
  return true
}

export function updateTransactionCategory(id: string, category: string): boolean {
  const all = readAllTransactions()
  const idx = all.findIndex((t) => t.id === id)
  if (idx === -1) return false

  all[idx] = { ...all[idx], category }

  const rows = all
    .map((t) =>
      [t.id, t.amount, t.type, t.category, t.description, t.timestamp]
        .map(escapeField)
        .join(',')
    )
    .join('\n')

  fs.writeFileSync(getFilePath(), CSV_HEADER + (rows ? rows + '\n' : ''), 'utf8')
  return true
}

export function readCategories(): string[] {
  const filePath = getCategoriesFilePath()
  if (!fs.existsSync(filePath)) return DEFAULT_CATEGORIES
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

export function writeCategories(categories: string[]): void {
  const filePath = getCategoriesFilePath()
  fs.writeFileSync(filePath, JSON.stringify(categories), 'utf8')
}

// ── Import helpers ────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

function parseImportDate(dateStr: string, timeStr?: string): string {
  const time = (timeStr ?? '12:00').trim()
  const d = (dateStr ?? '').trim()
  if (!d) return new Date().toISOString()

  // Already full ISO with T
  if (/^\d{4}-\d{2}-\d{2}T/.test(d)) {
    const dt = new Date(d)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }

  // ISO date only: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const dt = new Date(`${d}T${time}:00`)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }

  // DD MMM YYYY: "01 Jun 2025" or "1 Jun 2025"
  const dmy = d.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/)
  if (dmy) {
    const month = MONTH_MAP[dmy[2].toLowerCase().slice(0, 3)]
    if (month) {
      const mm = String(month).padStart(2, '0')
      const dd = dmy[1].padStart(2, '0')
      const dt = new Date(`${dmy[3]}-${mm}-${dd}T${time}:00`)
      if (!isNaN(dt.getTime())) return dt.toISOString()
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy2 = d.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy2) {
    const mm = dmy2[2].padStart(2, '0')
    const dd = dmy2[1].padStart(2, '0')
    const dt = new Date(`${dmy2[3]}-${mm}-${dd}T${time}:00`)
    if (!isNaN(dt.getTime())) return dt.toISOString()
  }

  // Fallback: native Date parse
  const native = new Date(d)
  if (!isNaN(native.getTime())) return native.toISOString()

  return new Date().toISOString()
}

function parseImportAmount(str: string): number {
  if (!str) return 0
  const cleaned = (str ?? '').replace(/[^\d.\-]/g, '')
  return Math.abs(parseFloat(cleaned) || 0)
}

function normalizeType(str: string): 'income' | 'expense' | 'savings' | null {
  const t = (str ?? '').toLowerCase().trim()
  if (!t) return null
  // savings MUST be checked first — 'savings' contains the substring 'in'
  // which would otherwise incorrectly match the income keyword list
  if (['saving', 'savings', 'invest', 'fd', 'mutual', 'transfer out'].some((k) => t.includes(k))) return 'savings'
  if (['income', 'credit', 'received', 'earning', 'salary', 'deposit'].some((k) => t.includes(k)) || t === 'in') return 'income'
  if (['expense', 'exp', 'debit', 'spend', 'spending', 'paid', 'payment', 'cost', 'charge', 'purchase', 'withdrawal', 'dr'].some((k) => t.includes(k))) return 'expense'
  return null
}

function findHeader(headers: string[], candidates: string[]): string | null {
  for (const candidate of candidates) {
    const match = headers.find((h) => h === candidate || h.includes(candidate) || candidate.includes(h))
    if (match) return match
  }
  return null
}

export function previewImport(filePath: string): {
  transactions: Transaction[]
  skipped: number
  format: string
} {
  const content = fs.readFileSync(filePath, 'utf8')

  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  const rows = result.data
  const headers = result.meta.fields ?? []

  const transactions: Transaction[] = []
  let skipped = 0
  let format = 'generic'

  const hasDate = headers.includes('date')
  const hasTime = headers.includes('time')
  const hasType = headers.includes('type')
  const hasAmount = headers.includes('amount')
  const hasId = headers.includes('id')
  const hasTimestamp = headers.includes('timestamp')

  if (hasId && hasTimestamp) {
    // App internal CSV format
    format = 'app-internal'
    for (const row of rows) {
      const amount = parseFloat(row['amount'] ?? '0')
      const type = normalizeType(row['type'] ?? '')
      const ts = row['timestamp'] ?? ''
      if (!type || amount <= 0 || !ts) { skipped++; continue }
      transactions.push({
        id: row['id'] || crypto.randomUUID(),
        amount,
        type,
        category: row['category'] ?? '',
        description: row['description'] ?? '',
        timestamp: ts,
      })
    }
  } else if (hasDate && hasType && hasAmount) {
    // App export format (Date, Time, Type, Category, Description, Amount)
    format = 'app-export'
    for (const row of rows) {
      const type = normalizeType(row['type'] ?? '')
      const amount = parseImportAmount(row['amount'] ?? '')
      if (!type || amount <= 0) { skipped++; continue }
      const timestamp = parseImportDate(row['date'] ?? '', hasTime ? row['time'] : undefined)
      transactions.push({
        id: crypto.randomUUID(),
        amount,
        type,
        category: row['category'] ?? '',
        description: row['description'] ?? '',
        timestamp,
      })
    }
  } else {
    // Generic CSV — detect columns
    format = 'generic'
    const dateCol   = findHeader(headers, ['date', 'dated', 'transaction date', 'trans date', 'value date', 'day'])
    const timeCol   = findHeader(headers, ['time'])
    const typeCol   = findHeader(headers, ['type', 'transaction type', 'trans type', 'nature'])
    const amtCol    = findHeader(headers, ['amount', 'value', 'sum', 'total', 'net amount'])
    const debitCol  = findHeader(headers, ['debit', 'dr', 'withdrawal', 'spent', 'expense'])
    const creditCol = findHeader(headers, ['credit', 'cr', 'received', 'income'])
    const descCol   = findHeader(headers, ['description', 'desc', 'narration', 'narration/description', 'details', 'memo', 'note', 'particulars', 'remarks', 'remarks/description'])
    const catCol    = findHeader(headers, ['category', 'cat'])

    for (const row of rows) {
      const dateStr  = dateCol  ? (row[dateCol]  ?? '') : ''
      const timeStr  = timeCol  ? (row[timeCol]  ?? '') : ''
      const typeStr  = typeCol  ? (row[typeCol]  ?? '') : ''
      const amtStr   = amtCol   ? (row[amtCol]   ?? '') : ''
      const debitStr = debitCol ? (row[debitCol] ?? '') : ''
      const creditStr = creditCol ? (row[creditCol] ?? '') : ''
      const desc = descCol ? (row[descCol] ?? '') : ''
      const cat  = catCol  ? (row[catCol]  ?? '') : ''

      let type: 'income' | 'expense' | 'savings' | null = null
      let amount = 0

      if (debitCol || creditCol) {
        const debit  = parseImportAmount(debitStr)
        const credit = parseImportAmount(creditStr)
        if (credit > 0 && debit === 0) { type = 'income';  amount = credit }
        else if (debit > 0)            { type = 'expense'; amount = debit  }
        else if (credit > 0)           { type = 'income';  amount = credit }
      } else if (amtStr) {
        amount = parseImportAmount(amtStr)
        const rawAmt = parseFloat((amtStr).replace(/[^\d.\-]/g, ''))
        if (typeStr) {
          type = normalizeType(typeStr)
          if (!type) type = rawAmt < 0 ? 'expense' : 'income'
        } else {
          type = rawAmt < 0 ? 'expense' : 'income'
        }
      }

      if (!type || amount <= 0) { skipped++; continue }

      const timestamp = parseImportDate(dateStr, timeStr || undefined)
      transactions.push({
        id: crypto.randomUUID(),
        amount,
        type,
        category: cat,
        description: desc,
        timestamp,
      })
    }
  }

  return { transactions, skipped, format }
}

function getLastImportFilePath(): string {
  return path.join(app.getPath('userData'), 'last-import-batch.json')
}

export function appendManyTransactions(txs: Transaction[]): number {
  migrateIfNeeded()
  const existing = readAllTransactions()
  const existingIds = new Set(existing.map((t) => t.id))

  const newTxs = txs.filter((t) => !existingIds.has(t.id))

  const filePath = getFilePath()
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, CSV_HEADER, 'utf8')
  }

  for (const t of newTxs) {
    const row = [t.id, t.amount, t.type, t.category, t.description, t.timestamp]
      .map(escapeField)
      .join(',')
    fs.appendFileSync(filePath, row + '\n', 'utf8')
  }

  // Save the IDs of this import batch so the user can delete them later
  fs.writeFileSync(
    getLastImportFilePath(),
    JSON.stringify(newTxs.map((t) => t.id)),
    'utf8'
  )

  return newTxs.length
}

export function getLastImportBatch(): string[] {
  const filePath = getLastImportFilePath()
  if (!fs.existsSync(filePath)) return []
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function deleteLastImportBatch(): number {
  const batchIds = new Set(getLastImportBatch())
  if (batchIds.size === 0) return 0

  const all = readAllTransactions()
  const remaining = all.filter((t) => !batchIds.has(t.id))
  const deleted = all.length - remaining.length

  const rows = remaining
    .map((t) =>
      [t.id, t.amount, t.type, t.category, t.description, t.timestamp]
        .map(escapeField)
        .join(',')
    )
    .join('\n')

  fs.writeFileSync(getFilePath(), CSV_HEADER + (rows ? rows + '\n' : ''), 'utf8')

  // Clear the batch file once deleted
  fs.unlinkSync(getLastImportFilePath())

  return deleted
}
