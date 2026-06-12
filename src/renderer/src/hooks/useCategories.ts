import { useState, useEffect, useCallback } from 'react'
import { DEFAULT_SAVINGS_CATEGORIES } from '../types/transaction'

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_SAVINGS_CATEGORIES)

  useEffect(() => {
    window.api.getCategories().then(setCategories)
  }, [])

  const addCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || categories.includes(trimmed)) return
      const updated = [...categories, trimmed]
      setCategories(updated)
      await window.api.saveCategories(updated)
    },
    [categories]
  )

  const deleteCategory = useCallback(
    async (name: string) => {
      if (categories.length <= 1) return
      const updated = categories.filter((c) => c !== name)
      setCategories(updated)
      await window.api.saveCategories(updated)
    },
    [categories]
  )

  return { categories, addCategory, deleteCategory }
}
