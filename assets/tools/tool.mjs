import {barcodeValue,breakEven,csv,decimal,documentTotals,economicQuantity,reorderPoint,skus,wholesale} from './model.mjs';
import {jpegPagesPdf,renderDocument} from './documents.mjs';

const form=document.querySelector('[data-tool-form]');
const output=document.querySelector('[data-tool-output]');
const status=document.querySelector('[data-tool-status]');
const print=document.querySelector('[data-print]');
const exportButton=document.querySelector('[data-export]');
const pageStyle=document.createElement('style');
document.head.append(pageStyle);
let prepared=null;

const element=(tag,text)=>{
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  return node;
};
const format=(value,opts)=>new Intl.NumberFormat(document.documentElement.lang,opts).format(value);
const number=value=>format(value,{maximumFractionDigits:3});
const pounds=value=>format(value/100,{style:'currency',currency:'GBP'});
const percent=value=>format(value/100,{style:'percent',maximumFractionDigits:2});
const copy=key=>window.InventoryToolsLocale?.[document.documentElement.lang.slice(0,2)]?.[key]||key;
const compact=value=>String(value??'').trim();
const filename=value=>compact(value).toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,55)||'inventoryos';

function metrics(values){
  const list=element('dl');
  list.className='tool-metrics';
  for(const [label,value] of values)list.append(element('dt',label),element('dd',value));
  output.replaceChildren(list);
}

const calculators={
  'reorder-point-calculator': values=>{
    const r=reorderPoint(values);
    return [['Recommended reorder point',number(r.point)],['Demand during lead time',number(r.demandDuringLead)],['Safety stock',number(r.safetyStock)]];
  },
  'break-even-calculator': values=>{
    const r=breakEven(values);
    return [['Break-even units',number(r.quantity)],['Break-even revenue',pounds(r.revenue)],['Contribution per unit',pounds(r.contribution)],['Contribution margin',percent(r.contributionPercent)]];
  },
  'wholesale-price-calculator': values=>{
    const r=wholesale(values);
    return [['Price before VAT',pounds(r.price)],['Price including VAT',pounds(r.includingVat)],['Profit margin',percent(r.margin)],['Markup',percent(r.markup)]];
  },
  'eoq-calculator': values=>{
    const r=economicQuantity(values);
    return [['Economic Order Quantity',number(r.quantity)],['Estimated orders per year',number(r.orders)],['Annual ordering cost',pounds(r.orderCosts*100)],['Annual holding cost',pounds(r.holdingCosts*100)],['Total annual ordering and holding cost',pounds(r.total*100)]];
  }
};
const id=form.dataset.toolForm;
const lineList=form.querySelector('[data-document-lines]');
const documentTool=Boolean(lineList);
const purchase=id==='purchase-order-generator';

function buildSKU(values){
  const rows=skus(values);
  const table=element('table');
  const head=table.createTHead().insertRow();
  head.append(element('th','Product name'),element('th','Suggested SKU'));
  head.querySelectorAll('th').forEach(th=>th.scope='col');
  const body=table.createTBody();
  for(const row of rows){
    const cells=body.insertRow();
    cells.append(element('td',row.name),element('td',row.sku));
    cells.firstChild.translate=false;
  }
  output.replaceChildren(table);
  return {name:'inventoryos-skus.csv',blob:new Blob(['\uFEFF',csv([['product_name','sku'],...rows.map(row=>[row.name,row.sku])])],{type:'text/csv;charset=utf-8'})};
}

