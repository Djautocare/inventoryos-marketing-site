import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {guides,published} from '../src/data/guides.js';
import {shippingDetails,productBrand,merchantReturnPolicy} from '../assets/shop-schema.js';
const read=file=>fs.readFileSync(file,'utf8');
test('the guide hub, four original articles and cropping page are linked, canonical and crawlable without JS',()=>{
 const urls=['/guides','/shipping-label-cropping',...guides.map(g=>'/guides/'+g.slug)];
 const titles=new Set(),descriptions=new Set();
 for(const url of urls){const html=read(url.slice(1)+'.html');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,url);
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1,url);
  assert(html.includes('href="https://inventoryos.co.uk'+url+'"'));
  assert(!html.includes('noindex'));assert(read('sitemap.xml').includes('<loc>https://inventoryos.co.uk'+url+'</loc>'));
  const title=html.match(/<title>([^<]+)<\/title>/)[1],description=html.match(/name="description" content="([^"]+)"/)[1];
  assert(!titles.has(title));titles.add(title);assert(!descriptions.has(description));descriptions.add(description);
  assert(!html.includes('/assets/marketing/entry-'),'Articles should not load React or animation bundles');
  const schemas=[...html.matchAll(/type="application\/ld\+json">([^<]+)<\/script>/g)].map(m=>JSON.parse(m[1]));
  assert(schemas.some(s=>s['@graph'].some(x=>x['@type']==='BreadcrumbList')));
  if(url.startsWith('/guides/')){const g=guides.find(g=>url==='/guides/'+g.slug),article=schemas[0]['@graph'].find(x=>x['@type']==='BlogPosting');assert.equal(article.headline,g.title);assert(article.datePublished.startsWith(published));assert.equal(article.author.name,'InventoryOS team');assert(g.sections.length>=5);assert(read('guides.html').includes('href="'+url+'"'));}
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,url);
  for(const [,raw]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const link=raw.replaceAll('&amp;','&');if(/^(https?:|mailto:|data:)/.test(link))continue;
   const [path,hash]=link.split('#');let file=(path?path.split('?')[0].replace(/^\//,''):url.slice(1))||'index.html';
   if(!fs.existsSync(file))file+='.html';assert(fs.existsSync(file),url+' missing '+link);
   if(hash&&file.endsWith('.html'))assert(read(file).includes('id="'+hash+'"'),url+' missing anchor '+link);
  }
 }
 assert(read('index.html').includes('href="/shipping-label-cropping"'));
 for(const file of ['index.html','manufacturing.html','retail.html'])assert(read(file).includes('href="/guides"'));
});
test('manual-workload calculator handles full seconds, hours and invalid input without treating the result as a saving',()=>{
 let listener,output={textContent:''},valid=true;
 const form={elements:{labels:{value:'30'},seconds:{value:'20'}},reportValidity:()=>valid,addEventListener:(_,fn)=>listener=fn};
 const context={document:{getElementById:id=>id==='label-time-form'?form:output}};vm.createContext(context);vm.runInContext(read('assets/label-time.js'),context);
 const run=()=>listener({preventDefault(){}});run();assert.equal(output.textContent,'30 labels × 20 seconds = 10 minutes of manual preparation.');
 form.elements.labels.value='1';form.elements.seconds.value='1';run();assert.equal(output.textContent,'1 label × 1 second = 1 second of manual preparation.');
 form.elements.labels.value='120';form.elements.seconds.value='60';run();assert(output.textContent.includes('2 hours'));
 const before=output.textContent;for(const invalid of ['-1','0','1.5','10001','NaN']){form.elements.labels.value=invalid;run();assert.equal(output.textContent,before);}
 assert(read('shipping-label-cropping.html').includes('not a promised saving'));
});
test('shipping schema uses only configured public rates and never advertises mainland coverage as the whole UK',()=>{
 assert.equal(shippingDetails(null),undefined);assert.equal(shippingDetails({coverage:'UK',standard_pence:null,express_pence:null}),undefined);
 assert.equal(shippingDetails({coverage:'MAINLAND',standard_pence:350,express_pence:450}),undefined);
 const result=shippingDetails({coverage:'UK',standard_pence:350,express_pence:450});assert.equal(result.length,2);assert.equal(result[0].shippingDestination.addressCountry,'GB');assert.equal(result[0].shippingRate.maxValue,'3.50');assert.equal(result[1].shippingRate.maxValue,'4.50');
 assert.equal(shippingDetails({coverage:'UK',standard_pence:0,express_pence:-1})[0].shippingRate.maxValue,'0.00');
 assert.equal(merchantReturnPolicy.merchantReturnLink,'https://inventoryos.co.uk/refunds#shop-goods');
 assert.equal(merchantReturnPolicy.merchantReturnDays,undefined,'Do not compress two separate cancellation/return windows into a made-up deadline');
 const schema=JSON.parse(read('shop-product-pages/ps-grey-mailing-bags-pack-of-100.html').match(/id="shop-product-schema" type="application\/ld\+json">([^<]+)/)[1]);
 assert.deepEqual(schema['@graph'].find(x=>x['@type']==='Organization').hasMerchantReturnPolicy,merchantReturnPolicy);
 assert(read('refunds.html').includes('id="shop-goods"'));
});
test('known brands are retained and unbranded stock gets no fabricated brand, barcode or ratings',()=>{
 assert.equal(productBrand({id:'jadens-668bt'}).name,'JADENS');assert.equal(productBrand({id:'ps-jiffy-mono-bubbles-small-bubble-wrap-10mm'}).name,'Jiffy');assert.equal(productBrand({id:'generic-bag'}),undefined);
 const products=JSON.parse(read('assets/shop-listings.json')).products;
 for(const p of products){const html=read('shop-product-pages/'+p.id+'.html');const schema=JSON.parse(html.match(/id="shop-product-schema" type="application\/ld\+json">([^<]+)/)[1]);const product=schema['@graph'].find(x=>x['@type']==='Product');assert.equal(product.gtin,undefined);assert.equal(product.aggregateRating,undefined);assert.equal(product.review,undefined);}
});

test('each generated merchant graph occurs only once after rebuilding',()=>{
 const products=JSON.parse(read('assets/shop-listings.json')).products;
 for(const file of ['refunds.html','shop.html',...products.map(p=>'shop-product-pages/'+p.id+'.html')])assert.equal((read(file).match(/id="shop-product-schema"/g)||[]).length,1,file);
});
