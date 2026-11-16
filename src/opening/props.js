// InventoryOS opener: 3D props. Every prop below is a placeholder built in code.
// Blender stage: export each named prop as glTF (see PROP_MANIFEST) and swap it in with replaceProp();
// the scene timeline only moves these named groups, so the animation logic does not change.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
export const easeOut=t=>1-Math.pow(1-t,3);
export const seg=(p,a,b,f=ease)=>f(clamp((p-a)/(b-a)));
export const lerp=(a,b,t)=>a+(b-a)*t;
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const PROP_MANIFEST={candle:'candle.glb',box:'box.glb',peanut:'peanut.glb',tapeRoll:'tape-roll.glb',laptop:'laptop.glb',printer:'thermal-printer.glb',conveyor:'conveyor.glb',van:'van.glb',shelf:'shelf.glb',bench:'bench.glb',home:'doorstep.glb'};
export function replaceProp(group,gltfScene){while(group.children.length)group.remove(group.children[0]);group.add(gltfScene);}
export function buildWorld(renderer){
const BG=new THREE.Color('#0b0a0e');
const scene=new THREE.Scene();
scene.background=BG;
scene.fog=new THREE.Fog(BG,70,190);

// ---------- Studio environment: dark room with softboxes (gives the glass its streak highlights)
{
  const env=new THREE.Scene();
  env.background=new THREE.Color('#050707');
  const box=(w,h,c,i,pos,rot)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i),side:THREE.DoubleSide}));m.position.set(...pos);if(rot)m.rotation.set(...rot);env.add(m);};
  box(10,10,'#fff6ea',3.2,[0,9,0],[Math.PI/2,0,0]);          // overhead softbox
  box(1.4,9,'#ffffff',6,[-7,1,-2],[0,Math.PI/2.6,0]);         // left strip
  box(1.4,9,'#f1ecff',5,[7,1,-3],[0,-Math.PI/2.6,0]);         // right strip (cool)
  box(12,2.2,'#ffe7cc',1.6,[0,0,9],[0,Math.PI,0]);            // low front fill
  box(14,6,'#7344e7',.4,[0,0,-9]);                            // brand-teal back wash
  const pm=new THREE.PMREMGenerator(renderer);
  scene.environment=pm.fromScene(env,.03).texture;
  scene.environmentIntensity=.9;
}

// ---------- Lights
const key=new THREE.SpotLight('#ffe6cc',5200,0,.42,.85,2);
key.position.set(-16,42,22);key.target.position.set(0,4,0);
key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0003;key.shadow.normalBias=.03;key.shadow.radius=6;
key.shadow.camera.near=20;key.shadow.camera.far=110;
scene.add(key,key.target);
const rim=new THREE.DirectionalLight('#e8e2ff',1.6);rim.position.set(14,16,-26);scene.add(rim);
const teal=new THREE.PointLight('#8b5cf6',140,0,2);teal.position.set(0,12,-18);scene.add(teal);
scene.add(new THREE.HemisphereLight('#dfeeea','#0a0f0e',.18));

// ---------- Textures drawn on canvas (no downloads)
function tex(w,h,draw,{repeat=null,srgb=true}={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}return t;}
const R=rng(7);
const cardTex=tex(512,512,(g,w,h)=>{g.fillStyle='#ad8a62';g.fillRect(0,0,w,h);const id=g.getImageData(0,0,w,h),d=id.data;for(let i=0;i<d.length;i+=4){const n=(R()-.5)*22;d[i]+=n;d[i+1]+=n*.9;d[i+2]+=n*.7;}g.putImageData(id,0,0);
  for(let y=0;y<h;y+=7){g.fillStyle='rgba(60,35,10,.05)';g.fillRect(0,y,w,2);}
  for(let i=0;i<900;i++){g.strokeStyle=R()<.5?'rgba(80,50,20,.10)':'rgba(255,230,190,.08)';g.lineWidth=.8;const x=R()*w,y=R()*h,a=R()*Math.PI;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9);g.stroke();}
},{repeat:[1,1]});
const labelTex=tex(1024,400,(g,w,h)=>{g.fillStyle='#f1eadc';g.fillRect(0,0,w,h);
  g.strokeStyle='#2a2522';g.lineWidth=2;g.strokeRect(26,26,w-52,h-52);
  g.fillStyle='#2a2522';g.textAlign='center';
  g.font='600 30px Georgia, serif';g.fillText('WILLOW & PINE',w/2,104);
  g.font='500 78px Georgia, serif';g.fillText('Cedar candle',w/2,196);
  g.font='italic 32px Georgia, serif';g.fillText('cedarwood · amber · smoke',w/2,252);
  g.font='600 22px Helvetica, Arial, sans-serif';g.fillText('CED-001   ·   SOY WAX   ·   220 G',w/2,322);
});
const woodTex=tex(512,512,(g,w,h)=>{g.fillStyle='#8a5a33';g.fillRect(0,0,w,h);for(let r=4;r<w;r+=3+R()*5){g.strokeStyle=`rgba(${R()<.5?'60,32,14':'170,120,80'},${.15+R()*.2})`;g.lineWidth=1+R()*1.5;g.beginPath();g.arc(w/2+(R()-.5)*6,h/2+(R()-.5)*6,r,0,Math.PI*2);g.stroke();}});
const sideWood=tex(512,64,(g,w,h)=>{g.fillStyle='#87572f';g.fillRect(0,0,w,h);for(let i=0;i<70;i++){g.fillStyle=`rgba(${R()<.5?'55,30,12':'175,125,85'},${.12+R()*.2})`;g.fillRect(0,R()*h,w,1+R()*2);}});

// ---------- Floor + plinth
const floor=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({color:'#131217',roughness:.5,metalness:0}));
floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const plinth=new THREE.Mesh(new THREE.CylinderGeometry(8.2,8.6,1.8,128),new THREE.MeshPhysicalMaterial({color:'#18171c',roughness:.5,clearcoat:.25,clearcoatRoughness:.35}));
plinth.castShadow=plinth.receiveShadow=true;scene.add(plinth);
const PLINTH_TOP=1.8;

