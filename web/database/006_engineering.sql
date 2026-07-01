-- ============================================================
-- 006_engineering.sql — Módulo Engenharia
-- Fichas técnicas de produtos e lista de materiais (BOM)
-- ============================================================

-- ── engineering_product ─────────────────────────────────────
create table if not exists public.engineering_product (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  description text,
  category    text not null default 'outro'
                check (category in ('cozinha','quarto','banheiro','sala','escritorio','outro')),
  status      text not null default 'ativo'
                check (status in ('ativo','em_revisao','inativo')),
  width_cm    numeric(8,2),
  height_cm   numeric(8,2),
  depth_cm    numeric(8,2),
  material    text,
  finish      text,
  notes       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

-- ── engineering_bom_item ─────────────────────────────────────
create table if not exists public.engineering_bom_item (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.engineering_product(id) on delete cascade,
  stock_item_id   uuid references public.stock_item(id) on delete set null,
  item_name       text not null,
  quantity        numeric(10,3) not null check (quantity > 0),
  unit            text not null default 'un',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Índices ──────────────────────────────────────────────────
create index if not exists idx_eng_product_status     on public.engineering_product(status);
create index if not exists idx_eng_product_category   on public.engineering_product(category);
create index if not exists idx_eng_product_deleted_at on public.engineering_product(deleted_at);
create index if not exists idx_eng_bom_product_id     on public.engineering_bom_item(product_id);
create index if not exists idx_eng_bom_stock_item_id  on public.engineering_bom_item(stock_item_id);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.engineering_product  enable row level security;
alter table public.engineering_bom_item enable row level security;

-- engineering_product
create policy "eng_product_select" on public.engineering_product
  for select to authenticated using (true);

create policy "eng_product_insert" on public.engineering_product
  for insert to authenticated with check (true);

create policy "eng_product_update" on public.engineering_product
  for update to authenticated using (true);

-- engineering_bom_item
create policy "eng_bom_select" on public.engineering_bom_item
  for select to authenticated using (true);

create policy "eng_bom_insert" on public.engineering_bom_item
  for insert to authenticated with check (true);

create policy "eng_bom_update" on public.engineering_bom_item
  for update to authenticated using (true);

create policy "eng_bom_delete" on public.engineering_bom_item
  for delete to authenticated using (true);
