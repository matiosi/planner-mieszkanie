do $$
begin
  if to_regclass('public.notifications') is not null then
    alter table public.notifications
      add column if not exists ignored_at timestamptz;
  end if;
end $$;

do $$
begin
  if to_regclass('public.notifications') is not null then
    create index if not exists idx_notifications_project_user_ignored
      on public.notifications(project_id, user_id, ignored_at, created_at desc);
  end if;
end $$;
