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
await mkdir(output, { recursive:true });

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const expected = new Set();
for (const article of articles) {
  if (!/^[0-9a-f-]{36}$/i.test(article.id)) continue;
  const fileName = article.id + '.html';
  expected.add(fileName);
  const shareUrl = 'https://futmac.com.tr/haber/' + fileName;
  const articleUrl = 'https://futmac.com.tr/haber-onizleme.html?id=' + encodeURIComponent(article.id);
  const title = escape(article.title + ' | FUTMAC');
  const description = escape(article.excerpt || 'FUTMAC haber merkezi içeriği.');
  const image = escape(article.image_url || 'https://futmac.com.tr/assets/images/logo/emac-turka.png');
  const imageAlt = escape(article.image_alt || article.title);
  const published = escape(article.published_at || '');
  const html = `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${description}">
<link rel="canonical" href="${shareUrl}">
<meta property="og:type" content="article"><meta property="og:site_name" content="FUTMAC">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}">
<meta property="og:url" content="${shareUrl}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="${imageAlt}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${image}">
<meta property="article:published_time" content="${published}">
</head><body><p>Haber açılıyor… <a href="${escape(articleUrl)}">Devam etmek için tıklayın.</a></p>
<script>window.location.replace(${JSON.stringify(articleUrl).replace(/</g, '\\u003c')});<\/script></body></html>\n`;
  await writeFile(path.join(output, fileName), html, 'utf8');
}

for (const entry of await readdir(output, { withFileTypes:true })) {
  if (entry.isFile() && entry.name.endsWith('.html') && !expected.has(entry.name)) await rm(path.join(output, entry.name));
}
console.log(articles.length + ' sosyal paylaşım sayfası hazırlandı.');
