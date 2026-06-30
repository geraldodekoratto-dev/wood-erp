import { useState } from 'react'
import { X, Loader2, PackageCheck } from 'lucide-react'
import { receiveItems } from '../services/purchaseOrderService'
import type { PurchaseOrder, PurchaseOrderItem, ReceiveItemInput } from '../types'

interface Props {
  order: PurchaseOrder
  items: PurchaseOrderItem[]
  onClose: () => void
  onReceived: (updated: PurchaseOrder) => void
}

const inp = {
  width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
  borderRadius: 8, color: '#0f172a', padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  textAlign: 'center' as const,
} as const

export default function ReceiveItemsModal({ order, items, onClose, onReceived }: Props) {
  const pendingItems = items.filter(i => i.quantity_received < i.quantity_ordered)
  const [quantities, setQuantities] = useState<Record<string, string>>(() =>
    Object.fromEntries(pendingItems.map(i => [i.id, String(i.quantity_ordered - i.quantity_received)]))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setQty(id: string, val: string) {
    setQuantities(prev => ({ ...prev, [id]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const inputs: ReceiveItemInput[] = pendingItems
      .map(i => ({
        item_id:             i.id,
        stock_item_id:       i.stock_item_id,
        stock_item_name:     i.stock_item_name,
        unit:                i.unit,
        quantity_ordered:    i.quantity_ordered,
        quantity_received:   i.quantity_received,
        quantity_to_receive: quantities[i.id] ?? '0',
      }))
      .filter(i => {
        const n = parseFloat(i.quantity_to_receive.replace(',', '.'))
        return !isNaN(n) && n > 0
      })

    if (inputs.length === 0) {
      setError('Informe ao menos uma quantidade a receber.'); return
    }

    setLoading(true); setError('')
    try {
      const updated = await receiveItems(order.id, inputs)
      onReceived(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar recebimento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0', maxHeight: '90vh' }}>

        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2" style={{ color: '#0f172a' }}>
              <PackageCheck size={18} style={{ color: '#00c896' }} /> Registrar Recebimento
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{order.code} · {order.supplier_name}</p>
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: '#94a3b8' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-4 space-y-3 flex-1">
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>
            )}

            {pendingItems.length === 0 && (
              <p className="text-center py-6 text-sm" style={{ color: '#64748b' }}>Todos os itens já foram recebidos.</p>
            )}

            {pendingItems.map(item => {
              const pending = item.quantity_ordered - item.quantity_received
              return (
                <div key={item.id} className="rounded-lg p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#0f172a' }}>{item.stock_item_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                        Pedido: {item.quantity_ordered} {item.unit} · Recebido: {item.quantity_received} · Pendente: {pending}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold" style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>Qtd a receber:</label>
                    <input
                      style={{ ...inp, maxWidth: 100 }}
                      value={quantities[item.id] ?? ''}
                      onChange={e => setQty(item.id, e.target.value)}
                      placeholder="0"
                    />
                    <span className="text-xs" style={{ color: '#64748b' }}>{item.unit}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #e2e8f0' }}>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || pendingItems.length === 0}
              className="flex-[2] py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628', opacity: (loading || pendingItems.length === 0) ? 0.6 : 1 }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Registrando...' : 'Confirmar Recebimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
