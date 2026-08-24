# FUTMAC - E-Mac Turka'nın Spor Gazetesi

Kurulum gerektirmeyen, responsive ve backend bağlantısına hazır fantazi futbol haber sitesi frontend prototipidir.

## Açma

1. Bu klasörü VS Code ile açın.
2. `index.html` dosyasını Live Server ile çalıştırın.
3. Ana sayfa tarayıcıda açıldığında bütün yerel sayfalar menülerden kullanılabilir.

Site `file://` ile de açılabilir. Veri katmanı JSON isteği yerine `assets/js/data.js` dosyasında tutulduğu için yerel tarayıcı kısıtlamalarına takılmaz.

## Başlıca sayfalar

- `index.html`: Ana haber portalı
- `futbol.html`, `emac-ligi.html`, `fantazi.html`, `transfer.html`: Haber kategorileri
- `kategori.html`: Sonradan eklenen kategoriler için ortak liste şablonu
- `macaton.html`, `haftanin-11i.html`, `oduller.html`: Özel içerik kategorileri
- `fikstur.html`: Hafta seçicili maç merkezi
- `puan-durumu.html`: E-Mac örnek takım/yönetici puan tablosu
- `yazarlar.html`: Yazar listesi
- `yazar-furkan.html`, `yazar-eray.html`, `yazar-berkay.html`: Yazar profilleri
- `arsiv.html`: Arama, kategori, yazar ve tarih filtreli arşiv
- `kurallar.html`: 7 kısım ve 19 maddelik mevzuat özeti ve resmî PDF bağlantısı
- `404.html`: Sayfa bulunamadı görünümü
- `admin.html`: Haber, fikstür, puan durumu ve yazar yönetim paneli
- `sifre-yenile.html`: Güvenli parola yenileme ekranı
- `haber-onizleme.html`: Admin panelinde hazırlanan yerel içeriğin detay görünümü

## İçerik güncelleme

Örnek haberler, yazarlar, takımlar, puan durumu ve fikstür `assets/js/data.js` dosyasındadır. Backend geldiğinde aynı alanları API'den döndürüp bu veri nesnesinin yerine bağlamak yeterlidir.

## Admin paneli

`admin.html` ekranında haber/köşe yazısı ekleme, düzenleme, silme, arama ve filtreleme, taslak/yayın/zamanlama/yayından kaldırma, kart önizlemesi, parola sıfırlama ve yedekleme araçları bulunur. Aynı panelden fikstür, puan durumu, yazarlar, takımlar, kategoriler ve kullanıcı rolleri de yönetilir. Panel iki çalışma biçimini destekler:

- Varsayılan yerel demo: kurulum gerektirmez; içerikleri yalnızca aynı tarayıcıda saklar.
- Supabase modu: gerçek kullanıcı girişi, ortak haber/taslak veritabanı ve kapak görseli yükleme sağlar.

Bir içerik yayımlandığında panel, ziyaretçilerin açabileceği gerçek haber bağlantısını gösterir. **Yayındaki Haberi Aç** ile sayfa kontrol edilebilir; **Bağlantıyı Kopyala** ile adres doğrudan paylaşılabilir. Taslak ve ileri tarihli içeriklerde ziyaretçi bağlantısı henüz açık olmadığı için kopyalama seçeneği gösterilmez.

Supabase kurulumu için `SUPABASE_KURULUM.md` dosyasını izleyin. Başlangıç şeması ve Row Level Security kuralları `supabase/migrations/001_initial.sql`; lig yönetimi şeması `supabase/migrations/002_league_management.sql`; işlem geçmişi ve üretim güvenliği `supabase/migrations/003_security_hardening.sql` içindedir. Tarayıcı bağlantısı `assets/js/supabase-config.js` dosyasından açılır. `service_role` anahtarı frontend dosyalarına kesinlikle eklenmemelidir.

Üretim ayarları, halka açık kaydı kapatma, alan adı, yedekleme ve gerçek site sahibine devir adımları `CANLIYA_GECIS.md` dosyasında takip edilir. Proje geleneksel bir uygulama sunucusu gerektirmez; GitHub Pages arayüzü, Supabase ise Auth/veritabanı/Storage katmanını çalıştırır.

Supabase tarayıcı kütüphanesi `assets/vendor/supabase-2.112.3.min.js` dosyasında sabitlenmiştir; site çalışırken harici bir JavaScript CDN'ine bağlanmaz. İlgili MIT lisansı `assets/vendor/SUPABASE-LICENSE.txt` dosyasındadır.

Yazar fotoğrafları `assets/images/yazarlar/` klasöründedir:

- Furkan Katılmış: `furkan-katilmis-2.png`
- Eray: `eray.png`
- Berkay Minkara: `berkay-minkara.jpg`

Yeni fotoğraf aynı dosya adıyla mevcut görselin üzerine kopyalanabilir. En iyi sonuç için vesikalık oranında, en az 240 x 300 piksel bir görsel kullanın.

## Mevzuat notu

Mevzuat sayfası hızlı başvuru özetidir. Kaynak belgenin giriş paragrafında 14 Ağustos 2026, 18. maddesinde 20 Ağustos 2026 yürürlük tarihi bulunduğundan bu fark sayfada açıkça belirtilmiştir. Uyuşmazlık halinde resmî PDF ve lig yönetiminin açıklaması esas alınır.

## Test

Teslim sürümünde 32 HTML sayfası 320, 375, 390, 768, 1024 ve 1440 piksel genişliklerde kontrol edilir. Kırık yerel bağlantı, kırık görsel, yatay taşma, başlık yapısı, mobil menü, arşiv filtreleri, fikstür durumları, puan tablosu, parola yenileme, rol görünürlüğü ve admin giriş-yayın akışı test kapsamındadır.

Arama motorları için `robots.txt` ve `sitemap.xml` proje kökünde bulunur. Canonical, Open Graph, site haritası ve paylaşım adresleri üretim alan adı `https://futmac.com.tr/` için hazırlanmıştır.
