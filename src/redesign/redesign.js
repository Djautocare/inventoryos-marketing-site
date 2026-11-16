// Version B enhancements: scroll reveals, steps conveyor fill, device tilt, and one standout Dispatch Centre demo.
// Progressive only: with reduced motion or no JS the page is the same content, fully visible.
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,seg=(q,a,b)=>ease(clamp((q-a)/(b-a))),lerp=(a,b,t)=>a+(b-a)*t;
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.documentElement.classList.add('rd-js');
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('rd-in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -12% 0px'});
  document.querySelectorAll('main .section-heading,main .tour-heading,main .bento-card,main .audience-card,main .plan,main .steps article,main .faq-list details,main .shop-landing,main .story-copy').forEach((el,i)=>{el.dataset.rdReveal='';el.style.transitionDelay=(i%4)*70+'ms';io.observe(el);});
  const steps=document.querySelector('main .steps');if(steps)ScrollTrigger.create({trigger:steps,start:'top 80%',end:'bottom 55%',scrub:.5,onUpdate:s=>steps.style.setProperty('--rd-fill',(s.progress*100).toFixed(1)+'%')});
  document.querySelectorAll('main .tour .product-window').forEach(f=>gsap.fromTo(f,{rotateX:9,scale:.95,transformPerspective:1400},{rotateX:0,scale:1,ease:'none',scrollTrigger:{trigger:f,start:'top 95%',end:'top 45%',scrub:.6}}));
  cinematic();
  queueMicrotask(()=>{manufacturingDemo();});   // helpers below are defined after this block
}
// Standout: one continuous camera move. The first screenshot (tour) enlarges into the app, a cursor clicks Dispatch Centre in the
// real sidebar, then "Import label files", the real 4×6 auto-crop preview is highlighted, and the view settles onto the
// Dispatch Centre section's own screenshot. Scroll-scrubbed (reverses), decorative overlay only (aria-hidden).
function cinematic(){
  const tour=document.querySelector('main .tour'),tFig=tour&&tour.querySelector('#tour-panel .product-window'),tImg=tFig&&tFig.querySelector('img');
  const fFig=document.querySelector('main .feature-story .product-window'),fImg=fFig&&fFig.querySelector('img');
  if(!tImg||!fImg||!/label-preview/.test(fImg.getAttribute('src')))return;
  const base=fImg.getAttribute('src').replace(/label-preview\.webp.*/,'');
  const dim=document.createElement('div');dim.className='rd-dim';dim.setAttribute('aria-hidden','true');
  const ov=document.createElement('div');ov.className='rd-cine';ov.setAttribute('aria-hidden','true');
  ov.innerHTML=`<div class="rd-cam"><img alt="" src="${tImg.getAttribute('src')}"><img alt="" src="${base}dispatch-centre.webp" style="opacity:0"><img alt="" src="${base}label-preview.webp" style="opacity:0">
    <i class="rd-ring" style="left:10px;top:292px;width:172px;height:32px"></i><i class="rd-ring" style="left:466px;top:198px;width:566px;height:72px"></i><i class="rd-ring" style="left:116px;top:86px;width:606px;height:66px"></i><i class="rd-ring" style="left:118px;top:292px;width:280px;height:400px"></i>
    <i class="rd-click"></i><svg class="rd-cursor" viewBox="0 0 24 24"><path d="M4 2l15 11-6.6 1.2L16 21l-3 1.4-3.7-6.9L4 20z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg></div>`;
  document.body.append(dim,ov);
  const cam=ov.firstElementChild,[s0,s1,s2]=cam.querySelectorAll('img'),[rSide,rImp,rChk,rLab]=cam.querySelectorAll('.rd-ring'),cur=cam.querySelector('.rd-cursor'),clk=cam.querySelector('.rd-click');
  const header=document.querySelector('.header'),mob=()=>innerWidth<900;
  const rectOf=el=>{const r=el.getBoundingClientRect();return [r.left,r.top,r.width,r.height];};
  const lr=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
  function full(){const hb=header?Math.max(0,header.getBoundingClientRect().bottom):0;return [0,hb,innerWidth,innerHeight-hb];}   // fills the screen below the header
  // camera crops in screenshot pixels, keyed by sequence progress q
  const F=[0,0,1120,700];
  const CROPS={desk:[[0,F],[.36,F],[.46,[250,40,870,544]],[.58,[250,40,870,544]],[.64,[96,70,660,640]],[.8,[96,70,660,640]],[.9,F],[1,F]],
               mob:[[0,F],[.16,F],[.24,[0,170,420,560]],[.32,[0,170,420,560]],[.4,[455,165,580,430]],[.52,[455,165,580,430]],[.62,[96,80,450,640]],[.8,[96,80,450,640]],[.9,F],[1,F]]};
  const crop=q=>{const K=CROPS[mob()?'mob':'desk'];let i=0;while(i<K.length-2&&q>K[i+1][0])i++;const a=K[i],b=K[i+1];return lr(a[1],b[1],ease(clamp((q-a[0])/(b[0]-a[0]))));};
  const path=[[.14,[960,640]],[.27,[92,308]],[.36,[92,308]],[.47,[700,236]],[1,[700,236]]];
  const cursorAt=q=>{let i=0;while(i<path.length-2&&q>path[i+1][0])i++;const a=path[i],b=path[i+1],t=ease(clamp((q-a[0])/(b[0]-a[0])));return [lerp(a[1][0],b[1][0],t),lerp(a[1][1],b[1][1],t)-Math.sin(t*Math.PI)*30];};
  let q=0,g=0;
  function render(){
    const on=q>0&&g<1;ov.style.visibility=dim.style.visibility=on?'visible':'hidden';if(!on)return;
    let R;if(g>0)R=lr(full(),rectOf(fImg),ease(g));else R=lr(rectOf(tImg),full(),seg(q,0,.14));
    ov.style.left=R[0]+'px';ov.style.top=R[1]+'px';ov.style.width=R[2]+'px';ov.style.height=R[3]+'px';ov.style.opacity=1-seg(g,.9,1);
    const fullness=g>0?1-ease(g):seg(q,0,.14);ov.style.borderRadius=(16*(1-fullness))+'px';
    dim.style.opacity=(seg(q,0,.12)*(1-seg(g,.05,.7))).toFixed(3);
    const C=crop(q),W=R[2],H=R[3],k0=Math.min(W/1120,H/700);let k=Math.min(W/C[2],H/C[3]);k=Math.min(k,Math.max(k0,1.35*(mob()?1:k0/.99)));
    let tx=W/2-(C[0]+C[2]/2)*k,ty=H/2-(C[1]+C[3]/2)*k;const iw=1120*k,ih=700*k;tx=iw>=W?clamp(tx,W-iw,0):(W-iw)/2;ty=ih>=H?clamp(ty,H-ih,0):(H-ih)/2;
    cam.style.transform=`translate(${tx}px,${ty}px) scale(${k})`;cam.style.setProperty('--k',k);
    const a=seg(q,.335,.365),b=seg(q,.525,.555);/* a click switches pages almost instantly */s1.style.opacity=a*(1-b);s2.style.opacity=b;s0.style.opacity=1-a;
    const [cx,cy]=cursorAt(q);const press=Math.max(Math.sin(Math.PI*clamp((q-.28)/.05)),Math.sin(Math.PI*clamp((q-.47)/.05)));
    cur.style.transform=`translate(${cx}px,${cy}px) scale(${(1/k)*(1-.15*press)})`;cur.style.opacity=seg(q,.14,.19)*(1-seg(q,.56,.61));
    const c1=clamp((q-.28)/.07),c2=clamp((q-.47)/.07),c=c1>0&&c1<1?c1:c2;clk.style.left=(c1>0&&c1<1?92:700)+'px';clk.style.top=(c1>0&&c1<1?308:236)+'px';clk.style.opacity=c>0&&c<1?1-c:0;clk.style.transform=`scale(${(.3+c*1.4)/k})`;
    rSide.style.opacity=seg(q,.24,.28)*(1-seg(q,.34,.38));rImp.style.opacity=seg(q,.43,.47)*(1-seg(q,.5,.525));rChk.style.opacity=seg(q,.64,.68)*(1-seg(q,.82,.86));rLab.style.opacity=seg(q,.66,.7)*(1-seg(q,.82,.86));}
  ScrollTrigger.create({trigger:tFig,pin:tour,start:'center center',end:()=>'+='+Math.round(innerHeight*(mob()?2.1:2.5)),scrub:.6,anticipatePin:1,invalidateOnRefresh:true,onUpdate:s=>{q=s.progress;render();}});
  ScrollTrigger.create({trigger:fImg,start:'top bottom',end:'center 55%',scrub:.6,invalidateOnRefresh:true,onUpdate:s=>{g=s.progress;render();}});
  addEventListener('resize',render);addEventListener('scroll',()=>{if(g>0&&g<1)render();},{passive:true});
}

