create extension if not exists pgcrypto;

create type project_stage as enum ('PLANNING','CONCEPT','QUOTES','IN_PROGRESS','FINISHING','DONE');
create type room_status as enum ('NOT_STARTED','CONCEPT','PRICING','ORDERING','IN_PROGRESS','DONE');
create type budget_category as enum ('CONSTRUCTION_WORKS','ELECTRICAL','PLUMBING','BATHROOM','KITCHEN','FLOORING','DOORS','LIGHTING','FURNITURE','APPLIANCES','DECORATION','RESERVE','OTHER');
create type budget_status as enum ('PLANNED','QUOTED','ORDERED','PAID','CANCELLED');
create type task_status as enum ('TODO','IN_PROGRESS','DONE','BLOCKED');
create type priority as enum ('LOW','MEDIUM','HIGH','URGENT');
create type product_status as enum ('FOUND','SHORTLISTED','SELECTED','ORDERED','DELIVERED','INSTALLED','RETURNED');
create type delivery_status as enum ('NOT_ORDERED','ORDERED','SHIPPED','DELIVERED','DELAYED','RETURNED');
create type decision_status as enum ('NOT_STARTED','RESEARCH','SHORTLIST','DECIDED');
create type vendor_status as enum ('CONTACTED','QUOTED','SELECTED','REJECTED');
create type vendor_type as enum ('GENERAL_CONTRACTOR','ELECTRICIAN','PLUMBER','CARPENTER','PAINTER','TILER','DESIGNER','OTHER');
create type inspiration_source as enum ('UPLOAD','URL');
create type plan_type as enum ('ORIGINAL','DESIGNER');
create type plan_difference_status as enum ('ACCEPTED','NEEDS_DISCUSSION','REJECTED');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  area numeric,
  target_budget numeric,
  style text,
  stage project_stage not null default 'PLANNING',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  area numeric,
  status room_status not null default 'NOT_STARTED',
  concept_description text,
  notes text,
  budget_planned numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  category budget_category not null default 'OTHER',
  planned_cost numeric,
  actual_cost numeric,
  status budget_status not null default 'PLANNED',
  notes text,
  unexpected_cost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'TODO',
  priority priority not null default 'MEDIUM',
  due_date date,
  blocked_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  category text,
  price numeric,
  url text,
  image_url text,
  store text,
  status product_status not null default 'FOUND',
  delivery_status delivery_status not null default 'NOT_ORDERED',
  expected_delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  description text,
  status decision_status not null default 'NOT_STARTED',
  selected_option text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type vendor_type not null default 'OTHER',
  phone text,
  email text,
  offer_amount numeric,
  status vendor_status not null default 'CONTACTED',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inspirations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  source inspiration_source not null,
  title text not null,
  description text,
  category text,
  external_url text,
  storage_bucket text,
  storage_path text,
  designer_note text,
  selected_for_designer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.designer_brief_room_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, room_id)
);

create table public.project_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  plan_type plan_type not null,
  title text not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  original_file_name text,
  version_label text,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_differences (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  description text,
  status plan_difference_status not null default 'NEEDS_DISCUSSION',
  priority priority not null default 'MEDIUM',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_owner_id_idx on public.projects(owner_id);
create index rooms_project_id_idx on public.rooms(project_id);
create index budget_items_project_id_idx on public.budget_items(project_id);
create index tasks_project_id_idx on public.tasks(project_id);
create index products_project_id_idx on public.products(project_id);
create index decisions_project_id_idx on public.decisions(project_id);
create index vendors_project_id_idx on public.vendors(project_id);
create index inspirations_project_id_idx on public.inspirations(project_id);
create index project_plans_project_id_idx on public.project_plans(project_id);
create index plan_differences_project_id_idx on public.plan_differences(project_id);

create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger set_rooms_updated_at before update on public.rooms for each row execute function public.set_updated_at();
create trigger set_budget_items_updated_at before update on public.budget_items for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger set_decisions_updated_at before update on public.decisions for each row execute function public.set_updated_at();
create trigger set_vendors_updated_at before update on public.vendors for each row execute function public.set_updated_at();
create trigger set_inspirations_updated_at before update on public.inspirations for each row execute function public.set_updated_at();
create trigger set_designer_brief_room_notes_updated_at before update on public.designer_brief_room_notes for each row execute function public.set_updated_at();
create trigger set_project_plans_updated_at before update on public.project_plans for each row execute function public.set_updated_at();
create trigger set_plan_differences_updated_at before update on public.plan_differences for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.rooms enable row level security;
alter table public.budget_items enable row level security;
alter table public.tasks enable row level security;
alter table public.products enable row level security;
alter table public.decisions enable row level security;
alter table public.vendors enable row level security;
alter table public.inspirations enable row level security;
alter table public.designer_brief_room_notes enable row level security;
alter table public.project_plans enable row level security;
alter table public.plan_differences enable row level security;

create policy "owners manage projects" on public.projects for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.is_project_owner(project_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.projects where id = project_id and owner_id = auth.uid());
$$;

create policy "owners manage rooms" on public.rooms for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage budget_items" on public.budget_items for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage tasks" on public.tasks for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage products" on public.products for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage decisions" on public.decisions for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage vendors" on public.vendors for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage inspirations" on public.inspirations for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage designer notes" on public.designer_brief_room_notes for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage project plans" on public.project_plans for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "owners manage plan differences" on public.plan_differences for all using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('inspirations', 'inspirations', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('plans', 'plans', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public;

create policy "users read own storage objects" on storage.objects for select
using (bucket_id in ('inspirations','plans') and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "users upload own storage objects" on storage.objects for insert
with check (bucket_id in ('inspirations','plans') and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "users update own storage objects" on storage.objects for update
using (bucket_id in ('inspirations','plans') and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text)
with check (bucket_id in ('inspirations','plans') and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "users delete own storage objects" on storage.objects for delete
using (bucket_id in ('inspirations','plans') and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text);
