import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Factory, Kanban, ShoppingCart, Package,
  Users, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'PCP — Produção', icon: Factory, to: '/pcp' },
  { label: 'Kanban', icon: Kanban, to: '/pcp/kanban' },
  { label: 'Vendas', icon: ShoppingCart, to: '/vendas', disabled: true },
  { label: 'Estoque', icon: Package, to: '/estoque', disabled: true },
  { label: 'Clientes', icon: Users, to: '/clientes', disabled: true },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{ background: '#0f2040', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
          <span className="text-white font-bold text-base">W</span>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none">WOOD ERP</div>
          <div className="text-xs mt-0.5" style={{ color: '#00c896' }}>v1.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map(item => (
          item.disabled ? (
            <div key={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed select-none"
              style={{ color: '#334155' }}>
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#475569' }}>
                Em breve
              </span>
            </div>
          ) : (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'rgba(0,200,150,0.12)',
                border: '1px solid rgba(0,200,150,0.2)',
              } : {}}>
              {({ isActive }) => (
                <>
                  <item.icon size={18} style={isActive ? { color: '#00c896' } : {}} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto" style={{ color: '#00c896' }} />}
                </>
              )}
            </NavLink>
          )
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>
        <NavLink to="/configuracoes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white transition-all text-sm">
          <Settings size={18} />
          Configurações
        </NavLink>
        <div className="px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-xs text-slate-400 truncate">{user?.email}</div>
        </div>
        <button onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm"
          style={{ color: '#64748b' }}
          onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
          onMouseOut={e => (e.currentTarget.style.color = '#64748b')}>
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