// ---------- shared helpers for the two shorter demos
const CUR='<svg class="rd-cursor" viewBox="0 0 24 24"><path d="M4 2l15 11-6.6 1.2L16 21l-3 1.4-3.7-6.9L4 20z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg>';
const loadImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src;});
// redraw one line of a real screenshot with updated figures (same position, same colours)
async function patched(src,lines){const im=await loadImg(src);if(!im)return src;const c=document.createElement('canvas');c.width=1120;c.height=700;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  for(const L of lines){const d=g.getImageData(L.bg[0],L.bg[1],1,1).data;g.fillStyle=`rgb(${d[0]},${d[1]},${d[2]})`;g.fillRect(...L.clear);let x=L.x;
    for(const [txt,w,col] of L.parts){g.font=`${w} ${L.size}px Inter, "Segoe UI", Arial, sans-serif`;g.fillStyle=col;g.fillText(txt,x,L.base);x+=g.measureText(txt).width;}}
  return c.toDataURL('image/webp',.92);}
function camera(cam,W,H,C,maxK){const k0=Math.min(W/1120,H/700);let k=Math.min(W/C[2],H/C[3]);k=Math.min(k,Math.max(k0,maxK||1.4));let tx=W/2-(C[0]+C[2]/2)*k,ty=H/2-(C[1]+C[3]/2)*k;const iw=1120*k,ih=700*k;
  tx=iw>=W?clamp(tx,W-iw,0):(W-iw)/2;ty=ih>=H?clamp(ty,H-ih,0):(H-ih)/2;cam.style.transform=`translate(${tx}px,${ty}px) scale(${k})`;cam.style.setProperty('--k',k);return k;}
