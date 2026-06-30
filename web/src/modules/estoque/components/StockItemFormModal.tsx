import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createStockItem, updateStockItem } from '../services/stockItemService'
import type { StockItem, CreateStockItemInput, UpdateStockItemInput, StockCategory, StockUnit } from '../types'
import { CATEGORY_LABELS, UNIT_LABELS } from '../types'

interface Props {
  mode: 'create' | 'edit'
  item?: StockItem
  onClose: () => void
  onSaved: (item: StockItem) => void
}

const EMPTY: CreateStockItemInput = {
  name: '', description: '', category: '', unit: '',
  min_quantity: '0', initial_quantity: '0', cost_price: '', supplier: '',
}

const inp = {
  width: '100%',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  color: '#0f172a',
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
} as const

const lbl = { color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' } as const

export default function StockItemFormModal({ mode, item, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CreateStockItemInput>(
    mode === 'edit' && item
      ? {
          name:             item.name,
          description:      item.description ?? '',
          category:         item.category,
          unit:             item.unit,
          min_quantity:     String(item.min_quantity),
          initial_quantity: '0',
          cost_price:       item.cost_price != null ? String(item.cost_price) : '',
          supplier:         item.supplier ?? '',
        }
      : EMPTY
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof CreateStockItemInput>(field: K, value: CreateStockItemInput[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome do item é obrigatório.'); return }
    if (!form.category) { setError('Selecione uma categoria.'); return }
    if (!form.unit) { setError('Selecione a unidade de medida.'); return }
    setLoading(true)
    setError('')
    try {
      let saved: StockItem
      if (mode === 'edit' && item) {
        const input: UpdateStockItemInput = {
          name: form.name, description: form.description,
          category: form.category, unit: form.unit,
          min_quantity: form.min_quantity, cost_price: form.cost_price, supplier: form.supplier,
        }
        saved = await updateStockItem(item.id, input)
      } else {
        saved = await createStockItem(form)
      }
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar item.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col shadow-sm"
        style={{ background: '#ffffff', border: '1px solid #e2e8f0', maxHeight: '90vh' }}>

        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#0f172a' }}>
            {mode === 'edit' ? 'Editar Item' : 'Novo Item de Estoque'}
          </h2>
          <button onClick={onClose} className="transition-colors" style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}

            <div>
              <label style={lbl}>Nome do Item *</label>
              <input style={inp} value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ex: MDF 15mm Branco, Dobradiça 35mm..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Categoria *</label>
                <select style={{ ...inp, cursor: 'pointer' }}
                  value={form.category}
                  onChange={e => set('category', e.target.value as StockCategory | '')}>
                  <option value="">— Selecionar —</option>
                  {(Object.entries(CATEGORY_LABELS) as [StockCategory, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Unidade de Medida *</label>
                <select style={{ ...inp, cursor: 'pointer' }}
                  value={form.unit}
                  onChange={e => set('unit', e.target.value as StockUnit | '')}>
                  <option value="">— Selecionar —</option>
                  {(Object.entries(UNIT_LABELS) as [StockUnit, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Estoque Mínimo</label>
                <input style={inp} value={form.min_quantity}
                  onChange={e => set('min_quantity', e.target.value)}
                  placeholder="0" />
              </div>
              {mode === 'create' && (
                <div>
                  <label style={lbl}>Estoque Inicial</label>
                  <input style={inp} value={form.initial_quantity}
                    onChange={e => set('initial_quantity', e.target.value)}
                    placeholder="0" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Custo Unitário (R$)</label>
                <input style={inp} value={form.cost_price}
                  onChange={e => set('cost_price', e.target.value)}
                  placeholder="0,00" />
              </div>
              <div>
                <label style={lbl}>Fornecedor Principal</label>
                <input style={inp} value={form.supplier}
                  onChange={e => set('supplier', e.target.value)}
                  placeholder="Nome do fornecedor" />
              </div>
            </div>

            <div>
              <label style={lbl}>Descrição / Especificações</label>
              <textarea style={{ ...inp, minHeight: 64, resize: 'vertical' }}
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Detalhes técnicos, espessura, cor, referência..." />
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #e2e8f0' }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628', opacity: loading ? 0.7 : 1 }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Salvando...' : mode === 'edit' ? 'Salvar Alterações' : 'Criar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
