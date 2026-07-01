import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CalendarCheck2, Edit2, Trash2, RefreshCw,
  MapPin, User, Clock, FileText, ShoppingCart
} from 'lucide-react'
import {
  getInstallation, deleteInstallation, updateInstallationStatus
} from '../services/installationService'
import type { InstallationOrder, InstallationStatus } from '../types'
import { STATUS_LABELS } from '../types'
import InstallationStatusBadge from '../components/InstallationStatusBadge'
import InstallationFormModal from '../components/InstallationFormModal'

const NEXT_STATUS: Partial<Record<InstallationStatus, { to: InstallationStatus; label: string; color: string; bg: string }>> = {
  agendado:    { to: 'em_andamento', label: 'Iniciar Instalação', color: '#fff', bg: 'linear-gradient(135deg,#00c896,#00a07a)' },
  em_andamento:{ to: 'concluido',    label: 'Marcar Concluído',   color: '#fff', bg: 'linear-gradient(135deg,#4ade80,#22c55e)' },
}

function fmtDate(str: string): string {
  return new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDateTime(str: string): string {
  return new Date(str).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function InstallationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [inst, setInst]         = useState<InstallationOrder | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      setInst(await getInstallation(id))
    } catch {
      setError('Instalação não encontrada.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleNextStatus() {
    if (!inst) return
    const next = NEXT_STATUS[inst.status]
    if (!next) return
    setUpdating(true)
    try {
      await updateInstallationStatus(inst.id, next.to)
      setInst({ ...inst, status: next.to })
    } catch {
      alert('Erro ao atualizar status.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleCancel() {
    if (!inst) return
    if (!confirm('Cancelar esta instalação?')) return
    setUpdating(true)
    try {
      await updateInstallationStatus(inst.id, 'cancelado')
      setInst({ ...inst, status: 'cancelado' })
    } catch {
      alert('Erro ao cancelar.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!inst) return
    if (!confirm(`Excluir a instalação "${inst.code}"?`)) return
    setDeleting(true)
    try {
      await deleteInstallation(inst.id)
      navigate('/instalacao')
    } catch {
      alert('Erro ao excluir.')
      setDeleting(false)
    }
  }

  const hoje = new Date().toISOString().split('T')[0]
  const atrasada = inst?.status === 'agendado' && inst.scheduled_date < hoje

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin" style={{ color: '#00c896' }} />
    </div>
  )

  if (error || !inst) return (
    <div className="text-center py-20">
      <p style={{ color: '#64748b' }}>{error || 'Instalação não encontrada.'}</p>
      <button onClick={() => navigate('/instalacao')} className="mt-4 text-sm font-medium" style={{ color: '#00c896' }}>
        ← Voltar para Instalações
      </button>
    </div>
  )

  const nextAction = NEXT_STATUS[inst.status]

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Navegação */}
      <button onClick={() => navigate('/instalacao')}
        className="flex items-center gap-2 text-sm transition-colors hover:opacity-80" style={{ color: '#64748b' }}>
        <ArrowLeft size={16} />
        Voltar para Instalações
      </button>

      {/* Header */}
      <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,200,150,0.1)' }}>
              <CalendarCheck2 size={22} style={{ color: '#00c896' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>{inst.customer_name}</h1>
                <InstallationStatusBadge status={inst.status} />
                {atrasada && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                    Atrasada
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap text-xs" style={{ color: '#64748b' }}>
                <span className="font-mono font-semibold" style={{ color: '#00c896' }}>{inst.code}</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span>Criado em {fmtDateTime(inst.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {nextAction && !['cancelado','concluido'].includes(inst.status) && (
              <button
                onClick={handleNextStatus}
                disabled={updating}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
                style={{ background: nextAction.bg, color: nextAction.color, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {updating ? 'Atualizando...' : nextAction.label}
              </button>
            )}
            {!['cancelado','concluido'].includes(inst.status) && (
              <button onClick={handleCancel} disabled={updating}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                Cancelar
              </button>
            )}
            <button onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <Edit2 size={13} /> Editar
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Detalhes */}
      <div className="rounded-2xl p-6 grid grid-cols-2 gap-x-8 gap-y-5"
        style={{ background: '#fff', border: '1px solid #e2e8f0' }}>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={13} style={{ color: '#94a3b8' }} />
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Data / Horário</p>
          </div>
          <p className="text-base font-semibold" style={{ color: '#0f172a' }}>{fmtDate(inst.scheduled_date)}</p>
          {inst.scheduled_time && <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{inst.scheduled_time}</p>}
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <User size={13} style={{ color: '#94a3b8' }} />
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Técnico Responsável</p>
          </div>
          <p className="text-base font-semibold" style={{ color: '#0f172a' }}>{inst.technician || '—'}</p>
        </div>

        <div className="col-span-2">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin size={13} style={{ color: '#94a3b8' }} />
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Endereço de Instalação</p>
          </div>
          <p className="text-sm" style={{ color: '#0f172a' }}>{inst.customer_address || '—'}</p>
        </div>

        {inst.sales_order_code && (
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 mb-1">
              <ShoppingCart size={13} style={{ color: '#94a3b8' }} />
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Pedido de Venda</p>
            </div>
            <button
              onClick={() => inst.sales_order_id && navigate(`/vendas/${inst.sales_order_id}`)}
              className="text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: '#00c896' }}>
              {inst.sales_order_code} →
            </button>
          </div>
        )}

        {inst.notes && (
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText size={13} style={{ color: '#94a3b8' }} />
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>Observações</p>
            </div>
            <p className="text-sm" style={{ color: '#475569' }}>{inst.notes}</p>
          </div>
        )}

        {inst.completion_notes && (
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText size={13} style={{ color: '#4ade80' }} />
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#4ade80' }}>Notas de Conclusão</p>
            </div>
            <p className="text-sm" style={{ color: '#475569' }}>{inst.completion_notes}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Status Atual</p>
          <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{STATUS_LABELS[inst.status]}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>Última Atualização</p>
          <p className="text-sm" style={{ color: '#64748b' }}>{fmtDateTime(inst.updated_at)}</p>
        </div>
      </div>

      {showEdit && (
        <InstallationFormModal
          mode="edit"
          installation={inst}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setInst({ ...updated, status: inst.status }); setShowEdit(false) }}
        />
      )}
    </div>
  )
}
