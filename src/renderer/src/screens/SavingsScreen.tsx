import { useState, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { PiggyBank, Trash2, Layers, Clock, Pencil, AlertCircle } from 'lucide-react'
import type { TransactionsHook } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { fadeUp } from '../types/motion'
import type { Transaction, SavingsTab } from '../types/transaction'

class SavingsErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e } }
  componentDidCatch(e: Error, info: ErrorInfo) { console.error('SavingsScreen crash:', e, info) }
  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
          <AlertCircle size={28} className="text-expense" />
          <p className="text-sm font-semibold text-ink-primary">Savings screen error</p>
          <p className="text-xs text-ink-muted font-mono break-all max-w-md">
            {(this.state.error as Error).message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-2 px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-medium"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

interface Props {
  hook: TransactionsHook
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeFormat(timestamp: string, fmt: string, fallback = '—'): string {
  try {
    const d = parseISO(timestamp)
    return isValid(d) ? format(d, fmt) : fallback
  } catch {
    return fallback
  }
}

function groupByDate(
  transactions: Transaction[]
): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const key = safeFormat(t.timestamp, 'yyyy-MM-dd', 'unknown')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([date, items]) => ({ date, items }))
}

function formatGroupDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    if (!isValid(d)) return dateStr
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Today'
    if (format(d, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) return 'Yesterday'
    return format(d, 'EEEE, d MMMM')
  } catch {
    return dateStr
  }
}

function groupByCategory(
  transactions: Transaction[]
): { category: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const key = t.category || 'Uncategorized'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return Array.from(map.entries())
    .sort(([, a], [, b]) => {
      const sumA = a.reduce((s, t) => s + t.amount, 0)
      const sumB = b.reduce((s, t) => s + t.amount, 0)
      return sumB - sumA
    })
    .map(([category, items]) => ({ category, items }))
}

// ── Inline category editor ────────────────────────────────────────────────────

