export type ProductCategory = 'cozinha' | 'quarto' | 'banheiro' | 'sala' | 'escritorio' | 'outro'
export type ProductStatus = 'ativo' | 'em_revisao' | 'inativo'

export interface EngineeringProduct {
  id: string
  code: string
  name: string
  description: string | null
  category: ProductCategory
  status: ProductStatus
  width_cm: number | null
  height_cm: number | null
  depth_cm: number | null
  material: string | null
  finish: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  bom_items?: BomItem[]
}

export interface BomItem {
  id: string
  product_id: string
  stock_item_id: string | null
  item_name: string
  quantity: number
  unit: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CreateProductInput {
  name: string
  description: string
  category: ProductCategory | ''
  width_cm: string
  height_cm: string
  depth_cm: string
  material: string
  finish: string
  notes: string
}

export interface UpdateProductInput extends CreateProductInput {
  status: ProductStatus
}

export interface CreateBomItemInput {
  item_name: string
  quantity: string
  unit: string
  notes: string
  stock_item_id?: string | null
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cozinha:    'Cozinha',
  quarto:     'Quarto',
  banheiro:   'Banheiro',
  sala:       'Sala',
  escritorio: 'Escritório',
  outro:      'Outro',
}

export const STATUS_LABELS: Record<ProductStatus, string> = {
  ativo:      'Ativo',
  em_revisao: 'Em Revisão',
  inativo:    'Inativo',
}

export const STATUS_COLORS: Record<ProductStatus, { bg: string; text: string }> = {
  ativo:      { bg: 'rgba(0,200,150,0.15)',   text: '#00c896' },
  em_revisao: { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  inativo:    { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
}

export const BOM_UNIT_OPTIONS = ['un', 'm²', 'ml', 'm', 'kg', 'L', 'pç', 'cx', 'fls']
