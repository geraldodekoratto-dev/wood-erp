import { supabase } from '@/lib/supabase'
import type { StockItem, CreateStockItemInput, UpdateStockItemInput } from '../types'

function generateCode(): string {
  const n = Math.floor(Math.random() * 9000) + 1000
  return `EST-${n}`
}

function parseQty(v: string): number {
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) || n < 0 ? 0 : n
}

function parsePrice(v: string): number | null {
  const trimmed = v.trim()
  if (!trimmed) return null
  if (trimmed.includes(',')) {
    const n = parseFloat(trimmed.replace(/\./g, '').replace(',', '.'))
    return isNaN(n) ? null : n
  }
  const n = parseFloat(trimmed)
  return isNaN(n) ? null : n
}

export async function listStockItems(): Promise<StockItem[]> {
  const { data, error } = await supabase
    .from('stock_item')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data as StockItem[]
}

export async function getStockItemById(id: string): Promise<StockItem> {
  const { data, error } = await supabase
    .from('stock_item')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as StockItem
}

export async function createStockItem(input: CreateStockItemInput): Promise<StockItem> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('stock_item')
    .insert({
      code:             generateCode(),
      name:             input.name.trim(),
      description:      input.description.trim() || null,
      category:         input.category || 'outro',
      unit:             input.unit || 'un',
      min_quantity:     parseQty(input.min_quantity),
      current_quantity: 0,
      cost_price:       parsePrice(input.cost_price),
      supplier:         input.supplier.trim() || null,
      created_by:       user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  const item = data as StockItem

  // Registra estoque inicial como movimentação de ajuste
  const initialQty = parseQty(input.initial_quantity)
  if (initialQty > 0) {
    await supabase.rpc('add_stock_movement', {
      p_stock_item_id:  item.id,
      p_type:           'entrada',
      p_quantity:       initialQty,
      p_reason:         'ajuste_inventario',
      p_notes:          'Estoque inicial',
      p_reference_id:   null,
      p_reference_type: null,
      p_user_id:        user?.id ?? null,
    })
    return { ...item, current_quantity: initialQty }
  }

  return item
}

export async function updateStockItem(id: string, input: UpdateStockItemInput): Promise<StockItem> {
  const { data, error } = await supabase
    .from('stock_item')
    .update({
      name:         input.name.trim(),
      description:  input.description.trim() || null,
      category:     input.category || 'outro',
      unit:         input.unit || 'un',
      min_quantity: parseQty(input.min_quantity),
      cost_price:   parsePrice(input.cost_price),
      supplier:     input.supplier.trim() || null,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as StockItem
}

export async function deleteStockItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('stock_item')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
