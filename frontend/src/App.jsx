import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import Layout      from './components/Layout/Layout'
import Login       from './pages/Login'
import Home        from './pages/Home'
import Drivers     from './pages/Drivers'
import Documents   from './pages/Documents'
import Recruitment from './pages/Recruitment'
import Terminated  from './pages/Terminated'
import Analytics   from './pages/Analytics'
import Settings    from './pages/Settings'

function Guard({ children }) {
  const user = useStore(s => s.user)
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index        element={<Home />} />
          <Route path="drivers"     element={<Drivers />} />
          <Route path="documents"   element={<Documents />} />
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="terminated"  element={<Terminated />} />
          <Route path="analytics"   element={<Analytics />} />
          <Route path="settings"    element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}