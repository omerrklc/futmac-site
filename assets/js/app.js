(async function () {
  'use strict';

  document.querySelectorAll('[data-current-date]').forEach(function (item) {
    item.textContent = new Intl.DateTimeFormat('tr-TR', {
      day:'2-digit', month:'long', year:'numeric', weekday:'long'
    }).format(new Date()).toLocaleUpperCase('tr-TR');
  });
  const data = window.FUTMAC_DATA || null;
  async function waitForRemoteData() {
    if (!window.FUTMAC_REMOTE_READY) return 'local';
    let timeoutId;
    const timeout = new Promise(function (resolve) {
      timeoutId = window.setTimeout(function () { resolve('timeout'); }, 4500);
    });
    const remote = Promise.resolve(window.FUTMAC_REMOTE_READY).then(function () {
      return 'ready';
    }).catch(function () {
      return 'error';
    });
    const state = await Promise.race([remote, timeout]);
    window.clearTimeout(timeoutId);
    document.documentElement.dataset.remoteState = state;
    if (state === 'timeout') {
      remote.then(function (lateState) {
        document.documentElement.dataset.remoteState = lateState;
        document.dispatchEvent(new CustomEvent('futmac:remote-settled', { detail: { state: lateState } }));
      });
    }
    return state;
  }
  await waitForRemoteData();
  const body = document.body;
  const fileName = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const requestedCategory = new URLSearchParams(window.location.search).get('kategori');
  const section = body.dataset.section || (fileName === 'kategori.html' ? requestedCategory : ({
    'index.html': 'home', 'haber.html': 'futbol', 'futbol.html': 'futbol',
    'emac-ligi.html': 'emac', 'fantazi.html': 'fantazi', 'kurallar.html': 'fantazi',
    'transfer.html': 'transfer', 'yazarlar.html': 'yazarlar', 'arsiv.html': 'arsiv',
    'fikstur.html': 'fikstur', 'puan-durumu.html': 'puan'
  }[fileName] || ''));
  if (window.FUTMAC_SUPABASE && window.FUTMAC_SUPABASE.trackPageView && !body.classList.contains('admin-body')) {
    const pageKey='futmac_page_'+location.pathname+location.search;
    if(!sessionStorage.getItem(pageKey)){
      sessionStorage.setItem(pageKey,'1');
      let referrer='direct';try{const source=document.referrer&&new URL(document.referrer);if(source&&source.hostname!==location.hostname)referrer=source.hostname;}catch(error){}
      window.FUTMAC_SUPABASE.trackPageView(location.pathname+location.search,referrer).catch(function(){sessionStorage.removeItem(pageKey);});
    }
  }

  const defaultMainLinks = [
    ['home', 'index.html', 'ANA SAYFA'], ['futbol', 'futbol.html', 'FUTBOL'],
    ['emac', 'emac-ligi.html', 'E-MAC LİGİ'], ['puan', 'puan-durumu.html', 'PUAN DURUMU'],
    ['fikstur', 'fikstur.html', 'FİKSTÜR'], ['fantazi', 'fantazi.html', 'FANTAZİ'],
    ['transfer', 'transfer.html', 'TRANSFER'], ['yazarlar', 'yazarlar.html', 'YAZARLAR'], ['forum','forum.html','FORUM']
  ];
  const categoryPages = { futbol:'futbol.html', emac:'emac-ligi.html', fantazi:'fantazi.html', transfer:'transfer.html', yazarlar:'yazarlar.html', macaton:'macaton.html', haftanin11:'haftanin-11i.html', oduller:'oduller.html' };
  const managedCategories = data ? Object.keys(data.categories).filter(function (key) { return data.categories[key].active !== false && data.categories[key].showInMenu; }).sort(function (a,b) { return (data.categories[a].sortOrder||0)-(data.categories[b].sortOrder||0); }) : [];
  const fixedMainLinks = [['puan','puan-durumu.html','PUAN DURUMU'],['fikstur','fikstur.html','FİKSTÜR'],['forum','forum.html','FORUM']];
  const mainLinks = managedCategories.length ? [['home','index.html','ANA SAYFA']].concat(managedCategories.map(function (key) { return [key, categoryPages[key] || 'kategori.html?kategori=' + encodeURIComponent(key), data.categories[key].title.toUpperCase()]; }), fixedMainLinks) : defaultMainLinks;
  const utilityLinks = [
    ['forum', 'forum.html', 'FORUM'], ['fikstur', 'fikstur.html', 'FİKSTÜR'], ['puan', 'puan-durumu.html', 'PUAN DURUMU'],
    ['haftanin11', 'haftanin-11i.html', 'HAFTANIN 11’İ'],
    ['macaton', 'macaton.html', 'MACATON'], ['fantazi', 'kurallar.html', 'LİG MEVZUATI'],
    ['oduller', 'oduller.html', 'ÖDÜLLER'], ['arsiv', 'arsiv.html', 'ARŞİV']
  ];

  function linkMarkup(item) {
    const active = item[0] === section ? ' class="active" aria-current="page"' : '';
    return '<a' + active + ' href="' + item[1] + '">' + item[2] + '</a>';
  }

  const primaryNav = document.querySelector('.nav');
  const navInner = primaryNav && primaryNav.querySelector('.nav-inner');
  if (navInner) navInner.innerHTML = mainLinks.map(linkMarkup).join('');
  if (primaryNav && !document.querySelector('.utility-nav')) {
    const utilityNav = document.createElement('nav');
    utilityNav.className = 'utility-nav';
    utilityNav.setAttribute('aria-label', 'Hızlı bağlantılar');
    utilityNav.innerHTML = '<div class="wrap">' + utilityLinks.map(linkMarkup).join('') + '</div>';
    primaryNav.insertAdjacentElement('afterend', utilityNav);
  }
  document.querySelectorAll('.footer-inner nav').forEach(function (footerNav) {
    footerNav.setAttribute('aria-label', 'Alt menü');
    footerNav.innerHTML = '<a href="index.html">Ana Sayfa</a><a href="forum.html">Forum</a><a href="fikstur.html">Fikstür</a><a href="puan-durumu.html">Puan Durumu</a><a href="arsiv.html">Arşiv</a><a href="hakkimizda.html">Hakkımızda</a><a href="iletisim.html">İletişim</a><a href="gizlilik.html">Gizlilik</a><a href="kullanim-kosullari.html">Kullanım</a>';
  });

  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#ana-menu');
  function closeMenu(returnFocus) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Ana menüyü aç');
    menu.classList.remove('is-open');
    if (returnFocus) toggle.focus();
  }
  if (toggle && menu) {
    toggle.setAttribute('aria-label', 'Ana menüyü aç');
    toggle.addEventListener('click', function () {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) closeMenu(false);
      else {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Ana menüyü kapat');
        menu.classList.add('is-open');
        const firstLink = menu.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char];
    });
  }

  function applySiteSettings() {
    const settings = data && data.siteSettings;
    if (!settings) return;
    const wordmark = document.querySelector('.wordmark');
    if (wordmark) wordmark.innerHTML = escapeHtml(settings.siteName || 'FUTMAC') + '<small>' + escapeHtml(settings.tagline || '') + '</small>';
    const issue = document.querySelector('.header-meta strong'); if (issue) issue.textContent = settings.issueLabel || '';
    const season = document.querySelector('.header-meta span'); if (season) season.textContent = settings.seasonLabel || '';
    document.querySelectorAll('.footer-inner div span').forEach(function (item) { item.textContent = settings.footerText || ''; });
    const rule = document.querySelector('.budget-rule-highlight');
    if (rule) { rule.hidden = settings.ruleBannerVisible === false; rule.href = settings.ruleLink || 'kurallar.html'; const title=rule.querySelector('strong'),text=rule.querySelector('span'),label=rule.querySelector('b'); if(title)title.textContent=settings.ruleTitle||'';if(text)text.textContent=settings.ruleText||'';if(label)label.textContent=settings.ruleLinkLabel||''; }
    const breaking = document.querySelector('.breaking'); if (breaking) breaking.hidden = settings.breakingVisible === false;
    const writers = document.querySelector('.portal-writers'); if (writers) writers.hidden = settings.writersVisible === false;
    const homeNews = document.querySelector('[data-home-news]'); if (homeNews) homeNews.hidden = settings.mainNewsVisible === false;
    const sectionFor = function (selector) { const child=document.querySelector(selector); return child && child.closest('.portal-widget'); };
    const standings=sectionFor('[data-standings-body][data-compact]');if(standings)standings.hidden=settings.standingsVisible===false;
    const upcoming=sectionFor('[data-upcoming-matches]');if(upcoming)upcoming.hidden=settings.upcomingVisible===false;
    const latest=sectionFor('[data-latest-news]');if(latest)latest.hidden=settings.latestVisible===false;
    const recent=sectionFor('[data-recent-news]');if(recent)recent.hidden=settings.recentVisible===false;
    const matchCenter=document.querySelector('[data-match-center]');if(matchCenter)matchCenter.hidden=settings.matchCenterVisible===false;
    const promo=document.querySelector('.portal-promo');if(promo){promo.href=settings.promoLink||'kurallar.html';const promoTitle=promo.querySelector('strong'),promoText=promo.querySelector('span');if(promoTitle)promoTitle.textContent=settings.promoTitle||'';if(promoText)promoText.textContent=settings.promoText||'';}
    if(matchCenter){matchCenter.href=settings.matchCenterLink||'fikstur.html';const centerTitle=matchCenter.querySelector('strong');if(centerTitle)centerTitle.textContent=settings.matchCenterTitle||'';}
  }
  applySiteSettings();
  function categoryName(key) { return data && data.categories[key] ? data.categories[key].title : key; }
  function articleRow(article) {
 return '<article class="news-row"><a href="' + escapeHtml(article.url) + '"><img src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.imageAlt || article.title) + '"></a><div><div class="news-row__meta"><b>' + escapeHtml(categoryName(article.category).toUpperCase()) + '</b><time datetime="' + escapeHtml(article.date) + '">' + escapeHtml(article.displayDate) + ' · ' + escapeHtml(article.time) + '</time><span>' + escapeHtml(article.readTime) + '</span></div><h2><a href="' + escapeHtml(article.url) + '">' + escapeHtml(article.title) + '</a></h2><p>' + escapeHtml(article.excerpt) + '</p></div></article>';
  }
  function renderPagination(container, total, current, pageSize, onChange) {
    if (!container) return;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (pages <= 1) { container.innerHTML = ''; return; }
    let html = '<button type="button" data-page="' + Math.max(1, current - 1) + '"' + (current === 1 ? ' disabled' : '') + ' aria-label="Önceki sayfa">‹</button>';
    for (let page = 1; page <= pages; page += 1) html += '<button type="button" data-page="' + page + '" class="' + (page === current ? 'active' : '') + '" aria-label="' + page + '. sayfa">' + page + '</button>';
    html += '<button type="button" data-page="' + Math.min(pages, current + 1) + '"' + (current === pages ? ' disabled' : '') + ' aria-label="Sonraki sayfa">›</button>';
    container.innerHTML = html;
    container.querySelectorAll('button:not([disabled])').forEach(function (button) { button.addEventListener('click', function () { onChange(Number(button.dataset.page)); }); });
  }

  function renderCategoryPage() {
    const results = document.querySelector('[data-category-results]');
    if (!results || !data) return;
 const key = body.dataset.category || new URLSearchParams(window.location.search).get('kategori');
    const category = data.categories[key];
    const all = key === 'yazarlar' ? data.articles.filter(function (item) { return item.type === 'yazi'; }) : data.articles.filter(function (item) { return item.category === key; });
    const status = document.querySelector('[data-category-status]');
    const pagination = document.querySelector('[data-category-pagination]');
    const pageSize = 4;
    let currentPage = 1;
    const feature = document.querySelector('.listing-feature');
    if (feature) {
      if (!all.length) feature.remove();
      else feature.innerHTML = '<img src="' + escapeHtml(all[0].image) + '" alt="' + escapeHtml(all[0].imageAlt || all[0].title) + '"><div><small>ÖNE ÇIKAN</small><h2><a href="' + escapeHtml(all[0].url) + '">' + escapeHtml(all[0].title) + '</a></h2><p>' + escapeHtml(all[0].excerpt) + '</p></div>';
    }
    function draw() {
      const items = all.slice((currentPage - 1) * pageSize, currentPage * pageSize);
      results.innerHTML = items.length ? items.map(articleRow).join('') : '<div class="state-panel"><strong>Bu bölümde henüz içerik yok.</strong><span>Yeni içerikler yayımlandığında burada görünecek.</span></div>';
      if (status) status.textContent = all.length + ' içerik gösteriliyor.';
      renderPagination(pagination, all.length, currentPage, pageSize, function (page) { currentPage = page; draw(); results.focus(); });
    }
    if (category) {
      const title = document.querySelector('[data-category-title]');
      const kicker = document.querySelector('[data-category-kicker]');
      const description = document.querySelector('[data-category-description]');
      if (title) title.textContent = category.title;
      if (kicker) kicker.textContent = category.kicker;
      if (description) description.textContent = category.description;
      if (fileName === 'kategori.html') document.title = category.title + ' | FUTMAC';
    }
    draw();
  }

  function renderArchive() {
    const results = document.querySelector('[data-archive-results]');
    if (!results || !data) return;
    const search = document.querySelector('#archive-search');
    const category = document.querySelector('#archive-category');
    const author = document.querySelector('#archive-author');
    const month = document.querySelector('#archive-month');
    const reset = document.querySelector('[data-filter-reset]');
    const status = document.querySelector('[data-archive-status]');
    const pagination = document.querySelector('[data-archive-pagination]');
    const params = new URLSearchParams(window.location.search);
    const authorOptions = new Map();
    (data.authors || []).filter(function (item) { return item.active !== false; }).forEach(function (item) { authorOptions.set(item.id, item.name); });
    data.articles.forEach(function (item) { if (item.author && !item.authorId) authorOptions.set(item.author, item.author); });
    author.innerHTML = '<option value="all">Tüm yazarlar</option>' + Array.from(authorOptions).map(function (item) { return '<option value="' + escapeHtml(item[0]) + '">' + escapeHtml(item[1]) + '</option>'; }).join('');
    search.value = params.get('q') || ''; category.value = params.get('kategori') || 'all'; author.value = Array.from(author.options).some(function(option){return option.value===(params.get('yazar')||'all');})?(params.get('yazar')||'all'):'all'; month.value = params.get('ay') || 'all';
    let currentPage = Number(params.get('sayfa')) || 1;
    const pageSize = 5;
    function selectedItems() {
      const query = search.value.toLocaleLowerCase('tr-TR').trim();
      return data.articles.filter(function (item) {
        return (!query || (item.title + ' ' + item.excerpt + ' ' + item.author).toLocaleLowerCase('tr-TR').includes(query)) &&
          (category.value === 'all' || item.category === category.value) &&
          (author.value === 'all' || item.authorId === author.value || item.author === author.value) &&
          (month.value === 'all' || item.date.slice(0, 7) === month.value);
      });
    }
    function updateUrl() {
      const next = new URLSearchParams();
      if (search.value) next.set('q', search.value); if (category.value !== 'all') next.set('kategori', category.value); if (author.value !== 'all') next.set('yazar', author.value); if (month.value !== 'all') next.set('ay', month.value); if (currentPage > 1) next.set('sayfa', String(currentPage));
      if (window.location.protocol !== 'file:') window.history.replaceState({}, '', window.location.pathname + (next.toString() ? '?' + next.toString() : '') + window.location.hash);
    }
    function draw() {
      const items = selectedItems(); const pageCount = Math.max(1, Math.ceil(items.length / pageSize)); if (currentPage > pageCount) currentPage = pageCount;
      const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
      results.innerHTML = pageItems.length ? pageItems.map(articleRow).join('') : '<div class="state-panel"><strong>Sonuç bulunamadı.</strong><span>Arama kelimesini veya filtreleri değiştirin.</span></div>';
      status.textContent = items.length + ' sonuç bulundu.';
      renderPagination(pagination, items.length, currentPage, pageSize, function (page) { currentPage = page; updateUrl(); draw(); results.focus(); }); updateUrl();
    }
    [search, category, author, month].forEach(function (control) { control.addEventListener(control === search ? 'input' : 'change', function () { currentPage = 1; draw(); }); });
    reset.addEventListener('click', function () { search.value = ''; category.value = 'all'; author.value = 'all'; month.value = 'all'; currentPage = 1; draw(); search.focus(); });
    draw();
  }

  function formMarkup(form) { return form.map(function (result) { return '<i class="form ' + (result === 'G' ? 'win' : result === 'M' ? 'loss' : 'draw') + '">' + result + '</i>'; }).join(''); }
  function renderStandings() {
    const standingsMode=data&&data.standings[0]&&data.standings[0].sortMode||'automatic';const standingsNote=document.querySelector('.standings-note');if(standingsNote)standingsNote.innerHTML=standingsMode==='manual'?'<strong>Sıralama yöntemi:</strong> Yönetici tarafından belirlenen manuel lig sırası kullanılıyor.':'<strong>Sıralama ölçütü:</strong> Önce lig puanı esas alınır. Lig puanlarının eşit olması hâlinde toplam fantazi puanı averaj olarak değerlendirilir.';
    const standingsIntro=document.querySelector('.listing-intro p');if(standingsIntro&&body.dataset.section==='puan')standingsIntro.textContent='E-Mac fantazi liginin güncel '+(data?data.standings.length:0)+' takım, yönetici ve puan verisi.';
    const standingsSummary=document.querySelector('.archive-summary');if(standingsSummary&&body.dataset.section==='puan'&&!standingsSummary.querySelector('[data-standing-count]'))standingsSummary.insertAdjacentHTML('beforeend','<span><strong data-standing-count>'+(data?data.standings.length:0)+'</strong> takım listeleniyor</span>');
    const prototypeNote=document.querySelector('.prototype-note');if(prototypeNote&&body.dataset.section==='puan')prototypeNote.remove();
    document.querySelectorAll('[data-standings-body]').forEach(function (container) {
      if (!data) return;
      const compact = container.hasAttribute('data-compact'); const items = compact ? data.standings.slice(0, 5) : data.standings;
      container.innerHTML = items.map(function (team) {
        if (compact) return '<tr><td>' + team.rank + '</td><td><a href="puan-durumu.html">' + escapeHtml(team.team) + '</a></td><td><b>' + team.points + '</b></td></tr>';
        const rowClass = team.rank <= 3 ? 'podium' : team.rank >= data.standings.length - 1 ? 'danger' : ''; const change = team.change === 'up' ? '▲' : team.change === 'down' ? '▼' : '•';
        return '<tr class="' + rowClass + '"><td><b>' + team.rank + '</b> <span class="rank-change ' + team.change + '" aria-label="Sıra değişimi">' + change + '</span></td><td><strong>' + escapeHtml(team.team) + '</strong><span class="manager-name">' + escapeHtml(team.manager) + '</span></td><td>' + team.played + '</td><td>' + team.won + '</td><td>' + team.drawn + '</td><td>' + team.lost + '</td><td><b>' + team.fantasy + '</b></td><td><b>' + team.points + '</b></td><td>' + formMarkup(team.form) + '</td></tr>';
      }).join('');
    });
    document.querySelectorAll('[data-updated-at]').forEach(function (item) { if (data) item.textContent = data.updatedAt; });
  }

  function renderFixtures() {
    const list = document.querySelector('[data-fixture-list]');
    if (!list || !data) return;
    const select = document.querySelector('#week-select'); const prev = document.querySelector('[data-week-prev]'); const next = document.querySelector('[data-week-next]'); const status = document.querySelector('[data-fixture-status]'); const weeks = Object.keys(data.fixtures).map(Number);
    let currentWeek = Number(new URLSearchParams(window.location.search).get('hafta')) || 2;
    function draw() {
      const matches = data.fixtures[currentWeek] || []; select.value = String(currentWeek); prev.disabled = currentWeek <= Math.min.apply(null, weeks); next.disabled = currentWeek >= Math.max.apply(null, weeks); status.textContent = currentWeek + '. hafta, ' + matches.length + ' karşılaşma.';
      list.innerHTML = matches.length ? matches.map(function (match) {
        const live = match.status === 'live'; const finished = match.status === 'finished'; const label = live ? 'CANLI' : finished ? 'TAMAMLANDI' : 'PROGRAM'; const score = live || finished ? match.homeScore + ' - ' + match.awayScore : match.time;
        return '<article class="fixture-card"><div class="fixture-card__date"><strong>' + escapeHtml(match.date) + '</strong><span class="match-status ' + match.status + '">' + label + '</span></div><div class="fixture-team">' + escapeHtml(match.home) + '</div><div class="fixture-score">' + escapeHtml(score) + '</div><div class="fixture-team">' + escapeHtml(match.away) + '</div></article>';
      }).join('') : '<div class="state-panel"><strong>Bu hafta için henüz maç bulunmuyor.</strong><span>Fikstür açıklandığında karşılaşmalar burada görünecek.</span></div>';
      if (window.location.protocol !== 'file:') window.history.replaceState({}, '', window.location.pathname + '?hafta=' + currentWeek);
    }
    select.addEventListener('change', function () { currentWeek = Number(select.value); draw(); }); prev.addEventListener('click', function () { if (!prev.disabled) { currentWeek -= 1; draw(); } }); next.addEventListener('click', function () { if (!next.disabled) { currentWeek += 1; draw(); } }); draw();
  }

  function authorEmailMarkup(author) {
    const email = String(author && author.email || '').trim();
    if (!email || email.length > 254 || !/^[^\s<>"@]+@[^\s<>"@]+\.[^\s<>"@]+$/.test(email)) return '';
    return '<span class="author-public-email" style="display:block;overflow-wrap:anywhere">E-posta: <a href="mailto:' + encodeURIComponent(email) + '">' + escapeHtml(email) + '</a></span>';
  }

  function renderAuthors() {
    const grid = document.querySelector('[data-authors-grid]');
    if (grid && data) grid.innerHTML = data.authors.map(function (author) { return '<article class="author-profile-card"><header><img src="' + escapeHtml(author.image) + '" alt="' + escapeHtml(author.name) + ' vesikalık fotoğrafı"><div><small>FUTMAC YAZARI</small><h2>' + escapeHtml(author.name) + '</h2><span>' + escapeHtml(author.role) + '</span></div></header><p>' + escapeHtml(author.bio) + '</p>' + authorEmailMarkup(author) + '<a href="' + escapeHtml(author.profile) + '">YAZAR PROFİLİ VE TÜM YAZILARI »</a></article>'; }).join('');
    const profileList = document.querySelector('[data-author-articles]');
    const requestedAuthor = new URLSearchParams(window.location.search).get('id') || body.dataset.author;
    const profileRoot = document.querySelector('[data-author-profile]');
    const selectedAuthor = data && requestedAuthor ? data.authors.find(function (author) { return author.id === requestedAuthor && author.active !== false; }) : null;
    if (profileRoot) {
      if (!selectedAuthor) { profileRoot.innerHTML = '<div class="state-panel"><strong>Yazar bulunamadı.</strong><span>Yazar kaldırılmış veya pasif duruma alınmış olabilir.</span><p><a class="read-more" href="yazarlar.html">Tüm yazarları aç</a></p></div>'; document.title='Yazar bulunamadı | FUTMAC'; }
      else { profileRoot.innerHTML = '<nav class="breadcrumb" aria-label="İçerik yolu"><a href="index.html">Ana Sayfa</a><span>›</span><a href="yazarlar.html">Köşe Yazıları</a><span>›</span><span>'+escapeHtml(selectedAuthor.name)+'</span></nav><section class="author-profile-hero"><img src="'+escapeHtml(selectedAuthor.image)+'" alt="'+escapeHtml(selectedAuthor.name)+' vesikalık fotoğrafı"><div><span>FUTMAC YAZARI</span><h1>'+escapeHtml(selectedAuthor.name)+'</h1><strong>'+escapeHtml(selectedAuthor.role)+'</strong><p>'+escapeHtml(selectedAuthor.bio || '')+'</p>'+authorEmailMarkup(selectedAuthor)+'<a class="read-more" href="yazarlar.html">← Tüm yazarlar</a></div></section>'; document.title=selectedAuthor.name+' | FUTMAC'; const descriptionTag=document.querySelector('meta[name="description"]');if(descriptionTag)descriptionTag.content=(selectedAuthor.bio||selectedAuthor.name+' FUTMAC yazar profili.'); }
    }
    if (profileList && data) { const items = requestedAuthor ? data.articles.filter(function (article) { return article.authorId === requestedAuthor; }) : []; profileList.innerHTML = items.length ? items.map(articleRow).join('') : '<div class="state-panel"><strong>Bu yazara ait yayımlanmış içerik yok.</strong></div>'; }
  }

  function renderLocalArticle() {
    const container = document.querySelector('[data-local-article]');
    if (!container || !data) return;
    const params = new URLSearchParams(window.location.search);
    const previewMode = params.get('preview') === '1';
    const aside = document.querySelector('[data-dynamic-aside]');
    let robots = document.head.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
    let article = null;
    if (previewMode) {
      robots.content = 'noindex,nofollow';
      try { article = JSON.parse(sessionStorage.getItem('futmac_admin_preview_v1') || 'null'); } catch (error) { article = null; }
      if (aside) aside.innerHTML = '<section class="side-module"><h2>ÖNİZLEME</h2><p style="padding:8px">Bu görünüm yalnızca hazırladığınız içeriği kontrol etmek içindir.</p><a href="admin.html">Yönetim paneline dön »</a></section>';
    } else {
      const pathMatch = window.location.pathname.match(/\/(?:haber|paylas)\/([0-9a-f-]{36})(?:-[a-z0-9]+)?\.html$/i);
      const id = params.get('id') || (pathMatch && pathMatch[1]);
      article = data.articles.find(function (item) { return (item.local || item.remote || item.dynamic) && item.id === id; }) || null;
    }
    if (!article && !previewMode && (document.documentElement.dataset.remoteState === 'timeout' || window.FUTMAC_ARTICLE_LOAD_FAILED)) {
      const pending = document.documentElement.dataset.remoteState === 'timeout';
      container.innerHTML = '<h1>' + (pending ? 'Haber yükleniyor…' : 'Bağlantı kurulamadı') + '</h1><p>' + (pending ? 'Bağlantı yavaş; haber hazır olduğunda burada açılacak.' : 'Bu bir silinmiş haber uyarısı değildir. İnternet bağlantınızı kontrol edip yeniden deneyin.') + '</p><a class="pdf-button" href="' + escapeHtml(location.href) + '">YENİDEN DENE</a>';
      return;
    }
    if (!article) {
      robots.content = 'noindex,nofollow';
      container.innerHTML = '<nav class="breadcrumb" aria-label="İçerik yolu"><a href="index.html">Ana Sayfa</a><span>›</span><span>İçerik</span></nav><span class="news-kicker">BULUNAMADI</span><h1>İçerik bulunamadı</h1><p class="dek">Bu içerik silinmiş, taslak durumda veya henüz yayımlanmamış olabilir.</p><p><a class="pdf-button" href="index.html">ANA SAYFAYA DÖN</a></p>';
      document.title = 'İçerik Bulunamadı | FUTMAC';
      return;
    }
    robots.content = article.status === 'published' ? 'index,follow' : 'noindex,nofollow';
    const paragraphs = String(article.content || '').split(/\n\s*\n/).filter(Boolean).map(function (paragraph, index) { return '<p' + (index === 0 ? ' class="dropcap"' : '') + '>' + escapeHtml(paragraph) + '</p>'; }).join('');
 container.innerHTML = '<nav class="breadcrumb" aria-label="İçerik yolu"><a href="index.html">Ana Sayfa</a><span>›</span><a href="arsiv.html">Arşiv</a><span>›</span><span>İçerik</span></nav><span class="news-kicker">' + escapeHtml(categoryName(article.category).toUpperCase()) + '</span><h1>' + escapeHtml(article.title) + '</h1><p class="dek">' + escapeHtml(article.excerpt) + '</p><div class="article-meta-line"><span><strong>' + escapeHtml(article.author) + '</strong>' + authorEmailMarkup((data.authors || []).find(function (author) { return author.active !== false && author.id === article.authorId; })) + '</span><time datetime="' + escapeHtml(article.date + 'T' + article.time) + '">' + escapeHtml(article.displayDate + ', ' + article.time) + '</time><span>Okuma süresi: ' + escapeHtml(article.readTime) + '</span></div><img class="article-hero" src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.imageAlt || article.title) + '"><p class="caption">FUTMAC Haber Merkezi</p>' + paragraphs + '<div class="share-row"><button type="button" data-copy-link>BAĞLANTIYI KOPYALA</button><span class="copy-status" aria-live="polite"></span></div><nav class="story-navigation" aria-label="İçerik bağlantıları"><a href="index.html"><span>‹ ANA SAYFA</span>FUTMAC gündemine dön</a><a href="arsiv.html"><span>ARŞİV ›</span>Bütün içerikler</a></nav>';
    document.title = article.title + ' | FUTMAC';
    const descriptionTag = document.querySelector('meta[name="description"]'); if (descriptionTag) descriptionTag.content = article.excerpt;
    if (!previewMode && article.status === 'published' && window.FUTMAC_SUPABASE && window.FUTMAC_SUPABASE.trackArticleView) {
      const viewKey = 'futmac_viewed_' + article.id;
      if (!sessionStorage.getItem(viewKey)) {
        sessionStorage.setItem(viewKey, '1');
        window.FUTMAC_SUPABASE.trackArticleView(article.id).catch(function () { sessionStorage.removeItem(viewKey); });
      }
    }
  }

  function renderLocalHomepage() {
    const homeNews = document.querySelector('[data-home-news]');
    if (!homeNews || !data) return;
    const items = data.articles.filter(function (item) { return item.status === 'published'; });
    const writerStrip = document.querySelector('.portal-writers');
    if (writerStrip && Array.isArray(data.authors)) {
      writerStrip.querySelectorAll('article').forEach(function (item) { item.remove(); });
      data.authors.filter(function (author) { return author.active !== false; }).forEach(function (author) {
        const latestArticle = items.find(function (article) { return article.authorId === author.id || article.author === author.name; });
        writerStrip.insertAdjacentHTML('beforeend','<article><div><strong>'+escapeHtml(author.name)+'</strong><span>'+escapeHtml(author.role || 'YAZAR')+'</span><a href="'+escapeHtml(latestArticle ? latestArticle.url : author.profile || 'yazarlar.html')+'">'+escapeHtml(latestArticle ? latestArticle.title : 'Yazar profili ve yazıları')+'</a></div><img src="'+escapeHtml(author.image)+'" alt="'+escapeHtml(author.name)+'"></article>');
      });
      if (!writerStrip.querySelector('article')) writerStrip.hidden = true;
    }
    if (!items.length) homeNews.innerHTML = '<div class="state-panel"><strong>Henüz yayımlanmış haber yok.</strong><span>Yönetim panelinden yayımlanan ilk haber burada görünecek.</span></div>';
    else {
      const lead = items[0];
      homeNews.innerHTML = '<article class="portal-main-story"><a href="' + escapeHtml(lead.url) + '"><img src="' + escapeHtml(lead.image) + '" alt="' + escapeHtml(lead.imageAlt || lead.title) + '"></a><div><span>' + escapeHtml(categoryName(lead.category).toUpperCase()) + '</span><h2><a href="' + escapeHtml(lead.url) + '">' + escapeHtml(lead.title) + '</a></h2><p>' + escapeHtml(lead.excerpt) + '</p><a class="portal-more" href="' + escapeHtml(lead.url) + '">Haberi oku »</a></div></article>' + items.slice(1).map(function (article) { return '<article class="portal-news"><img src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.imageAlt || article.title) + '"><div><span>' + escapeHtml(categoryName(article.category).toUpperCase()) + '</span><h2><a href="' + escapeHtml(article.url) + '">' + escapeHtml(article.title) + '</a></h2><p>' + escapeHtml(article.excerpt) + '</p></div></article>'; }).join('');
    }
    const settings = data.siteSettings || {};
    const parseManualRows = function (text) {
      return String(text || '').split(/\r?\n/).map(function (line) {
        const parts = line.split('|').map(function (part) { return part.trim(); });
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        const url = parts.slice(2).join('|').trim() || 'index.html';
        if (!/^(?:[a-z0-9][a-z0-9-]*\.html(?:[?#][^\s]*)?|https:\/\/[^\s]+)$/i.test(url)) return null;
        return { label:parts[0], title:parts[1], url:url };
      }).filter(Boolean).slice(0, 20);
    };
    const latest = items.slice(0, 5);
    const manualBreaking = settings.breakingManual ? parseManualRows(settings.breakingItemsText) : null;
    const ticker = document.querySelector('[data-breaking-ticker]');
    if (ticker) ticker.innerHTML = manualBreaking ? (manualBreaking.length ? manualBreaking.map(function (item, index) { return (index ? '<i>•</i>' : '') + '<a href="' + escapeHtml(item.url) + '"><span>' + escapeHtml(item.title) + '</span></a>'; }).join('') : '<span>Henüz manuel son dakika eklenmedi.</span>') : (latest.length ? latest.map(function (article, index) { return (index ? '<i>•</i>' : '') + '<a href="' + escapeHtml(article.url) + '"><span>' + escapeHtml(article.title) + '</span></a>'; }).join('') : '<span>Henüz yayımlanmış haber yok.</span>');
    const latestList = document.querySelector('[data-latest-news]');
    if (latestList) latestList.innerHTML = manualBreaking ? (manualBreaking.length ? manualBreaking.map(function (item) { return '<li><time>' + escapeHtml(item.label) + '</time><a href="' + escapeHtml(item.url) + '">' + escapeHtml(item.title) + '</a></li>'; }).join('') : '<li>Henüz manuel son dakika eklenmedi.</li>') : (latest.length ? latest.map(function (article) { return '<li><time>' + escapeHtml(article.time || '--:--') + '</time><a href="' + escapeHtml(article.url) + '">' + escapeHtml(article.title) + '</a></li>'; }).join('') : '<li>Henüz haber yok.</li>');
    const recentList = document.querySelector('[data-recent-news]');
    const popular = items.slice().sort(function (a,b) { return (b.viewCount || 0) - (a.viewCount || 0) || String(b.date+b.time).localeCompare(String(a.date+a.time)); }).slice(0,5);
    if (recentList) recentList.innerHTML = popular.length ? popular.map(function (article) { return '<li><a href="' + escapeHtml(article.url) + '">' + escapeHtml(article.title) + '</a>'+(article.viewCount?'<small>'+escapeHtml(article.viewCount.toLocaleString('tr-TR'))+' okunma</small>':'')+'</li>'; }).join('') : '<li>Henüz haber yok.</li>';
    const fixtureList = document.querySelector('[data-upcoming-matches]');
    if (fixtureList) {
      const manualMatches = settings.upcomingManual ? parseManualRows(settings.upcomingItemsText) : null;
      const matches = Object.keys(data.fixtures || {}).reduce(function (all, week) { return all.concat((data.fixtures[week] || []).map(function (match) { return Object.assign({ week:week }, match); })); }, []).filter(function (match) { return match.status !== 'finished'; }).sort(function (a, b) { return String(a.kickoffAt || a.date).localeCompare(String(b.kickoffAt || b.date)); }).slice(0, 5);
      fixtureList.innerHTML = manualMatches ? (manualMatches.length ? manualMatches.map(function (item) { return '<li><time>' + escapeHtml(item.label) + '</time><a href="' + escapeHtml(item.url) + '">' + escapeHtml(item.title) + '</a></li>'; }).join('') : '<li>Henüz manuel yaklaşan maç eklenmedi.</li>') : (matches.length ? matches.map(function (match) { const label = match.status === 'live' ? 'CANLI' : String(match.date || '').replace(/\s+\d{4}$/, ''); return '<li><time>' + escapeHtml(label) + '</time><a href="fikstur.html?hafta=' + encodeURIComponent(match.week) + '">' + escapeHtml(match.home + ' - ' + match.away) + '</a></li>'; }).join('') : '<li>Henüz yaklaşan maç eklenmedi.</li>');
    }
  }

  renderLocalArticle();
  renderLocalHomepage();

  document.addEventListener('click', async function (event) {
    const button = event.target.closest('[data-copy-link]');
    if (!button) return;
    const status = button.parentElement.querySelector('.copy-status');
    const path = location.pathname.match(/\/(?:haber|paylas)\/([0-9a-f-]{36})(?:-[a-z0-9]+)?\.html$/i);
    const id = new URLSearchParams(location.search).get('id') || (path && path[1]);
    button.disabled = true;
    let link = {url:location.href, ready:true};
    try {
      if (id && window.FUTMAC_SUPABASE) link = await window.FUTMAC_SUPABASE.getShareLink(id);
      await navigator.clipboard.writeText(link.url);
      if (status) status.textContent = link.ready ? 'Paylaşım bağlantısı kopyalandı.' : 'Okuma bağlantısı kopyalandı. WhatsApp görsel önizlemesi yayın hazırlanırken henüz hazır olmayabilir.';
    } catch (error) { if (status) status.textContent = 'Bağlantı: ' + link.url; }
    finally { button.disabled = false; }
  });
  document.addEventListener('futmac:remote-settled', function () {
    renderLocalArticle(); renderLocalHomepage(); renderCategoryPage(); renderArchive(); renderStandings(); renderFixtures(); renderAuthors();
  });
  const ruleSelect = document.querySelector('#rule-section-select');
  if (ruleSelect) ruleSelect.addEventListener('change', function () { const target = document.querySelector(ruleSelect.value); if (target) { target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); target.setAttribute('tabindex', '-1'); target.focus({ preventScroll:true }); } });

  function ensureMeta(property, content, isName) {
    const selector = isName ? 'meta[name="' + property + '"]' : 'meta[property="' + property + '"]'; let tag = document.head.querySelector(selector);
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute(isName ? 'name' : 'property', property); document.head.appendChild(tag); } tag.setAttribute('content', content);
  }
  const canonicalBase = 'https://futmac.com.tr/'; let canonical = document.head.querySelector('link[rel="canonical"]');
  const socialPathMatch = window.location.pathname.match(/\/(?:haber|paylas)\/([0-9a-f-]{36})(?:-[a-z0-9]+)?\.html$/i);
  const dynamicId = fileName === 'haber-onizleme.html' ? new URLSearchParams(window.location.search).get('id') : socialPathMatch && socialPathMatch[1];
  const authorId = fileName === 'yazar.html' ? new URLSearchParams(window.location.search).get('id') : '';
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); } canonical.href = dynamicId ? canonicalBase + 'haber/' + encodeURIComponent(dynamicId) + '.html' : canonicalBase + fileName + (authorId ? '?id=' + encodeURIComponent(authorId) : '');
  const description = (document.head.querySelector('meta[name="description"]') || {}).content || 'E-Mac Turka Fantazi Ligi haberleri ve lig merkezi.';
  const renderedHero = document.querySelector('.article-hero'); const socialImage = renderedHero ? new URL(renderedHero.getAttribute('src'), document.baseURI).href : canonicalBase + 'assets/images/logo/emac-turka.png';
  ensureMeta('og:title', document.title, false); ensureMeta('og:description', description, false); ensureMeta('og:type', body.dataset.schema === 'article' ? 'article' : 'website', false); ensureMeta('og:url', canonical.href, false); ensureMeta('og:image', socialImage, false); ensureMeta('twitter:card', 'summary_large_image', true); ensureMeta('twitter:title', document.title, true); ensureMeta('twitter:description', description, true); ensureMeta('twitter:image', socialImage, true);
  if (!document.head.querySelector('link[rel="icon"]')) { const icon = document.createElement('link'); icon.rel = 'icon'; icon.href = 'assets/images/logo/emac-turka-transparent.png'; document.head.appendChild(icon); }
  if (body.dataset.schema === 'article' && !document.querySelector('script[data-structured]')) {
    const articleTitle = document.querySelector('h1'); const published = document.querySelector('time[datetime]'); const json = document.createElement('script'); json.type = 'application/ld+json'; json.dataset.structured = 'true';
    json.textContent = JSON.stringify({ '@context':'https://schema.org', '@type': body.classList.contains('column') ? 'Article' : 'NewsArticle', headline: articleTitle ? articleTitle.textContent.trim() : document.title, datePublished: published ? published.getAttribute('datetime') : '2026-08-20', publisher: { '@type':'Organization', name:'FUTMAC', logo:{ '@type':'ImageObject', url:canonicalBase + 'assets/images/logo/emac-turka.png' } }, mainEntityOfPage: canonical.href }); document.head.appendChild(json);
  }

  renderCategoryPage(); renderArchive(); renderStandings(); renderFixtures(); renderAuthors();
}());
