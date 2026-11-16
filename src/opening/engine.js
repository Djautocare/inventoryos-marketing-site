// InventoryOS opener engine: builds a journey from the visitor's choices, then drives props, camera,
// captions and real-screen panels as a pure function of story time t (so scrolling back is exact).
import * as THREE from 'three';
import {buildWorld,loadBundle,upgradeWorld,upgradeStage,upgradeShip,clamp,ease,easeOut,seg,lerp} from './props.js';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
// Pacing: scene length multiplier and reading holds (in screen-heights of scroll) where captions and screens appear.
const PACE=1.6,HOLD_FOCUS=.4,HOLD_PANEL=.4,HOLD_TEXT=.08,HOLD_DASH=.6;   // slowed down after live feedback (≈1.4×)
const FOCUS=false;   // focus-and-zoom moments switched off by the owner (kept in code for later)

const ASSETS=()=>window.__OPENING_ASSETS||'/assets/';
const IMG={materials:'workflow/materials.webp',recipes:'workflow/recipes.webp',production:'workflow/production.webp',till:'workflow/sales-till.webp',receipt:'workflow/sale-receipt.webp',stock:'demo/screens/sk.webp',overview:'workflow/stock-overview.webp',dispatch:'workflow/dispatch-centre.webp',label:'workflow/label-preview.webp'};
// Fictional sample data, consistent with the real screenshots (Willow & Pine, Cedar candle CED-001, £12.00).
const DATA={stock:85,price:12,salesToday:48,units:62,batch:12};

