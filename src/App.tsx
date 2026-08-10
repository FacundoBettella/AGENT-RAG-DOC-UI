import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell/AppShell'
import HrChat from './features/HrChat/HrChat'
import RagPage from './pages/RagPage'
import FaqPage from './pages/FaqPage'
import ContractsPage from './pages/ContractsPage'
import SettingsPage from './pages/SettingsPage'
import { ROUTES } from './constants'

export const App = () => {
  return (
    <AppShell>
      <Routes>
        <Route path={ROUTES.CHAT} element={<HrChat />} />
        <Route path={ROUTES.CONTRACTS} element={<ContractsPage />} />
        <Route path={ROUTES.RAG} element={<RagPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
        <Route path={ROUTES.FAQ} element={<FaqPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
