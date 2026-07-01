import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw, DollarSign, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { listFinancialEntries } from '../services/financialService'
import type { FinancialEntry, FinancialInstallment, InstallmentStatus } from '../types'
import FinancialFormModal from '../components/FinancialFormModal'

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

// Calcula status real considerando vencimento (o DB mantém 'pendente' até ser pago)
function effectiveStatus(inst: FinancialInstallment): InstallmentStatus {
  if (inst.status !== 'pendente') return inst.status
  const due = new Date(inst.due_date + 'T23:59:59')
  return due < new Date() ? 'vencido' : 'pendente'
}

function getEntryInstallmentSummary(entry: FinancialEntry) {
  const inst = entry.installments ?? []
  const paid    = inst.filter(i => effectiveStatus(i) === 'pago').length
  const overdue = inst.filter(i => effectiveStatus(i) === 'vencido').length
  const nextPending = inst.find(i => {
    const s = effectiveStatus(i)
    return s === 'pendente' || s === 'vencido'
  })
  return { total: inst.length, paid, overdue, nextPending }
}

function getEntryOverallStatus(entry: FinancialEntry): string {
  const inst = entry.installments ?? []
  if (entry.status === 'cancelado') return 'Cancelado'
  if (inst.length === 0) return '—'
  const statuses = inst.map(effectiveStatus)
  if (statuses.every(s => s === 'pago')) return 'Quitado'
  if (statuses.some(s => s === 'vencido')) return 'Vencido'
  if (statuses.some(s => s === 'pago')) return 'Parcial'
  return 'Pendente'
}

type TabType = 'todos' | 'receita' | 'despesa'

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  'Quitado':   { bg: 'rgba(0,200,150,0.15)',  text: '#00a07a' },
  'Pendente':  { bg: 'rgba(245,158,11,0.12)', text: '#d97706' },
  'Vencido':   { bg: 'rgba(239,68,68,0.12)',  text: '#dc2626' },
  'Parcial':   { bg: 'rgba(59,130,246,0.12)', text: '#2563eb' },
  'Cancelado': { bg: 'rgba(100,116,139,0.1)', text: '#64748b' },
  '—':         { bg: 'transparent',           text: '#94a3b8' },
}

