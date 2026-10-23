import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catalogue,paymentLink} from '../assets/shop-catalogue.js';
const source=JSON.parse(fs.readFileSync('assets/shop-products.json','utf8'));
test('the imported printer uses the agreed delivered price and cannot take payment before checkout is configured',()=>{
 const data=catalogue(source);assert.equal(data.products[0].pricePence,5899);assert.equal(data.products[0].gallery.length,9);assert.equal(data.ready,false);assert.equal(data.products[0].availability,'coming-soon');
 assert.equal(data.products[0].paymentLink,'https://buy.stripe.com/00w3cu7gb4NI1V2aWoaIM00');
 const html=fs.readFileSync('shop.html','utf8');assert(html.includes('£58.99'));assert(html.includes('Royal Mail'));assert(html.includes('Online ordering opens soon'));assert(!html.includes('href="https://buy.stripe.com/'));assert.equal((html.match(/data-shop-photo/g)||[]).length,9);
 for(const item of data.products[0].gallery)assert(fs.statSync(item.src).size>0);
});
test('a public checkout requires a valid live Stripe payment link and complete product details',()=>{
 for(const url of ['javascript:alert(1)','https://buy.stripe.com.evil.example/abc','http://buy.stripe.com/abc','https://user:pass@buy.stripe.com/abc','https://buy.stripe.com/test_abc','https://buy.stripe.com/abc?prefilled_email=private@example.test'])assert.equal(paymentLink(url),null);
 assert.equal(paymentLink('https://buy.stripe.com/example123'),'https://buy.stripe.com/example123');
 const available=structuredClone(source);available.products[0].availability='available';available.products[0].paymentLink=null;assert.throws(()=>catalogue(available),/checkout/);
 const launch=structuredClone(source);launch.products[0].availability='available';launch.checkoutEnabled=true;
 assert.equal(catalogue(launch).ready,false,'Incomplete returns information must keep checkout disabled');
 launch.returnsSummary='Contact hello@inventoryos.co.uk for returns.';
 assert.equal(catalogue(launch).ready,true);
 const invalidPrice=structuredClone(source);invalidPrice.products[0].pricePence=-1;assert.throws(()=>catalogue(invalidPrice));
 const traversal=structuredClone(source);traversal.products[0].image='assets/shop/../../private.png';assert.throws(()=>catalogue(traversal));
});
