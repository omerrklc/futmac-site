const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://local').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  try {
    const data = await fs.readFile(file);
    response.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel:'chrome', headless:true });
  try {
    const context = await browser.newContext({ viewport:{ width:390, height:844 } });
    await context.route('**/assets/js/data.js*', route => route.fulfill({
      contentType:'application/javascript',
      body:"window.FUTMAC_DATA={categories:{futbol:{title:'Futbol'}},articles:[{id:'1',type:'tahmin',status:'published',title:'Ayşe’nin Günün Tahminleri',excerpt:'Dört karşılaşma için günün seçimleri.',content:'A - B | 2,5 Üst | 1.75\\nC - D | Ev sahibi kazanır',author:'Ayşe',displayDate:'13 Eylül 2026',url:'haber-onizleme.html?id=1',date:'2026-09-13',time:'12:00',image:'assets/images/futbol-manset.svg',category:'futbol',readTime:'2 dk',local:true},{id:'2',type:'haber',status:'published',title:'Normal haber',excerpt:'Haber özeti',content:'Normal haber metni yeterince uzundur.',author:'FUTMAC',displayDate:'13 Eylül 2026',url:'haber-onizleme.html?id=2',date:'2026-09-13',time:'11:00',image:'assets/images/futbol-manset.svg',category:'futbol',readTime:'2 dk',local:true}],authors:[],standings:[],fixtures:{},siteSettings:{predictionsVisible:true,predictionsTitle:'GÜNÜN KUPONLARI'}};window.FUTMAC_REMOTE_READY=Promise.resolve();"
    }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/index.html');
    await page.getByRole('heading', { name:'GÜNÜN KUPONLARI' }).waitFor();
    assert.equal(await page.locator('.prediction-link-card').count(), 1);
    assert.equal(await page.locator('.prediction-link-card a').getAttribute('href'), 'haber-onizleme.html?id=1');
    assert.equal(await page.getByText('Ayşe’nin Günün Tahminleri', { exact:true }).count(), 1);
    assert.equal(await page.locator('[data-home-news]').getByText('Ayşe’nin Günün Tahminleri').count(), 0);
    assert.equal(await page.locator('.predictions-archive-link').getAttribute('href'), 'arsiv.html?tur=tahmin');
    assert.equal(await page.getByText(/18\+/).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await page.locator('.prediction-link-card a').click();
    await page.locator('.article-predictions').waitFor();
    assert.equal(await page.locator('.article-predictions li').count(), 2);
    assert.equal(await page.getByText('Oran 1.75', { exact:true }).count(), 1);
    await page.goto('http://127.0.0.1:' + server.address().port + '/arsiv.html?tur=tahmin');
    await page.getByRole('heading', { name:'GÜNÜN TAHMİNLERİ ARŞİVİ' }).waitFor();
    assert.equal(await page.locator('[data-archive-results] .news-row').count(), 1);
    assert.equal(await page.locator('[data-archive-results]').getByText('Normal haber').count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS daily predictions mobile and escaping');
    await context.close();
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode=1; });
