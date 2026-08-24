(async function () {
  'use strict';

  const data = window.FUTMAC_DATA || null;
  if (window.FUTMAC_REMOTE_READY) await window.FUTMAC_REMOTE_READY;
  const body = document.body;
  const fileName = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const requestedCategory = new URLSearchParams(window.location.search).get('kategori');
  const section = body.dataset.section || (fileName === 'kategori.html' ? requestedCategory : ({
    'index.html': 'home', 'haber.html': 'futbol', 'futbol.html': 'futbol',
    'emac-ligi.html': 'emac', 'fantazi.html': 'fantazi', 'kurallar.html': 'fantazi',
    'transfer.html': 'transfer', 'yazarlar.html': 'yazarlar', 'arsiv.html': 'arsiv',
    'fikstur.html': 'fikstur', 'puan-durumu.html': 'puan'
  }[fileName] || ''));

  const defaultMainLinks = [
    ['home', 'index.html', 'ANA SAYFA'], ['futbol', 'futbol.html', 'FUTBOL'],
    ['emac', 'emac-ligi.html', 'E-MAC LİGİ'], ['puan', 'puan-durumu.html', 'PUAN DURUMU'],
    ['fikstur', 'fikstur.html', 'FİKSTÜR'], ['fantazi', 'fantazi.html', 'FANTAZİ'],
    ['transfer', 'transfer.html', 'TRANSFER'], ['yazarlar', 'yazarlar.html', 'YAZARLAR']
  ];
  const categoryPages = { futbol:'futbol.html', emac:'emac-ligi.html', fantazi:'fantazi.html', transfer:'transfer.html', yazarlar:'yazarlar.html', macaton:'macaton.html', haftanin11:'haftanin-11i.html', oduller:'oduller.html' };
  const managedCategories = data ? Object.keys(data.categories).filter(function (key) { return data.categories[key].active !== false && data.categories[key].showInMenu; }).sort(function (a,b) { return (data.categories[a].sortOrder||0)-(data.categories[b].sortOrder||0); }) : [];
  const mainLinks = managedCategories.length ? [['home','index.html','ANA SAYFA']].concat(managedCategories.map(function (key) { return [key, categoryPages[key] || 'kategori.html?kategori=' + encodeURIComponent(key), data.categories[key].title.toUpperCase()]; }), [['puan','puan-durumu.html','PUAN DURUMU'],['fikstur','fikstur.html','FİKSTÜR']]) : defaultMainLinks;
  const utilityLinks = [
    ['fikstur', 'fikstur.html', 'FİKSTÜR'], ['puan', 'puan-durumu.html', 'PUAN DURUMU'],
    ['haftanin11', 'haftanin-11i.html', 'HAFTANIN 11’İ'], ['derbi', 'haber-derbi.html', 'DERBİ'],
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
    footerNav.innerHTML = '<a href="index.html">Ana Sayfa</a><a href="fikstur.html">Fikstür</a><a href="puan-durumu.html">Puan Durumu</a><a href="arsiv.html">Arşiv</a><a href="kurallar.html">Mevzuat</a>';
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
    search.value = params.get('q') || ''; category.value = params.get('kategori') || 'all'; author.value = params.get('yazar') || 'all'; month.value = params.get('ay') || 'all';
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

  function renderAuthors() {
    const grid = document.querySelector('[data-authors-grid]');
    if (grid && data) grid.innerHTML = data.authors.map(function (author) { return '<article class="author-profile-card"><header><img src="' + escapeHtml(author.image) + '" alt="' + escapeHtml(author.name) + ' vesikalık fotoğrafı"><div><small>FUTMAC YAZARI</small><h2>' + escapeHtml(author.name) + '</h2><span>' + escapeHtml(author.role) + '</span></div></header><p>' + escapeHtml(author.bio) + '</p><a href="' + escapeHtml(author.profile) + '">YAZAR PROFİLİ VE TÜM YAZILARI »</a></article>'; }).join('');
    const profileList = document.querySelector('[data-author-articles]');
    if (profileList && data) { const items = data.articles.filter(function (article) { return article.authorId === body.dataset.author; }); profileList.innerHTML = items.length ? items.map(articleRow).join('') : '<div class="state-panel"><strong>Bu yazara ait yayımlanmış yazı yok.</strong></div>'; }
  }

  function enhanceColumns() {
    const column = document.querySelector('.column-article');
    if (!column) return;
    document.querySelectorAll('.column-aside a[href="haber.html"]').forEach(function (link) { link.href = 'yazi-yeni-donem.html'; });
    const authorHeading = column.querySelector('.column-author h2');
    const authorProfiles = { 'Furkan Katılmış':'yazar-furkan.html', 'Eray':'yazar-eray.html', 'Berkay Minkara':'yazar-berkay.html' };
    if (authorHeading && authorProfiles[authorHeading.textContent.trim()]) {
      const profileUrl = authorProfiles[authorHeading.textContent.trim()];
      authorHeading.innerHTML = '<a href="' + profileUrl + '">' + escapeHtml(authorHeading.textContent.trim()) + '</a>';
      const authorInfo = authorHeading.parentElement;
      if (!authorInfo.querySelector('.read-more')) authorInfo.insertAdjacentHTML('beforeend', '<a class="read-more" href="' + profileUrl + '">Yazar profili ve tüm yazıları »</a>');
    }
    const signature = column.querySelector('.column-signature');
    if (signature && !column.querySelector('.story-navigation')) signature.insertAdjacentHTML('beforebegin', '<nav class="story-navigation" aria-label="Önceki ve sonraki köşe yazısı"><a href="yazi-yeni-donem.html"><span>‹ ÖNCEKİ YAZI</span>E-Mac’te yeni dönem</a><a href="yazarlar.html"><span>SONRAKİ YAZI ›</span>Tüm köşe yazıları</a></nav><section><div class="section-title"><h2>İLGİLİ YAZILAR</h2></div><div class="related-grid"><a href="yazi-butce.html"><img src="assets/images/yazarlar/furkan-katilmis-2.png" alt="">Transfer sınırı başlıyor</a><a href="yazi-eray.html"><img src="assets/images/yazarlar/eray.png" alt="">Haftanın taktik analizi</a><a href="yazi-berkay.html"><img src="assets/images/yazarlar/berkay-minkara.jpg" alt="">Ligin güncel durumu</a></div></section>');
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
      const id = params.get('id');
      article = data.articles.find(function (item) { return (item.local || item.remote || item.dynamic) && item.id === id; }) || null;
    }
    if (!article) {
      robots.content = 'noindex,nofollow';
      container.innerHTML = '<nav class="breadcrumb" aria-label="İçerik yolu"><a href="index.html">Ana Sayfa</a><span>›</span><span>İçerik</span></nav><span class="news-kicker">BULUNAMADI</span><h1>İçerik bulunamadı</h1><p class="dek">Bu içerik silinmiş, taslak durumda veya henüz yayımlanmamış olabilir.</p><p><a class="pdf-button" href="index.html">ANA SAYFAYA DÖN</a></p>';
      document.title = 'İçerik Bulunamadı | FUTMAC';
      return;
    }
    robots.content = article.status === 'published' ? 'index,follow' : 'noindex,nofollow';
    const paragraphs = String(article.content || '').split(/\n\s*\n/).filter(Boolean).map(function (paragraph, index) { return '<p' + (index === 0 ? ' class="dropcap"' : '') + '>' + escapeHtml(paragraph) + '</p>'; }).join('');
 container.innerHTML = '<nav class="breadcrumb" aria-label="İçerik yolu"><a href="index.html">Ana Sayfa</a><span>›</span><a href="arsiv.html">Arşiv</a><span>›</span><span>İçerik</span></nav><span class="news-kicker">' + escapeHtml(categoryName(article.category).toUpperCase()) + '</span><h1>' + escapeHtml(article.title) + '</h1><p class="dek">' + escapeHtml(article.excerpt) + '</p><div class="article-meta-line"><span><strong>' + escapeHtml(article.author) + '</strong></span><time datetime="' + escapeHtml(article.date + 'T' + article.time) + '">' + escapeHtml(article.displayDate + ', ' + article.time) + '</time><span>Okuma süresi: ' + escapeHtml(article.readTime) + '</span></div><img class="article-hero" src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.imageAlt || article.title) + '"><p class="caption">FUTMAC Haber Merkezi</p>' + paragraphs + '<div class="share-row"><button type="button" data-copy-link>BAĞLANTIYI KOPYALA</button><span class="copy-status" aria-live="polite"></span></div><nav class="story-navigation" aria-label="İçerik bağlantıları"><a href="index.html"><span>‹ ANA SAYFA</span>FUTMAC gündemine dön</a><a href="arsiv.html"><span>ARŞİV ›</span>Bütün içerikler</a></nav>';
    document.title = article.title + ' | FUTMAC';
    const descriptionTag = document.querySelector('meta[name="description"]'); if (descriptionTag) descriptionTag.content = article.excerpt;
  }

  function renderLocalHomepage() {
    const stream = document.querySelector('.portal-stream');
    if (!stream || !data) return;
    const mainStory = stream.querySelector('.portal-main-story');
    const localItems = data.articles.filter(function (item) { return (item.local || item.remote || item.dynamic) && item.status === 'published'; }).slice(0, 3);
    localItems.reverse().forEach(function (article) {
      mainStory.insertAdjacentHTML('afterend', '<article class="portal-news"><img src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.title) + '"><div><span>YENİ · ' + escapeHtml(categoryName(article.category).toUpperCase()) + '</span><h2><a href="' + escapeHtml(article.url) + '">' + escapeHtml(article.title) + '</a></h2><p>' + escapeHtml(article.excerpt) + '</p></div></article>');
    });
  }

  renderLocalArticle();
  renderLocalHomepage();

  document.querySelectorAll('[data-copy-link]').forEach(function (copyButton) {
    copyButton.addEventListener('click', async function () {
      const status = copyButton.parentElement.querySelector('.copy-status') || document.querySelector('.copy-status');
      try { if (!navigator.clipboard || !window.isSecureContext) throw new Error('clipboard-unavailable'); await navigator.clipboard.writeText(window.location.href); if (status) status.textContent = 'Bağlantı kopyalandı.'; }
      catch (error) { if (status) status.textContent = 'Bağlantı: ' + window.location.href; }
    });
  });
  const ruleSelect = document.querySelector('#rule-section-select');
  if (ruleSelect) ruleSelect.addEventListener('change', function () { const target = document.querySelector(ruleSelect.value); if (target) { target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); target.setAttribute('tabindex', '-1'); target.focus({ preventScroll:true }); } });

  function ensureMeta(property, content, isName) {
    const selector = isName ? 'meta[name="' + property + '"]' : 'meta[property="' + property + '"]'; let tag = document.head.querySelector(selector);
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute(isName ? 'name' : 'property', property); document.head.appendChild(tag); } tag.setAttribute('content', content);
  }
  const canonicalBase = 'https://futmac.com.tr/'; let canonical = document.head.querySelector('link[rel="canonical"]');
  const dynamicId = fileName === 'haber-onizleme.html' ? new URLSearchParams(window.location.search).get('id') : null;
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); } canonical.href = canonicalBase + fileName + (dynamicId ? '?id=' + encodeURIComponent(dynamicId) : '');
  const description = (document.head.querySelector('meta[name="description"]') || {}).content || 'E-Mac Turka Fantazi Ligi haberleri ve lig merkezi.';
  const renderedHero = document.querySelector('.article-hero'); const socialImage = renderedHero ? new URL(renderedHero.getAttribute('src'), document.baseURI).href : canonicalBase + 'assets/images/logo/emac-turka.png';
  ensureMeta('og:title', document.title, false); ensureMeta('og:description', description, false); ensureMeta('og:type', body.dataset.schema === 'article' ? 'article' : 'website', false); ensureMeta('og:url', canonical.href, false); ensureMeta('og:image', socialImage, false); ensureMeta('twitter:card', 'summary_large_image', true); ensureMeta('twitter:title', document.title, true); ensureMeta('twitter:description', description, true); ensureMeta('twitter:image', socialImage, true);
  if (!document.head.querySelector('link[rel="icon"]')) { const icon = document.createElement('link'); icon.rel = 'icon'; icon.href = 'assets/images/logo/emac-turka-transparent.png'; document.head.appendChild(icon); }
  if (body.dataset.schema === 'article' && !document.querySelector('script[data-structured]')) {
    const articleTitle = document.querySelector('h1'); const published = document.querySelector('time[datetime]'); const json = document.createElement('script'); json.type = 'application/ld+json'; json.dataset.structured = 'true';
    json.textContent = JSON.stringify({ '@context':'https://schema.org', '@type': body.classList.contains('column') ? 'Article' : 'NewsArticle', headline: articleTitle ? articleTitle.textContent.trim() : document.title, datePublished: published ? published.getAttribute('datetime') : '2026-08-20', publisher: { '@type':'Organization', name:'FUTMAC', logo:{ '@type':'ImageObject', url:canonicalBase + 'assets/images/logo/emac-turka.png' } }, mainEntityOfPage: canonical.href }); document.head.appendChild(json);
  }

  renderCategoryPage(); renderArchive(); renderStandings(); renderFixtures(); renderAuthors(); enhanceColumns();
}());
