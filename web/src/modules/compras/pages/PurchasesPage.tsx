import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, ShoppingBag, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { listPurchaseOrders } from '../services/purchaseOrderService'
import PurchaseOrderStatusBadge from '../components/PurchaseOrderStatusBadge'
import PurchaseOrderFormModal from '../components/PurchaseOrderFormModal'
import type { PurchaseOrder, PurchaseOrderStatus } from '../types'

const STATUS_FILTER: { label: string; value: PurchaseOrderStatus | 'todos' }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Rascunho', value: 'rascunho' },
  { label: 'Enviado', value: 'enviado' },
  { label: 'Parcial', value: 'parcialmente_recebido' },
  { label: 'Recebido', value: 'recebido' },
  { label: 'Cancelado', value: 'cancelado' },
]

function fmt(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export default function PurchasesPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'todos'>('todos')
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    setLoading(true); setLoadError('')
    try {
      const data = await listPurchaseOrders()
      setOrders(data)
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar pedidos.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const pending = orders.filter(o => o.status === 'enviado' || o.status === 'parcialmente_recebido').length
  const drafts = orders.filter(o => o.status === 'rascunho').length

  return (
    <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', minHeight: '100%' }}>
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(0,200,150,0.2), rgba(0,160,122,0.1))', border: '1px solid rgba(0,200,150,0.3)' }}>
              <ShoppingBag size={22} style={{ color: '#00c896' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Compras</h1>
              <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Pedidos de compra e recebimento de materiais</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}>
            <Plus size={16} /> Novo Pedido
          </button>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total de Pedidos', value: orders.length, color: '#60a5fa' },
            { label: 'Aguardando Recebimento', value: pending, color: '#fbbf24' },
            { label: 'Rascunhos', value: drafts, color: '#64748b' },
          ].map(card => (
            <div key={card.label} className="rounded-xl p-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>{card.label}</p>
              <p className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código ou fornecedor..."
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', outline: 'none', width: 280 }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            {STATUS_FILTER.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: statusFilter === f.value ? 'rgba(0,200,150,0.15)' : '#ffffff',
                  color: statusFilter === f.value ? '#00c896' : '#64748b',
                  border: statusFilter === f.value ? '1px solid rgba(0,200,150,0.3)' : '1px solid #e2e8f0',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 size={20} className="animate-spin" style={{ color: '#00c896' }} />
              <span className="text-sm" style={{ color: '#64748b' }}>Carregando pedidos...</span>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <AlertTriangle size={24} style={{ color: '#f87171' }} />
              <p className="text-sm" style={{ color: '#f87171' }}>{loadError}</p>
              <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold"
                style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                <RefreshCw size={13} /> Tentar novamente
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <ShoppingBag size={32} style={{ color: '#cbd5e1' }} />
              <p className="text-sm font-medium" style={{ color: '#64748b' }}>
                {search || statusFilter !== 'todos' ? 'Nenhum pedido encontrado.' : 'Nenhum pedido de compra cadastrado.'}
              </p>
              {!search && statusFilter === 'todos' && (
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 text-sm mt-1" style={{ color: '#00c896' }}>
                  <Plus size={14} /> Criar primeiro pedido
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {['Código', 'Fornecedor', 'Status', 'Data Pedido', 'Prev. Entrega', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, idx) => (
                  <tr key={order.id}
                    onClick={() => navigate(`/compras/${order.id}`)}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold" style={{ color: '#00c896' }}>{order.code}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{order.supplier_name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <PurchaseOrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: '#475569' }}>
                      {fmt(order.order_date)}
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ color: order.expected_date ? '#475569' : '#94a3b8' }}>
                      {order.expected_date ? fmt(order.expected_date) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/compras/${order.id}`) }}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* footer count */}
        {!loading && !loadError && filtered.length > 0 && (
          <p className="text-xs mt-3" style={{ color: '#94a3b8' }}>
            {filtered.length} pedido{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {showCreate && (
        <PurchaseOrderFormModal
          mode="create"
          onClose={() => setShowCreate(false)}
          onSaved={order => {
            setOrders(prev => [order, ...prev])
            setShowCreate(false)
            navigate(`/compras/${order.id}`)
          }}
        />
      )}
    </div>
  )
}
