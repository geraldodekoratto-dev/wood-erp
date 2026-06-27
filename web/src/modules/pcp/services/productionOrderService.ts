import { supabase } from '@/lib/supabase'
import type { ProductionOrder, CreateProductionOrderInput, ProductionOrderStatus } from '../types'

function generateReference(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `OP-${year}-${random}`
}

export async function listProductionOrders(): Promise<ProductionOrder[]> {
  const { data, error } = await supabase
    .from('production_order')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as ProductionOrder[]
}

export async function createProductionOrder(input: CreateProductionOrderInput): Promise<ProductionOrder> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('production_order')
    .insert({
      reference_number: generateReference(),
      client_name: input.client_name,
      project_name: input.project_name,
      priority: input.priority,
      sale_date: input.sale_date || null,
      delivery_date: input.delivery_date || null,
      notes: input.notes || null,
      status: 'aguardando_conferencia',
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ProductionOrder
}

export async function updateOrderStatus(id: string, status: ProductionOrderStatus): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('production_order')
    .update({ status, updated_at: new Date().toISOString(), updated_by: user?.id })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteProductionOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('production_order')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