// ---------- Pack root (candle + box + peanuts share it so the finished parcel can turn as one)
const pack=new THREE.Group();scene.add(pack);

// Candle
const candle=new THREE.Group();pack.add(candle);
{
  const prof=[[0,0],[3.55,0],[3.92,.12],[4.02,.45],[4.02,8.55],[3.98,8.95],[3.86,9.05],[3.74,8.95],[3.70,8.5],[3.70,1.25],[3.45,.95],[0,.95]].map(([x,y])=>new THREE.Vector2(x,y));
  const glass=new THREE.Mesh(new THREE.LatheGeometry(prof,128),new THREE.MeshPhysicalMaterial({color:'#ffffff',metalness:0,roughness:.035,transmission:1,thickness:.7,ior:1.52,attenuationColor:new THREE.Color('#e3a566'),attenuationDistance:7,specularIntensity:1,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:1.4}));
  glass.castShadow=true;candle.add(glass);
  const wax=new THREE.Mesh(new THREE.CylinderGeometry(3.66,3.66,6.1,96),new THREE.MeshPhysicalMaterial({color:'#efe2cc',roughness:.6,sheen:.6,sheenColor:new THREE.Color('#ffe9c8'),emissive:new THREE.Color('#3b200b'),emissiveIntensity:.25}));
  wax.position.y=.95+3.05;candle.add(wax);
  const wick=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,1.1,8),new THREE.MeshStandardMaterial({color:'#141210',roughness:.9}));
  wick.position.y=7.5;wick.rotation.z=.12;candle.add(wick);
  const label=new THREE.Mesh(new THREE.CylinderGeometry(4.04,4.04,3.4,96,1,true,-0.78,1.56),new THREE.MeshStandardMaterial({map:labelTex,roughness:.75,side:THREE.FrontSide}));
  label.position.y=4.6;label.rotation.y=0;candle.add(label);
}
// Wooden lid (drops on when the order comes in)
const lid=new THREE.Group();candle.add(lid);
{
  const top=new THREE.Mesh(new THREE.CylinderGeometry(4.12,4.12,1.05,96),[new THREE.MeshStandardMaterial({map:sideWood,roughness:.55}),new THREE.MeshStandardMaterial({map:woodTex,roughness:.5}),new THREE.MeshStandardMaterial({map:woodTex,roughness:.5})]);
  top.position.y=9.55;top.castShadow=true;lid.add(top);
}

// Box: interior 15 × 15 × 13, wall .35
const W=15,D=15,H=13,T=.35,FL=W/2;
const box=new THREE.Group();pack.add(box);
const cardMat=new THREE.MeshStandardMaterial({map:cardTex,roughness:.88,color:'#ffffff'});
const cardIn=new THREE.MeshStandardMaterial({map:cardTex,roughness:.92,color:'#d9c3a3'});
function slab(w,h,d,x,y,z,parent=box){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,.08),[cardMat,cardMat,cardMat,cardIn,cardMat,cardIn]);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
slab(W+2*T,T,D+2*T,0,T/2,0);                       // base
slab(W+2*T,H,T,0,H/2,D/2+T/2);                     // front
slab(W+2*T,H,T,0,H/2,-D/2-T/2);                    // back
slab(T,H,D,W/2+T/2,H/2,0);                         // right
slab(T,H,D,-W/2-T/2,H/2,0);                        // left
const OPEN=Math.PI/2+.42;
function flap(axis,sign,pos,size,off){const g=new THREE.Group();g.position.set(...pos);box.add(g);const m=slab(...size,...off,g);return {g,axis,sign};}
// Front/back fold first (lower), left/right on top.
const flaps=[
  flap('x', 1,[0,H,D/2+T/2],[W+2*T,T,FL],[0,0,-FL/2]),
  flap('x',-1,[0,H,-D/2-T/2],[W+2*T,T,FL],[0,0,FL/2]),
  flap('z',-1,[W/2+T/2,H+T,0],[FL,T,D+2*T],[-FL/2,0,0]),
  flap('z', 1,[-W/2-T/2,H+T,0],[FL,T,D+2*T],[FL/2,0,0]),
];
const BOX_FLOOR=T;

// Peanuts: deterministic flight paths, so scrolling back replays them exactly.
const N=230;
const peanutGeo=(()=>{const g=new THREE.CapsuleGeometry(.5,1.25,6,12);const p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const f=1-.24*Math.exp(-Math.pow(y*1.7,2));x*=f;z*=f*.78;x+=.32*Math.cos(y*1.6);p.setXYZ(i,x,y,z);}g.computeVertexNormals();return g;})();
const peanuts=new THREE.InstancedMesh(peanutGeo,new THREE.MeshStandardMaterial({color:'#f3efe6',roughness:.82}),N);
peanuts.castShadow=true;peanuts.receiveShadow=true;pack.add(peanuts);
const PN=[];{const r=rng(42);for(let i=0;i<N;i++){let x,z;do{x=(r()*2-1)*(W/2-1.1);z=(r()*2-1)*(D/2-1.1);}while(Math.hypot(x,z)<5.1);
  const depth=Math.pow(r(),.6);const y=lerp(2,H-1.1,depth)+(1-Math.hypot(x,z)/11)*1.2;
  PN.push({rest:new THREE.Vector3(x,y,z),start:new THREE.Vector3(x*.3,BOX_FLOOR+1,z*.3),peak:y+9+r()*12,delay:r()*.38,rot:new THREE.Euler(r()*6.28,r()*6.28,r()*6.28),spin:new THREE.Vector3(r()*14-7,r()*14-7,r()*14-7),bounce:.6+r()*1.1});}}
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new THREE.Vector3(),_s=new THREE.Vector3();
function placePeanuts(s){for(let i=0;i<N;i++){const P=PN[i];const u=clamp((s-P.delay)/.55);if(u<=0){_m.makeScale(0,0,0);peanuts.setMatrixAt(i,_m);continue;}
  const a=Math.min(u/.78,1);_v.lerpVectors(P.start,P.rest,easeOut(a));
  const y0=P.start.y,y1=P.rest.y,yc=2*P.peak-(y0+y1)/2;_v.y=(1-a)*(1-a)*y0+2*a*(1-a)*yc+a*a*y1;
  if(u>.78){const v=(u-.78)/.22;_v.y=y1+P.bounce*Math.abs(Math.sin(v*Math.PI*2))*Math.pow(1-v,2);}
  const k=Math.pow(1-u,2);_e.set(P.rot.x+P.spin.x*k,P.rot.y+P.spin.y*k,P.rot.z+P.spin.z*k);_q.setFromEuler(_e);
  const sc=Math.min(1,u*6);_s.set(sc,sc,sc);_m.compose(_v,_q,_s);peanuts.setMatrixAt(i,_m);}
  peanuts.instanceMatrix.needsUpdate=true;}

