export type CustomerType = 'pf' | 'pj'
export type CustomerStatus = 'active' | 'inactive'

export interface Customer {
  id: string
  code: string
  type: CustomerType
  name: string
  document: string | null      // CPF ou CNPJ
  email: string | null
  phone: string | null
  mobile: string | null
  zip_code: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  notes: string | null
  status: CustomerStatus
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

export interface CreateCustomerInput {
  type: CustomerType
  name: string
  document: string
  email: string
  phone: string
  mobile: string
  zip_code: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  notes: string
}

export interface UpdateCustomerInput extends CreateCustomerInput {}

export const TYPE_LABELS: Record<CustomerType, string> = {
  pf: 'Pessoa Física',
  pj: 'Pessoa Jurídica',
}

export const TYPE_SHORT: Record<CustomerType, string> = {
  pf: 'PF',
  pj: 'PJ',
}

export const TYPE_COLORS: Record<CustomerType, { bg: string; text: string }> = {
  pf:  { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa' },
  pj:  { bg: 'rgba(168,85,247,0.15)',  text: '#c084fc' },
}

export const STATUS_LABELS: Record<CustomerStatus, string> = {
  active:   'Ativo',
  inactive: 'Inativo',
}

export const STATUS_COLORS: Record<CustomerStatus, { bg: string; text: string }> = {
  active:   { bg: 'rgba(0,200,150,0.15)',   text: '#00c896' },
  inactive: { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
}

export const BRAZIL_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
]
