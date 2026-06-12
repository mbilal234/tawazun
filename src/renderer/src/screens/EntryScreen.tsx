import { useState, useEffect, useRef } from 'react'
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Trash2, Plus, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import AmountInput from '../components/entry/AmountInput'
import TypeToggle from '../components/entry/TypeToggle'
import DescriptionInput from '../components/entry/DescriptionInput'
import type { TransactionsHook } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useWeekStart, WEEK_DAYS, WEEK_DAY_LABELS } from '../hooks/useWeekStart'
import type { WeekDay } from '../hooks/useWeekStart'
import { fadeUp } from '../types/motion'

interface Props {
  hook: TransactionsHook
}

type EntryMode = 'daily' | 'weekly'

const TYPE_COLORS: Record<string, string> = {
  income:  'text-income',
  expense: 'text-expense',
  savings: 'text-savings',
}

const TYPE_SIGNS: Record<string, string> = {
  income:  '+',
  expense: '−',
  savings: '→',
}

export default function EntryScreen({ hook }: Props) {
  const { addTransaction, getTodayEntries, deleteTransaction, getTotals, getFiltered } = hook
  const { categories, addCategory, deleteCategory } = useCategories()
  const { weekStart, setWeekStart } = useWeekStart()

  const [entryMode, setEntryMode] = useState<EntryMode>('daily')
  const [weekOffset, setWeekOffset] = useState(0)

  const [amountStr, setAmountStr] = useState('')
  const [type, setType] = useState<'income' | 'expense' | 'savings'>('expense')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [savingsCategory, setSavingsCategory] = useState('')
  const [showCatInput, setShowCatInput] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const catInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (categories.length > 0 && (!savingsCategory || !categories.includes(savingsCategory))) {
      setSavingsCategory(categories[0])
    }
  }, [categories, savingsCategory])

  useEffect(() => {
    if (showCatInput) catInputRef.current?.focus()
  }, [showCatInput])

  // Reset week offset when switching modes
  useEffect(() => {
    setWeekOffset(0)
  }, [entryMode])

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      setShowCatInput(false)
      return
    }
    await addCategory(newCatName)
    setSavingsCategory(newCatName.trim())
    setNewCatName('')
    setShowCatInput(false)
  }

  const parsedAmount = parseFloat(amountStr.replace(/,/g, '')) || 0
  const totals = getTotals()
  const todayEntries = getTodayEntries()
  const weekEntries = getFiltered('weekly', weekOffset, weekStart)

  // Week label
  const now = new Date()
  const ws = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: weekStart })
  const we = endOfWeek(addWeeks(now, weekOffset), { weekStartsOn: weekStart })
  const weekRangeLabel = `${format(ws, 'd MMM')} – ${format(we, 'd MMM yyyy')}`
  const weekBadge = weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekRangeLabel

  // Weekly summary
  const weekIncome  = weekEntries.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const weekExpense = weekEntries.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const weekSavings = weekEntries.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0)

  const handleSave = async () => {
    if (parsedAmount <= 0) return
    setSaving(true)

    let timestamp: string
    if (entryMode === 'daily' || weekOffset === 0) {
      timestamp = new Date().toISOString()
    } else {
      // Past week: stamp to the start of that week at noon
      const weekStartDate = startOfWeek(addWeeks(now, weekOffset), { weekStartsOn: weekStart })
      weekStartDate.setHours(12, 0, 0, 0)
      timestamp = weekStartDate.toISOString()
    }

    await addTransaction({
      amount: parsedAmount,
      type,
      category: type === 'savings' ? savingsCategory : '',
      description: description.trim(),
      timestamp,
    })
    setSaving(false)
    setSaved(true)
    setAmountStr('')
    setDescription('')
    setTimeout(() => setSaved(false), 1800)
  }

  const entriesLabel =
    entryMode === 'daily'
      ? `Today · ${todayEntries.length} entries`
      : `${weekBadge} · ${weekEntries.length} entries`

  const displayEntries = entryMode === 'daily' ? todayEntries : weekEntries

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink-primary">Log Entry</h1>
            <p className="text-sm text-ink-muted mt-0.5">
              {entryMode === 'daily'
                ? format(new Date(), 'EEEE, d MMMM yyyy')
                : weekRangeLabel}
            </p>
          </div>
          {/* Mode toggle */}
          <div className="flex gap-1 bg-surface-2 rounded-lg p-1">
            {(['daily', 'weekly'] as EntryMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setEntryMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 capitalize ${
                  entryMode === mode
                    ? 'bg-card text-accent shadow-sm'
                    : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly navigator */}
        <AnimatePresence>
          {entryMode === 'weekly' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => setWeekOffset((o) => o - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink-primary transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-xs font-medium text-ink-primary min-w-[200px] text-center">
                  {weekBadge}
                  {weekOffset !== 0 && (
                    <span className="text-ink-muted"> · {weekRangeLabel}</span>
                  )}
                </span>
                <button
                  onClick={() => setWeekOffset((o) => o + 1)}
                  disabled={weekOffset >= 0}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={15} />
                </button>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-xs text-accent hover:text-accent-dark font-medium transition-colors ml-1"
                  >
                    Now
                  </button>
                )}
              </div>

              {/* Week-start preference — only relevant in this view */}
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="text-[10px] text-ink-muted">Starts on</span>
                <div className="relative">
                  <select
                    value={weekStart}
                    onChange={(e) => setWeekStart(Number(e.target.value) as WeekDay)}
                    className="text-[10px] font-medium text-ink-secondary bg-surface-2 border border-surface-3 rounded px-2 py-0.5 pr-4 appearance-none outline-none cursor-pointer focus:border-accent"
                  >
                    {WEEK_DAYS.map((d) => (
                      <option key={d} value={d}>{WEEK_DAY_LABELS[d]}</option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'rgb(var(--color-ink-muted))' }}
                    width="6" height="6" viewBox="0 0 8 8" fill="currentColor"
                  >
                    <path d="M0 2l4 4 4-4H0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary cards */}
      <div className="px-8 pt-4 flex gap-3 flex-shrink-0">
        <AnimatePresence mode="wait">
          {entryMode === 'daily' ? (
            <motion.div
              key="daily-cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex gap-3 w-full"
            >
              <div className="flex-1 bg-accent/5 border border-accent/10 rounded-xl p-3">
                <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">
                  On Hand
                </p>
                <p
                  className={`text-lg font-semibold tabular-nums mt-1 ${
                    totals.onHand >= 0 ? 'text-accent' : 'text-expense'
                  }`}
                >
                  {totals.onHand >= 0 ? '+' : '−'}
                  {Math.abs(totals.onHand).toLocaleString()}
                </p>
              </div>
              <div className="flex-1 bg-savings/5 border border-savings/10 rounded-xl p-3">
                <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">
                  Total Savings
                </p>
                <p className="text-lg font-semibold tabular-nums mt-1 text-savings">
                  {totals.savings.toLocaleString()}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="weekly-cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex gap-2 w-full"
            >
              <div className="flex-1 bg-income/5 border border-income/10 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">Income</p>
                <p className="text-base font-semibold tabular-nums mt-0.5 text-income">
                  +{weekIncome.toLocaleString()}
                </p>
              </div>
              <div className="flex-1 bg-expense/5 border border-expense/10 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">Expense</p>
                <p className="text-base font-semibold tabular-nums mt-0.5 text-expense">
                  −{weekExpense.toLocaleString()}
                </p>
              </div>
              <div className="flex-1 bg-savings/5 border border-savings/10 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-ink-muted uppercase tracking-wide">Saved</p>
                <p className="text-base font-semibold tabular-nums mt-0.5 text-savings">
                  {weekSavings.toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Entry form */}
      <div className="flex-shrink-0 flex flex-col items-center gap-5 px-8 pt-6 pb-5">
        <AmountInput value={amountStr} onChange={setAmountStr} type={type} />
        <TypeToggle value={type} onChange={setType} />

        {/* Category picker — only visible for savings */}
        <AnimatePresence>
          {type === 'savings' && (
            <motion.div
              key="cat-picker"
              initial={{ opacity: 0, height: 0, marginTop: -8 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: -8 }}
              className="w-full overflow-hidden"
            >
              <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide text-center mb-2">
                Category
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map((cat) => (
                  <div key={cat} className="group/pill relative flex items-center">
                    <button
                      onClick={() => setSavingsCategory(cat)}
                      className={`pl-3 pr-7 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                        savingsCategory === cat
                          ? 'bg-savings text-white shadow-sm'
                          : 'bg-savings/10 text-savings hover:bg-savings/20'
                      }`}
                    >
                      {cat}
                    </button>
                    {categories.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteCategory(cat)
                        }}
                        className={`absolute right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover/pill:opacity-100 transition-opacity ${
                          savingsCategory === cat
                            ? 'bg-white/30 hover:bg-white/50 text-white'
                            : 'bg-savings/20 hover:bg-savings/40 text-savings'
                        }`}
                        title="Delete category"
                      >
                        <X size={8} />
                      </button>
                    )}
                  </div>
                ))}

                {showCatInput ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={catInputRef}
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCategory()
                        if (e.key === 'Escape') {
                          setShowCatInput(false)
                          setNewCatName('')
                        }
                      }}
                      placeholder="New category"
                      className="px-3 py-1.5 rounded-full text-xs border border-savings/40 bg-transparent text-ink-primary outline-none focus:border-savings w-32 placeholder:text-ink-muted"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="w-6 h-6 rounded-full bg-savings text-white flex items-center justify-center flex-shrink-0"
                    >
                      <Check size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCatInput(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-2 text-ink-muted hover:bg-surface-3 transition-all flex items-center gap-1"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <DescriptionInput
          value={description}
          onChange={setDescription}
          onSubmit={handleSave}
        />

        <motion.button
          onClick={handleSave}
          disabled={parsedAmount <= 0 || saving}
          whileTap={{ scale: 0.97 }}
          className={`relative w-64 py-3 rounded-pill text-sm font-semibold transition-all duration-200 ${
            parsedAmount > 0
              ? 'bg-accent text-white shadow-md hover:bg-accent-dark active:shadow-none'
              : 'bg-surface-2 text-ink-muted cursor-not-allowed'
          }`}
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <CheckCircle size={14} /> Saved!
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {saving ? 'Saving…' : 'Save Entry'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Divider */}
      <div className="px-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-3" />
          <span className="text-xs text-ink-muted font-medium">{entriesLabel}</span>
          <div className="flex-1 h-px bg-surface-3" />
        </div>
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto px-8 py-3 space-y-1 min-h-0">
        <AnimatePresence>
          {displayEntries.length === 0 ? (
            <motion.p
              {...fadeUp}
              className="text-xs text-ink-muted text-center py-6"
            >
              {entryMode === 'daily' ? 'No entries today yet' : 'No entries this week yet'}
            </motion.p>
          ) : (
            displayEntries.map((t) => (
              <motion.div
                key={t.id}
                {...fadeUp}
                layout
                className="group flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-1 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-ink-primary truncate">
                      {t.description || (
                        <span className="text-ink-muted italic">No description</span>
                      )}
                    </p>
                    {t.type === 'savings' && t.category && (
                      <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-savings/10 text-savings">
                        {t.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {entryMode === 'daily'
                      ? format(new Date(t.timestamp), 'h:mm a')
                      : format(new Date(t.timestamp), 'd MMM · h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`text-sm font-semibold tabular-nums ${TYPE_COLORS[t.type]}`}>
                    {TYPE_SIGNS[t.type]}
                    {t.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => deleteTransaction(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-muted hover:text-expense transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
