import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Screen } from './types/transaction'
import TitleBar from './components/layout/TitleBar'
import Sidebar from './components/layout/Sidebar'
import EntryScreen from './screens/EntryScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import SavingsScreen from './screens/SavingsScreen'
import ImportScreen from './screens/ImportScreen'
import { useTransactions } from './hooks/useTransactions'
import { fadeIn } from './types/motion'

export default function App() {
  const [screen, setScreen] = useState<Screen>('entry')
  const txHook = useTransactions()

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-0">
      <TitleBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar activeScreen={screen} onNavigate={setScreen} />
        <main className="flex-1 min-w-0 relative overflow-hidden">
          <AnimatePresence mode="sync">
            {screen === 'entry' && (
              <motion.div key="entry" className="absolute inset-0" {...fadeIn}>
                <EntryScreen hook={txHook} />
              </motion.div>
            )}
            {screen === 'analytics' && (
              <motion.div key="analytics" className="absolute inset-0" {...fadeIn}>
                <AnalyticsScreen hook={txHook} />
              </motion.div>
            )}
            {screen === 'savings' && (
              <motion.div key="savings" className="absolute inset-0" {...fadeIn}>
                <SavingsScreen hook={txHook} />
              </motion.div>
            )}
            {screen === 'import' && (
              <motion.div key="import" className="absolute inset-0" {...fadeIn}>
                <ImportScreen hook={txHook} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
