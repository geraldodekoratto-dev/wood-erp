import type { CustomerType, CustomerStatus } from '../types'
import { TYPE_SHORT, TYPE_COLORS, STATUS_LABELS, STATUS_COLORS } from '../types'

export function CustomerTypeBadge({ type }: { type: CustomerType }) {
  const { bg, text } = TYPE_COLORS[type]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
      style={{ background: bg, color: text }}>
      {TYPE_SHORT[type]}
    </span>
  )
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
      style={{ background: bg, color: text }}>
      {STATUS_LABELS[status]}
    </span>
  )
}
