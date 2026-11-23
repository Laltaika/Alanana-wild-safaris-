/* Self-contained PDF export: no internet connection or external PDF library needed. */
(function(){
'use strict';
const enc=new TextEncoder();
const clean=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u2192]/g,' to ').replace(/[^\x20-\x7e]/g,' ');
const safe=s=>clean(s).replace(/[\\()]/g,'\\$&');
const fmt=n=>'$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=s=>{const d=new Date(String(s||'')+'T12:00:00');return isNaN(d)?'':d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});};
const addDays=(s,n)=>{const d=new Date(String(s||'')+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);};
const getCustomer=p=>[p.title==='Other'?p.otherTitle:p.title,p.customer].filter(Boolean).join(' ').trim()||'Customer';
const slug=s=>clean(s).trim().replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,90)||'Customer';
const sum=p=>(p.days||[]).reduce((a,d)=>a+(d.items||[]).reduce((b,x)=>b+(x.price===''||x.price==null?0:Number(x.price)||0),0),0);
const invoiceTotal=p=>p.selling!==''&&p.selling!=null&&Number.isFinite(Number(p.selling))?Number(p.selling):sum(p);
const destinations=p=>{const seen=new Set(),a=[];(p.days||[]).forEach(d=>{String(d.destination||'').split(/\s*(?:→|➜|⇒|\s+to\s+|\s+[–—]\s+|\s+\/\s+)\s*/i).forEach(v=>{v=v.trim();const k=v.toLowerCase().replace(/[^a-z0-9]/g,'');if(k&&!seen.has(k)){seen.add(k);a.push(v)}})});return a.join(' • ')};
async function logoBytes(){try{const r=await fetch('alanana-logo.jpg');if(!r.ok)return null;return new Uint8Array(await r.arrayBuffer())}catch{return null}}
async function generate(p,kind){
 const invoice=kind==='invoice', W=595,H=842, pages=[];let commands=[],y=0;
 const ink=[0.09,0.23,0.19],green=[0.08,0.39,0.29],grey=[0.39,0.44,0.43];
 const color=c=>c.map(v=>v.toFixed(3)).join(' ');
 function txt(t,x,top,size=10,bold=false,c=ink){commands.push(`${color(c)} rg BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${(H-top).toFixed(1)} Tm (${safe(t)}) Tj ET`)}
 function line(x1,top1,x2,top2,c=[0.84,0.88,0.86],th=1){commands.push(`${color(c)} RG ${th} w ${x1} ${H-top1} m ${x2} ${H-top2} l S`)}
 function rect(x,top,w,h,c){commands.push(`${color(c)} rg ${x} ${H-top-h} ${w} ${h} re f`)}
 function wrap(t,max=90){const words=clean(t).split(/\s+/),lines=[];let s='';for(const w of words){if((s+' '+w).trim().length>max&&s){lines.push(s);s=w}else s=(s+' '+w).trim()}if(s)lines.push(s);return lines}
 function page(){if(commands.length)pages.push(commands.join('\n'));commands=[];y=50;rect(0,0,W,9,green);txt('ALANANA WILD SAFARIS',52,58,16,true,green);txt('Arusha, Tanzania  |  www.alananawildsafaris.com',52,76,9,false,grey);line(52,91,543,91,green,1.5);y=113}
 function space(n){if(y+n>780)page()}
 function field(k,v,x){txt(k.toUpperCase(),x,y,8,true,grey);txt(v||'-',x,y+17,11,false,ink)}
 function tableRow(left,right,bold=false){space(35);if(bold)rect(52,y-13,491,31,[0.94,0.97,0.95]);txt(left,60,y+7,10,bold);txt(right,440,y+7,10,bold);line(52,y+16,543,y+16);y+=35}
 page();
 txt(invoice?'INVOICE':'SAFARI ITINERARY',52,y,22,true);y+=33;
 const customer=getCustomer(p),range=`${date(p.start)} - ${date(addDays(p.start,Math.max(0,p.days.length-1)))}`;
 if(invoice){
  const invNo='AWS-'+String(p.id||'').replace(/[^a-zA-Z0-9]/g,'').slice(-8).toUpperCase();
  txt('INVOICE NO.',52,y,8,true,grey);txt(invNo,52,y+17,10,true);txt('ISSUED',380,y,8,true,grey);txt(date(new Date().toISOString().slice(0,10)),380,y+17,10);y+=52;
  field('Bill to',customer,52);field('Safari dates',range,305);y+=58;
  field('Travellers',String(p.pax||'-'),52);field('Duration',`${p.days.length} day${p.days.length===1?'':'s'}`,305);y+=58;
  if(p.vehicleType||p.vehicleReg){field('Vehicle',[p.vehicleType,p.vehicleReg].filter(Boolean).join(' / '),52);y+=55}
  if(p.driverGuide){field('Driver-guide',p.driverGuide,52);y+=54}
  line(52,y-6,543,y-6);y+=23;
  txt('DESCRIPTION',52,y,9,true,grey);txt('AMOUNT (USD)',438,y,9,true,grey);y+=25;
  tableRow(`Safari package - ${p.days.length} days`,fmt(invoiceTotal(p)));
  const dest=destinations(p);if(dest){y+=15;txt('DESTINATIONS',52,y,9,true,grey);y+=17;for(const s of wrap(dest,88)){space(18);txt(s,52,y,9);y+=17}}
  y+=35;space(85);rect(52,y-18,491,70,green);txt('TOTAL AMOUNT (USD)',68,y+10,12,true,[1,1,1]);txt(fmt(invoiceTotal(p)),390,y+12,18,true,[1,1,1]);y+=91;
  txt('Thank you for choosing Alanana Wild Safaris.',52,y,10,false,grey);
 }else{
  field('Customer',customer,52);field('Safari dates',range,305);y+=58;
  if(p.vehicleType||p.vehicleReg){field('Vehicle',[p.vehicleType,p.vehicleReg].filter(Boolean).join(' / '),52);y+=53}
  if(p.driverGuide){field('Driver-guide',p.driverGuide,52);y+=50}
  for(let i=0;i<p.days.length;i++){
   const d=p.days[i];space(95);rect(52,y-14,491,30,[0.92,0.96,0.94]);txt(`DAY ${i+1}  |  ${date(addDays(p.start,i))}`,61,y+5,11,true,green);y+=36;
   if(d.destination){for(const s of wrap(d.destination,82)){space(19);txt(s,60,y,10,true);y+=19}}
   y+=7;tableRow('ACTIVITY / SERVICE','PRICE (USD)',true);
   for(const item of d.items||[]){const name=[item.name,item.detail].filter(Boolean).join(' - ');const lines=wrap(name||'Activity',66);space(lines.length*16+22);for(let j=0;j<lines.length;j++){txt(lines[j],60,y+7+j*16,10)}txt(item.price===''||item.price==null?'Not priced':fmt(item.price),440,y+7,10);y+=Math.max(35,lines.length*16+17);line(52,y-8,543,y-8)}
   const sub=(d.items||[]).reduce((a,x)=>a+(x.price===''||x.price==null?0:Number(x.price)||0),0);tableRow(`DAY ${i+1} TOTAL`,fmt(sub),true);y+=20;
  }
  space(85);rect(52,y-17,491,66,green);txt('TOTAL SAFARI ACTIVITY PRICES',65,y+10,11,true,[1,1,1]);txt(fmt(sum(p)),415,y+10,15,true,[1,1,1]);y+=73;
  if((p.days||[]).some(d=>(d.items||[]).some(x=>x.price===''||x.price==null))){space(24);txt('Some activities have no price entered.',52,y,9,false,grey)}
 }
 if(commands.length)pages.push(commands.join('\n'));
 const logo=await logoBytes();const objs=[null],obj=b=>{objs.push(b);return objs.length-1};
 const font1=obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'),font2=obj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
 let logoRef=null;if(logo){logoRef=obj({head:`<< /Type /XObject /Subtype /Image /Width 1080 /Height 864 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.length} >>`,bytes:logo})}
 const pageRefs=[];
 const rootPages=obj('');
 for(let i=0;i<pages.length;i++){
  let content=pages[i];if(logoRef)content=`q 85 0 0 68 455 740 cm /Logo Do Q\n`+content;
  content+=`\n0.5 0.5 0.5 rg BT /F1 8 Tf 1 0 0 1 52 30 Tm (Page ${i+1} of ${pages.length}) Tj ET`;
  const bytes=enc.encode(content);const contentRef=obj({head:`<< /Length ${bytes.length} >>`,bytes});
  pageRefs.push(obj(`<< /Type /Page /Parent ${rootPages} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> ${logoRef?`/XObject << /Logo ${logoRef} 0 R >>`:''} >> /Contents ${contentRef} 0 R >>`));
 }
 objs[rootPages]=`<< /Type /Pages /Kids [${pageRefs.map(n=>n+' 0 R').join(' ')}] /Count ${pageRefs.length} >>`;
 const catalog=obj(`<< /Type /Catalog /Pages ${rootPages} 0 R >>`);
 const parts=[],offsets=[0];let length=0;
 function put(bytes){parts.push(bytes);length+=bytes.length}
 put(enc.encode('%PDF-1.4\n'));
 for(let i=1;i<objs.length;i++){offsets.push(length);put(enc.encode(`${i} 0 obj\n`));const o=objs[i];if(typeof o==='string')put(enc.encode(o));else{put(enc.encode(o.head+'\nstream\n'));put(o.bytes);put(enc.encode('\nendstream'))}put(enc.encode('\nendobj\n'))}
 const start=length;put(enc.encode(`xref\n0 ${objs.length}\n0000000000 65535 f \n`));for(let i=1;i<objs.length;i++)put(enc.encode(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`));put(enc.encode(`trailer\n<< /Size ${objs.length} /Root ${catalog} 0 R >>\nstartxref\n${start}\n%%EOF`));
 const blob=new Blob(parts,{type:'application/pdf'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${slug(customer)}_${invoice?'Invoice':'Itinerary'}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
window.alananaDownloadPlannerPdf=generate;
})();
