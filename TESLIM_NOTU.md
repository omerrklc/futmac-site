# FUTMAC Teslim Notu

## Bu sürümde tamamlananlar

- Haber ve köşe yazıları için taslak kaydetme, doğrudan yayınlama, ileri tarihli yayın planlama ve onaylı yayından kaldırma akışları ayrıldı.
- Yayındaki içerik düzenlenirken yanlışlıkla taslağa dönmesi engellendi.
- Haber görsellerine erişilebilir açıklama alanı ve yükleme durum mesajları eklendi.
- Admin paneline takım, kategori ve kullanıcı yetkileri bölümleri eklendi.
- Yeni kategoriler için `kategori.html` ortak liste sayfası ve yönetilebilir menü görünürlüğü hazırlandı.
- Takım adı, yönetici, kısa kod, arma, sıralama ve aktif/pasif durumu yönetilebilir hâle getirildi.
- Viewer, editör ve admin rolleri arayüzde ayrıldı; editörlere lig ve yetki araçları gösterilmiyor.
- Fikstür, puan durumu, yazar, takım ve kategori yazma politikaları yalnızca admin rolüne indirildi.
- Kullanılan takımların silinmesi ve sistem kategorilerinin kaldırılması veritabanı kısıtlarıyla engellendi.
- Son admin hesabının yetkisinin kaldırılmasını önleyen veritabanı tetikleyicisi eklendi.
- Storage yazma politikası güvenli klasör ve JPG/PNG/WebP uzantılarıyla sınırlandırıldı.
- JSON yedeği haberlerle birlikte kategori, yazar, takım, fikstür ve puan durumunu kapsayacak şekilde genişletildi; kullanıcı profilleri yedeğe dahil edilmedi.
- Parola yenileme formu yalnızca geçerli Supabase oturumu doğrulandıktan sonra açılıyor.
- Yeni şema uygulanmadan mevcut canlı haber kaydetme akışının bozulmaması için geriye uyumluluk korundu.
- Oturum açılışta Auth sunucusundan doğrulanıyor; oturum kapandığında admin paneli anında giriş ekranına dönüyor.
- Supabase tarayıcı kütüphanesi değişken ana sürüm yerine doğrulanan sabit sürüme bağlandı.
- Haber ve yönetim listelerine üst sınır eklendi; gereksiz iç kullanıcı kimlikleri haber REST yanıtından çıkarıldı.
- Görsel yüklemede MIME bilgisine ek olarak dosya imzası kontrolü eklendi.
- Bütün HTML sayfalarına Content Security Policy ve güvenli referrer politikası eklendi.
- Admin paneline yalnızca adminlerin okuyabildiği “İşlem Geçmişi” ekranı hazırlandı.
- Supabase tarayıcı kütüphanesi lisansıyla birlikte projeye alındı; çalışma anındaki harici JavaScript CDN bağımlılığı kaldırıldı.
- Admin ayarlarına oturum, veritabanı, işlem geçmişi, medya ayarı ve yerel kütüphane durumunu denetleyen canlı sistem kontrolü eklendi.
- Canlı sistem kontrolü editör/admin sunucu rollerini, profil görünürlüğünü ve işlem geçmişi erişim sınırını veri değiştirmeden doğrulayacak biçimde genişletildi.
- Yayın sonrası ekrana gerçek haber adresini açma ve kopyalama seçenekleri eklendi; taslak ve zamanlanmış içerikler yanlışlıkla paylaşılabilir gösterilmiyor.
- Yönetim panelinden üretilen canlı haber sayfası ziyaretçi görünümüne dönüştürüldü; yönetim bağlantıları kaldırıldı ve içeriğe özgü canonical, Open Graph ve Twitter görsel bilgileri eklendi.
- Dinamik yayımlanmış haberlerdeki hatalı `noindex` kaldırıldı; taslak, önizleme ve bulunamayan içerikler `noindex` kalmaya devam ediyor.
- `robots.txt`, `sitemap.xml` ve canlıya geçiş/devir kontrol listesi eklendi.
- Sistem kontrolü, Supabase'te yeni kullanıcı kaydı ve anonim hesap ayarlarını da denetleyecek şekilde genişletildi.
- Canlı site, Supabase Auth, genel veri uçları ve korunan tablolar için günlük salt okunur GitHub Actions sağlık kontrolü eklendi.
- Supabase'te herkese açık yeni kullanıcı kaydı ve anonim giriş kapatıldı; günlük sağlık kontrolü bu ayarların kapalı kalmasını zorunlu olarak denetleyecek moda alındı.

## Test sonucu

- 32 HTML sayfası
- 6 ekran genişliği: 320, 375, 390, 768, 1024 ve 1440 piksel
- Toplam responsive tarama: 192 sayfa/görünüm
- Kırık yerel bağlantı: 0
- Yatay taşma: 0
- JavaScript sözdizimi ve konsol hatası: 0
- Admin rolünde takım, kategori, fikstür, puan durumu ve yayın işlemleri: başarılı
- Editör rolünde admin araçlarının gizlenmesi: başarılı
- Zamanlanmış yayın, yayındaki içeriği düzenleme ve yayından kaldırma: başarılı
- Eski ve yeni Supabase şeması için haber kayıt sözleşmesi: başarılı
- Geçerli ve geçersiz parola yenileme bağlantısı durumları: başarılı
- RLS, son-admin, sistem-kategori, takım-silme ve Storage politika kontrolleri: başarılı statik doğrulama
- Content Security Policy kapsamı: 32/32 sayfa
- Sabit Supabase kütüphanesinin yüklenmesi: başarılı
- Admin oturum kapatma ve işlem geçmişi arayüz akışı: başarılı
- Sahte uzantılı görsel reddi: başarılı
- Dinamik kod çalıştırma ve ayrıcalı anahtar bulgusu: 0
- Yayımlanmış, taslak ve zamanlanmış içerik sonuç ekranları: başarılı
- Haber bağlantısı kopyalama ve ziyaretçi detay görünümü: başarılı

## Canlı Supabase durumu

`supabase/migrations/002_league_management.sql` canlı projeye uygulandı. `authors`, `league_teams`, `standings`, `fixtures` ve gelişmiş kategori alanları REST API üzerinden başarıyla doğrulandı. `assets/js/supabase-config.js` içindeki `leagueManagementEnabled` değeri açıldı; admin panelindeki yazar, takım, fikstür, puan durumu ve kategori araçları artık ortak canlı veritabanını kullanır.

Auth URL Configuration bölümünde `sifre-yenile.html` adresi Redirect URLs listesinde tutulmalıdır.

24 Ağustos 2026 canlı Auth doğrulamasında yeni kullanıcı kaydı kapalı, anonim giriş kapalı ve e-posta doğrulaması açık bulundu. Ziyaretçiler haberleri hesap açmadan okumaya devam eder; bu ayarlar yalnızca yönetim hesabı oluşturma ve oturum açma yüzeyini sınırlar.

`supabase/migrations/003_security_hardening.sql` canlı projeye uygulandı. İşlem geçmişi tablosunun varlığı ve anonim erişime kapalı olduğu, haber sahiplik alanlarının ziyaretçilere verilmediği ve genel haber/lig okuma uçlarının çalışmaya devam ettiği REST API üzerinden doğrulandı. Son admin hesabını silmeye karşı koruma, değişiklik kaydı ve Storage boyut/MIME sınırları artık sunucu tarafında etkindir.
