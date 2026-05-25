-- =============================================================================
-- Planner Mieszkanie — idempotentna migracja naprawcza
-- Dodaje brakujące elementy schematu bez konfliktów (IF NOT EXISTS wszędzie)
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- ENUMS — bezpieczne tworzenie
-- =============================================================================

do $$ begin create type project_stage as enum ('PLANNING','CONCEPT','QUOTES','IN_PROGRESS','FINISHING','DONE'); exception when duplicate_object then null; end $$;
do $$ begin create type room_status as enum ('NOT_STARTED','CONCEPT','PRICING','ORDERING','IN_PROGRESS','DONE'); exception when duplicate_object then null; end $$;
do $$ begin create type budget_category as enum ('CONSTRUCTION_WORKS','ELECTRICAL','PLUMBING','BATHROOM','KITCHEN','FLOORING','DOORS','LIGHTING','FURNITURE','APPLIANCES','DECORATION','RESERVE','OTHER'); exception when duplicate_object then null; end $$;
do $$ begin create type budget_status as enum ('PLANNED','QUOTED','ORDERED','PAID','CANCELLED'); exception when duplicate_object then null; end $$;
do $$ begin create type task_status as enum ('TODO','IN_PROGRESS','DONE','BLOCKED'); exception when duplicate_object then null; end $$;
do $$ begin create type priority as enum ('LOW','MEDIUM','HIGH','URGENT'); exception when duplicate_object then null; end $$;
do $$ begin create type product_status as enum ('FOUND','SHORTLISTED','SELECTED','ORDERED','DELIVERED','INSTALLED','RETURNED'); exception when duplicate_object then null; end $$;
do $$ begin create type delivery_status as enum ('NOT_ORDERED','ORDERED','SHIPPED','DELIVERED','DELAYED','RETURNED'); exception when duplicate_object then null; end $$;
do $$ begin create type decision_status as enum ('NOT_STARTED','RESEARCH','SHORTLIST','DECIDED'); exception when duplicate_object then null; end $$;
do $$ begin create type approval_status as enum ('PENDING','APPROVED','REJECTED'); exception when duplicate_object then null; end $$;
do $$ begin create type vendor_status as enum ('CONTACTED','QUOTED','SELECTED','REJECTED'); exception when duplicate_object then null; end $$;
do $$ begin create type vendor_type as enum ('GENERAL_CONTRACTOR','ELECTRICIAN','PLUMBER','CARPENTER','PAINTER','TILER','DESIGNER','OTHER'); exception when duplicate_object then null; end $$;
do $$ begin create type inspiration_source as enum ('UPLOAD','URL','PINTEREST'); exception when duplicate_object then null; end $$;
do $$ begin create type plan_type as enum ('ORIGINAL','DESIGNER'); exception when duplicate_object then null; end $$;
do $$ begin create type plan_difference_status as enum ('ACCEPTED','NEEDS_DISCUSSION','REJECTED'); exception when duplicate_object then null; end $$;
do $$ begin create type document_type as enum ('INVOICE','RECEIPT','WARRANTY','CONTRACT','OFFER','TECHNICAL_DRAWING','PROTOCOL','DELIVERY_NOTE','OTHER'); exception when duplicate_object then null; end $$;
do $$ begin create type schedule_status as enum ('PLANNED','IN_PROGRESS','DONE','DELAYED','CANCELLED'); exception when duplicate_object then null; end $$;
do $$ begin create type payment_status as enum ('PLANNED','DUE','PAID','OVERDUE','CANCELLED'); exception when duplicate_object then null; end $$;
do $$ begin create type punch_list_severity as enum ('LOW','MEDIUM','HIGH','CRITICAL'); exception when duplicate_object then null; end $$;
do $$ begin create type punch_list_status as enum ('NEW','REPORTED','IN_PROGRESS','FIXED','ACCEPTED'); exception when duplicate_object then null; end $$;
do $$ begin create type question_status as enum ('OPEN','ANSWERED','NEEDS_FOLLOW_UP','CLOSED'); exception when duplicate_object then null; end $$;
do $$ begin create type member_role as enum ('OWNER','EDITOR','VIEWER','DESIGNER','CONTRACTOR'); exception when duplicate_object then null; end $$;
do $$ begin create type share_scope as enum ('WHOLE_PROJECT','SELECTED_ROOMS','INSPIRATIONS_ONLY','PLANS_ONLY','PLAN_COMPARISON','DESIGNER_BRIEFS','CONTRACTOR_PACKAGE'); exception when duplicate_object then null; end $$;
do $$ begin create type constraint_type as enum ('DISLIKE','MUST_HAVE','AVOID','TECHNICAL_CONSTRAINT','BUDGET_CONSTRAINT'); exception when duplicate_object then null; end $$;
do $$ begin create type notification_type as enum ('TASK_DUE_SOON','TASK_OVERDUE','BUDGET_EXCEEDED','DECISION_OPEN','DECISION_APPROVAL_PENDING','WARRANTY_EXPIRING','SCHEDULE_DELAYED','PUNCH_LIST_ITEM_DUE','DELIVERY_LATE','COMMENT_ADDED','PAYMENT_DUE','PAYMENT_OVERDUE','QUESTION_DUE'); exception when duplicate_object then null; end $$;

