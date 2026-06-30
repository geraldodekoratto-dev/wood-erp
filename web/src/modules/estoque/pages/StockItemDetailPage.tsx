import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Pencil, Trash2, RefreshCw, Package,
  TrendingUp, TrendingDown, Plus,
} from 'lucide-react'
import { getStockItemById, deleteStockItem } from '../services/stockItemService'
import { listMovements } from '../services/stockMovementService'
import type { StockItem, StockMovement } from '../types'
import { CATEGORY_LABELS, UNIT_SHORT, UNIT_LABELS, REASON_LABELS, MOVEMENT_TYPE_LABELS, getStockStatus, STATUS_CONFIG } from '../types'
import StockStatusBadge from '../components/StockStatusBadge'
import StockItemFormModal from '../components/StockItemFormModal'
import StockMovementModal from '../components/StockMovementModal'

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(v: number | null) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function StockItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [item, setItem] = useState<StockItem | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [showMovement, setShowMovement] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function load() {
    if (!id) return
    setLoading(true)
    try {
      const [fetchedItem, fetchedMovements] = await Promise.all([
        getStockItemById(id),
        listMovements(id),
      ])
      setItem(fetchedItem)
      setMovements(fetchedMovements)
    } catch {
      setError('Item não encontrado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleDelete() {
    if (!item) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteStockItem(item.id)
      navigate('/estoque')
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir item.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw size={22} className="animate-spin" style={{ color: '#00c896' }} />
    </div>
  )

  if (error || !item) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Package size={36} style={{ color: '#cbd5e1' }} />
      <p style={{ color: '#64748b' }}>{error || 'Item não encontrado.'}</p>
      <button onClick={() => navigate('/estoque')} style={{ color: '#00c896' }} className="text-sm font-medium">
        ← Voltar para Estoque
      </button>
    </div>
  )

  const status = getStockStatus(item)
  const statusCfg = STATUS_CONFIG[status]
  const unit = UNIT_SHORT[item.unit]
  const totalValue = item.current_quantity * (item.cost_price ?? 0)

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/estoque')}
          className="p-2 rounded-lg"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl font-bold font-mono" style={{ color: '#00c896' }}>{item.code}</span>
            <StockStatusBadge item={item} />
          </div>
          <p className="text-base font-semibold mt-0.5" style={{ color: '#0f172a' }}>{item.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMovement(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}>
            <Plus size={14} /> Movimentação
          </button>
          <button onClick={() => setShowEdit(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
            <Pencil size={14} />
          </button>
          <button onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Saldo em destaque */}
      <div className="rounded-2xl p-5 mb-4 flex items-center justify-between shadow-sm"
        style={{ background: `rgba(${status === 'ok' ? '0,200,150' : status === 'baixo' ? '251,191,36' : '239,68,68'},0.08)`, border: `1px solid ${statusCfg.text}33` }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Saldo em Estoque</p>
          <p className="text-3xl font-bold" style={{ color: statusCfg.text }}>
            {item.current_quantity}
            <span className="text-base font-normal ml-2" style={{ color: '#64748b' }}>{unit}</span>
          </p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>Mínimo: {item.min_quantity} {unit}</p>
        </div>
        {item.cost_price && (
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Valor em Estoque</p>
            <p className="text-xl font-bold" style={{ color: '#0f172a' }}>{formatCurrency(totalValue)}</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>{formatCurrency(item.cost_price)} / {unit}</p>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <InfoCard label="Categoria" value={CATEGORY_LABELS[item.category]} />
        <InfoCard label="Unidade" value={UNIT_LABELS[item.unit]} />
        {item.supplier && <InfoCard label="Fornecedor Principal" value={item.supplier} />}
        {item.cost_price && <InfoCard label="Custo Unitário" value={formatCurrency(item.cost_price)} valueColor="#00c896" />}
      </div>

      {item.description && (
        <div className="rounded-xl p-4 mb-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Especificações</p>
          <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{item.description}</p>
        </div>
      )}

      {/* Histórico de movimentações */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
            Histórico de Movimentações
          </h2>
          <span className="text-xs" style={{ color: '#94a3b8' }}>{movements.length} registro{movements.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #e2e8f0' }}>
          {movements.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm" style={{ color: '#64748b' }}>Nenhuma movimentação registrada ainda.</p>
              <button onClick={() => setShowMovement(true)} className="mt-2 text-sm font-medium" style={{ color: '#00c896' }}>
                + Registrar primeira movimentação
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                  {['Data', 'Tipo', 'Quantidade', 'Motivo', 'Observações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.map((mv, i) => (
                  <tr key={mv.id} style={{
                    background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #f1f5f9',
                  }}>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: '#64748b' }}>{formatDateTime(mv.created_at)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: mv.type === 'entrada' ? '#00c896' : '#f87171' }}>
                        {mv.type === 'entrada' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {MOVEMENT_TYPE_LABELS[mv.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold"
                        style={{ color: mv.type === 'entrada' ? '#00c896' : '#f87171' }}>
                        {mv.type === 'entrada' ? '+' : '−'}{mv.quantity} {unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: '#475569' }}>{REASON_LABELS[mv.reason]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs" style={{ color: '#64748b' }}>{mv.notes || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Editar */}
      {showEdit && (
        <StockItemFormModal
          mode="edit"
          item={item}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setItem(updated); setShowEdit(false) }}
        />
      )}

      {/* Modal Movimentação */}
      {showMovement && (
        <StockMovementModal
          item={item}
          onClose={() => setShowMovement(false)}
          onSaved={updated => {
            setItem(updated)
            setShowMovement(false)
            listMovements(item.id).then(setMovements).catch(() => {})
          }}
        />
      )}

      {/* Modal Excluir */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-sm"
            style={{ background: '#ffffff', border: '1px solid rgba(239,68,68,0.3)' }}>
            <Trash2 size={32} className="mx-auto mb-4" style={{ color: '#f87171' }} />
            <h3 className="font-semibold text-center mb-2" style={{ color: '#0f172a' }}>Excluir Item?</h3>
            <p className="text-sm text-center mb-6" style={{ color: '#64748b' }}>
              O item <span className="font-semibold" style={{ color: '#0f172a' }}>{item.name}</span> será removido do estoque.
              O histórico de movimentações será preservado.
            </p>
            {deleteError && (
              <p className="text-sm text-center mb-4" style={{ color: '#f87171' }}>{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowDelete(false); setDeleteError('') }}
                className="flex-1 py-3 rounded-lg text-sm font-medium"
                style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-3 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', opacity: deleteLoading ? 0.7 : 1 }}>
                {deleteLoading ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCard({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="rounded-xl p-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: valueColor ?? '#0f172a' }}>{value}</p>
    </div>
  )
}
