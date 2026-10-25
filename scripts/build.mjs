import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {social,jsonLD,organization,verification} from './seo.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),root=process.cwd();
await fs.mkdir('.build',{recursive:true});await fs.mkdir('assets',{recursive:true});await fs.mkdir('assets/fonts',{recursive:true});
await fs.copyFile('node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2','assets/fonts/manrope-latin.woff2');
await fs.copyFile('node_modules/@fontsource-variable/manrope/LICENSE','assets/fonts/MANROPE-LICENSE.txt');
await build({entryPoints:['src/App.jsx'],outfile:'.build/server.cjs',bundle:true,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom'],loader:{'.css':'empty'},logLevel:'silent'});
const {default:App,Header,Footer}=require(path.resolve('.build/server.cjs')),{default:React}=await import('react'),{renderToString,renderToStaticMarkup}=await import('react-dom/server');
await fs.mkdir('assets/marketing',{recursive:true});
const result=await build({entryPoints:['src/client.jsx'],outdir:'assets/marketing',entryNames:'entry-[hash]',chunkNames:'chunk-[hash]',bundle:true,splitting:true,minify:true,format:'esm',target:['es2020'],external:['/assets/fonts/*'],jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},loader:{'.woff2':'file'},assetNames:'[name]',legalComments:'linked',metafile:true,logLevel:'info'});
const entry=Object.entries(result.metafile.outputs).find(([name,info])=>info.entryPoint==='src/client.jsx'&&name.endsWith('.js'))[0];
const css=result.metafile.outputs[entry].cssBundle;
await fs.copyFile(css,'assets/marketing.css');await fs.writeFile('assets/marketing.js',`import './${entry.replace('assets/','')}';\n`);
const config=JSON.parse(await fs.readFile('seo.config.json','utf8')),siteVerification=verification(process.env.GOOGLE_SITE_VERIFICATION||config.googleSiteVerification);
const data={resellers:{file:'index.html',title:'Inventory Software for UK Resellers | InventoryOS',description:'Stock, sales, expenses, barcodes and dispatch tools for UK resellers. Start free with 100 active items. Explore Manufacturing and InventoryOS Retail.',url:'https://inventoryos.co.uk/'},manufacturing:{file:'manufacturing.html',title:'Small Business Manufacturing Software | InventoryOS',description:'Materials, recipes, batch production, traceability and equipment timers for small manufacturers. Manufacturing mode is included in InventoryOS Business.',url:'https://inventoryos.co.uk/manufacturing'},retail:{file:'retail.html',title:'Retail POS & Stock Management Software | InventoryOS',description:'Retail inventory, a dedicated Till PWA, staff PINs, ordering, loyalty and reports. £19.99 per shop per month with unlimited tills and staff.',url:'https://inventoryos.co.uk/retail'}};
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const [mode,p]of Object.entries(data)){
 const markup=renderToString(React.createElement(App,{initialMode:mode}));
 const offers=mode==='manufacturing'?[{name:'InventoryOS Business monthly — includes Manufacturing',price:'29.99'}]:mode==='retail'?[{name:'InventoryOS Retail per shop / month',price:'19.99'}]:[{name:'Free',price:'0'},{name:'Starter monthly',price:'7.99'},{name:'Pro monthly',price:'14.99'},{name:'Business monthly',price:'29.99'}];
 const ld={'@context':'https://schema.org','@type':'SoftwareApplication',name:mode==='retail'?'InventoryOS Retail':'InventoryOS',applicationCategory:'BusinessApplication',operatingSystem:'Web',url:p.url,description:p.description,offers:offers.map(x=>({'@type':'Offer',...x,priceCurrency:'GBP'}))};
 const graph={'@context':'https://schema.org','@graph':[organization,{'@type':'WebSite','@id':'https://inventoryos.co.uk/#website',url:'https://inventoryos.co.uk/',name:'InventoryOS',publisher:{'@id':organization['@id']}},{...ld,'@context':undefined,'@id':p.url+'#software',publisher:{'@id':organization['@id']}}]};
 const html='<!doctype html>\n<html lang="en-GB" data-marketing-appearance="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(p.title)+'</title><meta name="description" content="'+esc(p.description)+'"><meta name="theme-color" content="#080909"><script src="/assets/appearance.js?v=1"></script>'+social(p)+siteVerification+'<link rel="canonical" href="'+p.url+'"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/marketing.css?v=5"><link rel="stylesheet" href="/assets/appearance.css?v=1"><script type="application/ld+json">'+jsonLD(graph)+'</script></head><body><div id="root" data-mode="'+mode+'"><!--email_off-->'+markup+'<!--/email_off--></div><script type="module" src="/'+entry+'"></script></body></html>\n';
 await fs.writeFile(p.file,html);
}
// Small shared fragments let policy pages use the same branding without needing JavaScript.
await fs.writeFile('.build/header.html',renderToStaticMarkup(React.createElement(Header)));
await fs.writeFile('.build/footer.html',renderToStaticMarkup(React.createElement(Footer)));
console.log('Built three pre-rendered pages. All primary content and links work without JavaScript.');

await import('./build-shop.mjs');

await import('./build-contact.mjs');

await import('./build-seo.mjs');

