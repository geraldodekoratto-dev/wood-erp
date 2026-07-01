import { useState } from 'react'
import { X } from 'lucide-react'
import { createProduct, updateProduct } from '../services/engineeringService'
import type { EngineeringProduct, CreateProductInput, UpdateProductInput, ProductCategory, ProductStatus } from '../types'
import { CATEGORY_LABELS, STATUS_LABELS } from '../types'

interface Props {
  mode: 'create' | 'edit'
  product?: EngineeringProduct
  onClose: () => void
  onSaved: (product: EngineeringProduct) => void
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

const CATEGORIES: ProductCategory[] = ['cozinha', 'quarto', 'banheiro', 'sala', 'escritorio', 'outro']
const STATUSES: ProductStatus[] = ['ativo', 'em_revisao', 'inativo']

export default function EngineeringProductFormModal({ mode, product, onClose, onSaved }: Props) {
  const [name, setName]         = useState(product?.name ?? '')
  const [description, setDesc]  = useState(product?.description ?? '')
  const [category, setCategory] = useState<ProductCategory | ''>(product?.category ?? '')
  const [status, setStatus]     = useState<ProductStatus>(product?.status ?? 'ativo')
  const [widthCm, setWidth]     = useState(product?.width_cm?.toString() ?? '')
  const [heightCm, setHeight]   = useState(product?.height_cm?.toString() ?? '')
  const [depthCm, setDepth]     = useState(product?.depth_cm?.toString() ?? '')
  const [material, setMaterial] = useState(product?.material ?? '')
  const [finish, setFinish]     = useState(product?.finish ?? '')
  const [notes, setNotes]       = useState(product?.notes ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function handleSave() {
    if (!name.trim())   { setError('Informe o nome do produto.'); return }
    if (!category)      { setError('Selecione a categoria.'); return }

    setSaving(true)
    setError('')
    try {
      if (mode === 'create') {
        const inp: CreateProductInput = { name, description, category, width_cm: widthCm, height_cm: heightCm, depth_cm: depthCm, material, finish, notes }
        onSaved(await createProduct(inp))
      } else {
        const inp: UpdateProductInput = { name, description, category, status, width_cm: widthCm, height_cm: heightCm, depth_cm: depthCm, material, finish, notes }
        onSaved(await updateProduct(product!.id, inp))
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
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#111827' }}>
              {mode === 'create' ? 'Novo Produto' : 'Editar Produto'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              {mode === 'create' ? 'Preencha a ficha técnica do produto' : `Editando ${product?.code}`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-gray-100">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-7 py-6 space-y-6">

          {/* Nome + Categoria */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label style={label}>Nome do Produto *</label>
              <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Armário Cozinha 2 Portas" />
            </div>
            <div>
              <label style={label}>Categoria *</label>
              <select style={input} value={category} onChange={e => setCategory(e.target.value as ProductCategory)}>
                <option value="">Selecione...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label style={label}>Descrição</label>
            <input style={input} value={description} onChange={e => setDesc(e.target.value)} placeholder="Breve descrição do produto" />
          </div>

          {/* Dimensões */}
          <div>
            <span style={label}>Dimensões (cm)</span>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label style={{ ...label, color: '#6b7280', fontSize: 12 }}>Largura</label>
                <input style={input} type="number" min="0" step="0.1" value={widthCm} onChange={e => setWidth(e.target.value)} placeholder="0,00" />
              </div>
              <div>
                <label style={{ ...label, color: '#6b7280', fontSize: 12 }}>Altura</label>
                <input style={input} type="number" min="0" step="0.1" value={heightCm} onChange={e => setHeight(e.target.value)} placeholder="0,00" />
              </div>
              <div>
                <label style={{ ...label, color: '#6b7280', fontSize: 12 }}>Profundidade</label>
                <input style={input} type="number" min="0" step="0.1" value={depthCm} onChange={e => setDepth(e.target.value)} placeholder="0,00" />
              </div>
            </div>
          </div>

          {/* Material + Acabamento */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label style={label}>Material Principal</label>
              <input style={input} value={material} onChange={e => setMaterial(e.target.value)} placeholder="Ex: MDF 18mm" />
            </div>
            <div>
              <label style={label}>Acabamento</label>
              <input style={input} value={finish} onChange={e => setFinish(e.target.value)} placeholder="Ex: BP Branco TX" />
            </div>
          </div>

          {/* Status (apenas edição) */}
          {mode === 'edit' && (
            <div>
              <label style={label}>Status</label>
              <select style={input} value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          )}

          {/* Observações */}
          <div>
            <label style={label}>Observações</label>
            <textarea
              rows={2}
              style={{ ...input, resize: 'vertical' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
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
            {saving ? 'Salvando...' : mode === 'create' ? 'Criar Produto' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}
