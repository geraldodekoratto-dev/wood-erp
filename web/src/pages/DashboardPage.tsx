import { useEffect, useState } from 'react'
import { Factory, ClipboardList, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { listProductionOrders } from '@/modules/pcp/services/productionOrderService'
import type { ProductionOrder } from '@/modules/pcp/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/modules/pcp/types'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    listProductionOrders().then(setOrders).catch(() => {})
  }, [])

  const emProducao = orders.filter(o =>
    ['em_producao','montagem_interna','pintura','expedicao'].includes(o.status)).length
  const aguardando = orders.filter(o =>
    ['aguardando_conferencia','aguardando_aprovacao'].includes(o.status)).length
  const hoje = new Date().toISOString().slice(0, 10)
  const atrasadas = orders.filter(o =>
    o.delivery_date && o.delivery_date < hoje &&
    !['entregue','cancelado'].includes(o.status)).length
  const entregueHoje = orders.filter(o =>
    o.status === 'entregue' && o.updated_at?.slice(0, 10) === hoje).length

  const stats = [
    { label: 'Em Produção', value: emProducao, icon: Factory, color: '#00c896' },
    { label: 'Aguardando Ação', value: aguardando, icon: ClipboardList, color: '#f59e0b' },
    { label: 'Atrasadas', value: atrasadas, icon: AlertTriangle, color: '#ef4444' },
    { label: 'Entregues Hoje', value: entregueHoje, icon: CheckCircle2, color: '#3b82f6' },
  ]

  const recentes = orders.slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Visão geral da operação</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-xl p-5 border"
            style={{ background: '#0f2040', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: '#64748b' }}>{stat.label}</span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${stat.color}18` }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border" style={{ background: '#0f2040', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-white font-semibold">Ordens Recentes</h2>
          <button onClick={() => navigate('/pcp')}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#00c896' }}>
            Ver todas <ArrowRight size={14} />
          </button>
        </div>

        {recentes.length === 0 ? (
          <div className="py-12 text-center" style={{ color: '#475569' }}>
            <Factory size={28} className="mx-auto mb-2" style={{ color: '#1e3a5f' }} />
            <p className="text-sm">Nenhuma ordem cadastrada ainda.</p>
            <button onClick={() => navigate('/pcp')}
              className="mt-2 text-sm font-medium" style={{ color: '#00c896' }}>
              Ir para PCP →
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Nº Ordem', 'Cliente', 'Projeto', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentes.map(order => {
                const { bg, text } = STATUS_COLORS[order.status]
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-mono font-medium" style={{ color: '#00c896' }}>
                        {order.reference_number}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-white">{order.client_name}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#94a3b8' }}>{order.project_name}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                        style={{ background: bg, color: text }}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