// Tape + roll
const tapeMat=new THREE.MeshPhysicalMaterial({color:'#7f5428',roughness:.35,clearcoat:.35,clearcoatRoughness:.3,transparent:true,opacity:.9});
const TW=4.8,TOP=H+2*T+.03,TAB=4;
const tapeTop=new THREE.Mesh(new THREE.PlaneGeometry(TW,1),tapeMat);tapeTop.rotation.x=-Math.PI/2;tapeTop.receiveShadow=true;pack.add(tapeTop);
const tabF=new THREE.Mesh(new THREE.PlaneGeometry(TW,1),tapeMat);pack.add(tabF);
const tabB=new THREE.Mesh(new THREE.PlaneGeometry(TW,1),tapeMat);tabB.rotation.y=Math.PI;pack.add(tabB);
const roll=new THREE.Group();pack.add(roll);
{const r=new THREE.Mesh(new THREE.TorusGeometry(2.3,1.05,24,64),new THREE.MeshPhysicalMaterial({color:'#9b6630',roughness:.3,clearcoat:1}));r.rotation.y=Math.PI/2;r.castShadow=true;roll.add(r);
 const core=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,TW,48,1,true),new THREE.MeshStandardMaterial({color:'#c9a77c',roughness:.9,side:THREE.DoubleSide}));core.rotation.z=Math.PI/2;roll.add(core);}


// ---------- Laptop showing real InventoryOS screens (sample workspace "Willow & Pine")
const LAP={x:-26,z:-8,ry:.55};
const laptop=new THREE.Group();laptop.position.set(LAP.x,0,LAP.z);laptop.rotation.y=LAP.ry;scene.add(laptop);
const alu=new THREE.MeshPhysicalMaterial({color:'#9aa3a6',metalness:.85,roughness:.32,clearcoat:.3});
const lapBase=new THREE.Mesh(new RoundedBoxGeometry(30,1,21,3,.45),alu);lapBase.position.y=.5;lapBase.castShadow=lapBase.receiveShadow=true;laptop.add(lapBase);
const deck=new THREE.Mesh(new THREE.PlaneGeometry(26,9),new THREE.MeshStandardMaterial({color:'#1b1f21',roughness:.7}));deck.rotation.x=-Math.PI/2;deck.position.set(0,1.01,-3.6);laptop.add(deck);
const pad=new THREE.Mesh(new THREE.PlaneGeometry(10,6.4),new THREE.MeshStandardMaterial({color:'#8d9699',metalness:.6,roughness:.45}));pad.rotation.x=-Math.PI/2;pad.position.set(0,1.012,5.6);laptop.add(pad);
const hinge=new THREE.Group();hinge.position.set(0,1,-10.3);laptop.add(hinge);
const lidM=new THREE.Mesh(new RoundedBoxGeometry(30,19.6,.7,3,.3),alu);lidM.position.set(0,9.8,0);lidM.castShadow=true;hinge.add(lidM);
const bezel=new THREE.Mesh(new THREE.PlaneGeometry(29,19),new THREE.MeshStandardMaterial({color:'#07090a',roughness:.25}));bezel.position.set(0,9.8,.36);hinge.add(bezel);
const screenMat=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false});
const screen=new THREE.Mesh(new THREE.PlaneGeometry(27.6,17.25),screenMat);screen.position.set(0,10.2,.37);hinge.add(screen);
// ---------- Thermal label printer + 4×6 shipping label
const PR={x:-4,z:-32};
const printer=new THREE.Group();printer.position.set(PR.x,0,PR.z);scene.add(printer);
{const body=new THREE.Mesh(new RoundedBoxGeometry(13,6.4,15,4,1.2),new THREE.MeshPhysicalMaterial({color:'#2a2f31',roughness:.45,clearcoat:.4}));body.position.y=3.2;body.castShadow=body.receiveShadow=true;printer.add(body);
 const cover=new THREE.Mesh(new RoundedBoxGeometry(12.4,1.4,11,4,.6),new THREE.MeshPhysicalMaterial({color:'#121516',roughness:.15,clearcoat:1}));cover.position.set(0,6.6,-1.6);cover.castShadow=true;printer.add(cover);
 const slot=new THREE.Mesh(new THREE.BoxGeometry(11,.35,.4),new THREE.MeshBasicMaterial({color:'#050606'}));slot.position.set(0,6.55,7.42);printer.add(slot);
 const led=new THREE.Mesh(new THREE.CircleGeometry(.28,16),new THREE.MeshBasicMaterial({color:'#4ade80',toneMapped:false}));led.position.set(4.6,4.8,7.52);printer.add(led);
 const btn=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,.3,24),new THREE.MeshStandardMaterial({color:'#3a4043',roughness:.5}));btn.rotation.x=Math.PI/2;btn.position.set(3,4.8,7.5);printer.add(btn);}
