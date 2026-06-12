import { useState, useEffect, useCallback } from 'react'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  parseISO,
  isWithinInterval,
} from 'date-fns'
import type { Transaction, Period, WeekDay } from '../types/transaction'

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getAllTransactions().then((data) => {
      setTransactions(data)
      setLoading(false)
    })
  }, [])

  const reloadTransactions = useCallback(async () => {
    const data = await window.api.getAllTransactions()
    setTransactions(data)
  }, [])

  const addTransaction = useCallback(
    async (t: Omit<Transaction, 'id'>) => {
      const saved = await window.api.addTransaction(t)
      setTransactions((prev) => [saved, ...prev])
      return saved
    },
    []
  )

  const deleteTransaction = useCallback(async (id: string) => {
    await window.api.deleteTransaction(id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateTransactionCategory = useCallback(
    async (id: string, category: string) => {
      await window.api.updateTransactionCategory(id, category)
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, category } : t))
      )
    },
    []
  )

  const getFiltered = useCallback(
    (period: Period, offset: number, weekStart: WeekDay = 1): Transaction[] => {
      const now = new Date()
      let start: Date
      let end: Date

      switch (period) {
        case 'daily':
          start = startOfDay(addDays(now, offset))
          end = endOfDay(addDays(now, offset))
          break
        case 'weekly':
          start = startOfWeek(addWeeks(now, offset), { weekStartsOn: weekStart })
          end = endOfWeek(addWeeks(now, offset), { weekStartsOn: weekStart })
          break
        case 'monthly':
          start = startOfMonth(addMonths(now, offset))
          end = endOfMonth(addMonths(now, offset))
          break
        case 'yearly':
          start = startOfYear(addYears(now, offset))
          end = endOfYear(addYears(now, offset))
          break
      }

      return transactions
        .filter((t) => {
          try {
            return isWithinInterval(parseISO(t.timestamp), { start, end })
          } catch {
            return false
          }
        })
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
    },
    [transactions]
  )

  const getTodayEntries = useCallback(
    () => getFiltered('daily', 0),
    [getFiltered]
  )

  const getAllSavings = useCallback(
    () =>
      transactions
        .filter((t) => t.type === 'savings')
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
    [transactions]
  )

  const getTotals = useCallback(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
    const savings = transactions
      .filter((t) => t.type === 'savings')
      .reduce((s, t) => s + t.amount, 0)
    return { income, expense, savings, onHand: income - expense - savings }
  }, [transactions])

  return {
    transactions,
    loading,
    reloadTransactions,
    addTransaction,
    deleteTransaction,
    updateTransactionCategory,
    getFiltered,
    getTodayEntries,
    getAllSavings,
    getTotals,
  }
}

export type TransactionsHook = ReturnType<typeof useTransactions>
