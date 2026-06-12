import { useMemo } from 'react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
} from 'date-fns'
import type { Transaction, Period, WeekDay } from '../../types/transaction'

interface Props {
  transactions: Transaction[]
  period: Period
  offset: number
  weekStart: WeekDay
}

const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarView({ transactions, period, offset, weekStart }: Props) {
  if (period !== 'monthly') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-ink-primary">Calendar view</p>
          <p className="text-xs text-ink-muted mt-1">
            Switch to Monthly period to see the calendar
          </p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const currentMonth = addMonths(now, offset)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { weekStartsOn: weekStart })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: weekStart })

  // Rotate day headers to match weekStart
  const DAYS = [...ALL_DAYS.slice(weekStart), ...ALL_DAYS.slice(0, weekStart)]

  const dayMap = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const t of transactions) {
      const key = format(parseISO(t.timestamp), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, { income: 0, expense: 0 })
      const entry = map.get(key)!
      if (t.type === 'income') entry.income += t.amount
      else if (t.type === 'expense') entry.expense += t.amount
    }
    return map
  }, [transactions])

  const cells: Date[] = []
  let cur = calStart
  while (cur <= calEnd) {
    cells.push(cur)
    cur = addDays(cur, 1)
  }

  const todayStr = format(now, 'yyyy-MM-dd')

  return (
    <div className="h-full overflow-y-auto px-6 py-4">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold text-ink-muted uppercase tracking-wider py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, currentMonth)
          const isToday = dayStr === todayStr
          const entry = dayMap.get(dayStr)
          const net = entry ? entry.income - entry.expense : null

          let bg = ''
          let amountColor = 'text-ink-muted'
          if (net !== null && inMonth) {
            if (net > 0) {
              bg = 'bg-income/10'
              amountColor = 'text-income'
            } else if (net < 0) {
              bg = 'bg-expense/10'
              amountColor = 'text-expense'
            }
          }

          return (
            <div
              key={dayStr}
              className={`min-h-[68px] rounded-lg p-2 flex flex-col ${
                inMonth ? bg || 'bg-surface-1' : 'bg-transparent'
              } ${isToday ? 'ring-2 ring-accent ring-offset-1' : ''} ${
                !inMonth ? 'opacity-30' : ''
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isToday ? 'text-accent font-bold' : 'text-ink-secondary'
                }`}
              >
                {format(day, 'd')}
              </span>
              {net !== null && inMonth && (
                <span
                  className={`text-[10px] font-semibold mt-auto tabular-nums leading-tight ${amountColor}`}
                >
                  {net >= 0 ? '+' : '−'}
                  {formatCompact(Math.abs(net))}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toLocaleString()
}