const shipTex=tex(600,900,(g,w,h)=>{g.fillStyle='#fbfbf8';g.fillRect(0,0,w,h);g.fillStyle='#111';g.fillRect(0,0,w,120);g.fillStyle='#fff';g.font='700 56px Helvetica, Arial, sans-serif';g.fillText('SHIPPING LABEL',30,78);
  g.fillStyle='#111';g.font='700 34px Helvetica, Arial, sans-serif';g.fillText('TRACKED 48 · EXAMPLE',30,180);g.fillRect(30,205,w-60,4);
  g.font='500 26px Helvetica, Arial, sans-serif';g.fillText('TO',30,260);g.font='700 44px Helvetica, Arial, sans-serif';g.fillText('Sample Recipient',30,315);
  g.font='500 30px Helvetica, Arial, sans-serif';g.fillText('Example address',30,365);g.fillText('Sample town',30,405);g.fillRect(30,440,w-60,4);
  const r=rng(9);let x=40;while(x<w-40){const bw=2+Math.floor(r()*6);if(r()>.4)g.fillRect(x,480,bw,190);x+=bw+2;}
  g.font='700 54px Helvetica, Arial, sans-serif';g.fillText('DEMO 1024',30,760);g.font='600 24px Helvetica, Arial, sans-serif';g.fillText('NOT VALID FOR POSTAGE',30,830);});
const shipLabel=new THREE.Mesh(new THREE.PlaneGeometry(10,15),new THREE.MeshStandardMaterial({map:shipTex,roughness:.6,side:THREE.DoubleSide}));
shipLabel.castShadow=true;scene.add(shipLabel);
const _qa=new THREE.Quaternion(),_qb=new THREE.Quaternion(),_pa=new THREE.Vector3(),_pb=new THREE.Vector3(),_eu=new THREE.Euler();
const LABEL_LOCAL=new THREE.Vector3(0,H+2*T+.09,0);

// ---------- Conveyor (top surface at y = 7 when raised)
const conv=new THREE.Group();scene.add(conv);
const CONV={x0:-9,x1:84,top:7,w:20};
const beltTex=tex(256,64,(g,w,h)=>{g.fillStyle='#1b1f20';g.fillRect(0,0,w,h);g.fillStyle='#262b2d';for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x+16,h/2);g.lineTo(x,h);g.lineTo(x+8,h);g.lineTo(x+24,h/2);g.lineTo(x+8,0);g.fill();}},{repeat:[(CONV.x1-CONV.x0)/8,1]});
{const L=CONV.x1-CONV.x0,cx=(CONV.x0+CONV.x1)/2;const steel=new THREE.MeshPhysicalMaterial({color:'#aeb6b9',metalness:.9,roughness:.28});
 const bed=new THREE.Mesh(new THREE.BoxGeometry(L,1.6,CONV.w),new THREE.MeshStandardMaterial({color:'#2b3133',roughness:.6}));bed.position.set(cx,CONV.top-.85,0);bed.castShadow=bed.receiveShadow=true;conv.add(bed);
 const belt=new THREE.Mesh(new THREE.PlaneGeometry(L,CONV.w-1.4),new THREE.MeshStandardMaterial({map:beltTex,roughness:.75}));belt.rotation.x=-Math.PI/2;belt.position.set(cx,CONV.top+.01,0);belt.receiveShadow=true;conv.add(belt);
 for(const z of [-CONV.w/2,CONV.w/2]){const rail=new THREE.Mesh(new RoundedBoxGeometry(L,1.8,.7,2,.3),steel);rail.position.set(cx,CONV.top+.3,z);rail.castShadow=true;conv.add(rail);}
 for(const x of [CONV.x0,CONV.x1]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,CONV.w,32),steel);r.rotation.x=Math.PI/2;r.position.set(x,CONV.top-.8,0);conv.add(r);}
 for(let x=CONV.x0+4;x<CONV.x1;x+=18)for(const z of [-CONV.w/2+1,CONV.w/2-1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(1,CONV.top-1.6,1),steel);leg.position.set(x,(CONV.top-1.6)/2,z);leg.castShadow=true;conv.add(leg);}}

// ---------- Delivery van (generic, unbranded). Rear opening at x = 84, drives towards +x.
const van=new THREE.Group();scene.add(van);
const VAN_X=CONV.x1+.5;
const doors=[];
{const paint=new THREE.MeshPhysicalMaterial({color:'#eef1f0',roughness:.28,clearcoat:1,clearcoatRoughness:.08});
 const inner=new THREE.MeshStandardMaterial({color:'#3a4244',roughness:.8});
 const glass=new THREE.MeshPhysicalMaterial({color:'#0c1214',roughness:.05,metalness:.3,clearcoat:1});
 const rubber=new THREE.MeshStandardMaterial({color:'#121314',roughness:.85});
 const hub=new THREE.MeshPhysicalMaterial({color:'#c4cacc',metalness:.9,roughness:.25});
 const add=(geo,mat,x,y,z,cast=true)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;van.add(m);return m;};
 add(new THREE.BoxGeometry(50,1,22),inner,25,6.5,0);                 // cargo floor (top y≈7)
 add(new RoundedBoxGeometry(50,1.2,24,2,.5),paint,25,30.4,0);        // roof
 for(const z of [-11.6,11.6])add(new RoundedBoxGeometry(50,24.6,1,2,.4),paint,25,18.5,z);
 add(new THREE.BoxGeometry(1,24,22),inner,49.5,18.5,0);              // bulkhead
 add(new THREE.BoxGeometry(50,22.6,.2),inner,25,18.5,-10.9,false);add(new THREE.BoxGeometry(50,22.6,.2),inner,25,18.5,10.9,false);
 add(new RoundedBoxGeometry(18,22,24,3,2),paint,59,16.5,0);           // cab
 add(new RoundedBoxGeometry(9,10,23,3,2.2),paint,70,10.5,0);          // bonnet
 const ws=add(new THREE.PlaneGeometry(21,9),glass,68.2,21.2,0);ws.rotation.y=Math.PI/2;ws.rotation.x=0;ws.rotation.z=0;ws.rotateX(0);ws.rotateY(0);ws.rotation.set(0,Math.PI/2,0);ws.rotateX(-.45);
 for(const z of [-12.05,12.05]){const w=add(new THREE.PlaneGeometry(11,8),glass,58,21,z,false);w.rotation.y=z>0?0:Math.PI;}
 add(new THREE.BoxGeometry(76,3.2,20),new THREE.MeshStandardMaterial({color:'#1d2224',roughness:.7}),35,4.4,0);
 for(const z of [-12.1,12.1]){const st=add(new THREE.PlaneGeometry(64,1.2),new THREE.MeshBasicMaterial({color:'#7344e7'}),36,12.5,z,false);st.rotation.y=z>0?0:Math.PI;}
 for(const z of [-9.5,9.5]){add(new THREE.BoxGeometry(.4,4,2),new THREE.MeshBasicMaterial({color:'#e23b2e',toneMapped:false}),-.2,16,z,false);}
 for(const x of [10,58])for(const z of [-10.4,10.4]){const t=add(new THREE.CylinderGeometry(4.1,4.1,3,40),rubber,x,4.1,z);t.rotation.x=Math.PI/2;const h=add(new THREE.CylinderGeometry(2.3,2.3,3.1,24),hub,x,4.1,z,false);h.rotation.x=Math.PI/2;}
 for(const side of [1,-1]){const g=new THREE.Group();g.position.set(0,7,side*11.6);van.add(g);const d=new THREE.Mesh(new RoundedBoxGeometry(.8,23,11.4,2,.3),paint);d.position.set(0,11.5,-side*5.7);d.castShadow=true;g.add(d);
   const h=new THREE.Mesh(new THREE.BoxGeometry(.6,2.4,.5),hub);h.position.set(-.5,11.5,-side*10.6);g.add(h);doors.push({g,side});}}
