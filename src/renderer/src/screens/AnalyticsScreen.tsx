import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileDown, FileText } from 'lucide-react'
import PeriodSelector from '../components/analytics/PeriodSelector'
import ViewSwitcher from '../components/analytics/ViewSwitcher'
import ListView from '../components/analytics/ListView'
import GraphView from '../components/analytics/GraphView'
import CalendarView from '../components/analytics/CalendarView'
import type { Period, ViewMode } from '../types/transaction'
import type { TransactionsHook } from '../hooks/useTransactions'
import { useWeekStart } from '../hooks/useWeekStart'
import { useExport } from '../hooks/useExport'
import { fadeIn } from '../types/motion'

interface Props {
  hook: TransactionsHook
}

export default function AnalyticsScreen({ hook }: Props) {
  const { getFiltered, deleteTransaction } = hook
  const { exportCsv, exportPdf } = useExport()
  const { weekStart } = useWeekStart()

  const [period, setPeriod] = useState<Period>('monthly')
  const [offset, setOffset] = useState(0)
  const [view, setView] = useState<ViewMode>('list')
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)

  const filtered = getFiltered(period, offset, weekStart)
  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpense

  const handleExportCsv = async () => {
    setExporting('csv')
    await exportCsv(filtered, period, offset)
    setExporting(null)
  }

  const handleExportPdf = async () => {
    setExporting('pdf')
    await exportPdf(filtered, period, offset)
    setExporting(null)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-semibold text-ink-primary">Analytics</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              disabled={filtered.length === 0 || exporting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-secondary border border-surface-3 hover:bg-surface-1 hover:border-surface-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText size={13} />
              {exporting === 'csv' ? 'Exporting…' : 'CSV'}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={filtered.length === 0 || exporting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-accent hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileDown size={13} />
              {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
            </button>
          </div>
        </div>

        {/* Period + View controls */}
        <div className="flex items-end justify-between mt-4 flex-wrap gap-3">
          <PeriodSelector
            period={period}
            offset={offset}
            weekStart={weekStart}
            onPeriodChange={setPeriod}
            onOffsetChange={setOffset}
          />
          <ViewSwitcher view={view} onChange={setView} />
        </div>

        {/* Summary chips */}
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-income/10 rounded-lg">
            <span className="text-xs text-ink-muted font-medium">Income</span>
            <span className="text-sm font-semibold text-income">
              +{totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-expense/10 rounded-lg">
            <span className="text-xs text-ink-muted font-medium">Expense</span>
            <span className="text-sm font-semibold text-expense">
              −{totalExpense.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg">
            <span className="text-xs text-ink-muted font-medium">Net</span>
            <span
              className={`text-sm font-semibold ${
                net >= 0 ? 'text-accent' : 'text-expense'
              }`}
            >
              {net >= 0 ? '+' : '−'}
              {Math.abs(net).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="px-8 flex-shrink-0">
        <div className="h-px bg-surface-3" />
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={view} className="h-full" {...fadeIn}>
            {view === 'list' && (
              <ListView
                transactions={filtered}
                onDelete={deleteTransaction}
              />
            )}
            {view === 'graph' && (
              <GraphView
                transactions={filtered}
                period={period}
                offset={offset}
                weekStart={weekStart}
              />
            )}
            {view === 'calendar' && (
              <CalendarView
                transactions={filtered}
                period={period}
                offset={offset}
                weekStart={weekStart}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
