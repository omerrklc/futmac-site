import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const configSource = await readFile(path.join(root, 'assets/js/supabase-config.js'), 'utf8');
const projectUrl = process.env.FUTMAC_SUPABASE_URL || configSource.match(/url:\s*'([^']+)'/)?.[1];
const publicKey = process.env.FUTMAC_SUPABASE_KEY || configSource.match(/publishableKey:\s*'([^']+)'/)?.[1];
if (!projectUrl || !publicKey) throw new Error('Supabase genel bağlantı bilgileri bulunamadı.');

const response = await fetch(projectUrl + '/rest/v1/articles?select=id,title,excerpt,image_url,image_alt,published_at,status&status=eq.published&order=published_at.desc', { headers:{ apikey:publicKey } });
if (!response.ok) throw new Error('Yayımlanmış haberler alınamadı: ' + response.status);
const articles = await response.json();
const output = path.join(root, 'haber');
const mediaOutput = path.join(root, 'haber-media');
await mkdir(output, { recursive:true });
await mkdir(mediaOutput, { recursive:true });

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const expected = new Set();
const expectedMedia = new Set();
for (const article of articles) {
  if (!/^[0-9a-f-]{36}$/i.test(article.id)) continue;
  const fileName = article.id + '.html';
  expected.add(fileName);
  const shareUrl = 'https://futmac.com.tr/haber/' + fileName;
  const title = escape(article.title + ' | FUTMAC');
  const description = escape(article.excerpt || 'FUTMAC haber merkezi içeriği.');
  let socialImage = article.image_url || 'https://futmac.com.tr/assets/images/logo/emac-turka.png';
  let socialImageType = socialImage.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  const storagePrefix = projectUrl + '/storage/v1/object/public/futmac-media/';
  if (socialImage.startsWith(storagePrefix)) {
    const transformed = socialImage.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=1200&height=630&resize=cover&quality=50';
    const imageResponse = await fetch(transformed, { headers:{ Accept:'image/webp,image/*' } });
    if (imageResponse.ok && String(imageResponse.headers.get('content-type')).includes('image/webp')) {
      const mediaName = article.id + '.webp';
      await writeFile(path.join(mediaOutput, mediaName), Buffer.from(await imageResponse.arrayBuffer()));
      expectedMedia.add(mediaName);
      socialImage = 'https://futmac.com.tr/haber-media/' + mediaName;
      socialImageType = 'image/webp';
    }
  }
  const image = escape(socialImage);
  const imageAlt = escape(article.image_alt || article.title);
  const published = escape(article.published_at || '');
  const html = `<!doctype html>
<html lang="tr"><head><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; connect-src 'self' https://pwmwymvnyfvrumlizbuw.supabase.co wss://pwmwymvnyfvrumlizbuw.supabase.co; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'">
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base href="/">
<title>${title}</title><meta name="description" content="${description}">
<link rel="canonical" href="${shareUrl}">
<meta property="og:type" content="article"><meta property="og:site_name" content="FUTMAC">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}">
<meta property="og:url" content="${shareUrl}"><meta property="og:image" content="${image}"><meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="${socialImageType}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${imageAlt}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}">
<meta property="article:published_time" content="${published}">
<link rel="stylesheet" href="assets/css/style.css"><link rel="stylesheet" href="assets/css/fixes.css"><link rel="stylesheet" href="assets/css/complete.css">
<script src="assets/js/supabase-config.js" defer><\/script><script src="assets/js/supabase-service.js?v=20260829-6" defer><\/script><script src="assets/js/data.js?v=20260829-6" defer><\/script><script src="assets/js/app.js?v=20260829-7" defer><\/script>
</head><body data-section="emac" data-schema="article">
<a class="skip-link" href="#icerik">İçeriğe geç</a>
<div class="top-strip"><div class="wrap top-inner"><span>FUTMAC.COM</span><span>E-MAC TURKA FANTAZİ LİGİ</span></div></div>
<header class="header wrap"><a class="brand" href="index.html"><img class="site-logo" src="assets/images/logo/emac-turka-transparent.png" alt="E-Mac Turka arması"><span class="wordmark">FUT<strong>MAC</strong><small>E-MAC TURKA'NIN SPOR GAZETESİ</small></span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="ana-menu">MENÜ</button></header>
<nav id="ana-menu" class="nav" aria-label="Ana menü"><div class="wrap nav-inner"><a href="index.html">ANA SAYFA</a></div></nav>
<main id="icerik" class="wrap page article-page"><article class="article" data-local-article><span class="news-kicker">HABER</span><h1>İçerik yükleniyor</h1><p class="dek">FUTMAC haber içeriği hazırlanıyor.</p></article><aside class="listing-side" data-dynamic-aside><section class="side-module"><h2>FUTMAC</h2><p style="padding:8px">E-Mac Turka Fantazi Ligi'nden son haberler.</p><a href="arsiv.html">Bütün haberleri gör »</a></section></aside></main>
<footer><div class="wrap footer-inner"><img src="assets/images/logo/emac-turka-transparent.png" alt=""><div><strong>FUTMAC</strong><span>© 2026 E-Mac Turka'nın Spor Gazetesi</span></div><nav><a href="index.html">Ana Sayfa</a></nav></div></footer>
</body></html>\n`;
  await writeFile(path.join(output, fileName), html, 'utf8');
}

for (const entry of await readdir(output, { withFileTypes:true })) {
  if (entry.isFile() && entry.name.endsWith('.html') && !expected.has(entry.name)) await rm(path.join(output, entry.name));
}
for (const entry of await readdir(mediaOutput, { withFileTypes:true })) {
  if (entry.isFile() && !expectedMedia.has(entry.name)) await rm(path.join(mediaOutput, entry.name));
}
console.log(articles.length + ' sosyal paylaşım sayfası hazırlandı.');
