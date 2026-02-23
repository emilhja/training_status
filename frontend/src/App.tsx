import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import SharedView from './components/SharedView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/shared/:token" element={<SharedView />} />
        <Route path="/:view" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  )
}
