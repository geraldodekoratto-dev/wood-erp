import type { SalesOrderStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS } from '../types'

export default function SalesOrderStatusBadge({ status }: { status: SalesOrderStatus }) {
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
      style={{ background: bg, color: text }}>
      {STATUS_LABELS[status]}
    </span>
  )
}
