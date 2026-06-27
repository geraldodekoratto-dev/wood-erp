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
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2040 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)' }}>
              <span className="text-white font-bold text-xl">W</span>
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-2xl leading-none">WOOD ERP</div>
              <div className="text-xs mt-1" style={{ color: '#00c896' }}>Sistema de Gestão Industrial</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border"
          style={{ background: '#0f2040', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-white text-xl font-semibold mb-1">Bem-vindo</h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            Acesse sua conta para continuar
          </p>

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-4 py-3 mb-6 text-sm"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#94a3b8' }}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => e.target.style.borderColor = '#00c896'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#94a3b8' }}>Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => e.target.style.borderColor = '#00c896'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #00c896, #00a07a)', color: '#0a1628' }}
              onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={e => (e.currentTarget.style.opacity = '1')}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
          WOOD ERP v1.0 — GTech Solutions
        </p>
      </div>
    </div>
  )
}
