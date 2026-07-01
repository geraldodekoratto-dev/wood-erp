import { useEffect, useState } from 'react'
import { Settings, Building2, User, Info, Save, RefreshCw, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { getCompanySettings, saveCompanySettings } from '@/services/companySettingsService'
import type { CompanySettings, UpdateCompanySettingsInput } from '@/services/companySettingsService'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

type Tab = 'empresa' | 'conta' | 'sistema'

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

const MODULES = [
  { name: 'PCP — Produção', status: 'ativo' },
  { name: 'Kanban', status: 'ativo' },
  { name: 'Engenharia', status: 'ativo' },
  { name: 'Vendas', status: 'ativo' },
  { name: 'Estoque', status: 'ativo' },
  { name: 'Compras', status: 'ativo' },
  { name: 'Financeiro', status: 'ativo' },
  { name: 'Instalação', status: 'ativo' },
  { name: 'Clientes', status: 'ativo' },
  { name: 'Administração', status: 'ativo' },
]

function emptyForm(): UpdateCompanySettingsInput {
  return { razao_social: '', nome_fantasia: '', cnpj: '', address: '', city: '', state: '', zip_code: '', phone: '', email: '', website: '' }
}

function fromSettings(s: CompanySettings): UpdateCompanySettingsInput {
  return { razao_social: s.razao_social, nome_fantasia: s.nome_fantasia, cnpj: s.cnpj, address: s.address, city: s.city, state: s.state, zip_code: s.zip_code, phone: s.phone, email: s.email, website: s.website }
}

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('empresa')

  // Empresa
  const [form, setForm]             = useState<UpdateCompanySettingsInput>(emptyForm())
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving]         = useState(false)
  const [savedOk, setSavedOk]       = useState(false)
  const [saveError, setSaveError]   = useState('')

  // Conta
  const [newPwd, setNewPwd]         = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [pwdOk, setPwdOk]           = useState(false)
  const [pwdError, setPwdError]     = useState('')

  useEffect(() => {
    getCompanySettings()
      .then(s => { if (s) setForm(fromSettings(s)) })
      .catch(() => {})
      .finally(() => setLoadingSettings(false))
  }, [])

  function setField(key: keyof UpdateCompanySettingsInput, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSavedOk(false)
    setSaveError('')
  }

  async function handleSave() {
    if (!form.razao_social.trim()) { setSaveError('Informe a Razão Social.'); return }
    setSaving(true)
    setSaveError('')
    try {
      await saveCompanySettings(form)
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePwd() {
    if (!newPwd) { setPwdError('Informe a nova senha.'); return }
    if (newPwd.length < 6) { setPwdError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (newPwd !== confirmPwd) { setPwdError('As senhas não coincidem.'); return }

    setChangingPwd(true)
    setPwdError('')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw new Error(error.message)
      setPwdOk(true)
      setNewPwd('')
      setConfirmPwd('')
      setTimeout(() => setPwdOk(false), 4000)
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : 'Erro ao alterar senha.')
    } finally {
      setChangingPwd(false)
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
    { id: 'empresa', label: 'Empresa', icon: Building2 },
    { id: 'conta', label: 'Minha Conta', icon: User },
    { id: 'sistema', label: 'Sistema', icon: Info },
  ]

  return (
    <div className="max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,200,150,0.1)' }}>
          <Settings size={20} style={{ color: '#00c896' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Configurações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Gerencie os dados da empresa e do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-7"
        style={{ background: '#f1f5f9', width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.id
              ? { background: '#fff', color: '#00c896', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
              : { color: '#64748b' }}>
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Empresa ── */}
      {tab === 'empresa' && (
        <div className="rounded-2xl p-7 space-y-5" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Dados da Empresa</h2>
            {loadingSettings && <RefreshCw size={14} className="animate-spin" style={{ color: '#94a3b8' }} />}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label style={label}>Razão Social *</label>
              <input style={input} value={form.razao_social} onChange={e => setField('razao_social', e.target.value)} placeholder="Nome Empresarial Ltda." />
            </div>
            <div>
              <label style={label}>Nome Fantasia</label>
              <input style={input} value={form.nome_fantasia} onChange={e => setField('nome_fantasia', e.target.value)} placeholder="Ex: Wood Móveis" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label style={label}>CNPJ</label>
              <input style={input} value={form.cnpj} onChange={e => setField('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label style={label}>Telefone</label>
              <input style={input} value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label style={label}>E-mail</label>
              <input style={input} type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="contato@empresa.com.br" />
            </div>
            <div>
              <label style={label}>Website</label>
              <input style={input} value={form.website} onChange={e => setField('website', e.target.value)} placeholder="www.empresa.com.br" />
            </div>
          </div>

          <div>
            <label style={label}>Endereço</label>
            <input style={input} value={form.address} onChange={e => setField('address', e.target.value)} placeholder="Rua, número, complemento, bairro" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label style={label}>CEP</label>
              <input style={input} value={form.zip_code} onChange={e => setField('zip_code', e.target.value)} placeholder="00000-000" />
            </div>
            <div className="col-span-1">
              <label style={label}>Cidade</label>
              <input style={input} value={form.city} onChange={e => setField('city', e.target.value)} placeholder="São Paulo" />
            </div>
            <div className="col-span-1">
              <label style={label}>Estado</label>
              <input style={input} value={form.state} onChange={e => setField('state', e.target.value)} placeholder="SP" maxLength={2} />
            </div>
          </div>

          {saveError && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
              {saveError}
            </p>
          )}

          {savedOk && (
            <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
              style={{ color: '#059669', background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.25)' }}>
              <CheckCircle size={16} />
              Dados salvos com sucesso!
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#00c896,#00a07a)', color: '#fff', boxShadow: '0 4px 12px rgba(0,200,150,0.3)' }}>
              <Save size={15} />
              {saving ? 'Salvando...' : 'Salvar Dados'}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: Minha Conta ── */}
      {tab === 'conta' && (
        <div className="space-y-5">

          {/* Info do usuário */}
          <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: '#0f172a' }}>Informações da Conta</h2>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#00c896,#00a07a)', color: '#fff' }}>
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#0f172a' }}>{user?.email}</p>
                <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Administrador do sistema</p>
              </div>
            </div>
          </div>

          {/* Alterar senha */}
          <div className="rounded-2xl p-6 space-y-4" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>Alterar Senha</h2>

            <div>
              <label style={label}>Nova Senha</label>
              <div className="relative">
                <input
                  style={input}
                  type={showPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => { setNewPwd(e.target.value); setPwdError(''); setPwdOk(false) }}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#9ca3af' }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={label}>Confirmar Nova Senha</label>
              <input
                style={input}
                type={showPwd ? 'text' : 'password'}
                value={confirmPwd}
                onChange={e => { setConfirmPwd(e.target.value); setPwdError(''); setPwdOk(false) }}
                placeholder="Repita a nova senha"
              />
            </div>

            {pwdError && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
                {pwdError}
              </p>
            )}

            {pwdOk && (
              <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
                style={{ color: '#059669', background: 'rgba(0,200,150,0.08)', border: '1px solid rgba(0,200,150,0.25)' }}>
                <CheckCircle size={16} />
                Senha alterada com sucesso!
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleChangePwd}
                disabled={changingPwd}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#00c896,#00a07a)', color: '#fff', boxShadow: '0 4px 12px rgba(0,200,150,0.3)' }}>
                {changingPwd ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Sistema ── */}
      {tab === 'sistema' && (
        <div className="space-y-5">

          <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: '#0f172a' }}>Sobre o WOOD ERP</h2>
            <div className="grid grid-cols-2 gap-y-4">
              {[
                { label: 'Sistema', value: 'WOOD ERP' },
                { label: 'Versão', value: 'v1.0.0' },
                { label: 'Stack', value: 'React 18 + TypeScript + Vite' },
                { label: 'Backend', value: 'Supabase (PostgreSQL)' },
                { label: 'Segmento', value: 'Indústria Moveleira' },
                { label: 'Desenvolvido por', value: 'GTech Solutions' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: '#0f172a' }}>Módulos Disponíveis</h2>
            <div className="space-y-2">
              {MODULES.map(m => (
                <div key={m.name} className="flex items-center justify-between py-2.5 px-4 rounded-xl" style={{ background: '#f8fafc' }}>
                  <span className="text-sm font-medium" style={{ color: '#374151' }}>{m.name}</span>
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(0,200,150,0.12)', color: '#00c896' }}>
                    {m.status === 'ativo' ? 'Ativo' : 'Em breve'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
