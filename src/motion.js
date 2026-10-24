// Desktop enhancement loaded after primary content and hydration.
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
export function setupMotion(root){
 gsap.registerPlugin(ScrollTrigger);const mm=gsap.matchMedia();
 mm.add('(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',()=>{
  // The heading and hero remain visible: motion must not reset the LCP element's opacity.
  const lenis=new Lenis({duration:1.05,smoothWheel:true,anchors:{offset:-100}});lenis.on('scroll',ScrollTrigger.update);
  const tick=time=>lenis.raf(time*1000);gsap.ticker.add(tick);
  gsap.to('.hero-window',{y:-24,rotation:-1,scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}});
  gsap.to('.note-one',{y:-9,duration:3.2,yoyo:true,repeat:-1,ease:'sine.inOut',scrollTrigger:{trigger:'.hero',toggleActions:'play pause resume pause'}});
  gsap.to('.scroll-progress',{scaleX:1,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'bottom bottom',scrub:true}});
  return()=>{gsap.ticker.remove(tick);lenis.destroy();};
 },root);return()=>mm.revert();
}
