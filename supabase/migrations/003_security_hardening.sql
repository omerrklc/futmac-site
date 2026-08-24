-- FUTMAC üretim güvenliği ve işlem kaydı
-- 001_initial.sql ve 002_league_management.sql sonrasında çalıştırın.

-- Tarayıcı istemcilerinin sahiplik alanlarını değiştirmesini engeller.
create or replace function public.protect_article_metadata()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' and auth.uid() is not null then
    new.created_by = auth.uid();
    new.updated_by = auth.uid();
  elsif tg_op = 'UPDATE' then
    new.id = old.id;
    new.created_by = old.created_by;
    if auth.uid() is not null then new.updated_by = auth.uid(); end if;
  end if;
  return new;
end;
$$;

revoke all on function public.protect_article_metadata() from public;
drop trigger if exists articles_protect_metadata on public.articles;
create trigger articles_protect_metadata
before insert or update on public.articles
for each row execute function public.protect_article_metadata();

-- Son admin hem rol güncellemesiyle hem de hesap silmeyle kaybedilemez.
create or replace function public.protect_last_admin()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if old.role = 'admin' and (select count(*) from public.profiles where role = 'admin') <= 1 then
      raise exception 'last_admin_required';
    end if;
    return old;
  end if;
  if old.role = 'admin' and new.role <> 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'last_admin_required';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_last_admin() from public;
drop trigger if exists profiles_protect_last_admin on public.profiles;
create trigger profiles_protect_last_admin
before update of role on public.profiles
for each row execute function public.protect_last_admin();
drop trigger if exists profiles_protect_last_admin_delete on public.profiles;
create trigger profiles_protect_last_admin_delete
before delete on public.profiles
for each row execute function public.protect_last_admin();

-- Yönetim panelindeki değişiklikler için salt okunur denetim günlüğü.
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  actor_role text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  record_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id, created_at desc);

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  new_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  source_row jsonb := coalesce(new_row, old_row);
begin
  insert into public.audit_log (actor_id, actor_name, actor_role, action, table_name, record_id, details)
  values (
    auth.uid(),
    (select display_name from public.profiles where id = auth.uid()),
    (select role from public.profiles where id = auth.uid()),
    tg_op,
    tg_table_name,
    coalesce(source_row ->> 'id', source_row ->> 'slug', source_row ->> 'team_id'),
    jsonb_strip_nulls(jsonb_build_object(
      'old', case when old_row is null then null else old_row - array['body']::text[] end,
      'new', case when new_row is null then null else new_row - array['body']::text[] end
    ))
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.write_audit_log() from public;

do $$
declare
  table_item text;
begin
  foreach table_item in array array['articles','categories','authors','league_teams','standings','fixtures','profiles'] loop
    execute format('drop trigger if exists zz_audit_%I on public.%I', table_item, table_item);
    execute format('create trigger zz_audit_%I after insert or update or delete on public.%I for each row execute function public.write_audit_log()', table_item, table_item);
  end loop;
end;
$$;

alter table public.audit_log enable row level security;
drop policy if exists audit_log_admin_read on public.audit_log;
create policy audit_log_admin_read on public.audit_log
for select to authenticated using (public.is_admin());

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

-- Yayınlanmış haberlerde iç kullanıcı kimlikleri REST yanıtına açılmaz.
revoke select on public.articles from anon, authenticated;
grant select (
  id, slug, content_type, category_slug, title, excerpt, body,
  author_name, author_slug, image_url, image_alt, status, read_time,
  published_at, created_at, updated_at
) on public.articles to anon, authenticated;

-- Storage tarafında da tarayıcıdaki 5 MB ve MIME sınırları uygulanır.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
where id = 'futmac-media';

drop policy if exists futmac_media_editor_update on storage.objects;
create policy futmac_media_editor_update on storage.objects for update to authenticated
using (
  bucket_id = 'futmac-media'
  and public.is_editor()
  and (storage.foldername(name))[1] in ('articles', 'authors', 'teams')
  and (owner_id = auth.uid()::text or public.is_admin())
)
with check (
  bucket_id = 'futmac-media'
  and public.is_editor()
  and (storage.foldername(name))[1] in ('articles', 'authors', 'teams')
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and (owner_id = auth.uid()::text or public.is_admin())
);

drop policy if exists futmac_media_editor_delete on storage.objects;
create policy futmac_media_editor_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'futmac-media'
  and public.is_editor()
  and (storage.foldername(name))[1] in ('articles', 'authors', 'teams')
  and (owner_id = auth.uid()::text or public.is_admin())
);
