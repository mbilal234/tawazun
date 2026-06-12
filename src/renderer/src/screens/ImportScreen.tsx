import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle, AlertCircle, FileText, RefreshCw, Trash2 } from 'lucide-react'
import type { TransactionsHook } from '../hooks/useTransactions'
import type { Transaction } from '../types/transaction'
import { fadeUp } from '../types/motion'

interface Props {
  hook: TransactionsHook
}

interface ImportPreview {
  transactions: Transaction[]
  skipped: number
  format: string
  error?: string
}

const FORMAT_LABELS: Record<string, string> = {
  'app-export':   'Budget App Export',
  'app-internal': 'Budget App Internal',
  'generic':      'Generic CSV',
  'unknown':      'Unknown format',
}

const TYPE_COLORS: Record<string, string> = {
  income:  'text-income',
  expense: 'text-expense',
  savings: 'text-savings',
}
const TYPE_SIGNS: Record<string, string> = {
  income: '+', expense: '−', savings: '→',
}

function formatDate(ts: string): string {
  try { return format(parseISO(ts), 'd MMM yyyy') }
  catch { return ts }
}

export default function ImportScreen({ hook }: Props) {
  const { reloadTransactions } = hook

  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Last import batch state
  const [batchCount, setBatchCount] = useState(0)
  const [confirmDeleteBatch, setConfirmDeleteBatch] = useState(false)
  const [deletingBatch, setDeletingBatch] = useState(false)

  // Load the last import batch count on mount
  useEffect(() => {
    window.api.getLastImportBatch().then((ids) => setBatchCount(ids.length))
  }, [])

  const handlePickFile = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.previewImport()
      if (!result) { setLoading(false); return }
      if (result.error) {
        setError(`Could not read file: ${result.error}`)
        setLoading(false)
        return
      }
      setPreview(result)
    } catch {
      setError('Failed to read the file. Make sure it is a valid CSV.')
    }
    setLoading(false)
  }

  const handleImport = async () => {
    if (!preview || preview.transactions.length === 0) return
    setImporting(true)
    try {
      const count = await window.api.commitImport(preview.transactions)
      await reloadTransactions()
      setImportedCount(count)
      setBatchCount(count)
    } catch {
      setError('Import failed. Please try again.')
    }
    setImporting(false)
  }

  const handleDeleteBatch = async () => {
    setDeletingBatch(true)
    const deleted = await window.api.deleteLastImportBatch()
    await reloadTransactions()
    setBatchCount(0)
    setDeletingBatch(false)
    setConfirmDeleteBatch(false)
    // If we're on the success screen, go back to idle
    if (importedCount !== null) {
      setImportedCount(null)
      setPreview(null)
    }
    setError(null)
    // Brief confirmation message
    setBatchCount(-deleted) // use negative as "just deleted" signal — reset after a tick
    setTimeout(() => setBatchCount(0), 3000)
  }

  const handleReset = () => {
    setPreview(null)
    setImportedCount(null)
    setError(null)
    setConfirmDeleteBatch(false)
  }

  const previewRows = preview?.transactions.slice(0, 10) ?? []
  const justDeleted = batchCount < 0

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-lg font-semibold text-ink-primary">Import Data</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Load historical transactions from a CSV file
        </p>
      </div>

      <div className="px-8 flex-shrink-0">
        <div className="h-px bg-surface-3" />
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
        <AnimatePresence mode="wait">

          {/* ── Success state ── */}
          {importedCount !== null && (
            <motion.div key="success" {...fadeUp} className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-income/10 flex items-center justify-center">
                <CheckCircle size={32} className="text-income" />
              </div>
              <div>
                <p className="text-base font-semibold text-ink-primary">
                  {importedCount} transaction{importedCount !== 1 ? 's' : ''} imported
                </p>
                <p className="text-sm text-ink-muted mt-1">
                  {importedCount < (preview?.transactions.length ?? 0)
                    ? `${(preview?.transactions.length ?? 0) - importedCount} skipped (already existed)`
                    : 'All transactions added successfully'}
                </p>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-surface-3 text-ink-secondary hover:bg-surface-1 transition-colors"
                >
                  <RefreshCw size={13} />
                  Import Another File
                </button>
              </div>

              {/* Undo option right after import */}
              {batchCount > 0 && (
                <div className="w-full mt-2 p-4 bg-expense/5 border border-expense/15 rounded-xl text-left">
                  <AnimatePresence mode="wait">
                    {!confirmDeleteBatch ? (
                      <motion.div key="undo-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                        className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-ink-primary">Undo this import</p>
                          <p className="text-[11px] text-ink-muted mt-0.5">
                            Remove the {batchCount} transactions just imported
                          </p>
                        </div>
                        <button
                          onClick={() => setConfirmDeleteBatch(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-expense border border-expense/30 hover:bg-expense/10 transition-colors flex-shrink-0 ml-4"
                        >
                          <Trash2 size={12} />
                          Undo
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="undo-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                        className="space-y-3">
                        <p className="text-xs text-ink-primary">
                          Delete the <span className="font-semibold text-expense">{batchCount} imported transactions</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={handleDeleteBatch} disabled={deletingBatch}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-expense text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                            {deletingBatch ? 'Deleting…' : 'Yes, delete imported'}
                          </button>
                          <button onClick={() => setConfirmDeleteBatch(false)}
                            className="flex-1 py-2 rounded-lg text-xs font-medium border border-surface-3 text-ink-secondary hover:bg-surface-1 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Preview state ── */}
          {importedCount === null && preview !== null && (
            <motion.div key="preview" {...fadeUp} className="space-y-5">
              {/* Meta */}
              <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/10 rounded-xl">
                <FileText size={18} className="text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-primary">
                    {preview.transactions.length} valid transaction{preview.transactions.length !== 1 ? 's' : ''} found
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    Format: {FORMAT_LABELS[preview.format] ?? preview.format}
                    {preview.skipped > 0 && (
                      <span className="text-expense ml-2">
                        · {preview.skipped} row{preview.skipped !== 1 ? 's' : ''} skipped
                      </span>
                    )}
                  </p>
                </div>
                <button onClick={handleReset}
                  className="text-xs text-ink-muted hover:text-ink-primary transition-colors flex-shrink-0">
                  Change file
                </button>
              </div>

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">
                    Preview {previewRows.length < preview.transactions.length ? `(first ${previewRows.length} of ${preview.transactions.length})` : ''}
                  </p>
                  <div className="rounded-xl border border-surface-3 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-1 border-b border-surface-3">
                          <th className="text-left px-3 py-2 font-semibold text-ink-muted">Date</th>
                          <th className="text-left px-3 py-2 font-semibold text-ink-muted">Type</th>
                          <th className="text-left px-3 py-2 font-semibold text-ink-muted">Description</th>
                          <th className="text-right px-3 py-2 font-semibold text-ink-muted">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((t, i) => (
                          <tr key={t.id} className={`border-b border-surface-3 last:border-0 ${i % 2 === 0 ? '' : 'bg-surface-1/50'}`}>
                            <td className="px-3 py-2 text-ink-secondary whitespace-nowrap">{formatDate(t.timestamp)}</td>
                            <td className={`px-3 py-2 capitalize font-medium ${TYPE_COLORS[t.type]}`}>
                              {t.type}
                              {t.type === 'savings' && t.category && (
                                <span className="text-[10px] ml-1 text-ink-muted">({t.category})</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-ink-primary truncate max-w-[160px]">
                              {t.description || <span className="text-ink-muted italic">—</span>}
                            </td>
                            <td className={`px-3 py-2 text-right font-semibold tabular-nums whitespace-nowrap ${TYPE_COLORS[t.type]}`}>
                              {TYPE_SIGNS[t.type]}{t.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Warning for empty */}
              {preview.transactions.length === 0 && (
                <div className="flex items-start gap-3 p-4 bg-expense/5 border border-expense/15 rounded-xl">
                  <AlertCircle size={16} className="text-expense flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ink-primary">No valid transactions found</p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Make sure your CSV has date, type (income/expense/savings), and amount columns.
                      {preview.skipped > 0 && ` ${preview.skipped} rows were skipped due to missing or unrecognized data.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Import button */}
              {preview.transactions.length > 0 && (
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleImport} disabled={importing}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md">
                  {importing ? 'Importing…' : `Import ${preview.transactions.length} Transaction${preview.transactions.length !== 1 ? 's' : ''}`}
                </motion.button>
              )}
            </motion.div>
          )}

          {/* ── Idle state ── */}
          {importedCount === null && preview === null && (
            <motion.div key="idle" {...fadeUp} className="space-y-6">
              {/* Upload area */}
              <div className="flex flex-col items-center gap-5 py-10">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Upload size={28} className="text-accent" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-ink-primary">Choose a CSV file</p>
                  <p className="text-sm text-ink-muted mt-1">
                    Import transactions from a spreadsheet or another app
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handlePickFile} disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-dark transition-colors disabled:opacity-60 shadow-md">
                  {loading ? 'Reading file…' : 'Choose CSV File'}
                </motion.button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-expense/5 border border-expense/15 rounded-xl">
                  <AlertCircle size={16} className="text-expense flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-ink-primary">{error}</p>
                </div>
              )}

              {/* Supported formats info */}
              <div className="p-4 bg-surface-1 rounded-xl border border-surface-3">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
                  Supported formats
                </p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Budget App export', desc: 'CSV exported from this app (auto-detected)' },
                    { label: 'Generic CSV with columns', desc: 'date, type, amount, description — type can be income / expense / savings' },
                    { label: 'Bank statement CSV', desc: 'Separate debit and credit columns are supported' },
                  ].map(({ label, desc }) => (
                    <div key={label} className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-ink-primary">{label}</p>
                        <p className="text-[11px] text-ink-muted mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete last import batch */}
              {(batchCount > 0 || justDeleted) && (
                <div className={`p-4 rounded-xl border ${justDeleted ? 'bg-income/5 border-income/15' : 'bg-expense/5 border-expense/15'}`}>
                  <AnimatePresence mode="wait">
                    {justDeleted ? (
                      <motion.div key="deleted-ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-income flex-shrink-0" />
                        <p className="text-xs text-ink-primary">Imported transactions deleted successfully.</p>
                      </motion.div>
                    ) : !confirmDeleteBatch ? (
                      <motion.div key="batch-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                        className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-ink-primary">Delete last import</p>
                          <p className="text-[11px] text-ink-muted mt-0.5">
                            Remove the {batchCount} transactions from your last import
                          </p>
                        </div>
                        <button onClick={() => setConfirmDeleteBatch(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-expense border border-expense/30 hover:bg-expense/10 transition-colors flex-shrink-0 ml-4">
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="batch-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}
                        className="space-y-3">
                        <p className="text-xs text-ink-primary">
                          Delete the <span className="font-semibold text-expense">{batchCount} imported transactions</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button onClick={handleDeleteBatch} disabled={deletingBatch}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-expense text-white hover:opacity-90 transition-opacity disabled:opacity-60">
                            {deletingBatch ? 'Deleting…' : 'Yes, delete imported'}
                          </button>
                          <button onClick={() => setConfirmDeleteBatch(false)}
                            className="flex-1 py-2 rounded-lg text-xs font-medium border border-surface-3 text-ink-secondary hover:bg-surface-1 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
