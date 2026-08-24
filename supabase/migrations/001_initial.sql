-- FUTMAC / E-Mac Turka başlangıç veritabanı
-- Supabase SQL Editor içinde bir kez çalıştırın.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Yönetici' check (char_length(display_name) between 2 and 80),
  role text not null default 'viewer' check (role in ('viewer', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  content_type text not null default 'haber' check (content_type in ('haber', 'yazi')),
  category_slug text not null references public.categories(slug),
  title text not null check (char_length(title) between 3 and 120),
  excerpt text not null check (char_length(excerpt) between 3 and 280),
  body text not null check (char_length(body) between 20 and 20000),
  author_name text not null default 'FUTMAC Servisi' check (char_length(author_name) between 2 and 80),
  author_slug text,
  image_url text not null default 'assets/images/futbol-manset.svg' check (char_length(image_url) <= 1000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  read_time text not null default '3 dk' check (char_length(read_time) <= 12),
  published_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_article_has_date check (status <> 'published' or published_at is not null)
);

create index if not exists articles_public_feed_idx on public.articles (status, published_at desc);
create index if not exists articles_category_idx on public.articles (category_slug, published_at desc);

insert into public.categories (slug, name, description) values
  ('futbol', 'Futbol', 'Sahadan haberler'),
  ('emac', 'E-Mac Ligi', 'Ligin nabzı'),
  ('fantazi', 'Fantazi', 'Kadro rehberi'),
  ('transfer', 'Transfer', 'Son hamleler'),
  ('yazarlar', 'Köşe Yazıları', 'FUTMAC yazarları'),
  ('macaton', 'Macaton', 'Haftanın programı'),
  ('haftanin11', 'Haftanın 11’i', 'Editörün seçimi'),
  ('oduller', 'Ödüller', 'Ödül dosyası')
on conflict (slug) do update set name = excluded.name, description = excluded.description;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  if tg_table_name = 'articles' then new.updated_by = auth.uid(); end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)), 'viewer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role in ('editor', 'admin'));
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_editor() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select to anon, authenticated using (is_active or public.is_editor());
drop policy if exists categories_editor_write on public.categories;
create policy categories_editor_write on public.categories for all to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists articles_public_read on public.articles;
create policy articles_public_read on public.articles for select to anon, authenticated
using ((status = 'published' and published_at <= now()) or public.is_editor());
drop policy if exists articles_editor_insert on public.articles;
create policy articles_editor_insert on public.articles for insert to authenticated with check (public.is_editor() and created_by = auth.uid());
drop policy if exists articles_editor_update on public.articles;
create policy articles_editor_update on public.articles for update to authenticated
using (public.is_admin() or (public.is_editor() and created_by = auth.uid()))
with check (public.is_admin() or (public.is_editor() and created_by = auth.uid()));
drop policy if exists articles_editor_delete on public.articles;
create policy articles_editor_delete on public.articles for delete to authenticated
using (public.is_admin() or (public.is_editor() and created_by = auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.articles to anon, authenticated;
grant insert, update, delete on public.categories, public.articles to authenticated;
grant select, update on public.profiles to authenticated;

-- Önce Supabase Storage ekranından PUBLIC türünde `futmac-media` bucket'ı oluşturun.
-- Ardından aşağıdaki politikalar yalnızca editör/admin hesapların yükleme yapmasını sağlar.
drop policy if exists futmac_media_public_read on storage.objects;
create policy futmac_media_public_read on storage.objects for select to public using (bucket_id = 'futmac-media');
drop policy if exists futmac_media_editor_insert on storage.objects;
create policy futmac_media_editor_insert on storage.objects for insert to authenticated
with check (bucket_id = 'futmac-media' and public.is_editor() and (storage.foldername(name))[1] in ('articles', 'authors'));
drop policy if exists futmac_media_editor_update on storage.objects;
create policy futmac_media_editor_update on storage.objects for update to authenticated
using (bucket_id = 'futmac-media' and public.is_editor()) with check (bucket_id = 'futmac-media' and public.is_editor());
drop policy if exists futmac_media_editor_delete on storage.objects;
create policy futmac_media_editor_delete on storage.objects for delete to authenticated
using (bucket_id = 'futmac-media' and public.is_editor());
