import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Loader2, AlertTriangle, RefreshCw, Send, PackageCheck,
  XCircle, Pencil, Plus, Trash2, ShoppingBag
} from 'lucide-react'
import {
  getPurchaseOrderById, getPurchaseOrderItems,
  markAsSent, cancelPurchaseOrder,
  addItemToPurchaseOrder, removeItemFromPurchaseOrder,
} from '../services/purchaseOrderService'
import PurchaseOrderStatusBadge from '../components/PurchaseOrderStatusBadge'
import PurchaseOrderFormModal from '../components/PurchaseOrderFormModal'
import ReceiveItemsModal from '../components/ReceiveItemsModal'
import type { PurchaseOrder, PurchaseOrderItem, PurchaseOrderItemDraft } from '../types'
import { listStockItems } from '@/modules/estoque/services/stockItemService'
import type { StockItem } from '@/modules/estoque/types'
import { UNIT_SHORT } from '@/modules/estoque/types'
import { Search } from 'lucide-react'

function fmt(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function fmtMoney(v: number | null) {
  if (v === null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function newDraft(): PurchaseOrderItemDraft {
  return { _key: crypto.randomUUID(), stock_item_id: '', stock_item_name: '', unit: 'un', quantity: '1', unit_price: '' }
}

const inp = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#e2e8f0', padding: '7px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit',
} as const

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<PurchaseOrder | null>(null)
  const [items, setItems] = useState<PurchaseOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showEdit, setShowEdit] = useState(false)
  const [showReceive, setShowReceive] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  // Add item state
  const [draft, setDraft] = useState<PurchaseOrderItemDraft>(newDraft)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  async function load() {
    if (!id) return
    setLoading(true); setLoadError('')
    try {
      const [o, its] = await Promise.all([
        getPurchaseOrderById(id),
        getPurchaseOrderItems(id),
      ])
      setOrder(o); setItems(its)
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Erro ao carregar pedido.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (showAddItem) listStockItems().then(setStockItems).catch(() => {})
  }, [showAddItem])

  const isFinal = order?.status === 'recebido' || order?.status === 'cancelado'

  async function handleMarkAsSent() {
    if (!order) return
    setActionLoading(true); setActionError('')
    try {
      await markAsSent(order.id)
      setOrder(prev => prev ? { ...prev, status: 'enviado' } : prev)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao enviar pedido.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!order) return
    setActionLoading(true); setActionError('')
    try {
      await cancelPurchaseOrder(order.id)
      setOrder(prev => prev ? { ...prev, status: 'cancelado' } : prev)
      setShowCancel(false)
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro ao cancelar pedido.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!order || !draft.stock_item_name.trim()) { setAddError('Informe o nome do item.'); return }
    setAddLoading(true); setAddError('')
    try {
      const item = await addItemToPurchaseOrder(order.id, draft)
      setItems(prev => [...prev, item])
      setDraft(newDraft())
      setShowAddItem(false)
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Erro ao adicionar item.')
    } finally {
      setAddLoading(false)
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await removeItemFromPurchaseOrder(itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch {
      // silent — item may already be deleted
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1628' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: '#00c896' }} />
      </div>
    )
  }

  if (loadError || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0a1628' }}>
        <AlertTriangle size={32} style={{ color: '#f87171' }} />
        <p className="text-sm" style={{ color: '#f87171' }}>{loadError || 'Pedido não encontrado.'}</p>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    )
  }

  const total = items.reduce((acc, i) => acc + (i.unit_price ?? 0) * i.quantity_ordered, 0)
  const canReceive = order.status === 'enviado' || order.status === 'parcialmente_recebido'

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/compras')}
            className="p-2 rounded-lg transition-colors" style={{ color: '#475569' }}
            onMouseOver={e => (e.currentTarget.style.color = '#e2e8f0')}
            onMouseOut={e => (e.currentTarget.style.color = '#475569')}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <h1 className="text-xl font-bold text-white font-mono">{order.code}</h1>
            <PurchaseOrderStatusBadge status={order.status} />
          </div>
          {!isFinal && (
            <div className="flex items-center gap-2">
              {order.status === 'rascunho' && (
                <button onClick={() => setShowEdit(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Pencil size={13} /> Editar
                </button>
              )}
              {order.status === 'rascunho' && (
                <button onClick={handleMarkAsSent} disabled={actionLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Enviar ao Fornecedor
                </button>
              )}
              {canReceive && (
                <button onClick={() => setShowReceive(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(0,200,150,0.15)', color: '#00c896', border: '1px solid rgba(0,200,150,0.3)' }}>
                  <PackageCheck size={13} /> Registrar Recebimento
                </button>
              )}
              <button onClick={() => setShowCancel(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                <XCircle size={13} /> Cancelar
              </button>
            </div>
          )}
        </div>

        {actionError && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{actionError}</div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Fornecedor', value: order.supplier_name },
            { label: 'Data do Pedido', value: fmt(order.order_date) },
            { label: 'Previsão de Entrega', value: order.expected_date ? fmt(order.expected_date) : '—' },
            { label: 'Total Estimado', value: items.length > 0 ? fmtMoney(total) : '—' },
          ].map(c => (
            <div key={c.label} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#475569' }}>{c.label}</p>
              <p className="text-sm font-medium text-white">{c.value}</p>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8' }}>
            <span className="font-semibold text-xs" style={{ color: '#475569' }}>Observações: </span>{order.notes}
          </div>
        )}

        {/* Itens */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 className="text-sm font-semibold text-white">Itens do Pedido</h2>
            {!isFinal && order.status === 'rascunho' && (
              <button onClick={() => { setShowAddItem(v => !v); setDraft(newDraft()); setAddError('') }}
                className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#00c896' }}>
                <Plus size={13} /> Adicionar item
              </button>
            )}
          </div>

          {/* Add item inline form */}
          {showAddItem && (
            <form onSubmit={handleAddItem} className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,200,150,0.04)' }}>
              {addError && <p className="text-xs mb-2" style={{ color: '#f87171' }}>{addError}</p>}
              <div className="relative mb-2">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  style={{ ...inp, width: '100%', paddingLeft: 28 }}
                  value={draft.stock_item_name}
                  placeholder="Nome do item ou buscar no estoque..."
                  onChange={e => {
                    setDraft(d => ({ ...d, stock_item_id: '', stock_item_name: e.target.value }))
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && draft.stock_item_name && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg" style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.1)', maxHeight: 140, overflowY: 'auto' }}>
                    {stockItems.filter(s => s.name.toLowerCase().includes(draft.stock_item_name.toLowerCase())).slice(0, 5).map(s => (
                      <button key={s.id} type="button"
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
                        onClick={() => { setDraft(d => ({ ...d, stock_item_id: s.id, stock_item_name: s.name, unit: s.unit })); setShowSuggestions(false) }}>
                        <span className="text-sm text-white">{s.name}</span>
                        <span className="text-xs ml-2" style={{ color: '#475569' }}>{UNIT_SHORT[s.unit]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Qtd</label>
                  <input style={{ ...inp, width: '100%' }} value={draft.quantity} onChange={e => setDraft(d => ({ ...d, quantity: e.target.value }))} placeholder="1" />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Unidade</label>
                  <input style={{ ...inp, width: '100%' }} value={draft.unit} onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))} placeholder="un" />
                </div>
                <div>
                  <label className="text-xs font-semibold" style={{ color: '#94a3b8' }}>Preço Unit.</label>
                  <input style={{ ...inp, width: '100%' }} value={draft.unit_price} onChange={e => setDraft(d => ({ ...d, unit_price: e.target.value }))} placeholder="0,00" />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" disabled={addLoading}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}>
                    {addLoading ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Adicionar'}
                  </button>
                  <button type="button" onClick={() => setShowAddItem(false)}
                    className="py-1.5 px-2 rounded-lg text-xs" style={{ color: '#475569' }}>
                    ✕
                  </button>
                </div>
              </div>
            </form>
          )}

          {items.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <ShoppingBag size={28} style={{ color: '#1e3a5f' }} />
              <p className="text-sm" style={{ color: '#475569' }}>Nenhum item adicionado.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Item', 'Qtd Pedida', 'Qtd Recebida', 'Unidade', 'Preço Unit.', 'Total', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const allReceived = item.quantity_received >= item.quantity_ordered
                  return (
                    <tr key={item.id} style={{ borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-white">{item.stock_item_name}</p>
                        {item.stock_item_id && <p className="text-xs mt-0.5" style={{ color: '#334155' }}>Vinculado ao estoque</p>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-white">{item.quantity_ordered}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold" style={{ color: allReceived ? '#4ade80' : item.quantity_received > 0 ? '#fbbf24' : '#94a3b8' }}>
                          {item.quantity_received}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: '#94a3b8' }}>{item.unit}</td>
                      <td className="px-4 py-3.5 text-sm" style={{ color: '#94a3b8' }}>{fmtMoney(item.unit_price)}</td>
                      <td className="px-4 py-3.5 text-sm text-white">
                        {item.unit_price !== null ? fmtMoney(item.unit_price * item.quantity_ordered) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        {!isFinal && order.status === 'rascunho' && (
                          <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 rounded-lg" style={{ color: '#475569' }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <td colSpan={5} className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#475569' }}>Total estimado:</td>
                    <td className="px-4 py-3 text-sm font-bold text-white">{fmtMoney(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* Modais */}
      {showEdit && (
        <PurchaseOrderFormModal
          mode="edit"
          order={order}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setOrder(updated); setShowEdit(false) }}
        />
      )}

      {showReceive && (
        <ReceiveItemsModal
          order={order}
          items={items}
          onClose={() => setShowReceive(false)}
          onReceived={updated => {
            setOrder(updated)
            setShowReceive(false)
            load()
          }}
        />
      )}

      {/* Cancel confirm */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 className="text-white font-semibold text-base mb-2">Cancelar pedido?</h3>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              O pedido <strong className="text-white">{order.code}</strong> será marcado como cancelado. Itens já recebidos no estoque não serão revertidos.
            </p>
            {actionError && <p className="text-xs mb-3" style={{ color: '#f87171' }}>{actionError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Voltar
              </button>
              <button onClick={handleCancel} disabled={actionLoading} className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                Cancelar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
