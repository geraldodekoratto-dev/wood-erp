import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { updateProductionOrder } from '../services/productionOrderService'
import type { ProductionOrder, UpdateProductionOrderInput } from '../types'

interface Props {
  order: ProductionOrder
  onClose: () => void
  onUpdated: (order: ProductionOrder) => void
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
}

export default function EditOrderModal({ order, onClose, onUpdated }: Props) {
  const [form, setForm] = useState<UpdateProductionOrderInput>({
    client_name: order.client_name,
    project_name: order.project_name,
    priority: order.priority,
    sale_date: order.sale_date ?? '',
    delivery_date: order.delivery_date ?? '',
    notes: order.notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof UpdateProductionOrderInput, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_name || !form.project_name) {
      setError('Preencha cliente e nome do projeto.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const updated = await updateProductionOrder(order.id, form)
      onUpdated(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.1)' }}>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">Editar Ordem</h2>
            <p className="text-xs mt-0.5 font-mono" style={{ color: '#00c896' }}>{order.reference_number}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>Cliente *</label>
            <input style={inputStyle} value={form.client_name}
              onChange={e => set('client_name', e.target.value)}
              placeholder="Nome do cliente" />
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>Nome do Projeto *</label>
            <input style={inputStyle} value={form.project_name}
              onChange={e => set('project_name', e.target.value)}
              placeholder="Ex: Cozinha Completa - Apto 301" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>Prioridade</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.priority}
                onChange={e => set('priority', e.target.value)}>
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>Data da Venda</label>
              <input type="date" style={inputStyle} value={form.sale_date}
                onChange={e => set('sale_date', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>Previsão de Entrega</label>
            <input type="date" style={inputStyle} value={form.delivery_date}
              onChange={e => set('delivery_date', e.target.value)} />
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>Observações</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Informações adicionais sobre o projeto..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628', opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
