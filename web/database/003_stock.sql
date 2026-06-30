-- WOOD ERP - Migration 003 - Módulo Estoque
-- Execute este script no SQL Editor do Supabase
-- Dashboard → SQL Editor → New Query → cole e execute

-- ============================================================
-- STOCK_ITEM (itens de estoque)
-- ============================================================
create table public.stock_item (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  name             text not null,
  description      text,
  category         text not null default 'outro',
  unit             text not null default 'un',
  min_quantity     numeric(12, 3) not null default 0,
  current_quantity numeric(12, 3) not null default 0,
  cost_price       numeric(12, 2),
  supplier         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id) on delete set null,
  deleted_at       timestamptz
);

alter table public.stock_item
  add constraint stock_item_category_check
  check (category in ('materia_prima', 'ferragem', 'acabamento', 'produto_acabado', 'outro'));

alter table public.stock_item
  add constraint stock_item_unit_check
  check (unit in ('un', 'm2', 'm_linear', 'kg', 'litro', 'pc', 'cx', 'm'));

alter table public.stock_item
  add constraint stock_item_min_quantity_check
  check (min_quantity >= 0);

alter table public.stock_item
  add constraint stock_item_current_quantity_check
  check (current_quantity >= 0);

create index stock_item_category_idx  on public.stock_item (category);
create index stock_item_deleted_at_idx on public.stock_item (deleted_at);
create index stock_item_name_idx      on public.stock_item (name);

-- ============================================================
-- STOCK_MOVEMENT (histórico de movimentações)
-- ============================================================
create table public.stock_movement (
  id               uuid primary key default gen_random_uuid(),
  stock_item_id    uuid not null references public.stock_item(id) on delete cascade,
  type             text not null,
  quantity         numeric(12, 3) not null,
  reason           text not null default 'outro',
  notes            text,
  reference_id     uuid,
  reference_type   text,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table public.stock_movement
  add constraint stock_movement_type_check
  check (type in ('entrada', 'saida'));

alter table public.stock_movement
  add constraint stock_movement_reason_check
  check (reason in (
    'compra', 'consumo_producao', 'devolucao_cliente',
    'devolucao_fornecedor', 'ajuste_inventario', 'perda', 'outro'
  ));

alter table public.stock_movement
  add constraint stock_movement_quantity_check
  check (quantity > 0);

create index stock_movement_item_idx       on public.stock_movement (stock_item_id, created_at desc);
create index stock_movement_reference_idx  on public.stock_movement (reference_id) where reference_id is not null;

-- ============================================================
-- RPC: add_stock_movement (atômico — atualiza saldo + registra movimento)
-- ============================================================
create or replace function public.add_stock_movement(
  p_stock_item_id  uuid,
  p_type           text,
  p_quantity       numeric,
  p_reason         text,
  p_notes          text,
  p_reference_id   uuid,
  p_reference_type text,
  p_user_id        uuid
) returns public.stock_item
language plpgsql security definer as $$
declare
  v_current_qty numeric;
  v_new_qty     numeric;
  v_item        public.stock_item;
begin
  -- Bloqueia a linha para garantir atomicidade
  select current_quantity into v_current_qty
  from public.stock_item
  where id = p_stock_item_id and deleted_at is null
  for update;

  if not found then
    raise exception 'Item de estoque não encontrado.';
  end if;

  if p_type = 'entrada' then
    v_new_qty := v_current_qty + p_quantity;
  elsif p_type = 'saida' then
    if v_current_qty < p_quantity then
      raise exception 'Estoque insuficiente. Disponível: %, Solicitado: %', v_current_qty, p_quantity;
    end if;
    v_new_qty := v_current_qty - p_quantity;
  else
    raise exception 'Tipo de movimentação inválido: %', p_type;
  end if;

  -- Registra a movimentação
  insert into public.stock_movement (
    stock_item_id, type, quantity, reason, notes,
    reference_id, reference_type, created_by
  ) values (
    p_stock_item_id, p_type, p_quantity, p_reason, p_notes,
    p_reference_id, p_reference_type, p_user_id
  );

  -- Atualiza o saldo do item e retorna o registro atualizado
  update public.stock_item
  set current_quantity = v_new_qty,
      updated_at = now()
  where id = p_stock_item_id
  returning * into v_item;

  return v_item;
end;
$$;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
alter table public.stock_item enable row level security;
alter table public.stock_movement enable row level security;

-- stock_item
create policy "Autenticados visualizam itens de estoque"
  on public.stock_item for select
  to authenticated
  using (true);

create policy "Autenticados criam itens de estoque"
  on public.stock_item for insert
  to authenticated
  with check (true);

create policy "Autenticados atualizam itens de estoque"
  on public.stock_item for update
  to authenticated
  using (true)
  with check (true);

-- stock_movement
create policy "Autenticados visualizam movimentações"
  on public.stock_movement for select
  to authenticated
  using (true);

create policy "Autenticados registram movimentações"
  on public.stock_movement for insert
  to authenticated
  with check (true);
