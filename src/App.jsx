import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './pages/Profile'
import Notes from './pages/Notes'
import Groups from './pages/Groups'

export default function App() {
  const location = useLocation()

  const getActivePage = () => {
    switch (location.pathname) {
      case '/': return 'Home'
      case '/notes': return 'Notes'
      case '/groups': return 'Groups'
      case '/calendar': return 'Calendar'
      default: return ''
    }
  }

  return (
    <>
      <Navbar activePage={getActivePage()} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/notes" element={<Notes />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/calendar" element={<Placeholder label="Calendar" />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </>
  )
}

function Placeholder({ label }) {
  return (
    <div className="page">
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '40px',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '0.95rem',
      }}>
        {label} page — coming soon
      </div>
    </div>
  )
}
