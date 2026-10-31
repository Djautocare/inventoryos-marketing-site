import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {marketplaceGuides} from '../src/data/marketplace-guides.js';
const read=p=>fs.readFileSync(p,'utf8');
test('public marketplace is an honest coming-soon route with crawlable articles, privacy and launch-only opt-in',()=>{
 const html=read('marketplace.html');assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes('href="https://inventoryos.co.uk/marketplace"'));assert(html.includes('Buying, selling and marketplace accounts have not launched'));assert(html.includes('name="consent" type="checkbox" required'));assert(!html.includes('type="checkbox" checked'));assert(html.includes('separate launch-interest list'));assert(html.includes('href="/privacy#marketplace-interest"'));assert(read('privacy.html').includes('id="marketplace-interest"'));assert(!html.includes('chatgpt.site'));assert(!html.includes('Stripe'));
 for(const file of ['index.html','manufacturing.html','retail.html','guides.html','contact.html'])assert(read(file).includes('href="/marketplace"'),file);
 for(const article of marketplaceGuides){assert(html.includes('/guides/'+article.slug));assert(read('guides/'+article.slug+'.html').includes('datetime="2026-10-31"'));assert(read('sitemap.xml').includes('/guides/'+article.slug));}
 const schemas=[...html.matchAll(/type="application\/ld\+json">([^<]+)/g)].map(x=>JSON.parse(x[1]));assert(schemas.every(x=>x['@graph'].every(y=>!['Product','Offer','AggregateRating'].includes(y['@type']))));
});
function formFixture(responses,{valid=true,intent='sell'}={}){
 const nodes={},events={},fields={email:{value:' person@example.com '},audience:{value:'unsure'},consent:{checked:true},website:{value:''}},requests=[];
 const node=id=>nodes[id]||(nodes[id]={textContent:'',disabled:false,hidden:true,addEventListener:(type,fn)=>{events[id+':'+type]=fn}});
 const form=node('marketplace-interest-form');form.elements={namedItem:n=>fields[n]};form.reportValidity=()=>valid;form.reset=()=>{form.didReset=true};
 const context={document:{getElementById:node},location:{search:'?intent='+intent},URLSearchParams,AbortSignal,fetch:async(url,options)=>{requests.push({url,options});const value=responses.shift();if(value instanceof Error)throw value;return value}};
 vm.createContext(context);vm.runInContext(read('assets/marketplace-interest.js'),context);
 const tick=()=>new Promise(resolve=>setImmediate(resolve));return {nodes,events,fields,requests,form,tick,submit:()=>events['marketplace-interest-form:submit']({preventDefault(){}})};
}
const ready={ok:true,json:async()=>({marketplace_interest:true,consent_version:'mi-marche-launch-v1'})},success={ok:true,json:async()=>({success:true})};
test('launch form preserves intent, saves explicit consent once and reports success only after server confirmation',async()=>{
 const f=formFixture([ready,success]);await f.tick();assert.equal(f.fields.audience.value,'private-seller');assert.equal(f.nodes['mm-submit'].disabled,false);await f.submit();assert.equal(f.requests.length,2);const payload=JSON.parse(f.requests[1].options.body);assert.equal(payload.email,'person@example.com');assert.equal(payload.consent,true);assert.equal(payload.consent_version,'mi-marche-launch-v1');assert.equal(f.requests[1].options.credentials,'omit');assert.equal(f.nodes['mm-submit'].disabled,true);assert(f.nodes['mm-status'].textContent.includes('request has been received'));await f.submit();assert.equal(f.requests.length,2);assert(f.form.didReset);
});
test('unavailable, failed, invalid and repeated submissions never invent a saved signup',async()=>{
 let f=formFixture([new Error('Failed to fetch')]);await f.tick();assert(f.nodes['mm-submit'].disabled);assert(!f.nodes['mm-fallback'].hidden);assert(f.nodes['mm-status'].textContent.includes('unavailable'));
 f=formFixture([ready,{ok:false,status:429,json:async()=>({success:false})}]);await f.tick();await f.submit();assert(f.nodes['mm-status'].textContent.includes('try again later'));assert(!f.nodes['mm-submit'].disabled);assert(!f.form.didReset);
 f=formFixture([ready],{valid:false});await f.tick();await f.submit();assert.equal(f.requests.length,1);
 let resolve;const pending=new Promise(r=>resolve=r);f=formFixture([ready,{ok:true,json:()=>pending}]);await f.tick();const first=f.submit();await f.tick();await f.submit();assert.equal(f.requests.length,2);resolve({success:true});await first;
});
