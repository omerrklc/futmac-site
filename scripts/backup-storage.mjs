import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectUrl = process.env.FUTMAC_SUPABASE_URL;
const serviceKey = process.env.FUTMAC_SUPABASE_SERVICE_ROLE_KEY;
const output = path.resolve(process.env.FUTMAC_BACKUP_DIR || 'backup', 'media');
if (!projectUrl || !serviceKey) throw new Error('Supabase yedekleme sırları tanımlı değil.');
const headers = { apikey:serviceKey, Authorization:'Bearer ' + serviceKey, 'Content-Type':'application/json' };
const safePart = value => String(value || '').replace(/[^A-Za-z0-9._-]/g, '_');

async function list(prefix) {
  const response = await fetch(projectUrl + '/storage/v1/object/list/futmac-media', { method:'POST', headers, body:JSON.stringify({ prefix, limit:1000, offset:0, sortBy:{ column:'name', order:'asc' } }) });
  if (!response.ok) throw new Error('Storage listesi alınamadı: ' + response.status);
  return response.json();
}

let count = 0;
for (const folder of ['articles','authors','teams']) {
  const entries = await list(folder);
  for (const entry of entries) {
    if (!entry.id || !entry.name) continue;
    const objectName = folder + '/' + entry.name;
    const response = await fetch(projectUrl + '/storage/v1/object/authenticated/futmac-media/' + objectName.split('/').map(encodeURIComponent).join('/'), { headers });
    if (!response.ok) throw new Error(objectName + ' indirilemedi: ' + response.status);
    const directory = path.join(output, safePart(folder)); await mkdir(directory, { recursive:true });
    await writeFile(path.join(directory, safePart(entry.name)), Buffer.from(await response.arrayBuffer())); count += 1;
  }
}
console.log(count + ' medya dosyası yedeklendi.');
