import { useEffect, useRef, useState } from 'react'
import { X, Loader2, Search } from 'lucide-react'
import { createSalesOrder, updateSalesOrder } from '../services/salesOrderService'
import { listCustomers } from '@/modules/clientes/services/customerService'
import type { Customer } from '@/modules/clientes/types'
import type { SalesOrder, CreateSalesOrderInput, PaymentMethod } from '../types'
import { PAYMENT_METHOD_LABELS } from '../types'

interface Props {
  mode: 'create' | 'edit'
  order?: SalesOrder
  onClose: () => void
  onSaved: (order: SalesOrder) => void
}

const EMPTY: CreateSalesOrderInput = {
  customer_id: '',
  customer_name: '',
  sale_date: new Date().toISOString().slice(0, 10),
  delivery_date: '',
  total_value: '',
  payment_method: '',
  payment_terms: '',
  description: '',
  notes: '',
}

const inp = {
  width: '100%',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  color: '#0f172a',
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
}

const lbl = { color: '#64748b', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' } as const

export default function SalesOrderFormModal({ mode, order, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CreateSalesOrderInput>(
    mode === 'edit' && order
      ? {
          customer_id: order.customer_id ?? '',
          customer_name: order.customer_name,
          sale_date: order.sale_date,
          delivery_date: order.delivery_date ?? '',
          total_value: order.total_value != null ? String(order.total_value) : '',
          payment_method: (order.payment_method ?? '') as PaymentMethod | '',
          payment_terms: order.payment_terms ?? '',
          description: order.description ?? '',
          notes: order.notes ?? '',
        }
      : EMPTY
  )
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState(mode === 'edit' && order ? order.customer_name : '')
  const [showCustomerList, setShowCustomerList] = useState(false)
  // Guarda o nome do cliente vinculado (customer_id confirmado via dropdown ou vindo do modo edição)
  const linkedCustomerName = useRef(mode === 'edit' && order ? order.customer_name : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listCustomers().then(setCustomers).catch(() => {})
  }, [])

  function set<K extends keyof CreateSalesOrderInput>(field: K, value: CreateSalesOrderInput[K]) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function selectCustomer(c: Customer) {
    linkedCustomerName.current = c.name
    setForm(f => ({ ...f, customer_id: c.id, customer_name: c.name }))
    setCustomerSearch(c.name)
    setShowCustomerList(false)
  }

  const filteredCustomers = customers.filter(c =>
    c.status === 'active' && (
      !customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.document ?? '').includes(customerSearch)
    )
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_name.trim()) { setError('Selecione ou informe o cliente.'); return }
    if (!form.description.trim()) { setError('Informe a descrição dos móveis.'); return }
    setLoading(true)
    setError('')
    try {
      const saved = mode === 'edit' && order
        ? await updateSalesOrder(order.id, form)
        : await createSalesOrder(form)
      onSaved(saved)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar pedido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col shadow-sm"
        style={{ background: '#ffffff', border: '1px solid #e2e8f0', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 className="font-semibold text-lg" style={{ color: '#0f172a' }}>
              {mode === 'edit' ? 'Editar Pedido' : 'Novo Pedido de Venda'}
            </h2>
            {mode === 'edit' && order && (
              <p className="text-xs mt-0.5 font-mono" style={{ color: '#00c896' }}>{order.code}</p>
            )}
          </div>
          <button onClick={onClose} className="transition-colors" style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}

            {/* Cliente */}
            <div className="relative">
              <label style={lbl}>Cliente *</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
                <input
                  style={{ ...inp, paddingLeft: 36 }}
                  value={customerSearch}
                  onChange={e => {
                    const val = e.target.value
                    setCustomerSearch(val)
                    // Mantém customer_id apenas quando o texto ainda corresponde ao cliente vinculado
                    setForm(f => ({
                      ...f,
                      customer_name: val,
                      customer_id: val === linkedCustomerName.current ? f.customer_id : '',
                    }))
                    setShowCustomerList(true)
                  }}
                  onFocus={() => setShowCustomerList(true)}
                  placeholder="Buscar cliente cadastrado..."
                />
              </div>
              {showCustomerList && customerSearch && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-lg overflow-hidden shadow-sm"
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', maxHeight: 180, overflowY: 'auto' }}>
                  {filteredCustomers.slice(0, 8).map(c => (
                    <button key={c.id} type="button"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => selectCustomer(c)}>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#0f172a' }}>{c.name}</div>
                        <div className="text-xs" style={{ color: '#64748b' }}>{c.document || c.email || c.type.toUpperCase()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label style={lbl}>Descrição dos Móveis *</label>
              <textarea
                style={{ ...inp, minHeight: 72, resize: 'vertical' }}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Ex: Cozinha completa em MDF, Dormitório casal com guarda-roupa 6 portas..." />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Data da Venda</label>
                <input type="date" style={inp} value={form.sale_date}
                  onChange={e => set('sale_date', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Previsão de Entrega</label>
                <input type="date" style={inp} value={form.delivery_date}
                  onChange={e => set('delivery_date', e.target.value)} />
              </div>
            </div>

            {/* Valor e Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={lbl}>Valor Total (R$)</label>
                <input style={inp} value={form.total_value}
                  onChange={e => set('total_value', e.target.value)}
                  placeholder="0,00" />
              </div>
              <div>
                <label style={lbl}>Forma de Pagamento</label>
                <select style={{ ...inp, cursor: 'pointer' }} value={form.payment_method}
                  onChange={e => set('payment_method', e.target.value as PaymentMethod | '')}>
                  <option value="">— Selecionar —</option>
                  {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>Condições de Pagamento</label>
              <input style={inp} value={form.payment_terms}
                onChange={e => set('payment_terms', e.target.value)}
                placeholder="Ex: 50% na entrada + 50% na entrega" />
            </div>

            <div>
              <label style={lbl}>Observações</label>
              <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }}
                value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Informações adicionais..." />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #e2e8f0' }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628', opacity: loading ? 0.7 : 1 }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Salvando...' : mode === 'edit' ? 'Salvar Alterações' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
