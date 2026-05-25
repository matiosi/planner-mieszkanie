-- Helper RPC do wyszukiwania usera po emailu (bezpieczne — zwraca tylko UUID)
create or replace function public.get_user_id_by_email(p_email text)
returns uuid language sql security definer set search_path = auth, public as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
