import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Wrench, Edit2, Trash2, Plus, RefreshCw,
  Layers, Ruler, Package
} from 'lucide-react'
import { getProduct, deleteProduct, updateProductStatus, deleteBomItem } from '../services/engineeringService'
import type { EngineeringProduct, BomItem } from '../types'
import { CATEGORY_LABELS, STATUS_LABELS } from '../types'
import EngineeringStatusBadge from '../components/EngineeringStatusBadge'
import EngineeringProductFormModal from '../components/EngineeringProductFormModal'
import BomItemFormModal from '../components/BomItemFormModal'

export default function EngineeringDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [product, setProduct]       = useState<EngineeringProduct | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showEdit, setShowEdit]     = useState(false)
  const [showAddBom, setShowAddBom] = useState(false)
  const [editBom, setEditBom]       = useState<BomItem | null>(null)
  const [deleting, setDeleting]     = useState(false)

  async function load() {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      setProduct(await getProduct(id))
    } catch {
      setError('Produto não encontrado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleDelete() {
    if (!product) return
    if (!confirm(`Excluir "${product.name}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    try {
      await deleteProduct(product.id)
      navigate('/engenharia')
    } catch {
      alert('Erro ao excluir produto.')
      setDeleting(false)
    }
  }

  async function handleToggleStatus() {
    if (!product) return
    const next = product.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await updateProductStatus(product.id, next)
      setProduct({ ...product, status: next })
    } catch {
      alert('Erro ao atualizar status.')
    }
  }

  async function handleDeleteBom(itemId: string) {
    if (!confirm('Remover este item da lista de materiais?')) return
    try {
      await deleteBomItem(itemId)
      setProduct(prev => prev ? {
        ...prev,
        bom_items: prev.bom_items?.filter(b => b.id !== itemId)
      } : prev)
    } catch {
      alert('Erro ao remover item.')
    }
  }

  function fmtDate(str: string) {
    return new Date(str).toLocaleDateString('pt-BR')
  }

  function fmtNum(v: number | null): string {
    return v != null ? v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin" style={{ color: '#00c896' }} />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <p style={{ color: '#64748b' }}>{error || 'Produto não encontrado.'}</p>
        <button onClick={() => navigate('/engenharia')} className="mt-4 text-sm font-medium" style={{ color: '#00c896' }}>
          ← Voltar para Engenharia
        </button>
      </div>
    )
  }

  const bom = product.bom_items ?? []

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Navegação */}
      <button
        onClick={() => navigate('/engenharia')}
        className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
        style={{ color: '#64748b' }}>
        <ArrowLeft size={16} />
        Voltar para Engenharia
      </button>

      {/* Header do produto */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,200,150,0.1)' }}>
              <Wrench size={22} style={{ color: '#00c896' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold" style={{ color: '#0f172a' }}>{product.name}</h1>
                <EngineeringStatusBadge status={product.status} />
              </div>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                <span className="text-xs font-mono font-medium" style={{ color: '#00c896' }}>{product.code}</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>•</span>
                <span className="text-xs" style={{ color: '#64748b' }}>{CATEGORY_LABELS[product.category]}</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>•</span>
                <span className="text-xs" style={{ color: '#64748b' }}>Criado em {fmtDate(product.created_at)}</span>
              </div>
              {product.description && (
                <p className="text-sm mt-2" style={{ color: '#475569' }}>{product.description}</p>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleStatus}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
              {product.status === 'ativo' ? 'Desativar' : 'Ativar'}
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <Edit2 size={13} />
              Editar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <Trash2 size={13} />
              Excluir
            </button>
          </div>
        </div>
      </div>

      {/* Especificações técnicas */}
      <div
        className="rounded-2xl p-6"
        style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <div className="flex items-center gap-2 mb-5">
          <Ruler size={16} style={{ color: '#00c896' }} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
            Especificações Técnicas
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-5">

          {/* Dimensões */}
          <div className="col-span-2">
            <p className="text-xs font-medium mb-2" style={{ color: '#94a3b8' }}>DIMENSÕES (cm)</p>
            <div className="flex gap-6">
              {[
                { label: 'Largura', value: product.width_cm },
                { label: 'Altura',  value: product.height_cm },
                { label: 'Prof.',   value: product.depth_cm },
              ].map(d => (
                <div key={d.label} className="text-center">
                  <p className="text-2xl font-bold" style={{ color: '#0f172a' }}>{fmtNum(d.value)}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>MATERIAL PRINCIPAL</p>
            <p className="text-sm" style={{ color: '#0f172a' }}>{product.material || '—'}</p>
          </div>

          <div>
            <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>ACABAMENTO</p>
            <p className="text-sm" style={{ color: '#0f172a' }}>{product.finish || '—'}</p>
          </div>

          <div>
            <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>STATUS</p>
            <p className="text-sm" style={{ color: '#0f172a' }}>{STATUS_LABELS[product.status]}</p>
          </div>

          <div>
            <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>CATEGORIA</p>
            <p className="text-sm" style={{ color: '#0f172a' }}>{CATEGORY_LABELS[product.category]}</p>
          </div>

          {product.notes && (
            <div className="col-span-2">
              <p className="text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>OBSERVAÇÕES</p>
              <p className="text-sm" style={{ color: '#475569' }}>{product.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Materiais (BOM) */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-2">
            <Layers size={16} style={{ color: '#00c896' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
              Lista de Materiais
            </h2>
            <span
              className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(0,200,150,0.1)', color: '#00c896' }}>
              {bom.length} {bom.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <button
            onClick={() => setShowAddBom(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg,#00c896,#00a07a)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(0,200,150,0.25)',
            }}>
            <Plus size={13} />
            Adicionar Item
          </button>
        </div>

        {bom.length === 0 ? (
          <div className="py-12 text-center">
            <Package size={28} className="mx-auto mb-2" style={{ color: '#cbd5e1' }} />
            <p className="text-sm" style={{ color: '#64748b' }}>Nenhum material cadastrado ainda.</p>
            <button
              onClick={() => setShowAddBom(true)}
              className="mt-2 text-sm font-medium"
              style={{ color: '#00c896' }}>
              + Adicionar primeiro item
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['#', 'Item / Material', 'Quantidade', 'Observações', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bom.map((b, i) => (
                <tr
                  key={b.id}
                  style={{
                    background: i % 2 === 0 ? '#fff' : '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                  <td className="px-5 py-3.5 text-xs font-semibold" style={{ color: '#94a3b8', width: 36 }}>{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium" style={{ color: '#0f172a' }}>{b.item_name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-sm" style={{ color: '#475569' }}>
                      {b.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} {b.unit}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{b.notes || '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditBom(b)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Editar">
                        <Edit2 size={13} style={{ color: '#64748b' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteBom(b.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remover">
                        <Trash2 size={13} style={{ color: '#f87171' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showEdit && (
        <EngineeringProductFormModal
          mode="edit"
          product={product}
          onClose={() => setShowEdit(false)}
          onSaved={updated => {
            setProduct({ ...updated, bom_items: product.bom_items })
            setShowEdit(false)
          }}
        />
      )}

      {showAddBom && (
        <BomItemFormModal
          productId={product.id}
          onClose={() => setShowAddBom(false)}
          onSaved={item => {
            setProduct(prev => prev ? { ...prev, bom_items: [...(prev.bom_items ?? []), item] } : prev)
            setShowAddBom(false)
          }}
        />
      )}

      {editBom && (
        <BomItemFormModal
          productId={product.id}
          item={editBom}
          onClose={() => setEditBom(null)}
          onSaved={updated => {
            setProduct(prev => prev ? {
              ...prev,
              bom_items: prev.bom_items?.map(b => b.id === updated.id ? updated : b)
            } : prev)
            setEditBom(null)
          }}
        />
      )}
    </div>
  )
}