const keyed=(K,q)=>{let i=0;while(i<K.length-2&&q>K[i+1][0])i++;const a=K[i],b=K[i+1],t=ease(clamp((q-a[0])/(b[0]-a[0])));return Array.isArray(a[1])?a[1].map((v,j)=>lerp(v,b[1][j],t)):lerp(a[1],b[1],t);};
// slide transition between real screens: outgoing drifts left, incoming arrives from the right (app-like navigation)
function slides(imgs,q,stops){imgs.forEach((im,i)=>{let x=0,o=0;const inn=i?seg(q,stops[i-1][0],stops[i-1][1]):1,out=i<imgs.length-1?seg(q,stops[i][0],stops[i][1]):0;
  o=Math.min(inn,1-out);x=(1-inn)*18-out*18;im.style.opacity=o;im.style.transform=`translateX(${x}%)`;});}
function stageMarkup(srcs,rings){return `<div class="rd-cam">${srcs.map((s,i)=>`<img alt="" src="${s}"${i?' style="opacity:0"':''}>`).join('')}${rings.map(r=>`<i class="rd-ring" style="left:${r[0]}px;top:${r[1]}px;width:${r[2]}px;height:${r[3]}px"></i>`).join('')}<i class="rd-click"></i>${CUR}</div>`;}
function cursorOn(cur,clk,q,path,clicks,k){const [x,y]=keyed(path,q);let press=0,cl=null;for(const c of clicks){const t=clamp((q-c[0])/.05);if(t>0&&t<1){press=Math.max(press,Math.sin(Math.PI*t));cl=[c,t];}}
  cur.style.transform=`translate(${x}px,${y}px) scale(${(1/k)*(1-.15*press)})`;
  if(cl){clk.style.left=cl[0][1]+'px';clk.style.top=cl[0][2]+'px';clk.style.opacity=1-cl[1];clk.style.transform=`scale(${(.3+cl[1]*1.4)/k})`;}else clk.style.opacity=0;}

