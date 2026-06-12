import { createContext, useContext, useState, createElement, type ReactNode } from 'react'
import type { WeekDay } from '../types/transaction'

export type { WeekDay }

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

export const WEEK_DAYS: WeekDay[] = [0, 1, 2, 3, 4, 5, 6]

interface WeekStartContextValue {
  weekStart: WeekDay
  setWeekStart: (d: WeekDay) => void
}

const WeekStartContext = createContext<WeekStartContextValue>({
  weekStart: 1,
  setWeekStart: () => {},
})

export function WeekStartProvider({ children }: { children: ReactNode }) {
  const [weekStart, setWeekStartState] = useState<WeekDay>(() => {
    const saved = Number(localStorage.getItem('budget-weekstart'))
    return (Number.isInteger(saved) && saved >= 0 && saved <= 6 ? saved : 1) as WeekDay
  })

  const setWeekStart = (d: WeekDay) => {
    localStorage.setItem('budget-weekstart', String(d))
    setWeekStartState(d)
  }

  return createElement(WeekStartContext.Provider, { value: { weekStart, setWeekStart } }, children)
}

export function useWeekStart() {
  return useContext(WeekStartContext)
}
