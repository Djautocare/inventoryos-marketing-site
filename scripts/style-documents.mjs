import fs from 'node:fs/promises';
const header=(await fs.readFile('.build/header.html','utf8')).replaceAll('href="#workflow"','href="index.html#workflow"').replaceAll('href="#features"','href="index.html#features"').replaceAll('href="#pricing"','href="index.html#pricing"');
const footer=await fs.readFile('.build/footer.html','utf8');
for(const file of ['privacy.html','terms.html','refunds.html','cookies.html','data-security.html','features.html']){
 let html=await fs.readFile(file,'utf8');
 html=html.replace(/<header\b[\s\S]*?<\/header>/,header).replace(/<footer\b[\s\S]*?<\/footer>/,footer);
 html=html.replace(/<body[^>]*>/,'<body id="top"'+(file==='features.html'?' class="feature-guide"':'')+'>');
 if(!html.includes('assets/document-chrome.css'))html=html.replace('</head>','<link rel="stylesheet" href="assets/document-chrome.css?v=2"></head>');
 const documentStyle=file==='features.html'?'assets/feature-guide.css?v=3':'assets/pages.css?v=2';
 if(!html.includes(documentStyle))html=html.replace('</head>',`<link rel="stylesheet" href="${documentStyle}"></head>`);
 if(!html.includes('assets/pages.js'))html=html.replace('</body>','<script src="assets/pages.js?v=2" defer></script></body>');
 html=html.replace(/<script\s+src="script\.js(?:\?[^\"]*)?"><\/script>/g,file==='features.html'?'<script src="script.js?v=guide-3"></script>':'');
 if(file==='features.html'){
  html=html.replace('<title>\n        InventoryOS | Inventory, manufacturing and retail POS\n    </title>','<title>Every feature & plan detail | InventoryOS</title>');
  html=html.replace('href="https://inventoryos.co.uk/"','href="https://inventoryos.co.uk/features.html"');
  const intro='<section class="guide-intro"><div class="shell"><div class="eyebrow">THE COMPLETE FEATURE GUIDE</div><h1>All the detail.<br/><span>Find your next step.</span></h1><p>Explore the tools, workflows and plan details for your business. Use the section links below to go straight to what you need.</p><a class="guide-back" data-guide-back href="index.html">← Back to the reseller overview</a></div></section>';
  html=html.replace(/<section class="(?:document-intro|guide-intro)">[\s\S]*?<\/section>/,intro);
  const shortcuts='<div class="guide-shortcuts"><div class="shell"><strong data-guide-title>Reseller feature guide</strong><nav aria-label="Guide sections"><a data-guide-section="overview" href="#what-it-does">Overview</a><a data-guide-section="features" href="#features">Features</a><a data-guide-section="workflow" href="#workflow">Workflow</a><a data-guide-section="printing" href="#printing">Printing</a><a data-guide-section="pricing" href="#pricing">Plans & pricing</a><a data-guide-section="faq" href="#faq">Questions</a></nav></div></div>';
  html=html.replace(/<div class="guide-shortcuts">[\s\S]*?<\/nav><\/div><\/div>/,'');
  html=html.replace(/<main\b/,shortcuts+'<main');
 }else{
  if(!html.includes('class="document-actions"'))html=html.replace(/(<section class="legal-hero">[\s\S]*?<p>[\s\S]*?<\/p>)/,'$1<div class="document-actions"><a href="index.html">← Back to InventoryOS</a><a href="mailto:hello@inventoryos.co.uk">Questions? Get in touch ↗</a></div>');
  const sections=[...html.matchAll(/<article class="legal-card" id="([^"]+)">\s*<h2>([\s\S]*?)<\/h2>/g)];
  const toc=sections.map(([,id,title])=>`<a href="#${id}">${title.replace(/^\d+\.\s*/,'')}</a>`).join('\n');
  html=html.replace(/<aside class="legal-toc">[\s\S]*?<\/aside>/,`<aside class="legal-toc"><strong>On this page</strong>\n${toc}\n</aside>`);
 }
 await fs.writeFile(file,html);
}
console.log('Styled the complete guide and five policy pages.');
