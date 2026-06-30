import { supabase } from '@/lib/supabase'
import type {
  PurchaseOrder, PurchaseOrderItem,
  CreatePurchaseOrderInput, PurchaseOrderItemDraft, ReceiveItemInput,
  PurchaseOrderStatus,
} from '../types'

function generateCode(): string {
  const year = new Date().getFullYear()
  const n = Math.floor(Math.random() * 9000) + 1000
  return `CMP-${year}-${n}`
}

function parseQty(v: string): number {
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) || n <= 0 ? 1 : n
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

export async function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  const { data, error } = await supabase
    .from('purchase_order')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as PurchaseOrder[]
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
  const { data, error } = await supabase
    .from('purchase_order')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as PurchaseOrder
}

export async function getPurchaseOrderItems(purchaseOrderId: string): Promise<PurchaseOrderItem[]> {
  const { data, error } = await supabase
    .from('purchase_order_item')
    .select('*')
    .eq('purchase_order_id', purchaseOrderId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data as PurchaseOrderItem[]
}

export async function createPurchaseOrder(
  input: CreatePurchaseOrderInput,
  items: PurchaseOrderItemDraft[]
): Promise<PurchaseOrder> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('purchase_order')
    .insert({
      code:          generateCode(),
      supplier_name: input.supplier_name.trim(),
      status:        'rascunho',
      order_date:    input.order_date,
      expected_date: input.expected_date || null,
      notes:         input.notes.trim() || null,
      created_by:    user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  const order = data as PurchaseOrder

  if (items.length > 0) {
    const rows = items
      .filter(i => i.stock_item_name.trim())
      .map(i => ({
        purchase_order_id: order.id,
        stock_item_id:     i.stock_item_id || null,
        stock_item_name:   i.stock_item_name.trim(),
        unit:              i.unit || 'un',
        quantity_ordered:  parseQty(i.quantity),
        quantity_received: 0,
        unit_price:        parsePrice(i.unit_price),
      }))

    if (rows.length > 0) {
      const { error: itemErr } = await supabase.from('purchase_order_item').insert(rows)
      if (itemErr) throw new Error(itemErr.message)
    }
  }

  return order
}

export async function updatePurchaseOrder(
  id: string,
  input: CreatePurchaseOrderInput
): Promise<PurchaseOrder> {
  const { data, error } = await supabase
    .from('purchase_order')
    .update({
      supplier_name: input.supplier_name.trim(),
      order_date:    input.order_date,
      expected_date: input.expected_date || null,
      notes:         input.notes.trim() || null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PurchaseOrder
}

export async function addItemToPurchaseOrder(
  purchaseOrderId: string,
  draft: PurchaseOrderItemDraft
): Promise<PurchaseOrderItem> {
  const { data, error } = await supabase
    .from('purchase_order_item')
    .insert({
      purchase_order_id: purchaseOrderId,
      stock_item_id:     draft.stock_item_id || null,
      stock_item_name:   draft.stock_item_name.trim(),
      unit:              draft.unit || 'un',
      quantity_ordered:  parseQty(draft.quantity),
      quantity_received: 0,
      unit_price:        parsePrice(draft.unit_price),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PurchaseOrderItem
}

export async function removeItemFromPurchaseOrder(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('purchase_order_item')
    .delete()
    .eq('id', itemId)

  if (error) throw new Error(error.message)
}

export async function markAsSent(id: string): Promise<void> {
  const { error } = await supabase
    .from('purchase_order')
    .update({ status: 'enviado', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function cancelPurchaseOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('purchase_order')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function receiveItems(
  purchaseOrderId: string,
  inputs: ReceiveItemInput[]
): Promise<PurchaseOrder> {
  const { data: { user } } = await supabase.auth.getUser()

  for (const input of inputs) {
    const qty = parseQty(input.quantity_to_receive)
    if (qty <= 0) continue

    // Entrada no estoque para itens vinculados
    if (input.stock_item_id) {
      const { error: rpcErr } = await supabase.rpc('add_stock_movement', {
        p_stock_item_id:  input.stock_item_id,
        p_type:           'entrada',
        p_quantity:       qty,
        p_reason:         'compra',
        p_notes:          `Recebimento do pedido de compra`,
        p_reference_id:   purchaseOrderId,
        p_reference_type: 'purchase_order',
        p_user_id:        user?.id ?? null,
      })
      if (rpcErr) throw new Error(`Erro ao dar entrada no estoque (${input.stock_item_name}): ${rpcErr.message}`)
    }

    // Atualiza quantidade recebida no item
    const newReceived = input.quantity_received + qty
    const { error: itemErr } = await supabase
      .from('purchase_order_item')
      .update({ quantity_received: newReceived })
      .eq('id', input.item_id)

    if (itemErr) throw new Error(itemErr.message)
  }

  // Recalcula status do pedido
  const { data: updatedItems } = await supabase
    .from('purchase_order_item')
    .select('quantity_ordered, quantity_received')
    .eq('purchase_order_id', purchaseOrderId)

  let newStatus: PurchaseOrderStatus = 'enviado'
  if (updatedItems && updatedItems.length > 0) {
    const allReceived = updatedItems.every(i => i.quantity_received >= i.quantity_ordered)
    const anyReceived = updatedItems.some(i => i.quantity_received > 0)
    if (allReceived) newStatus = 'recebido'
    else if (anyReceived) newStatus = 'parcialmente_recebido'
  }

  const { data, error } = await supabase
    .from('purchase_order')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', purchaseOrderId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as PurchaseOrder
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from('purchase_order')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
