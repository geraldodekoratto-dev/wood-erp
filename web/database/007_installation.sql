-- ============================================================
-- 007_installation.sql — Módulo Instalação
-- Agendamento e controle de visitas técnicas de instalação
-- ============================================================

create table if not exists public.installation_order (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  sales_order_id   uuid references public.sales_order(id) on delete set null,
  sales_order_code text,
  customer_name    text not null,
  customer_address text,
  scheduled_date   date not null,
  scheduled_time   text,
  technician       text,
  status           text not null default 'agendado'
                     check (status in ('agendado','em_andamento','concluido','cancelado')),
  notes            text,
  completion_notes text,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

-- Índices
create index if not exists idx_inst_status         on public.installation_order(status);
create index if not exists idx_inst_scheduled_date on public.installation_order(scheduled_date);
create index if not exists idx_inst_deleted_at     on public.installation_order(deleted_at);
create index if not exists idx_inst_sales_order_id on public.installation_order(sales_order_id);

-- RLS
alter table public.installation_order enable row level security;

create policy "inst_select" on public.installation_order for select to authenticated using (true);
create policy "inst_insert" on public.installation_order for insert to authenticated with check (true);
create policy "inst_update" on public.installation_order for update to authenticated using (true);
