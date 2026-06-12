export interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense' | 'savings'
  category: string
  description: string
  timestamp: string
}

export const DEFAULT_SAVINGS_CATEGORIES = [
  'Savings Account',
  'Mutual Funds',
  'Other Investments',
]

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type ViewMode = 'list' | 'graph' | 'calendar'
export type Screen = 'entry' | 'analytics' | 'savings' | 'import'
export type SavingsTab = 'chronological' | 'categorical'
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6
