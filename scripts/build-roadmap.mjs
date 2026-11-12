import fs from 'node:fs/promises';
import { chapters, workflowMap } from '../src/data/workflow.js';
import { origin, escapeHTML as esc, social, jsonLD, organization } from './seo.mjs';

const header = (await fs.readFile('.build/header.html', 'utf8'))
  .replaceAll(/href="#(workflow|features|pricing)"/g, 'href="/#$1"');
const footer = await fs.readFile('.build/footer.html', 'utf8');
const url = origin + '/roadmap';
const title = 'Stock, Sales & Dispatch Workflow Map | InventoryOS';
const description = 'See how stock, till sales, Mi Marché storefronts, dispatch, reordering and expenses fit together in InventoryOS.';
const destinations = {
  stock: '/features#workflow',
  'record-sale': '/features#workflow',
  till: '/retail#workflow',
  storefront: '/marketplace#shops',
  dispatch: '/features#shipping-labels',
  reordering: '/features#reordering',
  receipts: '/features#features',
};
const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    organization,
    { '@type': 'WebPage', url, name: title, description },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
      { '@type': 'ListItem', position: 2, name: 'Workflow map', item: url },
    ] },
  ],
};

const steps = workflowMap.map(group => {
  const links = group.steps.map(id => {
    const chapter = chapters.find(item => item.id === id);
    return `<li><a href="${destinations[id]}">${esc(chapter.title)}</a><p>${esc(chapter.detail)}</p></li>`;
  }).join('');
  return `<li><h2>${esc(group.title)}</h2><ul>${links}</ul></li>`;
}).join('');

await fs.writeFile('roadmap.html', `<!doctype html>
<html lang="en-GB" data-marketing-appearance="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}">
${social({title,description,url})}<link rel="icon" href="/favicon.svg"><script src="/assets/appearance.js?v=1"></script>
<link rel="stylesheet" href="/assets/marketing.css?v=workflow-1"><link rel="stylesheet" href="/assets/appearance.css?v=unified-1">
<script type="application/ld+json">${jsonLD(graph)}</script>
</head>
<body id="top">
<a class="skip-link" href="#main">Skip to content</a>${header}
<main class="wrap workflow-map-page" id="main">
  <div class="workflow-map-head">
    <h1>Your InventoryOS workflow</h1>
    <p>See how the tools fit together, then choose a task to learn more.</p>
    <a class="button primary" href="/#workflow">Explore the workspace screens <span aria-hidden="true">↗</span></a>
  </div>
  <ol class="workflow-map-steps">${steps}</ol>
  <section class="workflow-map-extra">
    <h2>Make what you sell</h2>
    <p>Explore the <a href="/manufacturing#workflow">production tools</a> to see how recipes and materials become finished stock.</p>
  </section>
  <nav class="workflow-map-links" aria-label="Explore InventoryOS">
    <a href="/#pricing">Compare plans</a><a href="/guides">Browse guides</a><a href="/retail">Explore shops and tills</a><a href="/marketplace#shops">Browse Mi Marché</a>
  </nav>
</main>
${footer}<script src="/assets/pages.js?v=2" defer></script></body></html>
`);
