# Supabase kurulum rehberi

1. Supabase üzerinde yeni bir proje oluşturun.
2. SQL Editor bölümünde `supabase/migrations/001_initial.sql` dosyasının tamamını çalıştırın.
   Ardından fikstür, puan durumu, yazar, takım, kategori, gelişmiş yayın durumu ve rol koruması için `supabase/migrations/002_league_management.sql` dosyasının tamamını çalıştırın. İşlem başarılı olduktan ve `authors`, `league_teams`, `standings`, `fixtures` tabloları göründükten sonra `assets/js/supabase-config.js` içindeki `leagueManagementEnabled` değerini `true` yapın.
   Son olarak işlem geçmişi, sahiplik koruması ve Storage sınırları için `supabase/migrations/003_security_hardening.sql` dosyasının tamamını çalıştırın. Üç SQL dosyası da tekrar çalıştırmaya karşı güvenli hazırlanmıştır.
3. Authentication > Users bölümünden yönetici kullanıcısını oluşturun.
4. SQL Editor içinde aşağıdaki komutu, kullanıcının e-posta adresini değiştirerek çalıştırın:

```sql
update public.profiles
set role = 'admin', display_name = 'Site Yöneticisi'
where id = (select id from auth.users where email = 'yonetici@example.com');
```

5. Storage bölümünde `futmac-media` adında **public** bir bucket oluşturun. Dosya boyutu sınırını 5 MB; izin verilen türleri `image/jpeg`, `image/png`, `image/webp` olarak ayarlayın.
6. Project Settings > API bölümünden proje URL’sini ve **publishable key** (eski projelerde `anon` key) değerini alın.
7. `assets/js/supabase-config.js` dosyasında `enabled` değerini `true` yapın; URL ve public anahtarı ilgili alanlara girin.
8. Siteyi VS Code Live Server ile açın ve `admin.html` üzerinden gerçek kullanıcıyla giriş yapın.
9. SQL Editor içinde `supabase/migrations/004_article_ownership.sql` dosyasını çalıştırın. Bu politika editörleri kendi haberleriyle sınırlar; admin bütün haberleri yönetmeye devam eder.
10. Adminin ana sayfa başlıklarını, duyuru alanlarını ve bölüm görünürlüklerini yönetebilmesi için `supabase/migrations/005_site_control.sql` dosyasını çalıştırın. Bu migration mevcut haber, takım, fikstür veya puan verilerini silmez.
11. Eski haberlerin yazar kısa kimliğini kalıcı bağlamak ve gizlilik dostu okunma sayacını açmak için `supabase/migrations/006_seo_analytics_and_identity.sql` dosyasını çalıştırın. Başarılı olduktan sonra `assets/js/supabase-config.js` içindeki `analyticsEnabled` değerini `true` yapın.
12. Authentication > URL Configuration bölümünde `https://futmac.com.tr` adresini Site URL olarak ayarlayın. Redirect URLs listesine `https://futmac.com.tr/sifre-yenile.html` adresini ekleyin. Alan adı DNS ve HTTPS doğrulanana kadar mevcut GitHub Pages parola yenileme adresini de geçici olarak listede tutun.
13. SQL Editor içinde `supabase/migrations/010_forum.sql` dosyasını çalıştırın. Bu adım forum konularını, yanıtları, değiştirilebilir rumuzları, anonim görünümü, hız sınırlarını ve moderasyon yetkilerini kurar.
14. Forum üyeliği için Authentication > Sign In / Providers bölümünde **Allow new users to sign up** seçeneğini açın. **Allow anonymous sign-ins** kapalı kalmalıdır; anonim görünen bir paylaşım yapabilmek için de kayıtlı hesap gerekir. **Confirm email** seçeneğinin açık kalması önerilir.
15. Forum üyeleri otomatik olarak `viewer` rolü alır ve yönetim paneline giremez. Yeni admin/editör hesaplarını yalnızca yetkili kişi Supabase Dashboard içinden oluşturmalı ve rolünü ayrıca vermelidir.

## Güvenlik notları

- `service_role` anahtarını hiçbir frontend dosyasına yazmayın ve GitHub’a yüklemeyin.
- Tarayıcıdaki public anahtar tek başına yazma yetkisi vermez. Yetki SQL dosyasındaki Row Level Security kurallarıyla kontrol edilir.
- Yeni kullanıcılar otomatik olarak `viewer` olur. Editör veya admin rolü ayrıca veritabanından verilmelidir.
- Canlıya geçmeden önce Auth ayarlarından e-posta doğrulama ve parola politikasını kontrol edin.
- `leagueManagementEnabled` yalnızca ikinci SQL dosyası hatasız tamamlandıktan sonra açılmalıdır. Aksi halde canlı site sabit lig verilerini kullanmaya devam etmelidir.
- Üçüncü SQL dosyası son admin hesabının silinmesini engeller, haber sahiplik alanlarını korur ve adminlere salt okunur işlem geçmişi sunar.
- GitHub Pages özel HTTP güvenlik başlıkları ekleyemediği için sayfalarda Content Security Policy ve referrer politikası meta etiketleriyle uygulanır.

## Yedekleme

- Admin panelindeki **İçerik Yedeğini İndir** düğmesi haberlerle birlikte kategori, yazar, takım, fikstür ve puan durumu verilerini JSON olarak indirir; kullanıcı profilleri güvenlik nedeniyle bu dosyaya eklenmez.
- Canlı Supabase verilerine tarayıcıdan toplu JSON içe aktarma kapalıdır. Bu, hatalı bir dosyanın mevcut içerikleri topluca değiştirmesini önler.
- Düzenli tam veritabanı yedekleri Supabase Dashboard içindeki Database / Backups bölümünden yönetilmelidir. Planın yedekleme özelliği sunmadığı durumlarda SQL dışa aktarma işlemi yalnızca güvenilir bir yönetici bilgisayarından yapılmalıdır.
- Veritabanı yedeği Storage içindeki gerçek görsel dosyalarını içermez; yalnızca dosya kayıtlarını içerir. Önemli medya dosyaları ayrıca güvenli bir konuma düzenli olarak kopyalanmalıdır.

Supabase yapılandırılmadığında site ve admin paneli yerel demo modunda çalışmaya devam eder.
