import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Factory } from 'lucide-react'
import { listProductionOrders, updateOrderStatus } from '../services/productionOrderService'
import type { ProductionOrder, ProductionOrderStatus } from '../types'
import { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '../types'
import StatusBadge from '../components/StatusBadge'
import NewOrderModal from '../components/NewOrderModal'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR')
}

export default function PCPPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await listProductionOrders()
      setOrders(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.client_name.toLowerCase().includes(search.toLowerCase()) ||
      o.project_name.toLowerCase().includes(search.toLowerCase()) ||
      o.reference_number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  async function handleStatusChange(id: string, status: ProductionOrderStatus) {
    setUpdatingId(id)
    try {
      await updateOrderStatus(id, status)
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#0f172a' }}>
            <Factory size={26} style={{ color: '#00c896' }} />
            PCP — Produção
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {orders.length} ordem{orders.length !== 1 ? 's' : ''} cadastrada{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load}
            className="p-2.5 rounded-lg transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}>
            <Plus size={16} />
            Nova Ordem
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, projeto ou nº da ordem..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', cursor: 'pointer' }}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              {['Nº Ordem', 'Cliente', 'Projeto', 'Prioridade', 'Status', 'Entrega', 'Avançar Etapa'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center" style={{ color: '#64748b' }}>
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Carregando ordens...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Factory size={32} className="mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    {search || statusFilter ? 'Nenhuma ordem encontrada.' : 'Nenhuma ordem cadastrada ainda.'}
                  </p>
                  {!search && !statusFilter && (
                    <button onClick={() => setShowNewModal(true)}
                      className="mt-3 text-sm font-medium" style={{ color: '#00c896' }}>
                      + Criar primeira ordem
                    </button>
                  )}
                </td>
              </tr>
            ) : filtered.map((order, i) => (
              <tr key={order.id}
                onClick={() => navigate(`/pcp/${order.id}`)}
                style={{
                  background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,200,150,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#f8fafc')}>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-mono font-medium" style={{ color: '#00c896' }}>
                    {order.reference_number}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-medium" style={{ color: '#0f172a' }}>{order.client_name}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm" style={{ color: '#475569' }}>{order.project_name}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs font-semibold" style={{ color: PRIORITY_COLORS[order.priority] }}>
                    {PRIORITY_LABELS[order.priority]}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm" style={{ color: '#64748b' }}>
                    {formatDate(order.delivery_date)}
                  </span>
                </td>
                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                  {order.status !== 'entregue' && order.status !== 'cancelado' ? (
                    <select
                      disabled={updatingId === order.id}
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value as ProductionOrderStatus)}
                      className="text-xs rounded-lg px-2 py-1.5 outline-none"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#0f172a',
                        cursor: 'pointer',
                      }}>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs" style={{ color: '#cbd5e1' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <NewOrderModal
          onClose={() => setShowNewModal(false)}
          onCreated={order => {
            setOrders(prev => [order, ...prev])
            setShowNewModal(false)
          }}
        />
      )}
    </div>
  )
}
