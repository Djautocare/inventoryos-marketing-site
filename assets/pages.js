// Document navigation needs no React runtime or animation bundle.
const toggle=document.getElementById('menu-toggle'),menu=document.getElementById('mobile-menu');
function closeMenu(){if(!toggle||!menu)return;menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu');}
if(toggle&&menu){toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');});menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();toggle.focus();}});window.addEventListener('resize',()=>{if(innerWidth>600)closeMenu();},{passive:true});}
