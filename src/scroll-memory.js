// Scroll position memory for the homepages.
// The 3D opener reserves its real scroll height only after the engine loads, and the tour pin adds more height later.
// The browser's own restoration (reload, back/forward) and fragment jumps run against the short pre-hydration layout,
// and scroll anchoring then drifts to unrelated sections. Here the page owns restoration instead:
// - fresh navigation without a hash: nothing is done (the page simply starts at the top of the opener);
// - fresh navigation with a hash: the target section is re-aligned while the layout is still growing;
// - reload / back / forward: the saved position (stored per history entry) is restored relative to what was on screen
//   (opener progress, or an offset inside a section), and the opener's saved height is reserved before hydration.
// Restoration stops as soon as the visitor scrolls, taps or presses a key, and after the layout settles.
const ROOT=document.getElementById('root');
const navType=(()=>{try{return performance.getEntriesByType('navigation')[0]?.type||'navigate';}catch(e){return 'navigate';}})();
const opener=()=>document.querySelector('.opening');
const sections=()=>[...ROOT.querySelectorAll('section, footer, #after-opening')];

function snapshot(){
  const y=scrollY,o=opener();if(!o)return {k:'y',y};
  const top=o.getBoundingClientRect().top+y,span=o.offsetHeight-innerHeight;
  if(y<top+span&&span>0)return {k:'op',f:Math.max(0,(y-top)/span),h:o.style.height||''};
  let best=null;sections().forEach((el,i)=>{const box=(el.parentElement?.classList.contains('pin-spacer')?el.parentElement:el).getBoundingClientRect();if(box.top<=1)best={k:'sec',i,off:-box.top};});
  return best||{k:'y',y};
}
const KEY='ios-scroll:'+location.pathname;
// history.state keeps one position per history entry; sessionStorage also covers a reload fired right after scrolling
function save(final){const snap=snapshot();if(final)try{sessionStorage.setItem(KEY,JSON.stringify(snap));}catch(e){}
  try{history.replaceState({...(history.state||{}),iosScroll:snap},'');}catch(e){}}
function stored(){let s=null;try{s=JSON.parse(sessionStorage.getItem(KEY)||'null');sessionStorage.removeItem(KEY);}catch(e){}return s;}

function targetY(rec){
  if(rec.k==='op'){const o=opener();if(!o)return null;const top=o.getBoundingClientRect().top+scrollY;return top+rec.f*Math.max(0,o.offsetHeight-innerHeight);}
  if(rec.k==='sec'){const el=sections()[rec.i];if(!el)return null;const box=(el.parentElement?.classList.contains('pin-spacer')?el.parentElement:el);return box.getBoundingClientRect().top+scrollY+rec.off;}
  if(rec.k==='hash'){let el=null;try{el=document.getElementById(decodeURIComponent(rec.id));}catch(e){}if(!el)return null;
    const pad=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0,mt=parseFloat(getComputedStyle(el).scrollMarginTop)||0;return el.getBoundingClientRect().top+scrollY-pad-mt;}
  return rec.y;
}
function jump(y){y=Math.max(0,Math.min(Math.round(y),document.documentElement.scrollHeight-innerHeight));if(Math.abs(scrollY-y)<2)return;
  const l=window.__lenis;if(l)l.scrollTo(y,{immediate:true,force:true});else window.scrollTo({top:y,behavior:'instant'});}

if(ROOT){
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  const fromSession=stored(),saved=navType==='reload'?(fromSession||history.state?.iosScroll):navType==='back_forward'?(history.state?.iosScroll||null):null;
  const rec=saved||(location.hash.length>1?{k:'hash',id:location.hash.slice(1)}:null);
  if(rec){
    // reserve the opener's previous height so the first layout already matches the restored one
    if(rec.k==='op'&&rec.h){const o=opener();if(o&&!o.style.height)o.style.height=rec.h;}
    let active=true,raf=0,quiet=0;const t0=performance.now();
    const apply=()=>{raf=0;if(!active)return;const y=targetY(rec);if(y!=null)jump(y);};
    const queue=()=>{if(active&&!raf)raf=requestAnimationFrame(apply);};
    const stop=()=>{if(!active)return;active=false;ro.disconnect();clearInterval(iv);['wheel','touchstart','keydown','mousedown'].forEach(e=>removeEventListener(e,stop,true));};
    const ro=new ResizeObserver(()=>{quiet=performance.now();queue();});ro.observe(document.body);ro.observe(ROOT);
    ['wheel','touchstart','keydown','mousedown'].forEach(e=>addEventListener(e,stop,{capture:true,passive:true}));
    // finish once the page has loaded and the layout has been quiet for 1.5 s and the opener has reserved its height (hard cap 30 s; any scroll, tap or key press ends it at once)
    const openerDone=()=>{const o=opener();if(!window.__iosRedesignReady)return false;return !o||o.classList.contains('op-ready')||o.classList.contains('op-no-webgl')||matchMedia('(prefers-reduced-motion: reduce)').matches;};
    const iv=setInterval(()=>{const now=performance.now();if(now-t0>30000||(openerDone()&&document.readyState==='complete'&&now-quiet>1500)){apply();stop();}},250);
    apply();
  }
  // remember where the visitor is, per history entry (reload and back/forward read it back)
  let st=0;addEventListener('scroll',()=>{clearTimeout(st);st=setTimeout(save,150);},{passive:true});
  addEventListener('pagehide',()=>save(true));addEventListener('beforeunload',()=>save(true));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')save(true);});
}
