import { STATUS_LABELS, STATUS_COLORS } from '../types'
import type { ProductionOrderStatus } from '../types'

export default function StatusBadge({ status }: { status: ProductionOrderStatus }) {
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
      style={{ background: bg, color: text }}>
      {STATUS_LABELS[status]}
    </span>
  )
}
