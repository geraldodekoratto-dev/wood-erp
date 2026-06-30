import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, ShoppingCart } from 'lucide-react'
import { listSalesOrders } from '../services/salesOrderService'
import type { SalesOrder, SalesOrderStatus } from '../types'
import { STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../types'
import SalesOrderStatusBadge from '../components/SalesOrderStatusBadge'
import SalesOrderFormModal from '../components/SalesOrderFormModal'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatCurrency(v: number | null) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SalesPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showNew, setShowNew] = useState(false)

  async function load() {
    setLoading(true)
    setLoadError('')
    try { setOrders(await listSalesOrders()) }
    catch (err: unknown) { setLoadError(err instanceof Error ? err.message : 'Erro ao carregar pedidos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      o.customer_name.toLowerCase().includes(q) ||
      o.code.toLowerCase().includes(q) ||
      (o.description ?? '').toLowerCase().includes(q)
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalVenda = filtered
    .filter(o => !['cancelado'].includes(o.status))
    .reduce((sum, o) => sum + (o.total_value ?? 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#0f172a' }}>
            <ShoppingCart size={26} style={{ color: '#00c896' }} />
            Vendas
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} · Total ativo:{' '}
            <span style={{ color: '#00c896' }}>{totalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load}
            className="p-2.5 rounded-lg transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}>
            <Plus size={16} />
            Novo Pedido
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, código ou descrição..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }} />
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
              {['Código', 'Cliente', 'Descrição', 'Entrega', 'Valor', 'Pagamento', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center" style={{ color: '#64748b' }}>
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" />Carregando pedidos...
              </td></tr>
            ) : loadError ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <p className="text-sm font-medium mb-1" style={{ color: '#f87171' }}>Erro ao carregar pedidos</p>
                <p className="text-xs mb-3" style={{ color: '#64748b' }}>{loadError}</p>
                <button onClick={load} className="text-sm font-medium" style={{ color: '#00c896' }}>Tentar novamente</button>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <ShoppingCart size={32} className="mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                <p className="text-sm" style={{ color: '#64748b' }}>
                  {search || statusFilter ? 'Nenhum pedido encontrado.' : 'Nenhum pedido cadastrado ainda.'}
                </p>
                {!search && !statusFilter && (
                  <button onClick={() => setShowNew(true)} className="mt-3 text-sm font-medium" style={{ color: '#00c896' }}>
                    + Criar primeiro pedido
                  </button>
                )}
              </td></tr>
            ) : filtered.map((o, i) => (
              <tr key={o.id}
                onClick={() => navigate(`/vendas/${o.id}`)}
                style={{
                  background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,200,150,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#f8fafc')}>
                <td className="px-4 py-3.5">
                  <span className="text-xs font-mono font-medium" style={{ color: '#00c896' }}>{o.code}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-medium" style={{ color: '#0f172a' }}>{o.customer_name}</span>
                </td>
                <td className="px-4 py-3.5 max-w-xs">
                  <span className="text-sm truncate block" style={{ color: '#475569' }}>{o.description || '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm" style={{ color: '#64748b' }}>{formatDate(o.delivery_date)}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-medium" style={{ color: o.total_value ? '#0f172a' : '#64748b' }}>
                    {formatCurrency(o.total_value)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs" style={{ color: '#64748b' }}>
                    {o.payment_method ? PAYMENT_METHOD_LABELS[o.payment_method] : '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <SalesOrderStatusBadge status={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <SalesOrderFormModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSaved={o => { setOrders(prev => [o, ...prev]); setShowNew(false) }}
        />
      )}
    </div>
  )
}