van.position.x=VAN_X;

// ---------- Customer's doorstep (separate set, reached by a cut)
const home=new THREE.Group();home.position.set(-300,0,0);scene.add(home);
{const wallT=tex(512,512,(g,w,h)=>{g.fillStyle='#b9a58f';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=32)for(let x=(y/32%2)*32;x<w;x+=64){g.fillStyle=`hsl(${20+R()*10},${28+R()*10}%,${44+R()*10}%)`;g.fillRect(x+2,y+2,60,28);}},{repeat:[3,3]});
 const wall=new THREE.Mesh(new THREE.PlaneGeometry(120,70),new THREE.MeshStandardMaterial({map:wallT,roughness:.9}));wall.position.set(0,35,-20);wall.receiveShadow=true;home.add(wall);
 const frame=new THREE.Mesh(new THREE.BoxGeometry(23,41,1.4),new THREE.MeshStandardMaterial({color:'#efeae2',roughness:.6}));frame.position.set(0,22.5,-19.6);home.add(frame);
 const door=new THREE.Mesh(new RoundedBoxGeometry(19,38,1.2,2,.3),new THREE.MeshPhysicalMaterial({color:'#1f4d47',roughness:.35,clearcoat:.8}));door.position.set(0,22,-18.8);door.castShadow=true;home.add(door);
 const knob=new THREE.Mesh(new THREE.SphereGeometry(.8,24,16),new THREE.MeshPhysicalMaterial({color:'#c9a45c',metalness:1,roughness:.2}));knob.position.set(6.5,21,-18);home.add(knob);
 const num=new THREE.Mesh(new THREE.PlaneGeometry(4,2.4),new THREE.MeshStandardMaterial({map:tex(200,120,(g,w,h)=>{g.fillStyle='#c9a45c';g.fillRect(0,0,w,h);g.fillStyle='#1b1b1b';g.font='700 86px Georgia, serif';g.textAlign='center';g.fillText('24',w/2,95);}),metalness:.6,roughness:.3}));num.position.set(0,34,-18.1);home.add(num);
 const step=new THREE.Mesh(new RoundedBoxGeometry(34,2.4,14,2,.3),new THREE.MeshStandardMaterial({color:'#8d8a86',roughness:.85}));step.position.set(0,1.2,-12);step.receiveShadow=step.castShadow=true;home.add(step);
 const mat=new THREE.Mesh(new RoundedBoxGeometry(20,.5,11,2,.2),new THREE.MeshStandardMaterial({map:tex(256,128,(g,w,h)=>{g.fillStyle='#8a6a3f';g.fillRect(0,0,w,h);for(let i=0;i<3000;i++){g.fillStyle=R()<.5?'rgba(60,40,20,.25)':'rgba(190,150,100,.2)';g.fillRect(R()*w,R()*h,1,3);}}),roughness:.95}));mat.position.set(0,2.65,-11);mat.receiveShadow=true;home.add(mat);
 const plant=new THREE.Mesh(new THREE.CylinderGeometry(3,2.4,6,24),new THREE.MeshStandardMaterial({color:'#d9d4cb',roughness:.7}));plant.position.set(-15,5.4,-13);plant.castShadow=true;home.add(plant);
 const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(4.2,1),new THREE.MeshStandardMaterial({color:'#2f5d3a',roughness:.8,flatShading:true}));leaves.position.set(-15,11,-13);leaves.castShadow=true;home.add(leaves);
 const sun=new THREE.SpotLight('#fff1dd',9000,0,.5,.8,2);sun.position.set(30,70,40);sun.target=step;sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0004;home.add(sun);}