-- =============================================================================
-- FUNKCJE POMOCNICZE
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop function if exists public.is_project_owner(uuid) cascade;
create function public.is_project_owner(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.projects where id = pid and owner_id = auth.uid());
$$;

drop function if exists public.has_project_access(uuid) cascade;
create function public.has_project_access(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.projects where id = pid and owner_id = auth.uid()
    union all
    select 1 from public.project_members where project_id = pid and user_id = auth.uid()
  );
$$;

-- =============================================================================
-- TABELE — CREATE IF NOT EXISTS + ALTER TABLE ADD COLUMN IF NOT EXISTS
-- =============================================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  area numeric,
  target_budget numeric,
  style text,
  stage project_stage not null default 'PLANNING',
  description text,
  contingency_percent numeric default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Dodaj brakujące kolumny do istniejącej tabeli
alter table public.projects add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.projects add column if not exists area numeric;
alter table public.projects add column if not exists target_budget numeric;
alter table public.projects add column if not exists style text;
alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists contingency_percent numeric default 10;
alter table public.projects add column if not exists updated_at timestamptz not null default now();

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  area numeric,
  status room_status not null default 'NOT_STARTED',
  concept_description text,
  notes text,
  budget_planned numeric,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rooms add column if not exists area numeric;
alter table public.rooms add column if not exists concept_description text;
alter table public.rooms add column if not exists notes text;
alter table public.rooms add column if not exists budget_planned numeric;
alter table public.rooms add column if not exists sort_order int not null default 0;
alter table public.rooms add column if not exists updated_at timestamptz not null default now();

create table if not exists public.budget_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  scenario_id uuid references public.budget_scenarios(id) on delete set null,
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
alter table public.budget_items add column if not exists room_id uuid references public.rooms(id) on delete set null;
alter table public.budget_items add column if not exists scenario_id uuid references public.budget_scenarios(id) on delete set null;
alter table public.budget_items add column if not exists actual_cost numeric;
alter table public.budget_items add column if not exists notes text;
alter table public.budget_items add column if not exists unexpected_cost boolean not null default false;
alter table public.budget_items add column if not exists updated_at timestamptz not null default now();

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'TODO',
  priority priority not null default 'MEDIUM',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks add column if not exists room_id uuid references public.rooms(id) on delete set null;
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists due_date date;
alter table public.tasks add column if not exists updated_at timestamptz not null default now();

