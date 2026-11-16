import fs from 'node:fs/promises';
import {escapeHTML as esc,origin,social,jsonLD,organization} from './seo.mjs';
import {tools} from '../assets/tools/data.mjs';
import {toolContent} from './tools-content.mjs';
import {guides} from '../src/data/guides.js';

const header=(await fs.readFile('.build/header.html','utf8'))
  .replaceAll('href="#workflow"','href="/#workflow"').replaceAll('href="#features"','href="/#features"').replaceAll('href="#pricing"','href="/#pricing"')
  .replaceAll('<a href="/guides">Guides</a>','<a href="/guides">Guides</a><a href="/tools" aria-current="true">Free Tools</a>')
  .replaceAll('<a href="/guides">Guides &amp; advice</a>','<a href="/guides">Guides &amp; advice</a><a href="/tools" aria-current="true">Free Tools</a>');
const footer=(await fs.readFile('.build/footer.html','utf8')).replace('<a href="/guides">Guides &amp; advice</a>','<a href="/guides">Guides &amp; advice</a><a href="/tools">Free Tools</a>');
const groups=[...new Set(tools.map(tool=>tool.group))];
const slugByGroup={'Labels and codes':'labels','Business documents':'documents','Stock planning':'stock','Pricing':'pricing'};
const pagePath = tool => '/tools/'+tool.id;
const publicDescription='Free business tools for small shops and stockrooms. Create barcodes, SKUs, purchase orders and packing slips, or calculate costs and stock levels.';
const label = tool => '<a class="tools-card" href="'+pagePath(tool)+'"><h3>'+esc(tool.title)+'</h3><p>'+esc(tool.short)+'</p></a>';
const language = '<script src="/assets/tools/locale.js?v=1" defer></script>';

function shell({title,path,description,main,extra=[],scripts=''}){
  const url=origin+path;
  const crumbs=[
    {'@type':'ListItem',position:1,name:'Home',item:origin+'/'},
    {'@type':'ListItem',position:2,name:'Free Tools',item:origin+'/tools'}
  ];
  if(path!=='/tools')crumbs.push({'@type':'ListItem',position:3,name:title,item:url});
  const graph={'@context':'https://schema.org','@graph':[organization,{'@type':'BreadcrumbList',itemListElement:crumbs},...extra]};
  return `<!doctype html>
<html lang="en-GB" data-marketing-appearance="dark">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#080909">
<title>${esc(title)} | InventoryOS</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}">
${social({title:title+' | InventoryOS',description,url})}<link rel="icon" href="/favicon.svg">
<script src="/assets/appearance.js?v=1"></script><link rel="stylesheet" href="/assets/marketing.css?v=unified-1"><link rel="stylesheet" href="/assets/appearance.css?v=unified-1"><link rel="stylesheet" href="/assets/tools/tools.css?v=2">
<script type="application/ld+json">${jsonLD(graph)}</script></head>
<body id="top"><a class="skip-link" href="#main">Skip to content</a>${header}<main id="main" class="wrap tools-main">${main}</main>${footer}
${language}<script src="/assets/pages.js?v=2" defer></script>${scripts}</body></html>
`;
}
// Crawlable guidance under each tool: when to use it, a worked example, questions, related guides and the matching InventoryOS feature.
function guidance(tool){const c=toolContent[tool.id];if(!c)return '';const name=tool.title.replace(/^Free /,'');
  const related=guides.filter(g=>c.guides.includes(g.slug));
  return `<section class="tool-explainer"><h2>When to use the ${esc(name.toLowerCase())}</h2>${c.use.map(p=>'<p>'+esc(p)+'</p>').join('')}</section>
<section class="tool-explainer"><h2>Worked example</h2><ol class="tool-steps">${c.example.map(li=>'<li>'+li+'</li>').join('')}</ol><p class="tool-support">Sample figures for illustration.</p></section>
<section class="tool-explainer tool-faq"><h2>Common questions</h2>${c.faqs.map(([q,a])=>'<h3>'+esc(q)+'</h3><p>'+esc(a)+'</p>').join('')}</section>
<section class="tool-explainer"><h2>Related guides</h2><ul class="tool-links">${related.map(g=>'<li><a href="/guides/'+g.slug+'">'+esc(g.title)+'</a></li>').join('')}<li><a href="/guides">Browse all practical guides</a></li></ul><h3>${esc(c.app[0])}</h3><p>${esc(c.app[1])} <a href="${c.app[2]}">${esc(c.app[3])}</a>.</p></section>`;}
function fieldHTML(field){
  const {key,label,type='text',required,max,min,step,placeholder,value,options}=field;
  const attribute=(name,value)=>value===undefined?'':' '+name+'="'+esc(value)+'"';
  const common=' id="tool-'+key+'" name="'+key+'"'+(required?' required':'');
  let control;
  if(type==='textarea')control='<textarea'+common+attribute('maxlength',max)+attribute('placeholder',placeholder)+'></textarea>';
  else if(type==='select')control='<select'+common+'>'+options.map(([code,caption])=>'<option value="'+esc(code)+'">'+esc(caption)+'</option>').join('')+'</select>';
  else control='<input'+common+attribute('type',type)+attribute('value',value)+attribute('placeholder',placeholder)+
    attribute(type==='number'?'max':'maxlength',max)+attribute('min',min)+attribute('step',step)+(type==='file'?' accept="image/jpeg,image/png,image/webp"':'')+'>';
  return '<div class="tool-field"><label for="tool-'+key+'">'+esc(label)+'</label>'+control+'</div>';
}
const hub=shell({title:'Free Tools for Small Businesses',path:'/tools',description:publicDescription,
  main:`<header class="tools-hero"><p><a class="tools-back" href="/">InventoryOS</a></p><h1>Free Tools</h1><p>Make labels and documents, or work out pricing and stock levels. No account needed.</p></header>
${groups.map(group=>`<section class="tools-group" id="${slugByGroup[group]}"><h2>${esc(group)}</h2><div class="tools-grid">${tools.filter(tool=>tool.group===group).map(label).join('')}</div></section>`).join('')}
<section class="tool-explainer"><h2>Need to keep a stock record?</h2><p>Use InventoryOS to manage stock, sales and dispatch in one workspace.</p><a href="/features">Explore InventoryOS features</a></section>
<section class="tool-explainer"><h2>Practical guides</h2><p>Step-by-step advice on SKUs and barcodes, reorder levels, materials planning and shipping labels.</p><a href="/guides">Browse the practical guides</a></section>`,
  extra:[{'@type':'CollectionPage',name:'InventoryOS Free Tools',url:origin+'/tools',mainEntity:{'@type':'ItemList',itemListElement:tools.map((tool,index)=>({'@type':'ListItem',position:index+1,name:tool.title,url:origin+pagePath(tool)}))}}]});
