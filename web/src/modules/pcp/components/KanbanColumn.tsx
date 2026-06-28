import type { ProductionOrder, ProductionOrderStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS } from '../types'
import KanbanCard from './KanbanCard'

interface Props {
  status: ProductionOrderStatus
  orders: ProductionOrder[]
  onDragStart: (e: React.DragEvent, order: ProductionOrder) => void
  onDrop: (e: React.DragEvent, status: ProductionOrderStatus) => void
  isDragOver: boolean
  onDragOver: (e: React.DragEvent, status: ProductionOrderStatus) => void
  onDragLeave: () => void
}

export default function KanbanColumn({
  status, orders, onDragStart, onDrop, isDragOver, onDragOver, onDragLeave
}: Props) {
  const { bg, text } = STATUS_COLORS[status]

  return (
    <div className="flex flex-col min-w-[220px] w-[220px]">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl mb-0"
        style={{ background: '#0f2040', borderBottom: `2px solid ${text}30` }}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: text }} />
          <span className="text-xs font-semibold" style={{ color: text }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: bg, color: text }}>
          {orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => onDragOver(e, status)}
        onDrop={e => onDrop(e, status)}
        onDragLeave={onDragLeave}
        className="flex-1 flex flex-col gap-2.5 p-2 rounded-b-xl min-h-[500px] transition-all"
        style={{
          background: isDragOver ? 'rgba(0,200,150,0.06)' : 'rgba(15,32,64,0.4)',
          border: `1px solid ${isDragOver ? 'rgba(0,200,150,0.3)' : 'rgba(255,255,255,0.05)'}`,
          borderTop: 'none',
        }}>
        {orders.map(order => (
          <KanbanCard key={order.id} order={order} onDragStart={onDragStart} />
        ))}
        {orders.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-center px-4" style={{ color: '#1e3a5f' }}>
              Arraste uma ordem aqui
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
