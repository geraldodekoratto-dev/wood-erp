import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { createFinancialEntry } from '../services/financialService'
import type { FinancialEntry, FinancialType, CreateInstallmentInput } from '../types'

interface Props {
  onClose: () => void
  onSaved: (entry: FinancialEntry) => void
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#111827',
  fontSize: 14,
  outline: 'none',
}

export default function FinancialFormModal({ onClose, onSaved }: Props) {
  const [type, setType] = useState<FinancialType>('receita')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installmentCount, setInstallmentCount] = useState(1)
  const [notes, setNotes] = useState('')
  const [installments, setInstallments] = useState<{ amount: string; due_date: string }[]>([
    { amount: '', due_date: today() }
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const total = parseFloat(totalAmount.replace(',', '.')) || 0
    const count = Math.max(1, Math.min(12, installmentCount))
    const base = total > 0 ? parseFloat((total / count).toFixed(2)) : 0
    const remainder = total > 0 ? parseFloat((total - base * count).toFixed(2)) : 0

    setInstallments(prev =>
      Array.from({ length: count }, (_, i) => {
        const amount = i === 0 && remainder !== 0 ? base + remainder : base
        const due_date = prev[i]?.due_date ?? addMonths(today(), i)
        return {
          amount: amount > 0 ? amount.toFixed(2) : '',
          due_date,
        }
      })
    )
  }, [totalAmount, installmentCount])

  function updateInstallment(idx: number, field: 'amount' | 'due_date', value: string) {
    setInstallments(prev => prev.map((ins, i) => i === idx ? { ...ins, [field]: value } : ins))
  }

  async function handleSave() {
    if (!description.trim()) { setError('Informe a descrição.'); return }
    const total = parseFloat(totalAmount.replace(',', '.'))
    if (!total || total <= 0) { setError('Informe o valor total.'); return }

    const parsedInstallments: CreateInstallmentInput[] = installments.map((ins, i) => ({
      installment_number: i + 1,
      amount: parseFloat(ins.amount.replace(',', '.')) || 0,
      due_date: ins.due_date,
    }))

    if (parsedInstallments.some(i => !i.amount || !i.due_date)) {
      setError('Preencha valor e vencimento de todas as parcelas.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const entry = await createFinancialEntry({
        type,
        description: description.trim(),
        category: category.trim(),
        total_amount: total,
        reference_type: 'manual',
        notes: notes.trim() || undefined,
        installments: parsedInstallments,
      })
      onSaved(entry)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)' }}>
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col"
        style={{ background: '#fff', maxHeight: '92vh' }}>

        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#111827' }}>
              Novo Lançamento Financeiro
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>
              Preencha os dados do lançamento
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-gray-100">
            <X size={18} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-7 py-6 space-y-6">

          {/* Tipo */}
          <div>
            <span style={label}>Tipo de Lançamento</span>
            <div className="flex gap-3">
              {(['receita', 'despesa'] as FinancialType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={
                    type === t
                      ? t === 'receita'
                        ? { background: 'linear-gradient(135deg,#00c896,#00a07a)', color: '#fff', border: 'none' }
                        : { background: 'linear-gradient(135deg,#f87171,#ef4444)', color: '#fff', border: 'none' }
                      : { background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb' }
                  }>
                  {t === 'receita' ? '↑ Receita' : '↓ Despesa'}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição + Categoria */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label style={label}>Descrição *</label>
              <input
                style={input}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Venda de armário"
              />
            </div>
            <div>
              <label style={label}>Categoria</label>
              <input
                style={input}
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Ex: Venda de Produto"
              />
            </div>
          </div>

          {/* Valor + Parcelas */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label style={label}>Valor Total (R$) *</label>
              <input
                style={input}
                type="number"
                min="0.01"
                step="0.01"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <label style={label}>Número de Parcelas</label>
              <select
                style={input}
                value={installmentCount}
                onChange={e => setInstallmentCount(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}x</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de parcelas */}
          <div>
            <span style={label}>Parcelas</span>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: '#6b7280', width: 50 }}>#</th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: '#6b7280' }}>Valor (R$)</th>
                    <th className="px-4 py-3 text-left font-medium" style={{ color: '#6b7280' }}>Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((ins, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td className="px-4 py-2.5 font-semibold text-sm" style={{ color: '#9ca3af' }}>{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={ins.amount}
                          onChange={e => updateInstallment(i, 'amount', e.target.value)}
                          style={{ ...input, padding: '8px 12px' }}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="date"
                          value={ins.due_date}
                          onChange={e => updateInstallment(i, 'due_date', e.target.value)}
                          style={{ ...input, padding: '8px 12px' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label style={label}>Observações</label>
            <textarea
              rows={2}
              style={{ ...input, resize: 'vertical' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>

          {error && (
            <p
              className="text-sm rounded-xl px-4 py-3"
              style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-7 py-5"
          style={{ borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ color: '#374151', border: '1px solid #d1d5db', background: '#fff' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg,#00c896,#00a07a)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(0,200,150,0.3)',
            }}>
            <Plus size={15} />
            {saving ? 'Salvando...' : 'Salvar Lançamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
