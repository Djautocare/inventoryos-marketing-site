const field = (key, label, attrs = {}) => ({key, label, ...attrs});
const number = (key, label, value, step = '0.01', max) => field(key, label, {type:'number',value,step,max,min:'0',required:true});
const text = (key, label, attrs = {}) => field(key, label, {max:120,...attrs});
const parties = [
  text('business','Your business'), field('businessAddress','Your business address',{type:'textarea',max:280}),
];
const logo = field('logo','Logo (optional)',{type:'file'});
const documentNote = field('notes','Notes (optional)',{type:'textarea',max:400});
export const tools = [
 {id:'barcode-generator',group:'Labels and codes',title:'Free Barcode Generator',short:'Code 128 barcodes to print or download.',description:'Create a Code 128 barcode with your own value, product name and label size. Download a print-ready SVG for free.',intro:'Enter a value to generate a Code 128 label for your own stock or locations.',
  method:'Print at actual size (100% scale). Scan a sample label before you print a batch. Code 128 labels for internal use do not assign retail GTINs or EANs.',
  fields:[text('value','Barcode value',{required:true,max:80,placeholder:'For example: STOCK-001'}),text('name','Product name (optional)',{max:60}),text('caption','Label text (optional)',{max:60}),field('size','Label size',{type:'select',options:[['50x25','50 × 25 mm'],['76x38','76 × 38 mm'],['100x150','100 × 150 mm']]})]},
 {id:'sku-generator',group:'Labels and codes',title:'Free SKU Generator',description:'Generate custom stock-keeping units in bulk with prefixes, categories and sequential numbering. Download a CSV.',short:'Generate product SKUs in bulk and export them as CSV.',intro:'Create a consistent set of SKU codes for a new batch of products.',
  method:'Each code combines the prefix, category, product name and sequence number. The codes are unique within this generation. Check for conflicts against your inventory before importing.',
  fields:[text('prefix','Prefix (optional)',{max:24}),text('category','Category (optional)',{max:24}),field('names','Product names, one per line',{type:'textarea',max:16000,required:true}),number('sequence','Start number','1','1','999999'),number('padding','Minimum number of digits','4','1','6')]},
 {id:'purchase-order-generator',group:'Business documents',title:'Free Purchase Order Generator',description:'Fill in supplier details, item quantities and unit prices, then download an A4 purchase order PDF.',short:'Create a supplier purchase order and download it as a PDF.',intro:'Create an A4 purchase order to send to a supplier. The file is generated in your browser.',
  method:'Include the agreed item quantities and unit prices. Add a tax rate only when appropriate. Keep a copy of the PO alongside the supplier’s confirmation.',
  fields:[...parties,text('recipient','Supplier'),field('recipientAddress','Supplier address',{type:'textarea',max:280}),text('reference','Purchase order number',{required:true,max:50}),field('date','Order date',{type:'date',required:true}),field('due','Requested delivery date',{type:'date'}),number('vat','Tax rate (%)','0','0.01','100'),logo,documentNote],document:true,purchase:true},
 {id:'packing-slip-generator',group:'Business documents',title:'Free Packing Slip Generator',description:'Build a clear packing slip from order references, product names, SKUs and quantities. Print or download an A4 PDF.',short:'Print a packing slip with the order reference and parcel contents.',intro:'List what is in a parcel so the recipient can check it on arrival.',
  method:'Use quantities for this shipment if the order ships in parts. Packing slips list contents and leave payment and price information on the invoice.',
  fields:[...parties,text('recipient','Customer (optional)'),field('recipientAddress','Delivery address (optional)',{type:'textarea',max:280}),text('reference','Order reference',{required:true,max:50}),field('date','Dispatch date',{type:'date',required:true}),logo,documentNote],document:true},
 {id:'reorder-point-calculator',group:'Stock planning',title:'Free Reorder Point Calculator',description:'Work out when to order more stock from average daily demand, supplier lead time and safety stock.',short:'Set a reorder point using demand, lead time and safety stock.',intro:'Estimate the stock level at which you should place your next purchase order.',
  formula:'Reorder point = average daily demand × lead time in days + safety stock.',
  method:'The result is rounded up to the next whole unit. For example, 12 units a day, 5 days of lead time and 10 units of safety stock give a reorder point of 70 units.',
  fields:[number('demand','Average daily demand (units)','12','0.001'),number('days','Supplier lead time (days)','5','0.001'),number('safety','Safety stock (units)','10','1')]},
 {id:'break-even-calculator',group:'Pricing',title:'Free Break-Even Calculator',description:'Calculate the number of units and revenue required to cover fixed and variable business costs.',short:'Calculate the sales needed to cover your costs.',intro:'Find the minimum number of whole units you need to sell to cover your costs.',
  formula:'Break-even units = fixed costs ÷ contribution per unit, rounded up.',
  method:'Contribution per unit is selling price minus variable cost. With £1,000 in fixed costs, a £20 price and £12 variable cost, break-even is 125 units and £2,500 in revenue.',
  fields:[number('fixed','Fixed costs (£)','1000'),number('selling','Selling price per unit (£)','20'),number('variable','Variable cost per unit (£)','12')]},
 {id:'wholesale-price-calculator',group:'Pricing',title:'Free Wholesale Price Calculator',description:'Choose a target margin or markup to calculate a wholesale price. Add optional VAT and see the resulting margin.',short:'Turn costs and a margin or markup target into a selling price.',intro:'Work out a wholesale price from the cost of one unit and your profit target.',
  formula:'Margin is profit divided by selling price. Markup is profit divided by cost.',
  method:'A £12 cost with a 25% target margin gives a £16 selling price before VAT. A 25% markup gives £15. The recommended price rounds up to the nearest penny.',
  fields:[number('cost','Cost per unit (£)','12'),field('method','Calculate from',{type:'select',options:[['margin','Target profit margin'],['markup','Target markup']]}),number('target','Target percentage (%)','25'),number('vat','VAT rate (%)','0','0.01','100')]},
 {id:'eoq-calculator',group:'Stock planning',title:'Free EOQ Calculator',description:'Calculate Economic Order Quantity to balance annual ordering and holding costs. See estimated orders per year.',short:'Balance ordering and holding costs with an economic order quantity.',intro:'Estimate how much to order each time based on a year of demand and costs.',
  formula:'EOQ = square root of (2 × annual demand × order cost ÷ annual holding cost per unit).',
  method:'The tool compares the annual cost of the whole-unit quantities on either side of the calculated EOQ. Estimates assume steady demand and exclude the cost of the goods.',
  fields:[number('annualDemand','Annual demand (units)','1000','1'),number('ordering','Cost per order (£)','40'),number('holding','Annual holding cost per unit (£)','5')]}
];
