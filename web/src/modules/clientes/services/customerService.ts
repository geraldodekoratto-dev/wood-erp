import { supabase } from '@/lib/supabase'
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../types'

function generateCode(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `CLI-${year}-${random}`
}

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Customer[]
}

export async function getCustomerById(id: string): Promise<Customer> {
  const { data, error } = await supabase
    .from('customer')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as Customer
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('customer')
    .insert({
      code: generateCode(),
      type: input.type,
      name: input.name,
      document: input.document || null,
      email: input.email || null,
      phone: input.phone || null,
      mobile: input.mobile || null,
      zip_code: input.zip_code || null,
      street: input.street || null,
      number: input.number || null,
      complement: input.complement || null,
      neighborhood: input.neighborhood || null,
      city: input.city || null,
      state: input.state || null,
      notes: input.notes || null,
      status: 'active',
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Customer
}

export async function updateCustomer(id: string, input: UpdateCustomerInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customer')
    .update({
      type: input.type,
      name: input.name,
      document: input.document || null,
      email: input.email || null,
      phone: input.phone || null,
      mobile: input.mobile || null,
      zip_code: input.zip_code || null,
      street: input.street || null,
      number: input.number || null,
      complement: input.complement || null,
      neighborhood: input.neighborhood || null,
      city: input.city || null,
      state: input.state || null,
      notes: input.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Customer
}

export async function toggleCustomerStatus(id: string, status: 'active' | 'inactive'): Promise<void> {
  const { error } = await supabase
    .from('customer')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase
    .from('customer')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
