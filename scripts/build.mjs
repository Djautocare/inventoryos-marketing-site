import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=process.cwd();
await fs.mkdir('.build',{recursive:true});await fs.mkdir('assets',{recursive:true});await fs.mkdir('assets/fonts',{recursive:true});
await fs.copyFile('node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2','assets/fonts/manrope-latin.woff2');
await fs.copyFile('node_modules/@fontsource-variable/manrope/LICENSE','assets/fonts/MANROPE-LICENSE.txt');
await build({entryPoints:['src/App.jsx'],outfile:'.build/server.cjs',bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom'],loader:{'.css':'empty'},logLevel:'silent'});
const {default:App,Header,Footer}=require(path.resolve('.build/server.cjs')),{default:React}=await import('react'),{renderToString,renderToStaticMarkup}=await import('react-dom/server');
await build({entryPoints:['src/client.jsx'],outfile:'assets/marketing.js',bundle:true,minify:true,format:'esm',target:['es2020'],external:['/assets/fonts/*'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},loader:{'.woff2':'file'},assetNames:'[name]',legalComments:'linked',logLevel:'info'});
const data={resellers:{file:'index.html',title:'InventoryOS — Less stock stress. More room to grow.',description:'Stock, sales, expenses, barcodes and dispatch tools for UK resellers. Start free with 100 active items. Explore Manufacturing and InventoryOS Retail.',url:'https://inventoryos.co.uk/'},manufacturing:{file:'manufacturing.html',title:'Manufacturing & small business software | InventoryOS',description:'Materials, recipes, batch production, traceability and equipment timers for small manufacturers. Manufacturing mode is included in InventoryOS Business.',url:'https://inventoryos.co.uk/manufacturing.html'},retail:{file:'retail.html',title:'InventoryOS Retail — Your shop, from shelf to sale',description:'Retail inventory, a dedicated Till PWA, staff PINs, ordering, loyalty and reports. £19.99 per shop per month with unlimited tills and staff.',url:'https://inventoryos.co.uk/retail.html'}};
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [mode,p]of Object.entries(data)){
 const markup=renderToString(React.createElement(App,{initialMode:mode}));
 const offers=mode==='retail'?[{name:'InventoryOS Retail per shop / month',price:'19.99'}]:[{name:'Free',price:'0'},{name:'Starter monthly',price:'7.99'},{name:'Pro monthly',price:'14.99'},{name:'Business monthly',price:'29.99'}];
 const ld={'@context':'https://schema.org','@type':'SoftwareApplication',name:mode==='retail'?'InventoryOS Retail':'InventoryOS',applicationCategory:'BusinessApplication',operatingSystem:'Web',url:p.url,description:p.description,offers:offers.map(x=>({'@type':'Offer',...x,priceCurrency:'GBP'}))};
 const html='<!doctype html>\n<html lang="en" data-marketing-appearance="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(p.title)+'</title><meta name="description" content="'+esc(p.description)+'"><meta name="theme-color" content="#080909"><script src="assets/appearance.js?v=1"></script><meta property="og:type" content="website"><meta property="og:title" content="'+esc(p.title)+'"><meta property="og:description" content="'+esc(p.description)+'"><meta property="og:url" content="'+p.url+'"><meta property="og:image" content="https://inventoryos.co.uk/social-preview.svg"><link rel="canonical" href="'+p.url+'"><link rel="icon" type="image/svg+xml" href="favicon.svg"><link rel="preload" href="assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="assets/marketing.css?v=3"><link rel="stylesheet" href="assets/appearance.css?v=1"><script type="application/ld+json">'+JSON.stringify(ld)+'</script></head><body><div id="root" data-mode="'+mode+'"><!--email_off-->'+markup+'<!--/email_off--></div><script type="module" src="assets/marketing.js?v=3"></script></body></html>\n';
 await fs.writeFile(p.file,html);
}
// Small shared fragments let policy pages use the same branding without needing JavaScript.
await fs.writeFile('.build/header.html',renderToStaticMarkup(React.createElement(Header)));
await fs.writeFile('.build/footer.html',renderToStaticMarkup(React.createElement(Footer)));
console.log('Built three pre-rendered pages. All primary content and links work without JavaScript.');
