export type FinancialType = 'receita' | 'despesa'

export type InstallmentStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado'

export type FinancialEntryStatus = 'ativo' | 'cancelado'

export type ReferenceType = 'sales_order' | 'purchase_order' | 'manual'

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'transferencia'
  | 'outro'

export interface FinancialInstallment {
  id: string
  financial_entry_id: string
  installment_number: number
  amount: number
  due_date: string
  status: InstallmentStatus
  payment_date: string | null
  payment_method: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FinancialEntry {
  id: string
  code: string
  type: FinancialType
  description: string
  category: string
  total_amount: number
  reference_type: ReferenceType | null
  reference_id: string | null
  reference_code: string | null
  notes: string | null
  status: FinancialEntryStatus
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  installments?: FinancialInstallment[]
}

export interface CreateInstallmentInput {
  installment_number: number
  amount: number
  due_date: string
}

export interface CreateFinancialEntryInput {
  type: FinancialType
  description: string
  category: string
  total_amount: number
  reference_type: ReferenceType
  reference_id?: string
  reference_code?: string
  notes?: string
  installments: CreateInstallmentInput[]
}

export interface RegisterPaymentInput {
  payment_date: string
  payment_method: PaymentMethod
  notes?: string
}

export const INSTALLMENT_STATUS_LABELS: Record<InstallmentStatus, string> = {
  pendente:  'Pendente',
  pago:      'Pago',
  vencido:   'Vencido',
  cancelado: 'Cancelado',
}

export const INSTALLMENT_STATUS_COLORS: Record<InstallmentStatus, { bg: string; text: string }> = {
  pendente:  { bg: 'rgba(245,158,11,0.15)',  text: '#f59e0b' },
  pago:      { bg: 'rgba(0,200,150,0.15)',   text: '#00c896' },
  vencido:   { bg: 'rgba(239,68,68,0.15)',   text: '#ef4444' },
  cancelado: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro:      'Dinheiro',
  pix:           'PIX',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito:  'Cartão de Débito',
  boleto:        'Boleto Bancário',
  transferencia: 'Transferência Bancária',
  outro:         'Outro',
}
