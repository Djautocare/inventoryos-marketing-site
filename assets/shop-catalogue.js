// Public catalogue only. Stripe holds the payable prices; no API keys belong here.
export function paymentLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'buy.stripe.com' &&
      !url.username && !url.password && !url.port && !url.search && !url.hash &&
      /^\/[A-Za-z0-9_]+$/.test(url.pathname) && !url.pathname.startsWith('/test_')
      ? url.href : null;
  } catch { return null; }
}
export function catalogue(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.products)) throw Error('Invalid catalogue');
  const ids = new Set();
  const products = value.products.filter(p => p && p.published === true).map(p => {
    if (typeof p.id !== 'string' || !/^[a-z0-9-]+$/.test(p.id) || ids.has(p.id) ||
        typeof p.name !== 'string' || !p.name.trim() || typeof p.description !== 'string' ||
        typeof p.category !== 'string' || !p.category.trim() ||
        !Number.isSafeInteger(p.pricePence) || p.pricePence <= 0 ||
        !['available','sold-out','coming-soon'].includes(p.availability) ||
        typeof p.image !== 'string' || !/^assets\/shop\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(p.image) ||
        typeof p.delivery !== 'string' || !p.delivery.trim() ||
        !Array.isArray(p.gallery) || !p.gallery.length ||
        p.gallery.some(x => typeof x.src !== 'string' || !/^assets\/shop\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(x.src) || typeof x.alt !== 'string' || !x.alt.trim()) ||
        !Array.isArray(p.specifications) || p.specifications.some(x => !Array.isArray(x) || x.length !== 2 || x.some(v => typeof v !== 'string')) ||
        !Array.isArray(p.features) || p.features.some(x => typeof x !== 'string')) throw Error('Incomplete product');
    ids.add(p.id);
    const checkout = paymentLink(p.paymentLink);
    const variants = (p.variants || []).map(v => {
      const link = paymentLink(v.paymentLink);
      if (!/^[a-z0-9-]+$/.test(v.id || '') || typeof v.colour !== 'string' || !v.colour.trim() || !link ||
          !p.gallery.some(photo => photo.src === v.image)) throw Error('Invalid colour checkout');
      return {...v, paymentLink: link};
    });
    if (new Set(variants.map(v => v.id)).size !== variants.length) throw Error('Duplicate colour');
    if (p.availability === 'available' && !checkout) throw Error('Missing live checkout');
    return {...p, paymentLink: checkout, variants};
  });
  const ready = value.checkoutEnabled === true &&
    typeof value.deliverySummary === 'string' && value.deliverySummary.trim().length > 0 &&
    typeof value.returnsSummary === 'string' && value.returnsSummary.trim().length > 0 &&
    ['name','address','email'].every(key => typeof value.seller?.[key] === 'string' && value.seller[key].trim());
  return {products, ready: Boolean(ready), delivery: value.deliverySummary || '', returns: value.returnsSummary || '', seller: value.seller};
}
export const money = pence => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(pence / 100);