create table if not exists public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  blocked_by_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(task_id, blocked_by_task_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  budget_item_id uuid references public.budget_items(id) on delete set null,
  name text not null,
  category text,
  price numeric,
  url text,
  image_url text,
  store text,
  status product_status not null default 'FOUND',
  delivery_status delivery_status not null default 'NOT_ORDERED',
  order_number text,
  ordered_at date,
  expected_delivery_date date,
  delivered_at date,
  tracking_url text,
  required_by date,
  purchase_priority priority not null default 'MEDIUM',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  description text,
  status decision_status not null default 'NOT_STARTED',
  selected_option text,
  notes text,
  requires_approval boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.decisions add column if not exists room_id uuid references public.rooms(id) on delete set null;
alter table public.decisions add column if not exists description text;
alter table public.decisions add column if not exists selected_option text;
alter table public.decisions add column if not exists notes text;
alter table public.decisions add column if not exists requires_approval boolean not null default false;
alter table public.decisions add column if not exists updated_at timestamptz not null default now();

create table if not exists public.decision_approvals (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status approval_status not null default 'PENDING',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendors (
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
alter table public.vendors add column if not exists phone text;
alter table public.vendors add column if not exists email text;
alter table public.vendors add column if not exists offer_amount numeric;
alter table public.vendors add column if not exists notes text;
alter table public.vendors add column if not exists updated_at timestamptz not null default now();

create table if not exists public.inspirations (
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
alter table public.inspirations add column if not exists room_id uuid references public.rooms(id) on delete set null;
alter table public.inspirations add column if not exists description text;
alter table public.inspirations add column if not exists category text;
alter table public.inspirations add column if not exists storage_bucket text;
alter table public.inspirations add column if not exists storage_path text;
alter table public.inspirations add column if not exists designer_note text;
alter table public.inspirations add column if not exists selected_for_designer boolean not null default false;
alter table public.inspirations add column if not exists updated_at timestamptz not null default now();

create table if not exists public.designer_brief_room_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, room_id)
);

create table if not exists public.project_plans (
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

create table if not exists public.plan_differences (
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

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  budget_item_id uuid references public.budget_items(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  decision_id uuid references public.decisions(id) on delete set null,
  title text not null,
  type document_type not null default 'OTHER',
  storage_bucket text not null,
  storage_path text not null,
  original_file_name text,
  mime_type text,
  file_size bigint,
  notes text,
  purchase_date date,
  warranty_until date,
  amount numeric,
  seller text,
  invoice_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  title text not null,
  description text,
  start_date date,
  end_date date,
  status schedule_status not null default 'PLANNED',
  depends_on_item_id uuid references public.schedule_items(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  budget_item_id uuid references public.budget_items(id) on delete set null,
  schedule_item_id uuid references public.schedule_items(id) on delete set null,
  title text not null,
  amount numeric not null,
  planned_date date,
  paid_date date,
  status payment_status not null default 'PLANNED',
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.punch_list_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  title text not null,
  description text,
  severity punch_list_severity not null default 'MEDIUM',
  status punch_list_status not null default 'NEW',
  due_date date,
  resolved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  storage_bucket text not null,
  storage_path text not null,
  title text,
  note text,
  photo_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  value numeric not null,
  unit text not null default 'cm',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_technical_details (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  ceiling_height numeric,
  flooring_area numeric,
  wall_area numeric,
  skirting_length numeric,
  number_of_light_points int,
  number_of_sockets int,
  window_dimensions text,
  door_dimensions text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(room_id)
);

create table if not exists public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  items jsonb not null default '[]'
);

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  decision_id uuid references public.decisions(id) on delete set null,
  question text not null,
  answer text,
  assignee_type text,
  assignee_name text,
  status question_status not null default 'OPEN',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  meeting_date timestamptz,
  notes text,
  outcome text,
  next_steps text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_scope_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null,
  description text,
  included boolean not null default true,
  price_included boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  body text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'VIEWER',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  scope share_scope not null default 'WHOLE_PROJECT',
  room_ids uuid[],
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.project_constraints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  type constraint_type not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alternatives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  decision_id uuid references public.decisions(id) on delete set null,
  budget_item_id uuid references public.budget_items(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  url text,
  price numeric,
  pros text,
  cons text,
  selected boolean not null default false,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text,
  category text,
  notes text,
  rating int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_product_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  url text,
  price numeric,
  store text,
  notes text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pinterest_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.pinterest_boards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id text not null,
  board_name text not null,
  room_id uuid references public.rooms(id) on delete set null,
  imported_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pending_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  role member_role not null default 'EDITOR',
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- INDEKSY
-- =============================================================================

create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_rooms_project_id on public.rooms(project_id);
create index if not exists idx_rooms_project_sort on public.rooms(project_id, sort_order);
create index if not exists idx_budget_scenarios_project_id on public.budget_scenarios(project_id);
create index if not exists idx_budget_items_project_id on public.budget_items(project_id);
create index if not exists idx_budget_items_room_id on public.budget_items(room_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_project_status on public.tasks(project_id, status);
create index if not exists idx_products_project_id on public.products(project_id);
create index if not exists idx_decisions_project_id on public.decisions(project_id);
create index if not exists idx_vendors_project_id on public.vendors(project_id);
create index if not exists idx_inspirations_project_id on public.inspirations(project_id);
create index if not exists idx_inspirations_selected on public.inspirations(project_id, selected_for_designer);
create index if not exists idx_project_plans_project_id on public.project_plans(project_id);
create index if not exists idx_plan_differences_project_id on public.plan_differences(project_id);
create index if not exists idx_documents_project_id on public.documents(project_id);
create index if not exists idx_schedule_items_project_id on public.schedule_items(project_id);
create index if not exists idx_payments_project_id on public.payments(project_id);
create index if not exists idx_payments_project_status on public.payments(project_id, status);
create index if not exists idx_punch_list_project_id on public.punch_list_items(project_id);
create index if not exists idx_progress_photos_project_id on public.progress_photos(project_id);
create index if not exists idx_measurements_project_id on public.measurements(project_id);
create index if not exists idx_questions_project_id on public.questions(project_id);
create index if not exists idx_vendor_meetings_project_id on public.vendor_meetings(project_id);
create index if not exists idx_comments_entity on public.comments(project_id, entity_type, entity_id);
create index if not exists idx_project_members_project_id on public.project_members(project_id);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_share_links_token on public.share_links(token);
create index if not exists idx_activity_log_project on public.activity_log(project_id, created_at desc);
create index if not exists idx_notifications_user on public.notifications(user_id, read);
create index if not exists idx_stores_user_id on public.stores(user_id);

-- =============================================================================
-- TRIGGERY updated_at (DROP IF EXISTS + CREATE)
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'projects','rooms','budget_scenarios','budget_items','tasks','products',
    'decisions','decision_approvals','vendors','inspirations','designer_brief_room_notes',
    'project_plans','plan_differences','documents','schedule_items','payments',
    'punch_list_items','progress_photos','measurements','room_technical_details',
    'checklists','questions','vendor_meetings','vendor_scope_items','comments',
    'project_constraints','alternatives','stores','user_product_library','pending_invitations'
  ] loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%s', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%s for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'projects','rooms','budget_scenarios','budget_items','tasks','task_dependencies',
    'products','decisions','decision_approvals','vendors','inspirations',
    'designer_brief_room_notes','project_plans','plan_differences','documents',
    'schedule_items','payments','punch_list_items','progress_photos','measurements',
    'room_technical_details','checklist_templates','checklists','checklist_items',
    'questions','vendor_meetings','vendor_scope_items','comments','project_members',
    'share_links','activity_log','notifications','project_constraints','alternatives',
    'stores','user_product_library','pinterest_connections','pinterest_boards','pending_invitations'
  ] loop
    execute format('alter table public.%s enable row level security', t);
  end loop;
end $$;

-- Usuń istniejące polityki i odtwórz (idempotentne)
do $$ begin
  drop policy if exists "owner access projects" on public.projects;
  create policy "owner access projects" on public.projects for all
    using (owner_id = auth.uid()) with check (owner_id = auth.uid());

  drop policy if exists "owner manages members" on public.project_members;
  create policy "owner manages members" on public.project_members for all
    using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
  drop policy if exists "member sees own membership" on public.project_members;
  create policy "member sees own membership" on public.project_members for select
    using (user_id = auth.uid());

  drop policy if exists "project access rooms" on public.rooms;
  create policy "project access rooms" on public.rooms for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access budget_scenarios" on public.budget_scenarios;
  create policy "project access budget_scenarios" on public.budget_scenarios for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access budget_items" on public.budget_items;
  create policy "project access budget_items" on public.budget_items for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access tasks" on public.tasks;
  create policy "project access tasks" on public.tasks for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access task_dependencies" on public.task_dependencies;
  create policy "project access task_dependencies" on public.task_dependencies for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access products" on public.products;
  create policy "project access products" on public.products for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access decisions" on public.decisions;
  create policy "project access decisions" on public.decisions for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access decision_approvals" on public.decision_approvals;
  create policy "project access decision_approvals" on public.decision_approvals for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access vendors" on public.vendors;
  create policy "project access vendors" on public.vendors for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access inspirations" on public.inspirations;
  create policy "project access inspirations" on public.inspirations for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access designer_brief_room_notes" on public.designer_brief_room_notes;
  create policy "project access designer_brief_room_notes" on public.designer_brief_room_notes for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access project_plans" on public.project_plans;
  create policy "project access project_plans" on public.project_plans for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access plan_differences" on public.plan_differences;
  create policy "project access plan_differences" on public.plan_differences for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access documents" on public.documents;
  create policy "project access documents" on public.documents for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access schedule_items" on public.schedule_items;
  create policy "project access schedule_items" on public.schedule_items for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access payments" on public.payments;
  create policy "project access payments" on public.payments for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access punch_list_items" on public.punch_list_items;
  create policy "project access punch_list_items" on public.punch_list_items for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access progress_photos" on public.progress_photos;
  create policy "project access progress_photos" on public.progress_photos for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access measurements" on public.measurements;
  create policy "project access measurements" on public.measurements for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access room_technical_details" on public.room_technical_details;
  create policy "project access room_technical_details" on public.room_technical_details for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access checklists" on public.checklists;
  create policy "project access checklists" on public.checklists for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access checklist_items" on public.checklist_items;
  create policy "project access checklist_items" on public.checklist_items for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access questions" on public.questions;
  create policy "project access questions" on public.questions for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access vendor_meetings" on public.vendor_meetings;
  create policy "project access vendor_meetings" on public.vendor_meetings for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access vendor_scope_items" on public.vendor_scope_items;
  create policy "project access vendor_scope_items" on public.vendor_scope_items for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access activity_log" on public.activity_log;
  create policy "project access activity_log" on public.activity_log for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access project_constraints" on public.project_constraints;
  create policy "project access project_constraints" on public.project_constraints for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "project access alternatives" on public.alternatives;
  create policy "project access alternatives" on public.alternatives for all
    using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

  drop policy if exists "read comments" on public.comments;
  create policy "read comments" on public.comments for select using (public.has_project_access(project_id));
  drop policy if exists "create own comments" on public.comments;
  create policy "create own comments" on public.comments for insert
    with check (created_by = auth.uid() and public.has_project_access(project_id));
  drop policy if exists "delete own comments" on public.comments;
  create policy "delete own comments" on public.comments for delete using (created_by = auth.uid());

  drop policy if exists "user notifications" on public.notifications;
  create policy "user notifications" on public.notifications for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists "public read share_links" on public.share_links;
  create policy "public read share_links" on public.share_links for select using (true);
  drop policy if exists "owner manages share_links" on public.share_links;
  create policy "owner manages share_links" on public.share_links for insert
    with check (public.is_project_owner(project_id));
  drop policy if exists "owner deletes share_links" on public.share_links;
  create policy "owner deletes share_links" on public.share_links for delete
    using (public.is_project_owner(project_id));

  drop policy if exists "user owns stores" on public.stores;
  create policy "user owns stores" on public.stores for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists "user owns product library" on public.user_product_library;
  create policy "user owns product library" on public.user_product_library for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists "user owns pinterest connections" on public.pinterest_connections;
  create policy "user owns pinterest connections" on public.pinterest_connections for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists "user owns pinterest boards" on public.pinterest_boards;
  create policy "user owns pinterest boards" on public.pinterest_boards for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());

  drop policy if exists "public read templates" on public.checklist_templates;
  create policy "public read templates" on public.checklist_templates for select using (true);

  drop policy if exists "owner manages invitations" on public.pending_invitations;
  create policy "owner manages invitations" on public.pending_invitations for all
    using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
end $$;

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('inspirations', 'inspirations', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('plans', 'plans', false, 20971520, array['image/jpeg','image/png','image/webp']),
  ('documents', 'documents', false, 52428800, null),
  ('progress-photos', 'progress-photos', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('punch-list', 'punch-list', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  drop policy if exists "user read own objects" on storage.objects;
  create policy "user read own objects" on storage.objects for select
    using (
      bucket_id in ('inspirations','plans','documents','progress-photos','punch-list')
      and (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    );

  drop policy if exists "user insert own objects" on storage.objects;
  create policy "user insert own objects" on storage.objects for insert
    with check (
      bucket_id in ('inspirations','plans','documents','progress-photos','punch-list')
      and (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    );

  drop policy if exists "user update own objects" on storage.objects;
  create policy "user update own objects" on storage.objects for update
    using (
      bucket_id in ('inspirations','plans','documents','progress-photos','punch-list')
      and (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    );

  drop policy if exists "user delete own objects" on storage.objects;
  create policy "user delete own objects" on storage.objects for delete
    using (
      bucket_id in ('inspirations','plans','documents','progress-photos','punch-list')
      and (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    );
end $$;

-- =============================================================================
-- DANE STARTOWE — szablony checklisty
-- =============================================================================

insert into public.checklist_templates (name, items) values
  ('Łazienka', '["Płytki ścienne","Płytki podłogowe","Armatura","WC","Wanna/prysznic","Lustro","Oświetlenie","Wentylacja","Grzejnik drabinkowy"]'),
  ('Kuchnia', '["Meble na wymiar","AGD","Blat roboczy","Zlew","Bateria","Płytki/tapeta","Oświetlenie pod szafkami","Gniazdka i włączniki"]'),
  ('Salon', '["Podłoga","Malowanie ścian","Oświetlenie główne","Oświetlenie dodatkowe","Gniazdka","Antena/TV","Listwy przypodłogowe"]'),
  ('Sypialnia', '["Podłoga","Malowanie","Oświetlenie","Szafa/zabudowa","Gniazdka przy łóżku","Rolety/zasłony"]'),
  ('Przedpokój', '["Podłoga","Malowanie","Oświetlenie","Szafka wejściowa","Wieszak","Lustro","Domofon"]'),
  ('Odbiór prac', '["Sprawdź podłogi — brak zarysowań","Sprawdź płytki — brak pęknięć","Sprawdź malowanie — równomierność","Przetestuj gniazdka","Przetestuj oświetlenie","Sprawdź hydraulikę — brak przecieków","Sprawdź drzwi — domykanie","Sprawdź okna — uszczelki"]'),
  ('Zakupy przed startem', '["Dokumentacja projektowa","Pomiary wszystkich pomieszczeń","Wybór materiałów","Zamówienie płytek z zapasem","Zamówienie podłogi","Wybór wykonawców","Harmonogram prac"]')
on conflict do nothing;

-- =============================================================================
-- Przeładuj cache schema PostgREST
-- =============================================================================
notify pgrst, 'reload schema';
