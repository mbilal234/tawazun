interface Props {
  value: 'income' | 'expense' | 'savings'
  onChange: (val: 'income' | 'expense' | 'savings') => void
}

const OPTIONS = [
  { value: 'income' as const,  label: 'Income',  activeColor: 'text-income' },
  { value: 'expense' as const, label: 'Expense', activeColor: 'text-expense' },
  { value: 'savings' as const, label: 'Savings', activeColor: 'text-savings' },
]

export default function TypeToggle({ value, onChange }: Props) {
  const idx = OPTIONS.findIndex((o) => o.value === value)

  return (
    <div className="relative flex bg-surface-2 rounded-pill p-1 w-72">
      {/* Animated slider */}
      <div
        className="absolute top-1 bottom-1 rounded-pill bg-white shadow-card transition-all duration-200 ease-out"
        style={{
          width: 'calc((100% - 8px) / 3)',
          left: `calc(4px + ${idx} * (100% - 8px) / 3)`,
        }}
      />
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-pill transition-colors duration-200 ${
            value === opt.value ? opt.activeColor : 'text-ink-muted'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
