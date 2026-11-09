import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {plans} from '../src/data/content.js';
import {guides} from '../src/data/guides.js';
const read=file=>fs.readFileSync(file,'utf8');
const schemas=html=>[...html.matchAll(/type="application\/ld\+json">([^<]+)<\/script>/g)].map(m=>JSON.parse(m[1]));
test('public SoftwareApplication offers agree with the visible current plans',()=>{
 assert.deepEqual(plans.map(p=>[p.key,p.price]),[['free','0'],['starter','7.99'],['complete','19.99']]);
 for(const file of ['index.html','manufacturing.html','retail.html']){
  const html=read(file),app=schemas(html).flatMap(x=>x['@graph']||[x]).find(x=>x['@type']==='SoftwareApplication');
  assert(app);assert.deepEqual(app.offers.map(x=>x.price),file==='retail.html'?['19.99']:['0','7.99','19.99']);
  for(const offer of app.offers){assert.equal(offer.priceCurrency,'GBP');assert(html.replaceAll('<!-- -->','').includes('£'+offer.price));}
  assert(!html.includes('plan=pro'));assert(!html.includes('plan=business'));assert(html.includes('No VAT is currently charged'));
 }
 assert(read('index.html').includes('Existing subscriptions keep their agreed prices'));
 assert.equal((read('features.html').match(/<h1\b/g)||[]).length,1);
});
test('new practical articles and substantive older edits retain accurate publication history',()=>{
 const fresh=guides.filter(g=>g.published==='2026-11-08');assert.equal(fresh.length,3);
 for(const g of guides){const html=read('guides/'+g.slug+'.html'),article=schemas(html).flatMap(x=>x['@graph']||[]).find(x=>x['@type']==='BlogPosting');assert.equal(article.dateModified,g.modified||g.published||'2026-10-27');assert(Date.parse(article.dateModified)>=Date.parse(article.datePublished));}
 for(const g of fresh){assert(read('guides.html').includes('/guides/'+g.slug));assert(g.sections.length>=5);assert(g.related.every(slug=>guides.some(x=>x.slug===slug)));}
 const terms=read('terms.html'),privacy=read('privacy.html');
 assert(terms.includes('Deleting a store does not itself reduce that purchased allowance'));
 assert(privacy.includes('business-tool menu preferences'));assert(privacy.includes('InventoryOS does not'));
});