await fs.writeFile('tools.html',hub);
await fs.mkdir('tools',{recursive:true});
for(const tool of tools){
  const path=pagePath(tool);
  const outputs=tool.document||['barcode-generator','sku-generator'].includes(tool.id);
  const print=tool.document||tool.id==='barcode-generator';
  const exportLabel=tool.document?'Download PDF':tool.id==='barcode-generator'?'Download label (SVG)':'Download CSV';
  const runLabel=tool.document?'Generate document':tool.id==='barcode-generator'?'Generate barcode':tool.id==='sku-generator'?'Generate SKUs':'Calculate';
  const scripts=(tool.id==='barcode-generator'?'<script src="/assets/tools/jsbarcode-3.11.6.min.js" defer></script>':'')+'<script type="module" src="/assets/tools/tool.mjs?v=1"></script>';
  const main=`<header class="tools-hero"><p><a class="tools-back" href="/tools">← All free tools</a></p><h1>${esc(tool.title)}</h1><p>${esc(tool.intro)}</p></header>
<div class="tool-work-area">
<form class="tool-form" data-tool-form="${tool.id}">
<h2>${tool.document?'Document details':'Enter your details'}</h2>
<div class="tool-fields">${tool.fields.map(fieldHTML).join('')}</div>
${tool.document?'<section class="tool-lines" aria-label="Document items"><h3>Items</h3><div data-document-lines></div><button type="button" class="tool-secondary" data-add-line>Add item</button></section>':''}
<div class="tool-actions"><button class="button primary" type="submit" disabled>${runLabel}</button></div>
${outputs?'<p class="tool-support">Files and details are processed in this browser.</p>':''}
<noscript><p>Enable JavaScript to use this tool.</p></noscript></form>
<section class="tool-results" aria-labelledby="tool-result-heading">
<h2 id="tool-result-heading">${outputs?'Preview':'Result'}</h2>
<div class="tool-output" data-tool-output data-empty="true"></div>
<p class="tool-empty">${outputs?'Generate a preview to see it here.':'Enter your figures and calculate the result.'}</p>
<p class="tool-status" data-tool-status role="status"></p>
${outputs?'<div class="tool-actions"><button type="button" data-export class="button primary" hidden>'+exportLabel+'</button>'+(print?'<button type="button" data-print class="tool-secondary" hidden>Print</button>':'')+'</div>':''}</section>
</div>
<section class="tool-explainer"><h2>${tool.formula?'How the calculation works':'Using the output'}</h2>${tool.formula?'<p><strong>'+esc(tool.formula)+'</strong></p>':''}<p>${esc(tool.method)}</p></section>
${guidance(tool)}
<section class="tools-group"><h2>Other free tools</h2><div class="tools-grid">${tools.filter(item=>item.id!==tool.id&&item.group===tool.group).map(label).join('')}<a class="tools-card" href="/tools"><h3>See all free tools</h3><p>Browse the full set of InventoryOS business tools.</p></a></div></section>`;
  await fs.writeFile('tools/'+tool.id+'.html',shell({title:tool.title,description:tool.description,path,main,scripts,
    extra:[{'@type':'WebApplication',name:tool.title,description:tool.description,url:origin+path,applicationCategory:'BusinessApplication',operatingSystem:'Web',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'GBP'}}]}));
}
export const toolURLs=['/tools',...tools.map(pagePath)];
