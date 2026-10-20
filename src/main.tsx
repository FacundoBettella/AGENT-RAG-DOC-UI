import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/overpass/400.css'
import '@fontsource/overpass/500.css'
import '@fontsource/overpass/600.css'
import '@fontsource/overpass/700.css'
import 'material-symbols/outlined.css'
import './index.css'
import App from './App'

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}
