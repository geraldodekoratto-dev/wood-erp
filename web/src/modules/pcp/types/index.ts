export type ProductionOrderStatus =
  | 'aguardando_conferencia'
  | 'em_projeto'
  | 'conferencia_tecnica'
  | 'aguardando_aprovacao'
  | 'em_producao'
  | 'montagem_interna'
  | 'pintura'
  | 'expedicao'
  | 'entregue'
  | 'cancelado'

export type ProductionOrderPriority = 'baixa' | 'normal' | 'alta' | 'urgente'

export interface ProductionOrder {
  id: string
  reference_number: string
  client_name: string
  project_name: string
  status: ProductionOrderStatus
  priority: ProductionOrderPriority
  sale_date: string | null
  delivery_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface CreateProductionOrderInput {
  client_name: string
  project_name: string
  priority: ProductionOrderPriority
  sale_date: string
  delivery_date: string
  notes: string
}

export interface UpdateProductionOrderInput {
  client_name: string
  project_name: string
  priority: ProductionOrderPriority
  sale_date: string
  delivery_date: string
  notes: string
}

export const STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  aguardando_conferencia: 'Aguardando Conferência',
  em_projeto: 'Em Projeto',
  conferencia_tecnica: 'Conferência Técnica',
  aguardando_aprovacao: 'Aguardando Aprovação',
  em_producao: 'Em Produção',
  montagem_interna: 'Montagem Interna',
  pintura: 'Pintura',
  expedicao: 'Expedição',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const STATUS_COLORS: Record<ProductionOrderStatus, { bg: string; text: string }> = {
  aguardando_conferencia: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
  em_projeto:             { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  conferencia_tecnica:    { bg: 'rgba(245,158,11,0.15)',  text: '#fbbf24' },
  aguardando_aprovacao:   { bg: 'rgba(249,115,22,0.15)',  text: '#fb923c' },
  em_producao:            { bg: 'rgba(0,200,150,0.15)',   text: '#00c896' },
  montagem_interna:       { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc' },
  pintura:                { bg: 'rgba(236,72,153,0.15)',  text: '#f472b6' },
  expedicao:              { bg: 'rgba(20,184,166,0.15)',  text: '#2dd4bf' },
  entregue:               { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80' },
  cancelado:              { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
}

export const PRIORITY_LABELS: Record<ProductionOrderPriority, string> = {
  baixa: 'Baixa', normal: 'Normal', alta: 'Alta', urgente: 'Urgente',
}

export const PRIORITY_COLORS: Record<ProductionOrderPriority, string> = {
  baixa: '#64748b', normal: '#60a5fa', alta: '#fbbf24', urgente: '#f87171',
}
