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
      body:"window.FUTMAC_DATA={categories:{},articles:[],authors:[],standings:[],fixtures:{},siteSettings:{predictionsVisible:true,predictionsTitle:'GÜNÜN KUPONLARI',predictionsItemsText:'Ayşe | A - B | 2,5 Üst | 1.75\\n<img src=x onerror=alert(1)> | C - D | Ev Sahibi'}};window.FUTMAC_REMOTE_READY=Promise.resolve();"
    }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/index.html');
    await page.getByRole('heading', { name:'GÜNÜN KUPONLARI' }).waitFor();
    assert.equal(await page.locator('.prediction-card').count(), 2);
    assert.equal(await page.locator('.prediction-card img').count(), 0);
    assert.equal(await page.getByText('Oran 1.75').count(), 1);
    assert.equal(await page.getByText(/18\+/).count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    assert.deepEqual(errors, []);
    console.log('PASS daily predictions mobile and escaping');
    await context.close();
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode=1; });
