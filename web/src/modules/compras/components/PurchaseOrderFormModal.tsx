import { useEffect, useState } from 'react'
import { X, Loader2, Plus, Trash2, Search } from 'lucide-react'
import { createPurchaseOrder, updatePurchaseOrder } from '../services/purchaseOrderService'
import { listStockItems } from '@/modules/estoque/services/stockItemService'
import type { StockItem } from '@/modules/estoque/types'
import { UNIT_SHORT } from '@/modules/estoque/types'
import type { PurchaseOrder, CreatePurchaseOrderInput, PurchaseOrderItemDraft } from '../types'

interface Props {
  mode: 'create' | 'edit'
  order?: PurchaseOrder
  onClose: () => void
  onSaved: (order: PurchaseOrder) => void
}

const EMPTY_HEADER: CreatePurchaseOrderInput = {
  supplier_name: '',
  order_date: new Date().toISOString().slice(0, 10),
  expected_date: '',
  notes: '',
}

function newDraft(): PurchaseOrderItemDraft {
  return { _key: crypto.randomUUID(), stock_item_id: '', stock_item_name: '', unit: 'un', quantity: '1', unit_price: '' }
}

const inp = {
  width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
  borderRadius: 8, color: '#0f172a', padding: '9px 12px', fontSize: 13, outline: 'none', fontFamily: 'inherit',
} as const

const lbl = { color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' } as const

export default function PurchaseOrderFormModal({ mode, order, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CreatePurchaseOrderInput>(
    mode === 'edit' && order
      ? { supplier_name: order.supplier_name, order_date: order.order_date, expected_date: order.expected_date ?? '', notes: order.notes ?? '' }
      : EMPTY_HEADER
  )
  const [items, setItems] = useState<PurchaseOrderItemDraft[]>(mode === 'create' ? [newDraft()] : [])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [activeSearch, setActiveSearch] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode === 'create') listStockItems().then(setStockItems).catch(() => {})
  }, [mode])

  function setHeader<K extends keyof CreatePurchaseOrderInput>(k: K, v: CreatePurchaseOrderInput[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function updateItem(key: string, patch: Partial<PurchaseOrderItemDraft>) {
    setItems(prev => prev.map(i => i._key === key ? { ...i, ...patch } : i))
  }

  function selectStockItem(key: string, si: StockItem) {
    updateItem(key, { stock_item_id: si.id, stock_item_name: si.name, unit: si.unit })
    setActiveSearch(null)
  }

  function removeItem(key: string) {
    setItems(prev => prev.filter(i => i._key !== key))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.supplier_name.trim()) { setError('Informe o nome do fornecedor.'); return }
    if (mode === 'create' && items.some(i => !i.stock_item_name.trim())) {
      setError('Preencha o nome de todos os itens ou remova as linhas vazias.'); return
    }
    setLoading(true); setError('')
    try {
      const saved = mode === 'edit' && order
        ? await updatePurchaseOrder(order.id, form)
        : await createPurchaseOrder(form, items.filter(i => i.stock_item_name.trim()))
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar pedido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0', maxHeight: '92vh' }}>

        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="font-semibold text-lg" style={{ color: '#0f172a' }}>{mode === 'edit' ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}</h2>
          <button onClick={onClose} className="transition-colors" style={{ color: '#94a3b8' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>
            )}

            <div>
              <label style={lbl}>Fornecedor *</label>
              <input style={inp} value={form.supplier_name} onChange={e => setHeader('supplier_name', e.target.value)} placeholder="Nome do fornecedor" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Data do Pedido</label>
                <input type="date" style={inp} value={form.order_date} onChange={e => setHeader('order_date', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Previsão de Entrega</label>
                <input type="date" style={inp} value={form.expected_date} onChange={e => setHeader('expected_date', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={lbl}>Observações</label>
              <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }} value={form.notes} onChange={e => setHeader('notes', e.target.value)} placeholder="Condições, referências, observações gerais..." />
            </div>

            {/* Itens — apenas no modo criação */}
            {mode === 'create' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label style={{ ...lbl, marginBottom: 0 }}>Itens do Pedido</label>
                  <button type="button" onClick={() => setItems(prev => [...prev, newDraft()])}
                    className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#00c896' }}>
                    <Plus size={13} /> Adicionar item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item._key} className="rounded-lg p-3 relative" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      {/* Stock item search */}
                      <div className="relative mb-2">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
                        <input
                          style={{ ...inp, paddingLeft: 32, fontSize: 12 }}
                          value={item.stock_item_name}
                          placeholder="Buscar item do estoque..."
                          onChange={e => {
                            updateItem(item._key, { stock_item_id: '', stock_item_name: e.target.value, unit: item.unit })
                            setActiveSearch(item._key)
                          }}
                          onFocus={() => setActiveSearch(item._key)}
                        />
                        {activeSearch === item._key && item.stock_item_name && (
                          <div className="absolute z-10 w-full mt-1 rounded-lg overflow-hidden shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0', maxHeight: 160, overflowY: 'auto' }}>
                            {stockItems.filter(s => s.name.toLowerCase().includes(item.stock_item_name.toLowerCase())).slice(0, 6).map(s => (
                              <button key={s.id} type="button"
                                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                                onClick={() => selectStockItem(item._key, s)}>
                                <span className="text-sm" style={{ color: '#0f172a' }}>{s.name}</span>
                                <span className="text-xs ml-2" style={{ color: '#64748b' }}>{UNIT_SHORT[s.unit]} · {s.current_quantity} disponível</span>
                              </button>
                            ))}
                            {stockItems.filter(s => s.name.toLowerCase().includes(item.stock_item_name.toLowerCase())).length === 0 && (
                              <p className="px-3 py-2 text-xs" style={{ color: '#64748b' }}>Item livre (não vinculado ao estoque)</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-end">
                        <div>
                          <label style={{ ...lbl, fontSize: 11 }}>Qtd</label>
                          <input style={{ ...inp, fontSize: 12 }} value={item.quantity} onChange={e => updateItem(item._key, { quantity: e.target.value })} placeholder="1" />
                        </div>
                        <div>
                          <label style={{ ...lbl, fontSize: 11 }}>Unidade</label>
                          <input style={{ ...inp, fontSize: 12 }} value={item.unit} onChange={e => updateItem(item._key, { unit: e.target.value })} placeholder="un" />
                        </div>
                        <div>
                          <label style={{ ...lbl, fontSize: 11 }}>Preço Unit. (R$)</label>
                          <input style={{ ...inp, fontSize: 12 }} value={item.unit_price} onChange={e => updateItem(item._key, { unit_price: e.target.value })} placeholder="0,00" />
                        </div>
                      </div>

                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(item._key)}
                          className="absolute top-2.5 right-2.5 p-1 rounded" style={{ color: '#64748b' }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #e2e8f0' }}>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-[2] py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628', opacity: loading ? 0.7 : 1 }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Salvando...' : mode === 'edit' ? 'Salvar Alterações' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
