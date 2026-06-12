import { useState, useRef } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  type: 'income' | 'expense' | 'savings'
}

const TYPE_STYLES = {
  income:  { border: 'border-income',  text: 'text-income',  sign: '+' },
  expense: { border: 'border-expense', text: 'text-expense', sign: '−' },
  savings: { border: 'border-savings', text: 'text-savings', sign: '→' },
}

export default function AmountInput({ value, onChange, type }: Props) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.]/g, '')
    const parts = val.split('.')
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return
    onChange(val)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocused(true)
    const raw = value.replace(/,/g, '')
    onChange(raw)
    setTimeout(() => e.target.select(), 0)
  }

  const handleBlur = () => {
    setFocused(false)
    const num = parseFloat(value)
    if (!isNaN(num) && num > 0) {
      onChange(num.toLocaleString('en-US', { maximumFractionDigits: 2 }))
    } else {
      onChange('')
    }
  }

  const styles = TYPE_STYLES[type]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-light ${styles.text} opacity-50`}>
          {styles.sign}
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={focused ? value.replace(/,/g, '') : value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0"
          className={`w-64 text-center text-6xl font-light tracking-tight bg-transparent outline-none border-b-2 pb-1 transition-all duration-200 placeholder-ink-muted/30 ${
            focused
              ? `${styles.border} ${styles.text}`
              : 'border-surface-3 text-ink-primary'
          }`}
          style={{ letterSpacing: '-0.02em' }}
          autoFocus
        />
      </div>
      {!value && !focused && (
        <p className="text-xs text-ink-muted mt-1">Enter amount</p>
      )}
    </div>
  )
}
