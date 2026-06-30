import type { StockItem } from '../types'
import { getStockStatus, STATUS_CONFIG } from '../types'

export default function StockStatusBadge({ item }: { item: Pick<StockItem, 'current_quantity' | 'min_quantity'> }) {
  const status = getStockStatus(item)
  const { label, bg, text } = STATUS_CONFIG[status]
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
      style={{ background: bg, color: text }}>
      {label}
    </span>
  )
}
