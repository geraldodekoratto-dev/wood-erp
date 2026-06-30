import { supabase } from '@/lib/supabase'
import { createProductionOrder, deleteProductionOrder } from '@/modules/pcp/services/productionOrderService'
import type { SalesOrder, CreateSalesOrderInput, UpdateSalesOrderInput, SalesOrderStatus } from '../types'

function generateCode(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `VDA-${year}-${random}`
}

function parseValue(v: string): number | null {
  const trimmed = v.trim()
  if (!trimmed) return null
  // pt-BR: "1.234,56" or "1234,56" — strip thousand-sep dots, swap decimal comma
  if (trimmed.includes(',')) {
    const n = parseFloat(trimmed.replace(/\./g, '').replace(',', '.'))
    return isNaN(n) ? null : n
  }
  // plain integer or en-US decimal ("1500" or "1500.50")
  const n = parseFloat(trimmed)
  return isNaN(n) ? null : n
}

export async function listSalesOrders(): Promise<SalesOrder[]> {
  const { data, error } = await supabase
    .from('sales_order')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as SalesOrder[]
}

export async function getSalesOrderById(id: string): Promise<SalesOrder> {
  const { data, error } = await supabase
    .from('sales_order')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as SalesOrder
}

export async function createSalesOrder(input: CreateSalesOrderInput): Promise<SalesOrder> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('sales_order')
    .insert({
      code: generateCode(),
      customer_id: input.customer_id || null,
      customer_name: input.customer_name,
      status: 'rascunho',
      sale_date: input.sale_date,
      delivery_date: input.delivery_date || null,
      total_value: parseValue(input.total_value),
      payment_method: input.payment_method || null,
      payment_terms: input.payment_terms || null,
      description: input.description || null,
      notes: input.notes || null,
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SalesOrder
}

export async function updateSalesOrder(id: string, input: UpdateSalesOrderInput): Promise<SalesOrder> {
  const { data, error } = await supabase
    .from('sales_order')
    .update({
      customer_id: input.customer_id || null,
      customer_name: input.customer_name,
      sale_date: input.sale_date,
      delivery_date: input.delivery_date || null,
      total_value: parseValue(input.total_value),
      payment_method: input.payment_method || null,
      payment_terms: input.payment_terms || null,
      description: input.description || null,
      notes: input.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SalesOrder
}

// Confirma o pedido e gera automaticamente uma Ordem de Produção no PCP
export async function confirmSalesOrder(
  salesOrder: SalesOrder,
  priority: 'baixa' | 'normal' | 'alta' | 'urgente' = 'normal'
): Promise<SalesOrder> {
  // 1. Cria a OP no PCP
  const productionOrder = await createProductionOrder({
    client_name: salesOrder.customer_name,
    project_name: salesOrder.description || salesOrder.code,
    priority,
    sale_date: salesOrder.sale_date,
    delivery_date: salesOrder.delivery_date ?? '',
    notes: `Gerado automaticamente do pedido de venda ${salesOrder.code}`,
  })

  // 2. Atualiza o pedido de venda com o ID da OP e status
  // Se este passo falhar, faz rollback da OP criada para evitar OP órfã no PCP
  try {
    const { data, error } = await supabase
      .from('sales_order')
      .update({
        status: 'em_producao',
        production_order_id: productionOrder.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', salesOrder.id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as SalesOrder
  } catch (err) {
    await deleteProductionOrder(productionOrder.id).catch(() => {})
    throw err
  }
}

export async function cancelSalesOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('sales_order')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function updateSalesOrderStatus(id: string, status: SalesOrderStatus): Promise<void> {
  const { error } = await supabase
    .from('sales_order')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteSalesOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('sales_order')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
