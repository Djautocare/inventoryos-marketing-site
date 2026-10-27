// Public merchant facts only. Do not invent GTINs, reviews, stock or delivery rates.
export const merchantReturnPolicy={
 '@type':'MerchantReturnPolicy',
 '@id':'https://inventoryos.co.uk/refunds#shop-return-policy',
 merchantReturnLink:'https://inventoryos.co.uk/refunds#shop-goods'
};
// The policy has a 14-day cancellation notice period followed by another 14 days
// to send goods back. Google's organization-level URL option preserves that
// distinction instead of claiming a different single return deadline.
export function productBrand(p){
 const specified=p.specifications?.find(([key])=>String(key).trim().toLowerCase()==='brand')?.[1];
 if(typeof specified==='string'&&specified.trim())return {'@type':'Brand',name:specified.trim()};
 if(p.id==='jadens-668bt')return {'@type':'Brand',name:'JADENS'};
 if(p.id==='ps-jiffy-mono-bubbles-small-bubble-wrap-10mm')return {'@type':'Brand',name:'Jiffy'};
 return undefined;
}
export function shippingDetails(delivery){
 // Mainland-only coverage cannot truthfully be advertised as all of GB.
 // Merchant Center/Search Console region settings can represent such exclusions.
 if(delivery?.coverage!=='UK')return undefined;
 const options=[['Standard Delivery — Royal Mail Tracked 48',delivery.standard_pence],['Express Delivery — Royal Mail Tracked 24',delivery.express_pence]];
 const details=options.filter(([,pence])=>Number.isSafeInteger(pence)&&pence>=0).map(([name,pence])=>({
  '@type':'OfferShippingDetails',name,
  shippingDestination:{'@type':'DefinedRegion',addressCountry:'GB'},
  // A maximum correctly includes £0 delivery for eligible baskets. The exact
  // discounted basket threshold, exclusions and selected service stay in checkout.
  shippingRate:{'@type':'MonetaryAmount',currency:'GBP',maxValue:(pence/100).toFixed(2)}
 }));
 return details.length?details:undefined;
}
export function merchantOrganization(){return {
 '@type':'Organization','@id':'https://inventoryos.co.uk/#organization',name:'InventoryOS',url:'https://inventoryos.co.uk/',
 hasMerchantReturnPolicy:merchantReturnPolicy
};}
