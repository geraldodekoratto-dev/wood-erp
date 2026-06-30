import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Package, AlertTriangle, XCircle } from 'lucide-react'
import { listStockItems } from '../services/stockItemService'
import type { StockItem, StockCategory } from '../types'
import { CATEGORY_LABELS, UNIT_SHORT, getStockStatus } from '../types'
import StockStatusBadge from '../components/StockStatusBadge'
import StockItemFormModal from '../components/StockItemFormModal'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas as categorias' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
]

function formatCurrency(v: number | null) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function StockPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showNew, setShowNew] = useState(false)

  async function load() {
    setLoading(true)
    setLoadError('')
    try { setItems(await listStockItems()) }
    catch (err: unknown) { setLoadError(err instanceof Error ? err.message : 'Erro ao carregar estoque.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      (item.supplier ?? '').toLowerCase().includes(q)
    const matchCategory = !categoryFilter || item.category === categoryFilter
    const matchStatus = !statusFilter || getStockStatus(item) === statusFilter
    return matchSearch && matchCategory && matchStatus
  })

  const lowStock  = items.filter(i => getStockStatus(i) === 'baixo').length
  const zeroStock = items.filter(i => getStockStatus(i) === 'zerado').length
  const totalValue = items.reduce((sum, i) => sum + (i.current_quantity * (i.cost_price ?? 0)), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Package size={26} style={{ color: '#00c896' }} />
            Estoque
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {items.length} ite{items.length !== 1 ? 'ns' : 'm'} cadastrado{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load}
            className="p-2.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}>
            <Plus size={16} />
            Novo Item
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Valor em Estoque"
          value={formatCurrency(totalValue)}
          valueColor="#00c896"
        />
        <SummaryCard
          label="Estoque Baixo"
          value={String(lowStock)}
          valueColor={lowStock > 0 ? '#fbbf24' : '#475569'}
          icon={lowStock > 0 ? <AlertTriangle size={14} /> : undefined}
          iconColor="#fbbf24"
          onClick={() => setStatusFilter(statusFilter === 'baixo' ? '' : 'baixo')}
          active={statusFilter === 'baixo'}
        />
        <SummaryCard
          label="Estoque Zerado"
          value={String(zeroStock)}
          valueColor={zeroStock > 0 ? '#f87171' : '#475569'}
          icon={zeroStock > 0 ? <XCircle size={14} /> : undefined}
          iconColor="#f87171"
          onClick={() => setStatusFilter(statusFilter === 'zerado' ? '' : 'zerado')}
          active={statusFilter === 'zerado'}
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou fornecedor..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }} />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', cursor: 'pointer' }}>
          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0f2040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Código', 'Nome', 'Categoria', 'Saldo Atual', 'Mínimo', 'Custo Unit.', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-16 text-center" style={{ color: '#475569' }}>
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" />Carregando estoque...
              </td></tr>
            ) : loadError ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <p className="text-sm font-medium mb-1" style={{ color: '#f87171' }}>Erro ao carregar estoque</p>
                <p className="text-xs mb-3" style={{ color: '#475569' }}>{loadError}</p>
                <button onClick={load} className="text-sm font-medium" style={{ color: '#00c896' }}>Tentar novamente</button>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center">
                <Package size={32} className="mx-auto mb-3" style={{ color: '#1e3a5f' }} />
                <p className="text-sm" style={{ color: '#475569' }}>
                  {search || categoryFilter || statusFilter ? 'Nenhum item encontrado.' : 'Nenhum item cadastrado ainda.'}
                </p>
                {!search && !categoryFilter && !statusFilter && (
                  <button onClick={() => setShowNew(true)} className="mt-3 text-sm font-medium" style={{ color: '#00c896' }}>
                    + Cadastrar primeiro item
                  </button>
                )}
              </td></tr>
            ) : filtered.map((item, i) => {
              const unit = UNIT_SHORT[item.unit]
              return (
                <tr key={item.id}
                  onClick={() => navigate(`/estoque/${item.id}`)}
                  style={{
                    background: i % 2 === 0 ? 'rgba(15,32,64,0.5)' : 'rgba(10,22,40,0.5)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,200,150,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(15,32,64,0.5)' : 'rgba(10,22,40,0.5)')}>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-mono font-medium" style={{ color: '#00c896' }}>{item.code}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    {item.supplier && <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{item.supplier}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs" style={{ color: '#64748b' }}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                      {item.current_quantity} <span className="text-xs font-normal" style={{ color: '#475569' }}>{unit}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm" style={{ color: '#64748b' }}>
                      {item.min_quantity} {unit}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm" style={{ color: item.cost_price ? '#e2e8f0' : '#475569' }}>
                      {formatCurrency(item.cost_price)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StockStatusBadge item={item} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <StockItemFormModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSaved={item => { setItems(prev => [item, ...prev].sort((a, b) => a.name.localeCompare(b.name))); setShowNew(false) }}
        />
      )}
    </div>
  )
}

function SummaryCard({
  label, value, valueColor, icon, iconColor, onClick, active,
}: {
  label: string; value: string; valueColor: string;
  icon?: React.ReactNode; iconColor?: string;
  onClick?: () => void; active?: boolean;
}) {
  return (
    <div onClick={onClick}
      className="rounded-xl p-4 transition-all"
      style={{
        background: active ? 'rgba(0,200,150,0.08)' : '#0f2040',
        border: active ? '1px solid rgba(0,200,150,0.3)' : '1px solid rgba(255,255,255,0.07)',
        cursor: onClick ? 'pointer' : 'default',
      }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span style={{ color: iconColor }}>{icon}</span>}
        <p className="text-xl font-bold" style={{ color: valueColor }}>{value}</p>
      </div>
    </div>
  )
}
