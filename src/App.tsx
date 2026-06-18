import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell/AppShell'
import HrChat from './features/HrChat/HrChat'
import RagPage from './pages/RagPage'
import FaqPage from './pages/FaqPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HrChat />} />
        <Route path="/rag" element={<RagPage />} />
        <Route path="/faq" element={<FaqPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
