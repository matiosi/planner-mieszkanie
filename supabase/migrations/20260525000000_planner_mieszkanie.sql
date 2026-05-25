-- =============================================================================
-- Planner Mieszkanie — pełna migracja bazy danych
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- ENUMS
-- =============================================================================

create type project_stage as enum ('PLANNING','CONCEPT','QUOTES','IN_PROGRESS','FINISHING','DONE');
create type room_status as enum ('NOT_STARTED','CONCEPT','PRICING','ORDERING','IN_PROGRESS','DONE');
create type budget_category as enum ('CONSTRUCTION_WORKS','ELECTRICAL','PLUMBING','BATHROOM','KITCHEN','FLOORING','DOORS','LIGHTING','FURNITURE','APPLIANCES','DECORATION','RESERVE','OTHER');
create type budget_status as enum ('PLANNED','QUOTED','ORDERED','PAID','CANCELLED');
create type task_status as enum ('TODO','IN_PROGRESS','DONE','BLOCKED');
create type priority as enum ('LOW','MEDIUM','HIGH','URGENT');
create type product_status as enum ('FOUND','SHORTLISTED','SELECTED','ORDERED','DELIVERED','INSTALLED','RETURNED');
create type delivery_status as enum ('NOT_ORDERED','ORDERED','SHIPPED','DELIVERED','DELAYED','RETURNED');
create type decision_status as enum ('NOT_STARTED','RESEARCH','SHORTLIST','DECIDED');
create type approval_status as enum ('PENDING','APPROVED','REJECTED');
create type vendor_status as enum ('CONTACTED','QUOTED','SELECTED','REJECTED');
create type vendor_type as enum ('GENERAL_CONTRACTOR','ELECTRICIAN','PLUMBER','CARPENTER','PAINTER','TILER','DESIGNER','OTHER');
create type inspiration_source as enum ('UPLOAD','URL','PINTEREST');
create type plan_type as enum ('ORIGINAL','DESIGNER');
create type plan_difference_status as enum ('ACCEPTED','NEEDS_DISCUSSION','REJECTED');
create type document_type as enum ('INVOICE','RECEIPT','WARRANTY','CONTRACT','OFFER','TECHNICAL_DRAWING','PROTOCOL','DELIVERY_NOTE','OTHER');
create type schedule_status as enum ('PLANNED','IN_PROGRESS','DONE','DELAYED','CANCELLED');
create type payment_status as enum ('PLANNED','DUE','PAID','OVERDUE','CANCELLED');
create type punch_list_severity as enum ('LOW','MEDIUM','HIGH','CRITICAL');
create type punch_list_status as enum ('NEW','REPORTED','IN_PROGRESS','FIXED','ACCEPTED');
create type question_status as enum ('OPEN','ANSWERED','NEEDS_FOLLOW_UP','CLOSED');
create type member_role as enum ('OWNER','EDITOR','VIEWER','DESIGNER','CONTRACTOR');
create type share_scope as enum ('WHOLE_PROJECT','SELECTED_ROOMS','INSPIRATIONS_ONLY','PLANS_ONLY','PLAN_COMPARISON','DESIGNER_BRIEFS','CONTRACTOR_PACKAGE');
create type constraint_type as enum ('DISLIKE','MUST_HAVE','AVOID','TECHNICAL_CONSTRAINT','BUDGET_CONSTRAINT');
create type notification_type as enum ('TASK_DUE_SOON','TASK_OVERDUE','BUDGET_EXCEEDED','DECISION_OPEN','DECISION_APPROVAL_PENDING','WARRANTY_EXPIRING','SCHEDULE_DELAYED','PUNCH_LIST_ITEM_DUE','DELIVERY_LATE','COMMENT_ADDED','PAYMENT_DUE','PAYMENT_OVERDUE','QUESTION_DUE');

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

create or replace function public.is_project_owner(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.projects where id = pid and owner_id = auth.uid());
$$;

create or replace function public.has_project_access(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.projects where id = pid and owner_id = auth.uid()
    union all
    select 1 from public.project_members where project_id = pid and user_id = auth.uid()
  );
$$;

-- =============================================================================
-- TABELE CORE
-- =============================================================================

