import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, AlertTriangle, Wallet,
  Factory, ShoppingCart, Package, ShoppingBag,
  ArrowRight, RefreshCw, Clock
} from 'lucide-react'
import { listFinancialEntries } from '@/modules/financeiro/services/financialService'
import { listProductionOrders } from '@/modules/pcp/services/productionOrderService'
import { listSalesOrders } from '@/modules/vendas/services/salesOrderService'
import { listStockItems } from '@/modules/estoque/services/stockItemService'
import { listPurchaseOrders } from '@/modules/compras/services/purchaseOrderService'
import { getStockStatus } from '@/modules/estoque/types'
import { STATUS_LABELS as PCP_STATUS_LABELS, STATUS_COLORS as PCP_STATUS_COLORS } from '@/modules/pcp/types'
import { STATUS_LABELS as SALES_STATUS_LABELS, STATUS_COLORS as SALES_STATUS_COLORS } from '@/modules/vendas/types'
import type { FinancialEntry, FinancialInstallment } from '@/modules/financeiro/types'
import type { ProductionOrder } from '@/modules/pcp/types'
import type { SalesOrder } from '@/modules/vendas/types'
import type { StockItem } from '@/modules/estoque/types'
import type { PurchaseOrder } from '@/modules/compras/types'

function effectiveInstStatus(inst: FinancialInstallment): string {
  if (inst.status !== 'pendente') return inst.status
  return new Date(inst.due_date + 'T23:59:59') < new Date() ? 'vencido' : 'pendente'
}

