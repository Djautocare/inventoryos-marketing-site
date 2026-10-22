import React from 'react';
import {hydrateRoot} from 'react-dom/client';
import App from './App.jsx';
import './marketing.css';
import 'lenis/dist/lenis.css';
const root=document.getElementById('root'),mode=root.dataset.mode||'resellers';
// Preserve the previous site's shared audience URLs without hiding the other products.
const legacy=new URL(location.href).searchParams.get('audience'),paths={resellers:'index.html',manufacturing:'manufacturing.html',retail:'retail.html'};
if(legacy&&paths[legacy]&&legacy!==mode){const url=new URL(paths[legacy],location.href);url.hash=location.hash;location.replace(url);}else hydrateRoot(root,<App initialMode={mode}/>);
