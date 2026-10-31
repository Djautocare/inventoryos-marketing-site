'use strict';
(()=>{
 const form=document.getElementById('marketplace-interest-form');if(!form)return;
 const endpoint='https://api.inventoryos.co.uk/marketplace-interest',version='mi-marche-launch-v1';
 const button=document.getElementById('mm-submit'),status=document.getElementById('mm-status'),retry=document.getElementById('mm-retry'),fallback=document.getElementById('mm-fallback');
 let ready=false,busy=false,complete=false;const field=name=>form.elements.namedItem(name);
 const intent=new URLSearchParams(location.search).get('intent');
 if(['buy','sell','business','account'].includes(intent)){
  document.getElementById('marketplace-intent').textContent='This part of Mi Marché is coming soon. Leave your email below to hear when it is ready. No account is needed to register interest.';
  if(intent!=='account')field('audience').value=({buy:'buyer',sell:'private-seller',business:'business'})[intent];
 }
 async function check(){
  if(busy||complete)return;button.disabled=true;retry.hidden=true;status.textContent='Checking signup availability…';
  try{const response=await fetch(endpoint,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)}),data=await response.json();ready=response.ok&&data.marketplace_interest===true&&data.consent_version===version;}catch{ready=false}
  button.disabled=!ready;fallback.hidden=ready;retry.hidden=ready;status.textContent=ready?'':'The interest form is temporarily unavailable. Please email us to register your interest, or check again.';
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||complete)return;if(!ready){check();return}if(!form.reportValidity())return;
  busy=true;button.disabled=true;status.textContent='Saving your launch interest…';
  const body={email:field('email').value.trim(),audience:field('audience').value,consent:field('consent').checked,consent_version:version,website:field('website').value};
  try{
   const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(body),signal:AbortSignal.timeout(15000)}),data=await response.json();
   if(!response.ok||data.success!==true)throw Error(response.status===429?'Several requests have been made recently. Please try again later.':response.status===400?'Please check your email and consent, then try again.':'We could not confirm your request. Please try again or email us.');
   complete=true;form.reset();status.textContent='Thank you—your launch-interest request has been received. If you have already joined, we will not add a duplicate. We’ll be in touch when Mi Marché is ready to use.';button.textContent='Interest registered';fallback.hidden=true;
  }catch(error){status.textContent=error.name==='TimeoutError'?'We could not confirm your request in time. You can safely try again; duplicate emails are not added.':error.message==='Failed to fetch'?'Could not connect. Please try again or email us.':error.message;fallback.hidden=false}
  finally{busy=false;button.disabled=complete}
 });
 retry.addEventListener('click',check);check();
})();
