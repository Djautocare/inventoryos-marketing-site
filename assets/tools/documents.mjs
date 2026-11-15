const page = {width:1488,height:2105,padding:86};
const ink = '#142039';
const muted = '#45526b';
const accent = '#603fbd';
const line = '#cbd3e0';
const encode = text => new TextEncoder().encode(text);
const a4 = [595.28,841.89];

export function jpegPagesPdf(images) {
  if (!images.length) throw new Error('There are no pages to download.');
  const offsets = [0];
  const chunks = [];
  let bytes = 0;
  const add = part => {
    const chunk = typeof part === 'string' ? encode(part) : part;
    chunks.push(chunk);
    bytes += chunk.byteLength;
  };
  const object = (id, ...parts) => {
    offsets[id] = bytes;
    add(id + ' 0 obj\n');
    for (const part of parts) add(part);
    add('\nendobj\n');
  };
  add('%PDF-1.4\n');
  add(Uint8Array.of(37,226,227,207,211,10));
  object(1,'<< /Type /Catalog /Pages 2 0 R >>');
  object(2,'<< /Type /Pages /Count '+images.length+' /Kids ['+images.map((_,i) => (3 + i * 3) + ' 0 R').join(' ')+'] >>');
  images.forEach((image,index) => {
    const id=3 + index * 3;
    const content='q '+a4[0]+' 0 0 '+a4[1]+' 0 0 cm /Picture Do Q\n';
    object(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+a4.join(' ')+'] /Resources << /XObject << /Picture '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>');
    object(id+1,'<< /Type /XObject /Subtype /Image /Width '+image.width+' /Height '+image.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+image.bytes.length+' >>\nstream\n',image.bytes,'\nendstream');
    object(id+2,'<< /Length '+encode(content).length+' >>\nstream\n',content,'endstream');
  });
  const xref = bytes;
  add('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');
  for (const offset of offsets.slice(1)) add(String(offset).padStart(10,'0')+' 00000 n \n');
  add('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
  return new Blob(chunks,{type:'application/pdf'});
}

const font = (ctx, size, weight = 400) => { ctx.font = weight+' '+size+'px system-ui, sans-serif'; };

function wrap(ctx, text, width) {
  return text.split(/\r?\n/).flatMap(paragraph => {
    const lines=[];
    let current='';
    for (const word of paragraph.split(/\s+/)) {
      if (ctx.measureText(current+' '+word).width <= width) {
        current += (current ? ' ' : '')+word;
        continue;
      }
      if (current) lines.push(current);
      current='';
      for (const point of word) {
        if (ctx.measureText(current+point).width > width && current) {
          lines.push(current);
          current='';
        }
        current += point;
      }
    }
    return [...lines,current];
  });
}

function textLines(ctx,lines,x,y,gap) {
  lines.forEach((text,index)=>ctx.fillText(text,x,y+gap*index));
  return y+gap*lines.length;
}

function heading(ctx,document,number) {
  ctx.fillStyle='#fff';
  ctx.fillRect(0,0,page.width,page.height);
  ctx.fillStyle=accent;
  ctx.fillRect(page.padding,78,82,9);
  ctx.fillStyle=ink;
  font(ctx,59,700);
  ctx.fillText(document.title,page.padding,164);
  font(ctx,30,600);
  ctx.fillStyle=muted;
  textLines(ctx,wrap(ctx,document.reference,900),page.padding,222,37);
  if (document.logo && number===1) {
    const scale=Math.min(245/document.logo.width,118/document.logo.height);
    ctx.drawImage(document.logo,page.width-page.padding-document.logo.width*scale,92,document.logo.width*scale,document.logo.height*scale);
  }
  if (number>1) return 320;
  font(ctx,27);
  ctx.fillText(document.dateLine,page.padding,307);
  if (document.dueLine) ctx.fillText(document.dueLine,page.padding,350);
  const left=page.padding,right=page.width/2+28,column=page.width/2-page.padding-30;
  font(ctx,28,700);
  ctx.fillStyle=ink;
  ctx.fillText(document.fromLabel,left,422);
  ctx.fillText(document.toLabel,right,422);
  font(ctx,28);
  const from=wrap(ctx,document.from,column),to=wrap(ctx,document.to,column);
  textLines(ctx,from,left,464,35);
  textLines(ctx,to,right,464,35);
  return 505+Math.max(from.length,to.length)*35;
}

function tableHeader(ctx,document,y) {
  ctx.fillStyle='#ede9f9';
  ctx.fillRect(page.padding,y,page.width-2*page.padding,58);
  ctx.fillStyle=ink;
  font(ctx,25,700);
  ctx.fillText(document.itemLabel,page.padding+19,y+37);
  ctx.textAlign='right';
  ctx.fillText(document.quantityLabel,document.purchase?850:page.width-page.padding-18,y+37,135);
  if (document.purchase) {
    ctx.fillText(document.priceLabel,1120,y+37,245);
    ctx.fillText(document.totalLabel,page.width-page.padding-18,y+37,245);
  }
  ctx.textAlign='left';
  return y+58;
}

export function renderDocument(data,createCanvas) {
  const canvases=[];
  let ctx,y;
  const bottom=page.height-230;
  const openPage=()=>{
    const canvas=createCanvas(page.width,page.height);
    ctx=canvas.getContext('2d');
    canvases.push(canvas);
    y=tableHeader(ctx,data,heading(ctx,data,canvases.length));
  };
  openPage();
  for (const row of data.rows) {
    font(ctx,28);
    const left=page.padding+19;
    const item=wrap(ctx,row.sku ? row.name+' · '+row.sku : row.name,data.purchase?590:1020);
    const height=Math.max(63,item.length*35+24);
    if (y+height>bottom) openPage();
    font(ctx,28);
    ctx.fillStyle=ink;
    textLines(ctx,item,left,y+40,35);
    ctx.textAlign='right';
    ctx.fillText(row.quantity,data.purchase?850:page.width-page.padding-18,y+40);
    if (data.purchase) {
      ctx.fillText(row.unitPrice,1120,y+40);
      ctx.fillText(row.total,page.width-page.padding-18,y+40,245);
    }
    ctx.textAlign='left';
    ctx.strokeStyle=line;
    ctx.beginPath();
    ctx.moveTo(page.padding,y+height);
    ctx.lineTo(page.width-page.padding,y+height);
    ctx.stroke();
    y+=height;
  }
  font(ctx,26);
  const notes=data.notes ? wrap(ctx,data.notes,page.width-2*page.padding) : [];
  const block=notes.length*35+(notes.length?90:0)+data.totals.length*47;
  if (y+block>bottom) {
    const canvas=createCanvas(page.width,page.height);
    ctx=canvas.getContext('2d');
    canvases.push(canvas);
    y=heading(ctx,data,canvases.length);
  }
  y+=40;
  for (const {label,amount} of data.totals) {
    font(ctx,28,700);
    ctx.fillStyle=ink;
    ctx.textAlign='right';
    ctx.fillText(label,1100,y);
    ctx.fillText(amount,page.width-page.padding-18,y);
    ctx.textAlign='left';
    y+=47;
  }
  if (notes.length) {
    font(ctx,26,700);
    ctx.fillStyle=ink;
    ctx.fillText(data.notesLabel,page.padding,y+24);
    font(ctx,26);
    textLines(ctx,notes,page.padding,y+67,35);
  }
  canvases.forEach((canvas,index)=>{
    const context=canvas.getContext('2d');
    context.fillStyle=muted;
    font(context,24);
    context.textAlign='right';
    context.fillText((index+1)+' / '+canvases.length,page.width-page.padding,page.height-91);
  });
  return canvases;
}
