import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LayoutE_ThreePanel from './layouts/LayoutE_ThreePanel'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/:view" element={<LayoutE_ThreePanel />} />
      </Routes>
    </BrowserRouter>
  )
}
