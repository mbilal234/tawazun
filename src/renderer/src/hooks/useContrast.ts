import { createContext, useContext, useState, createElement, type ReactNode } from 'react'

export type ContrastMode = 'normal' | 'high'

function applyContrast(mode: ContrastMode) {
  if (mode === 'high') {
    document.documentElement.setAttribute('data-contrast', 'high')
  } else {
    document.documentElement.removeAttribute('data-contrast')
  }
}

interface ContrastContextValue {
  contrast: ContrastMode
  setContrast: (m: ContrastMode) => void
}

const ContrastContext = createContext<ContrastContextValue>({
  contrast: 'normal',
  setContrast: () => {},
})

export function ContrastProvider({ children }: { children: ReactNode }) {
  const [contrast, setContrastState] = useState<ContrastMode>(() => {
    const saved = localStorage.getItem('budget-contrast') as ContrastMode
    const valid: ContrastMode = saved === 'high' ? 'high' : 'normal'
    applyContrast(valid)
    return valid
  })

  const setContrast = (mode: ContrastMode) => {
    applyContrast(mode)
    localStorage.setItem('budget-contrast', mode)
    setContrastState(mode)
  }

  return createElement(ContrastContext.Provider, { value: { contrast, setContrast } }, children)
}

export function useContrast() {
  return useContext(ContrastContext)
}
