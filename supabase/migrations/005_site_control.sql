-- FUTMAC tam site yönetimi
-- 001, 002 ve 003 migration dosyalarından sonra bir kez çalıştırın.

create table if not exists public.site_settings (
  id boolean primary key default true check (id = true),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, settings) values (true, jsonb_build_object(
  'siteName','FUTMAC', 'tagline','E-MAC TURKA''NIN SPOR GAZETESİ',
  'issueLabel','SAYI: 001', 'seasonLabel','2026-2027 SEZONU',
  'ruleTitle','3 TRANSFER SINIRI',
  'ruleText','5. haftadan itibaren haftalık en fazla 3 transfer yapılabilir. Aşım halinde 300 fantazi puanı silinir. Takım bütçesi 100.000.000 TL''dir.',
  'ruleLink','kurallar.html#butce', 'ruleLinkLabel','MADDE 3-4 »',
  'promoTitle','2026-2027 RESMÎ MEVZUAT', 'promoText','19 MADDE »', 'promoLink','kurallar.html',
  'matchCenterTitle','CANLI SONUÇLAR', 'matchCenterLink','fikstur.html',
  'footerText','© 2026 E-Mac Turka''nın Spor Gazetesi',
  'breakingVisible',true, 'ruleBannerVisible',true, 'writersVisible',true,
  'standingsVisible',true, 'upcomingVisible',true, 'latestVisible',true,
  'matchCenterVisible',true, 'recentVisible',true, 'mainNewsVisible',true
)) on conflict (id) do nothing;

create or replace function public.protect_site_settings()
returns trigger language plpgsql set search_path = public as $$
begin
  new.id = true;
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;
revoke all on function public.protect_site_settings() from public;
drop trigger if exists site_settings_protect on public.site_settings;
create trigger site_settings_protect before insert or update on public.site_settings
for each row execute function public.protect_site_settings();

alter table public.site_settings enable row level security;
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings for select to anon, authenticated using (true);
drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings for all to authenticated
using (public.is_admin()) with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

drop trigger if exists zz_audit_site_settings on public.site_settings;
create trigger zz_audit_site_settings after insert or update or delete on public.site_settings
for each row execute function public.write_audit_log();
