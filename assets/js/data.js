(function () {
  'use strict';

  window.FUTMAC_DATA = {
    updatedAt: '20 Ağustos 2026, 15:30',
    categories: {
      futbol: { title: 'Futbol', kicker: 'SAHADAN HABERLER', description: 'Haftanın karşılaşmaları, maç önü notları ve futbol gündemi.' },
      emac: { title: 'E-Mac Ligi', kicker: 'LİGİN NABZI', description: 'E-Mac Turka Süper Ligi’nden duyurular, rekabet ve yönetim haberleri.' },
      fantazi: { title: 'Fantazi', kicker: 'KADRO REHBERİ', description: 'Bütçe, puanlama, kadro seçimi ve mevzuatın oyuna etkisi.' },
      transfer: { title: 'Transfer', kicker: 'SON HAMLELER', description: 'Haftalık transfer planları, fiyat-performans adayları ve kadro önerileri.' },
      yazarlar: { title: 'Köşe Yazıları', kicker: 'FUTMAC YAZARLARI', description: 'FUTMAC yazarlarının güncel değerlendirmeleri ve köşe yazıları.' },
      macaton: { title: 'Macaton', kicker: 'HAFTANIN PROGRAMI', description: 'Haftanın oyuncusu, sürpriz performansı ve programdan öne çıkanlar.' },
      haftanin11: { title: 'Haftanın 11’i', kicker: 'EDİTÖRÜN SEÇİMİ', description: 'Fikstür ve form durumuna göre haftanın örnek fantazi kadrosu.' },
      oduller: { title: 'Ödüller', kicker: '2026-2027 ÖDÜL DOSYASI', description: 'Şampiyonluk, içerik, aylık performans ve özel ödüllerin özeti.' }
    },
    // Yazarlar ve içerikler yalnızca yönetim paneli/Supabase kaynağından gelir.
    // Eski örnek kayıtlar canlı sitede gerçek içeriklerle karışmasın diye tutulmaz.
    authors: [],
    articles: [],
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
      backend.leagueManagementEnabled ? optionalLoad('fikstür', function () { return backend.listFixtures(); }) : Promise.resolve(null),
      backend.getSiteSettings ? optionalLoad('site ayarı', function () { return backend.getSiteSettings(); }) : Promise.resolve(null)
    ]).then(function (results) {
      const remoteArticles = results[0], remoteCategories = results[1], remoteAuthors = results[2], remoteStandings = results[3], remoteFixtures = results[4], remoteSettings = results[5];
      if (Array.isArray(remoteArticles)) window.FUTMAC_DATA.articles = remoteArticles;
      if (remoteCategories && remoteCategories.length) remoteCategories.forEach(function (category) {
        const current = window.FUTMAC_DATA.categories[category.id] || {};
        window.FUTMAC_DATA.categories[category.id] = Object.assign({}, current, { title:category.name, kicker:current.kicker || category.name.toUpperCase(), description:category.description || current.description || '', active:category.active, showInMenu:category.showInMenu, sortOrder:category.sortOrder || 0 });
      });
      if (Array.isArray(remoteAuthors)) window.FUTMAC_DATA.authors = remoteAuthors;
      if (Array.isArray(remoteArticles) && Array.isArray(remoteAuthors)) {
        const authorByName = new Map(remoteAuthors.map(function (author) {
          return [String(author.name || '').toLocaleLowerCase('tr-TR').trim(), author];
        }));
        window.FUTMAC_DATA.articles.forEach(function (article) {
          const matched = authorByName.get(String(article.author || '').toLocaleLowerCase('tr-TR').trim());
          if (!article.authorId && matched) article.authorId = matched.id;
          if (matched) article.author = matched.name;
        });
      }
      if (Array.isArray(remoteStandings)) {
        window.FUTMAC_DATA.standings = remoteStandings;
        const latest = remoteStandings.map(function (row) { return row.updatedAt; }).filter(Boolean).sort().pop();
        if (latest) window.FUTMAC_DATA.updatedAt = new Intl.DateTimeFormat('tr-TR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(latest));
      }
      if (remoteFixtures && typeof remoteFixtures === 'object') window.FUTMAC_DATA.fixtures = remoteFixtures;
      if (remoteSettings && typeof remoteSettings === 'object') window.FUTMAC_DATA.siteSettings = remoteSettings;
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
