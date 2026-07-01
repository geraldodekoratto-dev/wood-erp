import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Factory, Kanban, ShoppingCart, Package,
  ShoppingBag, Users, DollarSign, Wrench, CalendarCheck2, Settings, LogOut, ChevronRight, PanelLeftClose, PanelLeftOpen
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
  { label: 'Engenharia', icon: Wrench, to: '/engenharia' },
  { label: 'Vendas', icon: ShoppingCart, to: '/vendas' },
  { label: 'Estoque', icon: Package, to: '/estoque' },
  { label: 'Compras', icon: ShoppingBag, to: '/compras' },
  { label: 'Financeiro', icon: DollarSign, to: '/financeiro' },
  { label: 'Instalação', icon: CalendarCheck2, to: '/instalacao' },
  { label: 'Clientes', icon: Users, to: '/clientes' },
]

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { user, signOut } = useAuth()

  const width = collapsed ? 64 : 240

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        width,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}>

      {/* Logo + Toggle */}
      <div
        className="flex items-center px-3 py-4"
        style={{
          borderBottom: '1px solid #e2e8f0',
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
          <span className="text-white font-bold text-base">W</span>
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-none" style={{ color: '#0f172a' }}>WOOD ERP</div>
            <div className="text-xs mt-0.5" style={{ color: '#00c896' }}>v1.0</div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex-shrink-0 rounded-lg p-1.5 transition-colors"
          style={{ color: '#94a3b8', marginLeft: collapsed ? 0 : 'auto' }}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
          {collapsed
            ? <PanelLeftOpen size={16} />
            : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-lg transition-all ${
                isActive ? '' : 'hover:bg-slate-50'
              }`
            }
            style={({ isActive }) => ({
              padding: collapsed ? '10px' : '9px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 10,
              color: isActive ? '#00a07a' : '#64748b',
              ...(isActive ? {
                background: 'rgba(0,200,150,0.08)',
                border: '1px solid rgba(0,200,150,0.2)',
              } : { border: '1px solid transparent' }),
            })}>
            {({ isActive }) => (
              <>
                <item.icon size={17} style={{ flexShrink: 0, color: isActive ? '#00c896' : '#94a3b8' }} />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    {isActive && <ChevronRight size={13} className="ml-auto" style={{ color: '#00c896' }} />}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div
        className="px-2 pb-3 space-y-0.5"
        style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>

        <NavLink
          to="/configuracoes"
          title={collapsed ? 'Configurações' : undefined}
          className="flex items-center rounded-lg transition-all text-sm hover:bg-slate-50"
          style={{
            padding: collapsed ? '10px' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            color: '#64748b',
          }}>
          <Settings size={17} style={{ flexShrink: 0, color: '#94a3b8' }} />
          {!collapsed && 'Configurações'}
        </NavLink>

        {!collapsed && (
          <div className="px-3 py-2 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="text-xs truncate" style={{ color: '#64748b' }}>{user?.email}</div>
          </div>
        )}

        <button
          onClick={signOut}
          title={collapsed ? 'Sair' : undefined}
          className="w-full flex items-center rounded-lg transition-all text-sm"
          style={{
            padding: collapsed ? '10px' : '9px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10,
            color: '#94a3b8',
          }}
          onMouseOver={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}>
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}
