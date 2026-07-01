import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, CalendarCheck2, Clock, CheckCircle2, XCircle, PlayCircle } from 'lucide-react'
import { listInstallations } from '../services/installationService'
import type { InstallationOrder, InstallationStatus } from '../types'
import InstallationStatusBadge from '../components/InstallationStatusBadge'
import InstallationFormModal from '../components/InstallationFormModal'

const STATUS_OPTIONS: { value: InstallationStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'agendado', label: 'Agendado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
]

function fmtDate(str: string): string {
  return new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function InstallationPage() {
  const navigate = useNavigate()
  const [items, setItems]             = useState<InstallationOrder[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatus]     = useState<InstallationStatus | ''>('')
  const [showNew, setShowNew]         = useState(false)

  async function load() {
    setLoading(true)
    try {
      setItems(await listInstallations(search, statusFilter))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, statusFilter])

  const hoje = new Date().toISOString().split('T')[0]

  const agendadas   = items.filter(i => i.status === 'agendado').length
  const andamento   = items.filter(i => i.status === 'em_andamento').length
  const concluidasHoje = items.filter(i => i.status === 'concluido' && i.updated_at?.slice(0, 10) === hoje).length
  const atrasadas   = items.filter(i => i.status === 'agendado' && i.scheduled_date < hoje).length

  const selectStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', cursor: 'pointer' }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#0f172a' }}>
            <CalendarCheck2 size={26} style={{ color: '#00c896' }} />
            Instalações
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Agendamento e controle de visitas técnicas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2.5 rounded-lg transition-all" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#fff' }}>
            <Plus size={16} />
            Nova Instalação
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-4 gap-5 mb-7">
        {[
          { label: 'Agendadas', value: agendadas, icon: Clock, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Em Andamento', value: andamento, icon: PlayCircle, color: '#00c896', bg: 'rgba(0,200,150,0.1)' },
          { label: 'Concluídas Hoje', value: concluidasHoje, icon: CheckCircle2, color: '#4ade80', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Atrasadas', value: atrasadas, icon: XCircle, color: '#f87171', bg: 'rgba(239,68,68,0.1)' },
        ].map(card => (
          <div
            key={card.label}
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.bg }}>
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
            placeholder="Buscar por cliente, código ou técnico..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatus(e.target.value as InstallationStatus | '')}
          className="px-3 py-2.5 rounded-lg text-sm outline-none" style={selectStyle}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
              {['Código', 'Cliente', 'Endereço', 'Data / Horário', 'Técnico', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center" style={{ color: '#64748b' }}>
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                Carregando instalações...
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center">
                <CalendarCheck2 size={32} className="mx-auto mb-3" style={{ color: '#cbd5e1' }} />
                <p className="text-sm" style={{ color: '#64748b' }}>
                  {search || statusFilter ? 'Nenhuma instalação encontrada para os filtros.' : 'Nenhuma instalação cadastrada.'}
                </p>
                {!search && !statusFilter && (
                  <button onClick={() => setShowNew(true)} className="mt-3 text-sm font-medium" style={{ color: '#00c896' }}>
                    + Agendar primeira instalação
                  </button>
                )}
              </td></tr>
            ) : items.map((inst, i) => {
              const atrasada = inst.status === 'agendado' && inst.scheduled_date < hoje
              return (
                <tr
                  key={inst.id}
                  onClick={() => navigate(`/instalacao/${inst.id}`)}
                  style={{
                    background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,200,150,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#ffffff' : '#f8fafc')}>

                  <td className="px-4 py-3.5">
                    <span className="text-xs font-mono font-medium" style={{ color: '#00c896' }}>{inst.code}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-sm font-medium" style={{ color: '#0f172a' }}>{inst.customer_name}</div>
                    {inst.sales_order_code && (
                      <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Pedido: {inst.sales_order_code}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm truncate max-w-xs block" style={{ color: '#64748b' }}>{inst.customer_address || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {atrasada && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f87171' }} />}
                      <span className="text-sm font-medium" style={{ color: atrasada ? '#f87171' : '#0f172a' }}>
                        {fmtDate(inst.scheduled_date)}
                      </span>
                    </div>
                    {inst.scheduled_time && (
                      <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{inst.scheduled_time}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm" style={{ color: '#475569' }}>{inst.technician || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <InstallationStatusBadge status={inst.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <InstallationFormModal
          mode="create"
          onClose={() => setShowNew(false)}
          onSaved={inst => { setItems(prev => [inst, ...prev]); setShowNew(false) }}
        />
      )}
    </div>
  )
}
