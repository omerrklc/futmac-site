# FUTMAC Google arama kurulumu

Kod tarafında canonical adresler, `robots.txt`, otomatik güncellenen `sitemap.xml`, gerçek haber paylaşım sayfaları ve dinamik yazar profilleri hazırlanmıştır.

Google hesabının sahibi şu son adımı bir kez yapmalıdır:

1. [Google Search Console](https://search.google.com/search-console/) içinde **Alan adı** türünde `futmac.com.tr` mülkünü ekleyin.
2. Google’ın verdiği TXT doğrulama kaydını Natro DNS paneline ekleyin. Mevcut A ve CNAME kayıtlarını değiştirmeyin.
3. Doğrulama tamamlanınca **Site Haritaları** bölümüne `https://futmac.com.tr/sitemap.xml` yazıp gönderin.
4. URL Denetimi bölümünde ana sayfayı ve ilk gerçek haber bağlantısını denetleyip dizine eklenmesini isteyin.

Site haritası bundan sonra GitHub otomasyonu tarafından gerçek haberler ve aktif yazarlarla birlikte yenilenir. Demo haber adresleri site haritasına yeniden eklenmez.
