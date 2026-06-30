import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, XCircle, RefreshCw, ShoppingCart,
  User, Calendar, DollarSign, FileText, Factory, CheckCircle2, AlertTriangle
} from 'lucide-react'
import {
  getSalesOrderById, confirmSalesOrder,
  updateSalesOrderStatus, cancelSalesOrder,
} from '../services/salesOrderService'
import type { SalesOrder } from '../types'
import { STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../types'
import SalesOrderStatusBadge from '../components/SalesOrderStatusBadge'
import SalesOrderFormModal from '../components/SalesOrderFormModal'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCurrency(v: number | null) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type ConfirmPriority = 'baixa' | 'normal' | 'alta' | 'urgente'

export default function SalesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [confirmPriority, setConfirmPriority] = useState<ConfirmPriority>('normal')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  async function load() {
    if (!id) return
    setLoading(true)
    try { setOrder(await getSalesOrderById(id)) }
    catch { setError('Pedido não encontrado.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  async function handleConfirm() {
    if (!order) return
    setActionLoading(true)
    setActionError('')
    try {
      const updated = await confirmSalesOrder(order, confirmPriority)
      setOrder(updated)
      setShowConfirm(false)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao confirmar pedido.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!order) return
    setActionLoading(true)
    setActionError('')
    try {
      await cancelSalesOrder(order.id)
      setOrder(prev => prev ? { ...prev, status: 'cancelado' } : prev)
      setShowCancel(false)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao cancelar pedido.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleMarkDelivered() {
    if (!order) return
    setActionLoading(true)
    try {
      await updateSalesOrderStatus(order.id, 'entregue')
      setOrder(prev => prev ? { ...prev, status: 'entregue' } : prev)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={22} className="animate-spin" style={{ color: '#00c896' }} />
    </div>
  )

  if (error || !order) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <ShoppingCart size={36} style={{ color: '#1e3a5f' }} />
      <p style={{ color: '#475569' }}>{error || 'Pedido não encontrado.'}</p>
      <button onClick={() => navigate('/vendas')} style={{ color: '#00c896' }} className="text-sm font-medium">
        ← Voltar para Vendas
      </button>
    </div>
  )

  const isRascunho = order.status === 'rascunho'
  const isEmProducao = order.status === 'em_producao'
  const isFinal = ['entregue', 'cancelado'].includes(order.status)
  const today = new Date()
  const todayLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const isOverdue = order.delivery_date && order.delivery_date < todayLocal && !isFinal

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/vendas')}
          className="p-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-bold font-mono" style={{ color: '#00c896' }}>{order.code}</span>
            <SalesOrderStatusBadge status={order.status} />
            {isOverdue && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                <AlertTriangle size={11} /> Entrega atrasada
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>Criado em {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          {!isFinal && (
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
              <Pencil size={14} /> Editar
            </button>
          )}
          {!isFinal && (
            <button onClick={() => setShowCancel(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <XCircle size={14} /> Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <InfoCard icon={<User size={14} />} label="Cliente" value={order.customer_name} />
        <InfoCard icon={<Calendar size={14} />} label="Data da Venda" value={formatDate(order.sale_date)} />
        <InfoCard
          icon={<Calendar size={14} />} label="Previsão de Entrega"
          value={formatDate(order.delivery_date)}
          valueColor={isOverdue ? '#f87171' : undefined}
        />
        <InfoCard icon={<DollarSign size={14} />} label="Valor Total" value={formatCurrency(order.total_value)} valueColor="#00c896" />
      </div>

      {(order.payment_method || order.payment_terms) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {order.payment_method && (
            <InfoCard icon={<DollarSign size={14} />} label="Forma de Pagamento"
              value={PAYMENT_METHOD_LABELS[order.payment_method]} />
          )}
          {order.payment_terms && (
            <InfoCard icon={<FileText size={14} />} label="Condições de Pagamento" value={order.payment_terms} />
          )}
        </div>
      )}

      {order.description && (
        <div className="rounded-xl p-5 mb-4" style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Descrição dos Móveis</p>
          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{order.description}</p>
        </div>
      )}

      {order.notes && (
        <div className="rounded-xl p-5 mb-4" style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Observações</p>
          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{order.notes}</p>
        </div>
      )}

      {/* OP vinculada */}
      {order.production_order_id && (
        <div className="rounded-xl p-5 mb-6"
          style={{ background: 'rgba(0,200,150,0.06)', border: '1px solid rgba(0,200,150,0.2)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Factory size={16} style={{ color: '#00c896' }} />
              <p className="text-sm font-semibold" style={{ color: '#00c896' }}>Ordem de Produção vinculada</p>
            </div>
            <button
              onClick={() => navigate(`/pcp/${order.production_order_id}`)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(0,200,150,0.15)', color: '#00c896', border: '1px solid rgba(0,200,150,0.3)' }}>
              Ver no PCP →
            </button>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        {isRascunho && (
          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}>
            <Factory size={16} />
            Confirmar e Gerar OP
          </button>
        )}
        {isEmProducao && (
          <button onClick={handleMarkDelivered} disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', opacity: actionLoading ? 0.7 : 1 }}>
            <CheckCircle2 size={16} />
            Marcar como Entregue
          </button>
        )}
      </div>

      {/* Modal: Confirmar e Gerar OP */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
            style={{ background: '#0f2040', border: '1px solid rgba(0,200,150,0.3)' }}>
            <Factory size={32} className="mx-auto mb-4" style={{ color: '#00c896' }} />
            <h3 className="text-white font-semibold text-center text-lg mb-1">Confirmar Pedido</h3>
            <p className="text-sm text-center mb-5" style={{ color: '#64748b' }}>
              Uma <strong style={{ color: '#00c896' }}>Ordem de Produção</strong> será criada automaticamente no PCP
              para o pedido <span className="font-mono" style={{ color: '#00c896' }}>{order.code}</span>.
            </p>

            {actionError && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {actionError}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>Prioridade da OP</label>
              <div className="flex gap-2">
                {(['baixa', 'normal', 'alta', 'urgente'] as ConfirmPriority[]).map(p => (
                  <button key={p} type="button"
                    onClick={() => setConfirmPriority(p)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={confirmPriority === p
                      ? { background: '#00c896', color: '#0a1628' }
                      : { background: 'rgba(255,255,255,0.05)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowConfirm(false); setActionError('') }}
                className="flex-1 py-3 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancelar
              </button>
              <button onClick={handleConfirm} disabled={actionLoading}
                className="flex-[2] py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628', opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading && <RefreshCw size={14} className="animate-spin" />}
                {actionLoading ? 'Gerando OP...' : 'Confirmar e Gerar OP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancelar */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#0f2040', border: '1px solid rgba(239,68,68,0.3)' }}>
            <XCircle size={32} className="mx-auto mb-4" style={{ color: '#f87171' }} />
            <h3 className="text-white font-semibold text-center mb-2">Cancelar Pedido?</h3>
            <p className="text-sm text-center mb-4" style={{ color: '#64748b' }}>
              O pedido <span className="font-mono font-semibold" style={{ color: '#00c896' }}>{order.code}</span> será marcado como cancelado.
            </p>
            {order.production_order_id && (
              <div className="mb-4 px-3 py-2.5 rounded-lg text-xs"
                style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                Este pedido possui uma Ordem de Produção vinculada no PCP. Cancele-a manualmente se necessário.
              </div>
            )}
            {actionError && (
              <div className="mb-4 px-3 py-2.5 rounded-lg text-xs"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {actionError}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowCancel(false); setActionError('') }}
                className="flex-1 py-3 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Voltar
              </button>
              <button onClick={handleCancel} disabled={actionLoading}
                className="flex-1 py-3 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? 'Cancelando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <SalesOrderFormModal
          mode="edit"
          order={order}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setOrder(updated); setShowEdit(false) }}
        />
      )}
    </div>
  )
}

function InfoCard({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: '#475569' }}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{label}</span>
      </div>
      <p className="text-sm font-medium" style={{ color: valueColor ?? '#e2e8f0' }}>{value}</p>
    </div>
  )
}