const sizes={'50x25':[50,25],'76x38':[76,38],'100x150':[100,150]};
function buildBarcode(values){
  const v=barcodeValue(values.value);
  const [width,height]=sizes[values.size]||sizes['50x25'];
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  const code=document.createElementNS(ns,'svg');
  if(typeof window.JsBarcode!=='function')throw new Error('Barcode tools could not load. Refresh and try again.');
  window.JsBarcode(code,v,{format:'CODE128',width:1,height:40,margin:0,marginLeft:10,marginRight:10,displayValue:false,background:'#fff',lineColor:'#000'});
  const modules=Number.parseFloat(code.getAttribute('width'));
  const unit=Math.min(0.55,(width-4)/modules);
  if(unit<0.25)throw new Error('Choose a larger label or use a shorter barcode value.');
  const codeWidth=unit*modules;
  const codeHeight=Math.min(height-7-(values.name?5:0)-(values.caption?5:0),36);
  svg.setAttribute('width',width+'mm');
  svg.setAttribute('height',height+'mm');
  svg.setAttribute('viewBox','0 0 '+width+' '+height);
  svg.setAttribute('aria-label','Code 128 barcode');
  const paper=document.createElementNS(ns,'rect');
  paper.setAttribute('width','100%');
  paper.setAttribute('height','100%');
  paper.setAttribute('fill','#fff');
  svg.append(paper);
  const y=(height-codeHeight-(values.name?5:0)-(values.caption?10:5))/2;
  code.setAttribute('x',(width-codeWidth)/2);
  code.setAttribute('y',y+(values.name?4:0));
  code.setAttribute('width',codeWidth);
  code.setAttribute('height',codeHeight);
  code.setAttribute('viewBox','0 0 '+modules+' 40');
  code.setAttribute('preserveAspectRatio','none');
  svg.append(code);
  const label=(value,position,size)=>{
    if(!value)return;
    const text=document.createElementNS(ns,'text');
    text.setAttribute('x',width/2);
    text.setAttribute('y',position);
    text.setAttribute('font-size',size);
    text.setAttribute('font-family','sans-serif');
    text.setAttribute('text-anchor','middle');
    text.setAttribute('fill','#000');
    if(value.length*size*0.6>width-4){
      text.setAttribute('textLength',width-4);
      text.setAttribute('lengthAdjust','spacingAndGlyphs');
    }
    text.textContent=value;
    svg.append(text);
  };
  label(compact(values.name),y+2.6,3);
  label(v,y+codeHeight+(values.name?7.8:3.8),3);
  label(compact(values.caption),y+codeHeight+(values.name?12:8),2.8);
  output.replaceChildren(svg);
  pageStyle.textContent='@page{size:'+width+'mm '+height+'mm;margin:0}';
  return {name:filename(v)+'.svg',blob:new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'})};
}

let nextRow=0;
function addLine(focus=false){
  if(lineList.children.length>=80)return;
  const row=element('fieldset');
  row.className='tool-line';
  row.append(element('legend','Item'));
  const key=++nextRow;
  for(const [name,label,type,value] of [['item','Product description','text',''],['sku','SKU (optional)','text',''],['quantity','Quantity','number','1'],...(purchase?[['price','Unit price (£)','number','0']]:[])]){
    const field=element('label');
    field.append(element('span',label));
    const input=element('input');
    input.id='line-'+key+'-'+name;
    input.dataset.field=name;
    input.type=type;
    input.value=value;
    input.required=name!=='sku';
    if(type==='text')input.maxLength=name==='item'?120:36;
    else{
      input.min=name==='quantity'?'1':'0';
      input.max=name==='quantity'?'999999':'1000000';
      input.step=name==='quantity'?'1':'0.01';
    }
    field.append(input);
    row.append(field);
  }
  const remove=element('button','Remove item');
  remove.type='button';
  remove.className='tool-secondary';
  remove.addEventListener('click',()=>{
    if(lineList.children.length>1){
      row.remove();
      invalidate();
      form.querySelector('[data-add-line]').focus();
    }
    else for(const input of row.querySelectorAll('input'))input.value=input.defaultValue;
    updateLineButtons();
  });
  row.append(remove);
  lineList.append(row);
  updateLineButtons();
  if(focus)row.querySelector('input').focus();
}
function updateLineButtons(){
  for(const row of lineList.children)row.querySelector('button').disabled=lineList.children.length===1;
  form.querySelector('[data-add-line]').disabled=lineList.children.length>=80;
}

async function loadLogo(file){
  if(!file || !file.size)return null;
  if(file.size>3_000_000 || !['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG or WebP image under 3 MB.');
  try{
    const url=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(reader.error);
      reader.readAsDataURL(file);
    });
    const image=new Image();
    image.src=url;
    await image.decode();
    if(!image.naturalWidth || !image.naturalHeight || image.naturalWidth*image.naturalHeight>16_000_000)throw new Error();
    return image;
  }catch{
    throw new Error('This logo could not be opened. Try a smaller image.');
  }
}
function displayDate(value){
  return new Intl.DateTimeFormat(document.documentElement.lang,{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
}
async function makeDocument(values){
  const rows=[...lineList.children].map(row=>{
    const values=Object.fromEntries([...row.querySelectorAll('input')].map(input=>[input.dataset.field,input.value]));
    const name=compact(values.item);
    if(!name)throw new Error('Enter a product description for each item.');
    return {name,sku:compact(values.sku),quantity:decimal(values.quantity,0,999999),unitPrice:purchase?decimal(values.price,2,1000000):0};
  });
  const reference=compact(values.reference);
  if(!reference)throw new Error('Enter an order reference.');
  if(purchase&&values.due&&values.due<values.date)throw new Error('The requested delivery date must be on or after the order date.');
  const taxRate=purchase?decimal(values.vat,2,100):0;
  const totals=documentTotals(rows,taxRate);
  const logo=await loadLogo(values.logo);
  const metadata={
    purchase,logo,reference,
    title:copy(purchase?'Purchase Order':'Packing Slip'),
    fromLabel:copy('From'),toLabel:copy(purchase?'Supplier':'Ship to'),
    from:[values.business,values.businessAddress].map(compact).filter(Boolean).join('\n'),
    to:[values.recipient,values.recipientAddress].map(compact).filter(Boolean).join('\n'),
    dateLine:copy(purchase?'Order date':'Dispatch date')+' · '+displayDate(values.date),
    dueLine:values.due?copy('Requested delivery date')+' · '+displayDate(values.due):'',
    itemLabel:copy('Item'),quantityLabel:copy('Quantity'),priceLabel:copy('Unit price'),totalLabel:copy('Line total'),
    notes:compact(values.notes),notesLabel:copy('Notes'),
    totals:purchase?[
      {label:copy('Subtotal'),amount:pounds(totals.base)},
      ...(taxRate?[{label:copy('Tax')+' · '+percent(taxRate/100),amount:pounds(totals.vat)}]:[]),
      {label:copy('Total'),amount:pounds(totals.total)}
    ]:[],
    rows:rows.map(row=>({...row,quantity:number(row.quantity),unitPrice:pounds(row.unitPrice),total:pounds(row.quantity*row.unitPrice)}))
  };
  const canvases=renderDocument(metadata,(width,height)=>{
    const canvas=element('canvas');
    canvas.width=width;
    canvas.height=height;
    canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label','Document preview page');
    return canvas;
  });
  return {name:(purchase?'purchase-order-':'packing-slip-')+filename(reference)+'.pdf',canvases};
}

function invalidate(){
  prepared=null;
  output.replaceChildren();
  output.dataset.empty='true';
  status.textContent='';
  if(exportButton)exportButton.hidden=true;
  if(print)print.hidden=true;
}

let generation=0;
form.addEventListener('input',()=>{
  generation++;
  if(calculators[id])return;
  invalidate();
});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  const token=++generation;
  if(!calculators[id])invalidate();
  const values=Object.fromEntries(new FormData(form));
  try{
    if(calculators[id])metrics(calculators[id](values));
    else{
      const next=documentTool?await makeDocument(values):id==='sku-generator'?buildSKU(values):buildBarcode(values);
      if(token!==generation)return;
      prepared=next;
      if(next.canvases){
        output.replaceChildren(...next.canvases);
        pageStyle.textContent='@page{size:A4 portrait;margin:0}';
      }
      exportButton.hidden=false;
      if(print)print.hidden=false;
    }
    output.dataset.empty='false';
    status.textContent=calculators[id]?'Result updated.':'Preview ready.';
  }catch(error){
    if(token!==generation)return;
    invalidate();
    status.textContent=error.message||'Unable to generate an output.';
  }
});