// ---------- Manufacturing (manufacturing page, "Less ordering twice" section): the screen grows inside its section, slides
// recipe → production run → materials, then returns. No pinning, no full screen.
async function manufacturingDemo(){
  const fig=document.querySelector('main .feature-story .product-window'),img=fig&&fig.querySelector('img');if(!img||!/recipes\.webp/.test(img.getAttribute('src')))return;
  const sec=fig.closest('.feature-story'),copy=sec.querySelector('.story-copy'),base=img.getAttribute('src').replace(/recipes\.webp.*/,'');
  const mats=await patched(base+'materials.webp',[
    {clear:[236,341,190,16],bg:[232,349],x:238,base:353,size:12.5,parts:[['3.84 kg','700','#f4f6fa'],[' eligible for production','400','#c9ced8']]},
    {clear:[679,341,190,16],bg:[675,349],x:681,base:352,size:12.5,parts:[['88 each','700','#f4f6fa'],[' eligible for production','400','#c9ced8']]},
    {clear:[236,558,190,16],bg:[232,566],x:238,base:570,size:12.5,parts:[['36 each','700','#f4f6fa'],[' eligible for production','400','#c9ced8']]}]);
  const box=document.createElement('div');box.className='rd-demo rd-mfg';box.setAttribute('aria-hidden','true');
  box.innerHTML=stageMarkup([img.getAttribute('src'),base+'production.webp',mats,img.getAttribute('src')],[[210,262,436,262],[256,356,200,66],[798,190,160,38],[226,409,214,34],[228,336,170,24],[671,336,170,24],[228,553,170,24]]);
  fig.appendChild(box);const cam=box.firstElementChild,imgs=[...cam.querySelectorAll('img')],R=[...cam.querySelectorAll('.rd-ring')],cur=cam.querySelector('.rd-cursor'),clk=cam.querySelector('.rd-click');
  const mob=()=>innerWidth<900;let last=0;
  function draw(q){last=q;const r=img.getBoundingClientRect(),f=fig.getBoundingClientRect();box.style.top=(r.top-f.top)+'px';box.style.height=r.height+'px';
    const grow=seg(q,0,.16)*(1-seg(q,.86,1));
    if(!mob()){const cx=sec.getBoundingClientRect(),dx=(cx.left+cx.width/2)-(f.left+f.width/2);fig.style.transform=`translateX(${dx*.55*grow}px) scale(${1+.3*grow})`;fig.style.zIndex=grow>0?6:'';copy.style.opacity=1-.88*grow;}
    else{fig.style.transform='';copy.style.opacity='';}
    slides(imgs,q,[[.36,.44],[.64,.72],[.86,.94]]);
    const crop=mob()?keyed([[0,[0,0,1120,700]],[.14,[0,0,1120,700]],[.22,[200,230,470,294]],[.36,[200,230,470,294]],[.44,[190,170,800,500]],[.6,[190,180,500,312]],[.68,[200,300,900,560]],[.84,[200,300,900,560]],[.94,[0,0,1120,700]],[1,[0,0,1120,700]]],q):[0,0,1120,700];
    const k=camera(cam,r.width,r.height,crop,mob()?1.2:2);
    cursorOn(cur,clk,q,[[.12,[700,560]],[.22,[300,282]],[.4,[300,282]],[.48,[877,209]],[1,[877,209]]],[[.23,300,282],[.49,877,209]],k);
    cur.style.opacity=seg(q,.1,.15)*(1-seg(q,.56,.6));
    const show=(i,a,b)=>R[i].style.opacity=seg(q,a,a+.04)*(1-seg(q,b,b+.04));
    show(0,.21,.3);show(1,.27,.36);show(2,.46,.52);show(3,.53,.64);show(4,.73,.84);show(5,.75,.84);show(6,.77,.84);
    box.style.opacity=seg(q,.02,.08)*(1-seg(q,.95,1));}
  addEventListener('resize',()=>draw(last));draw(0);
  ScrollTrigger.create({trigger:fig,start:'top 80%',end:'bottom 12%',scrub:.6,onUpdate:s=>draw(s.progress)});
}
