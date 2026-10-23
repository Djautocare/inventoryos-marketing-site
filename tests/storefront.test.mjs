import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {selectProducts,minimumQuantity,quantityProblem,productIdForPath} from '../assets/shop-storefront-model.js';
const products=[{id:'printer',name:'Printer',category:'Printers',description:'USB',variants:[{price_pence:5899}]},{id:'bags',name:'Mailing bags',category:'Bags',description:'Grey',variants:[{price_pence:900},{price_pence:600}]},{id:'bubble',name:'Bubble wrap',category:'Protective packaging',description:'Small bubbles',variants:[{price_pence:1400}]}];
test('catalogue filters and price sorting use the cheapest available variant per product',()=>{assert.deepEqual(selectProducts(products,{sort:'price-asc'}).map(p=>p.id),['bags','bubble','printer']);assert.deepEqual(selectProducts(products,{sort:'price-desc'}).map(p=>p.id),['printer','bubble','bags']);assert.deepEqual(selectProducts(products,{category:'bags'}).map(p=>p.id),['bags']);assert.deepEqual(selectProducts(products,{category:'bubble'}).map(p=>p.id),['bubble']);assert.deepEqual(selectProducts(products,{search:'grey'}).map(p=>p.id),['bags']);assert.equal(selectProducts(products,{category:'labels'}).length,0);});
test('grid and product deep links are built with separate product details and cart controls',()=>{const grid=fs.readFileSync('shop.html','utf8'),detail=fs.readFileSync('shop/product/jadens-668bt/index.html','utf8');assert(grid.includes('class="sf-grid"'));assert(grid.includes('value="price-desc"'));assert(grid.includes('data-cart-open'));assert(grid.includes('shop/product/jadens-668bt'));assert(detail.includes('data-product-content'));assert(detail.includes('<base href="/">'));assert(fs.readFileSync('_redirects','utf8').includes('/shop/product/* /shop-product.html 200'));assert(!grid.includes('data-shop-colour'));});

test('public quantity rules enforce minimums without requiring multiples',()=>{const v={min_order_qty:5,stock:20};assert.equal(minimumQuantity(v),5);assert.match(quantityProblem(v,4),/Minimum order/);assert.equal(quantityProblem(v,5),'');assert.equal(quantityProblem(v,6),'');assert.match(quantityProblem(v,21),/stock/);assert.match(quantityProblem(v,5.5),/Minimum order/);assert.equal(minimumQuantity({stock:1}),1);});

test('printer Buy now and basket controls activate when quantity checkout is available',()=>{const s=fs.readFileSync('assets/shop-storefront.js','utf8');assert(s.includes('printer_checkout_version===1'));assert(s.includes('id="sf-buy-now"'));assert(s.includes('Add to basket'));assert(s.includes('/shop/v2/printer-checkout'));assert(s.includes('buyRequest??=crypto.randomUUID()'));});

test('printer purchase controls resolve Pages clean URLs and older direct addresses',()=>{
 for(const path of ['/shop-printer.html','/shop-printer','/shop-printer/','/shop/product/jadens-668bt','/shop/product/jadens-668bt/','/shop/product/jadens-668bt/index.html'])assert.equal(productIdForPath(path),'jadens-668bt',path);
 for(const path of ['/shop-product','/shop-product.html','/shop-product/']){
  assert.equal(productIdForPath(path),'jadens-668bt');
  assert.equal(productIdForPath(path,'?product=bags-test'),'bags-test');
 }
 assert.equal(productIdForPath('/shop/product/bags-test'),'bags-test');
 for(const path of ['/shop','/shop.html','/','/shop/product/%E0%A4%A'])assert.equal(productIdForPath(path),null,path);
});
