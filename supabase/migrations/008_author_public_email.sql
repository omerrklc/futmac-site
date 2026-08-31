-- Yazarın yayımlanmasını istediği, herkese açık iletişim adresi.
-- Giriş hesabının e-postasından bağımsızdır; mevcut yazarlara boş eklenir.
alter table public.authors
  add column if not exists email text not null default '';
alter table public.authors drop constraint if exists authors_public_email_check;
alter table public.authors add constraint authors_public_email_check
  check (email = '' or (
    char_length(email) <= 254
    and email ~ '^[^[:space:]<>"@]+@[^[:space:]<>"@]+[.][^[:space:]<>"@]+$'
  ));
comment on column public.authors.email is 'Yazar tarafından yayımlanması onaylanan, herkese açık iletişim e-postası. Giriş hesabı e-postası değildir.';
