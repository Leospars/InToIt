import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { applyTheme, prefersReducedMotion } from '@/lib/utils'

// Apply stored theme on boot
const stored = localStorage.getItem('intoit-store-v1')
if (stored) {
  try {
    const parsed = JSON.parse(stored)
    const theme = parsed?.state?.user?.theme
    if (theme) applyTheme(theme)
  } catch { /* ignore */ }
}

// Respect system reduced-motion preference
if (prefersReducedMotion()) {
  document.documentElement.classList.add('reduce-motion')
}

// Register service worker (PWA)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(console.error)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
