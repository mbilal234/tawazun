import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './hooks/useTheme'
import { WeekStartProvider } from './hooks/useWeekStart'
import { ContrastProvider } from './hooks/useContrast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ContrastProvider>
        <WeekStartProvider>
          <App />
        </WeekStartProvider>
      </ContrastProvider>
    </ThemeProvider>
  </React.StrictMode>
)
