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
    { label: 'Em Produção', value: emProducao, icon: Factory, color: '#00c896', bg: 'rgba(0,200,150,0.08)' },
    { label: 'Aguardando Ação', value: aguardando, icon: ClipboardList, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Atrasadas', value: atrasadas, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    { label: 'Entregues Hoje', value: entregueHoje, icon: CheckCircle2, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  ]

  const recentes = orders.slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Visão geral da operação</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-xl p-5 shadow-sm"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium" style={{ color: '#64748b' }}>{stat.label}</span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: stat.bg }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color: '#0f172a' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="font-semibold" style={{ color: '#0f172a' }}>Ordens Recentes</h2>
          <button onClick={() => navigate('/pcp')}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#00c896' }}>
            Ver todas <ArrowRight size={14} />
          </button>
        </div>

        {recentes.length === 0 ? (
          <div className="py-12 text-center">
            <Factory size={28} className="mx-auto mb-2" style={{ color: '#cbd5e1' }} />
            <p className="text-sm" style={{ color: '#94a3b8' }}>Nenhuma ordem cadastrada ainda.</p>
            <button onClick={() => navigate('/pcp')}
              className="mt-2 text-sm font-medium" style={{ color: '#00c896' }}>
              Ir para PCP →
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                {['Nº Ordem', 'Cliente', 'Projeto', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentes.map((order, idx) => {
                const { bg, text } = STATUS_COLORS[order.status]
                return (
                  <tr key={order.id}
                    style={{ borderBottom: idx < recentes.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-mono font-medium" style={{ color: '#00c896' }}>
                        {order.reference_number}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-medium" style={{ color: '#0f172a' }}>{order.client_name}</td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: '#64748b' }}>{order.project_name}</td>
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
