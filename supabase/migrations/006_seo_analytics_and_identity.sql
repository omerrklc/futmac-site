-- FUTMAC SEO, yazar kimliği ve gizlilik dostu okunma sayacı
-- Önceki migration dosyalarından sonra Supabase SQL Editor içinde bir kez çalıştırın.

alter table public.articles add column if not exists view_count bigint not null default 0 check (view_count >= 0);
create index if not exists articles_popular_idx on public.articles (status, view_count desc, published_at desc);

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
