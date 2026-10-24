// Adapted from the existing React Bits wrapper: visible SSR content, lightweight entrance motion.
import {useEffect,useRef} from 'react';
export default function AnimatedContent({children,distance=30,direction='vertical',reverse=false,duration=.7,delay=0,initialOpacity=0,animateOpacity=true,once=true,className='',style,...props}){
 const ref=useRef(null);
 useEffect(()=>{const el=ref.current;if(!el||!el.animate||!window.IntersectionObserver||window.matchMedia('(prefers-reduced-motion: reduce)').matches||navigator.connection?.saveData)return;
  // Never hide visible content while the page is loading.
  if(el.getBoundingClientRect().top<window.innerHeight)return;
  let animation;const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const translate=direction==='horizontal'?`translateX(${distance*(reverse?-1:1)}px)`:`translateY(${distance*(reverse?-1:1)}px)`;animation=el.animate([{transform:translate,opacity:animateOpacity?initialOpacity:1},{transform:'none',opacity:1}],{duration:duration*1000,delay:delay*1000,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});if(once)observer.disconnect();}},{threshold:.08});observer.observe(el);return()=>{observer.disconnect();animation?.cancel();};
 },[distance,direction,reverse,duration,delay,initialOpacity,animateOpacity,once]);
 return <div ref={ref} className={className} style={style} {...props}>{children}</div>;
}
