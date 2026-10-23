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
  const marketing = control.querySelector('[data-shop-marketing]');
  if (marketing) {
    const email = control.querySelector('[data-shop-marketing-email]');
    const wrap = control.querySelector('[data-shop-marketing-email-wrap]');
    const status = control.querySelector('[data-shop-marketing-status]');
    let saving = false;
    fetch('https://api.inventoryos.co.uk/shop/marketing-consent',{credentials:'omit',signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(data=>{if(data?.enabled===true&&data.version==='shop-marketing-2026-10-23')control.querySelector('[data-shop-marketing-panel]').hidden=false;}).catch(()=>{});
    const toggle = () => {wrap.hidden=!marketing.checked;email.disabled=!marketing.checked;email.required=marketing.checked;status.textContent='';};
    marketing.checked=false;toggle();
    marketing.addEventListener('change',toggle);
    window.addEventListener('pageshow',()=>{marketing.checked=false;toggle();});
    buy.addEventListener('click',async event=>{
      if(saving){event.preventDefault();return;}
      if(!marketing.checked)return;
      event.preventDefault();if(!email.reportValidity())return;
      saving=true;marketing.disabled=true;email.disabled=true;select.disabled=true;buy.setAttribute('aria-disabled','true');status.textContent='Saving your choice…';
      try{
        const response=await fetch('https://api.inventoryos.co.uk/shop/marketing-consent',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.value.trim(),opt_in:true,livemode:true}),signal:AbortSignal.timeout(15000)});
        const data=await response.json();if(!response.ok||!data.success||!/^iosm_[a-f0-9]{64}$/.test(data.client_reference_id||''))throw Error(data.error||'Your choice could not be saved.');
        const url=new URL(select.selectedOptions[0].dataset.paymentLink);url.searchParams.set('client_reference_id',data.client_reference_id);url.searchParams.set('prefilled_email',email.value.trim());
        window.location.assign(url.href);
      }catch(error){status.textContent='Email updates could not be saved. Retry, or leave the optional box unticked to continue without updates.';}
      finally{saving=false;marketing.disabled=false;email.disabled=!marketing.checked;select.disabled=false;buy.removeAttribute('aria-disabled');}
    });
  }
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
