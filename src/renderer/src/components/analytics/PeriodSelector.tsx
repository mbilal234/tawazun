import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { format, addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek } from 'date-fns'
import type { Period, WeekDay } from '../../types/transaction'

interface Props {
  period: Period
  offset: number
  weekStart: WeekDay
  onPeriodChange: (p: Period) => void
  onOffsetChange: (o: number) => void
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'daily',   label: 'Daily'   },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly'  },
]

function getPeriodLabel(period: Period, offset: number, weekStart: WeekDay): string {
  const now = new Date()
  switch (period) {
    case 'daily':
      return format(addDays(now, offset), 'EEE, d MMM yyyy')
    case 'weekly': {
      const d = addWeeks(now, offset)
      const start = startOfWeek(d, { weekStartsOn: weekStart })
      const end = endOfWeek(d, { weekStartsOn: weekStart })
      return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`
    }
    case 'monthly':
      return format(addMonths(now, offset), 'MMMM yyyy')
    case 'yearly':
      return format(addYears(now, offset), 'yyyy')
  }
}

export default function PeriodSelector({
  period,
  offset,
  weekStart,
  onPeriodChange,
  onOffsetChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Period tabs */}
      <div className="flex gap-1 bg-surface-2 rounded-lg p-1 w-fit">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              onPeriodChange(value)
              onOffsetChange(0)
            }}
            className={`relative px-4 py-1.5 text-xs font-semibold rounded-md transition-colors duration-150 ${
              period === value
                ? 'text-ink-primary'
                : 'text-ink-muted hover:text-ink-secondary'
            }`}
          >
            {period === value && (
              <motion.div
                layoutId="period-bg"
                className="absolute inset-0 bg-card shadow-card rounded-md"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onOffsetChange(offset - 1)}
          className="w-7 h-7 flex items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink-primary transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-ink-primary min-w-[200px] text-center">
          {getPeriodLabel(period, offset, weekStart)}
        </span>
        <button
          onClick={() => onOffsetChange(offset + 1)}
          disabled={offset >= 0}
          className="w-7 h-7 flex items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
        {offset !== 0 && (
          <button
            onClick={() => onOffsetChange(0)}
            className="text-xs text-accent hover:text-accent-dark font-medium transition-colors"
          >
            Today
          </button>
        )}
      </div>
    </div>
  )
}
