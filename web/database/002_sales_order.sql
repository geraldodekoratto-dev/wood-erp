-- WOOD ERP - Migration 002 - Módulo Vendas
-- Execute este script no SQL Editor do Supabase
-- Dashboard → SQL Editor → New Query → cole e execute

-- ============================================================
-- SALES_ORDER (pedidos de venda)
-- ============================================================
create table public.sales_order (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique,
  customer_id          uuid references public.customer(id) on delete set null,
  customer_name        text not null,
  status               text not null default 'rascunho',
  sale_date            date not null,
  delivery_date        date,
  total_value          numeric(12, 2),
  payment_method       text,
  payment_terms        text,
  description          text,
  notes                text,
  production_order_id  uuid references public.production_order(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid references auth.users(id) on delete set null,
  deleted_at           timestamptz
);

-- Valores permitidos para status
alter table public.sales_order
  add constraint sales_order_status_check
  check (status in ('rascunho', 'confirmado', 'em_producao', 'entregue', 'cancelado'));

-- Valores permitidos para forma de pagamento
alter table public.sales_order
  add constraint sales_order_payment_method_check
  check (payment_method is null or payment_method in (
    'dinheiro', 'pix', 'cartao_credito', 'cartao_debito',
    'boleto', 'transferencia', 'financiamento', 'outro'
  ));

-- Índices para buscas frequentes
create index sales_order_status_idx        on public.sales_order (status);
create index sales_order_customer_id_idx   on public.sales_order (customer_id);
create index sales_order_deleted_at_idx    on public.sales_order (deleted_at);
create index sales_order_sale_date_idx     on public.sales_order (sale_date desc);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.sales_order enable row level security;

-- Qualquer usuário autenticado pode visualizar (excluídos os soft-deleted — filtro feito na aplicação)
create policy "Autenticados visualizam pedidos de venda"
  on public.sales_order for select
  to authenticated
  using (true);

-- Qualquer usuário autenticado pode criar pedidos
create policy "Autenticados criam pedidos de venda"
  on public.sales_order for insert
  to authenticated
  with check (true);

-- Qualquer usuário autenticado pode atualizar (inclui soft-delete e mudança de status)
create policy "Autenticados atualizam pedidos de venda"
  on public.sales_order for update
  to authenticated
  using (true)
  with check (true);