// ---------- Manufacturing bench: soy wax, cotton wicks, amber jars that fill into Cedar candles
const BENCH={x:-62,z:16};
const bench=new THREE.Group();bench.position.set(BENCH.x,0,BENCH.z);scene.add(bench);
const glassMat=candle.children[0].material,waxMat=candle.children[1].material,wickMat=candle.children[2].material;
const benchTop=new THREE.Mesh(new RoundedBoxGeometry(40,4,18,3,.6),new THREE.MeshPhysicalMaterial({color:'#1d1b22',roughness:.4,clearcoat:.3}));benchTop.position.y=2;benchTop.castShadow=benchTop.receiveShadow=true;bench.add(benchTop);
const waxBlock=new THREE.Mesh(new RoundedBoxGeometry(7,4.6,5.5,3,.5),new THREE.MeshPhysicalMaterial({color:'#efe4cf',roughness:.55,sheen:.5}));waxBlock.geometry.translate(0,2.3,0);waxBlock.position.set(-14,4,-1);waxBlock.castShadow=true;bench.add(waxBlock);
const spool=new THREE.Group();spool.position.set(-14,4,5.5);bench.add(spool);
{const c=new THREE.Mesh(new THREE.CylinderGeometry(1.8,1.8,2.4,32),new THREE.MeshStandardMaterial({color:'#f2efe8',roughness:.9}));c.position.y=1.2;c.castShadow=true;spool.add(c);
 for(const y of [0,2.4]){const r=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,.25,32),new THREE.MeshStandardMaterial({color:'#8a6a4a',roughness:.6}));r.position.y=y;spool.add(r);}}
const jars=[];
for(let i=0;i<3;i++){const g=new THREE.Group();g.position.set(-3+i*8.6,4,0);bench.add(g);
  const gl=new THREE.Mesh(candle.children[0].geometry,glassMat);gl.castShadow=true;g.add(gl);
  const wx=new THREE.Mesh(new THREE.CylinderGeometry(3.66,3.66,6.1,64),waxMat);wx.geometry.translate(0,3.05,0);wx.position.y=.95;g.add(wx);
  const wk=new THREE.Mesh(candle.children[2].geometry,wickMat);wk.position.y=7.5;wk.rotation.z=.12;g.add(wk);
  jars.push({g,wx,wk});}

// ---------- Shelf A1 with Cedar candles (stock)
const SH={x:34,z:-22};
const shelf=new THREE.Group();shelf.position.set(SH.x,0,SH.z);scene.add(shelf);
const shelfCandles=[];
{const wood=new THREE.MeshStandardMaterial({map:sideWood,roughness:.6,color:'#c8a27a'});
 for(const y of [0,11,23])  {const b=new THREE.Mesh(new RoundedBoxGeometry(46,1.2,12,2,.3),wood);b.position.y=y+.6;b.castShadow=b.receiveShadow=true;shelf.add(b);}
 for(const x of [-23,23]){const p=new THREE.Mesh(new THREE.BoxGeometry(1.2,24.6,12),wood);p.position.set(x,12.3,0);p.castShadow=true;shelf.add(p);}
 const back=new THREE.Mesh(new THREE.PlaneGeometry(46,24),new THREE.MeshStandardMaterial({color:'#1a181f',roughness:.9}));back.position.set(0,12,-5.9);shelf.add(back);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(6,3),new THREE.MeshBasicMaterial({map:tex(240,120,(g,w,h)=>{g.fillStyle='#f4d046';g.fillRect(0,0,w,h);g.fillStyle='#141414';g.font='800 80px Helvetica, Arial, sans-serif';g.textAlign='center';g.fillText('A1',w/2,92);})}));sign.position.set(-17,13.8,6.05);shelf.add(sign);
 const bcT=tex(300,120,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#111';const r=rng(5);let x=16;while(x<w-16){const bw=1+Math.floor(r()*4);if(r()>.4)g.fillRect(x,14,bw,60);x+=bw+2;}g.font='700 26px Helvetica, Arial, sans-serif';g.fillText('CED-001',16,108);});
 for(let i=0;i<5;i++){const c=new THREE.Group();c.position.set(-16+i*8.4,1.2,1);
   const gl=new THREE.Mesh(candle.children[0].geometry,glassMat);gl.castShadow=true;c.add(gl);
   const wx=candle.children[1].clone();c.add(wx);const lb=candle.children[3].clone();c.add(lb);const tp=lid.children[0].clone();c.add(tp);
   const tag=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.4),new THREE.MeshBasicMaterial({map:bcT}));tag.position.set(0,-.6,5.2);tag.userData.tag=true;c.add(tag);
   shelf.add(c);shelfCandles.push(c);}}
// The candle sold at the till (a second Cedar candle)
const candleB=new THREE.Group();scene.add(candleB);
{for(const k of [0,1,2,3])candleB.add(candle.children[k].clone());candleB.add(lid.children[0].clone());}
// 80 mm till receipt
const receiptTex=tex(400,700,(g,w,h)=>{g.fillStyle='#fdfdfb';g.fillRect(0,0,w,h);g.fillStyle='#161616';g.textAlign='center';g.font='700 40px Courier New, monospace';g.fillText('Willow & Pine',w/2,80);
  g.textAlign='left';g.font='26px Courier New, monospace';g.fillText('SALE-01024',30,150);g.fillText('12/11/2026, 10:20',30,190);g.fillText('Cedar candle',30,270);g.fillText('1 × £12.00',30,305);g.textAlign='right';g.fillText('£12.00',w-30,305);g.textAlign='left';
  g.fillRect(30,335,w-60,2);g.font='700 30px Courier New, monospace';g.fillText('Total £12.00',30,390);g.font='26px Courier New, monospace';g.fillText('Cashier: 104',30,450);g.fillText('Till 1',30,490);g.fillText('Thank you for',30,570);g.fillText('shopping with us.',30,605);});
const receipt=new THREE.Mesh(new THREE.PlaneGeometry(8,14),new THREE.MeshStandardMaterial({map:receiptTex,roughness:.7,side:THREE.DoubleSide}));receipt.castShadow=true;scene.add(receipt);

