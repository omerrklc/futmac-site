const DEFAULT_SITE = 'https://futmac.com.tr/';
const SITE = new URL(process.env.FUTMAC_SITE_URL || DEFAULT_SITE);
const REQUIRE_CLOSED_SIGNUP = process.env.REQUIRE_CLOSED_SIGNUP === 'true';
const checks = [];
const warnings = [];

if (SITE.protocol !== 'https:') throw new Error('Üretim sağlık testi yalnızca HTTPS adreslerinde çalışır.');
if (!SITE.pathname.endsWith('/')) SITE.pathname += '/';

function record(name, ok, detail) {
  const passed = Boolean(ok);
  checks.push({ name, ok:passed, detail });
  if (!passed) throw new Error(name + ': ' + detail);
}

async function request(url, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, { ...options, method:'GET', redirect:'follow', signal:controller.signal });
      clearTimeout(timer);
      if (response.status >= 500 && attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError || new Error('İstek tamamlanamadı.');
}

async function textCheck(name, url, expectedText) {
  const response = await request(url);
  const body = await response.text();
  record(name, response.status === 200 && body.includes(expectedText), 'HTTP ' + response.status);
  return body;
}

async function apiCheck(name, url, headers, allowedStatuses) {
  const response = await request(url, { headers });
  record(name, allowedStatuses.includes(response.status), 'HTTP ' + response.status);
}

async function redirectCheck(name, url) {
  const response = await request(url);
  const finalUrl = new URL(response.url);
  record(
    name,
    response.status === 200 && finalUrl.protocol === 'https:' && finalUrl.hostname === 'futmac.com.tr',
    'HTTP ' + response.status + ' → ' + response.url
  );
}

try {
  await redirectCheck('HTTP güvenli adrese yönleniyor', 'http://futmac.com.tr/');
  await redirectCheck('www güvenli ana adrese yönleniyor', 'http://www.futmac.com.tr/');
  await redirectCheck('HTTPS www ana adrese yönleniyor', 'https://www.futmac.com.tr/');
  await textCheck('Ana sayfa', new URL('index.html', SITE), 'FUTMAC');
  await textCheck('Admin noindex', new URL('admin.html', SITE), 'noindex,nofollow');
  await textCheck('Yönetim rehberi', new URL('yonetim-rehberi.html', SITE), 'FUTMAC YÖNETİM REHBERİ');
  const sitemap = await textCheck('Site haritası', new URL('sitemap.xml', SITE), '<urlset');
  record('Demo içerikler site haritasından kaldırıldı', !sitemap.includes('haber-derbi.html') && !sitemap.includes('yazi-eray.html') && !sitemap.includes('futmac-yayinda'), 'Eski örnek adres bulunmuyor');
  record('Gerçek haberler site haritasında', sitemap.includes('/paylas/'), 'Paylaşım sayfaları listeleniyor');
  record('Dinamik yazar profilleri site haritasında', sitemap.includes('/yazar.html?id='), 'Yazar profilleri listeleniyor');
  await textCheck('Kök robots.txt', new URL('../robots.txt', SITE), 'Sitemap:');
  await textCheck('Hakkımızda sayfası', new URL('hakkimizda.html', SITE), '<h1>Hakkımızda</h1>');
  await textCheck('İletişim sayfası', new URL('iletisim.html', SITE), '<h1>İletişim</h1>');
  await textCheck('Gizlilik sayfası', new URL('gizlilik.html', SITE), '<h1>Gizlilik ve kişisel veriler</h1>');
  await textCheck('Dinamik haber indeksleme kodu', new URL('assets/js/app.js', SITE), "article.status === 'published' ? 'index,follow'");

  const configText = await textCheck('Supabase yapılandırması', new URL('assets/js/supabase-config.js', SITE), 'FUTMAC_SUPABASE_CONFIG');
  const backendUrl = configText.match(/url:\s*'([^']+)'/)?.[1];
  const publishableKey = configText.match(/publishableKey:\s*'([^']+)'/)?.[1];
  record('Supabase adres biçimi', /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(backendUrl || ''), 'Adres doğrulandı');
  record('Publishable anahtar', typeof publishableKey === 'string' && publishableKey.length > 20, 'Genel istemci anahtarı mevcut');

  const headers = { apikey:publishableKey, Authorization:'Bearer ' + publishableKey };
  await apiCheck('Supabase Auth', backendUrl + '/auth/v1/health', { apikey:publishableKey }, [200]);

  const settingsResponse = await request(backendUrl + '/auth/v1/settings', { headers:{ apikey:publishableKey } });
  const settings = settingsResponse.status === 200 ? await settingsResponse.json() : null;
  record('Auth ayarları', settingsResponse.status === 200 && Boolean(settings), 'HTTP ' + settingsResponse.status);
  const signupClosed = settings.disable_signup === true;
  const anonymousClosed = !(settings.external && settings.external.anonymous_users === true);
  if (!signupClosed) warnings.push('Herkese açık e-posta kaydı açık. Supabase Auth ayarından kapatılmalı.');
  record('Anonim hesaplar kapalı', anonymousClosed, anonymousClosed ? 'Kapalı' : 'Açık');
  if (REQUIRE_CLOSED_SIGNUP) record('Yeni kullanıcı kaydı kapalı', signupClosed, signupClosed ? 'Kapalı' : 'Açık');

  const publicTables = [
    ['Kategoriler', 'categories?select=slug&limit=1'],
    ['Haberler', 'articles?select=id,slug,status,published_at&limit=1'],
    ['Yazarlar', 'authors?select=slug&limit=1'],
    ['Takımlar', 'league_teams?select=id&limit=1'],
    ['Puan durumu', 'standings?select=team_id&limit=1'],
    ['Fikstür', 'fixtures?select=id&limit=1']
  ];
  for (const [name, query] of publicTables) await apiCheck(name, backendUrl + '/rest/v1/' + query, headers, [200]);

  const protectedQueries = [
    ['Kullanıcı profilleri korumalı', 'profiles?select=id&limit=1'],
    ['İşlem geçmişi korumalı', 'audit_log?select=id&limit=1'],
    ['Haber sahipliği korumalı', 'articles?select=created_by&limit=1']
  ];
  for (const [name, query] of protectedQueries) await apiCheck(name, backendUrl + '/rest/v1/' + query, headers, [401, 403]);

  console.log(JSON.stringify({
    checkedAt:new Date().toISOString(),
    site:SITE.href,
    passed:checks.length,
    warnings,
    checks
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    checkedAt:new Date().toISOString(),
    site:SITE.href,
    error:error.message,
    warnings,
    checks
  }, null, 2));
  process.exit(1);
}
