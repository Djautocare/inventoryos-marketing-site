export function selectProducts(products,{search='',category='',sort='featured'}={}){
 const matches={printers:/printer/i,bags:/mailing.*bag|bags/i,labels:/label/i,bubble:/bubble/i,boxes:/box/i,tape:/tape|dispenser/i,accessories:/accessor|retail|POS|cable|holder|stand/i};
 let list=products.filter(p=>(p.name+' '+p.category+' '+p.description).toLowerCase().includes(search.trim().toLowerCase())&&(!category||matches[category]?.test(p.name+' '+p.category)));
 const price=p=>Math.min(...p.variants.map(v=>v.price_pence));if(sort==='price-asc')list.sort((a,b)=>price(a)-price(b)||a.name.localeCompare(b.name));if(sort==='price-desc')list.sort((a,b)=>price(b)-price(a)||a.name.localeCompare(b.name));if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));return list;
}
