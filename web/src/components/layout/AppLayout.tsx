import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: '#0a1628' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main
        className="flex-1 p-8 min-w-0"
        style={{
          marginLeft: collapsed ? 64 : 256,
          minHeight: '100vh',
          transition: 'margin-left 0.2s ease',
        }}>
        <Outlet />
      </main>
    </div>
  )
}
