-- FUTMAC içerik sahipliği ve editör yetki sınırı
-- 001_initial.sql, 002_league_management.sql ve 003_security_hardening.sql sonrasında çalıştırın.

-- Editör yalnızca kendi oluşturduğu haberi güncelleyebilir veya silebilir.
-- Admin bütün haberlerde işlem yapabilir.
drop policy if exists articles_editor_update on public.articles;
create policy articles_editor_update on public.articles
for update to authenticated
using (
  public.is_admin()
  or (public.is_editor() and created_by = auth.uid())
)
with check (
  public.is_admin()
  or (public.is_editor() and created_by = auth.uid())
);

drop policy if exists articles_editor_delete on public.articles;
create policy articles_editor_delete on public.articles
for delete to authenticated
using (
  public.is_admin()
  or (public.is_editor() and created_by = auth.uid())
);

-- Yönetim paneli sahipliği ayırt edebilsin; anonim ziyaretçiler bu iç kullanıcı
-- kimliğini okuyamaz. protect_article_metadata tetikleyicisi alanı değişmez tutar.
grant select (created_by) on public.articles to authenticated;

