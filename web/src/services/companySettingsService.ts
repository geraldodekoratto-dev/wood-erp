import { supabase } from '@/lib/supabase'

export interface CompanySettings {
  id: string
  razao_social: string
  nome_fantasia: string
  cnpj: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  email: string
  website: string
  updated_at: string
}

export interface UpdateCompanySettingsInput {
  razao_social: string
  nome_fantasia: string
  cnpj: string
  address: string
  city: string
  state: string
  zip_code: string
  phone: string
  email: string
  website: string
}

export async function getCompanySettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as CompanySettings | null
}

export async function saveCompanySettings(input: UpdateCompanySettingsInput): Promise<CompanySettings> {
  const { data: { user } } = await supabase.auth.getUser()
  const existing = await getCompanySettings()

  if (existing) {
    const { data, error } = await supabase
      .from('company_settings')
      .update({ ...input, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as CompanySettings
  } else {
    const { data, error } = await supabase
      .from('company_settings')
      .insert({ ...input, updated_by: user?.id })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as CompanySettings
  }
}
