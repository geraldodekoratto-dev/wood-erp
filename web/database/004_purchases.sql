-- ============================================================
-- 004_purchases.sql — Módulo Compras
-- Pedidos de compra e itens com controle de recebimento
-- ============================================================

-- ── purchase_order ──────────────────────────────────────────
create table if not exists public.purchase_order (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  supplier_name text not null,
  status        text not null default 'rascunho'
                  check (status in ('rascunho','enviado','parcialmente_recebido','recebido','cancelado')),
  order_date    date not null default current_date,
  expected_date date,
  notes         text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- ── purchase_order_item ──────────────────────────────────────
create table if not exists public.purchase_order_item (
  id                 uuid primary key default gen_random_uuid(),
  purchase_order_id  uuid not null references public.purchase_order(id) on delete cascade,
  stock_item_id      uuid references public.stock_item(id) on delete set null,
  stock_item_name    text not null,
  unit               text not null default 'un',
  quantity_ordered   numeric not null check (quantity_ordered > 0),
  quantity_received  numeric not null default 0 check (quantity_received >= 0),
  unit_price         numeric check (unit_price >= 0),
  created_at         timestamptz not null default now()
);

-- ── Índices ──────────────────────────────────────────────────
create index if not exists idx_purchase_order_status     on public.purchase_order(status);
create index if not exists idx_purchase_order_deleted_at on public.purchase_order(deleted_at);
create index if not exists idx_purchase_order_order_date on public.purchase_order(order_date desc);
create index if not exists idx_poi_purchase_order_id     on public.purchase_order_item(purchase_order_id);
create index if not exists idx_poi_stock_item_id         on public.purchase_order_item(stock_item_id);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.purchase_order      enable row level security;
alter table public.purchase_order_item enable row level security;

-- purchase_order
create policy "purchase_order_select" on public.purchase_order
  for select to authenticated using (true);

create policy "purchase_order_insert" on public.purchase_order
  for insert to authenticated with check (true);

create policy "purchase_order_update" on public.purchase_order
  for update to authenticated using (true);

-- purchase_order_item
create policy "purchase_order_item_select" on public.purchase_order_item
  for select to authenticated using (true);

create policy "purchase_order_item_insert" on public.purchase_order_item
  for insert to authenticated with check (true);

create policy "purchase_order_item_update" on public.purchase_order_item
  for update to authenticated using (true);

create policy "purchase_order_item_delete" on public.purchase_order_item
  for delete to authenticated using (true);
