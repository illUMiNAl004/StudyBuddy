import { useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'

export default function App() {
  const [activePage, setActivePage] = useState('Home')

  return (
    <>
      <Navbar activePage={activePage} onNavigate={setActivePage} />
      {activePage === 'Home' && <Home />}
      {activePage === 'Notes' && <Placeholder label="Notes" />}
      {activePage === 'Groups' && <Placeholder label="Groups" />}
      {activePage === 'Calendar' && <Placeholder label="Calendar" />}
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
