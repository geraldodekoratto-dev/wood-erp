import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Factory, Kanban, ShoppingCart, Package,
  ShoppingBag, Users, Settings, LogOut, ChevronRight, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'PCP — Produção', icon: Factory, to: '/pcp' },
  { label: 'Kanban', icon: Kanban, to: '/pcp/kanban' },
  { label: 'Vendas', icon: ShoppingCart, to: '/vendas' },
  { label: 'Estoque', icon: Package, to: '/estoque' },
  { label: 'Compras', icon: ShoppingBag, to: '/compras' },
  { label: 'Clientes', icon: Users, to: '/clientes' },
]

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { user, signOut } = useAuth()

  const width = collapsed ? 64 : 256

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        width,
        background: '#0f2040',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>

      {/* Logo + Toggle */}
      <div
        className="flex items-center px-3 py-4"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          gap: collapsed ? 0 : 12,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
          <span className="text-white font-bold text-base">W</span>
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm leading-none">WOOD ERP</div>
            <div className="text-xs mt-0.5" style={{ color: '#00c896' }}>v1.0</div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex-shrink-0 rounded-lg p-1.5 transition-colors"
          style={{ color: '#475569', marginLeft: collapsed ? 0 : 'auto' }}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
          {collapsed
            ? <PanelLeftOpen size={16} />
            : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(item => (
          item.disabled ? (
            <div
              key={item.to}
              className="flex items-center rounded-lg cursor-not-allowed select-none"
              style={{
                color: '#334155',
                padding: collapsed ? '10px' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 12,
              }}
              title={collapsed ? item.label : undefined}>
              <item.icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  <span
                    className="ml-auto text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#475569' }}>
                    Em breve
                  </span>
                </>
              )}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg transition-all ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`
              }
              style={({ isActive }) => ({
                padding: collapsed ? '10px' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 12,
                ...(isActive ? {
                  background: 'rgba(0,200,150,0.12)',
                  border: '1px solid rgba(0,200,150,0.2)',
                } : {}),
              })}>
              {({ isActive }) => (
                <>
                  <item.icon size={18} style={{ flexShrink: 0, color: isActive ? '#00c896' : undefined }} />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium">{item.label}</span>
                      {isActive && <ChevronRight size={14} className="ml-auto" style={{ color: '#00c896' }} />}
                    </>
                  )}
                </>
              )}
            </NavLink>
          )
        ))}
      </nav>

      {/* Bottom */}
      <div
        className="px-2 pb-4 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '12px' }}>

        <NavLink
          to="/configuracoes"
          title={collapsed ? 'Configurações' : undefined}
          className="flex items-center rounded-lg text-slate-400 hover:text-white transition-all text-sm"
          style={{
            padding: collapsed ? '10px' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
          }}>
          <Settings size={18} style={{ flexShrink: 0 }} />
          {!collapsed && 'Configurações'}
        </NavLink>

        {!collapsed && (
          <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>
        )}

        <button
          onClick={signOut}
          title={collapsed ? 'Sair' : undefined}
          className="w-full flex items-center rounded-lg transition-all text-sm"
          style={{
            padding: collapsed ? '10px' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 12,
            color: '#64748b',
          }}
          onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
          onMouseOut={e => (e.currentTarget.style.color = '#64748b')}>
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}
