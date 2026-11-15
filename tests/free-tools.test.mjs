import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {barcodeValue,breakEven,csv,decimal,documentTotals,economicQuantity,reorderPoint,skus,wholesale} from '../assets/tools/model.mjs';
import {jpegPagesPdf,renderDocument} from '../assets/tools/documents.mjs';
import {tools} from '../assets/tools/data.mjs';

test('each public tool has an independent form and canonical page linked from Free Tools and the sitemap',()=>{
  const hub=fs.readFileSync('tools.html','utf8');
  const sitemap=fs.readFileSync('sitemap.xml','utf8');
  assert.equal(tools.length,8);
  for(const {id,title} of tools){
    const path='/tools/'+id;
    const html=fs.readFileSync(path.slice(1)+'.html','utf8');
    assert.ok(hub.includes('href="'+path+'"'));
    assert.ok(sitemap.includes('<loc>https://inventoryos.co.uk'+path+'</loc>'));
    assert.ok(html.includes('<h1>'+title+'</h1>'));
    assert.ok(html.includes('rel="canonical" href="https://inventoryos.co.uk'+path+'"'));
    assert.ok(html.includes('data-tool-form="'+id+'"'));
    assert.ok(!/<form[^>]*action=/.test(html));
    assert.ok(/<button[^>]*type="submit"[^>]*disabled>/.test(html));
  }
});

test('calculators match known cases and preserve whole-unit and penny rounding',()=>{
  assert.deepEqual(reorderPoint({demand:'12',days:'5',safety:'10'}),{point:70,demandDuringLead:60,safetyStock:10});
  assert.equal(reorderPoint({demand:'0.3',days:'10',safety:'1'}).point,4);
  assert.equal(reorderPoint({demand:'0.07',days:'1.5',safety:'0'}).point,1);
  assert.deepEqual(breakEven({fixed:'1000',selling:'20',variable:'12'}),{quantity:125,revenue:250000,contribution:800,contributionPercent:40});
  assert.equal(breakEven({fixed:'1',selling:'0.30',variable:'0'}).quantity,4);
  assert.deepEqual(wholesale({cost:'12',method:'margin',target:'25',vat:'20'}),{price:1600,includingVat:1920,margin:25,markup:100/3});
  assert.equal(wholesale({cost:'12',method:'markup',target:'25',vat:'0'}).price,1500);
  assert.equal(wholesale({cost:'0.10',method:'margin',target:'33',vat:'0'}).price,15);
  assert.equal(economicQuantity({annualDemand:'1000',ordering:'40',holding:'5'}).quantity,126);
  assert.equal(economicQuantity({annualDemand:'1',ordering:'0.01',holding:'100'}).quantity,1);
});
test('invalid inputs never produce a misleading calculation',()=>{
  assert.throws(()=>decimal('1e6'),/valid number/);
  assert.throws(()=>decimal('-1'),/valid number/);
  assert.throws(()=>decimal('0.001'),/decimal/);
  assert.throws(()=>decimal(''),/valid number/);
  assert.throws(()=>breakEven({fixed:'10',selling:'5',variable:'5'}),/exceed/);
  assert.throws(()=>wholesale({cost:'5',method:'margin',target:'100',vat:'0'}),/below 100/);
  assert.throws(()=>economicQuantity({annualDemand:'0',ordering:'2',holding:'2'}),/above zero/);
});
test('barcodes reject unsupported characters and SKU batches stay unique within a download',()=>{
  assert.equal(barcodeValue(' BATCH-07 '),' BATCH-07 ');
  assert.throws(()=>barcodeValue('🧪'),/standard keyboard/);
  assert.throws(()=>barcodeValue(' '),/standard keyboard/);
  const batch=skus({prefix:'my shop',category:'New',names:'Café Mug\nCafe Mug\n商品',sequence:'1',padding:'4'});
  assert.deepEqual(batch.map(x=>x.sku),['MY-SHOP-NEW-CAFE-MUG-0001','MY-SHOP-NEW-CAFE-MUG-0002','MY-SHOP-NEW-ITEM-0003']);
  assert.throws(()=>skus({prefix:'',category:'',names:'one\ntwo',sequence:'999999',padding:'3'}),/exceeds/);
  assert.equal(csv([['   =LET(1)','He said "hi"','x,y']]),'"\'   =LET(1)","He said ""hi""","x,y"\r\n');
});
test('purchase orders compute pence totals and PDFs paginate with valid xref offsets',async()=>{
  assert.deepEqual(documentTotals([{quantity:3,unitPrice:299},{quantity:4,unitPrice:25}],2000),{base:997,vat:199,total:1196});
  const image={width:100,height:100,bytes:new Uint8Array([255,216,255,217])};
  const pdf=jpegPagesPdf([image,image]);
  assert.equal(pdf.type,'application/pdf');
  const data=Buffer.from(await pdf.arrayBuffer()).toString('latin1');
  assert.match(data,/^%PDF-1.4/);
  assert.match(data,/\/Count 2/);
  const xref=Number(data.match(/startxref\n(\d+)/)[1]);
  assert.equal(data.slice(xref,xref+4),'xref');
  for(const [index,row] of data.slice(xref).split('\n').slice(3,11).entries()){
    const offset=Number(row.slice(0,10));
    assert.ok(data.slice(offset).startsWith((index+1)+' 0 obj'));
  }
  const mock=()=>({getContext:()=>({fillRect(){},fillText(){},measureText(text){return {width:16*text.length};},beginPath(){},moveTo(){},lineTo(){},stroke(){}})});
  const row={name:'Fictional label roll',sku:'SKU-01',quantity:'1',unitPrice:'£1.00',total:'£1.00'};
  const pages=renderDocument({purchase:true,reference:'PO-DEMO',title:'Purchase Order',from:'Example supplier',to:'Example store',rows:Array.from({length:80},()=>row),totals:[],notes:''},mock);
  assert.ok(pages.length>1);
});