export default function FinancialPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [tab, setTab] = useState<TabType>('todos')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)

  async function load() {
    setLoading(true)
    setLoadError('')
    try { setEntries(await listFinancialEntries()) }
    catch (err: unknown) { setLoadError(err instanceof Error ? err.message : 'Erro ao carregar lançamentos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const activeEntries = entries.filter(e => e.status !== 'cancelado' && !e.deleted_at)
  const allInstallments = activeEntries.flatMap(e => e.installments ?? [])

  const totalReceita = activeEntries
    .filter(e => e.type === 'receita')
    .flatMap(e => e.installments ?? [])
    .filter(i => effectiveStatus(i) === 'pendente')
    .reduce((sum, i) => sum + i.amount, 0)

  const countReceita = activeEntries
    .filter(e => e.type === 'receita')
    .flatMap(e => e.installments ?? [])
    .filter(i => effectiveStatus(i) === 'pendente').length

  const totalDespesa = activeEntries
    .filter(e => e.type === 'despesa')
    .flatMap(e => e.installments ?? [])
    .filter(i => effectiveStatus(i) === 'pendente')
    .reduce((sum, i) => sum + i.amount, 0)

  const countDespesa = activeEntries
    .filter(e => e.type === 'despesa')
    .flatMap(e => e.installments ?? [])
    .filter(i => effectiveStatus(i) === 'pendente').length

  const totalVencido = allInstallments
    .filter(i => effectiveStatus(i) === 'vencido')
    .reduce((sum, i) => sum + i.amount, 0)

  const countVencido = allInstallments.filter(i => effectiveStatus(i) === 'vencido').length

  const saldoPrevisto = totalReceita - totalDespesa

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    const matchTab = tab === 'todos' || e.type === tab
    const matchSearch = !search ||
      e.code.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.reference_code ?? '').toLowerCase().includes(q)
    return matchTab && matchSearch && !e.deleted_at
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: '#0f172a' }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
              <DollarSign size={20} style={{ color: '#fff' }} />
            </div>
            Financeiro
          </h1>
          <p className="text-sm mt-1 ml-[52px]" style={{ color: '#64748b' }}>
            {entries.filter(e => !e.deleted_at).length} lançamento{entries.length !== 1 ? 's' : ''} cadastrado{entries.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load}
            className="p-2.5 rounded-xl transition-all"
            style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#fff', boxShadow: '0 4px 12px rgba(0,200,150,0.3)' }}>
            <Plus size={16} />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* Visão Geral */}
      <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: '#94a3b8' }}>VISÃO GERAL</p>
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>

        {/* A Receber */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: '4px solid #00c896', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider" style={{ color: '#64748b' }}>A RECEBER</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
              <TrendingUp size={15} style={{ color: '#00c896' }} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold leading-none" style={{ color: '#0f172a' }}>
              {formatCurrency(totalReceita)}
            </p>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              {countReceita} parcela{countReceita !== 1 ? 's' : ''} pendente{countReceita !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* A Pagar */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider" style={{ color: '#64748b' }}>A PAGAR</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <TrendingDown size={15} style={{ color: '#ef4444' }} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold leading-none" style={{ color: '#0f172a' }}>
              {formatCurrency(totalDespesa)}
            </p>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              {countDespesa} parcela{countDespesa !== 1 ? 's' : ''} pendente{countDespesa !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Vencidos */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{
            background: totalVencido > 0 ? 'rgba(245,158,11,0.04)' : '#fff',
            border: `1px solid ${totalVencido > 0 ? 'rgba(245,158,11,0.3)' : '#e2e8f0'}`,
            borderLeft: `4px solid ${totalVencido > 0 ? '#f59e0b' : '#e2e8f0'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider" style={{ color: '#64748b' }}>VENCIDOS</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: totalVencido > 0 ? 'rgba(245,158,11,0.12)' : '#f1f5f9' }}>
              <AlertTriangle size={15} style={{ color: totalVencido > 0 ? '#f59e0b' : '#cbd5e1' }} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold leading-none"
              style={{ color: totalVencido > 0 ? '#d97706' : '#0f172a' }}>
              {formatCurrency(totalVencido)}
            </p>
            <p className="text-xs mt-2" style={{ color: totalVencido > 0 ? '#f59e0b' : '#94a3b8' }}>
              {countVencido > 0 ? `${countVencido} em atraso` : 'Nenhum em atraso'}
            </p>
          </div>
        </div>

        {/* Saldo Previsto */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-3"
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderLeft: `4px solid ${saldoPrevisto >= 0 ? '#60a5fa' : '#ef4444'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider" style={{ color: '#64748b' }}>SALDO PREVISTO</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: saldoPrevisto >= 0 ? 'rgba(96,165,250,0.1)' : 'rgba(239,68,68,0.1)' }}>
              <DollarSign size={15} style={{ color: saldoPrevisto >= 0 ? '#60a5fa' : '#ef4444' }} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold leading-none"
              style={{ color: saldoPrevisto >= 0 ? '#1d4ed8' : '#dc2626' }}>
              {formatCurrency(saldoPrevisto)}
            </p>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              receber − pagar (pendentes)
            </p>
          </div>
        </div>
      </div>

      {/* Seção Lançamentos */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold tracking-widest" style={{ color: '#94a3b8' }}>LANÇAMENTOS</p>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden p-1" style={{ background: '#f1f5f9' }}>
            {(['todos', 'receita', 'despesa'] as TabType[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#0f172a' : '#64748b',
                  boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>
                {t === 'todos' ? 'Todos' : t === 'receita' ? '↑ Receitas' : '↓ Despesas'}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm"
            style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', outline: 'none', width: 200 }}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th className="px-5 py-4 text-left font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>CÓDIGO</th>
              <th className="px-5 py-4 text-left font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>TIPO</th>
              <th className="px-5 py-4 text-left font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>DESCRIÇÃO</th>
              <th className="px-5 py-4 text-left font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>CATEGORIA</th>
              <th className="px-5 py-4 text-left font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>ORIGEM</th>
              <th className="px-5 py-4 text-right font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>VALOR</th>
              <th className="px-5 py-4 text-center font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>PARCELAS</th>
              <th className="px-5 py-4 text-left font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>PRÓX. VENC.</th>
              <th className="px-5 py-4 text-center font-semibold text-xs tracking-wider" style={{ color: '#94a3b8' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} className="px-5 py-12 text-center" style={{ color: '#94a3b8' }}>
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" style={{ color: '#00c896' }} />
                Carregando...
              </td></tr>
            )}
            {!loading && loadError && (
              <tr><td colSpan={9} className="px-5 py-10 text-center" style={{ color: '#ef4444' }}>{loadError}</td></tr>
            )}
            {!loading && !loadError && filtered.length === 0 && (
              <tr><td colSpan={9} className="px-5 py-12 text-center">
                <DollarSign size={32} className="mx-auto mb-3" style={{ color: '#e2e8f0' }} />
                <p style={{ color: '#94a3b8' }}>
                  {search || tab !== 'todos' ? 'Nenhum lançamento encontrado.' : 'Nenhum lançamento cadastrado ainda.'}
                </p>
              </td></tr>
            )}
            {!loading && !loadError && filtered.map((entry, i) => {
              const { total, paid, overdue, nextPending } = getEntryInstallmentSummary(entry)
              const overallStatus = getEntryOverallStatus(entry)
              const statusColor = STATUS_BADGE[overallStatus] ?? STATUS_BADGE['—']
              const progressPct = total > 0 ? (paid / total) * 100 : 0
              return (
                <tr
                  key={entry.id}
                  onClick={() => navigate(`/financeiro/${entry.id}`)}
                  className="cursor-pointer transition-colors group"
                  style={{
                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                    borderTop: '1px solid #f1f5f9',
                    minHeight: 56,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf9')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')}>

                  <td className="px-5 py-4 font-mono text-xs" style={{ color: '#94a3b8' }}>{entry.code}</td>

                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: entry.type === 'receita' ? 'rgba(0,200,150,0.1)' : 'rgba(239,68,68,0.1)',
                        color: entry.type === 'receita' ? '#00a07a' : '#dc2626',
                      }}>
                      {entry.type === 'receita' ? '↑' : '↓'}
                      {entry.type === 'receita' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>

                  <td className="px-5 py-4" style={{ maxWidth: 200 }}>
                    <p className="truncate font-medium" style={{ color: '#0f172a' }}>{entry.description}</p>
                  </td>

                  <td className="px-5 py-4" style={{ color: '#64748b' }}>{entry.category || '—'}</td>

                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 font-mono text-xs" style={{ color: '#94a3b8' }}>
                      {entry.reference_code ?? 'Manual'}
                      {entry.reference_code && (
                        <ArrowUpRight size={11} style={{ color: '#cbd5e1' }} />
                      )}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right font-semibold" style={{ color: '#0f172a' }}>
                    {formatCurrency(entry.total_amount)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs font-medium" style={{ color: '#64748b' }}>
                        {paid}/{total}
                        {overdue > 0 && (
                          <span className="ml-1" style={{ color: '#ef4444' }}>({overdue}⚠)</span>
                        )}
                      </span>
                      {total > 0 && (
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progressPct}%`,
                              background: progressPct === 100 ? '#00c896' : '#60a5fa',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4" style={{ color: overdue > 0 ? '#ef4444' : '#64748b' }}>
                    {nextPending ? formatDate(nextPending.due_date) : '—'}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: statusColor.bg, color: statusColor.text }}>
                      {overallStatus}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showNew && (
        <FinancialFormModal
          onClose={() => setShowNew(false)}
          onSaved={entry => { setEntries(prev => [entry, ...prev]); setShowNew(false) }}
        />
      )}
    </div>
  )
}
