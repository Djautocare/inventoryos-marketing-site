import fs from 'node:fs/promises';
import { clips, tourChapters } from '../assets/demo/scenes.js';
import { signup } from '../src/data/content.js';
import { origin, escapeHTML as esc, social, jsonLD, organization } from './seo.mjs';

const header = (await fs.readFile('.build/header.html', 'utf8'))
  .replaceAll(/href="#(workflow|features|pricing)"/g, 'href="/#$1"');
const footer = await fs.readFile('.build/footer.html', 'utf8');
const url = origin + '/tour';
const title = 'Full Visual Walkthrough | InventoryOS';
const description = 'See how to add stock, record sales, crop shipping labels, reorder stock, upload invoices and run production in InventoryOS.';
const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    organization,
    { '@type': 'WebPage', url, name: title, description },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
      { '@type': 'ListItem', position: 2, name: 'Full visual walkthrough', item: url },
    ] },
  ],
};
const chapters = tourChapters.map(chapter =>
  `<li><a href="#${chapter.id}" data-demo-chapter>${esc(chapter.label)}</a></li>`
).join('');
const transcript = clips.tour[1].map((scene, index) => {
  const chapter = tourChapters.find(item => item.scene === index);
  const text = scene.t === 'T' ? scene.l.map(line => line.replace(/^[aq]:/, '')).join(' ') : scene.b;
  return `<li${chapter ? ' id="' + chapter.id + '"' : ''}><strong>${esc(text)}</strong>${scene.s ? ' ' + esc(scene.s) : ''}</li>`;
}).join('');

await fs.writeFile('tour.html', `<!doctype html>
<html lang="en-GB" data-marketing-appearance="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${url}">
${social({title,description,url})}<link rel="icon" href="/favicon.svg"><script src="/assets/appearance.js?v=1"></script>
<link rel="stylesheet" href="/assets/marketing.css?v=demo-1"><link rel="stylesheet" href="/assets/appearance.css?v=unified-1">
<script type="module" src="/assets/demo/player.js"></script>
<script type="application/ld+json">${jsonLD(graph)}</script>
</head>
<body id="top">
<a class="skip-link" href="#main">Skip to content</a>${header}
<main class="wrap full-demo" id="main">
  <header>
    <h1>The full InventoryOS tour</h1>
    <p>Follow a sample business from adding its first product to selling, dispatching and restocking.</p>
  </header>
  <div class="full-demo-layout">
    <div>
      <inventoryos-demo clip="tour" id="play-tour">
        <img class="demo-fallback" src="/assets/workflow/stock-overview.webp" alt="InventoryOS sample workspace overview" width="1120" height="700">
      </inventoryos-demo>
      <small>2 min 41 sec · Sample data · Some features require a paid plan</small>
      <small>Tap the demo to play or pause. Drag the timeline to skip to a different point.</small>
    </div>
    <nav class="full-demo-topics" aria-label="Tour chapters">
      <h2>Jump to a task</h2><ul>${chapters}</ul>
    </nav>
  </div>
  <details id="tour-transcript"><summary>Read the walkthrough</summary><ol>${transcript}</ol></details>
  <div class="full-demo-links">
    <a class="button primary" href="${esc(signup + '&plan=free')}">Start free</a>
    <a class="inline-link" href="/#see-it-in-action">Watch the short demo</a>
    <a class="inline-link" href="/roadmap">Explore the workflow map</a>
  </div>
</main>
${footer}<script src="/assets/pages.js?v=2" defer></script></body></html>
`);
