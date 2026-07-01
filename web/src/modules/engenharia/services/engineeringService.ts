import { supabase } from '@/lib/supabase'
import type {
  EngineeringProduct,
  BomItem,
  CreateProductInput,
  UpdateProductInput,
  CreateBomItemInput,
  ProductCategory,
  ProductStatus,
} from '../types'

function generateCode(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `ENG-${year}-${random}`
}

function parseNum(v: string): number | null {
  const n = parseFloat(v.replace(',', '.'))
  return isNaN(n) || n <= 0 ? null : n
}

export async function listProducts(
  search?: string,
  category?: ProductCategory | '',
  status?: ProductStatus | ''
): Promise<EngineeringProduct[]> {
  let q = supabase
    .from('engineering_product')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (category) q = q.eq('category', category)
  if (status)   q = q.eq('status', status)

  const { data, error } = await q
  if (error) throw new Error(error.message)

  const items = data as EngineeringProduct[]
  if (!search) return items
  const q2 = search.toLowerCase()
  return items.filter(p =>
    p.name.toLowerCase().includes(q2) ||
    p.code.toLowerCase().includes(q2) ||
    (p.material ?? '').toLowerCase().includes(q2) ||
    (p.description ?? '').toLowerCase().includes(q2)
  )
}

export async function getProduct(id: string): Promise<EngineeringProduct> {
  const { data, error } = await supabase
    .from('engineering_product')
    .select('*, bom_items:engineering_bom_item(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw new Error(error.message)
  return data as EngineeringProduct
}

export async function createProduct(input: CreateProductInput): Promise<EngineeringProduct> {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('engineering_product')
    .insert({
      code:        generateCode(),
      name:        input.name.trim(),
      description: input.description.trim() || null,
      category:    input.category || 'outro',
      status:      'ativo',
      width_cm:    parseNum(input.width_cm),
      height_cm:   parseNum(input.height_cm),
      depth_cm:    parseNum(input.depth_cm),
      material:    input.material.trim() || null,
      finish:      input.finish.trim() || null,
      notes:       input.notes.trim() || null,
      created_by:  user?.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as EngineeringProduct
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<EngineeringProduct> {
  const { data, error } = await supabase
    .from('engineering_product')
    .update({
      name:        input.name.trim(),
      description: input.description.trim() || null,
      category:    input.category || 'outro',
      status:      input.status,
      width_cm:    parseNum(input.width_cm),
      height_cm:   parseNum(input.height_cm),
      depth_cm:    parseNum(input.depth_cm),
      material:    input.material.trim() || null,
      finish:      input.finish.trim() || null,
      notes:       input.notes.trim() || null,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as EngineeringProduct
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('engineering_product')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function updateProductStatus(id: string, status: ProductStatus): Promise<void> {
  const { error } = await supabase
    .from('engineering_product')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function addBomItem(productId: string, input: CreateBomItemInput): Promise<BomItem> {
  const qty = parseFloat(input.quantity.replace(',', '.'))
  if (!qty || qty <= 0) throw new Error('Quantidade inválida.')

  const { data, error } = await supabase
    .from('engineering_bom_item')
    .insert({
      product_id:    productId,
      stock_item_id: input.stock_item_id || null,
      item_name:     input.item_name.trim(),
      quantity:      qty,
      unit:          input.unit,
      notes:         input.notes.trim() || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BomItem
}

export async function updateBomItem(id: string, input: CreateBomItemInput): Promise<BomItem> {
  const qty = parseFloat(input.quantity.replace(',', '.'))
  if (!qty || qty <= 0) throw new Error('Quantidade inválida.')

  const { data, error } = await supabase
    .from('engineering_bom_item')
    .update({
      stock_item_id: input.stock_item_id || null,
      item_name:     input.item_name.trim(),
      quantity:      qty,
      unit:          input.unit,
      notes:         input.notes.trim() || null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BomItem
}

export async function deleteBomItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('engineering_bom_item')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
