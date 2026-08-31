const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const article = {id, title:'Yeni haber bağlantı testi', slug:'test', content_type:'haber', category_slug:'futbol', excerpt:'Test açıklaması', body:'Haber gövdesi bağlantı testi için hazırlanmıştır.', author_name:'Test Yazarı', image_url:'assets/images/logo/emac-turka-transparent.png', status:'published', published_at:'2026-01-01T12:00:00Z', updated_at:'2026-01-01T12:00:00Z', view_count:0};
const server = http.createServer(async(req,res)=>{
  const name = decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file = path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if (!file.startsWith(root+path.sep)) { res.writeHead(403);res.end();return; }
  try { const data=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(data); }
  catch {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await fs.readFile(path.join(root,'404.html')));}
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    for(const mode of ['new','slow','network-error','missing','old-link']) {
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const page=await context.newPage(), errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      await context.route('https://*.supabase.co/**', async route=>{
        const u=new URL(route.request().url());
        if(u.pathname.includes('/rpc/')) return route.fulfill({status:200,contentType:'application/json',body:'null'});
        if(u.pathname.endsWith('/articles')) {
          if(u.searchParams.has('id')) {
            if(mode==='network-error') return route.abort('failed');
            if(mode==='slow') await new Promise(resolve=>setTimeout(resolve,6000));
            return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mode==='missing'?[]:[article])});
          }
          return route.fulfill({status:200,contentType:'application/json',body:'[]'}); // Haber ilk 200 kayıt içinde olmasa bile açılmalı.
        }
        return route.fulfill({status:200,contentType:'application/json',body:'[]'});
      });
      await page.goto(origin+(mode==='old-link'?'/paylas/'+id+'-old.html':'/haber-onizleme.html?id='+id));
      if(mode==='slow') {await page.getByRole('heading',{name:'Haber yükleniyor…',exact:true}).waitFor({timeout:7000});}
      if(mode==='network-error') await page.getByRole('heading',{name:'Bağlantı kurulamadı',exact:true}).waitFor();
      else if(mode==='missing') await page.getByRole('heading',{name:'İçerik bulunamadı',exact:true}).waitFor();
      else {
        await page.getByRole('heading',{name:article.title,exact:true}).waitFor({timeout:12000});
        assert.match(page.url(),/haber-onizleme.html\?id=/);
        const link=await page.evaluate(id=>window.FUTMAC_SUPABASE.getShareLink(id),id);
        assert.equal(link.ready,false);assert.match(link.url,/haber-onizleme.html\?id=/);
      }
      assert.deepEqual(errors,[]);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      console.log('PASS '+mode);
      await context.close();
    }
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
