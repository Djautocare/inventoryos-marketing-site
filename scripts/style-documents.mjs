import fs from 'node:fs/promises';
const header=(await fs.readFile('.build/header.html','utf8')).replaceAll('href="#workflow"','href="index.html#workflow"').replaceAll('href="#features"','href="index.html#features"').replaceAll('href="#pricing"','href="index.html#pricing"');
const footer=await fs.readFile('.build/footer.html','utf8');
for(const file of ['privacy.html','terms.html','refunds.html','cookies.html','data-security.html','features.html']){
 let html=await fs.readFile(file,'utf8');
 html=html.replace(/<header\b[\s\S]*?<\/header>/,header).replace(/<footer\b[\s\S]*?<\/footer>/,footer);
 html=html.replace(/<body[^>]*>/,'<body id="top"'+(file==='features.html'?' class="feature-guide"':'')+'>');
 if(!html.includes('assets/pages.css'))html=html.replace('</head>','<link rel="stylesheet" href="assets/document-chrome.css?v=2"><link rel="stylesheet" href="assets/pages.css?v=2"></head>');
 if(!html.includes('assets/pages.js'))html=html.replace('</body>','<script src="assets/pages.js?v=2" defer></script></body>');
 html=html.replace(/<script\s+src="script\.js(?:\?[^\"]*)?"><\/script>/g,file==='features.html'?'<script src="script.js?v=guide-2"></script>':'');
 if(file==='features.html'){
  html=html.replace('<title>\n        InventoryOS | Inventory, manufacturing and retail POS\n    </title>','<title>Every feature & plan detail | InventoryOS</title>');
  html=html.replace('href="https://inventoryos.co.uk/"','href="https://inventoryos.co.uk/features.html"');
  if(!html.includes('class="document-intro"'))html=html.replace(/<main\b/,'<section class="document-intro"><div class="wrap"><div class="eyebrow">THE FULL PICTURE</div><h1>Every feature. Every plan.<br/>All the detail you need.</h1><p>Explore the full stock, dispatch, manufacturing and Retail feature details. Choose your business below to compare tools, plans and the practical details before you get started.</p><a class="inline-link" href="index.html">Back to the overview ↗</a></div></section><main');
 }else{
  if(!html.includes('class="document-actions"'))html=html.replace(/(<section class="legal-hero">[\s\S]*?<p>[\s\S]*?<\/p>)/,'$1<div class="document-actions"><a href="index.html">← Back to InventoryOS</a><a href="mailto:hello@inventoryos.co.uk">Questions? Get in touch ↗</a></div>');
  const sections=[...html.matchAll(/<article class="legal-card" id="([^"]+)">\s*<h2>([\s\S]*?)<\/h2>/g)];
  const toc=sections.map(([,id,title])=>`<a href="#${id}">${title.replace(/^\d+\.\s*/,'')}</a>`).join('\n');
  html=html.replace(/<aside class="legal-toc">[\s\S]*?<\/aside>/,`<aside class="legal-toc"><strong>On this page</strong>\n${toc}\n</aside>`);
 }
 await fs.writeFile(file,html);
}
console.log('Styled the complete guide and five policy pages.');
