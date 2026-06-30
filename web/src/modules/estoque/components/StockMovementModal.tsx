import { useState } from 'react'
import { X, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { addMovement } from '../services/stockMovementService'
import type { StockItem, CreateMovementInput, MovementType, MovementReason } from '../types'
import { REASON_LABELS, REASONS_BY_TYPE, UNIT_SHORT } from '../types'

interface Props {
  item: StockItem
  onClose: () => void
  onSaved: (updatedItem: StockItem) => void
}

const EMPTY: CreateMovementInput = { type: 'entrada', quantity: '', reason: '', notes: '' }

const inp = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
} as const

const lbl = { color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' } as const

export default function StockMovementModal({ item, onClose, onSaved }: Props) {
  const [form, setForm] = useState<CreateMovementInput>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setType(type: MovementType) {
    setForm(f => ({ ...f, type, reason: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.quantity || parseFloat(form.quantity.replace(',', '.')) <= 0) {
      setError('Informe uma quantidade válida maior que zero.')
      return
    }
    if (!form.reason) { setError('Selecione o motivo da movimentação.'); return }
    setLoading(true)
    setError('')
    try {
      const updated = await addMovement(item.id, form)
      onSaved(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar movimentação.')
    } finally {
      setLoading(false)
    }
  }

  const isEntrada = form.type === 'entrada'
  const unitShort = UNIT_SHORT[item.unit]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-md rounded-2xl flex flex-col"
        style={{ background: '#0f2040', border: '1px solid rgba(255,255,255,0.1)' }}>

        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-white font-semibold text-lg">Registrar Movimentação</h2>
            <p className="text-xs mt-0.5 font-mono" style={{ color: '#00c896' }}>{item.code} — {item.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">

            {/* Saldo atual */}
            <div className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>
                Saldo Atual
              </span>
              <span className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
                {item.current_quantity} <span className="text-sm font-normal" style={{ color: '#64748b' }}>{unitShort}</span>
              </span>
            </div>

            {/* Tipo de movimentação */}
            <div>
              <label style={lbl}>Tipo *</label>
              <div className="grid grid-cols-2 gap-3">
                {(['entrada', 'saida'] as MovementType[]).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={form.type === t
                      ? t === 'entrada'
                        ? { background: 'rgba(0,200,150,0.2)', color: '#00c896', border: '1.5px solid #00c896' }
                        : { background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1.5px solid #f87171' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }
                    }>
                    {t === 'entrada' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {t === 'entrada' ? 'Entrada' : 'Saída'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Quantidade ({unitShort}) *</label>
              <input style={inp} value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder={`Ex: 10 ${unitShort}`} />
            </div>

            <div>
              <label style={lbl}>Motivo *</label>
              <select style={{ ...inp, cursor: 'pointer' }}
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value as MovementReason | '' }))}>
                <option value="" style={{ background: '#1e293b', color: '#e2e8f0' }}>— Selecionar —</option>
                {REASONS_BY_TYPE[form.type].map(r => (
                  <option key={r} value={r} style={{ background: '#1e293b', color: '#e2e8f0' }}>{REASON_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={lbl}>Observações</label>
              <textarea style={{ ...inp, minHeight: 56, resize: 'vertical' }}
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="OP vinculada, nota fiscal, observação..." />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: isEntrada ? 'linear-gradient(135deg, #00c896, #00a07a)' : 'rgba(239,68,68,0.2)',
                color: isEntrada ? '#0a1628' : '#f87171',
                border: isEntrada ? 'none' : '1px solid rgba(239,68,68,0.4)',
                opacity: loading ? 0.7 : 1,
              }}>
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Registrando...' : isEntrada ? 'Registrar Entrada' : 'Registrar Saída'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
