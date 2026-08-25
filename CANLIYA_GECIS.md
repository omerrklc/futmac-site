# FUTMAC Canlıya Geçiş ve Devir Planı

Bu proje halka açık üyelik kullanmaz. Ziyaretçiler haberleri giriş yapmadan okur; yalnızca önceden oluşturulmuş `admin` ve `editor` hesapları `admin.html` üzerinden giriş yapar.

## Mevcut mimari

- Site ve statik dosyalar: GitHub Pages
- Veritabanı, Auth ve API: Supabase
- Haber/yazar/takım görselleri: Supabase Storage (`futmac-media`)
- Geleneksel PHP, Node.js veya VPS sunucusu: gerekli değil

## Canlıya geçmeden önce zorunlu ayarlar

### 1. Herkese açık kaydı kapat

Supabase Dashboard içinde **Authentication > Sign In / Providers** veya **General Configuration** bölümünü açın.

- **Allow new users to sign up:** Kapalı
- **Allow anonymous sign-ins:** Kapalı
- Kullanılmayan sosyal ve telefon sağlayıcıları: Kapalı

Yeni e-posta kaydı ve anonim giriş 24 Ağustos 2026 tarihinde canlı Supabase Auth ayarlarından kapalı olarak doğrulandı. E-posta doğrulaması açıktır. Bu durum `admin.html > Ayarlar / Backend > Sistemi ve Yetkileri Kontrol Et` ekranından da yeniden denetlenebilir.

### 2. Gerçek site yöneticisini oluştur

- Siteyi kullanacak kişi için kendi e-posta adresiyle ayrı bir Supabase Auth hesabı oluşturun.
- `public.profiles` tablosunda bu hesaba `admin` rolü verin.
- Kişisel parola paylaşmayın.
- Devir tamamlanıp yeni yönetici giriş yapana kadar mevcut teknik admin hesabını kaldırmayın.

### 3. Parola yenileme ve e-posta

- Authentication URL Configuration içindeki Site URL canlı alan adına ayarlanmalıdır.
- Redirect URLs listesinde canlı `sifre-yenile.html` adresi bulunmalıdır.
- Parola yenileme e-postalarının güvenilir teslimi için üretimde özel SMTP kullanılması önerilir.

### 4. Yedekleme

- Veritabanı yedeği; haberleri, lig verilerini ve kullanıcı profillerini kapsar.
- Supabase Storage içindeki gerçek görsel dosyaları veritabanı yedeğine dahil değildir; ayrıca yedeklenmelidir.
- Veritabanı bağlantı bilgisi veya yedek dosyası bu herkese açık GitHub deposuna eklenmemelidir.
- Yedek geri yükleme işlemi en az bir kez ayrı bir test projesinde denenmelidir.

## Alan adı ve yayın

Üretim alan adı `futmac.com.tr` olarak gerçek site sahibinin hesabından satın alınmıştır. Natro müşteri onayı ve DNS etkinleştiğinde:

1. FUTMAC dosyaları ayrı `futmac-site` üretim repository'sinin kökünden yayımlanır. Mevcut karma önizleme repository'si özel alan adına bağlanmaz.
2. Üretim repository'sinde **Settings > Pages > Custom domain** alanına alan adı yazılır.
3. Alan adı firmasındaki DNS kayıtları GitHub Pages'e yönlendirilir.
4. DNS doğrulandıktan sonra **Enforce HTTPS** açılır.
5. Projedeki canonical adresler, `robots.txt` ve `sitemap.xml` yeni alan adına çevrilir.
6. Supabase Site URL ve Redirect URLs yeni alan adına çevrilir.
7. Google Search Console'a alan adı eklenip `sitemap.xml` gönderilir.

DNS kontrolü, GitHub Pages sertifikası ve **Enforce HTTPS** 25 Ağustos 2026 tarihinde tamamlandı. `http`, `www` ve HTTPS adresleri güvenli ana adres `https://futmac.com.tr/` üzerinde birleşir.

## Yetki ve sahiplik devri

Günlük içerik girişi yapan kişinin yalnızca site admin hesabına ihtiyacı vardır. Teknik bakım yapmayacaksa GitHub veya Supabase Dashboard erişimi vermek zorunlu değildir.

Teknik sahiplik de devredilecekse:

- GitHub repository sahipliği veya gerekli yönetici yetkisi verilir.
- Supabase organizasyonuna uygun rol ile davet edilir.
- Alan adı hesabı gerçek sahibinde tutulur.
- Kurtarma e-postaları ve iki aşamalı doğrulama gerçek sahibin kontrolünde olur.
- Eski erişimler devir doğrulandıktan sonra kaldırılır.

## Son kabul testi

- Admin ve editör giriş/çıkış
- Parola yenileme
- Taslak, yayın, zamanlama ve yayından kaldırma
- Haber bağlantısını açma ve kopyalama
- Görsel yükleme ve ziyaretçi görünümü
- Fikstür, puan durumu, takım, yazar ve kategori güncelleme
- Admin dışındaki hesaplarda yönetim araçlarının kapalı olması
- Anonim kullanıcının taslak, profil ve işlem geçmişine erişememesi
- Mobil menü ve 320–1440 piksel responsive kontrol
- Kırık bağlantı, kırık görsel ve JavaScript konsol kontrolü
- `robots.txt`, `sitemap.xml`, canonical ve Search Console doğrulaması

## Otomatik sağlık kontrolü

`.github/workflows/futmac-health.yml` iş akışı her gün Türkiye saatiyle yaklaşık 08.17'de ve gerektiğinde elle çalışır. Kontrol:

- GitHub Pages ana sayfasını, admin `noindex` durumunu, sitemap ve robots dosyalarını,
- Supabase Auth sağlık durumunu ve kayıt ayarını,
- ziyaretçilere açık haber/lig tablolarını,
- anonim erişime kapalı profil, işlem geçmişi ve haber sahipliği alanlarını

denetler. Anahtar değeri veya kullanıcı verisi loglara yazılmaz; test yalnızca genel publishable anahtarı canlı yapılandırmadan okuyarak GET istekleri yapar.

Workflow içindeki `REQUIRE_CLOSED_SIGNUP` değeri `true` durumundadır. Herkese açık kayıt ileride yanlışlıkla açılırsa günlük kontrol başarısız olur ve GitHub Actions üzerinde uyarı oluşturur.

## Değişiklik sınırı

`CNAME` dosyası `futmac.com.tr` olarak aktiftir. DNS kayıtları ve GitHub Pages özel alan adı bağlantısı çalışan üretim yapılandırmasıdır; planlı taşıma dışında değiştirilmez. İlave ücretli hosting, sunucu veya SSL paketi alınmaz.
