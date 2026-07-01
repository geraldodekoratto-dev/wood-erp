import { useState } from 'react'
import { X } from 'lucide-react'
import { addBomItem, updateBomItem } from '../services/engineeringService'
import type { BomItem, CreateBomItemInput } from '../types'
import { BOM_UNIT_OPTIONS } from '../types'

interface Props {
  productId: string
  item?: BomItem
  onClose: () => void
  onSaved: (item: BomItem) => void
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

export default function BomItemFormModal({ productId, item, onClose, onSaved }: Props) {
  const [itemName, setItemName] = useState(item?.item_name ?? '')
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? '')
  const [unit, setUnit]         = useState(item?.unit ?? 'un')
  const [notes, setNotes]       = useState(item?.notes ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function handleSave() {
    if (!itemName.trim()) { setError('Informe o nome do item.'); return }
    if (!quantity)        { setError('Informe a quantidade.'); return }

    const inp: CreateBomItemInput = {
      item_name: itemName,
      quantity,
      unit,
      notes,
    }

    setSaving(true)
    setError('')
    try {
      if (item) {
        onSaved(await updateBomItem(item.id, inp))
      } else {
        onSaved(await addBomItem(productId, inp))
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
        className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col"
        style={{ background: '#fff' }}>

        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#111827' }}>
              {item ? 'Editar Item' : 'Adicionar Item'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              Lista de materiais do produto
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-gray-100">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-5">

          {/* Nome do item */}
          <div>
            <label style={label}>Item / Material *</label>
            <input
              style={input}
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="Ex: Chapa MDF 18mm, Dobradiça Clip-on..."
            />
          </div>

          {/* Quantidade + Unidade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={label}>Quantidade *</label>
              <input
                style={input}
                type="number"
                min="0.001"
                step="0.001"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label style={label}>Unidade</label>
              <select style={input} value={unit} onChange={e => setUnit(e.target.value)}>
                {BOM_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label style={label}>Observações</label>
            <input
              style={input}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Espessura, cor, referência..."
            />
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-7 py-5"
          style={{ borderTop: '1px solid #f3f4f6' }}>
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
            style={{
              background: 'linear-gradient(135deg,#00c896,#00a07a)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,200,150,0.3)',
            }}>
            {saving ? 'Salvando...' : item ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