const doorSpot=new THREE.Vector3(-300,2.9,-11);
// second key light over the conveyor and van
const vk=new THREE.SpotLight('#ffe6cc',16000,0,.55,.8,2);vk.position.set(80,80,60);vk.target.position.set(100,10,0);vk.castShadow=true;vk.shadow.mapSize.set(1024,1024);vk.shadow.bias=-.0004;vk.shadow.camera.near=30;vk.shadow.camera.far=220;scene.add(vk,vk.target);
// soft contact shadows (ambient occlusion feel) under the plinth and the parcel
const blobTex=tex(256,256,(g,w,h)=>{const r=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);r.addColorStop(0,'rgba(0,0,0,.62)');r.addColorStop(.55,'rgba(0,0,0,.22)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,w,h);},{srgb:false});
const blob=(sz,y)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(sz,sz),new THREE.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false,toneMapped:false}));m.rotation.x=-Math.PI/2;m.position.y=y;m.renderOrder=-1;return m;};
pack.add(blob(30,.04));scene.add(Object.assign(blob(26,.03),{name:'plinthBlob'}));
return {keyLight:key,vkLight:vk,doorSpot,scene,BG,plinth,PLINTH_TOP,pack,candle,lid,box,flaps,OPEN,W,D,H,T,BOX_FLOOR,peanuts,placePeanuts,tapeTop,tabF,tabB,roll,TOP,TAB,
 laptop,LAP,hinge,screenMat,printer,PR,shipLabel,LABEL_LOCAL,conv,CONV,beltTex,van,VAN_X,doors,home,
 bench,BENCH,waxBlock,spool,jars,shelf,SH,shelfCandles,candleB,receipt};
}

// ---------- Blender assets: pack.glb (candle, box, flaps, tape roll, peanut) + peanuts.bin (Bullet rigid-body pour, baked in Blender)
function parseSim(buf){const dv=new DataView(buf),n=dv.getInt32(0,true),f=dv.getInt32(4,true),data=new Int16Array(buf,12,n*f*7);
  // trim the settled tail so scrolling is spent on visible motion
  let end=f-1;const last=(f-1)*n*7;for(let k=f-1;k>0;k--){let mx=0;const o=k*n*7;for(let i=0;i<n;i++){const a=o+i*7,b=last+i*7;mx=Math.max(mx,Math.abs(data[a]-data[b]),Math.abs(data[a+1]-data[b+1]),Math.abs(data[a+2]-data[b+2]));}if(mx*40/32767>.06){end=Math.min(f-1,k+1);break;}}
  return {n,f,end,data};}
const fetchBin=async u=>{try{const r=await fetch(u);if(r.ok&&!/text\/html/.test(r.headers.get('content-type')||''))return await r.arrayBuffer();}catch(e){}
  const t=await (await fetch(u+'.b64.txt')).text();const b=atob(t.trim());const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;};
export async function loadBundle(base,name){const gltf=await new GLTFLoader().parseAsync(await fetchBin(base+'opening/'+name+'.glb'),base+'opening/');
  if(name!=='pack')return {gltf};const buf=await fetchBin(base+'opening/peanuts.bin').catch(()=>null);return {gltf,sim:buf?parseSim(buf):null};}
const shadowAll=r=>r.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
const adopt=(target,src)=>{target.clear();[...src.children].forEach(c=>target.add(c));};
export function upgradeStage(P,{gltf}){const r=gltf.scene;shadowAll(r);
  adopt(P.laptop,r.getObjectByName('Laptop'));P.hinge=P.laptop.getObjectByName('Hinge');
  const sc=P.laptop.getObjectByName('Screen');if(sc){const g=sc.geometry,uv=g.attributes.uv;
    if(uv){for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));uv.needsUpdate=true;}
    else{// the optimiser prunes UVs from an untextured material: rebuild them from the screen plane
      g.computeBoundingBox();const b=g.boundingBox,ps=g.attributes.position,a=new Float32Array(ps.count*2);
      for(let i=0;i<ps.count;i++){a[i*2]=(ps.getX(i)-b.min.x)/(b.max.x-b.min.x);a[i*2+1]=(ps.getY(i)-b.min.y)/(b.max.y-b.min.y);}g.setAttribute('uv',new THREE.BufferAttribute(a,2));}sc.material=P.screenMat;sc.castShadow=false;}
  adopt(P.printer,r.getObjectByName('Printer'));}
export function upgradeShip(P,{gltf}){const r=gltf.scene;shadowAll(r);
  adopt(P.conv,r.getObjectByName('Conveyor'));const belt=P.conv.getObjectByName('Belt');
  if(belt&&belt.material.map){const m=belt.material;for(const t of [m.map,m.normalMap])if(t){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.needsUpdate=true;}if(m.normalMap)m.normalMap.offset=m.map.offset;P.beltTex=m.map;}
  adopt(P.van,r.getObjectByName('Van'));P.doors=[{g:P.van.getObjectByName('DoorA'),side:1},{g:P.van.getObjectByName('DoorB'),side:-1}];
  const lights=P.home.children.filter(c=>c.isLight);adopt(P.home,r.getObjectByName('Home'));
  lights.forEach(l=>{P.home.add(l);const tg=new THREE.Object3D();tg.position.set(0,2,-12);P.home.add(tg);l.target=tg;l.intensity*=6;l.shadow.camera.far=400;});
  // the doorstep set is modelled at 1/5 scale; real-world scale so the 15 cm parcel reads correctly next to a 1.9 m door
  P.home.scale.setScalar(5);P.doorSpot.set(-300,14.5,-55);}
export async function loadRealProps(base){
  // binary first; hosts that refuse .glb/.bin (the preview) get base64 text copies
  const bin=async u=>{try{const r=await fetch(u);if(r.ok&&!/text\/html/.test(r.headers.get('content-type')||''))return await r.arrayBuffer();}catch(e){}
    const t=await (await fetch(u+'.b64.txt')).text();const b=atob(t.trim());const a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;};
  const [glb,buf]=await Promise.all([bin(base+'opening/pack.glb'),bin(base+'opening/peanuts.bin').catch(()=>null)]);
  const gltf=await new GLTFLoader().parseAsync(glb,base+'opening/');
  return {gltf,sim:buf?parseSim(buf):null};}
