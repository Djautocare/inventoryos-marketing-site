import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {selectProducts,minimumQuantity,quantityProblem,productIdForPath,productPageURL,validProductId} from '../assets/shop-storefront-model.js';
const products=[{id:'printer',name:'Printer',category:'Printers',description:'USB',variants:[{price_pence:5899}]},{id:'bags',name:'Mailing bags',category:'Bags',description:'Grey',variants:[{price_pence:900},{price_pence:600}]},{id:'bubble',name:'Bubble wrap',category:'Protective packaging',description:'Small bubbles',variants:[{price_pence:1400}]}];
test('catalogue filters and price sorting use the cheapest available variant per product',()=>{assert.deepEqual(selectProducts(products,{sort:'price-asc'}).map(p=>p.id),['bags','bubble','printer']);assert.deepEqual(selectProducts(products,{sort:'price-desc'}).map(p=>p.id),['printer','bubble','bags']);assert.deepEqual(selectProducts(products,{category:'bags'}).map(p=>p.id),['bags']);assert.deepEqual(selectProducts(products,{category:'bubble'}).map(p=>p.id),['bubble']);assert.deepEqual(selectProducts(products,{search:'grey'}).map(p=>p.id),['bags']);assert.equal(selectProducts(products,{category:'labels'}).length,0);});
test('grid and product deep links are built with separate product details and cart controls',()=>{const grid=fs.readFileSync('shop.html','utf8'),detail=fs.readFileSync('shop/product/jadens-668bt/index.html','utf8');assert(grid.includes('class="sf-grid"'));assert(grid.includes('value="price-desc"'));assert(grid.includes('data-cart-open'));assert(grid.includes('shop/product/jadens-668bt'));assert(detail.includes('data-product-content'));assert(detail.includes('<base href="/">'));assert(fs.readFileSync('_redirects','utf8').includes('/shop/product/:product /shop-product?product=:product 302'));assert(!grid.includes('data-shop-colour'));});

test('public quantity rules enforce minimums without requiring multiples',()=>{const v={min_order_qty:5,stock:20};assert.equal(minimumQuantity(v),5);assert.match(quantityProblem(v,4),/Minimum order/);assert.equal(quantityProblem(v,5),'');assert.equal(quantityProblem(v,6),'');assert.match(quantityProblem(v,21),/availability/);assert.match(quantityProblem(v,5.5),/Minimum order/);assert.equal(minimumQuantity({stock:1}),1);});

test('printer Buy now and basket controls activate when quantity checkout is available',()=>{const s=fs.readFileSync('assets/shop-storefront.js','utf8');assert(s.includes('printer_checkout_version===1'));assert(s.includes('id="sf-buy-now"'));assert(s.includes('Add to basket'));assert(s.includes('/shop/v2/printer-checkout'));assert(s.includes('form.requestSubmit()'));assert(s.includes('requestId??=crypto.randomUUID()'));});

test('printer purchase controls resolve Pages clean URLs and older direct addresses',()=>{
 for(const path of ['/shop-printer.html','/shop-printer','/shop-printer/','/shop/product/jadens-668bt','/shop/product/jadens-668bt/','/shop/product/jadens-668bt/index.html'])assert.equal(productIdForPath(path),'jadens-668bt',path);
 for(const path of ['/shop-product','/shop-product.html','/shop-product/']){
  assert.equal(productIdForPath(path),null);
  assert.equal(productIdForPath(path,'?product=bags-test'),'bags-test');
 }
 assert.equal(productIdForPath('/shop/product/bags-test'),'bags-test');
 for(const path of ['/shop','/shop.html','/','/shop/product/%E0%A4%A'])assert.equal(productIdForPath(path),null,path);
});

test('non-printer links preserve their selected ID and never fall back to the printer',()=>{
 for(const id of ['ps-grey-mailing-bags-pack-of-100','ps-warning-labels','ps-double-wall-boxes','custom_product_1']){const url=new URL(productPageURL(id),'https://inventoryos.co.uk');assert.equal(url.pathname,'/shop-product');assert.equal(productIdForPath(url.pathname,url.search),id);assert.equal(productIdForPath('/shop-product.html',url.search),id);}
 for(const query of ['', '?product=', '?product=../../private', '?product=%3Cscript%3E', '?product=unknown/bad'])assert.equal(productIdForPath('/shop-product',query),null);
 assert.equal(productPageURL('jadens-668bt'),'/shop/product/jadens-668bt');
 assert.equal(validProductId('unknown-safe-id'),'unknown-safe-id');assert.throws(()=>productPageURL('../wrong'));
 const redirects=fs.readFileSync('_redirects','utf8'),build=fs.readFileSync('scripts/build-shop.mjs','utf8');
 assert(!redirects.includes('/shop/product/* /shop-product.html 200'));assert(build.includes('/shop-product?product=:product 302'));
});

test('the shared product template contains no printer fallback or printer-only metadata',()=>{const html=fs.readFileSync('shop-product.html','utf8');assert(html.includes('<title>Product details | InventoryOS Shop</title>'));assert(!html.includes('data-printer-legacy-purchase'));assert(!html.includes('Explore the JADENS'));assert(html.includes('assets/shop-storefront.js?v=6'));});

import {orderLimit,availabilityText} from '../assets/shop-storefront-model.js';
test('supplier availability permits made-to-order sales with zero local stock without inventing a supplier count',()=>{const v={availability_mode:'supplier',availability_status:'available',order_limit:200,stock:0,min_order_qty:5};assert.equal(orderLimit(v),200);assert.equal(quantityProblem(v,5),'');assert(availabilityText(v).includes('Sourced after'));assert(!availabilityText(v).includes('200'));assert(quantityProblem({...v,availability_status:'unknown'},5).includes('being checked'));assert(quantityProblem({...v,availability_status:'unavailable',order_limit:0},5).includes('supplier'));assert.equal(orderLimit({...v,order_limit:10}),10);assert.equal(orderLimit({...v,availability_status:'unknown'}),0);});

import {variantMatrix,resolveVariant} from '../assets/shop-storefront-model.js';
test('size and colour selectors resolve exact real variants and reject combinations that do not exist',()=>{const variants=[{id:'g-small',name:'Green · Small · 100 bags'},{id:'g-large',name:'Green · Large · 100 bags'},{id:'p-small',name:'Pink · Small · 100 bags'}];const m=variantMatrix(variants);assert.deepEqual(m.colours,['Green','Pink']);assert.deepEqual(m.sizes,['Small · 100 bags','Large · 100 bags']);assert.equal(resolveVariant(m,'Small · 100 bags','Pink').id,'p-small');assert.equal(resolveVariant(m,'Large · 100 bags','Pink'),null);assert.equal(variantMatrix([{id:'x',name:'One roll'}]),null);});

test('multi-word catalogue colours keep their exact names in separate selectors',()=>{const m=variantMatrix(['Baby Blue','Hot Pink','Green','White','Purple'].flatMap(c=>['9 x 12"','10 x 14"'].map(size=>({id:c+size,name:c+' · '+size+' · 100 bags'}))));assert.equal(m.colours.length,5);assert.equal(m.entries.length,10);assert.equal(resolveVariant(m,'9 x 12" · 100 bags','Baby Blue').colour,'Baby Blue');});
