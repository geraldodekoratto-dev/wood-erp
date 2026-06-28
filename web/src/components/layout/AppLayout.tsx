import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen" style={{ background: '#0a1628' }}>
      <Sidebar />
      <main className="ml-64 p-8" style={{ minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
