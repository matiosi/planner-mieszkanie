create extension if not exists pgcrypto;

alter table public.pending_invitations
  add column if not exists expires_at timestamptz not null default (now() + interval '14 days');

alter table public.share_links
  alter column token set default encode(extensions.gen_random_bytes(32), 'hex');

alter table public.pending_invitations
  alter column token set default encode(extensions.gen_random_bytes(32), 'hex');

alter table public.punch_list_items
  add column if not exists acceptance_phase text not null default 'FINAL',
  add column if not exists photo_bucket text,
  add column if not exists photo_path text;

alter table public.vendor_scope_items
  add column if not exists price_note text;

create index if not exists idx_pending_invitations_token_expires
  on public.pending_invitations(token, expires_at);

create index if not exists idx_notifications_project_user_read
  on public.notifications(project_id, user_id, read, created_at desc);

create index if not exists idx_vendor_scope_items_vendor
  on public.vendor_scope_items(project_id, vendor_id);

create unique index if not exists idx_decision_approvals_decision_unique
  on public.decision_approvals(decision_id);

create or replace function public.project_role(pid uuid)
returns member_role language sql stable security definer set search_path = public as $$
  select case
    when exists(select 1 from public.projects where id = pid and owner_id = auth.uid()) then 'OWNER'::member_role
    else (
      select role from public.project_members
      where project_id = pid and user_id = auth.uid()
      limit 1
    )
  end;
$$;

create or replace function public.can_write_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.project_role(pid) in ('OWNER','EDITOR'), false);
$$;

create or replace function public.can_design_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.project_role(pid) in ('OWNER','EDITOR','DESIGNER'), false);
$$;

drop policy if exists "member read projects" on public.projects;
create policy "member read projects" on public.projects for select
  using (public.has_project_access(id));

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'rooms','budget_scenarios','budget_items','tasks','task_dependencies','products',
    'payments','schedule_items','vendors','vendor_meetings','vendor_scope_items',
    'punch_list_items','progress_photos','measurements','room_technical_details',
    'checklists','checklist_items','questions','project_constraints','alternatives',
    'project_plans','plan_differences'
  ] loop
    execute format('drop policy if exists "project access %s" on public.%I', tbl, tbl);
    execute format(
      'create policy "project access %s" on public.%I for all using (public.has_project_access(project_id)) with check (public.can_write_project(project_id))',
      tbl,
      tbl
    );
  end loop;
end $$;

drop policy if exists "project access inspirations" on public.inspirations;
create policy "project access inspirations" on public.inspirations for all
  using (public.has_project_access(project_id))
  with check (public.can_design_project(project_id));

drop policy if exists "project access designer_brief_room_notes" on public.designer_brief_room_notes;
create policy "project access designer_brief_room_notes" on public.designer_brief_room_notes for all
  using (public.has_project_access(project_id))
  with check (public.can_design_project(project_id));

drop policy if exists "project access decisions" on public.decisions;
create policy "project access decisions" on public.decisions for all
  using (public.has_project_access(project_id))
  with check (public.can_design_project(project_id));

drop policy if exists "project access decision_approvals" on public.decision_approvals;
create policy "project access decision_approvals" on public.decision_approvals for all
  using (public.has_project_access(project_id))
  with check (public.project_role(project_id) in ('OWNER','EDITOR','DESIGNER'));

drop policy if exists "project access activity_log" on public.activity_log;
create policy "project access activity_log" on public.activity_log for all
  using (public.has_project_access(project_id))
  with check (public.has_project_access(project_id));

drop policy if exists "user notifications" on public.notifications;
create policy "user notifications" on public.notifications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.has_project_access(project_id));

create or replace function public.get_share_package(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  link record;
  result jsonb;
begin
  select * into link
  from public.share_links
  where token = p_token
    and (expires_at is null or expires_at > now())
  limit 1;

  if link.id is null then
    return null;
  end if;

  select jsonb_build_object(
    'scope', link.scope,
    'expires_at', link.expires_at,
    'project', (
      select to_jsonb(p) from (
        select id, name, area, target_budget, style, stage, description, contingency_percent
        from public.projects where id = link.project_id
      ) p
    ),
    'rooms', coalesce((
      select jsonb_agg(to_jsonb(r) order by r.sort_order)
      from (
        select id, name, area, status, concept_description, notes, budget_planned, sort_order
        from public.rooms
        where project_id = link.project_id
          and (
            link.scope <> 'SELECTED_ROOMS'
            or link.room_ids is null
            or id = any(link.room_ids)
          )
      ) r
    ), '[]'::jsonb),
    'technical', coalesce((
      select jsonb_agg(to_jsonb(t))
      from (
        select room_id, ceiling_height, flooring_area, wall_area, skirting_length,
          number_of_light_points, number_of_sockets, window_dimensions, door_dimensions, notes
        from public.room_technical_details
        where project_id = link.project_id
      ) t
    ), '[]'::jsonb),
    'inspirations', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.created_at desc)
      from (
        select id, room_id, title, description, category, external_url, designer_note, selected_for_designer
        from public.inspirations
        where project_id = link.project_id
          and (
            link.scope in ('WHOLE_PROJECT','SELECTED_ROOMS','INSPIRATIONS_ONLY','DESIGNER_BRIEFS')
          )
          and (
            link.scope <> 'DESIGNER_BRIEFS' or selected_for_designer = true
          )
      ) i
    ), '[]'::jsonb),
    'plans', coalesce((
      select jsonb_agg(to_jsonb(pp) order by pp.created_at desc)
      from (
        select id, plan_type, title, mime_type, original_file_name, version_label, is_current
        from public.project_plans
        where project_id = link.project_id
          and link.scope in ('WHOLE_PROJECT','SELECTED_ROOMS','PLANS_ONLY','PLAN_COMPARISON','CONTRACTOR_PACKAGE')
      ) pp
    ), '[]'::jsonb),
    'punch_list', coalesce((
      select jsonb_agg(to_jsonb(pl) order by pl.created_at desc)
      from (
        select id, room_id, vendor_id, title, description, severity, status, due_date, notes, acceptance_phase
        from public.punch_list_items
        where project_id = link.project_id
          and link.scope in ('WHOLE_PROJECT','SELECTED_ROOMS','CONTRACTOR_PACKAGE')
      ) pl
    ), '[]'::jsonb),
    'vendor_scope', coalesce((
      select jsonb_agg(to_jsonb(vs) order by vs.created_at desc)
      from (
        select id, vendor_id, room_id, title, description, included, price_included, price_note, notes
        from public.vendor_scope_items
        where project_id = link.project_id
          and link.scope in ('WHOLE_PROJECT','CONTRACTOR_PACKAGE')
      ) vs
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;
