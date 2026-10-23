// Product content is rendered at build time and also works without JavaScript.
document.querySelectorAll('[data-shop-checkout]').forEach(control => {
  const select = control.querySelector('[data-shop-colour]');
  const buy = control.querySelector('[data-shop-buy]');
  const product = control.closest('.shop-product');
  const price = product.querySelector('.shop-price').textContent;
  const sync = () => {
    const option = select.selectedOptions[0];
    buy.href = option.dataset.paymentLink;
    buy.textContent = `Buy ${option.dataset.colour.toLowerCase()} — ${price}`;
    buy.setAttribute('aria-label', `Buy ${product.querySelector('h2').textContent}, ${option.dataset.colour}, for ${price}`);
    const photo = product.querySelector(`img[src="${option.dataset.photo}"]`);
    const image = product.querySelector('.shop-product-image');
    image.src = option.dataset.photo;
    image.alt = photo?.alt || `${option.dataset.colour} JADENS printer`;
    product.querySelectorAll('[data-shop-photo]').forEach(button => button.setAttribute('aria-pressed', String(button.querySelector('img').getAttribute('src') === option.dataset.photo)));
  };
  select.addEventListener('change', sync);
  window.addEventListener('pageshow', sync);
  sync();
  control.hidden = false;
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-shop-photo]');
  if (!button) return;
  const product = button.closest('.shop-product');
  const image = product?.querySelector('.shop-product-image');
  const thumbnail = button.querySelector('img');
  if (!image || !thumbnail) return;
  image.src = thumbnail.getAttribute('src');
  image.alt = thumbnail.alt;
  product.querySelectorAll('[data-shop-photo]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
});
