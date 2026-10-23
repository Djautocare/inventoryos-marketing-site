// Product content is rendered at build time and also works without JavaScript.
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
