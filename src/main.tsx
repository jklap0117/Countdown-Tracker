import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/organic-styles.css'
import './index.css'
import App from './App.tsx'
import { AppProvider } from './store/AppProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
