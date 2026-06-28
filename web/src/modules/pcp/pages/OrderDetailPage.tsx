import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, XCircle, RefreshCw, Calendar,
  User, FolderOpen, AlertTriangle, FileText, Factory
} from 'lucide-react'
import { getOrderById, updateOrderStatus, deleteProductionOrder } from '../services/productionOrderService'
import type { ProductionOrder, ProductionOrderStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../types'
import StatusBadge from '../components/StatusBadge'
import EditOrderModal from '../components/EditOrderModal'

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function isOverdue(order: ProductionOrder): boolean {
  if (!order.delivery_date) return false
  if (['entregue', 'cancelado'].includes(order.status)) return false
  return order.delivery_date < new Date().toISOString().slice(0, 10)
}

const NEXT_STATUS: Partial<Record<ProductionOrderStatus, ProductionOrderStatus>> = {
  aguardando_conferencia: 'em_projeto',
  em_projeto: 'conferencia_tecnica',
  conferencia_tecnica: 'aguardando_aprovacao',
  aguardando_aprovacao: 'em_producao',
  em_producao: 'montagem_interna',
  montagem_interna: 'pintura',
  pintura: 'expedicao',
  expedicao: 'entregue',
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<ProductionOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const data = await getOrderById(id)
      setOrder(data)
    } catch {
      setError('Ordem não encontrada.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleAdvanceStatus() {
    if (!order) return
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setActionLoading(true)
    try {
      await updateOrderStatus(order.id, next)
      setOrder(prev => prev ? { ...prev, status: next } : prev)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!order) return
    setActionLoading(true)
    try {
      await deleteProductionOrder(order.id)
      navigate('/pcp')
    } finally {
      setActionLoading(false)
      setShowCancelConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={22} className="animate-spin" style={{ color: '#00c896' }} />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Factory size={36} style={{ color: '#1e3a5f' }} />
        <p style={{ color: '#475569' }}>{error || 'Ordem não encontrada.'}</p>
        <button onClick={() => navigate('/pcp')} style={{ color: '#00c896' }} className="text-sm font-medium">
          ← Voltar ao PCP
        </button>
      </div>
    )
  }

  const overdue = isOverdue(order)
  const nextStatus = NEXT_STATUS[order.status]
  const isFinal = order.status === 'entregue' || order.status === 'cancelado'

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/pcp')}
          className="p-2 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold font-mono" style={{ color: '#00c896' }}>
              {order.reference_number}
            </span>
            <StatusBadge status={order.status} />
            {overdue && (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                <AlertTriangle size={11} /> Atrasada
              </span>
            )}
          </div>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>
            Criada em {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isFinal && (
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
              <Pencil size={14} />
              Editar
            </button>
          )}
          {!isFinal && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
              <XCircle size={14} />
              Cancelar Ordem
            </button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <InfoCard icon={<User size={15} />} label="Cliente" value={order.client_name} />
        <InfoCard icon={<FolderOpen size={15} />} label="Projeto" value={order.project_name} />
        <InfoCard
          icon={<AlertTriangle size={15} />}
          label="Prioridade"
          value={PRIORITY_LABELS[order.priority]}
          valueColor={PRIORITY_COLORS[order.priority]}
        />
        <InfoCard icon={<Calendar size={15} />} label="Data da Venda" value={formatDate(order.sale_date)} />
        <InfoCard
          icon={<Calendar size={15} />}
          label="Previsão de Entrega"
          value={formatDate(order.delivery_date)}
          valueColor={overdue ? '#f87171' : undefined}
        />
        <InfoCard
          icon={<RefreshCw size={15} />}
          label="Última Atualização"
          value={formatDateTime(order.updated_at)}
        />
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="rounded-xl p-5 mb-6"
          style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} style={{ color: '#475569' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
              Observações
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{order.notes}</p>
        </div>
      )}

      {/* Status Pipeline */}
      <div className="rounded-xl p-5 mb-6"
        style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>
          Fluxo de Produção
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(STATUS_LABELS) as [ProductionOrderStatus, string][])
            .filter(([s]) => s !== 'cancelado')
            .map(([s, label]) => {
              const statuses: ProductionOrderStatus[] = [
                'aguardando_conferencia', 'em_projeto', 'conferencia_tecnica',
                'aguardando_aprovacao', 'em_producao', 'montagem_interna',
                'pintura', 'expedicao', 'entregue',
              ]
              const currentIdx = statuses.indexOf(order.status)
              const thisIdx = statuses.indexOf(s)
              const isPast = thisIdx < currentIdx
              const isCurrent = s === order.status
              const { bg, text } = STATUS_COLORS[s]

              return (
                <span key={s}
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: isCurrent ? bg : isPast ? 'rgba(0,200,150,0.06)' : 'rgba(255,255,255,0.04)',
                    color: isCurrent ? text : isPast ? '#334155' : '#334155',
                    border: isCurrent ? `1px solid ${text}40` : '1px solid transparent',
                    textDecoration: isPast ? 'line-through' : 'none',
                  }}>
                  {label}
                </span>
              )
            })}
        </div>
      </div>

      {/* Action: Advance Status */}
      {nextStatus && (
        <div className="flex justify-end">
          <button
            disabled={actionLoading}
            onClick={handleAdvanceStatus}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #00c896, #00a07a)',
              color: '#0a1628',
              opacity: actionLoading ? 0.7 : 1,
            }}>
            {actionLoading
              ? <RefreshCw size={15} className="animate-spin" />
              : null}
            Avançar para: {STATUS_LABELS[nextStatus]}
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <EditOrderModal
          order={order}
          onClose={() => setShowEdit(false)}
          onUpdated={updated => {
            setOrder(updated)
            setShowEdit(false)
          }}
        />
      )}

      {/* Cancel Confirm */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: '#0f2040', border: '1px solid rgba(239,68,68,0.3)' }}>
            <XCircle size={32} className="mx-auto mb-4" style={{ color: '#f87171' }} />
            <h3 className="text-white font-semibold text-center mb-2">Cancelar Ordem?</h3>
            <p className="text-sm text-center mb-6" style={{ color: '#64748b' }}>
              A ordem <span className="font-mono font-semibold" style={{ color: '#00c896' }}>
                {order.reference_number}
              </span> será marcada como cancelada e removida do fluxo de produção.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-3 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Voltar
              </button>
              <button onClick={handleCancel} disabled={actionLoading}
                className="flex-1 py-3 rounded-lg text-sm font-semibold transition-opacity"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCard({
  icon, label, value, valueColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="rounded-xl p-4"
      style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: '#475569' }}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
          {label}
        </span>
      </div>
      <p className="text-sm font-medium" style={{ color: valueColor ?? '#e2e8f0' }}>
        {value}
      </p>
    </div>
  )
}
