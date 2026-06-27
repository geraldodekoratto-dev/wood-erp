-- WOOD ERP - Migration 001 - Foundation
-- Execute este script no SQL Editor do Supabase

-- ============================================================
-- PROFILES (perfis dos usuários)
-- ============================================================
create table public.profile (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null default 'operator',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Roles permitidos
alter table public.profile
  add constraint profile_role_check
  check (role in (
    'admin',
    'gerente_vendas',
    'projetista',
    'conferente',
    'supervisor',
    'operador_producao',
    'montagem_externa'
  ));

-- RLS (Row Level Security)
alter table public.profile enable row level security;

create policy "Usuário vê o próprio perfil"
  on public.profile for select
  using (auth.uid() = id);

create policy "Admin vê todos os perfis"
  on public.profile for select
  using (
    exists (
      select 1 from public.profile p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Trigger para criar perfil automaticamente após cadastro
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profile (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'operator')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
