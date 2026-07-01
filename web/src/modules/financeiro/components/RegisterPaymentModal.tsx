import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { registerPayment } from '../services/financialService'
import type { FinancialInstallment, PaymentMethod } from '../types'
import { PAYMENT_METHOD_LABELS } from '../types'

interface Props {
  installment: FinancialInstallment
  onClose: () => void
  onPaid: (updated: FinancialInstallment) => void
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#0f172a',
  fontSize: 14,
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  marginBottom: 4,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const PAYMENT_METHODS = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]

export default function RegisterPaymentModal({ installment, onClose, onPaid }: Props) {
  const [paymentDate, setPaymentDate] = useState(today())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const formattedAmount = installment.amount.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  })

  async function handleSave() {
    if (!paymentDate) { setError('Informe a data de pagamento.'); return }

    setSaving(true)
    setError('')
    try {
      const updated = await registerPayment(installment.id, {
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      })
      onPaid(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar pagamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.4)' }}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: '#fff' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Registrar Pagamento</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
            <X size={18} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Info da parcela */}
          <div
            className="rounded-xl px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.2)' }}>
            <div>
              <p className="text-xs font-semibold" style={{ color: '#00a07a' }}>
                Parcela {installment.installment_number}
              </p>
              <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
                Vencimento: {new Date(installment.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
            <span className="text-xl font-bold" style={{ color: '#0f172a' }}>{formattedAmount}</span>
          </div>

          <div>
            <label style={labelStyle}>Data de Pagamento *</label>
            <input
              type="date"
              style={inputStyle}
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>Forma de Pagamento</label>
            <select
              style={inputStyle}
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Observações</label>
            <textarea
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #e2e8f0' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
            style={{ color: '#64748b' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}>
            <CheckCircle size={15} />
            {saving ? 'Salvando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
