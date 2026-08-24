(function () {
  'use strict';

  window.FUTMAC_DATA = {
    updatedAt: '20 Ağustos 2026, 15:30',
    categories: {
      futbol: { title: 'Futbol', kicker: 'SAHADAN HABERLER', description: 'Haftanın karşılaşmaları, maç önü notları ve futbol gündemi.' },
      emac: { title: 'E-Mac Ligi', kicker: 'LİGİN NABZI', description: 'E-Mac Turka Süper Ligi’nden duyurular, rekabet ve yönetim haberleri.' },
      fantazi: { title: 'Fantazi', kicker: 'KADRO REHBERİ', description: 'Bütçe, puanlama, kadro seçimi ve mevzuatın oyuna etkisi.' },
      transfer: { title: 'Transfer', kicker: 'SON HAMLELER', description: 'Haftalık transfer planları, fiyat-performans adayları ve kadro önerileri.' },
      yazarlar: { title: 'Köşe Yazıları', kicker: 'FUTMAC YAZARLARI', description: 'Furkan Katılmış, Eray ve Berkay Minkara’nın haftalık değerlendirmeleri.' },
      macaton: { title: 'Macaton', kicker: 'HAFTANIN PROGRAMI', description: 'Haftanın oyuncusu, sürpriz performansı ve programdan öne çıkanlar.' },
      haftanin11: { title: 'Haftanın 11’i', kicker: 'EDİTÖRÜN SEÇİMİ', description: 'Fikstür ve form durumuna göre haftanın örnek fantazi kadrosu.' },
      oduller: { title: 'Ödüller', kicker: '2026-2027 ÖDÜL DOSYASI', description: 'Şampiyonluk, içerik, aylık performans ve özel ödüllerin özeti.' }
    },
    authors: [
      { id: 'furkan', name: 'Furkan Katılmış', role: 'Genel Yayın Yönetmeni', image: 'assets/images/yazarlar/furkan-katilmis-2.png', profile: 'yazar-furkan.html', bio: 'E-Mac Turka gündemi, lig yönetimi ve transfer stratejileri üzerine yazıyor.' },
      { id: 'eray', name: 'Eray', role: 'Taktik Yazarı', image: 'assets/images/yazarlar/eray.png', profile: 'yazar-eray.html', bio: 'Fikstür, oyuncu rolleri ve haftalık kadro planlamasını inceliyor.' },
      { id: 'berkay', name: 'Berkay Minkara', role: 'Lig Muhabiri', image: 'assets/images/yazarlar/berkay-minkara.jpg', profile: 'yazar-berkay.html', bio: 'Lig rekabetini, derbileri ve güncel puan tablosunu takip ediyor.' }
    ],
    articles: [
      { id: 'futmac-yayinda', slug: 'futmac-yayinda', type: 'haber', category: 'emac', title: 'FUTMAC yayın hayatına başladı', excerpt: 'E-Mac Turka Fantazi Ligi’nin haberleri, köşe yazıları ve lig merkezi artık aynı adreste.', content: 'E-Mac Turka Fantazi Ligi için hazırlanan FUTMAC, 2026-2027 sezonu öncesinde yayın hayatına başladı. Haber merkezi; lig duyurularını, transfer gelişmelerini, köşe yazılarını ve haftalık programı tek çatı altında toplayacak.\n\nYönetim panelinin devreye alınmasıyla birlikte yeni haberler ortak veritabanından yayımlanabilecek. Editörler içerikleri taslak olarak kaydedebilecek, kapak görseli ekleyebilecek ve hazır olduklarında yayına alabilecek.\n\nFUTMAC’ın tasarımı, 2008-2012 döneminin Türk spor portallarından ilham alıyor. Puan durumu, fikstür, mevzuat, ödüller ve arşiv bölümleri sezon boyunca güncel tutulacak.', date: '2026-08-21', displayDate: '21 Ağustos 2026', time: '09:30', author: 'FUTMAC Servisi', image: 'assets/images/futbol-manset.svg', url: 'haber-onizleme.html?id=futmac-yayinda', status: 'published', dynamic: true, featured: true, readTime: '3 dk' },
      { id: 'yeni-sezon', type: 'haber', category: 'emac', title: 'E-Mac’te yeni sezon başlıyor', excerpt: '2026-2027 sezonunda fikstür, transfer bütçesi ve rekabet yeniden şekilleniyor.', date: '2026-08-20', displayDate: '20 Ağustos 2026', time: '12:30', author: 'FUTMAC Servisi', image: 'assets/images/futbol-manset.svg', url: 'haber.html', featured: true, readTime: '4 dk' },
      { id: 'fikstur-aciklandi', type: 'haber', category: 'futbol', title: 'İlk haftanın eşleşmeleri belli oldu', excerpt: 'Teknik direktörleri zorlu bir açılış haftası ve dikkat isteyen eşleşmeler bekliyor.', date: '2026-08-20', displayDate: '20 Ağustos 2026', time: '11:45', author: 'FUTMAC Servisi', image: 'assets/images/futbol-fikstur.svg', url: 'haber-fikstur.html', featured: true, readTime: '3 dk' },
      { id: 'transfer-siniri', type: 'haber', category: 'transfer', title: 'Haftalık üç transfer dönemi başlıyor', excerpt: 'Beşinci haftadan itibaren planlama hatalarının bedeli çok daha ağır olacak.', date: '2026-08-20', displayDate: '20 Ağustos 2026', time: '10:50', author: 'Furkan Katılmış', image: 'assets/images/futbol-transfer.svg', url: 'haber-transfer.html', featured: true, readTime: '4 dk' },
      { id: 'derbi-puanlari', type: 'haber', category: 'emac', title: 'Derbide puanlar nasıl değişecek?', excerpt: 'Derbi galibiyetine +30, mağlubiyete -40 fantazi puanı uygulanacak.', date: '2026-08-20', displayDate: '20 Ağustos 2026', time: '10:15', author: 'Berkay Minkara', image: 'assets/images/futbol-derbi.svg', url: 'haber-derbi.html', featured: true, readTime: '3 dk' },
      { id: 'buyuk-odul', type: 'haber', category: 'oduller', title: 'Şampiyona 7.500 TL büyük ödül', excerpt: 'Nakdî ödüle nostaljik takım hatırası ve sezon içi özel ödüller eşlik ediyor.', date: '2026-08-20', displayDate: '20 Ağustos 2026', time: '09:40', author: 'FUTMAC Servisi', image: 'assets/images/futbol-odul.svg', url: 'haber-oduller.html', featured: true, readTime: '4 dk' },
      { id: 'macaton-secimleri', type: 'haber', category: 'macaton', title: 'Macaton haftalık seçimleri başlıyor', excerpt: 'Haftanın oyuncusu, sürpriz ismi ve en iyi takımı programda açıklanacak.', date: '2026-08-19', displayDate: '19 Ağustos 2026', time: '18:20', author: 'FUTMAC Servisi', image: 'assets/images/futbol-odul.svg', url: 'haber-macaton.html', readTime: '3 dk' },
      { id: 'haftanin-onbiri', type: 'haber', category: 'haftanin11', title: 'Açılış haftasının örnek 11’i', excerpt: 'Fikstür avantajı ve oyuncu rollerine göre hazırlanan ilk kadro taslağı.', date: '2026-08-19', displayDate: '19 Ağustos 2026', time: '17:10', author: 'Eray', image: 'assets/images/futbol-kadro.svg', url: 'haber-haftanin-11i.html', readTime: '5 dk' },
      { id: 'kurallar-rehberi', type: 'haber', category: 'fantazi', title: 'Takımını kur, kuralları bil', excerpt: 'Yedi kısım ve 19 maddelik mevzuat için hızlı başvuru rehberi.', date: '2026-08-19', displayDate: '19 Ağustos 2026', time: '15:00', author: 'FUTMAC Servisi', image: 'assets/images/logo/emac-turka-transparent.png', url: 'kurallar.html', readTime: '6 dk' },
      { id: 'furkan-yeni-donem', type: 'yazi', category: 'yazarlar', title: 'E-Mac’te yeni dönem', excerpt: 'Yeni sezon yalnızca kadroları değil, ligde düşünme biçimimizi de değiştirecek.', date: '2026-08-19', displayDate: '19 Ağustos 2026', time: '12:30', author: 'Furkan Katılmış', authorId: 'furkan', image: 'assets/images/yazarlar/furkan-katilmis-2.png', url: 'yazi-yeni-donem.html', readTime: '5 dk' },
      { id: 'furkan-transfer', type: 'yazi', category: 'yazarlar', title: 'Transfer sınırı başlıyor', excerpt: 'Üç değişiklik hakkını doğru haftaya saklamak sezonun temel sınavı olacak.', date: '2026-08-20', displayDate: '20 Ağustos 2026', time: '09:30', author: 'Furkan Katılmış', authorId: 'furkan', image: 'assets/images/yazarlar/furkan-katilmis-2.png', url: 'yazi-butce.html', readTime: '4 dk' },
      { id: 'eray-taktik', type: 'yazi', category: 'yazarlar', title: 'Haftanın taktik analizi', excerpt: 'İsimlerden önce rol dağılımına ve fikstürün ritmine bakmak gerekiyor.', date: '2026-08-20', displayDate: '20 Ağustos 2026', time: '10:15', author: 'Eray', authorId: 'eray', image: 'assets/images/yazarlar/eray.png', url: 'yazi-eray.html', readTime: '5 dk' },
      { id: 'berkay-durum', type: 'yazi', category: 'yazarlar', title: 'Ligin güncel durumu', excerpt: 'Rekabetin merkezinde bütçe disiplini, kadro dengesi ve derbi baskısı var.', date: '2026-08-20', displayDate: '20 Ağustos 2026', time: '12:00', author: 'Berkay Minkara', authorId: 'berkay', image: 'assets/images/yazarlar/berkay-minkara.jpg', url: 'yazi-berkay.html', readTime: '4 dk' }
    ],
    standings: [
      { rank: 1, team: 'Boğazın Kartalları', manager: 'Berkay Minkara', played: 3, won: 3, drawn: 0, lost: 0, fantasy: 247, points: 9, change: 'up', form: ['G','G','G'] },
      { rank: 2, team: 'Kadro Mühendisleri', manager: 'Furkan Katılmış', played: 3, won: 3, drawn: 0, lost: 0, fantasy: 239, points: 9, change: 'same', form: ['G','G','G'] },
      { rank: 3, team: 'Taktik Tahtası', manager: 'Eray', played: 3, won: 2, drawn: 0, lost: 1, fantasy: 226, points: 6, change: 'up', form: ['G','M','G'] },
      { rank: 4, team: 'Son Dakika FK', manager: 'Ömer', played: 3, won: 1, drawn: 1, lost: 1, fantasy: 211, points: 4, change: 'down', form: ['B','G','M'] },
      { rank: 5, team: 'Yeşil Tribün', manager: 'Mert', played: 3, won: 1, drawn: 1, lost: 1, fantasy: 205, points: 4, change: 'same', form: ['M','G','B'] },
      { rank: 6, team: 'Transfer Odası', manager: 'Can', played: 3, won: 1, drawn: 0, lost: 2, fantasy: 198, points: 3, change: 'up', form: ['M','M','G'] },
      { rank: 7, team: 'Macaton United', manager: 'Ali', played: 3, won: 0, drawn: 2, lost: 1, fantasy: 191, points: 2, change: 'down', form: ['B','M','B'] },
      { rank: 8, team: 'Fikstürspor', manager: 'Efe', played: 3, won: 0, drawn: 0, lost: 3, fantasy: 176, points: 0, change: 'down', form: ['M','M','M'] }
    ],
    fixtures: {
      1: [
        { home: 'Boğazın Kartalları', away: 'Fikstürspor', date: '14 Ağustos 2026', time: '20:00', status: 'finished', homeScore: 82, awayScore: 61 },
        { home: 'Kadro Mühendisleri', away: 'Macaton United', date: '14 Ağustos 2026', time: '20:00', status: 'finished', homeScore: 79, awayScore: 67 },
        { home: 'Taktik Tahtası', away: 'Transfer Odası', date: '15 Ağustos 2026', time: '18:00', status: 'finished', homeScore: 74, awayScore: 69 },
        { home: 'Son Dakika FK', away: 'Yeşil Tribün', date: '15 Ağustos 2026', time: '21:00', status: 'finished', homeScore: 70, awayScore: 70 }
      ],
      2: [
        { home: 'Macaton United', away: 'Boğazın Kartalları', date: '21 Ağustos 2026', time: '20:00', status: 'live', homeScore: 41, awayScore: 48 },
        { home: 'Fikstürspor', away: 'Taktik Tahtası', date: '21 Ağustos 2026', time: '20:00', status: 'scheduled' },
        { home: 'Transfer Odası', away: 'Son Dakika FK', date: '22 Ağustos 2026', time: '18:00', status: 'scheduled' },
        { home: 'Yeşil Tribün', away: 'Kadro Mühendisleri', date: '22 Ağustos 2026', time: '21:00', status: 'scheduled' }
      ],
      3: []
    }
  };

  // Supabase bağlıysa yayımlanan içerikleri ortak veritabanından getirir.
  // Bağlı değilse admin panelindeki yerel demo içerikleri aynı tarayıcıda gösterilir.
  window.FUTMAC_REMOTE_READY = Promise.resolve();
  if (window.FUTMAC_SUPABASE && window.FUTMAC_SUPABASE.enabled) {
    const backend = window.FUTMAC_SUPABASE;
    function optionalLoad(label, loader) {
      return loader().catch(function (error) {
        console.warn('FUTMAC ' + label + ' verileri yüklenemedi; sabit veriler kullanılıyor.');
        return null;
      });
    }
    window.FUTMAC_REMOTE_READY = Promise.all([
      optionalLoad('haber', function () { return backend.listArticles({ publishedOnly: true }); }),
      optionalLoad('kategori', function () { return backend.listCategories(); }),
      backend.leagueManagementEnabled ? optionalLoad('yazar', function () { return backend.listAuthors(); }) : Promise.resolve(null),
      backend.leagueManagementEnabled ? optionalLoad('puan durumu', function () { return backend.listStandings(); }) : Promise.resolve(null),
      backend.leagueManagementEnabled ? optionalLoad('fikstür', function () { return backend.listFixtures(); }) : Promise.resolve(null)
    ]).then(function (results) {
      const remoteArticles = results[0], remoteCategories = results[1], remoteAuthors = results[2], remoteStandings = results[3], remoteFixtures = results[4];
      if (remoteArticles) {
        const remoteSlugs = new Set(remoteArticles.map(function (article) { return article.slug; }));
        window.FUTMAC_DATA.articles = remoteArticles.concat(window.FUTMAC_DATA.articles.filter(function (article) { return !remoteSlugs.has(article.slug); }));
      }
      if (remoteCategories && remoteCategories.length) remoteCategories.forEach(function (category) {
        const current = window.FUTMAC_DATA.categories[category.id] || {};
        window.FUTMAC_DATA.categories[category.id] = Object.assign({}, current, { title:category.name, kicker:current.kicker || category.name.toUpperCase(), description:category.description || current.description || '', active:category.active, showInMenu:category.showInMenu, sortOrder:category.sortOrder || 0 });
      });
      if (remoteAuthors && remoteAuthors.length) window.FUTMAC_DATA.authors = remoteAuthors;
      if (remoteStandings && remoteStandings.length) {
        window.FUTMAC_DATA.standings = remoteStandings;
        const latest = remoteStandings.map(function (row) { return row.updatedAt; }).filter(Boolean).sort().pop();
        if (latest) window.FUTMAC_DATA.updatedAt = new Intl.DateTimeFormat('tr-TR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(latest));
      }
      if (remoteFixtures && Object.keys(remoteFixtures).length) window.FUTMAC_DATA.fixtures = remoteFixtures;
    });
    return;
  }
  try {
    const localArticles = JSON.parse(localStorage.getItem('futmac_admin_articles_v1') || '[]');
    if (Array.isArray(localArticles)) {
      const published = localArticles.filter(function (article) {
        const due = article && article.status === 'scheduled' && new Date(article.date + 'T' + article.time + ':00').getTime() <= Date.now();
        return article && (article.status === 'published' || due) && typeof article.title === 'string' && /^assets\/images\/[A-Za-z0-9_./-]+$/.test(article.image || '');
      });
      window.FUTMAC_DATA.articles = published.concat(window.FUTMAC_DATA.articles);
    }
  } catch (error) {
    // Bozuk yerel demo verisi ana sitenin açılmasını engellemez.
  }
}());
