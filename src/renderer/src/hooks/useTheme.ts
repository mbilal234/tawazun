import { createContext, useContext, useState, createElement, type ReactNode } from 'react'

export type ThemeId =
  | 'paper'
  | 'olive'
  | 'copper'
  | 'grass'
  | 'monastery'
  | 'apex'
  | 'minecraft'
  | 'mario'
  | 'ios'

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'paper',     label: 'Book Paper'       },
  { id: 'olive',     label: 'Studio Olive'     },
  { id: 'copper',    label: 'Weathered Copper' },
  { id: 'grass',     label: 'Alpha Grass'      },
  { id: 'monastery', label: 'Monastery'        },
  { id: 'apex',      label: 'Apex Dark'        },
  { id: 'minecraft', label: 'Minecraft'        },
  { id: 'mario',     label: 'Mario'            },
  { id: 'ios',       label: 'iOS Glass'        },
]

function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme)
}

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'paper',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('budget-theme') as ThemeId
    const valid: ThemeId = THEMES.some((t) => t.id === saved) ? saved : 'paper'
    applyTheme(valid)
    return valid
  })

  const setTheme = (newTheme: ThemeId) => {
    applyTheme(newTheme)
    localStorage.setItem('budget-theme', newTheme)
    setThemeState(newTheme)
  }

  return createElement(ThemeContext.Provider, { value: { theme, setTheme } }, children)
}

export function useTheme() {
  return useContext(ThemeContext)
}
