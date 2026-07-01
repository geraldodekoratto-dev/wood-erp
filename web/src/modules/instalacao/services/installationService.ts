import { supabase } from '@/lib/supabase'
import type { InstallationOrder, CreateInstallationInput, UpdateInstallationInput, InstallationStatus } from '../types'

function generateCode(): string {
  const year = new Date().getFullYear()
  const n = Math.floor(Math.random() * 9000) + 1000
  return `INST-${year}-${n}`
}

export async function listInstallations(
  search?: string,
  status?: InstallationStatus | ''
): Promise<InstallationOrder[]> {
  let q = supabase
    .from('installation_order')
    .select('*')
    .is('deleted_at', null)
    .order('scheduled_date', { ascending: true })

  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const items = data as InstallationOrder[]
  if (!search) return items
  const s = search.toLowerCase()
  return items.filter(i =>
    i.customer_name.toLowerCase().includes(s) ||
    i.code.toLowerCase().includes(s) ||
    (i.technician ?? '').toLowerCase().includes(s) ||
    (i.sales_order_code ?? '').toLowerCase().includes(s)
  )
}

export async function getInstallation(id: string): Promise<InstallationOrder> {
  const { data, error } = await supabase
    .from('installation_order')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as InstallationOrder
}

export async function createInstallation(input: CreateInstallationInput): Promise<InstallationOrder> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('installation_order')
    .insert({
      code:             generateCode(),
      sales_order_id:   input.sales_order_id ?? null,
      sales_order_code: input.sales_order_code ?? null,
      customer_name:    input.customer_name.trim(),
      customer_address: input.customer_address.trim() || null,
      scheduled_date:   input.scheduled_date,
      scheduled_time:   input.scheduled_time.trim() || null,
      technician:       input.technician.trim() || null,
      notes:            input.notes.trim() || null,
      status:           'agendado',
      created_by:       user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as InstallationOrder
}

export async function updateInstallation(id: string, input: UpdateInstallationInput): Promise<InstallationOrder> {
  const { data, error } = await supabase
    .from('installation_order')
    .update({
      sales_order_id:   input.sales_order_id ?? null,
      sales_order_code: input.sales_order_code ?? null,
      customer_name:    input.customer_name.trim(),
      customer_address: input.customer_address.trim() || null,
      scheduled_date:   input.scheduled_date,
      scheduled_time:   input.scheduled_time.trim() || null,
      technician:       input.technician.trim() || null,
      notes:            input.notes.trim() || null,
      completion_notes: input.completion_notes?.trim() || null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as InstallationOrder
}

export async function updateInstallationStatus(id: string, status: InstallationStatus): Promise<void> {
  const { error } = await supabase
    .from('installation_order')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteInstallation(id: string): Promise<void> {
  const { error } = await supabase
    .from('installation_order')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
