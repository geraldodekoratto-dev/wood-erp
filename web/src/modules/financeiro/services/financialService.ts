import { supabase } from '@/lib/supabase'
import type {
  FinancialEntry, FinancialInstallment,
  CreateFinancialEntryInput, CreateInstallmentInput,
  RegisterPaymentInput, FinancialType,
} from '../types'
import type { SalesOrder } from '@/modules/vendas/types'
import type { PurchaseOrder } from '@/modules/compras/types'

function generateCode(): string {
  const year = new Date().getFullYear()
  const n = Math.floor(Math.random() * 9000) + 1000
  return `FIN-${year}-${n}`
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function listFinancialEntries(filter?: {
  type?: FinancialType
}): Promise<FinancialEntry[]> {
  let query = supabase
    .from('financial_entry')
    .select('*, installments:financial_installment(*)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filter?.type) query = query.eq('type', filter.type)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as FinancialEntry[]
}

export async function getFinancialEntryById(id: string): Promise<FinancialEntry> {
  const { data, error } = await supabase
    .from('financial_entry')
    .select('*, installments:financial_installment(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)

  const entry = data as FinancialEntry
  if (entry.installments) {
    entry.installments.sort((a, b) => a.installment_number - b.installment_number)
  }
  return entry
}

export async function createFinancialEntry(
  input: CreateFinancialEntryInput
): Promise<FinancialEntry> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('financial_entry')
    .insert({
      code:           generateCode(),
      type:           input.type,
      description:    input.description.trim(),
      category:       input.category.trim(),
      total_amount:   input.total_amount,
      reference_type: input.reference_type,
      reference_id:   input.reference_id ?? null,
      reference_code: input.reference_code ?? null,
      notes:          input.notes?.trim() || null,
      status:         'ativo',
      created_by:     user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  const entry = data as FinancialEntry

  if (input.installments.length > 0) {
    const rows = input.installments.map(i => ({
      financial_entry_id: entry.id,
      installment_number: i.installment_number,
      amount:             i.amount,
      due_date:           i.due_date,
      status:             'pendente',
    }))
    const { error: instErr } = await supabase.from('financial_installment').insert(rows)
    if (instErr) throw new Error(instErr.message)
  }

  return entry
}

export async function registerPayment(
  installmentId: string,
  input: RegisterPaymentInput
): Promise<FinancialInstallment> {
  const { data, error } = await supabase
    .from('financial_installment')
    .update({
      status:         'pago',
      payment_date:   input.payment_date,
      payment_method: input.payment_method,
      notes:          input.notes?.trim() || null,
      updated_at:     new Date().toISOString(),
    })
    .eq('id', installmentId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as FinancialInstallment
}

export async function cancelFinancialEntry(id: string): Promise<void> {
  const { error: entryErr } = await supabase
    .from('financial_entry')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (entryErr) throw new Error(entryErr.message)

  const { error: instErr } = await supabase
    .from('financial_installment')
    .update({ status: 'cancelado', updated_at: new Date().toISOString() })
    .eq('financial_entry_id', id)
    .eq('status', 'pendente')

  if (instErr) throw new Error(instErr.message)
}

export async function deleteFinancialEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('financial_entry')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// Chamado automaticamente ao confirmar uma Venda
export async function createFromSalesOrder(salesOrder: SalesOrder): Promise<void> {
  const today = new Date()
  const dueDate = salesOrder.delivery_date ?? addDays(today, 30)

  const installment: CreateInstallmentInput = {
    installment_number: 1,
    amount: salesOrder.total_value ?? 0,
    due_date: dueDate,
  }

  await createFinancialEntry({
    type:           'receita',
    description:    `Venda — ${salesOrder.customer_name}`,
    category:       'Venda de Produto',
    total_amount:   salesOrder.total_value ?? 0,
    reference_type: 'sales_order',
    reference_id:   salesOrder.id,
    reference_code: salesOrder.code,
    notes:          salesOrder.description ?? undefined,
    installments:   [installment],
  })
}

// Chamado automaticamente ao receber itens de uma Compra
export async function createFromPurchaseOrder(
  purchaseOrder: PurchaseOrder,
  totalAmount: number
): Promise<void> {
  if (totalAmount <= 0) return

  const dueDate = addDays(new Date(), 30)

  const installment: CreateInstallmentInput = {
    installment_number: 1,
    amount: totalAmount,
    due_date: dueDate,
  }

  await createFinancialEntry({
    type:           'despesa',
    description:    `Compra — ${purchaseOrder.supplier_name}`,
    category:       'Compra de Material',
    total_amount:   totalAmount,
    reference_type: 'purchase_order',
    reference_id:   purchaseOrder.id,
    reference_code: purchaseOrder.code,
    installments:   [installment],
  })
}
