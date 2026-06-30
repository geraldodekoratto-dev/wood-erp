import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, PowerOff, RefreshCw, Users,
  Mail, Phone, Smartphone, MapPin, FileText, Hash
} from 'lucide-react'
import { getCustomerById, toggleCustomerStatus, deleteCustomer } from '../services/customerService'
import type { Customer } from '../types'
import { TYPE_LABELS } from '../types'
import { CustomerTypeBadge, CustomerStatusBadge } from '../components/CustomerBadges'
import CustomerFormModal from '../components/CustomerFormModal'

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fullAddress(c: Customer): string {
  const parts = [
    c.street, c.number && `nº ${c.number}`, c.complement,
    c.neighborhood, c.city, c.state, c.zip_code,
  ].filter(Boolean)
  return parts.join(', ') || '—'
}

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [showToggleConfirm, setShowToggleConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      setCustomer(await getCustomerById(id))
    } catch {
      setError('Cliente não encontrado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleToggleStatus() {
    if (!customer) return
    setActionLoading(true)
    try {
      const next = customer.status === 'active' ? 'inactive' : 'active'
      await toggleCustomerStatus(customer.id, next)
      setCustomer(prev => prev ? { ...prev, status: next } : prev)
    } finally {
      setActionLoading(false)
      setShowToggleConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={22} className="animate-spin" style={{ color: '#00c896' }} />
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Users size={36} style={{ color: '#cbd5e1' }} />
        <p style={{ color: '#64748b' }}>{error || 'Cliente não encontrado.'}</p>
        <button onClick={() => navigate('/clientes')} style={{ color: '#00c896' }} className="text-sm font-medium">
          ← Voltar para Clientes
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/clientes')}
          className="p-2 rounded-lg transition-all"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-bold" style={{ color: '#0f172a' }}>{customer.name}</span>
            <CustomerTypeBadge type={customer.type} />
            <CustomerStatusBadge status={customer.status} />
          </div>
          <p className="text-xs mt-1 font-mono" style={{ color: '#00c896' }}>{customer.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
            <Pencil size={14} />
            Editar
          </button>
          <button onClick={() => setShowToggleConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: customer.status === 'active' ? 'rgba(239,68,68,0.08)' : 'rgba(0,200,150,0.08)',
              border: `1px solid ${customer.status === 'active' ? 'rgba(239,68,68,0.2)' : 'rgba(0,200,150,0.2)'}`,
              color: customer.status === 'active' ? '#f87171' : '#00c896',
            }}>
            <PowerOff size={14} />
            {customer.status === 'active' ? 'Desativar' : 'Reativar'}
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <InfoCard icon={<Hash size={14} />} label="Tipo de Pessoa" value={TYPE_LABELS[customer.type]} />
        <InfoCard
          icon={<FileText size={14} />}
          label={customer.type === 'pj' ? 'CNPJ' : 'CPF'}
          value={customer.document || '—'}
          mono
        />
      </div>

      {/* Contato */}
      <div className="rounded-xl p-5 mb-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#64748b' }}>Contato</p>
        <div className="grid grid-cols-3 gap-4">
          <InfoRow icon={<Mail size={13} />} label="E-mail" value={customer.email || '—'} />
          <InfoRow icon={<Phone size={13} />} label="Telefone" value={customer.phone || '—'} />
          <InfoRow icon={<Smartphone size={13} />} label="Celular / WhatsApp" value={customer.mobile || '—'} />
        </div>
      </div>

      {/* Endereço */}
      {(customer.street || customer.city || customer.zip_code) && (
        <div className="rounded-xl p-5 mb-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} style={{ color: '#64748b' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Endereço</p>
          </div>
          <p className="text-sm" style={{ color: '#475569' }}>{fullAddress(customer)}</p>
        </div>
      )}

      {/* Observações */}
      {customer.notes && (
        <div className="rounded-xl p-5 mb-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} style={{ color: '#64748b' }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Observações</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{customer.notes}</p>
        </div>
      )}

      {/* Timestamps */}
      <div className="text-xs mt-6" style={{ color: '#94a3b8' }}>
        Cadastrado em {formatDateTime(customer.created_at)}
        {customer.updated_at !== customer.created_at && ` · Atualizado em ${formatDateTime(customer.updated_at)}`}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <CustomerFormModal
          mode="edit"
          customer={customer}
          onClose={() => setShowEdit(false)}
          onSaved={updated => {
            setCustomer(updated)
            setShowEdit(false)
          }}
        />
      )}

      {/* Toggle Status Confirm */}
      {showToggleConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-sm"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <PowerOff size={32} className="mx-auto mb-4"
              style={{ color: customer.status === 'active' ? '#f87171' : '#00c896' }} />
            <h3 className="font-semibold text-center mb-2" style={{ color: '#0f172a' }}>
              {customer.status === 'active' ? 'Desativar cliente?' : 'Reativar cliente?'}
            </h3>
            <p className="text-sm text-center mb-6" style={{ color: '#64748b' }}>
              <span className="font-semibold" style={{ color: '#0f172a' }}>{customer.name}</span> será marcado como{' '}
              <span style={{ color: customer.status === 'active' ? '#f87171' : '#00c896' }}>
                {customer.status === 'active' ? 'inativo' : 'ativo'}
              </span>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowToggleConfirm(false)}
                className="flex-1 py-3 rounded-lg text-sm font-medium"
                style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                Cancelar
              </button>
              <button onClick={handleToggleStatus} disabled={actionLoading}
                className="flex-1 py-3 rounded-lg text-sm font-semibold"
                style={{
                  background: customer.status === 'active' ? 'rgba(239,68,68,0.2)' : 'rgba(0,200,150,0.2)',
                  color: customer.status === 'active' ? '#f87171' : '#00c896',
                  border: `1px solid ${customer.status === 'active' ? 'rgba(239,68,68,0.3)' : 'rgba(0,200,150,0.3)'}`,
                  opacity: actionLoading ? 0.7 : 1,
                }}>
                {actionLoading ? 'Aguarde...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCard({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl p-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: '#64748b' }}>{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{label}</span>
      </div>
      <p className={`text-sm font-medium ${mono ? 'font-mono' : ''}`} style={{ color: '#0f172a' }}>{value}</p>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: '#64748b' }}>{icon}</span>
        <span className="text-xs" style={{ color: '#64748b' }}>{label}</span>
      </div>
      <p className="text-sm" style={{ color: '#475569' }}>{value}</p>
    </div>
  )
}
