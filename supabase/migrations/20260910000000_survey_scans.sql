create table if not exists public.survey_scans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  title text not null default 'Ankieta',
  storage_bucket text not null default 'survey-scans',
  storage_path text not null,
  mime_type text,
  original_file_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_survey_scans_project_room
  on public.survey_scans(project_id, room_id, created_at);

alter table public.survey_scans enable row level security;

drop policy if exists "project access survey scans" on public.survey_scans;
create policy "project access survey scans" on public.survey_scans for all
  using (public.has_project_access(project_id))
  with check (public.can_design_project(project_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('survey-scans', 'survey-scans', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  drop policy if exists "user read own objects" on storage.objects;
  create policy "user read own objects" on storage.objects for select
    using (
      bucket_id in ('inspirations','plans','documents','progress-photos','punch-list','survey-scans')
      and (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    );

  drop policy if exists "user insert own objects" on storage.objects;
  create policy "user insert own objects" on storage.objects for insert
    with check (
      bucket_id in ('inspirations','plans','documents','progress-photos','punch-list','survey-scans')
      and (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    );

  drop policy if exists "user update own objects" on storage.objects;
  create policy "user update own objects" on storage.objects for update
    using (
      bucket_id in ('inspirations','plans','documents','progress-photos','punch-list','survey-scans')
      and (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    );

  drop policy if exists "user delete own objects" on storage.objects;
  create policy "user delete own objects" on storage.objects for delete
    using (
      bucket_id in ('inspirations','plans','documents','progress-photos','punch-list','survey-scans')
      and (storage.foldername(name))[1] = 'users'
      and (storage.foldername(name))[2] = auth.uid()::text
    );
end $$;
