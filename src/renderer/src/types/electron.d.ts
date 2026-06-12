import type { Transaction } from './transaction'

export {}

declare global {
  interface Window {
    api: {
      getAllTransactions: () => Promise<Transaction[]>
      addTransaction: (t: Omit<Transaction, 'id'>) => Promise<Transaction>
      deleteTransaction: (id: string) => Promise<boolean>
      updateTransactionCategory: (id: string, category: string) => Promise<boolean>
      getCategories: () => Promise<string[]>
      saveCategories: (categories: string[]) => Promise<{ success: boolean }>
      saveCsv: (
        csv: string,
        filename: string
      ) => Promise<{ success: boolean; path?: string }>
      savePdf: (
        dataUri: string,
        filename: string
      ) => Promise<{ success: boolean; path?: string }>
      previewImport: () => Promise<{
        transactions: Transaction[]
        skipped: number
        format: string
        error?: string
      } | null>
      commitImport: (transactions: Transaction[]) => Promise<number>
      getLastImportBatch: () => Promise<string[]>
      deleteLastImportBatch: () => Promise<number>
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
    }
  }
}
