import { STATUS_LABELS, STATUS_COLORS } from '../types'
import type { InstallationStatus } from '../types'

export default function InstallationStatusBadge({ status }: { status: InstallationStatus }) {
  const { bg, text } = STATUS_COLORS[status]
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: bg, color: text }}>
      {STATUS_LABELS[status]}
    </span>
  )
}