function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtDate(str: string): string {
  return new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

interface DashData {
  entries: FinancialEntry[]
  orders: ProductionOrder[]
  sales: SalesOrder[]
  stock: StockItem[]
  purchases: PurchaseOrder[]
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [entries, orders, sales, stock, purchases] = await Promise.all([
        listFinancialEntries().catch(() => [] as FinancialEntry[]),
        listProductionOrders().catch(() => [] as ProductionOrder[]),
        listSalesOrders().catch(() => [] as SalesOrder[]),
        listStockItems().catch(() => [] as StockItem[]),
        listPurchaseOrders().catch(() => [] as PurchaseOrder[]),
      ])
      setData({ entries, orders, sales, stock, purchases })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Cálculos financeiros ─────────────────────────────────
  const allInstallments = (data?.entries ?? []).flatMap(e =>
    (e.installments ?? []).map(i => ({ ...i, entryType: e.type }))
  )

  let aReceber = 0, aPagar = 0, totalVencido = 0, qtdVencidas = 0
  for (const i of allInstallments) {
    const st = effectiveInstStatus(i)
    if (st === 'cancelado') continue
    if (i.entryType === 'receita' && st === 'pendente') aReceber += i.amount
    if (i.entryType === 'despesa' && st === 'pendente') aPagar += i.amount
    if (st === 'vencido') { totalVencido += i.amount; qtdVencidas++ }
  }
  const saldoPrevisto = aReceber - aPagar

  // ── Cálculos operacionais ────────────────────────────────
  const hoje = new Date().toISOString().slice(0, 10)
  const mesAtual = hoje.slice(0, 7)

  const opsAtivas = (data?.orders ?? []).filter(o =>
    !['entregue', 'cancelado'].includes(o.status)
  ).length

  const vendasMes = (data?.sales ?? []).filter(s =>
    s.sale_date?.startsWith(mesAtual) && s.status !== 'cancelado'
  )
  const valorVendasMes = vendasMes.reduce((acc, s) => acc + (s.total_value ?? 0), 0)

  const stockCritico = (data?.stock ?? []).filter(i => getStockStatus(i) !== 'ok')
  const stockZerado  = stockCritico.filter(i => getStockStatus(i) === 'zerado').length

  const comprasPendentes = (data?.purchases ?? []).filter(p =>
    ['rascunho', 'enviado'].includes(p.status)
  ).length

  // ── Listas recentes ──────────────────────────────────────
  const vendasRecentes   = [...(data?.sales ?? [])].slice(0, 5)
  const opsRecentes      = [...(data?.orders ?? [])].slice(0, 5)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Visão geral — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-lg transition-all"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw size={24} className="animate-spin" style={{ color: '#00c896' }} />
        </div>
      ) : (
        <>
          {/* ── KPIs Financeiro ── */}
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
            Financeiro
          </p>
          <div className="grid grid-cols-4 gap-5 mb-6">
            {[
              {
                label: 'A Receber',
                value: fmtBRL(aReceber),
                sub: `${allInstallments.filter(i => i.entryType === 'receita' && effectiveInstStatus(i) === 'pendente').length} parcelas`,
                icon: TrendingUp,
                color: '#00c896',
                bg: 'rgba(0,200,150,0.1)',
                onClick: () => navigate('/financeiro'),
              },
              {
                label: 'A Pagar',
                value: fmtBRL(aPagar),
                sub: `${allInstallments.filter(i => i.entryType === 'despesa' && effectiveInstStatus(i) === 'pendente').length} parcelas`,
                icon: TrendingDown,
                color: '#f87171',
                bg: 'rgba(239,68,68,0.1)',
                onClick: () => navigate('/financeiro'),
              },
              {
                label: 'Vencidas',
                value: fmtBRL(totalVencido),
                sub: `${qtdVencidas} parcela${qtdVencidas !== 1 ? 's' : ''} em atraso`,
                icon: AlertTriangle,
                color: '#fbbf24',
                bg: 'rgba(251,191,36,0.1)',
                onClick: () => navigate('/financeiro'),
              },
              {
                label: 'Saldo Previsto',
                value: fmtBRL(saldoPrevisto),
                sub: saldoPrevisto >= 0 ? 'Positivo' : 'Negativo',
                icon: Wallet,
                color: saldoPrevisto >= 0 ? '#60a5fa' : '#f87171',
                bg: saldoPrevisto >= 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                onClick: () => navigate('/financeiro'),
              },
            ].map(card => (
              <div
                key={card.label}
                onClick={card.onClick}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md"
                style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-medium" style={{ color: '#64748b' }}>{card.label}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                    <card.icon size={17} style={{ color: card.color }} />
                  </div>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#0f172a' }}>{card.value}</div>
                <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── KPIs Operacional ── */}
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#94a3b8' }}>
            Operacional
          </p>
          <div className="grid grid-cols-4 gap-5 mb-8">
            {[
              {
                label: 'OPs em Produção',
                value: opsAtivas,
                sub: 'ordens ativas',
                icon: Factory,
                color: '#00c896',
                bg: 'rgba(0,200,150,0.1)',
                onClick: () => navigate('/pcp'),
              },
              {
                label: 'Vendas do Mês',
                value: vendasMes.length,
                sub: fmtBRL(valorVendasMes),
                icon: ShoppingCart,
                color: '#60a5fa',
                bg: 'rgba(59,130,246,0.1)',
                onClick: () => navigate('/vendas'),
              },
              {
                label: 'Estoque Crítico',
                value: stockCritico.length,
                sub: `${stockZerado} zerado${stockZerado !== 1 ? 's' : ''}`,
                icon: Package,
                color: stockCritico.length > 0 ? '#fbbf24' : '#00c896',
                bg: stockCritico.length > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(0,200,150,0.1)',
                onClick: () => navigate('/estoque'),
              },
              {
                label: 'Compras Pendentes',
                value: comprasPendentes,
                sub: 'aguardando recebimento',
                icon: ShoppingBag,
                color: '#fb923c',
                bg: 'rgba(249,115,22,0.1)',
                onClick: () => navigate('/compras'),
              },
            ].map(card => (
              <div
                key={card.label}
                onClick={card.onClick}
                className="rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md"
                style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-medium" style={{ color: '#64748b' }}>{card.label}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                    <card.icon size={17} style={{ color: card.color }} />
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: '#0f172a' }}>{card.value}</div>
                <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Alerta estoque zerado ── */}
          {stockZerado > 0 && (
            <div
              className="flex items-center gap-3 px-5 py-3.5 rounded-xl mb-6 cursor-pointer"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
              onClick={() => navigate('/estoque')}>
              <AlertTriangle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
              <p className="text-sm" style={{ color: '#dc2626' }}>
                <strong>{stockZerado} item{stockZerado !== 1 ? 's' : ''}</strong> com estoque zerado.
                Verifique o Módulo de Estoque.
              </p>
              <ArrowRight size={14} style={{ color: '#f87171', marginLeft: 'auto' }} />
            </div>
          )}

          {/* ── Painéis de atividade ── */}
          <div className="grid grid-cols-2 gap-6">

            {/* Últimas Vendas */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <h2 className="text-sm font-bold" style={{ color: '#0f172a' }}>Últimas Vendas</h2>
                <button onClick={() => navigate('/vendas')}
                  className="flex items-center gap-1 text-xs font-medium" style={{ color: '#00c896' }}>
                  Ver todas <ArrowRight size={12} />
                </button>
              </div>
              {vendasRecentes.length === 0 ? (
                <div className="py-10 text-center">
                  <ShoppingCart size={24} className="mx-auto mb-2" style={{ color: '#cbd5e1' }} />
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Nenhuma venda cadastrada.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                  {vendasRecentes.map(s => {
                    const { bg, text } = SALES_STATUS_COLORS[s.status]
                    return (
                      <div
                        key={s.id}
                        onClick={() => navigate(`/vendas/${s.id}`)}
                        className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold" style={{ color: '#00c896' }}>{s.code}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: bg, color: text }}>
                              {SALES_STATUS_LABELS[s.status]}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-0.5" style={{ color: '#0f172a' }}>{s.customer_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold" style={{ color: '#0f172a' }}>
                            {s.total_value ? fmtBRL(s.total_value) : '—'}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{fmtDate(s.sale_date)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* OPs Recentes */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <h2 className="text-sm font-bold" style={{ color: '#0f172a' }}>Ordens de Produção</h2>
                <button onClick={() => navigate('/pcp')}
                  className="flex items-center gap-1 text-xs font-medium" style={{ color: '#00c896' }}>
                  Ver todas <ArrowRight size={12} />
                </button>
              </div>
              {opsRecentes.length === 0 ? (
                <div className="py-10 text-center">
                  <Factory size={24} className="mx-auto mb-2" style={{ color: '#cbd5e1' }} />
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Nenhuma ordem cadastrada.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                  {opsRecentes.map(o => {
                    const { bg, text } = PCP_STATUS_COLORS[o.status]
                    const atrasada = o.delivery_date && o.delivery_date < hoje && !['entregue','cancelado'].includes(o.status)
                    return (
                      <div
                        key={o.id}
                        onClick={() => navigate(`/pcp/${o.id}`)}
                        className="flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold" style={{ color: '#00c896' }}>{o.reference_number}</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: bg, color: text }}>
                              {PCP_STATUS_LABELS[o.status]}
                            </span>
                            {atrasada && <Clock size={12} style={{ color: '#f87171' }} />}
                          </div>
                          <p className="text-sm font-medium mt-0.5" style={{ color: '#0f172a' }}>{o.client_name}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs" style={{ color: '#94a3b8' }}>
                            {o.delivery_date ? fmtDate(o.delivery_date) : '—'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
