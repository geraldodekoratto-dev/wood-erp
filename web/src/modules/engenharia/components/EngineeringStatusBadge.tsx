import { STATUS_LABELS, STATUS_COLORS } from '../types'
import type { ProductStatus } from '../types'

export default function EngineeringStatusBadge({ status }: { status: ProductStatus }) {
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: bg, color: text }}>
      {STATUS_LABELS[status]}
    </span>
  )
}
