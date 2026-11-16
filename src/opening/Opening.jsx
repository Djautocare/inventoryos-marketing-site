import React,{useEffect,useRef} from 'react';
// Cinematic opener. Server-renders the hero copy (SEO, no-JS) and lazy-loads the 3D engine after hydration.
const CHIPS=[['make','I manufacture products','M4 20h16M6 20V9l4 3V9l4 3V9l4 3v8'],['store','I sell in person','M4 9h16l-1.5-4h-13zM5 9v10h14V9M10 19v-5h4v5'],['online','I sell online','M3 5h18v11H3zM8 20h8M12 16v4'],['dispatch','I dispatch orders','M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01']];
export default function Opening({children}){
  const ref=useRef(null);
  useEffect(()=>{
    // Skip intro: one instant jump past the opener (a smooth scroll would race the whole animation and fight Lenis/the native anchor jump).
    const el=ref.current,skip=e=>{const a=e.target.closest('a[href="#after-opening"]');if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;
      const t=document.getElementById('after-opening');if(!t)return;e.preventDefault();e.stopPropagation();
      const pad=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0,y=Math.max(0,t.getBoundingClientRect().top+scrollY-pad+1);
      window.__lenis?window.__lenis.scrollTo(y,{immediate:true,force:true}):window.scrollTo({top:y,behavior:'instant'});
      let next=t.nextElementSibling;if(next?.classList.contains('pin-spacer'))next=next.firstElementChild;if(next){if(!next.hasAttribute('tabindex'))next.setAttribute('tabindex','-1');next.focus({preventScroll:true});}};
    el.addEventListener('click',skip,true);return()=>el.removeEventListener('click',skip,true);},[]);
  useEffect(()=>{let api=null,dead=false;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    import('./engine.js').then(m=>{if(!dead)api=m.mount(ref.current);}).catch(()=>ref.current?.classList.add('op-no-webgl'));
    return()=>{dead=true;api?.destroy();};},[]);
  return <><section ref={ref} className="opening" id="overview" style={{"--op-poster-wide":"url(/assets/opening/poster-wide.webp)","--op-poster-tall":"url(/assets/opening/poster-tall.webp)"}} aria-label="How InventoryOS moves a product through your business">
    <div className="op-stage">
      <canvas className="op-canvas" aria-hidden="true"/>
      <div className="op-layer"><div className="op-inner">
        <div className="op-hero">
          {children}
          <fieldset className="op-choose"><legend>What does your business do? Choose any.</legend>
            <div className="op-chips">{CHIPS.map(([k,label,d])=><button key={k} type="button" className="op-chip" data-k={k} aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d={d}/></svg>{label}</button>)}</div>
            <p className="op-summary" aria-live="polite">Nothing chosen yet: you will see the complete journey.</p>
          </fieldset>
          <div className="op-hero-actions"><button type="button" className="op-explore" data-explore>Explore the journey<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button><a className="op-skip-link" href="#after-opening">Skip intro</a></div>
        </div>
        <div className="op-beats"/>
        <aside className="op-rail" aria-label="Journey steps"><ol/></aside>
      </div></div>
      <div className="op-dash"><div className="op-dash-copy"><h2>Every sale, stock change and order, recorded.</h2><p/></div><p className="op-note">Real InventoryOS screen · sample data · figures updated for this example</p></div>
      <div className="op-cut" aria-hidden="true"/><div className="op-fade" aria-hidden="true"/>
    </div>
    <a className="op-skip" href="#after-opening">Skip intro<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg></a>
  </section><div id="after-opening"/></>;
}
