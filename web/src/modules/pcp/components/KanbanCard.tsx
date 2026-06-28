import { Calendar, AlertTriangle } from 'lucide-react'
import type { ProductionOrder } from '../types'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../types'

interface Props {
  order: ProductionOrder
  onDragStart: (e: React.DragEvent, order: ProductionOrder) => void
}

function isOverdue(deliveryDate: string | null): boolean {
  if (!deliveryDate) return false
  return deliveryDate < new Date().toISOString().slice(0, 10)
}

function formatDate(date: string | null) {
  if (!date) return null
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function KanbanCard({ order, onDragStart }: Props) {
  const overdue = isOverdue(order.delivery_date)

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, order)}
      className="rounded-xl p-4 cursor-grab active:cursor-grabbing select-none transition-all hover:translate-y-[-2px]"
      style={{
        background: '#0a1628',
        border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: overdue ? '0 0 0 1px rgba(239,68,68,0.15)' : 'none',
      }}>

      {/* Reference + Priority */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-mono font-semibold" style={{ color: '#00c896' }}>
          {order.reference_number}
        </span>
        <span className="text-xs font-semibold" style={{ color: PRIORITY_COLORS[order.priority] }}>
          {PRIORITY_LABELS[order.priority]}
        </span>
      </div>

      {/* Client */}
      <div className="text-sm font-semibold text-white mb-1 truncate">
        {order.client_name}
      </div>

      {/* Project */}
      <div className="text-xs truncate mb-3" style={{ color: '#64748b' }}>
        {order.project_name}
      </div>

      {/* Delivery date */}
      {order.delivery_date && (
        <div className="flex items-center gap-1.5 text-xs"
          style={{ color: overdue ? '#f87171' : '#475569' }}>
          {overdue
            ? <AlertTriangle size={12} />
            : <Calendar size={12} />}
          {overdue ? 'Atrasado · ' : ''}{formatDate(order.delivery_date)}
        </div>
      )}
    </div>
  )
}
