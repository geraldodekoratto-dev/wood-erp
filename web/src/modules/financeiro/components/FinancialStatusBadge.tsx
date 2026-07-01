import type { InstallmentStatus } from '../types'
import { INSTALLMENT_STATUS_LABELS, INSTALLMENT_STATUS_COLORS } from '../types'

export default function FinancialStatusBadge({ status }: { status: InstallmentStatus }) {
  const { bg, text } = INSTALLMENT_STATUS_COLORS[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
      style={{ background: bg, color: text }}>
      {INSTALLMENT_STATUS_LABELS[status]}
    </span>
  )
}
