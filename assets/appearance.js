/* Public-site appearance only. No account, authentication or cross-site data. */
(function(){
 'use strict';
 const key='inventoryos_marketing_appearance',root=document.documentElement;
 let mode='dark';try{const saved=localStorage.getItem(key);if(saved==='light'||saved==='dark')mode=saved;}catch{}
 function syncDocuments(){if(document.getElementById('root'))return;document.querySelectorAll('[data-marketing-appearance-toggle]').forEach(button=>{button.setAttribute('aria-label','Switch to '+(mode==='dark'?'light':'dark')+' mode');button.setAttribute('aria-pressed',String(mode==='light'));button.title='Switch to '+(mode==='dark'?'light':'dark')+' mode';});}
 function apply(value,save=true){mode=value==='light'?'light':'dark';root.dataset.marketingAppearance=mode;root.style.colorScheme=mode;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',mode==='dark'?'#080909':'#f8f7f4');if(save)try{localStorage.setItem(key,mode);}catch{}syncDocuments();window.dispatchEvent(new CustomEvent('inventoryos-marketing-appearance',{detail:mode}));return mode;}
 window.InventoryMarketingAppearance={current:()=>mode,set:apply,toggle:()=>apply(mode==='dark'?'light':'dark')};
 apply(mode,false);
 document.addEventListener('DOMContentLoaded',syncDocuments);
 document.addEventListener('click',event=>{const button=event.target.closest('[data-marketing-appearance-toggle]');if(button&&!button.closest('#root')){event.preventDefault();window.InventoryMarketingAppearance.toggle();}});
 window.addEventListener('storage',event=>{if(event.key===key)apply(event.newValue,false);});
})();
