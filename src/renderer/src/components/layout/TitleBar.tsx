import { Minus, Square, X } from 'lucide-react'

export default function TitleBar() {
  return (
    <div className="drag h-8 flex items-center justify-between bg-surface-0 border-b border-surface-3 flex-shrink-0 z-50">
      <span className="pl-4 text-[11px] font-semibold tracking-widest uppercase text-ink-muted select-none">
        Budget
      </span>
      <div className="no-drag flex h-full">
        <button
          onClick={() => window.api.minimizeWindow()}
          className="w-11 h-full flex items-center justify-center text-ink-muted hover:bg-surface-2 hover:text-ink-primary transition-colors"
        >
          <Minus size={11} />
        </button>
        <button
          onClick={() => window.api.maximizeWindow()}
          className="w-11 h-full flex items-center justify-center text-ink-muted hover:bg-surface-2 hover:text-ink-primary transition-colors"
        >
          <Square size={10} />
        </button>
        <button
          onClick={() => window.api.closeWindow()}
          className="w-11 h-full flex items-center justify-center text-ink-muted hover:bg-expense/10 hover:text-expense transition-colors"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  )
}
