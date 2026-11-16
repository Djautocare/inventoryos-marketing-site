import './scroll-memory.js';
import React,{useEffect} from 'react';
import {hydrateRoot} from 'react-dom/client';
import App from './App.jsx';
import './marketing.css';
import './workflow.css';
import 'lenis/dist/lenis.css';
import './redesign/redesign.css';
// Tells late scripts (language picker) that React owns the markup now, so they never race hydration.
function Hydrated({children}){useEffect(()=>{window.__iosHydrated=true;window.dispatchEvent(new Event('inventoryos:hydrated'));},[]);return children;}
const root=document.getElementById('root'),mode=root.dataset.mode||'resellers';
// Preserve the previous site's shared audience URLs without hiding the other products.
const legacy=new URL(location.href).searchParams.get('audience'),paths={resellers:'index.html',manufacturing:'manufacturing.html',retail:'retail.html'};
if(legacy&&paths[legacy]&&legacy!==mode){const url=new URL(paths[legacy],location.href);url.hash=location.hash;location.replace(url);}else{hydrateRoot(root,<Hydrated><App initialMode={mode}/></Hydrated>);const go=()=>import('./redesign/redesign.js');('requestIdleCallback' in window)?requestIdleCallback(go,{timeout:2000}):setTimeout(go,800);}
