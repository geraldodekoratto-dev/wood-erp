-- ============================================================
-- 005_financial.sql — Módulo Financeiro
-- Lançamentos financeiros (receitas e despesas) com parcelas
-- ============================================================

-- ── financial_entry ─────────────────────────────────────────
create table if not exists public.financial_entry (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  type             text not null check (type in ('receita', 'despesa')),
  description      text not null,
  category         text not null default '',
  total_amount     numeric(12, 2) not null check (total_amount > 0),
  reference_type   text check (reference_type in ('sales_order', 'purchase_order', 'manual')),
  reference_id     uuid,
  reference_code   text,
  notes            text,
  status           text not null default 'ativo'
                     check (status in ('ativo', 'cancelado')),
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

-- ── financial_installment ────────────────────────────────────
create table if not exists public.financial_installment (
  id                  uuid primary key default gen_random_uuid(),
  financial_entry_id  uuid not null references public.financial_entry(id) on delete cascade,
  installment_number  int not null check (installment_number > 0),
  amount              numeric(12, 2) not null check (amount > 0),
  due_date            date not null,
  status              text not null default 'pendente'
                        check (status in ('pendente', 'pago', 'vencido', 'cancelado')),
  payment_date        date,
  payment_method      text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Índices ──────────────────────────────────────────────────
create index if not exists idx_financial_entry_type       on public.financial_entry(type);
create index if not exists idx_financial_entry_status     on public.financial_entry(status);
create index if not exists idx_financial_entry_deleted_at on public.financial_entry(deleted_at);
create index if not exists idx_financial_entry_ref_id     on public.financial_entry(reference_id);
create index if not exists idx_financial_inst_entry_id    on public.financial_installment(financial_entry_id);
create index if not exists idx_financial_inst_status      on public.financial_installment(status);
create index if not exists idx_financial_inst_due_date    on public.financial_installment(due_date);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.financial_entry        enable row level security;
alter table public.financial_installment  enable row level security;

-- financial_entry
create policy "financial_entry_select" on public.financial_entry
  for select to authenticated using (true);

create policy "financial_entry_insert" on public.financial_entry
  for insert to authenticated with check (true);

create policy "financial_entry_update" on public.financial_entry
  for update to authenticated using (true);

-- financial_installment
create policy "financial_installment_select" on public.financial_installment
  for select to authenticated using (true);

create policy "financial_installment_insert" on public.financial_installment
  for insert to authenticated with check (true);

create policy "financial_installment_update" on public.financial_installment
  for update to authenticated using (true);

create policy "financial_installment_delete" on public.financial_installment
  for delete to authenticated using (true);
