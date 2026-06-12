interface Props {
  value: string
  onChange: (val: string) => void
  onSubmit: () => void
}

export default function DescriptionInput({ value, onChange, onSubmit }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="w-full max-w-xs">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What was this for?"
        className="w-full text-center text-sm text-ink-primary bg-transparent outline-none border-b border-surface-3 focus:border-accent pb-2 transition-colors duration-200 placeholder-ink-muted/50"
        maxLength={120}
      />
    </div>
  )
}
