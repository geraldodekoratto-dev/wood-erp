export type PurchaseOrderStatus =
  | 'rascunho'
  | 'enviado'
  | 'parcialmente_recebido'
  | 'recebido'
  | 'cancelado'

export interface PurchaseOrder {
  id: string
  code: string
  supplier_name: string
  status: PurchaseOrderStatus
  order_date: string
  expected_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  stock_item_id: string | null
  stock_item_name: string
  unit: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number | null
  created_at: string
}

export interface CreatePurchaseOrderInput {
  supplier_name: string
  order_date: string
  expected_date: string
  notes: string
}

export interface PurchaseOrderItemDraft {
  _key: string
  stock_item_id: string
  stock_item_name: string
  unit: string
  quantity: string
  unit_price: string
}

export interface ReceiveItemInput {
  item_id: string
  stock_item_id: string | null
  stock_item_name: string
  unit: string
  quantity_ordered: number
  quantity_received: number
  quantity_to_receive: string
}

export const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  rascunho:               'Rascunho',
  enviado:                'Enviado',
  parcialmente_recebido:  'Parcialmente Recebido',
  recebido:               'Recebido',
  cancelado:              'Cancelado',
}

export const STATUS_COLORS: Record<PurchaseOrderStatus, { bg: string; text: string }> = {
  rascunho:               { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  enviado:                { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  parcialmente_recebido:  { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  recebido:               { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80' },
  cancelado:              { bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
}
