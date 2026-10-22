import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(p,'utf8'),audit=JSON.parse(read('tests/original-content-audit.json'));
const main=s=>s.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1].replace(/\s+/g,' ').trim();
test('the complete original marketing main content is preserved in the feature guide',()=>{
 const content=main(read('features.html')).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();assert.equal(crypto.createHash('sha256').update(content).digest('hex'),audit.original_main_text_sha256);assert(read('features.html').includes('<noscript>'));assert(read('features.html').includes('audience-panel[hidden]{display:block!important}'));
});
test('learn-more links open their audience and relevant topic in the redesigned guide',()=>{
 const destinations={'index.html':['workflow','shipping-labels','features','pricing'],'manufacturing.html':['mfg-workflow','recipe-planning','mfg-features','pricing'],'retail.html':['retail-workflow','retail-pricing','retail-features']};
 for(const [file,sections] of Object.entries(destinations)){
  const mode=file==='index.html'?'resellers':file.split('.')[0],html=read(file);
  for(const section of sections)assert(html.includes('features.html?audience='+mode+'#'+section),file+' missing topic '+section);
 }
 const guide=read('features.html');assert(guide.includes('assets/feature-guide.css'));assert(!guide.includes('href="styles.css'));assert(!guide.includes('href="assets/pages.css'));assert(guide.includes('aria-label="Guide sections"'));assert(read('script.js').includes('scrollToGuideHash'));
});
test('three public pages are pre-rendered, with distinct metadata, correct pricing and signup destinations',()=>{
 for(const [file,mode,price]of [['index.html','resellers','14.99'],['manufacturing.html','manufacturing','29.99'],['retail.html','retail','19.99']]){
  const html=read(file).replace(/<!--[\s\S]*?-->/g,'');assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes('data-mode="'+mode+'"'));assert(html.includes('https://inventoryos.co.uk/'));assert(html.includes('£'+price));assert(html.includes('features.html?audience='+mode));assert(html.includes('href="privacy.html"'));assert(html.includes('Illustrative interface'));assert(html.includes('one free week of Business'));assert(!html.includes('visibility:hidden'));assert(!html.includes('opacity:0'));assert(html.includes('type="application/ld+json"'));
 }
 const retail=read('retail.html');assert(retail.includes('returnTo=%2Fretail%2Fdashboard%2Findex.html'));assert(retail.includes('does not trigger or independently verify'));assert(retail.includes('separate paid add-on from £2.99/month'));assert(read('manufacturing.html').includes('requires Business and is off by default'));
});
test('all original policy sections remain alongside the new Retail, billing, privacy and cancellation coverage',()=>{
 for(const [name,ids]of Object.entries(audit.original_policy_ids)){const html=read(name+'.html');for(const id of ids)assert(html.includes('id="'+id+'"'),name+': '+id);assert(html.includes('Last updated: 22 October 2026'));assert(html.includes('document-chrome.css'));}
 for(const [file,terms]of [['privacy.html',['Retail records','loyalty','Resend','marketing','Local copies','support status','outside the UK']],['terms.html',['£19.99/month','£2.99 for the first 30 days','1,001–5,000 £4.99','25,000','private PIN','fraud','consumer rights']],['refunds.html',['14 days','proportionate charge','does not override','Cancelling one shop','usage','Optional cancellation wording']],['cookies.html',['GSAP, Lenis and React Bits','served from our own site','pending cash-sale sync']],['data-security.html',['private signing key','Staff access','confirmed','original device']]] )for(const term of terms)assert(read(file).includes(term),file+': '+term);
});
test('local links and assets resolve, anchors exist and page IDs are unique',()=>{
 for(const file of fs.readdirSync('.').filter(x=>x.endsWith('.html'))){
  const html=read(file),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,file+' duplicate IDs');
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
   const link=match[1].replaceAll('&amp;','&');if(/^(?:https?:|mailto:|data:)/.test(link))continue;
   const [target,hash]=link.split('#'),local=(target||file).split('?')[0].replace(/^\//,'');assert(fs.existsSync(local),file+' missing '+local);
   if(hash&&local.endsWith('.html'))assert(read(local).includes('id="'+hash+'"'),file+' missing anchor '+link);
  }
 }
 for(const file of ['assets/fonts/manrope-latin.woff2','assets/marketing.js','assets/marketing.css','assets/pages.js','THIRD-PARTY-NOTICES.txt'])assert(fs.statSync(file).size>0);
 assert(read('src/marketing.css').includes('@media(prefers-reduced-motion:reduce)'));assert(read('src/App.jsx').includes("gsap.ticker.remove(tick)"));assert(read('src/App.jsx').includes("lenis.on('scroll',ScrollTrigger.update)"));
});
