export function selectProducts(products,{search='',category='',sort='featured'}={}){
 const matches={printers:/printer/i,bags:/mailing.*bag|bags/i,labels:/label/i,bubble:/bubble/i,boxes:/box/i,tape:/tape|dispenser/i,accessories:/accessor|retail|POS|cable|holder|stand/i};
 let list=products.filter(p=>(p.name+' '+p.category+' '+p.description).toLowerCase().includes(search.trim().toLowerCase())&&(!category||matches[category]?.test(p.name+' '+p.category)));
 const price=p=>Math.min(...p.variants.map(v=>v.price_pence));if(sort==='price-asc')list.sort((a,b)=>price(a)-price(b)||a.name.localeCompare(b.name));if(sort==='price-desc')list.sort((a,b)=>price(b)-price(a)||a.name.localeCompare(b.name));if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));return list;
}
export function minimumQuantity(variant){return Number.isSafeInteger(variant?.min_order_qty)&&variant.min_order_qty>0?variant.min_order_qty:1;}
export function quantityProblem(variant,qty){const min=minimumQuantity(variant);if(!Number.isInteger(qty)||qty<min)return 'Minimum order quantity: '+min+'.';if(qty>Math.min(200,variant?.stock??0))return 'That quantity exceeds available stock or the online order limit.';return '';}

// Cloudflare Pages also serves HTML files at extensionless addresses.
export function productIdForPath(pathname,search=''){
 const parts=pathname.split('/').filter(Boolean);
 if(parts.at(-1)==='index.html')parts.pop();
 const leaf=parts.at(-1)?.replace(/\.html$/,'');
 if(parts.length===1&&leaf==='shop-printer')return 'jadens-668bt';
 if(parts.length===1&&leaf==='shop-product')return new URLSearchParams(search).get('product')||'jadens-668bt';
 if(parts.length===3&&parts[0]==='shop'&&parts[1]==='product'){
  try{return decodeURIComponent(parts[2]);}catch{return null;}
 }
 return null;
}
