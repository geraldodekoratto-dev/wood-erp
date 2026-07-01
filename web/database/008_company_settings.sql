create table if not exists public.company_settings (
  id            uuid primary key default gen_random_uuid(),
  razao_social  text not null default '',
  nome_fantasia text not null default '',
  cnpj          text not null default '',
  address       text not null default '',
  city          text not null default '',
  state         text not null default '',
  zip_code      text not null default '',
  phone         text not null default '',
  email         text not null default '',
  website       text not null default '',
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users(id) on delete set null
);

alter table public.company_settings enable row level security;

create policy "settings_select" on public.company_settings for select to authenticated using (true);
create policy "settings_insert" on public.company_settings for insert to authenticated with check (true);
create policy "settings_update" on public.company_settings for update to authenticated using (true);

NOTIFY pgrst, 'reload schema';
