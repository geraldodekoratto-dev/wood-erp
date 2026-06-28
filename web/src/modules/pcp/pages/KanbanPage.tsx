import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Kanban } from 'lucide-react'
import { listProductionOrders, updateOrderStatus } from '../services/productionOrderService'
import type { ProductionOrder, ProductionOrderStatus } from '../types'
import KanbanColumn from '../components/KanbanColumn'

const KANBAN_COLUMNS: ProductionOrderStatus[] = [
  'aguardando_conferencia',
  'em_projeto',
  'conferencia_tecnica',
  'aguardando_aprovacao',
  'em_producao',
  'montagem_interna',
  'pintura',
  'expedicao',
  'entregue',
]

export default function KanbanPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOrder, setDragOrder] = useState<ProductionOrder | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<ProductionOrderStatus | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await listProductionOrders()
      setOrders(data.filter(o => o.status !== 'cancelado'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleDragStart(e: React.DragEvent, order: ProductionOrder) {
    setDragOrder(order)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, status: ProductionOrderStatus) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStatus(status)
  }

  function handleDragLeave() {
    setDragOverStatus(null)
  }

  const handleDrop = useCallback(async (e: React.DragEvent, status: ProductionOrderStatus) => {
    e.preventDefault()
    setDragOverStatus(null)
    if (!dragOrder || dragOrder.status === status) return

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === dragOrder.id ? { ...o, status } : o))

    try {
      await updateOrderStatus(dragOrder.id, status)
    } catch {
      // Rollback on error
      setOrders(prev => prev.map(o => o.id === dragOrder.id ? { ...o, status: dragOrder.status } : o))
    }
    setDragOrder(null)
  }, [dragOrder])

  const ordersByStatus = (status: ProductionOrderStatus) =>
    orders.filter(o => o.status === status)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Kanban size={26} style={{ color: '#00c896' }} />
            Painel Kanban
          </h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Arraste as ordens para avançar as etapas de produção
          </p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3" style={{ color: '#00c896' }} />
            <p className="text-sm" style={{ color: '#475569' }}>Carregando ordens...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                orders={ordersByStatus(status)}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                isDragOver={dragOverStatus === status}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
