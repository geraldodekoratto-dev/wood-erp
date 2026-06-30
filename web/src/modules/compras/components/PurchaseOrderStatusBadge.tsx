import type { PurchaseOrderStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS } from '../types'

export default function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
      style={{ background: bg, color: text }}>
      {STATUS_LABELS[status]}
    </span>
  )
}
