# FUTMAC geliştirme promptu

E-Mac Turka Fantazi Ligi için hazırlanmış FUTMAC haber sitesini, mevcut düz HTML/CSS/JavaScript ve Supabase yapısını koruyarak üretime hazır hâle getir.

## Tasarım yönü

- E-Mac Turka logosunu, koyu yeşil-kırmızı-altın renk sistemini ve 2008–2012 Türk spor portalı karakterini koru.
- Arayüzü modern uygulama kartlarına dönüştürme; dar haber sütunları, çerçeveli modüller ve yoğun spor gazetesi düzeni sürsün.
- Mobilde okunabilirliği ve dokunma alanlarını iyileştir; masaüstündeki portal yoğunluğunu kaybetme.
- Ziyaretçi sitesi ve yönetim paneli aynı görsel aileye ait görünmeli.

## Ziyaretçi sitesi

- Ana sayfa, kategori, haber, köşe yazısı, yazar profili, arşiv, fikstür, puan durumu, ödüller ve mevzuat sayfalarının ortak menü ve altbilgisini koru.
- Her kart geçerli ve ilgili hedefe bağlansın; kırık görsel, boş bağlantı veya aynı alakasız detay sayfasına yönlenen kart bırakma.
- Yükleniyor, boş sonuç, veri hatası ve 404 durumlarını anlaşılır göster.
- Tarih, aktif menü, canonical ve sosyal paylaşım bilgileri sayfaya göre doğru üretilecek.
- HTTP üzerinden geçici yayın sırasında yerel CSS/görsellerin CSP tarafından yanlışlıkla HTTPS’e zorlanıp kaybolmasını engelle; gerçek HTTPS geldiğinde bütün kaynaklar aynı güvenli origin üzerinden yüklensin.

## Admin ve editör paneli

- Giriş ekranını yalnız güvenli HTTPS bağlantısında kullanılabilir tut; localhost geliştirme istisnası korunabilir.
- Admin bütün içerikleri; editör yalnız kendi oluşturduğu içerikleri düzenleyip silebilsin. Bu kural yalnız arayüzde değil Supabase RLS tarafında da uygulanmaya devam etsin.
- Haber oluşturma akışında başlık, kısa adres, içerik türü, kategori, yazar, spot, gövde, kapak görseli, alternatif metin, yayın tarihi/saati ve okuma süresi alanlarını koru.
- Başlık, spot ve gövde için karakter sayaçları göster; sunucu kısıtlarıyla aynı sınırları uygula.
- Kaydedilmemiş içerik varken düzenleyiciyi kapatma veya sayfadan ayrılma durumunda uyarı göster.
- Taslak kaydetme, zamanlama, yayımlama, önizleme, yayından kaldırma, bağlantı kopyalama ve hata mesajlarını açık Türkçe ifadelerle sun.
- Görsel yüklemede yalnız JPG/PNG/WebP ve 5 MB sınırı; içerik aktarımında mevcut güvenlik sınırları korunsun.
- Yetki kontrolü, kullanıcı yönetimi ve işlem geçmişi admin dışında görünmesin.

## Backend ve güvenlik

- Supabase publishable anahtarı dışında hiçbir gizli anahtarı frontend veya GitHub’a ekleme.
- RLS, haber sahipliği, son admin koruması, profil ve audit-log gizliliğini zayıflatma.
- Anonim hesap ve herkese açık kayıt kapalı kalsın; ziyaretçiler hesap açmadan yayımlanmış haberleri okuyabilsin.
- Parola yenileme yalnız izinli `https://futmac.com.tr/sifre-yenile.html` adresine yönlensin.
- Mevcut veritabanı tablolarını veya üretim verilerini silme; migration değişikliklerini geriye uyumlu yap.

## Kontrol ve teslim

- 320, 375, 390, 768, 1024 ve 1440 piksel genişliklerde kontrol et.
- Bütün HTML, CSS, JS, görsel ve yerel bağlantıları tara.
- JavaScript sözdizimi, tek `h1`, yatay taşma, klavye odağı ve konsol hatalarını kontrol et.
- Admin giriş güvenliği, editör sahipliği, yayımlama/önizleme, Supabase genel ve korumalı veri erişimini test et.
- HTTPS sertifikası hazır olmadan admin parolasıyla canlı HTTP adresinden giriş yapma.
- Değişiklikleri doğruladıktan sonra proje klasörü ve ZIP çıktısını güncelle; yayınlama öncesi yapılanları ve kalan dış bağımlılıkları raporla.
