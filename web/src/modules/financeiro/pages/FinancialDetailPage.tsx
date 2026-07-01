import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, XCircle, RefreshCw,
  ExternalLink, TrendingUp, TrendingDown,
} from 'lucide-react'
import { getFinancialEntryById, cancelFinancialEntry } from '../services/financialService'
import type { FinancialEntry, FinancialInstallment } from '../types'
import { PAYMENT_METHOD_LABELS } from '../types'
import FinancialStatusBadge from '../components/FinancialStatusBadge'
import RegisterPaymentModal from '../components/RegisterPaymentModal'

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR')
}

function isOverdue(installment: FinancialInstallment): boolean {
  if (installment.status !== 'pendente') return false
  const due = new Date(installment.due_date + 'T23:59:59')
  return due < new Date()
}

function getReferenceLink(entry: FinancialEntry): string | null {
  if (!entry.reference_type || !entry.reference_id) return null
  if (entry.reference_type === 'sales_order') return `/vendas/${entry.reference_id}`
  if (entry.reference_type === 'purchase_order') return `/compras/${entry.reference_id}`
  return null
}

export default function FinancialDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [entry, setEntry] = useState<FinancialEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [payingInstallment, setPayingInstallment] = useState<FinancialInstallment | null>(null)

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try { setEntry(await getFinancialEntryById(id)) }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Erro ao carregar lançamento.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  async function handleCancel() {
    if (!entry) return
    const hasPaid = (entry.installments ?? []).some(i => i.status === 'pago')
    if (hasPaid) {
      alert('Não é possível cancelar: já existe parcela paga neste lançamento.')
      return
    }
    if (!confirm('Cancelar este lançamento? Todas as parcelas pendentes serão canceladas.')) return

    setCancelling(true)
    try {
      await cancelFinancialEntry(entry.id)
      await load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar.')
    } finally {
      setCancelling(false)
    }
  }

  function handlePaymentRegistered(updated: FinancialInstallment) {
    setEntry(prev => {
      if (!prev) return prev
      return {
        ...prev,
        installments: (prev.installments ?? []).map(i =>
          i.id === updated.id ? updated : i
        ),
      }
    })
    setPayingInstallment(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin" style={{ color: '#00c896' }} />
    </div>
  )

  if (error) return (
    <div className="text-center py-20">
      <p style={{ color: '#ef4444' }}>{error}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-sm" style={{ color: '#64748b' }}>← Voltar</button>
    </div>
  )

  if (!entry) return null

  const installments = entry.installments ?? []
  const referenceLink = getReferenceLink(entry)

  const totalPaid = installments.filter(i => i.status === 'pago').reduce((s, i) => s + i.amount, 0)
  const totalPending = installments.filter(i => i.status === 'pendente' || i.status === 'vencido').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/financeiro')}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          style={{ color: '#64748b' }}>
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: entry.type === 'receita'
                  ? 'rgba(0,200,150,0.12)'
                  : 'rgba(239,68,68,0.12)',
              }}>
              {entry.type === 'receita'
                ? <TrendingUp size={18} style={{ color: '#00c896' }} />
                : <TrendingDown size={18} style={{ color: '#ef4444' }} />}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>{entry.description}</h1>
              <p className="text-sm font-mono" style={{ color: '#94a3b8' }}>{entry.code}</p>
            </div>
          </div>
        </div>
        {entry.status === 'ativo' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            <XCircle size={15} />
            {cancelling ? 'Cancelando...' : 'Cancelar Lançamento'}
          </button>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>TIPO</p>
          <span
            className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold"
            style={{
              background: entry.type === 'receita' ? 'rgba(0,200,150,0.12)' : 'rgba(239,68,68,0.12)',
              color: entry.type === 'receita' ? '#00a07a' : '#ef4444',
            }}>
            {entry.type === 'receita' ? '↑ Receita' : '↓ Despesa'}
          </span>
        </div>

        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>CATEGORIA</p>
          <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{entry.category || '—'}</p>
        </div>

        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>ORIGEM</p>
          {referenceLink ? (
            <Link
              to={referenceLink}
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: '#60a5fa' }}
              onClick={e => e.stopPropagation()}>
              <ExternalLink size={13} />
              {entry.reference_code}
            </Link>
          ) : (
            <p className="text-sm font-medium" style={{ color: '#0f172a' }}>Manual</p>
          )}
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>VALOR TOTAL</p>
          <p className="text-2xl font-bold" style={{ color: '#0f172a' }}>{formatCurrency(entry.total_amount)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#00a07a' }}>JÁ PAGO</p>
          <p className="text-2xl font-bold" style={{ color: '#00c896' }}>{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: totalPending > 0 ? 'rgba(245,158,11,0.05)' : '#fff', border: `1px solid ${totalPending > 0 ? 'rgba(245,158,11,0.2)' : '#e2e8f0'}` }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>RESTANTE</p>
          <p className="text-2xl font-bold" style={{ color: totalPending > 0 ? '#f59e0b' : '#0f172a' }}>
            {formatCurrency(totalPending)}
          </p>
        </div>
      </div>

      {/* Tabela de parcelas */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>
            Parcelas ({installments.length})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th className="px-5 py-3 text-left font-semibold" style={{ color: '#64748b', width: 50 }}>#</th>
              <th className="px-5 py-3 text-right font-semibold" style={{ color: '#64748b' }}>Valor</th>
              <th className="px-5 py-3 text-left font-semibold" style={{ color: '#64748b' }}>Vencimento</th>
              <th className="px-5 py-3 text-center font-semibold" style={{ color: '#64748b' }}>Status</th>
              <th className="px-5 py-3 text-left font-semibold" style={{ color: '#64748b' }}>Data Pgto</th>
              <th className="px-5 py-3 text-left font-semibold" style={{ color: '#64748b' }}>Forma</th>
              <th className="px-5 py-3 text-center font-semibold" style={{ color: '#64748b' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {installments.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: '#94a3b8' }}>
                Nenhuma parcela registrada.
              </td></tr>
            )}
            {installments.map((inst, i) => {
              const overdue = isOverdue(inst)
              const displayStatus = overdue ? 'vencido' : inst.status
              const canPay = entry.status === 'ativo' && (inst.status === 'pendente' || inst.status === 'vencido')
              return (
                <tr
                  key={inst.id}
                  style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                  <td className="px-5 py-3.5 font-semibold" style={{ color: '#94a3b8' }}>{inst.installment_number}</td>
                  <td className="px-5 py-3.5 text-right font-semibold" style={{ color: '#0f172a' }}>
                    {formatCurrency(inst.amount)}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: overdue ? '#ef4444' : '#64748b' }}>
                    {formatDate(inst.due_date)}
                    {overdue && <span className="ml-1.5 text-xs font-semibold">⚠️</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <FinancialStatusBadge status={displayStatus} />
                  </td>
                  <td className="px-5 py-3.5" style={{ color: '#64748b' }}>
                    {formatDate(inst.payment_date)}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: '#64748b' }}>
                    {inst.payment_method
                      ? PAYMENT_METHOD_LABELS[inst.payment_method as keyof typeof PAYMENT_METHOD_LABELS] ?? inst.payment_method
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {canPay && (
                      <button
                        onClick={() => setPayingInstallment(inst)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all mx-auto"
                        style={{ background: 'rgba(0,200,150,0.12)', color: '#00a07a' }}>
                        <CheckCircle size={13} />
                        Registrar Pgto
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Observações */}
      {entry.notes && (
        <div className="mt-4 rounded-xl px-4 py-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>OBSERVAÇÕES</p>
          <p className="text-sm" style={{ color: '#0f172a' }}>{entry.notes}</p>
        </div>
      )}

      {payingInstallment && (
        <RegisterPaymentModal
          installment={payingInstallment}
          onClose={() => setPayingInstallment(null)}
          onPaid={handlePaymentRegistered}
        />
      )}
    </div>
  )
}