export function mount(root){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $=s=>root.querySelector(s);
  const canvas=$('.op-canvas'),stageEl=$('.op-stage');
  let renderer;
  const probe=document.createElement('canvas');if(!(probe.getContext('webgl2')||probe.getContext('webgl'))){root.classList.add('op-no-webgl');return {destroy(){}};}
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){root.classList.add('op-no-webgl');return {destroy(){}};}
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const P=buildWorld(renderer);const {scene}=P;
  const lowEnd=(navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4||(matchMedia('(pointer: coarse)').matches&&Math.min(innerWidth,innerHeight)<820);
  let qScale=lowEnd?.72:1;const plinthBlob=scene.getObjectByName('plinthBlob');
  if(lowEnd){P.vkLight.castShadow=false;P.keyLight.shadow.mapSize.set(1024,1024);}
  if('transmissionResolutionScale' in renderer)renderer.transmissionResolutionScale=lowEnd?.5:.85;
  const camera=new THREE.PerspectiveCamera(30,1,.5,600);

  // ---------- Real screens: base images plus edited copies with the journey's own numbers
  const base={},cache={};let dirty=true;
  const load=k=>base[k]||(base[k]=new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=ASSETS()+IMG[k];}));
  function canvasFrom(im){const c=document.createElement('canvas');c.width=1120;c.height=700;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);return [c,g];}
  const bgAt=(g,x,y)=>{const d=g.getImageData(x,y,1,1).data;return `rgb(${d[0]},${d[1]},${d[2]})`;};
  const MAKERS={
    stock:async n=>{const im=await load('stock');if(!im)return null;const [c,g]=canvasFrom(im);g.fillStyle=bgAt(g,598,350);g.fillRect(601,342,26,16);g.fillStyle='#e6e8ee';g.font='500 12px Inter, "Segoe UI", Arial, sans-serif';g.fillText(String(n),605,355.5);return c;},
    ov:async(o)=>{const im=await load('overview');if(!im)return null;const [c,g]=canvasFrom(im);
      const big=(r,txt)=>{g.fillStyle=bgAt(g,r[0]-6,r[1]+4);g.fillRect(...r);g.fillStyle='#f3f5f7';g.font='600 29px Inter, "Segoe UI", Arial, sans-serif';g.fillText(txt,r[0]+6,r[1]+32);};
      if(o.units!=null)big([452,198,90,40],String(o.units));if(o.sales!=null)big([895,198,150,40],'£'+o.sales.toFixed(2));
      if(o.status){g.fillStyle=bgAt(g,446,381);g.fillRect(450,368,130,26);g.font='600 11px Inter, "Segoe UI", Arial, sans-serif';const tw=g.measureText(o.status).width;g.fillStyle='rgba(74,222,128,.16)';g.beginPath();g.roundRect(454,372,tw+18,19,9.5);g.fill();g.fillStyle='#6ee7a0';g.fillText(o.status,463,385.5);}
      return c;},
  };
  // key forms: 'materials' | 'stock:84' | 'ov:{"units":61,...}'
  function screen(key){if(cache[key])return cache[key];const e=cache[key]={url:null,tex:null};
    const done=c=>{if(!c)return;e.url=c.toDataURL?c.toDataURL('image/webp',.9):c.src;e.tex=new THREE.CanvasTexture(c);e.tex.colorSpace=THREE.SRGBColorSpace;e.tex.anisotropy=8;dirty=true;refreshPanels();};
    const [kind,arg]=key.split(/:(.*)/s);
    if(kind==='stock')MAKERS.stock(+arg).then(done);else if(kind==='ov')MAKERS.ov(JSON.parse(arg)).then(done);
    else load(kind).then(im=>{if(!im)return;e.url=im.src;e.tex=new THREE.Texture(im);e.tex.needsUpdate=true;e.tex.colorSpace=THREE.SRGBColorSpace;e.tex.anisotropy=8;dirty=true;refreshPanels();});
    return e;}

  // ---------- Panels (rect = desktop crop, m = phone crop; both in 1120×700 screenshot pixels)
  const PANELS={
    materials:{k:'materials',trio:[[222,256,330,140],[663,256,330,140],[222,472,330,140]],wide:true,r:[210,245,880,425],m:[210,245,880,425],hl:'220,253,424,197;661,253,425,197;220,469,424,197',alt:'InventoryOS Materials & packaging: soy wax, cotton wicks and amber jars'},
    recipes:{k:'recipes',r:[205,170,640,360],m:[250,350,340,80],hl:'260,362,196,60',alt:'InventoryOS product recipe for the Cedar candle'},
    production:{k:'production',r:[205,170,640,370],m:[214,320,350,130],hl:'230,413,206,26',alt:'InventoryOS production run: 12 finished Cedar candles to Shelf A1'},
    till:{k:'till',r:[690,90,430,380],m:[700,150,420,170],hl:'708,162,410,48',alt:'InventoryOS Till with a Cedar candle in the current sale'},
    receipt:{k:'receipt',r:[180,110,760,510],m:[200,270,720,150],hl:'212,296,700,115',alt:'InventoryOS sale receipt SALE-01024 for a Cedar candle, £12.00'},
    orders:{k:'overview',r:[204,290,548,124],m:[210,348,330,58],hl:'214,354,528,50',alt:'InventoryOS Overview with ORDER-1024 for a Cedar candle'},
    next:{k:'overview',r:[755,268,335,258],m:[760,372,330,52],hl:'765,380,320,40',alt:'InventoryOS next steps: Pack and print shipping labels'},
    import:{k:'dispatch',r:[460,110,575,160],m:[464,194,568,78],hl:'470,200,560,66',alt:'InventoryOS Dispatch Centre: Import label files'},
    crop:{k:'label',r:[110,85,880,610],m:[118,86,620,520],hl:'118,90,600,60;122,296,272,392',alt:'InventoryOS label preview: auto-cropped 4×6 shipping label'},
  };
  const stockPanel=n=>({k:'stock:'+n,r:[226,300,584,84],m:[336,322,400,58],hl:'232,331,572,42',alt:`InventoryOS products: Cedar candle CED-001, ${n} on Shelf A1`});

  // ---------- Journey
  let chosen=new Set();
  try{JSON.parse(localStorage.getItem('ios-opening-choice')||'[]').forEach(k=>chosen.add(k));}catch(e){}
  function buildJourney(){
    const all=chosen.size===0,has=k=>all||chosen.has(k);
    const till=has('store'),order=has('online'),make=has('make'),ship=has('dispatch');
    const nSales=(till?1:0)+(order?1:0)+(ship&&!order?0:0);
    const sAfterTill=DATA.stock-1,sAfterOrder=DATA.stock-(till?1:0)-1;
    const dash={units:DATA.units+(make?DATA.batch:0)-nSales,sales:DATA.salesToday+DATA.price*nSales,status:ship?'Dispatched':null};
    const S=[];
    S.push(scHero());
    if(make)S.push(scMake());
    if(make||till||order)S.push(scStock());
    if(till)S.push(scTill(sAfterTill));
    if(order)S.push(scOrder(sAfterOrder));
    if(ship)S.push(scPack(),scLabel(),scShip(),scDeliver());
    S.push(scDash(dash,{make,nSales,ship},ship));
    let t=0,x=0;for(const s of S){s.dur*=PACE;s.holds=s.beats.map(b=>[(b.a+b.b)/2,b.fx&&FOCUS?HOLD_FOCUS:b.panel?HOLD_PANEL:HOLD_TEXT]);if(s.id==='dash')s.holds.push([.62,HOLD_DASH]);s.holds.sort((a,b)=>a[0]-b[0]);
      s.scroll=s.dur+s.holds.reduce((a,h)=>a+h[1],0);s.t0=t;s.x0=x;t+=s.dur;x+=s.scroll;}
    return {scenes:S,total:t,scroll:x,dash};
  }

  // ---------- Prop helpers (placeholders now; Blender models later keep the same names)
  function laptopIn(k){P.laptop.visible=true;P.laptop.position.x=lerp(P.LAP.x-40,P.LAP.x,easeOut(clamp(k)));P.hinge.rotation.x=lerp(Math.PI/2-.02,-.25,seg(k,.4,1));}
  function printerIn(k){P.printer.visible=true;P.printer.position.x=lerp(P.PR.x-34,P.PR.x,easeOut(clamp(k)));}
  const st={labelE:0,labelF:0,receiptE:0,receiptOut:0,heroShift:0};
  function reset(){
    const c=P.candle;c.position.set(0,P.PLINTH_TOP,0);P.lid.visible=false;P.lid.position.y=16;
    P.plinth.visible=true;P.plinth.position.y=.9;P.box.visible=false;P.peanuts.visible=false;
    P.tapeTop.visible=P.tabF.visible=P.tabB.visible=false;P.roll.visible=false;
    P.flaps.forEach(f=>{const th=P.OPEN*f.sign;f.axis==='x'?(f.g.rotation.x=th):(f.g.rotation.z=th);});
    P.pack.position.set(0,0,0);P.pack.rotation.y=0;P.laptop.visible=false;P.printer.visible=false;P.shipLabel.visible=false;
    P.conv.visible=false;P.van.visible=false;P.van.position.x=P.VAN_X;P.doors.forEach(d=>d.g.rotation.y=d.side*(Math.PI/2+.25));P.home.visible=false;
    P.bench.visible=false;P.bench.position.y=0;P.shelf.visible=false;P.candleB.visible=false;P.receipt.visible=false;
    P.shelfCandles.forEach(c=>{c.visible=true;c.scale.setScalar(1);});
    st.labelE=st.labelF=st.receiptE=st.receiptOut=0;
  }

  // ---------- Scenes. cam keys: [u, position, target, fov, frame shift, cut]
  const scHero=()=>({id:'hero',dur:.3,label:null,cam:[[0,[0,8,46],[0,6.2,0],28,1],[1,[1,8.4,44],[0,6.2,0],28,1]],beats:[],screen:()=>null,apply(){}});
  const scMake=()=>({id:'make',dur:.7,label:'Made',cam:[[.22,[-40,26,72],[-60,1.5,14],32,0],[.6,[-36,22,64],[-58,5,14],30,.9],[1,[-32,24,68],[-58,5,14],30,.9]],
    beats:[{a:.06,b:.4,side:'left',h:'Materials, tracked.',p:'Soy wax, cotton wicks and amber jars are recorded as materials, with batches and quantities.',panel:PANELS.materials},
      {a:.4,b:.72,side:'left',h:'Make a batch from your recipe.',p:'Each Cedar candle uses 0.18 kg soy wax, one wick and one jar.',panel:PANELS.recipes,fx:'Per candle: 0.18 kg soy wax · 1 wick · 1 amber jar'},
      {a:.72,b:1,side:'left',h:'12 candles, added to stock.',p:'The production run records the batch and sends it to Shelf A1, ready for barcode labels.',panel:PANELS.production,fx:'12 finished candles → Shelf A1'}],
    screen:u=>u<.4?'materials':u<.72?'recipes':'production',
    apply(u){P.bench.visible=true;const pop=seg(u,.02,.2,easeOut);P.waxBlock.scale.set(1,lerp(.001,1,pop)*(1-.45*seg(u,.4,.75)),1);P.spool.scale.setScalar(Math.max(.001,pop));
      P.jars.forEach((j,i)=>{j.g.scale.setScalar(Math.max(.001,seg(u,.06+i*.04,.24+i*.04,easeOut)));const f=seg(u,.42+i*.07,.62+i*.07);j.wx.scale.y=Math.max(.001,f);j.wk.visible=f>.55;j.g.position.y=4+1.5*seg(u,.82,.95)*(1-seg(u,.95,1));});
      if(!P.laptop.visible)laptopIn(seg(u,0,.3));}});
  const scStock=()=>({id:'stock',dur:.35,label:'Stored on Shelf A1',cam:[[.3,[58,22,28],[34,11,-22],32,-.7],[1,[51,19,21],[34,10,-22],32,-.7]],
    beats:[{a:.05,b:1,side:'right',h:'Every candle has a place.',p:`CED-001: ${DATA.stock} on Shelf A1, each with its own barcode label.`,panel:stockPanel(DATA.stock)}],
    screen:()=>'stock:'+DATA.stock,
    apply(u,J){P.bench.position.y=-12*seg(u,0,.3);P.shelf.visible=true;P.shelf.position.y=lerp(-26,0,seg(u,0,.3,easeOut));
      if(J.has('make'))P.shelfCandles.forEach((c,i)=>c.scale.setScalar(Math.max(.001,seg(u,.25+i*.06,.45+i*.06,easeOut))));
      if(!P.laptop.visible)laptopIn(seg(u,0,.4));}});
  const scTill=n=>({id:'till',dur:.55,label:'Sold at the till',cam:[[.15,[16,17,48],[-2,7,-6],32,.9],[.5,[22,25,6],[-4,6,-22],30,.9],[.78,[16,18,42],[0,7,-2],32,.9],[1,[12,16,46],[0,7,0],32,.9]],
    beats:[{a:.04,b:.4,side:'left',h:'Sold at the till.',p:'Scan or tap the Cedar candle and take payment.',panel:PANELS.till,fx:'Cedar candle · £12.00'},
      {a:.4,b:.7,side:'left',h:'Receipt printed.',p:'SALE-01024: Cedar candle, £12.00, Till 1.',panel:PANELS.receipt},
      {a:.7,b:1,side:'left',h:'Stock follows the sale.',p:`CED-001 drops to ${n} on Shelf A1.`,panel:stockPanel(n),fx:`CED-001 · ${n+1} → ${n} in stock · Shelf A1`}],
    screen:u=>u<.4?'till':u<.7?'receipt':'stock:'+n,
    apply(u){if(!P.laptop.visible)laptopIn(seg(u,0,.3));printerIn(seg(u,.18,.38));P.shelf.visible=true;P.shelfCandles[0].visible=false;
      const k=seg(u,0,.15)*(1-seg(u,.85,1));P.candle.position.x=-4.4*k;
      const s0=new THREE.Vector3(P.SH.x-16,1.2,P.SH.z+1),s1=new THREE.Vector3(4.4,P.PLINTH_TOP,0),f=seg(u,.04,.24),out=seg(u,.8,.94);
      P.candleB.visible=u>.02&&out<1;P.candleB.position.lerpVectors(s0,s1,f);P.candleB.position.y+=Math.sin(Math.PI*f)*14;
      P.candleB.position.x+=out*34;P.candleB.position.y+=out*16;P.candleB.position.z+=out*30;
      st.receiptE=seg(u,.42,.6,x=>x);st.receiptOut=out;}});
  const scOrder=n=>({id:'order',dur:.4,label:'Ordered online',cam:[[.2,[8,17,58],[-14,7,-8],32,.9],[1,[2,15,52],[-13,7,-7],32,.9]],
    beats:[{a:.05,b:.5,side:'left',h:'An online order arrives.',p:'ORDER-1024 for a Cedar candle appears in your Overview.',panel:PANELS.orders,fx:'New order · ORDER-1024 · Cedar candle'},
      {a:.5,b:1,side:'left',h:'Stock updates by itself.',p:`CED-001 now shows ${n} on Shelf A1.`,panel:stockPanel(n),fx:`CED-001 · ${n+1} → ${n} in stock · Shelf A1`}],
    screen:u=>u<.5?'overview':'stock:'+n,
    apply(u){if(!P.laptop.visible)laptopIn(seg(u,0,.35));}});
  const scPack=()=>({id:'pack',dur:.75,label:'Packed',cam:[[.05,[-2,12,40],[0,8,0],30,-.4],[.22,[16,20,52],[3,8,0],30,-.6],[.38,[12,28,40],[0,7,0],30,-.7],[.5,[8,50,28],[0,7,0],32,.7],[.66,[5,54,22],[0,4,0],32,.7],[.8,[24,24,40],[0,8,0],30,-.6],[.95,[-16,32,36],[0,12,0],30,-.7]],
    beats:[{a:.02,b:.38,side:'right',h:'Picked and packed.',p:'Your next steps point straight to packing and shipping labels.',panel:PANELS.next},
      {a:.4,b:.66,side:'left',h:'Cushioned for the journey.',p:'Work through your packing queue one order at a time.'},
      {a:.68,b:1,side:'right',h:'Folded and sealed.',p:'Now it needs a shipping label.'}],
    screen:()=>'overview',
    apply(u){if(!P.laptop.visible)laptopIn(seg(u,0,.2));if(P.shelf.visible){P.shelf.position.y=-27*seg(u,0,.16);P.shelf.visible=u<.16;}if(P.bench.visible){P.bench.position.y=-12;P.bench.visible=false;}
      P.lid.visible=u>.01;P.lid.position.y=lerp(16,0,seg(u,.02,.12,easeOut));
      const up=seg(u,.12,.21),down=seg(u,.27,.4);P.candle.position.y=lerp(lerp(P.PLINTH_TOP,P.PLINTH_TOP+12,up),P.BOX_FLOOR,down);
      P.plinth.position.y=.9-2.1*seg(u,.16,.28);P.plinth.visible=u<.285;
      const sl=seg(u,.16,.32,easeOut);P.box.visible=u>.155;P.box.position.x=lerp(52,0,sl);P.box.rotation.y=lerp(-.7,0,sl);
      P.peanuts.visible=u>.41;P.placePeanuts(clamp((u-.41)/.26));
      const a=seg(u,.68,.78),b=seg(u,.77,.86),sets=[a,a,b,b];P.flaps.forEach((f,k)=>{const th=lerp(P.OPEN,0,sets[k])*f.sign;f.axis==='x'?(f.g.rotation.x=th):(f.g.rotation.z=th);});
      const s=clamp((u-.86)/.11),{TOP,TAB,D,T}=P;const fT=clamp(s/.15),run=clamp((s-.12)/.74),bT=clamp((s-.86)/.14);
      P.tabF.visible=fT>0;P.tabF.scale.y=Math.max(.001,fT*TAB);P.tabF.position.set(0,TOP-fT*TAB/2,D/2+2*T+.03);
      const len=Math.max(.001,run*(D+2*T));P.tapeTop.visible=run>0;P.tapeTop.scale.y=len;P.tapeTop.position.set(0,TOP,D/2+T-len/2);
      P.tabB.visible=bT>0;P.tabB.scale.y=Math.max(.001,bT*TAB);P.tabB.position.set(0,TOP-bT*TAB/2,-D/2-2*T-.03);
      P.roll.visible=u>.85&&u<1;const rz=fT<1?lerp(D/2+2*T+3.4,D/2+2*T+1,fT):lerp(D/2+T,-D/2-T,run),ry=fT<1?TOP+3.4-fT*1.1:TOP+3.35,aw=seg(u,.97,1);
      P.roll.position.set(0,ry+aw*12,rz-aw*6);P.roll.rotation.x=-(rz/3.35);}});
  const scLabel=()=>({id:'label',dur:.6,label:'Label cropped and printed',cam:[[.12,[-6.4,22.9,24.1],[-32.7,10.1,-18.9],30,1],[.36,[-12.5,20,13.1],[-32.7,10.1,-18.9],30,1],[.55,[24,27,-44],[-4,6,-21],30,.8],[.74,[20,28,-38],[-4,7,-18],30,.8],[.95,[18,32,30],[-2,10,-6],32,-.6]],
    beats:[{a:.03,b:.24,side:'left',h:"Import the courier's label.",p:'Upload PDF, PNG or JPG labels, or forward them to your workspace email.',panel:PANELS.import},
      {a:.24,b:.46,side:'left',h:'Cropped to 4×6.',p:'Check the preview, then add it to your packing queue.',panel:PANELS.crop,fx:'Label auto-cropped to 4×6'},
      {a:.46,b:.78,side:'left',h:'Printed on your thermal printer.',p:'Print it straight from the Dispatch Centre.'},
      {a:.8,b:1,side:'right',h:'Label on.',p:'Stuck on top, ready to leave.'}],
    screen:u=>u<.24?'dispatch':'label',
    apply(u){if(!P.laptop.visible)laptopIn(1);printerIn(seg(u,.2,.42));P.pack.rotation.y=lerp(0,.5,seg(u,0,.44));st.labelE=seg(u,.53,.71,x=>x);st.labelF=seg(u,.8,.98);}});
  const scShip=()=>({id:'ship',dur:.6,label:'Dispatched',cam:[[.15,[12,28,52],[6,10,0],32,0],[.38,[40,27,68],[36,10,0],32,.6],[.58,[68,29,74],[72,10,0],32,.6],[.78,[58,34,98],[102,14,0],34,-.5],[.98,[56,36,108],[108,14,0],34,-.5]],
    beats:[{a:.1,b:.56,side:'left',h:'Out along the line.',p:'The labelled parcel heads for the van.'},
      {a:.58,b:1,side:'right',h:'Loaded and marked Dispatched.',p:'ORDER-1024 changes to Dispatched in your Overview.',panel:{...PANELS.orders,hl:'450,366,132,30',swapAt:.91,swapK:'ov:'+JSON.stringify({status:'Dispatched'})},fx:'ORDER-1024 → Dispatched'}],
    screen:u=>u<.91?'dispatch':'ov:'+JSON.stringify({status:'Dispatched'}),
    apply(u){const C=P.CONV;P.conv.visible=true;P.van.visible=true;const cy=lerp(-9,0,seg(u,.025,.175,easeOut));P.conv.position.y=cy;
      P.doors.forEach(d=>d.g.rotation.y=d.side*lerp(Math.PI/2+.25,0,seg(u,.8,.925)));P.pack.rotation.y=lerp(.5,0,seg(u,.05,.175));
      const run=78*seg(u,.175,.6),load=22*seg(u,.6,.8);P.pack.position.set(run+load,Math.max(0,C.top+cy),0);P.beltTex.offset.x=-(run+load)/8;}});
  const scDeliver=()=>({id:'deliver',dur:.35,label:'Delivered',cam:[[.45,[90,36,120],[180,10,0],36,0],[.5,[-262,46,46],[-300,34,-62],32,-.6,1],[1,[-276,34,22],[-300,24,-58],32,-.6]],
    beats:[{a:.03,b:.47,side:'left',h:'On its way.',p:'The van heads off to the customer.'},{a:.53,b:1,side:'right',h:'Delivered.',p:"The Cedar candle arrives at the customer's door."}],
    screen:()=>'ov:'+JSON.stringify({status:'Dispatched'}),
    apply(u){if(u<.5){const v=230*seg(u,0,.45,x=>x*x*x);P.van.visible=P.conv.visible=true;P.van.position.x=P.VAN_X+v;P.pack.position.x=100+v;}
      else{P.van.visible=P.conv.visible=false;P.home.visible=true;P.pack.position.copy(P.doorSpot);P.pack.rotation.y=.32;}}});
  const scDash=(d,o,cut)=>({id:'dash',dur:.45,label:'Recorded on your dashboard',cam:[[0,[-6.4,22.9,24.1],[-32.7,10.1,-18.9],30,0,cut?1:0],[.3,[-25.6,13.6,-7.3],[-32.7,10.1,-18.9],30,0],[1,[-26.4,13.2,-8.6],[-32.7,10.1,-18.9],30,0]],
    beats:[],dash:d,meta:o,screen:()=>'ov:'+JSON.stringify(d),
    apply(){laptopIn(1);P.home.visible=false;P.van.visible=false;P.conv.visible=false;}});

  // ---------- Camera curves (a cut starts a new move, hidden by a dip to black)
  let J,groups,cuts;
  function buildCamera(){const keys=[];for(const s of J.scenes)for(const k of s.cam)keys.push([s.t0+k[0]*s.dur,...k.slice(1)]);
    keys.sort((a,b)=>a[0]-b[0]);groups=[];for(const k of keys){if(!groups.length||k[5])groups.push([]);groups[groups.length-1].push(k);}
    for(const G of groups){if(G.length===1)G.push([G[0][0]+1e-3,...G[0].slice(1,5)]);G.pos=new THREE.CatmullRomCurve3(G.map(k=>new THREE.Vector3(...k[1])),false,'centripetal');G.tgt=new THREE.CatmullRomCurve3(G.map(k=>new THREE.Vector3(...k[2])),false,'centripetal');}
    cuts=keys.filter(k=>k[5]).map(k=>k[0]);}
  const _tg=new THREE.Vector3(),_r=new THREE.Vector3();let holdNow=0;
  function placeCamera(t){const aspect=camera.aspect;let G=groups[0];for(const g of groups)if(g[0][0]<=t)G=g;
    let i=0;while(i<G.length-2&&t>G[i+1][0])i++;const a=G[i][0],b=G[i+1][0],lt=clamp(b>a?(t-a)/(b-a):1),u=(i+lt)/(G.length-1);
    G.pos.getPoint(u,camera.position);G.tgt.getPoint(u,_tg);const fov=lerp(G[i][3],G[i+1][3],lt),shift=lerp(G[i][4],G[i+1][4],lt);
    const hfov=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(fov)/2)*(16/9));let vfov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(hfov/2)/aspect));
    if(aspect<16/9){const cap=aspect<1?52:44;if(vfov>cap){const k=Math.tan(THREE.MathUtils.degToRad(vfov)/2)/Math.tan(THREE.MathUtils.degToRad(cap)/2);camera.position.sub(_tg).multiplyScalar(k*.92).add(_tg);vfov=cap;}}
    camera.fov=Math.max(vfov,fov);const wide=clamp((aspect-.95)/.45);
    if(shift&&wide>0){camera.lookAt(_tg);_r.setFromMatrixColumn(camera.matrixWorld,0);const dd=camera.position.distanceTo(_tg)*.19*shift*wide;camera.position.addScaledVector(_r,-dd);_tg.addScaledVector(_r,-dd);}
    if(aspect>=.9){const h=J.scenes[0].dur;_tg.y-=3.2*(1-seg(t,0,h*.7));}
    if(aspect<.9){const h=J.scenes[0].dur,k=seg(t,h*.2,h*.8);const end=J.scenes[J.scenes.length-1].t0;_tg.y+=lerp(aspect<.6?15:5,-10,k)*(1-seg(t,end,end+.1));camera.position.sub(_tg).multiplyScalar(lerp(.8,1,k)).add(_tg);}
    if(holdNow>0)camera.position.lerp(_tg,.035*Math.sin(Math.PI*holdNow));
    {const d=camera.position.distanceTo(_tg);scene.fog.far=Math.max(190,d*2.2);scene.fog.near=Math.max(70,d*1.1);}
    camera.lookAt(_tg);camera.updateProjectionMatrix();}

  // ---------- Label / receipt poses (computed last so they follow the parcel wherever it goes)
  const _pa=new THREE.Vector3(),_pb=new THREE.Vector3(),_qa=new THREE.Quaternion(),_qb=new THREE.Quaternion(),_eu=new THREE.Euler(),_qf=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,.1));
  function post(){const {PR}=P;
    P.shipLabel.visible=st.labelE>0;if(st.labelE>0){P.pack.updateMatrixWorld(true);_pa.set(P.printer.position.x,6.6,lerp(PR.z-.3,PR.z+15,st.labelE));_qa.setFromEuler(_eu.set(-Math.PI/2,0,0));
      _pb.copy(P.LABEL_LOCAL);P.pack.localToWorld(_pb);_qb.setFromRotationMatrix(P.pack.matrixWorld).multiply(_qf);const f=st.labelF;
      P.shipLabel.position.lerpVectors(_pa,_pb,f);P.shipLabel.position.y+=Math.sin(Math.PI*f)*12;P.shipLabel.quaternion.slerpQuaternions(_qa,_qb,f);if(f>0&&f<1)P.shipLabel.rotateX(Math.sin(Math.PI*f)*.35);}
    P.receipt.visible=st.receiptE>0&&st.receiptOut<1;if(P.receipt.visible){P.receipt.rotation.set(-Math.PI/2,0,0);P.receipt.position.set(P.printer.position.x,6.62,lerp(PR.z-.6,PR.z+14.5,st.receiptE));
      const o=st.receiptOut;P.receipt.position.x+=o*30;P.receipt.position.y+=o*18;P.receipt.position.z+=o*40;}}

  // ---------- Overlay: hero copy, beats with real-screen panels, rail, dashboard, cuts, hand-off
  const focusLayer=document.createElement('div');focusLayer.className='op-focuslayer';$('.op-inner').appendChild(focusLayer);
  const dimEl=document.createElement('div');dimEl.className='op-dim';$('.op-stage').insertBefore(dimEl,$('.op-layer'));
  const hero=$('.op-hero'),beatsEl=$('.op-beats'),railEl=$('.op-rail ol'),railBox=$('.op-rail'),dashEl=$('.op-dash'),cutEl=$('.op-cut'),fadeEl=$('.op-fade'),skip=$('.op-skip');
  let beats=[],panels=[];
  function panelEl(def){const fig=document.createElement('figure');fig.className='op-ui';const inner=document.createElement('div');inner.className='op-ui-inner';const img=document.createElement('img');img.alt=def.alt;img.width=1120;img.height=700;img.decoding='async';inner.appendChild(img);
    for(const h of (def.hl||'').split(';').filter(Boolean)){const [x,y,w,hh]=h.split(',').map(Number);const d=document.createElement('i');d.className='op-hl';Object.assign(d.style,{left:x+'px',top:y+'px',width:w+'px',height:hh+'px'});inner.appendChild(d);}
    fig.appendChild(inner);const Pn={def,fig,inner,img,w:0,h:0,key:def.k};if(def.swapAt!=null)fig.classList.add('op-swap');panels.push(Pn);return Pn;}
  function fitPanel(Pn){const w=Pn.fig.clientWidth,h=Pn.fig.clientHeight;if(!w||(w===Pn.w&&h===Pn.h))return;Pn.w=w;Pn.h=h;const r=innerWidth<900&&Pn.def.m?Pn.def.m:Pn.def.r;
    Pn.fig.style.aspectRatio=r[2]+'/'+r[3];const k=Math.min(w/r[2],h/r[3]);Pn.inner.style.transform=`translate(${(w-r[2]*k)/2}px,${(h-r[3]*k)/2}px) scale(${k}) translate(${-r[0]}px,${-r[1]}px)`;Pn.inner.style.setProperty('--k',k);}
  const FULL=[0,0,1120,700];
  function focusZoom(Pn,z,tgt){const w=Pn.fig.clientWidth,h=Pn.fig.clientHeight;if(!w)return;const T=tgt||(innerWidth<900&&Pn.def.m?Pn.def.m:Pn.def.r);
    const R=FULL.map((v,i)=>lerp(v,T[i],z));const k0=Math.min(w/1120,h/700);let k=Math.min(w/R[2],h/R[3]);k=Math.min(k,Math.max(k0,innerWidth<900?1.15:1.45));
    let tx=w/2-(R[0]+R[2]/2)*k,ty=h/2-(R[1]+R[3]/2)*k;const iw=1120*k,ih=700*k;
    tx=iw>=w?clamp(tx,w-iw,0):(w-iw)/2;ty=ih>=h?clamp(ty,h-ih,0):(h-ih)/2;
    Pn.inner.style.transform=`translate(${tx}px,${ty}px) scale(${k})`;Pn.inner.style.setProperty('--k',k);}
  function refreshPanels(){for(const Pn of panels){const e=screen(Pn.key);if(e.url&&Pn.img.getAttribute('src')!==e.url)Pn.img.setAttribute('src',e.url);}}
  function buildOverlay(){beatsEl.innerHTML='';focusLayer.innerHTML='';beats=[];panels=panels.filter(p=>p.dash);
    for(const s of J.scenes)for(const b of s.beats){const el=document.createElement('div');el.className='op-beat op-'+b.side;el.innerHTML=`<h2></h2><p></p>`;el.querySelector('h2').textContent=b.h;el.querySelector('p').textContent=b.p;
      let pn=null,focus=null;const note=b.panel&&(b.panel.swapK?'Real InventoryOS screen · sample data · status updated for this example':'Real InventoryOS screen · sample data');
      if(b.panel&&b.fx&&FOCUS){el.classList.add('op-focusbeat');pn=panelEl(b.panel);pn.fig.classList.add('op-big');const box=document.createElement('div');box.className='op-focus';box.appendChild(pn.fig);
        const co=document.createElement('div');co.className='op-callout';co.textContent=b.fx;pn.fig.appendChild(co);const n=document.createElement('p');n.className='op-note';n.textContent=note;box.appendChild(n);focusLayer.appendChild(box);focus={box,co};}
      else if(b.panel&&b.panel.trio){el.classList.add('op-triobeat');const row=document.createElement('div');row.className='op-trio';
        b.panel.trio.forEach((r,i)=>{const t=panelEl({...b.panel,r,m:r,hl:'',alt:i?'':b.panel.alt});t.fig.classList.add('op-triocard');if(i)t.fig.setAttribute('aria-hidden','true');row.appendChild(t.fig);});
        el.appendChild(row);const n=document.createElement('p');n.className='op-note op-trionote';n.textContent=note;el.appendChild(n);pn={trio:row};}
      else if(b.panel){pn=panelEl(b.panel);if(b.panel.wide)pn.fig.classList.add('op-wide');el.appendChild(pn.fig);const n=document.createElement('p');n.className='op-note';n.textContent=note;el.appendChild(n);}
      beatsEl.appendChild(el);beats.push({el,a:s.t0+b.a*s.dur,b:s.t0+b.b*s.dur,pn,focus,swap:b.panel?.swapAt!=null?s.t0+b.panel.swapAt*s.dur:null,base:b.panel?.k,swapK:b.panel?.swapK});}
    // dashboard panel reflects this journey's numbers
    const d=J.dash,ds=J.scenes[J.scenes.length-1];const hl=['440,150,206,106','880,150,208,106'];if(d.status)hl.push('214,354,528,50');
    dashEl.querySelector('.op-dash-ui')?.remove();const pn=panelEl({k:'overview',r:[0,0,1120,700],m:[180,120,940,320],hl:hl.join(';'),alt:`InventoryOS Overview: sales today £${d.sales.toFixed(2)}, ${d.units} units in stock${d.status?', ORDER-1024 dispatched':''}`});
    pn.dash=true;pn.fig.classList.add('op-dash-ui','op-swap');if(FOCUS)pn.fig.classList.add('op-big');dashEl.querySelector('.op-dash-copy').after(pn.fig);
    const dco=document.createElement('div');dco.className='op-callout';dco.textContent=`Sales today £${d.sales.toFixed(2)} · ${d.units} units in stock`+(d.status?' · ORDER-1024 Dispatched':'');pn.fig.appendChild(dco);pn.co=dco;
    dashState={pn,at:ds.t0+.5*ds.dur,after:'ov:'+JSON.stringify(d)};
    const bits=[`sales today £${d.sales.toFixed(2)}`,`${d.units} units in stock`];if(d.status)bits.push('ORDER-1024 dispatched');
    dashEl.querySelector('.op-dash-copy p').textContent='Your Overview now shows '+bits.join(', ')+'.';
    railEl.innerHTML='';for(const s of J.scenes)if(s.label){const li=document.createElement('li');li.dataset.t=s.t0;li.innerHTML='<i></i><span></span>';li.querySelector('span').textContent=s.label;railEl.appendChild(li);}
    for(const s of J.scenes){screen(s.screen(0)||'overview');screen(s.screen(.99)||'overview');}for(const b of beats)if(b.swapK)screen(b.swapK);screen(dashState.after);
    refreshPanels();}
  let dashState=null;
  function overlay(t){
    const hd=J.scenes[0].dur,h=1-seg(t,hd*.25,hd*.75);hero.style.opacity=h;hero.style.translate=`0 ${(1-h)*-24}px`;hero.style.visibility=h<.01?'hidden':'visible';hero.inert=h<.5;
    let dim=0;const mob=innerWidth<900;
    for(const B of beats){const fi=seg(t,B.a,B.a+.04),fo=1-seg(t,B.b-.04,B.b),o=Math.min(fi,fo);B.el.style.opacity=o;B.el.style.translate=`0 ${(1-fi)*20-(1-fo)*20}px`;let vis=o>.01;B.el.style.visibility=vis?'visible':'hidden';
      if(B.focus){const f=clamp((t-B.a)/(B.b-B.a)),ap=seg(f,0,.14),zi=seg(f,.12,.36),hl=seg(f,.3,.42),zo=seg(f,.72,.86),ds=seg(f,.86,1),fv=ap*(1-ds);
        B.focus.box.style.opacity=fv;B.focus.box.style.visibility=fv>.01?'visible':'hidden';B.focus.box.style.transform=(mob?'':'translateY(-50%) ')+`scale(${lerp(.86,1,ap)*lerp(1,.94,ds)})`;
        if(fv>.01){focusZoom(B.pn,zi*(1-zo));B.pn.fig.style.setProperty('--hl',hl*(1-zo));B.focus.co.style.opacity=hl*(1-zo);B.focus.co.style.translate=`0 ${(1-hl)*10}px`;}dim=Math.max(dim,fv);vis=fv>.01;}
      if(B.pn&&B.pn.trio){if(vis){const cards=[...B.pn.trio.children];cards.forEach(c=>{const P2=panels.find(x=>x.fig===c);if(P2)fitPanel(P2);});
        if(innerWidth<900){const f=clamp((t-B.a)/(B.b-B.a)),step=cards[1].offsetLeft-cards[0].offsetLeft;B.pn.trio.style.transform=`translateX(${-step*2*seg(f,.18,.82)}px)`;}else B.pn.trio.style.transform='';}continue;}
      if(B.pn&&vis){if(!B.focus)fitPanel(B.pn);const key=B.swap!=null&&t>=B.swap?B.swapK:B.base;if(B.pn.key!==key){B.pn.key=key;refreshPanels();}B.pn.fig.classList.toggle('op-after',B.swap!=null&&t>=B.swap);}}
    const ds=J.scenes[J.scenes.length-1],du=clamp((t-ds.t0)/ds.dur);const dv=seg(du,.24,.3);dashEl.style.opacity=dv;dashEl.style.visibility=dv<.01?'hidden':'visible';
    dimEl.style.opacity=dim*.62;
    if(dashState&&dv>0){if(FOCUS){const zd=seg(du,.5,.6)*(1-seg(du,.8,.88));focusZoom(dashState.pn,zd,[424,132,670,138]);dashState.pn.co.style.opacity=zd;}else fitPanel(dashState.pn);const after=t>=dashState.at;const key=after?dashState.after:'overview';if(dashState.pn.key!==key){dashState.pn.key=key;refreshPanels();}dashState.pn.fig.classList.toggle('op-after',after);}
    fadeEl.style.opacity=seg(du,.88,1,x=>x);cutEl.style.opacity=Math.max(0,...cuts.map(c=>1-Math.abs(t-c)/.045));
    skip.classList.toggle('show',t>.04&&t<J.total-.04);
    let act=null;for(const li of railEl.children)if(t>=+li.dataset.t-.005)act=li;for(const li of railEl.children){li.classList.toggle('active',li===act);li.classList.toggle('done',!!act&&+li.dataset.t<+act.dataset.t);}
    railBox.classList.toggle('show',t>hd*.8&&du<.3);}

  function mapX(x){x=clamp(x,0,J.scroll);let s=J.scenes[0];for(const c of J.scenes)if(x>=c.x0)s=c;let l=x-s.x0,pos=0,up=0;
    for(const [hu,hl] of s.holds){const sg=(hu-up)*s.dur;if(l<=pos+sg)return {t:s.t0+up*s.dur+(l-pos),hold:0};pos+=sg;if(l<=pos+hl)return {t:s.t0+hu*s.dur,hold:(l-pos)/hl};pos+=hl;up=hu;}
    return {t:Math.min(s.t0+s.dur,s.t0+up*s.dur+(l-pos)),hold:0};}
  function xFromT(t){let s=J.scenes[0];for(const c of J.scenes)if(t>=c.t0)s=c;const u=clamp((t-s.t0)/s.dur);return s.x0+u*s.dur+s.holds.filter(h=>h[0]<u).reduce((a,h)=>a+h[1],0);}
  // ---------- Choices
  const chips=[...root.querySelectorAll('.op-chip')],summary=$('.op-summary');
  function setJourney(){J=buildJourney();buildCamera();buildOverlay();J.has=k=>chosen.size===0||chosen.has(k);
    root.style.height=reduce?'':`calc(${(J.scroll+1).toFixed(3)} * 100svh)`;requestAnimationFrame(()=>ScrollTrigger.refresh());
    const names=J.scenes.filter(s=>s.label).map(s=>s.label.split(' ')[0].toLowerCase());
    summary.textContent=chosen.size?`Your journey: ${J.scenes.filter(s=>s.label).length} steps, ending on your dashboard.`:'Nothing chosen yet: you will see the complete journey.';
    chips.forEach(c=>c.setAttribute('aria-pressed',chosen.has(c.dataset.k)));lastP=-1;}
  chips.forEach(c=>c.addEventListener('click',()=>{const k=c.dataset.k;chosen.has(k)?chosen.delete(k):chosen.add(k);try{localStorage.setItem('ios-opening-choice',JSON.stringify([...chosen]));}catch(e){}setJourney();}));
  $('[data-explore]')?.addEventListener('click',()=>{const r=root.getBoundingClientRect(),tot=r.height-innerHeight;scrollTo({top:scrollY+r.top+tot*xFromT(J.scenes[1].t0+.02)/J.scroll,behavior:'smooth'});});

  // ---------- Frame loop: GSAP ScrollTrigger scrubs a proxy; the scene is a pure function of it
  let idle=0,lastP=-1,raf=0,visible=true,size=[0,0],forced=null,last=performance.now();
  const proxy={p:0};const tween=gsap.to(proxy,{p:1,ease:'none',scrollTrigger:{trigger:root,start:'top top',end:'bottom bottom',scrub:innerWidth<900?.6:1,invalidateOnRefresh:true}});
  function resize(){const w=stageEl.clientWidth,h=stageEl.clientHeight;if(w===size[0]&&h===size[1])return;size=[w,h];const sc=(window.__scale0??(innerWidth<700?.85:1))*qScale;
    renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.6:1.75)*sc);renderer.setSize(w,h,false);camera.aspect=w/h;lastP=-1;panels.forEach(x=>x.w=0);}
  const loaded={};const UPG={pack:upgradeWorld,stage:upgradeStage,ship:upgradeShip};
  function want(name){if(loaded[name])return;loaded[name]=true;loadBundle(ASSETS(),name).then(r=>{UPG[name](P,r);dirty=true;renderer.compileAsync?.(scene,camera).catch(()=>{});root.classList.add('op-'+name+'-ready');if(name==='pack'){root.classList.add('op-real');requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('op-live')));}}).catch(e=>console.warn('opening: placeholder '+name,e));}
  const whenIdle=cb=>('requestIdleCallback' in window?requestIdleCallback(cb,{timeout:2500}):setTimeout(cb,1200));
  whenIdle(()=>{want('pack');want('stage');});setTimeout(()=>{if(J.scenes.some(s=>s.id==='ship'))whenIdle(()=>want('ship'));},6000);
  function draw(t,hold=0){holdNow=hold;reset();if(plinthBlob)plinthBlob.visible=P.plinth.visible;P.candle.rotation.y=lerp(idle,-.25,seg(t,.02,J.scenes[0].dur*.8));
    if(!loaded.ship){const pk=J.scenes.find(s=>s.id==='pack');if(pk&&t>pk.t0)want('ship');}
    const ctx={has:J.has};for(const s of J.scenes){if(t<s.t0)break;s.apply(clamp((t-s.t0)/s.dur),ctx);}post();
    let cur=J.scenes[0];for(const s of J.scenes)if(t>=s.t0)cur=s;const key=cur.screen(clamp((t-cur.t0)/cur.dur));const e=key&&screen(key);if(e&&e.tex&&P.screenMat.map!==e.tex){P.screenMat.map=e.tex;P.screenMat.needsUpdate=true;}
    placeCamera(t);overlay(t);renderer.render(scene,camera);dirty=false;}
  // adaptive quality: drop the render scale when moving frames are slow, recover when there is headroom
  let slow=0,fast=0,idleFrame=0,idleSince=performance.now();
  function adapt(dt){if(dt>.042)slow++;else if(dt<.02)fast++;
    if(slow>18){slow=fast=0;if(qScale>.5){qScale=Math.max(.5,qScale-.12);size=[0,0];}}
    if(fast>240){slow=fast=0;if(qScale<(lowEnd?.85:1)){qScale=Math.min(lowEnd?.85:1,qScale+.08);size=[0,0];}}}
  function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;raf=requestAnimationFrame(frame);if(!visible||document.hidden)return;resize();
    const p=forced??proxy.p,resting=p<.002,moved=Math.abs(p-lastP)>1e-6;
    // the hero turntable runs at 30 fps and stops after 20 s idle to save power
    if(!resting||moved)idleSince=now;const spin=resting&&now-idleSince<20000&&(idleFrame++%2===0);if(spin)idle=(idle+dt*2*.32)%(Math.PI*2);
    if(p>.003&&!root.classList.contains('op-live'))root.classList.add('op-live');   // started scrolling before the models arrived
    if(spin||dirty||moved){if(moved)adapt(dt);lastP=p;const m=mapX(p*J.scroll);draw(m.t,m.hold);}}
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;},{rootMargin:'100px'});io.observe(stageEl);
  setJourney();raf=requestAnimationFrame(frame);root.classList.add('op-ready');
  setTimeout(()=>root.classList.add('op-live'),12000);   // never hide the scene for long if a model is slow
  window.__story={get quality(){return {qScale,lowEnd,pr:renderer.getPixelRatio()};},seek(v){forced=v;const m=mapX(v*J.scroll);draw(m.t,m.hold);},release(){forced=null;},pAt(t){return xFromT(t)/J.scroll;},get journey(){return J.scenes.map(s=>s.id+':'+s.t0.toFixed(2));},get total(){return J.total;},get scroll(){return J.scroll;},choose(list){chosen=new Set(list);setJourney();},want};
  return {destroy(){cancelAnimationFrame(raf);io.disconnect();tween.scrollTrigger?.kill();tween.kill();renderer.dispose();}};
}
