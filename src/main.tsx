import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import logoUrl from './assets/logo-sud-contractors.png'
import './styles.css'

document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href = logoUrl

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
