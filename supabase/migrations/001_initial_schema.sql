-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (mirrors auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  product_name text,
  target_country text,
  created_at timestamptz not null default now()
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  monthly_limit_tokens int not null default 5000,
  current_period_start date not null default current_date,
  current_period_end date not null default (current_date + interval '1 month')
);

-- Auto-create subscription on user creation
create or replace function public.handle_new_subscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.subscriptions (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_user_created_subscription
  after insert on public.users
  for each row execute procedure public.handle_new_subscription();

-- Token usage
create table public.token_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  phase smallint not null check (phase in (1, 2, 3)),
  prompt_key text not null,
  tokens_used int not null,
  model text not null,
  created_at timestamptz not null default now()
);

-- Reports
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  phase smallint not null,
  prompt_key text not null,
  input_json jsonb not null,
  output_text text not null,
  created_at timestamptz not null default now()
);

-- Prompt templates
create table public.prompt_templates (
  id uuid primary key default uuid_generate_v4(),
  phase smallint not null,
  key text not null unique,
  title text not null,
  template_text text not null,
  model text not null check (model in ('perplexity', 'openai', 'claude')),
  display_order smallint not null default 0
);

-- RLS
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.token_usage enable row level security;
alter table public.reports enable row level security;
alter table public.prompt_templates enable row level security;

-- users: own row only
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- subscriptions: own row only
create policy "subs_select_own" on public.subscriptions for select using (auth.uid() = user_id);

-- token_usage: own rows only
create policy "token_select_own" on public.token_usage for select using (auth.uid() = user_id);
create policy "token_insert_own" on public.token_usage for insert with check (auth.uid() = user_id);

-- reports: own rows only
create policy "reports_select_own" on public.reports for select using (auth.uid() = user_id);
create policy "reports_insert_own" on public.reports for insert with check (auth.uid() = user_id);

-- prompt_templates: public read, admin write
create policy "prompts_select_all" on public.prompt_templates for select using (true);
create policy "prompts_admin_write" on public.prompt_templates for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
