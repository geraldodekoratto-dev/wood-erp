export type SalesOrderStatus =
  | 'rascunho'
  | 'confirmado'
  | 'em_producao'
  | 'entregue'
  | 'cancelado'

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'transferencia'
  | 'financiamento'
  | 'outro'

export interface SalesOrder {
  id: string
  code: string
  customer_id: string | null
  customer_name: string
  status: SalesOrderStatus
  sale_date: string
  delivery_date: string | null
  total_value: number | null
  payment_method: PaymentMethod | null
  payment_terms: string | null
  description: string | null
  notes: string | null
  production_order_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface CreateSalesOrderInput {
  customer_id: string
  customer_name: string
  sale_date: string
  delivery_date: string
  total_value: string
  payment_method: PaymentMethod | ''
  payment_terms: string
  description: string
  notes: string
}

export interface UpdateSalesOrderInput extends CreateSalesOrderInput {}

export const STATUS_LABELS: Record<SalesOrderStatus, string> = {
  rascunho:    'Rascunho',
  confirmado:  'Confirmado',
  em_producao: 'Em Produção',
  entregue:    'Entregue',
  cancelado:   'Cancelado',
}

export const STATUS_COLORS: Record<SalesOrderStatus, { bg: string; text: string }> = {
  rascunho:    { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  confirmado:  { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  em_producao: { bg: 'rgba(0,200,150,0.15)',   text: '#00c896' },
  entregue:    { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  cancelado:   { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro:      'Dinheiro',
  pix:           'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito:  'Cartão de Débito',
  boleto:        'Boleto Bancário',
  transferencia: 'Transferência Bancária',
  financiamento: 'Financiamento',
  outro:         'Outro',
}
