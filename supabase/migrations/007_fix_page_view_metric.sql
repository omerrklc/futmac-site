-- FUTMAC sayfa istatistiği fonksiyonundaki parametre/sütun adı belirsizliğini giderir.
-- 006_seo_analytics_and_identity.sql sonrasında bir kez çalıştırın.

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
  on conflict on constraint site_metrics_pkey
  do update set views = public.site_metrics.views + 1;
end;
$$;

revoke all on function public.record_page_view(text,text) from public;
grant execute on function public.record_page_view(text,text) to anon, authenticated;
