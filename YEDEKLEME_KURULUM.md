# FUTMAC otomatik yedekleme

Depoda günlük çalışan `.github/workflows/supabase-backup.yml` hazırdır. Veritabanı ve Storage görselleri GitHub Actions çıktısı olarak 14 gün tutulur; yedekler siteye veya kaynak koda eklenmez.

GitHub deposunda **Settings → Secrets and variables → Actions** bölümüne şu üç şifreli secret eklenmelidir:

- `SUPABASE_DB_URL`: Supabase **Connect → Direct connection** PostgreSQL adresi.
- `FUTMAC_SUPABASE_URL`: proje adresi (`https://…supabase.co`).
- `FUTMAC_SUPABASE_SERVICE_ROLE_KEY`: Supabase **Project Settings → API Keys → service_role** anahtarı.

`service_role` anahtarı hiçbir HTML/JavaScript dosyasına, mesaja veya ekran görüntüsüne yazılmamalıdır. Secret’lar eklendikten sonra GitHub **Actions → FUTMAC Supabase Backup → Run workflow** ile ilk yedek elle çalıştırılmalıdır.
