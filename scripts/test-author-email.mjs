import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import vm from 'node:vm';
const app = readFileSync('assets/js/app.js', 'utf8');
const helper = app.slice(app.indexOf('  function authorEmailMarkup('), app.indexOf('  function renderAuthors('));
const context = vm.createContext({ encodeURIComponent, escapeHtml: value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;') });
vm.runInContext(helper, context);
assert.equal(context.authorEmailMarkup(null), '');
assert.equal(context.authorEmailMarkup({email:''}), '');
assert.equal(context.authorEmailMarkup({email:'broken address@example.com'}), '');
assert.equal(context.authorEmailMarkup({email:'a@example.com\r\nBcc:test@example.com'}), '');
assert.equal(context.authorEmailMarkup({email:'<img>@example.com'}), '');
assert.match(context.authorEmailMarkup({email:'writer+news@example.com'}), /mailto:writer%2Bnews%40example.com/);
const service = readFileSync('assets/js/supabase-service.js', 'utf8');
const save = service.slice(service.indexOf('  async function saveAuthor('), service.indexOf('  async function deleteAuthor('));
let schemaError = null, saved;
const client = {from: table => table === 'authors' ? {
  select: () => ({limit: async () => ({error:schemaError})}),
  upsert: row => {saved=row;return {select:()=>({single:async()=>({data:row})})};}
} : {update:()=>({eq:async()=>({})})}};
const sandbox = vm.createContext({getClient:async()=>client, editedAuthorOriginalId:''});
vm.runInContext(save, sandbox);
await sandbox.saveAuthor({id:'writer',name:'Writer',email:'writer@example.com'});
assert.equal(saved.email, 'writer@example.com');
await sandbox.saveAuthor({id:'writer',name:'Writer',email:''});
assert.equal(saved.email, '');
schemaError={code:'42703'};
await assert.rejects(sandbox.saveAuthor({id:'writer',email:'writer@example.com'}), /008_author_public_email/);
await sandbox.saveAuthor({id:'writer',email:''});
assert.equal(Object.hasOwn(saved,'email'),false);
await assert.rejects(sandbox.saveAuthor({id:'writer',email:'bad value'}), /Geçerli/);
console.log('Author email: rendering, empty/invalid values, save, clear and pre-migration compatibility passed.');
