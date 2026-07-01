export type InstallationStatus = 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'

export interface InstallationOrder {
  id: string
  code: string
  sales_order_id: string | null
  sales_order_code: string | null
  customer_name: string
  customer_address: string | null
  scheduled_date: string
  scheduled_time: string | null
  technician: string | null
  status: InstallationStatus
  notes: string | null
  completion_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreateInstallationInput {
  customer_name: string
  customer_address: string
  scheduled_date: string
  scheduled_time: string
  technician: string
  notes: string
  sales_order_id?: string | null
  sales_order_code?: string | null
}

export interface UpdateInstallationInput extends CreateInstallationInput {
  completion_notes: string
}

export const STATUS_LABELS: Record<InstallationStatus, string> = {
  agendado:    'Agendado',
  em_andamento: 'Em Andamento',
  concluido:   'Concluído',
  cancelado:   'Cancelado',
}

export const STATUS_COLORS: Record<InstallationStatus, { bg: string; text: string }> = {
  agendado:    { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  em_andamento:{ bg: 'rgba(0,200,150,0.15)',   text: '#00c896' },
  concluido:   { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  cancelado:   { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
}
