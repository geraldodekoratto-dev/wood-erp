import { useState } from 'react'
import { X, Loader2, User, Building2 } from 'lucide-react'
import { createCustomer, updateCustomer } from '../services/customerService'
import type { Customer, CreateCustomerInput, CustomerType } from '../types'
import { BRAZIL_STATES } from '../types'

interface Props {
  mode: 'create' | 'edit'
  customer?: Customer
  onClose: () => void
  onSaved: (customer: Customer) => void
}

const EMPTY_FORM: CreateCustomerInput = {
  type: 'pf',
  name: '',
  document: '',
  email: '',
  phone: '',
  mobile: '',
  zip_code: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  notes: '',
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
}

const labelStyle = { color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' }

export default function CustomerFormModal({ mode, customer, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CreateCustomerInput>(
    mode === 'edit' && customer
      ? {
          type: customer.type,
          name: customer.name,
          document: customer.document ?? '',
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          mobile: customer.mobile ?? '',
          zip_code: customer.zip_code ?? '',
          street: customer.street ?? '',
          number: customer.number ?? '',
          complement: customer.complement ?? '',
          neighborhood: customer.neighborhood ?? '',
          city: customer.city ?? '',
          state: customer.state ?? '',
          notes: customer.notes ?? '',
        }
      : EMPTY_FORM
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'dados' | 'endereco'>('dados')

  function set<K extends keyof CreateCustomerInput>(field: K, value: CreateCustomerInput[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    setError('')
    try {
      const saved = mode === 'edit' && customer
        ? await updateCustomer(customer.id, form)
        : await createCustomer(form)
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cliente.')
    } finally {
      setLoading(false)
    }
  }

  const isEdit = mode === 'edit'
  const title = isEdit ? 'Editar Cliente' : 'Novo Cliente'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col"
        style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-white font-semibold text-lg">{title}</h2>
            {isEdit && customer && (
              <p className="text-xs mt-0.5 font-mono" style={{ color: '#00c896' }}>{customer.code}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="px-6 pt-5 pb-4">
          <div className="flex gap-2 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', width: 'fit-content' }}>
            {(['pf', 'pj'] as CustomerType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('type', t)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={form.type === t
                  ? { background: '#0a1628', color: '#00c896', border: '1px solid rgba(0,200,150,0.3)' }
                  : { color: '#475569' }}>
                {t === 'pf' ? <User size={14} /> : <Building2 size={14} />}
                {t === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {(['dados', 'endereco'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: tab === t ? '#00c896' : '#475569',
                borderBottom: tab === t ? '2px solid #00c896' : '2px solid transparent',
                marginBottom: -1,
              }}>
              {t === 'dados' ? 'Dados' : 'Endereço'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}

            {tab === 'dados' && (
              <>
                <div>
                  <label style={labelStyle}>Nome {form.type === 'pj' ? 'da Empresa' : 'Completo'} *</label>
                  <input style={inputStyle} value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder={form.type === 'pj' ? 'Razão Social' : 'Nome completo'} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>{form.type === 'pj' ? 'CNPJ' : 'CPF'}</label>
                    <input style={inputStyle} value={form.document}
                      onChange={e => set('document', e.target.value)}
                      placeholder={form.type === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'} />
                  </div>
                  <div>
                    <label style={labelStyle}>E-mail</label>
                    <input type="email" style={inputStyle} value={form.email}
                      onChange={e => set('email', e.target.value)}
                      placeholder="email@exemplo.com" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Telefone</label>
                    <input style={inputStyle} value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="(00) 0000-0000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Celular / WhatsApp</label>
                    <input style={inputStyle} value={form.mobile}
                      onChange={e => set('mobile', e.target.value)}
                      placeholder="(00) 00000-0000" />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Observações</label>
                  <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                    value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder="Informações adicionais sobre o cliente..." />
                </div>
              </>
            )}

            {tab === 'endereco' && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label style={labelStyle}>CEP</label>
                    <input style={inputStyle} value={form.zip_code}
                      onChange={e => set('zip_code', e.target.value)}
                      placeholder="00000-000" />
                  </div>
                  <div className="col-span-2">
                    <label style={labelStyle}>Logradouro</label>
                    <input style={inputStyle} value={form.street}
                      onChange={e => set('street', e.target.value)}
                      placeholder="Rua, Av., Alameda..." />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label style={labelStyle}>Número</label>
                    <input style={inputStyle} value={form.number}
                      onChange={e => set('number', e.target.value)}
                      placeholder="123" />
                  </div>
                  <div className="col-span-2">
                    <label style={labelStyle}>Complemento</label>
                    <input style={inputStyle} value={form.complement}
                      onChange={e => set('complement', e.target.value)}
                      placeholder="Apto, Sala, Bloco..." />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Bairro</label>
                  <input style={inputStyle} value={form.neighborhood}
                    onChange={e => set('neighborhood', e.target.value)}
                    placeholder="Nome do bairro" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label style={labelStyle}>Cidade</label>
                    <input style={inputStyle} value={form.city}
                      onChange={e => set('city', e.target.value)}
                      placeholder="Nome da cidade" />
                  </div>
                  <div>
                    <label style={labelStyle}>UF</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.state}
                      onChange={e => set('state', e.target.value)}>
                      <option value="">—</option>
                      {BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628', opacity: loading ? 0.7 : 1 }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
