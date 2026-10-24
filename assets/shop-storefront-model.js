export function selectProducts(products,{search='',category='',sort='featured'}={}){
 const matches={printers:/printer/i,bags:/mailing.*bag|bags/i,labels:/label/i,bubble:/bubble/i,boxes:/box/i,tape:/tape|dispenser/i,accessories:/accessor|retail|POS|cable|holder|stand/i};
 let list=products.filter(p=>(p.name+' '+p.category+' '+p.description).toLowerCase().includes(search.trim().toLowerCase())&&(!category||matches[category]?.test(p.name+' '+p.category)));
 const price=p=>p.variants.length?Math.min(...p.variants.map(v=>v.price_pence)):Infinity;if(sort==='price-asc')list.sort((a,b)=>price(a)-price(b)||a.name.localeCompare(b.name));if(sort==='price-desc')list.sort((a,b)=>price(b)-price(a)||a.name.localeCompare(b.name));if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));return list;
}
export function minimumQuantity(variant){return Number.isSafeInteger(variant?.min_order_qty)&&variant.min_order_qty>0?variant.min_order_qty:1;}
export function orderLimit(v){if(v?.availability_mode==='supplier'||v?.availability_mode==='offer')return Number.isSafeInteger(v.order_limit)&&v.availability_status==='available'?Math.max(0,Math.min(200,v.order_limit)):0;return Math.max(0,Math.min(200,v?.stock??0));}
export function availabilityText(v){if(v?.availability_mode==='supplier'||v?.availability_mode==='offer')return v.availability_status==='available'?'Available to order · Sourced after your order':v.availability_status==='unavailable'?'Temporarily unavailable from supplier':'Supplier availability is being checked';return orderLimit(v)>0?'Available to order':'Temporarily unavailable';}
export function quantityProblem(variant,qty){const min=minimumQuantity(variant);if(!Number.isInteger(qty)||qty<min)return 'Minimum order quantity: '+min+'.';if(variant?.availability_mode==='supplier'&&variant.availability_status!=='available')return availabilityText(variant)+'.';if(qty>orderLimit(variant))return 'That quantity exceeds current availability or the online order limit.';return '';}

// Cloudflare Pages also serves HTML files at extensionless addresses.
export function productIdForPath(pathname,search=''){
 const parts=pathname.split('/').filter(Boolean);
 if(parts.at(-1)==='index.html')parts.pop();
 const leaf=parts.at(-1)?.replace(/\.html$/,'');
 if(parts.length===1&&leaf==='shop-printer')return 'jadens-668bt';
 if(parts.length===1&&leaf==='shop-product')return validProductId(new URLSearchParams(search).get('product'));
 if(parts.length===3&&parts[0]==='shop'&&parts[1]==='product'){
  try{return validProductId(decodeURIComponent(parts[2]));}catch{return null;}
 }
 return null;
}

export function validProductId(value){return typeof value==='string'&&/^[a-z0-9][a-z0-9_-]{0,100}$/.test(value)?value:null;}
export function productPageURL(id){const value=validProductId(id);if(!value)throw Error('Invalid product ID');return '/shop/product/'+encodeURIComponent(value);}

// Keep each real variant intact; selectors resolve to an existing size/colour pair.
export function variantMatrix(variants){
 const colour=/^(?:(?:baby|hot|light|dark|pale|bright|royal|pastel|rose)\s+)?(black|white|pink|blue|green|purple|red|yellow|orange|grey|gray|brown|clear|silver|gold|navy|teal|multicolou?red)$/i;
 const entries=variants.map(v=>{const parts=String(v.name||'').split(/\s*·\s*/);if(parts.length<2||!colour.test(parts[0]))return null;return {id:v.id,colour:parts[0],size:parts.slice(1).join(' · ')};});
 if(entries.some(x=>!x)||new Set(entries.map(x=>x.colour+'\0'+x.size)).size!==entries.length)return null;
 const colours=[...new Set(entries.map(x=>x.colour))],sizes=[...new Set(entries.map(x=>x.size))];return colours.length>1&&sizes.length>1?{entries,colours,sizes}:null;
}
export function resolveVariant(matrix,size,colour){return matrix.entries.find(x=>x.size===size&&x.colour===colour)||null;}
