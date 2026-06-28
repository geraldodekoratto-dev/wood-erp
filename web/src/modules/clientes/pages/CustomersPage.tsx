import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Users } from 'lucide-react'
import { listCustomers } from '../services/customerService'
import type { Customer, CustomerType, CustomerStatus } from '../types'
import { TYPE_LABELS, STATUS_LABELS } from '../types'
import { CustomerTypeBadge, CustomerStatusBadge } from '../components/CustomerBadges'
import CustomerFormModal from '../components/CustomerFormModal'

const TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'pf', label: 'Pessoa Física' },
  { value: 'pj', label: 'Pessoa Jurídica' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
]

export default function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showNew, setShowNew] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await listCustomers()
      setCustomers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      c.name.toLowerCase().includes(q) ||
      (c.document ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.city ?? '').toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    const matchType = !typeFilter || c.type === typeFilter
    const matchStatus = !statusFilter || c.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  const selectStyle = {
    background: '#0f2040',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    cursor: 'pointer',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users size={26} style={{ color: '#00c896' }} />
            Clientes
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            {customers.length} cliente{customers.length !== 1 ? 's' : ''} cadastrado{customers.length !== 1 ? 's' : ''}
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
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, e-mail, cidade..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={selectStyle}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={selectStyle}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#0f2040', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Código', 'Tipo', 'Nome', 'Documento', 'Contato', 'Cidade / UF', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center" style={{ color: '#475569' }}>
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                  Carregando clientes...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <Users size={32} className="mx-auto mb-3" style={{ color: '#1e3a5f' }} />
                  <p className="text-sm" style={{ color: '#475569' }}>
                    {search || typeFilter || statusFilter
                      ? 'Nenhum cliente encontrado para os filtros aplicados.'
                      : 'Nenhum cliente cadastrado ainda.'}
                  </p>
                  {!search && !typeFilter && !statusFilter && (
                    <button onClick={() => setShowNew(true)}
                      className="mt-3 text-sm font-medium" style={{ color: '#00c896' }}>
                      + Cadastrar primeiro cliente
                    </button>
                  )}
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id}
                onClick={() => navigate(`/clientes/${c.id}`)}
                style={{
                  background: i % 2 === 0 ? 'rgba(15,32,64,0.5)' : 'rgba(10,22,40,0.5)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,200,150,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(15,32,64,0.5)' : 'rgba(10,22,40,0.5)')}>

                <td className="px-4 py-3.5">
                  <span className="text-xs font-mono font-medium" style={{ color: '#00c896' }}>{c.code}</span>
                </td>
                <td className="px-4 py-3.5">
                  <CustomerTypeBadge type={c.type} />
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-medium text-white">{c.name}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-mono" style={{ color: '#64748b' }}>{c.document || '—'}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-sm" style={{ color: '#94a3b8' }}>{c.email || '—'}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#475569' }}>{c.mobile || c.phone || ''}</div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm" style={{ color: '#64748b' }}>
                    {c.city && c.state ? `${c.city} / ${c.state}` : c.city || '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <CustomerStatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <CustomerFormModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSaved={customer => {
            setCustomers(prev => [customer, ...prev])
            setShowNew(false)
          }}
        />
      )}
    </div>
  )
}