async function download(event){
  event.preventDefault();
  if(!prepared)return;
  const item=prepared;
  try{
    let blob=item.blob;
    if(!blob){
      const images=[];
      for(const canvas of item.canvases){
        const page=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.92));
        if(!page)throw new Error('Unable to generate the PDF.');
        images.push({bytes:new Uint8Array(await page.arrayBuffer()),width:canvas.width,height:canvas.height});
      }
      blob=jpegPagesPdf(images);
    }
    const url=URL.createObjectURL(blob);
    const link=element('a');
    link.href=url;
    link.download=item.name;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  }catch(error){
    status.textContent=error.message||'Unable to download the file.';
  }
}
exportButton?.addEventListener('click',download);
print?.addEventListener('click',()=>{if(prepared)window.print();});
if(documentTool){
  const date=form.elements.namedItem('date');
  const today=new Date();
  date.value=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
  date.defaultValue=date.value;
  addLine();
  form.querySelector('[data-add-line]').addEventListener('click',()=>{
    addLine(true);
    invalidate();
  });
}
const submit=form.querySelector('button[type="submit"]');
submit.disabled=false;
if(calculators[id])form.requestSubmit();
new MutationObserver(()=>{
  if(calculators[id]||prepared?.canvases)form.requestSubmit();
}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
