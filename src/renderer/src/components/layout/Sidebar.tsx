import { useState } from 'react'
import {
  BarChart2, PiggyBank, PlusCircle, Type, Palette,
  Upload, ChevronDown, Sun,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Screen } from '../../types/transaction'
import { useFontSize, FONT_SIZES, FONT_SIZE_LABELS } from '../../hooks/useFontSize'
import type { FontSize } from '../../hooks/useFontSize'
import { useTheme, THEMES } from '../../hooks/useTheme'
import type { ThemeId } from '../../hooks/useTheme'
import { useContrast } from '../../hooks/useContrast'
import type { ContrastMode } from '../../hooks/useContrast'

interface Props {
  activeScreen: Screen
  onNavigate: (screen: Screen) => void
}

const navItems: { screen: Screen; icon: React.ReactNode; label: string }[] = [
  { screen: 'entry',     icon: <PlusCircle size={18} />, label: 'Log Entry'  },
  { screen: 'analytics', icon: <BarChart2 size={18} />,  label: 'Analytics' },
  { screen: 'savings',   icon: <PiggyBank size={18} />,  label: 'Savings'   },
  { screen: 'import',    icon: <Upload size={18} />,      label: 'Import'    },
]

const CONTRAST_OPTIONS: { value: ContrastMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'High Contrast' },
]

function SettingRow<T extends string | number>({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-muted flex-shrink-0">{icon}</span>
      <span className="text-[10px] text-ink-muted uppercase tracking-wide font-medium flex-shrink-0 w-8">
        {label}
      </span>
      <div className="relative flex-1 min-w-0">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="no-drag w-full appearance-none text-[11px] bg-surface-2 text-ink-primary border border-surface-3 rounded px-2 py-1 pr-5 focus:outline-none focus:border-accent cursor-pointer truncate"
        >
          {options.map((o) => (
            <option key={String(o.value)} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgb(var(--color-ink-muted))' }}
          width="7"
          height="7"
          viewBox="0 0 8 8"
          fill="currentColor"
        >
          <path d="M0 2l4 4 4-4H0z" />
        </svg>
      </div>
    </div>
  )
}

export default function Sidebar({ activeScreen, onNavigate }: Props) {
  const { currentSize, setSize } = useFontSize()
  const { theme, setTheme } = useTheme()
  const { contrast, setContrast } = useContrast()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const fontSizeOptions = FONT_SIZES.map((s) => ({
    value: s as FontSize,
    label: FONT_SIZE_LABELS[s],
  }))

  const themeOptions = THEMES.map((t) => ({
    value: t.id as ThemeId,
    label: t.label,
  }))

  return (
    <aside className="w-48 flex-shrink-0 flex flex-col border-r border-surface-3 bg-surface-1">

      {/* Collapsible settings section */}
      <div className="border-b border-surface-3">
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="no-drag w-full flex items-center justify-between px-3 py-2.5 text-[10px] uppercase tracking-widest font-semibold text-ink-muted hover:text-ink-secondary transition-colors duration-150"
        >
          <div className="flex items-center gap-1.5">
            <Sun size={10} />
            <span>Appearance</span>
          </div>
          <ChevronDown
            size={10}
            className={`transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {settingsOpen && (
            <motion.div
              key="settings-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-2">
                <SettingRow
                  icon={<Type size={11} />}
                  label="Font"
                  value={currentSize}
                  options={fontSizeOptions}
                  onChange={setSize}
                />
                <SettingRow
                  icon={<Palette size={11} />}
                  label="Theme"
                  value={theme}
                  options={themeOptions}
                  onChange={setTheme}
                />
                <SettingRow
                  icon={<Sun size={11} />}
                  label="Style"
                  value={contrast}
                  options={CONTRAST_OPTIONS}
                  onChange={setContrast}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 pt-4 space-y-1">
        {navItems.map(({ screen, icon, label }) => {
          const active = activeScreen === screen
          return (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'text-accent bg-accent/10'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-2'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className={active ? 'text-accent' : ''}>{icon}</span>
              {label}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-surface-3">
        <p className="text-[10px] text-ink-muted text-center">Tawazun</p>
      </div>
    </aside>
  )
}
