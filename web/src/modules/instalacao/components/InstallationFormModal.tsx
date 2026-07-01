import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import { createInstallation, updateInstallation } from '../services/installationService'
import { listSalesOrders } from '@/modules/vendas/services/salesOrderService'
import type { InstallationOrder, CreateInstallationInput, UpdateInstallationInput } from '../types'
import type { SalesOrder } from '@/modules/vendas/types'

interface Props {
  mode: 'create' | 'edit'
  installation?: InstallationOrder
  onClose: () => void
  onSaved: (inst: InstallationOrder) => void
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#111827',
  fontSize: 14,
  outline: 'none',
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export default function InstallationFormModal({ mode, installation, onClose, onSaved }: Props) {
  const [customerName, setCustomerName]   = useState(installation?.customer_name ?? '')
  const [customerAddr, setCustomerAddr]   = useState(installation?.customer_address ?? '')
  const [scheduledDate, setScheduledDate] = useState(installation?.scheduled_date ?? today())
  const [scheduledTime, setScheduledTime] = useState(installation?.scheduled_time ?? '')
  const [technician, setTechnician]       = useState(installation?.technician ?? '')
  const [notes, setNotes]                 = useState(installation?.notes ?? '')
  const [completionNotes, setCompletion]  = useState(installation?.completion_notes ?? '')

  const [salesOrders, setSalesOrders]     = useState<SalesOrder[]>([])
  const [soSearch, setSoSearch]           = useState(installation?.sales_order_code ?? '')
  const [selectedSO, setSelectedSO]       = useState<SalesOrder | null>(null)
  const [showSOList, setShowSOList]       = useState(false)

  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    listSalesOrders().then(data => {
      const confirmed = data.filter(s => ['confirmado','em_producao','entregue'].includes(s.status))
      setSalesOrders(confirmed)
    }).catch(() => {})
  }, [])

  const filteredSO = salesOrders.filter(s =>
    s.code.toLowerCase().includes(soSearch.toLowerCase()) ||
    s.customer_name.toLowerCase().includes(soSearch.toLowerCase())
  ).slice(0, 6)

  function selectSO(s: SalesOrder) {
    setSelectedSO(s)
    setSoSearch(s.code)
    setCustomerName(s.customer_name)
    setShowSOList(false)
  }

  async function handleSave() {
    if (!customerName.trim()) { setError('Informe o cliente.'); return }
    if (!scheduledDate)       { setError('Informe a data agendada.'); return }

    setSaving(true)
    setError('')
    try {
      const base: CreateInstallationInput = {
        customer_name:    customerName,
        customer_address: customerAddr,
        scheduled_date:   scheduledDate,
        scheduled_time:   scheduledTime,
        technician,
        notes,
        sales_order_id:   selectedSO?.id ?? installation?.sales_order_id ?? null,
        sales_order_code: selectedSO?.code ?? installation?.sales_order_code ?? null,
      }

      if (mode === 'create') {
        onSaved(await createInstallation(base))
      } else {
        const upd: UpdateInstallationInput = { ...base, completion_notes: completionNotes }
        onSaved(await updateInstallation(installation!.id, upd))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)' }}>
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{ background: '#fff', maxHeight: '92vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#111827' }}>
              {mode === 'create' ? 'Nova Instalação' : 'Editar Instalação'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              {mode === 'create' ? 'Agende uma visita técnica de instalação' : `Editando ${installation?.code}`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-gray-100">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-7 py-6 space-y-5">

          {/* Pedido de venda (opcional) */}
          <div>
            <label style={label}>Pedido de Venda <span style={{ color: '#9ca3af', fontWeight: 400 }}>(opcional)</span></label>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
              <input
                style={{ ...input, paddingLeft: 36 }}
                value={soSearch}
                onChange={e => { setSoSearch(e.target.value); setShowSOList(true) }}
                onFocus={() => setShowSOList(true)}
                placeholder="Buscar por código ou cliente..."
              />
              {showSOList && soSearch && filteredSO.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                  {filteredSO.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => selectSO(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors">
                      <span className="text-xs font-mono font-semibold" style={{ color: '#00c896' }}>{s.code}</span>
                      <span className="text-sm ml-2" style={{ color: '#374151' }}>{s.customer_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cliente + Endereço */}
          <div>
            <label style={label}>Cliente *</label>
            <input style={input} value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div>
            <label style={label}>Endereço de Instalação</label>
            <input style={input} value={customerAddr} onChange={e => setCustomerAddr(e.target.value)} placeholder="Rua, número, bairro, cidade" />
          </div>

          {/* Data + Horário + Técnico */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={label}>Data Agendada *</label>
              <input style={input} type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
            </div>
            <div>
              <label style={label}>Horário</label>
              <input style={input} type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
            </div>
            <div>
              <label style={label}>Técnico Responsável</label>
              <input style={input} value={technician} onChange={e => setTechnician(e.target.value)} placeholder="Nome do técnico" />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label style={label}>Observações</label>
            <textarea rows={2} style={{ ...input, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instruções, itens a instalar..." />
          </div>

          {/* Notas de conclusão (apenas edição) */}
          {mode === 'edit' && (
            <div>
              <label style={label}>Notas de Conclusão</label>
              <textarea rows={2} style={{ ...input, resize: 'vertical' }} value={completionNotes} onChange={e => setCompletion(e.target.value)} placeholder="O que foi feito, pendências..." />
            </div>
          )}

          {error && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5" style={{ borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ color: '#374151', border: '1px solid #d1d5db', background: '#fff' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#00c896,#00a07a)', color: '#fff', boxShadow: '0 4px 12px rgba(0,200,150,0.3)' }}>
            {saving ? 'Salvando...' : mode === 'create' ? 'Agendar Instalação' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
