const T=function(l,d,cta){return{t:'T',l:l,d:d,cta:cta}},S=function(i,b,s,d,r,side,c,tag){return{t:'S',i:i,b:b,s:s,d:d,r:r,side:side,c:c,tag:tag}};
const OV=[19,21,79,16],OVN=[68,39,29,36],DCE=[41,41,52,46],LBA=[10,12,79,22],LBP=[10,42,26,58],TLS=[61,12,38,55],RCT=[16,16,68,80],ROC=[41,31,52,68],EXC=[42,18,50,55],MFC=[19,35,79,65],RCP=[19,36,39,38],PBC=[19,47,39,29];
const MP=function(h,s){return s?[20,18,78,h+18]:[20,34,57,h+2]};
const NAVD=[1.2,41.9,15,4.7,'Dispatch Centre'],NAVP=[1.2,52,15,4.7,'Production'],FN=[0,28,40,32];
export const clips={
hook:['See InventoryOS in action',[
 T(['q:Where did I put that jacket?','q:Which label goes on which parcel?','q:Did I just sell my last one?'],4400),
 T(['a:One workspace.','Everything in its place.'],2400),
 S('ov','Your business, in one place','Products, units, locations and sales at a glance.',3200,OV),
 S('ov','Open Dispatch Centre','',2900,FN,'r',NAVD,'Click'),
 S('dc','Your label queue','Import files or forward label emails.',3400,DCE,'r',null,'Result'),
 S('lb','Add the cropped label','',3000,[30,20,62,16],'l',[37,24,51,8,'Add to queue'],'Click'),
 S('sl','It joins your packing queue','',2800,MP(39),'r',null,'Result'),
 S('tl','Record a card sale','Take the payment on your card reader.',3000,[61,33,39,25],'l',[84.5,44.5,15.5,8,'Card'],'Click'),
 S('rc','Receipt, done','Print or save it.',2600,RCT,'r',null,'Result'),
 T(['Start free.','a:100 items. £0.'],3400,1)]],
tour:['The full InventoryOS tour',[
 T(['How InventoryOS works','a:A guided tour of the workspace.'],3200),
 S('ov','The big picture','Active products, units in stock, locations and today’s sales on one screen.',5200,OV),
 S('ov','Your next steps','Quick links to add stock, pack labels, review reorder rules and record expenses.',5000,OVN,'l'),
 S('gp','Learn as you go','A guided practice checklist teaches you to add, move and sell stock.',5000,MP(41),'r'),
 S('ov','Ready to add stock?','',3000,[55,4,43,30],'l',[82.5,10.5,8,4.8,'Add stock'],'Click'),
 S('as','Receive items into the right location','Fill in the product, quantity and storage location.',5000,MP(46),'r',null,'Result'),
 S('se','Find it fast','Search by name, barcode or SKU.',5000,MP(41,1),'r'),
 S('mv','Move stock','Transfer units between storage locations.',4600,MP(47),'r'),
 S('rm','Remove stock','Record a sale made elsewhere and enter the sale amount.',4600,MP(46),'r'),
 S('bx','Storage boxes','Organise stock into labelled containers.',4600,MP(34),'r'),
 S('bc','Barcode labels','Print scannable labels for every item.',4600,MP(39),'r'),
 S('ov','Time to dispatch','',3000,FN,'r',NAVD,'Click'),
 S('dc','Dispatch Centre','Import label files, or forward label emails to your workspace address.',6000,DCE,'r',null,'Result'),
 S('lb','Auto-crop to 4 × 6','Turn on cropping for supported label layouts.',5000,LBA,'l'),
 S('lb','Check the preview','Make sure the crop looks right before you print.',4600,LBP,'r'),
 S('lb','Add the cropped label','',3000,[30,20,62,16],'l',[37,24,51,8,'Add to queue'],'Click'),
 S('sl','It joins your packing queue','Review pending print batches before you pack.',4600,MP(39),'r',null,'Result'),
 S('tl','The till','Scan or search a product, add it to the sale.',4600,TLS),
 S('tl','Record a card sale','Take the payment on your card reader.',3000,[61,33,39,25],'l',[84.5,44.5,15.5,8,'Card'],'Click'),
 S('rc','A receipt, instantly','Print or save a clean receipt as soon as the sale is complete.',4600,RCT,'r',null,'Result'),
 S('rf','Refunds','Find a completed sale and refund it.',4400,MP(51),'r'),
 S('sa','Sales tracker','Record sale prices and see how you’re doing.',5000,MP(40,1),'r'),
 S('ex','Receipts and expenses','Drop in invoices, review them, and keep costs next to your stock.',5400,EXC,'l'),
 S('rr','Reorder rules','Set a minimum and a reorder-to level for each product.',4600,MP(34),'r'),
 S('ro','Purchasing','Orders waiting on delivery, grouped in one place.',4800,ROC,'l'),
 S('ro','Stock arrived?','',3000,[41,30,52,20],'l',[58,40,13,4.4,'Mark selected received'],'Click'),
 S('mh','Receiving updates stock','See the newly received stock in your movement history.',4800,MP(34),'r',null,'Result'),
 S('sk','Stale stock','Spot items that haven’t moved in a while.',4600,MP(41,1),'r'),
 S('tm','Your team','Give people access with roles that fit.',4600,MP(31),'r'),
 S('ov','Making your own products?','',3000,FN,'r',NAVP,'Click'),
 S('mf','Materials and packaging','Track what you have and what’s ready to use.',5000,MFC,'r',null,'Result'),
 S('rcp','Recipes','Set what goes into each finished item once.',4600,RCP,'r'),
 S('pb','Production batches','Complete a batch and the finished stock is added for you.',5000,PBC,'r'),
 S('rd','Running a shop?','See tills, orders and store performance in one view.',4800,MP(41,1),'r'),
 S('mp','Set up a Mi Marché storefront','Choose stock to show on your shop.',4800,MP(41,1),'r'),
 T(['Ready to try it?','a:Start free. 100 items. £0.'],4200,1)]]
};

export const tourChapters = [
  { id: 'stock', label: 'Add, find and move stock', scene: 4 },
  { id: 'dispatch', label: 'Import, crop and queue labels', scene: 11 },
  { id: 'sales', label: 'Tills, sales and refunds', scene: 17 },
  { id: 'receipts', label: 'Receipts and expenses', scene: 22 },
  { id: 'reordering', label: 'Reorder and receive stock', scene: 23 },
  { id: 'production', label: 'Materials, recipes and batches', scene: 29 },
  { id: 'storefront', label: 'Shops and Mi Marché', scene: 33 },
];
