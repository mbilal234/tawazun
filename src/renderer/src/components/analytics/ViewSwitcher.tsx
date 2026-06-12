import { BarChart2, CalendarDays, List } from 'lucide-react'
import type { ViewMode } from '../../types/transaction'

interface Props {
  view: ViewMode
  onChange: (v: ViewMode) => void
}

const VIEWS: { value: ViewMode; icon: React.ReactNode; label: string }[] = [
  { value: 'list', icon: <List size={15} />, label: 'List' },
  { value: 'graph', icon: <BarChart2 size={15} />, label: 'Graph' },
  { value: 'calendar', icon: <CalendarDays size={15} />, label: 'Calendar' },
]

export default function ViewSwitcher({ view, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-surface-2 rounded-lg p-1">
      {VIEWS.map(({ value, icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          title={label}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
            view === value
              ? 'bg-card shadow-card text-accent'
              : 'text-ink-muted hover:text-ink-secondary'
          }`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
