const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const topicId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://local').pathname;
  const file = path.resolve(root, '.' + (pathname === '/' ? '/forum.html' : pathname));
  try {
    const data = await fs.readFile(file);
    response.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    response.end(data);
  } catch {
    response.writeHead(404); response.end();
  }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ channel:'chrome', headless:true });
  try {
    for (const loggedIn of [false, true]) {
      const context = await browser.newContext({ viewport:{ width:390, height:844 } });
      await context.route('**/assets/js/supabase-config.js*', async route => {
        const body = (await fs.readFile(path.join(root, 'assets/js/supabase-config.js'), 'utf8')).replace('forumEnabled: false', 'forumEnabled: true');
        route.fulfill({ contentType:'application/javascript', body });
      });
      await context.route('**/assets/js/forum.js*', async route => {
        const original = await fs.readFile(path.join(root, 'assets/js/forum.js'), 'utf8');
        const session = loggedIn ? "({nickname:'Test Üye'})" : 'null';
        const stub = `window.FUTMAC_SUPABASE={forumEnabled:true,forumSession:async()=>${session},forumTopics:async()=>[{id:'${topicId}',title:'<img src=x onerror=alert(1)>Güvenli konu',body_preview:'Deneme',author_name:'Anonim Üye',reply_count:2,created_at:new Date().toISOString(),locked:false}],forumTopic:async()=>({topic:{id:'${topicId}',title:'Güvenli konu',body:'İçerik',author_name:'Test Üye',created_at:new Date().toISOString(),locked:false},replies:[{id:'r',body:'<script>alert(1)</script>',author_name:'Anonim Üye',created_at:new Date().toISOString()}]}),forumSignIn:async()=>({nickname:'Test Üye'}),forumSignUp:async()=>({session:null}),forumUpdateNickname:async n=>n,forumCreateTopic:async()=>'${topicId}',forumCreateReply:async()=>1,requestPasswordReset:async()=>{},signOut:async()=>{}};`;
        route.fulfill({ contentType:'application/javascript', body:stub + original });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/forum.html');
      await page.getByRole('heading', { name:'Son konular' }).waitFor();
      await page.locator('.utility-nav a').first().waitFor();
      assert.equal(await page.locator('.utility-nav a').first().textContent(), 'FORUM');
      assert.equal(await page.locator('.utility-nav a').first().isVisible(), true);
      assert.equal(await page.locator('img[src="x"]').count(), 0);
      assert.equal(await page.getByRole('link', { name:/Güvenli konu/ }).count(), 1);
      if (loggedIn) assert.equal(await page.getByRole('heading', { name:'Yeni konu aç' }).count(), 1);
      else assert.equal(await page.getByRole('heading', { name:'Kayıt ol' }).count(), 1);
      await page.goto(origin + '/forum.html?id=' + topicId);
      await page.getByRole('heading', { name:'Yanıtlar' }).waitFor();
      assert.equal(await page.locator('script').filter({ hasText:'alert(1)' }).count(), 0);
      const overflow = await page.evaluate(() => ({
        page:document.documentElement.scrollWidth,
        viewport:innerWidth,
        elements:[...document.querySelectorAll('body *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(element => ({ tag:element.tagName, cls:element.className, right:Math.round(element.getBoundingClientRect().right), width:Math.round(element.getBoundingClientRect().width) }))
      }));
      assert.equal(overflow.page <= overflow.viewport + 1, true, JSON.stringify(overflow));
      assert.deepEqual(errors, []);
      await context.close();
      console.log('PASS forum ' + (loggedIn ? 'member' : 'visitor'));
    }
  } finally {
    await browser.close(); server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
