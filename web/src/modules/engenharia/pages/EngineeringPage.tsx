import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Wrench, Package, CheckCircle, Clock } from 'lucide-react'
import { listProducts } from '../services/engineeringService'
import type { EngineeringProduct, ProductCategory, ProductStatus } from '../types'
import { CATEGORY_LABELS } from '../types'
import EngineeringStatusBadge from '../components/EngineeringStatusBadge'
import EngineeringProductFormModal from '../components/EngineeringProductFormModal'

const CATEGORY_OPTIONS: { value: ProductCategory | ''; label: string }[] = [
  { value: '', label: 'Todas as categorias' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'quarto', label: 'Quarto' },
  { value: 'banheiro', label: 'Banheiro' },
  { value: 'sala', label: 'Sala' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'outro', label: 'Outro' },
]

const STATUS_OPTIONS: { value: ProductStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'em_revisao', label: 'Em Revisão' },
  { value: 'inativo', label: 'Inativo' },
]

function fmtDim(w: number | null, h: number | null, d: number | null): string {
  if (!w && !h && !d) return '—'
  return [w, h, d].map(v => v ? `${v}` : '?').join(' × ') + ' cm'
}

export default function EngineeringPage() {
  const navigate = useNavigate()
  const [products, setProducts]       = useState<EngineeringProduct[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [catFilter, setCatFilter]     = useState<ProductCategory | ''>('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('')
  const [showNew, setShowNew]         = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await listProducts(search, catFilter, statusFilter)
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, catFilter, statusFilter])

  const total     = products.length
  const ativos    = products.filter(p => p.status === 'ativo').length
  const revisao   = products.filter(p => p.status === 'em_revisao').length

  const selectStyle = {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#0f172a',
    cursor: 'pointer',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#0f172a' }}>
            <Wrench size={26} style={{ color: '#00c896' }} />
            Engenharia
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Fichas técnicas e lista de materiais dos produtos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="p-2.5 rounded-lg transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#fff' }}>
            <Plus size={16} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-5 mb-7">
        {[
          { label: 'Total de Produtos', value: total, icon: Package, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Ativos', value: ativos, icon: CheckCircle, color: '#00c896', bg: 'rgba(0,200,150,0.1)' },
          { label: 'Em Revisão', value: revisao, icon: Clock, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: card.bg }}>
              <card.icon size={22} style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: '#64748b' }}>{card.label}</p>
              <p className="text-3xl font-bold mt-0.5" style={{ color: '#0f172a' }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, código ou material..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value as ProductCategory | '')}
          className="px-3 py-2.5 rounded-lg text-sm outline-none" style={selectStyle}>
          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ProductStatus | '')}
          className="px-3 py-2.5 rounded-lg text-sm outline-none" style={selectStyle}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              {['Código', 'Produto', 'Categoria', 'Dimensões (L×A×P)', 'Material / Acabamento', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-16 text-center" style={{ color: '#64748b' }}>
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Carregando produtos...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <Wrench size={32} className="mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    {search || catFilter || statusFilter
                      ? 'Nenhum produto encontrado para os filtros aplicados.'
                      : 'Nenhum produto cadastrado ainda.'}
                  </p>
                  {!search && !catFilter && !statusFilter && (
                    <button onClick={() => setShowNew(true)} className="mt-3 text-sm font-medium" style={{ color: '#00c896' }}>
                      + Cadastrar primeiro produto
                    </button>
                  )}
                </td>
              </tr>
            ) : products.map((p, i) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/engenharia/${p.id}`)}
                style={{
                  background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,200,150,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#f8fafc')}>

                <td className="px-4 py-3.5">
                  <span className="text-xs font-mono font-medium" style={{ color: '#00c896' }}>{p.code}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-medium" style={{ color: '#0f172a' }}>{p.name}</div>
                  {p.description && (
                    <div className="text-xs mt-0.5 truncate max-w-xs" style={{ color: '#94a3b8' }}>{p.description}</div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm" style={{ color: '#64748b' }}>{CATEGORY_LABELS[p.category]}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-mono" style={{ color: '#475569' }}>
                    {fmtDim(p.width_cm, p.height_cm, p.depth_cm)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm" style={{ color: '#475569' }}>{p.material || '—'}</div>
                  {p.finish && <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{p.finish}</div>}
                </td>
                <td className="px-4 py-3.5">
                  <EngineeringStatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <EngineeringProductFormModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSaved={product => {
            setProducts(prev => [product, ...prev])
            setShowNew(false)
          }}
        />
      )}
    </div>
  )
}
