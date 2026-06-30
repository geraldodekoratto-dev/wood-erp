export type StockCategory = 'materia_prima' | 'ferragem' | 'acabamento' | 'produto_acabado' | 'outro'
export type StockUnit = 'un' | 'm2' | 'm_linear' | 'kg' | 'litro' | 'pc' | 'cx' | 'm'
export type MovementType = 'entrada' | 'saida'
export type MovementReason =
  | 'compra'
  | 'consumo_producao'
  | 'devolucao_cliente'
  | 'devolucao_fornecedor'
  | 'ajuste_inventario'
  | 'perda'
  | 'outro'

export type StockStatus = 'ok' | 'baixo' | 'zerado'

export interface StockItem {
  id: string
  code: string
  name: string
  description: string | null
  category: StockCategory
  unit: StockUnit
  min_quantity: number
  current_quantity: number
  cost_price: number | null
  supplier: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface StockMovement {
  id: string
  stock_item_id: string
  type: MovementType
  quantity: number
  reason: MovementReason
  notes: string | null
  reference_id: string | null
  reference_type: string | null
  created_by: string | null
  created_at: string
}

export interface CreateStockItemInput {
  name: string
  description: string
  category: StockCategory | ''
  unit: StockUnit | ''
  min_quantity: string
  initial_quantity: string
  cost_price: string
  supplier: string
}

export interface UpdateStockItemInput {
  name: string
  description: string
  category: StockCategory | ''
  unit: StockUnit | ''
  min_quantity: string
  cost_price: string
  supplier: string
}

export interface CreateMovementInput {
  type: MovementType
  quantity: string
  reason: MovementReason | ''
  notes: string
}

export function getStockStatus(item: Pick<StockItem, 'current_quantity' | 'min_quantity'>): StockStatus {
  if (item.current_quantity <= 0) return 'zerado'
  if (item.current_quantity <= item.min_quantity) return 'baixo'
  return 'ok'
}

export const CATEGORY_LABELS: Record<StockCategory, string> = {
  materia_prima:   'Matéria-Prima',
  ferragem:        'Ferragem',
  acabamento:      'Acabamento',
  produto_acabado: 'Produto Acabado',
  outro:           'Outro',
}

export const UNIT_LABELS: Record<StockUnit, string> = {
  un:       'Unidade (un)',
  m2:       'Metro Quadrado (m²)',
  m_linear: 'Metro Linear (ml)',
  kg:       'Quilograma (kg)',
  litro:    'Litro (L)',
  pc:       'Peça (pç)',
  cx:       'Caixa (cx)',
  m:        'Metro (m)',
}

export const UNIT_SHORT: Record<StockUnit, string> = {
  un: 'un', m2: 'm²', m_linear: 'ml', kg: 'kg', litro: 'L', pc: 'pç', cx: 'cx', m: 'm',
}

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  entrada: 'Entrada',
  saida:   'Saída',
}

export const REASON_LABELS: Record<MovementReason, string> = {
  compra:               'Compra',
  consumo_producao:     'Consumo em Produção',
  devolucao_cliente:    'Devolução de Cliente',
  devolucao_fornecedor: 'Devolução a Fornecedor',
  ajuste_inventario:    'Ajuste de Inventário',
  perda:                'Perda / Descarte',
  outro:                'Outro',
}

export const REASONS_BY_TYPE: Record<MovementType, MovementReason[]> = {
  entrada: ['compra', 'devolucao_cliente', 'ajuste_inventario', 'outro'],
  saida:   ['consumo_producao', 'devolucao_fornecedor', 'ajuste_inventario', 'perda', 'outro'],
}

export const STATUS_CONFIG: Record<StockStatus, { label: string; bg: string; text: string }> = {
  ok:     { label: 'OK',     bg: 'rgba(0,200,150,0.15)',  text: '#00c896' },
  baixo:  { label: 'Baixo',  bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  zerado: { label: 'Zerado', bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
}
