import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {catalogue,paymentLink} from '../assets/shop-catalogue.js';
import {purchaseMarkup} from '../scripts/shop-purchase.mjs';
import vm from 'node:vm';
const source=JSON.parse(fs.readFileSync('assets/shop-products.json','utf8'));
test('the live printer uses the agreed delivered price and exposes its colour checkouts',()=>{
 const data=catalogue(source);assert.equal(data.products[0].pricePence,5899);assert.equal(data.products[0].gallery.length,9);assert.equal(data.ready,true);assert.equal(data.products[0].availability,'available');
 assert.equal(data.products[0].paymentLink,'https://buy.stripe.com/00w3cu7gb4NI1V2aWoaIM00');
 const html=fs.readFileSync('shop.html','utf8');assert(html.includes('£58.99'));assert(html.includes('Free UK shipping'));assert(!html.includes('Online ordering opens soon'));assert(html.includes('data-shop-colour'));assert(html.includes('data-shop-buy'));assert.equal((html.match(/data-shop-photo/g)||[]).length,9);
 for(const variant of data.products[0].variants)assert(html.includes(`href="${variant.paymentLink}"`));
 for(const item of data.products[0].gallery)assert(fs.statSync(item.src).size>0);
});
test('a public checkout requires a valid live Stripe payment link and complete product details',()=>{
 for(const url of ['javascript:alert(1)','https://buy.stripe.com.evil.example/abc','http://buy.stripe.com/abc','https://user:pass@buy.stripe.com/abc','https://buy.stripe.com/test_abc','https://buy.stripe.com/abc?prefilled_email=private@example.test'])assert.equal(paymentLink(url),null);
 assert.equal(paymentLink('https://buy.stripe.com/example123'),'https://buy.stripe.com/example123');
 const available=structuredClone(source);available.products[0].availability='available';available.products[0].paymentLink=null;assert.throws(()=>catalogue(available),/checkout/);
 const launch=structuredClone(source);launch.products[0].availability='available';launch.checkoutEnabled=true;
 launch.returnsSummary='';
 assert.equal(catalogue(launch).ready,false,'Incomplete returns information must keep checkout disabled');
 launch.returnsSummary='Contact hello@inventoryos.co.uk for returns.';
 launch.seller={name:'Test seller',address:'Test address',email:'hello@example.test'};
 assert.equal(catalogue(launch).ready,true);
 launch.seller.address='';assert.equal(catalogue(launch).ready,false,'Seller address must be supplied before checkout');
 const invalidPrice=structuredClone(source);invalidPrice.products[0].pricePence=-1;assert.throws(()=>catalogue(invalidPrice));
 const traversal=structuredClone(source);traversal.products[0].image='assets/shop/../../private.png';assert.throws(()=>catalogue(traversal));
});
test('all three colours have distinct live checkouts and a working non-JavaScript purchase path',()=>{
 const p=catalogue(source).products[0];assert.deepEqual(p.variants.map(v=>v.colour),['Black','White','Pink']);
 assert.equal(new Set(p.variants.map(v=>v.paymentLink)).size,3);
 const live=purchaseMarkup({...p,availability:'available'},true);
 for(const variant of p.variants){assert(live.includes(`data-payment-link="${variant.paymentLink}"`));assert(live.match(/<noscript>([\s\S]*)<\/noscript>/)[1].includes(`href="${variant.paymentLink}"`));}
 assert(!purchaseMarkup({...p,availability:'available'},false).includes('buy.stripe.com'));
 const wrong=structuredClone(source);wrong.products[0].variants[1].paymentLink='https://buy.stripe.com/test_example';assert.throws(()=>catalogue(wrong),/colour checkout/);
});
test('changing the colour changes the actual purchase link and the image, including after browser history restores a selection',()=>{
 const variants=catalogue(source).products[0].variants;
 let selected=0;const handlers={},buy={setAttribute(){}},image={};
 const select={get selectedOptions(){const v=variants[selected];return [{dataset:{paymentLink:v.paymentLink,photo:v.image,colour:v.colour}}];},addEventListener(name,fn){handlers[name]=fn;}};
 const product={querySelector(s){if(s==='.shop-price')return {textContent:'£58.99'};if(s==='h2')return {textContent:'JADENS printer'};if(s==='.shop-product-image')return image;return null;},querySelectorAll(){return [];}};
 const control={hidden:true,querySelector(s){return s==='[data-shop-colour]'?select:s==='[data-shop-buy]'?buy:null;},closest(){return product;}};
 vm.runInNewContext(fs.readFileSync('assets/shop.js','utf8'),{document:{querySelectorAll(){return [control];},addEventListener(){}},window:{addEventListener(name,fn){handlers[name]=fn;}}});
 assert.equal(control.hidden,false);
 for(selected=0;selected<variants.length;selected++){handlers.change();assert.equal(buy.href,variants[selected].paymentLink);assert.equal(image.src,variants[selected].image);assert(buy.textContent.includes(variants[selected].colour.toLowerCase()));}
 selected=1;handlers.pageshow();assert.equal(buy.href,variants[1].paymentLink);
});