export function upgradeWorld(P,{gltf,sim}){
  const root=gltf.scene,get=n=>root.getObjectByName(n);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  const glass=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.025,transmission:1,thickness:.75,ior:1.52,attenuationColor:new THREE.Color('#ebb984'),attenuationDistance:9,clearcoat:1,clearcoatRoughness:.02,specularIntensity:1,envMapIntensity:1.4});
  const wax=new THREE.MeshPhysicalMaterial({color:'#efe3cc',roughness:.48,sheen:.7,sheenColor:new THREE.Color('#fff1da'),sheenRoughness:.55,emissive:new THREE.Color('#3d220c'),emissiveIntensity:.16});
  get('Glass').material=glass;get('Wax').material=wax;get('Glass').castShadow=false;
  const lab=get('Label');lab.traverse(o=>{if(o.material){o.material.side=THREE.DoubleSide;o.material.roughness=.8;}});
  // candle parts → the animated candle group (names kept so scenes keep working)
  const C=get('Candle');P.candle.clear();[...C.children].forEach(ch=>P.candle.add(ch));P.lid=P.candle.getObjectByName('Lid');
  const part=n=>P.candle.getObjectByName(n);
  const candleClone=(lid=true)=>{const g=new THREE.Group();for(const n of ['Glass','Wax','Wick','WickTip','Label'])g.add(part(n).clone());if(lid){const l=part('Lid').clone();l.position.set(0,0,0);g.add(l);}return g;};
  P.shelfCandles.forEach(c=>{c.children.filter(ch=>!ch.userData.tag).forEach(ch=>c.remove(ch));c.add(candleClone());});
  P.candleB.clear();P.candleB.add(candleClone());
  P.jars.forEach(j=>{j.g.clear();j.g.add(part('Glass').clone());j.wx=part('Wax').clone();j.g.add(j.wx);j.wk=new THREE.Group();j.wk.add(part('Wick').clone(),part('WickTip').clone());j.g.add(j.wk);});
  // box body, print and flaps (flap origins sit on their hinges, closed = rotation 0)
  const B=get('Box');P.box.clear();[...B.children].forEach(ch=>P.box.add(ch));
  ['PrintFront','PrintRight'].forEach(n=>P.box.getObjectByName(n)?.traverse(o=>{if(o.material){o.material.transparent=true;o.material.depthWrite=false;o.material.polygonOffset=true;o.material.polygonOffsetFactor=-2;}o.castShadow=false;}));
  const f=n=>P.box.getObjectByName(n);P.flaps=[{g:f('FlapFront'),axis:'x',sign:1},{g:f('FlapBack'),axis:'x',sign:-1},{g:f('FlapRight'),axis:'z',sign:-1},{g:f('FlapLeft'),axis:'z',sign:1}];
  // tape roll + tape strips share the Blender tape material
  const R=get('TapeRoll');P.roll.clear();R.position.set(0,0,0);R.scale.setScalar(.8);P.roll.add(R);
  R.traverse(o=>{if(o.material&&o.material.name==='Tape'){const m0=o.material;o.material=new THREE.MeshPhysicalMaterial({map:m0.map,color:'#c8925a',roughness:.2,clearcoat:1,clearcoatRoughness:.08,sheen:.3,sheenColor:new THREE.Color('#ffd9a8')});o.material.name='Tape';}});
  let tm=null;R.traverse(o=>{if(o.material&&o.material.name==='Tape')tm=o.material;});
  if(tm){const st=tm.clone();st.map=tm.map.clone();st.map.needsUpdate=true;st.map.center.set(.5,.5);st.map.rotation=Math.PI/2;st.transparent=true;st.opacity=.86;st.roughness=.2;st.color=new THREE.Color('#d6a36a');st.side=THREE.DoubleSide;for(const m of [P.tapeTop,P.tabF,P.tabB])m.material=st;}
  // packing peanuts: Blender mesh, played back from the baked Bullet simulation
  const pn=get('Peanut');if(pn&&sim){const inst=new THREE.InstancedMesh(pn.geometry,pn.material,sim.n);inst.castShadow=inst.receiveShadow=true;inst.frustumCulled=false;inst.visible=false;
    P.pack.remove(P.peanuts);P.pack.add(inst);P.peanuts=inst;
    pn.material=new THREE.MeshPhysicalMaterial({color:'#f6f2ea',roughness:.72,sheen:.5,sheenColor:new THREE.Color('#ffffff'),sheenRoughness:.8,normalMap:pn.material.normalMap,normalScale:new THREE.Vector2(.5,.5)});inst.material=pn.material;
    const rr=rng(21),sc=[],col=new THREE.Color();for(let i=0;i<sim.n;i++){sc.push(.9+rr()*.18);col.setHSL(.1+rr()*.02,.25,.9+rr()*.06);inst.setColorAt(i,col);}inst.instanceColor.needsUpdate=true;
    const p0=new THREE.Vector3(),p1=new THREE.Vector3(),q0=new THREE.Quaternion(),q1=new THREE.Quaternion(),m=new THREE.Matrix4(),one=new THREE.Vector3(1,1,1),K=40/32767,D=sim.data,N=sim.n;
    P.placePeanuts=s=>{const fr=clamp(s)*sim.end,i0=Math.floor(fr),i1=Math.min(sim.end,i0+1),k=fr-i0;
      for(let i=0;i<N;i++){const a=(i0*N+i)*7,b=(i1*N+i)*7;p0.set(D[a],D[a+1],D[a+2]);p1.set(D[b],D[b+1],D[b+2]);p0.lerp(p1,k).multiplyScalar(K);
        q0.set(D[a+3],D[a+4],D[a+5],D[a+6]).normalize();q1.set(D[b+3],D[b+4],D[b+5],D[b+6]).normalize();q0.slerp(q1,k);one.setScalar(sc[i]);m.compose(p0,q0,one);inst.setMatrixAt(i,m);}
      inst.instanceMatrix.needsUpdate=true;};}
  P.real=true;
}