create table public.projects (
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

create table public.rooms (
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

create table public.budget_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budget_items (
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

create table public.tasks (
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

create table public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  blocked_by_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(task_id, blocked_by_task_id)
);

create table public.products (
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

create table public.decisions (
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

create table public.decision_approvals (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  status approval_status not null default 'PENDING',
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

-- =============================================================================
-- TABELE OPERACYJNE
-- =============================================================================

create table public.documents (
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

create table public.schedule_items (
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

create table public.payments (
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

create table public.punch_list_items (
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

create table public.progress_photos (
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

create table public.measurements (
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

create table public.room_technical_details (
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

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  items jsonb not null default '[]'
);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.questions (
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

create table public.vendor_meetings (
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

create table public.vendor_scope_items (
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

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  body text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role member_role not null default 'VIEWER',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  scope share_scope not null default 'WHOLE_PROJECT',
  room_ids uuid[],
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
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

create table public.project_constraints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  type constraint_type not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alternatives (
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

create table public.stores (
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

create table public.user_product_library (
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

create table public.pinterest_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table public.pinterest_boards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id text not null,
  board_name text not null,
  room_id uuid references public.rooms(id) on delete set null,
  imported_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- INDEKSY
-- =============================================================================

create index on public.projects(owner_id);
create index on public.rooms(project_id);
create index on public.rooms(project_id, sort_order);
create index on public.budget_scenarios(project_id);
create index on public.budget_items(project_id);
create index on public.budget_items(room_id);
create index on public.budget_items(scenario_id);
create index on public.tasks(project_id);
create index on public.tasks(project_id, status);
create index on public.task_dependencies(task_id);
create index on public.task_dependencies(blocked_by_task_id);
create index on public.task_dependencies(project_id);
create index on public.products(project_id);
create index on public.products(project_id, delivery_status);
create index on public.decisions(project_id);
create index on public.decision_approvals(decision_id);
create index on public.vendors(project_id);
create index on public.inspirations(project_id);
create index on public.inspirations(project_id, selected_for_designer);
create index on public.project_plans(project_id);
create index on public.plan_differences(project_id);
create index on public.documents(project_id);
create index on public.schedule_items(project_id);
create index on public.payments(project_id);
create index on public.payments(project_id, status);
create index on public.punch_list_items(project_id);
create index on public.progress_photos(project_id);
create index on public.measurements(project_id);
create index on public.questions(project_id);
create index on public.vendor_meetings(project_id);
create index on public.comments(project_id, entity_type, entity_id);
create index on public.project_members(project_id);
create index on public.project_members(user_id);
create index on public.share_links(token);
create index on public.activity_log(project_id, created_at desc);
create index on public.notifications(user_id, read);
create index on public.stores(user_id);
create index on public.user_product_library(user_id);

-- =============================================================================
-- TRIGGERY updated_at
-- =============================================================================

create trigger trg_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger trg_rooms_updated_at before update on public.rooms for each row execute function public.set_updated_at();
create trigger trg_budget_scenarios_updated_at before update on public.budget_scenarios for each row execute function public.set_updated_at();
create trigger trg_budget_items_updated_at before update on public.budget_items for each row execute function public.set_updated_at();
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger trg_products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger trg_decisions_updated_at before update on public.decisions for each row execute function public.set_updated_at();
create trigger trg_decision_approvals_updated_at before update on public.decision_approvals for each row execute function public.set_updated_at();
create trigger trg_vendors_updated_at before update on public.vendors for each row execute function public.set_updated_at();
create trigger trg_inspirations_updated_at before update on public.inspirations for each row execute function public.set_updated_at();
create trigger trg_designer_brief_room_notes_updated_at before update on public.designer_brief_room_notes for each row execute function public.set_updated_at();
create trigger trg_project_plans_updated_at before update on public.project_plans for each row execute function public.set_updated_at();
create trigger trg_plan_differences_updated_at before update on public.plan_differences for each row execute function public.set_updated_at();
create trigger trg_documents_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger trg_schedule_items_updated_at before update on public.schedule_items for each row execute function public.set_updated_at();
create trigger trg_payments_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger trg_punch_list_items_updated_at before update on public.punch_list_items for each row execute function public.set_updated_at();
create trigger trg_progress_photos_updated_at before update on public.progress_photos for each row execute function public.set_updated_at();
create trigger trg_measurements_updated_at before update on public.measurements for each row execute function public.set_updated_at();
create trigger trg_room_technical_details_updated_at before update on public.room_technical_details for each row execute function public.set_updated_at();
create trigger trg_checklists_updated_at before update on public.checklists for each row execute function public.set_updated_at();
create trigger trg_questions_updated_at before update on public.questions for each row execute function public.set_updated_at();
create trigger trg_vendor_meetings_updated_at before update on public.vendor_meetings for each row execute function public.set_updated_at();
create trigger trg_vendor_scope_items_updated_at before update on public.vendor_scope_items for each row execute function public.set_updated_at();
create trigger trg_comments_updated_at before update on public.comments for each row execute function public.set_updated_at();
create trigger trg_project_constraints_updated_at before update on public.project_constraints for each row execute function public.set_updated_at();
create trigger trg_alternatives_updated_at before update on public.alternatives for each row execute function public.set_updated_at();
create trigger trg_stores_updated_at before update on public.stores for each row execute function public.set_updated_at();
create trigger trg_user_product_library_updated_at before update on public.user_product_library for each row execute function public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.projects enable row level security;
alter table public.rooms enable row level security;
alter table public.budget_scenarios enable row level security;
alter table public.budget_items enable row level security;
alter table public.tasks enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.products enable row level security;
alter table public.decisions enable row level security;
alter table public.decision_approvals enable row level security;
alter table public.vendors enable row level security;
alter table public.inspirations enable row level security;
alter table public.designer_brief_room_notes enable row level security;
alter table public.project_plans enable row level security;
alter table public.plan_differences enable row level security;
alter table public.documents enable row level security;
alter table public.schedule_items enable row level security;
alter table public.payments enable row level security;
alter table public.punch_list_items enable row level security;
alter table public.progress_photos enable row level security;
alter table public.measurements enable row level security;
alter table public.room_technical_details enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.questions enable row level security;
alter table public.vendor_meetings enable row level security;
alter table public.vendor_scope_items enable row level security;
alter table public.comments enable row level security;
alter table public.project_members enable row level security;
alter table public.share_links enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;
alter table public.project_constraints enable row level security;
alter table public.alternatives enable row level security;
alter table public.stores enable row level security;
alter table public.user_product_library enable row level security;
alter table public.pinterest_connections enable row level security;
alter table public.pinterest_boards enable row level security;

-- projects
create policy "owner access projects" on public.projects for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- project_members
create policy "owner manages members" on public.project_members for all
  using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy "member sees own membership" on public.project_members for select
  using (user_id = auth.uid());

-- tabele z has_project_access (read) + is_project_owner (write)
create policy "project access rooms" on public.rooms for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access budget_scenarios" on public.budget_scenarios for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access budget_items" on public.budget_items for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access tasks" on public.tasks for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access task_dependencies" on public.task_dependencies for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access products" on public.products for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access decisions" on public.decisions for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access decision_approvals" on public.decision_approvals for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access vendors" on public.vendors for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access inspirations" on public.inspirations for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access designer_brief_room_notes" on public.designer_brief_room_notes for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access project_plans" on public.project_plans for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access plan_differences" on public.plan_differences for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access documents" on public.documents for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access schedule_items" on public.schedule_items for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access payments" on public.payments for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access punch_list_items" on public.punch_list_items for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access progress_photos" on public.progress_photos for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access measurements" on public.measurements for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access room_technical_details" on public.room_technical_details for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access checklists" on public.checklists for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access checklist_items" on public.checklist_items for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access questions" on public.questions for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access vendor_meetings" on public.vendor_meetings for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access vendor_scope_items" on public.vendor_scope_items for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access activity_log" on public.activity_log for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access project_constraints" on public.project_constraints for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));
create policy "project access alternatives" on public.alternatives for all
  using (public.has_project_access(project_id)) with check (public.is_project_owner(project_id));

-- comments: read wszyscy z dostępem, write tylko właściciel
create policy "read comments" on public.comments for select using (public.has_project_access(project_id));
create policy "create own comments" on public.comments for insert
  with check (created_by = auth.uid() and public.has_project_access(project_id));
create policy "delete own comments" on public.comments for delete using (created_by = auth.uid());

-- notifications: tylko właściciel
create policy "user notifications" on public.notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- share_links: select bez ograniczeń (przez token), manage tylko owner
create policy "public read share_links" on public.share_links for select using (true);
create policy "owner manages share_links" on public.share_links for insert
  with check (public.is_project_owner(project_id));
create policy "owner deletes share_links" on public.share_links for delete
  using (public.is_project_owner(project_id));

-- tabele globalne (user_id = auth.uid())
create policy "user owns stores" on public.stores for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user owns product library" on public.user_product_library for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user owns pinterest connections" on public.pinterest_connections for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "user owns pinterest boards" on public.pinterest_boards for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- checklist_templates: publiczne tylko do odczytu
create policy "public read templates" on public.checklist_templates for select using (true);

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

-- Storage policies: users/{auth.uid()}/...
create policy "user read own objects" on storage.objects for select
  using (
    bucket_id in ('inspirations','plans','documents','progress-photos','punch-list')
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "user insert own objects" on storage.objects for insert
  with check (
    bucket_id in ('inspirations','plans','documents','progress-photos','punch-list')
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "user update own objects" on storage.objects for update
  using (
    bucket_id in ('inspirations','plans','documents','progress-photos','punch-list')
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "user delete own objects" on storage.objects for delete
  using (
    bucket_id in ('inspirations','plans','documents','progress-photos','punch-list')
    and (storage.foldername(name))[1] = 'users'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

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
  ('Zakupy przed startem', '["Dokumentacja projektowa","Pomiary wszystkich pomieszczeń","Wybór materiałów","Zamówienie płytek z zapasem","Zamówienie podłogi","Wybór wykonawców","Harmonogram prac"]');