function CategoryEditor({
  current,
  categories,
  onSelect,
  onClose,
}: {
  current: string
  categories: string[]
  onSelect: (cat: string) => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden border-t border-savings/10"
    >
      <div className="px-4 py-2.5 bg-savings/3">
        <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide mb-2">
          Move to category
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                cat === (current || '')
                  ? 'bg-savings text-white shadow-sm'
                  : 'bg-savings/10 text-savings hover:bg-savings/20'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-full text-[11px] bg-surface-2 text-ink-muted hover:bg-surface-3 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Row component ─────────────────────────────────────────────────────────────

function SavingsRow({
  t,
  showCategoryBadge,
  categories,
  onDelete,
  onUpdateCategory,
  isLast,
}: {
  t: Transaction
  showCategoryBadge: boolean
  categories: string[]
  onDelete: (id: string) => void
  onUpdateCategory: (id: string, cat: string) => void
  isLast: boolean
}) {
  const [editingCat, setEditingCat] = useState(false)

  const handleSelect = (cat: string) => {
    onUpdateCategory(t.id, cat)
    setEditingCat(false)
  }

  const categoryLabel = t.category || 'No category'
  const isUncategorized = !t.category

  return (
    <div className={!isLast ? 'border-b border-savings/10' : ''}>
      {/* Main row */}
      <div className="group flex items-center justify-between px-4 py-3 hover:bg-savings/5 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-savings/10 flex items-center justify-center flex-shrink-0">
            <PiggyBank size={13} className="text-savings" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-ink-primary font-medium truncate">
                {t.description || (
                  <span className="text-ink-muted italic font-normal">No description</span>
                )}
              </p>
              {showCategoryBadge && (
                <button
                  onClick={() => setEditingCat((v) => !v)}
                  className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full transition-colors ${
                    isUncategorized
                      ? 'bg-surface-2 text-ink-muted hover:bg-surface-3 border border-dashed border-surface-3'
                      : 'bg-savings/10 text-savings hover:bg-savings/20'
                  }`}
                >
                  {categoryLabel}
                  <Pencil size={8} className="opacity-60" />
                </button>
              )}
              {!showCategoryBadge && (
                <button
                  onClick={() => setEditingCat((v) => !v)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-surface-2 text-ink-muted hover:bg-surface-3 transition-all"
                >
                  <Pencil size={8} />
                  Change
                </button>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {safeFormat(t.timestamp, 'd MMM yyyy · h:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span className="text-sm font-semibold text-savings tabular-nums">
            +{t.amount.toLocaleString()}
          </span>
          <button
            onClick={() => onDelete(t.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-muted hover:text-expense transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Inline category picker */}
      <AnimatePresence>
        {editingCat && (
          <CategoryEditor
            current={t.category}
            categories={categories}
            onSelect={handleSelect}
            onClose={() => setEditingCat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      {...fadeUp}
      className="flex flex-col items-center justify-center h-full gap-3 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-savings/10 flex items-center justify-center">
        <PiggyBank size={22} className="text-savings" />
      </div>
      <p className="text-sm font-medium text-ink-primary">No savings yet</p>
      <p className="text-xs text-ink-muted max-w-xs">
        Switch to "Log Entry" and select the Savings option to start tracking your savings goals.
      </p>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

function SavingsScreenInner({ hook }: Props) {
  const { getAllSavings, deleteTransaction, updateTransactionCategory, getTotals } = hook
  const { categories } = useCategories()
  const allSavings = getAllSavings()
  const { savings: totalSavings } = getTotals()

  const [activeTab, setActiveTab] = useState<SavingsTab>('chronological')

  const dateGroups = groupByDate(allSavings)
  const categoryGroups = groupByCategory(allSavings)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink-primary">Savings</h1>
            <p className="text-sm text-ink-muted mt-0.5">All-time savings log</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">
              Total Saved
            </p>
            <p className="text-2xl font-semibold text-savings tabular-nums mt-0.5">
              {totalSavings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Summary bar */}
        <div className="mt-4 flex items-center gap-3 p-3 bg-savings/5 border border-savings/10 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-savings/10 flex items-center justify-center flex-shrink-0">
            <PiggyBank size={16} className="text-savings" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-primary">
              {allSavings.length === 0
                ? 'No savings logged yet'
                : `${allSavings.length} saving${allSavings.length === 1 ? '' : 's'} across ${categoryGroups.length} categor${categoryGroups.length === 1 ? 'y' : 'ies'}`}
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              Click any category badge on a row to reassign or swap its category
            </p>
          </div>
        </div>

        {/* Tab bar */}
        {allSavings.length > 0 && (
          <div className="mt-4 flex gap-1 p-1 bg-surface-1 rounded-xl">
            <button
              onClick={() => setActiveTab('chronological')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === 'chronological'
                  ? 'bg-card text-ink-primary shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              <Clock size={12} />
              Chronological
            </button>
            <button
              onClick={() => setActiveTab('categorical')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                activeTab === 'categorical'
                  ? 'bg-card text-ink-primary shadow-sm'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              <Layers size={12} />
              By Category
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="px-8 flex-shrink-0">
        <div className="h-px bg-surface-3" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-4 min-h-0">
        {allSavings.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'chronological' ? (
              <motion.div
                key="chrono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {dateGroups.map(({ date, items }) => (
                  <div key={date} className="mb-5">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                        {formatGroupDate(date)}
                      </span>
                      <div className="flex-1 h-px bg-surface-3" />
                      <span className="text-xs text-savings font-semibold">
                        +{items.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-xl border border-savings/15 overflow-hidden">
                      {items.map((t, i) => (
                        <SavingsRow
                          key={t.id}
                          t={t}
                          showCategoryBadge={true}
                          categories={categories}
                          onDelete={deleteTransaction}
                          onUpdateCategory={updateTransactionCategory}
                          isLast={i === items.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="categorical"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* Category summary cards */}
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {categoryGroups.map(({ category, items }) => {
                    const total = items.reduce((s, t) => s + t.amount, 0)
                    const pct = totalSavings > 0 ? (total / totalSavings) * 100 : 0
                    return (
                      <div
                        key={category}
                        className="p-4 rounded-xl border border-savings/15 bg-savings/3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-savings/15 flex items-center justify-center">
                              <PiggyBank size={13} className="text-savings" />
                            </div>
                            <span className="text-sm font-semibold text-ink-primary">
                              {category}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-savings tabular-nums">
                              +{total.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-ink-muted mt-0.5">
                              {items.length} entr{items.length === 1 ? 'y' : 'ies'} · {pct.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-savings/10 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-savings"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Entries grouped by category */}
                {categoryGroups.map(({ category, items }) => (
                  <div key={category} className="mb-5">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                        {category}
                      </span>
                      <div className="flex-1 h-px bg-surface-3" />
                      <span className="text-xs text-savings font-semibold">
                        +{items.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="rounded-xl border border-savings/15 overflow-hidden">
                      {items.map((t, i) => (
                        <SavingsRow
                          key={t.id}
                          t={t}
                          showCategoryBadge={false}
                          categories={categories}
                          onDelete={deleteTransaction}
                          onUpdateCategory={updateTransactionCategory}
                          isLast={i === items.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default function SavingsScreen(props: Props) {
  return (
    <SavingsErrorBoundary>
      <SavingsScreenInner {...props} />
    </SavingsErrorBoundary>
  )
}
