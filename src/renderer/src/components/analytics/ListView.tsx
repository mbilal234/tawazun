import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import type { Transaction } from '../../types/transaction'
import { fadeUp } from '../../types/motion'

interface Props {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

function groupByDate(
  transactions: Transaction[]
): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const key = format(parseISO(t.timestamp), 'yyyy-MM-dd')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a > b ? -1 : 1))
    .map(([date, items]) => ({ date, items }))
}

function formatGroupDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Today'
  if (format(d, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd'))
    return 'Yesterday'
  return format(d, 'EEEE, d MMMM')
}

export default function ListView({ transactions, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-ink-muted">No transactions for this period</p>
      </div>
    )
  }

  const groups = groupByDate(transactions)

  return (
    <div className="h-full overflow-y-auto px-8 py-4">
      <AnimatePresence>
        {groups.map(({ date, items }) => (
          <motion.div key={date} {...fadeUp} className="mb-5">
            {/* Date group header */}
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
                {formatGroupDate(date)}
              </span>
              <div className="flex-1 h-px bg-surface-3" />
              <span className="text-xs text-ink-muted">
                {(() => {
                  const inc = items
                    .filter((t) => t.type === 'income')
                    .reduce((s, t) => s + t.amount, 0)
                  const exp = items
                    .filter((t) => t.type === 'expense')
                    .reduce((s, t) => s + t.amount, 0)
                  const net = inc - exp
                  return (
                    <span className={net >= 0 ? 'text-income' : 'text-expense'}>
                      {net >= 0 ? '+' : '−'}
                      {Math.abs(net).toLocaleString()}
                    </span>
                  )
                })()}
              </span>
            </div>

            {/* Transaction rows */}
            <div className="rounded-xl border border-surface-3 overflow-hidden">
              {items.map((t, i) => (
                <div
                  key={t.id}
                  className={`group flex items-center justify-between px-4 py-3 hover:bg-surface-1 transition-colors ${
                    i < items.length - 1 ? 'border-b border-surface-3' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-primary font-medium truncate">
                      {t.description || (
                        <span className="text-ink-muted italic font-normal">
                          No description
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {format(parseISO(t.timestamp), 'h:mm a')} ·{' '}
                      <span
                        className={`capitalize ${
                          t.type === 'income' ? 'text-income' : t.type === 'expense' ? 'text-expense' : 'text-savings'
                        }`}
                      >
                        {t.type}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        t.type === 'income' ? 'text-income' : t.type === 'expense' ? 'text-expense' : 'text-savings'
                      }`}
                    >
                      {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : '→'}
                      {t.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-muted hover:text-expense transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
