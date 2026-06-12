import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
} from 'recharts'
import {
  format,
  parseISO,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  startOfWeek,
  startOfMonth,
  startOfYear,
  getDaysInMonth,
  getHours,
} from 'date-fns'
import type { Transaction, Period, WeekDay } from '../../types/transaction'
import { useTheme } from '../../hooks/useTheme'

interface Props {
  transactions: Transaction[]
  period: Period
  offset: number
  weekStart: WeekDay
}

interface Bucket {
  label: string
  income: number
  expense: number
  net: number
  cumulative: number
}

function getBuckets(
  transactions: Transaction[],
  period: Period,
  offset: number,
  weekStart: WeekDay
): Bucket[] {
  const now = new Date()
  let rawBuckets: { label: string; income: number; expense: number }[] = []

  if (period === 'daily') {
    rawBuckets = Array.from({ length: 24 }, (_, i) => {
      const label =
        i === 0 ? '12AM' : i < 12 ? `${i}AM` : i === 12 ? '12PM' : `${i - 12}PM`
      const txs = transactions.filter(
        (t) => getHours(parseISO(t.timestamp)) === i
      )
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { label, income, expense }
    }).filter((b) => b.income > 0 || b.expense > 0)
  }

  if (period === 'weekly') {
    const weekStart2 = startOfWeek(addWeeks(now, offset), { weekStartsOn: weekStart })
    rawBuckets = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekStart2, i)
      const label = format(day, 'EEE')
      const dayStr = format(day, 'yyyy-MM-dd')
      const txs = transactions.filter(
        (t) => format(parseISO(t.timestamp), 'yyyy-MM-dd') === dayStr
      )
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { label, income, expense }
    })
  }

  if (period === 'monthly') {
    const monthStart = startOfMonth(addMonths(now, offset))
    const days = getDaysInMonth(monthStart)
    rawBuckets = Array.from({ length: days }, (_, i) => {
      const day = addDays(monthStart, i)
      const label = String(i + 1)
      const dayStr = format(day, 'yyyy-MM-dd')
      const txs = transactions.filter(
        (t) => format(parseISO(t.timestamp), 'yyyy-MM-dd') === dayStr
      )
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { label, income, expense }
    })
  }

  if (period === 'yearly') {
    const yearStart = startOfYear(addYears(now, offset))
    rawBuckets = Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(yearStart, i)
      const label = format(month, 'MMM')
      const monthStr = format(month, 'yyyy-MM')
      const txs = transactions.filter(
        (t) => format(parseISO(t.timestamp), 'yyyy-MM') === monthStr
      )
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { label, income, expense }
    })
  }

  let cumulative = 0
  return rawBuckets.map((b) => {
    const net = b.income - b.expense
    cumulative += net
    return { ...b, net, cumulative }
  })
}

function formatY(val: number): string {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
  return String(val)
}

export default function GraphView({ transactions, period, offset, weekStart }: Props) {
  // Subscribe to theme context so CSS vars are re-read when theme changes
  const { theme } = useTheme()

  const data = useMemo(
    () => getBuckets(transactions, period, offset, weekStart),
    [transactions, period, offset, weekStart]
  )

  // Read CSS custom properties at render time (after theme attr is applied)
  const s = getComputedStyle(document.documentElement)
  const c = (v: string) => `rgb(${s.getPropertyValue(v).trim()})`

  const incomeColor   = c('--color-income')
  const expenseColor  = c('--color-expense')
  const accentColor   = c('--color-accent')
  const gridColor     = c('--color-surface-3')
  const tickColor     = c('--color-ink-muted')
  const cursorColor   = c('--color-surface-2')
  const tooltipBg     = c('--color-card')
  const tooltipBorder = c('--color-surface-3')
  const tooltipText   = c('--color-ink-primary')

  const tooltipStyle = {
    backgroundColor: tooltipBg,
    color: tooltipText,
    borderRadius: '10px',
    border: `1px solid ${tooltipBorder}`,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.15)',
    fontSize: '12px',
  }

  if (transactions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-ink-muted">No data to display</p>
      </div>
    )
  }

  void theme

  return (
    <div className="h-full overflow-y-auto px-6 py-4 space-y-6">
      {/* Bar chart: Income vs Expense */}
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3 px-2">
          Income vs Expense
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
            barCategoryGap="35%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatY}
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorColor }} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px', color: tickColor }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="income" name="Income" fill={incomeColor} radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill={expenseColor} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart: Cumulative net balance */}
      <div>
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3 px-2">
          Running Balance
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={data}
            margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatY}
              tick={{ fontSize: 11, fill: tickColor }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: gridColor }} />
            <ReferenceLine y={0} stroke={gridColor} strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="cumulative"
              name="Balance"
              stroke={accentColor}
              strokeWidth={2}
              fill={accentColor}
              fillOpacity={0.08}
              dot={false}
              activeDot={{ r: 4, fill: accentColor }}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke={accentColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: accentColor }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
