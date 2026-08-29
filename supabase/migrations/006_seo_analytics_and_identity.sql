-- FUTMAC SEO, yazar kimliği ve gizlilik dostu okunma sayacı
-- Önceki migration dosyalarından sonra Supabase SQL Editor içinde bir kez çalıştırın.

-- SQL Editor ve anonim sayaç çağrılarında auth.uid() boş olur. Eski tetikleyici
-- updated_by alanını doğrudan NULL yaptığı için mevcut sahibin kimliğini koru.
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  if tg_table_name = 'articles' then
    new.updated_by = coalesce(auth.uid(), new.updated_by, old.updated_by);
  end if;
  return new;
end;
$$;

alter table public.articles add column if not exists view_count bigint not null default 0 check (view_count >= 0);
create index if not exists articles_popular_idx on public.articles (status, view_count desc, published_at desc);

-- Anonim okunma artışları editoryal değişiklik değildir; işlem geçmişini
-- binlerce sahipsiz sayaç kaydıyla doldurmadan gerçek içerik değişikliklerini kaydet.
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
  if tg_table_name = 'articles' and tg_op = 'UPDATE' and auth.uid() is null
     and (new_row - array['view_count','updated_at','updated_by']::text[])
       = (old_row - array['view_count','updated_at','updated_by']::text[]) then
    return new;
  end if;
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

-- Eski kayıtlarda yalnızca ad yazılmışsa güncel yazarın kısa kimliğini kalıcı bağlar.
update public.articles article
set author_slug = author.slug,
    author_name = author.name
from public.authors author
where article.author_slug is null
  and lower(trim(article.author_name)) = lower(trim(author.name));

-- IP, cihaz veya kullanıcı kimliği saklamadan yalnızca toplam sayacı artırır.
create or replace function public.record_article_view(article_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count bigint;
begin
  update public.articles
  set view_count = view_count + 1
  where id = article_id
    and status = 'published'
    and published_at <= now()
  returning view_count into next_count;
  return next_count;
end;
$$;
revoke all on function public.record_article_view(uuid) from public;
grant execute on function public.record_article_view(uuid) to anon, authenticated;
grant select (view_count) on public.articles to anon, authenticated;

comment on column public.articles.view_count is 'Toplu haber görüntülenme sayısı; ziyaretçi kimliği veya IP saklanmaz.';
comment on function public.record_article_view(uuid) is 'Yayımlanmış bir haber için anonim toplam görüntülenme sayacını artırır.';

create table if not exists public.site_metrics (
  metric_day date not null default current_date,
  page_path text not null check (char_length(page_path) between 1 and 180),
  referrer_host text not null default 'direct' check (char_length(referrer_host) between 1 and 120),
  views bigint not null default 0 check (views >= 0),
  primary key (metric_day, page_path, referrer_host)
);
alter table public.site_metrics enable row level security;
drop policy if exists site_metrics_admin_read on public.site_metrics;
create policy site_metrics_admin_read on public.site_metrics for select to authenticated using (public.is_admin());
grant select on public.site_metrics to authenticated;

create or replace function public.record_page_view(page_path text, referrer_host text default 'direct')
returns void language plpgsql security definer set search_path = public as $$
declare
  safe_path text := left(coalesce(nullif(page_path,''), '/'), 180);
  safe_referrer text := left(lower(coalesce(nullif(referrer_host,''), 'direct')), 120);
begin
  if safe_path !~ '^/[A-Za-z0-9._~/%?=&-]*$' then safe_path := '/'; end if;
  if safe_referrer !~ '^(direct|[a-z0-9.-]+)$' then safe_referrer := 'other'; end if;
  insert into public.site_metrics (metric_day, page_path, referrer_host, views)
  values (current_date, safe_path, safe_referrer, 1)
  on conflict (metric_day, page_path, referrer_host)
  do update set views = public.site_metrics.views + 1;
end;
$$;
revoke all on function public.record_page_view(text,text) from public;
grant execute on function public.record_page_view(text,text) to anon, authenticated;
comment on table public.site_metrics is 'IP veya cihaz kimliği içermeyen günlük toplu sayfa görüntülenmeleri.';
