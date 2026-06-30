import { supabase } from '@/lib/supabase'
import type { StockItem, StockMovement, CreateMovementInput } from '../types'

function parseQty(v: string): number {
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

export async function listMovements(stockItemId: string): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movement')
    .select('*')
    .eq('stock_item_id', stockItemId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as StockMovement[]
}

export async function addMovement(
  stockItemId: string,
  input: CreateMovementInput
): Promise<StockItem> {
  const { data: { user } } = await supabase.auth.getUser()
  const qty = parseQty(input.quantity)

  if (qty <= 0) throw new Error('Quantidade deve ser maior que zero.')

  const { data, error } = await supabase.rpc('add_stock_movement', {
    p_stock_item_id:  stockItemId,
    p_type:           input.type,
    p_quantity:       qty,
    p_reason:         input.reason || 'outro',
    p_notes:          input.notes.trim() || null,
    p_reference_id:   null,
    p_reference_type: null,
    p_user_id:        user?.id ?? null,
  })

  if (error) throw new Error(error.message)
  return data as StockItem
}
