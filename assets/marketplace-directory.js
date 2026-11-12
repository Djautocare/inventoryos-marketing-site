'use strict';

(() => {
  const status = document.getElementById('mm-directory-status');
  const directory = document.getElementById('mm-directory');
  const retry = document.getElementById('mm-directory-retry');
  if (!directory) return;

  async function load() {
    retry.hidden = true;
    status.textContent = 'Loading published shops…';
    try {
      const response = await fetch('https://api.inventoryos.co.uk/platform/marche/directory', {
        credentials: 'omit',
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      const data = await response.json();
      if (!response.ok || data.success !== true || !Array.isArray(data.shops)) {
        throw new Error('Shop directory unavailable');
      }

      const cards = [];
      for (const shop of data.shops) {
        if (!shop || typeof shop.slug !== 'string' || !/^[a-z0-9][a-z0-9-]{2,39}$/.test(shop.slug) ||
            typeof shop.name !== 'string' || !shop.name.trim()) continue;
        const card = document.createElement('li');
        const name = document.createElement('h3');
        const link = document.createElement('a');
        link.href = 'https://app.inventoryos.co.uk/marche/' + encodeURIComponent(shop.slug);
        link.textContent = shop.name;
        name.append(link);
        card.append(name);
        if (typeof shop.description === 'string' && shop.description.trim()) {
          const description = document.createElement('p');
          description.textContent = shop.description;
          card.append(description);
        }
        cards.push(card);
      }
      directory.replaceChildren(...cards);
      status.textContent = cards.length ? '' : 'No shops have been published yet. They’ll appear here as sellers open their storefronts.';
    } catch {
      status.textContent = 'The shop directory is temporarily unavailable.';
      retry.hidden = false;
    }
  }

  retry.addEventListener('click', load);
  load();
})();
