import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('E-mail ou senha incorretos.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div className="text-left">
              <div className="font-bold text-2xl leading-none" style={{ color: '#0f172a' }}>WOOD ERP</div>
              <div className="text-xs mt-1" style={{ color: '#00c896' }}>Sistema de Gestão Industrial</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-lg"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h2 className="text-xl font-semibold mb-1" style={{ color: '#0f172a' }}>Bem-vindo</h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            Acesse sua conta para continuar
          </p>

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-4 py-3 mb-6 text-sm"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                }}
                onFocus={e => e.target.style.borderColor = '#00c896'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#475569' }}>Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#0f172a',
                }}
                onFocus={e => e.target.style.borderColor = '#00c896'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-opacity shadow-sm"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#ffffff' }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#94a3b8' }}>
          WOOD ERP v1.0 — GTech Solutions
        </p>
      </div>
    </div>
  )
}
