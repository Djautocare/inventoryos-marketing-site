'use strict';
(()=>{
 const form=document.getElementById('contact-form');if(!form)return;
 const button=document.getElementById('contact-send'),status=document.getElementById('contact-status'),endpoint='https://api.inventoryos.co.uk/contact';let ready=false,busy=false,key='',fingerprint='';
 const field=name=>form.elements.namedItem(name);
 const message=(text,error=false)=>{status.textContent=text;status.classList.toggle('contact-error',error);status.classList.toggle('contact-success',!error);};
 async function check(){try{const r=await fetch(endpoint,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)}),data=await r.json();ready=r.ok&&data.contact_form===true;}catch{ready=false;}button.disabled=!ready;if(ready)message('');else message('The form is temporarily unavailable. Alternatively, email hello@inventoryos.co.uk.',true);}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!ready||busy)return;
  for(const name of ['name','email','message']){const input=field(name);input.setCustomValidity(input.value.trim()?'':'Please complete this field.');}
  if(!form.reportValidity())return;
  const body={name:field('name').value.trim(),email:field('email').value.trim(),topic:field('topic').value.trim(),message:field('message').value.trim(),website:field('website').value};const next=JSON.stringify(body);if(next!==fingerprint||!key){key=crypto.randomUUID();fingerprint=next;}
  body.client_request_id=key;busy=true;button.disabled=true;button.textContent='Sending…';message('Sending your message…');
  try{const response=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)}),data=await response.json();if(!response.ok||!data.success)throw Error(data.error||'Your message could not be sent. Please try again or email hello@inventoryos.co.uk.');
   form.reset();key='';fingerprint='';message('Thank you—your message has been received. We’ll reply to '+body.email+'. Reference: '+data.reference+'.');
  }catch(error){message(error.name==='TimeoutError'||error.name==='AbortError'?'We couldn’t confirm delivery. Your message is still here—try again to safely check the same request.':error.message||'Could not connect. Your message is still here; please try again or email hello@inventoryos.co.uk.',true);}
  finally{busy=false;button.disabled=!ready;button.textContent='Send message';}
 });
 for(const name of ['name','email','message'])field(name).addEventListener('input',()=>field(name).setCustomValidity(''));
 check();
})();
