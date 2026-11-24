(()=>{'use strict';
const KEY='alanana_safari_planner_v1';
const services=['Arrival / Airport pickup','Accommodation / Sleepover','Park entry fees','Concession fees','Ngorongoro crater fees','Vehicle park entry fees','Safari vehicle and service','Game drive','Departure / Drop-off','Fuel','Driver-guide','Meals','Flight / Transfer','Other'];
const $=id=>document.getElementById(id);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fresh=()=>({id:crypto.randomUUID(),customer:'',title:'',otherTitle:'',pax:'2',start:'2026-11-24',selling:'',vehicleType:'',vehicleReg:'',driverGuide:'',hireId:'',days:[{id:crypto.randomUUID(),destination:'',items:[]}]});
let plans=[];try{const stored=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(stored))plans=stored;}catch{}
let current=plans[0]?.id||null,active=0;
const get=()=>plans.find(p=>p.id===current);
const hireRecords=()=>{try{const db=JSON.parse(localStorage.getItem('alanana_finance_v1')||'{}');return Array.isArray(db.safaris)?db.safaris:[];}catch{return [];}};
const normalizeReg=v=>String(v||'').toUpperCase().replace(/\s+/g,'');
function bookingWarning(p){const el=$('plannerVehicleWarning');if(!el)return;const reg=normalizeReg(p.vehicleReg);if(!reg||!p.start){el.textContent='Enter registration and safari dates to check existing vehicle bookings.';return;}const end=new Date(p.start+'T12:00:00');end.setDate(end.getDate()+Math.max(1,p.days.length)-1);const last=end.toISOString().slice(0,10);const matches=hireRecords().filter(r=>normalizeReg(r.reg)===reg&&r.start<=last&&r.end>=p.start);const linked=matches.filter(r=>r.id===p.hireId);const others=matches.filter(r=>r.id!==p.hireId);el.textContent=others.length?'⚠ Vehicle already booked: '+others.map(r=>(r.customer||'Client')+' ('+r.start+' to '+r.end+')').join('; '):linked.length?'✓ Linked to existing safari hire booking. No other overlap found.':'✓ No overlapping saved hire bookings found on this device.';el.style.color=others.length?'#9b3a18':'#246b50';}
function refreshHirePicker(p){const picker=$('plannerHireLink');const options=hireRecords();picker.innerHTML='<option value="">Not linked to a hire booking</option>'+options.map(r=>`<option value="${escape(r.id)}">${escape(r.customer||'Client')} · ${escape(r.reg||'')} · ${escape(r.start||'')}</option>`).join('');picker.value=p.hireId||'';if(picker.value!==p.hireId)picker.value='';}

const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(plans));$('plannerSaveState').textContent='✓ Saved on this device';const stamp=$('plannerSavedAt');if(stamp)stamp.textContent='✓ Saved '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}catch{$('plannerSaveState').textContent='Unable to save: check device storage';}};
const customerName=p=>[p.title==='Other'?(p.otherTitle||'').trim():(p.title||''),p.customer||''].filter(Boolean).join(' ');
const money=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const subtotal=d=>d.items.reduce((s,x)=>s+(x.price===''?0:Number(x.price)||0),0);
const sum=p=>p.days.reduce((s,d)=>s+subtotal(d),0);
const invoicePrice=p=>p.selling!==''&&p.selling!=null?Number(p.selling)||0:sum(p);
const hasUnpriced=p=>p.days.some(d=>d.items.some(x=>x.price===''||x.price==null));
const dateAt=(start,i)=>{if(!start)return ['Date not selected',''];const d=new Date(start+'T12:00:00');if(isNaN(d))return ['Date not selected',''];d.setDate(d.getDate()+i);return [d.toLocaleDateString('en-GB',{weekday:'long'}),d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})];};
function render(){const p=get();$('plannerPlanPicker').innerHTML='<option value="">Choose saved plan</option>'+plans.map(x=>`<option value="${escape(x.id)}" ${x.id===current?'selected':''}>${escape(x.customer||'Unnamed safari')} — ${escape(x.start||'No date')}</option>`).join('');
$('plannerEditor').hidden=!p;if(!p)return;
$('plannerCustomer').value=p.customer;$('plannerVehicleType').value=p.vehicleType||'';$('plannerVehicleReg').value=p.vehicleReg||'';$('plannerDriverGuide').value=p.driverGuide||'';refreshHirePicker(p);bookingWarning(p);$('plannerTitle').value=p.title||'';$('plannerOtherTitle').value=p.otherTitle||'';$('plannerOtherTitleWrap').hidden=p.title!=='Other';$('plannerPax').value=p.pax||'2';$('plannerStart').value=p.start;$('plannerSelling').value=p.selling;
active=Math.max(0,Math.min(active,p.days.length-1));const d=p.days[active];if(!d.items.length){d.items.push({id:crypto.randomUUID(),name:services[0],detail:'',price:'',showPrice:true});save();}
$('plannerDays').innerHTML=p.days.map((x,i)=>`<button type="button" class="planner-day-tab ${i===active?'selected':''}" data-planner-day="${i}">Day ${i+1}</button>`).join('');
const [weekday,date]=dateAt(p.start,active);$('plannerWeekday').textContent=weekday;$('plannerFullDate').textContent=date;$('plannerDayNumber').textContent='DAY '+(active+1);$('plannerDestination').value=d.destination;
$('plannerChoices').innerHTML='';
const opts=selected=>services.map(x=>`<option value="${escape(x)}" ${x===selected?'selected':''}>${escape(x)}</option>`).join('');
$('plannerItems').innerHTML=`<div class="planner-three-head"><span>Day</span><span>Activity</span><span>Price USD</span></div><div class="planner-three-list">${d.items.map((x,i)=>`<div class="planner-three-day">${i===0?`<strong>Day ${active+1}</strong><small>${escape(weekday)}<br>${escape(date)}</small>`:''}</div><div class="planner-three-activity"><select data-planner-activity="${i}" aria-label="Activity ${i+1}">${opts(services.includes(x.name)?x.name:'Other')}</select>${!services.includes(x.name)||x.name==='Other'?`<input data-planner-other="${i}" value="${escape(services.includes(x.name)?x.detail:x.name)}" placeholder="Other activity name">`:''}<input data-planner-detail="${i}" value="${escape(x.detail)}" placeholder="${x.name==='Accommodation / Sleepover'?'Lodge / hotel name':'Details (optional)'}"></div><div class="planner-three-price"><input type="number" min="0" step="0.01" data-planner-price="${i}" value="${escape(x.price)}" placeholder="USD" aria-label="Price USD"><button type="button" class="planner-remove" data-planner-remove="${i}" aria-label="Remove activity">✕</button></div>`).join('')}</div><div class="planner-three-actions"><button type="button" id="plannerAddActivity" class="primary">＋ Add Activity</button></div>`;
$('plannerDayTotal').textContent=money(subtotal(d));$('plannerGrandTotal').textContent=money(sum(p));$('plannerProfit').textContent=p.selling===''?'Using itinerary total':money(Number(p.selling)-sum(p));$('plannerCount').textContent=p.days.length+' safari '+(p.days.length===1?'day':'days');
}
function update(fn,rerender=true){const p=get();if(!p)return;fn(p);save();if(rerender)render();else{const d=p.days[active];$('plannerDayTotal').textContent=money(subtotal(d));$('plannerGrandTotal').textContent=money(sum(p));$('plannerProfit').textContent=p.selling===''?'Using itinerary total':money(Number(p.selling)-sum(p));}}
$('plannerNew').addEventListener('click',()=>{const p=fresh();plans.unshift(p);current=p.id;active=0;save();render();});
$('plannerPlanPicker').addEventListener('change',e=>{current=e.target.value;active=0;render();});
$('plannerDelete').addEventListener('click',async()=>{if(!await window.authorizeDeletion('Delete this safari plan? Your finance bookings will not be affected.'))return;plans=plans.filter(p=>p.id!==current);current=plans[0]?.id||null;active=0;save();render();});
$('plannerTitle').addEventListener('change',e=>update(p=>p.title=e.target.value));
$('plannerOtherTitle').addEventListener('input',e=>update(p=>p.otherTitle=e.target.value,false));
$('plannerOtherTitle').addEventListener('change',render);
$('plannerCustomer').addEventListener('input',e=>update(p=>p.customer=e.target.value,false));
$('plannerCustomer').addEventListener('change',render);
$('plannerVehicleType').addEventListener('input',e=>update(p=>p.vehicleType=e.target.value,false));
$('plannerVehicleReg').addEventListener('input',e=>{update(p=>{p.vehicleReg=e.target.value;p.hireId='';},false);bookingWarning(get());});
$('plannerVehicleReg').addEventListener('change',render);
$('plannerDriverGuide').addEventListener('input',e=>update(p=>p.driverGuide=e.target.value,false));
$('plannerHireLink').addEventListener('change',e=>update(p=>{p.hireId=e.target.value;const r=hireRecords().find(r=>r.id===p.hireId);if(r){p.customer=r.customer||p.customer;p.vehicleReg=r.reg||p.vehicleReg;p.vehicleType=r.vehicleType||p.vehicleType;p.start=r.start||p.start;}}));
$('plannerPax').addEventListener('change',e=>update(p=>p.pax=e.target.value));
$('plannerStart').addEventListener('change',e=>update(p=>p.start=e.target.value));
$('plannerSelling').addEventListener('input',e=>update(p=>p.selling=e.target.value,false));
$('plannerDestination').addEventListener('input',e=>update(p=>p.days[active].destination=e.target.value,false));
$('plannerAddDay').addEventListener('click',()=>update(p=>{p.days.push({id:crypto.randomUUID(),destination:'',items:[]});active=p.days.length-1;}));
$('plannerRemoveDay').addEventListener('click',async()=>{const p=get();if(p.days.length<=1)return alert('Keep at least one day.');if(!await window.authorizeDeletion('Remove Day '+(active+1)+' and its items?'))return;update(p=>{p.days.splice(active,1);active=Math.min(active,p.days.length-1);});});
$('plannerDays').addEventListener('click',e=>{const b=e.target.closest('[data-planner-day]');if(b){active=Number(b.dataset.plannerDay);render();}});
$('plannerItems').addEventListener('click',e=>{const rem=e.target.closest('[data-planner-remove]');if(rem){update(p=>p.days[active].items.splice(Number(rem.dataset.plannerRemove),1));return;}if(e.target.closest('#plannerAddActivity'))update(p=>p.days[active].items.push({id:crypto.randomUUID(),name:services[0],detail:'',price:'',showPrice:true}));});
$('plannerItems').addEventListener('change',e=>{const t=e.target;if(t.hasAttribute('data-planner-activity'))update(p=>{const x=p.days[active].items[Number(t.dataset.plannerActivity)];x.name=t.value;x.detail='';});});
$('plannerItems').addEventListener('input',e=>{const t=e.target;if(t.hasAttribute('data-planner-detail'))update(p=>p.days[active].items[Number(t.dataset.plannerDetail)].detail=t.value,false);if(t.hasAttribute('data-planner-other'))update(p=>p.days[active].items[Number(t.dataset.plannerOther)].name=t.value,false);if(t.hasAttribute('data-planner-price')){const v=t.value;if(v!==''&&(!Number.isFinite(Number(v))||Number(v)<0))return;update(p=>p.days[active].items[Number(t.dataset.plannerPrice)].price=v,false);}});
$('plannerCopy').addEventListener('click',async()=>{const p=get();if(!p)return;const lines=['ALANANA WILD SAFARIS','SAFARI PLAN','Customer / Group: '+(customerName(p)||'Not entered'),'Start: '+p.start,'Vehicle: '+(p.vehicleType||'Not entered'),'Registration: '+(p.vehicleReg||'Not entered'),'Driver-guide: '+(p.driverGuide||'Not entered'),''];p.days.forEach((d,i)=>{const [w,date]=dateAt(p.start,i);lines.push('DAY '+(i+1)+' — '+w+', '+date,'Route: '+(d.destination||'Not entered'));d.items.forEach(x=>lines.push('• '+x.name+(x.detail?' — '+x.detail:'')+' | '+(x.price===''?'Not priced':money(Number(x.price)))));lines.push('Day total (entered prices): '+money(subtotal(d)),'');});lines.push('Total entered costs: '+money(sum(p)),'Invoice selling price: '+money(invoicePrice(p))+(p.selling===''?' (automatic from itinerary)':' (manual override)'));const txt=lines.join('\n');try{await navigator.clipboard.writeText(txt);alert('Safari plan copied.');}catch{const blob=new Blob([txt],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='alanana-safari-plan.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}});
// Compact invoice summary: list each place once, preserving first appearance.
// The itinerary keeps the original detailed day-by-day routes unchanged.
function invoiceDestinations(days){
 const seen=new Set(), places=[];
 for(const day of days){
  const raw=String(day.destination||'').trim();
  if(!raw)continue;
  const parts=raw.split(/\s*(?:→|➜|⇒|\u2192|\s+to\s+|\s+[–—]\s+|\s+\/\s+)\s*/i);
  for(let part of parts){
   part=part.replace(/\s+/g,' ').trim();
   if(!part)continue;
   const key=part.toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]/gu,'');
   if(key&&!seen.has(key)){seen.add(key);places.push(part);}
  }
 }
 return places.join(' • ')||'To be confirmed';
}
function docFilename(p,kind){
 const name=(customerName(p)||'Customer').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'Customer';
 return `${name}_${kind==='itinerary'?'Itinerary':'Invoice'}.pdf`;
}
function documentHtml(p,kind){
 const itinerary=kind==='itinerary';
 const name=customerName(p)||'Customer';
 const fileTitle=docFilename(p,kind).replace(/\.pdf$/,'');
 const dateRange=p.days.length?`${dateAt(p.start,0)[1]} – ${dateAt(p.start,p.days.length-1)[1]}`:'';
 const row=(label,value)=>value?`<div class="field"><span>${label}</span><strong>${escape(String(value))}</strong></div>`:'';
 const details=row('Customer',name)+row('Safari dates',dateRange)+row('Travellers',p.pax||'')+row('Vehicle',p.vehicleType||'')+row('Registration',p.vehicleReg||'')+row('Driver-guide',p.driverGuide||'');
 const activities=p.days.map((d,i)=>{const [weekday,date]=dateAt(p.start,i);const items=d.items.map(x=>`<tr><td>${escape(x.name||'Other')}${x.detail?' <small>— '+escape(x.detail)+'</small>':''}</td><td class="amount">${x.price===''?'—':money(Number(x.price)||0)}</td></tr>`).join('');return `<section class="day"><h3>Day ${i+1} <span>${escape(weekday)}, ${escape(date)}</span></h3>${d.destination?`<p class="route">${escape(d.destination)}</p>`:''}<table><thead><tr><th>Activity / Service</th><th class="amount">USD</th></tr></thead><tbody>${items}<tr class="sub"><td>Daily total</td><td class="amount">${money(subtotal(d))}</td></tr></tbody></table></section>`}).join('');
 const main=itinerary?`<h2>Day-by-day itinerary</h2>${activities}<div class="grand"><span>Safari total</span><strong>${money(sum(p))}</strong></div>`:`<div class="package"><h2>Safari package</h2><p>${escape(invoiceDestinations(p.days))}</p></div><div class="grand"><span>TOTAL DUE · USD</span><strong>${money(invoicePrice(p))}</strong></div>`;
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(fileTitle)}</title><style>*{box-sizing:border-box}body{font:14px/1.5 Arial,Helvetica,sans-serif;color:#20372e;margin:0;padding:20px;background:white}.head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:2px solid #14694d}.head img{width:95px;max-height:65px;object-fit:contain}.head b{display:block;font-size:17px;letter-spacing:.06em}.head h1{font-size:21px;letter-spacing:.07em;margin:4px 0 2px;color:#14694d}.head small{color:#64776c}.fields{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;margin:12px 0 15px}.field{padding:5px 0;border-bottom:1px solid #e1e9e4;display:flex;flex-direction:column;gap:3px}.field span{color:#74867a;font-size:11px;text-transform:uppercase;letter-spacing:.08em}.field strong{font-size:13px;font-weight:600}h2{font-size:15px;margin:0 0 7px;color:#20372e}.package{padding:12px;background:#f4f8f5;border-left:4px solid #14694d}.package p{margin:0;color:#40544a}.grand{margin-top:13px;background:#14694d;color:white;padding:12px 15px;display:flex;align-items:center;justify-content:space-between;gap:20px}.grand span{font-size:13px;letter-spacing:.08em;font-weight:700}.grand strong{font-size:21px;white-space:nowrap}.day{margin:10px 0 14px;break-inside:auto}.day h3{break-after:avoid}.day h3{font-size:15px;border-bottom:2px solid #14694d;padding-bottom:4px;margin:0}.day h3 span{font-weight:normal;color:#607267;margin-left:12px}.route{margin:4px 0;color:#566c60}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:5px 6px;border-bottom:1px solid #e1e9e4;text-align:left}th{color:#5a7165;background:#f4f8f5}.amount{text-align:right;white-space:nowrap}.sub{font-weight:bold;background:#f4f8f5}footer{margin-top:14px;padding-top:7px;border-top:1px solid #dce5df;font-size:11px;color:#73877b}@page{size:A4;margin:9mm}@media print{body{padding:0}.grand{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><header class="head"><div><b>ALANANA WILD SAFARIS</b><h1>${itinerary?'SAFARI ITINERARY':'INVOICE'}</h1><small>Arusha, Tanzania · www.alananawildsafaris.com</small></div><img src="alanana-logo.jpg" alt="Alanana Wild Safaris"></header><div class="fields">${details}</div>${main}<footer>ALANANA WILD SAFARIS · Tanzania</footer></body></html>`;
}
// Direct, offline PDF writer. Uses the actual customer name in the downloaded file.
// Text is wrapped to fit A4 pages; no browser print-dialog filename dependence.
function downloadPlannerPdf(p,kind){
 const W=595.28,H=841.89,margin=36,contentWidth=W-2*margin;
 const encoder=new TextEncoder(), pages=[];let commands=[],y=H-38;
 const clean=t=>String(t??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2013\u2014]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[^\x20-\x7e]/g,' ');
 const esc=t=>clean(t).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
 const text=(t,x,yy,size=10,bold=false,color='0.14 0.23 0.19')=>{commands.push(`${color} rg BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${yy.toFixed(1)} Tm (${esc(t)}) Tj ET`)};
 const rule=(yy,color='0.82 0.88 0.84')=>commands.push(`${color} RG 0.8 w ${margin} ${yy} m ${W-margin} ${yy} l S`);
 const block=(yy,h,color)=>commands.push(`${color} rg ${margin} ${yy} ${contentWidth} ${h} re f`);
 const next=()=>{pages.push(commands.join('\n'));commands=[];y=H-38;};
 const ensure=h=>{if(y-h<36){next();header(true);}};
 const wrap=(str,max=86)=>{const words=clean(str).split(/\s+/);const lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>max&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);return lines.length?lines:[''];};
 const paragraph=(t,size=10,indent=0,max=90)=>{for(const line of wrap(t,max)){ensure(13);text(line,margin+indent,y,size);y-=12;}};
 const header=(small=false)=>{text('ALANANA WILD SAFARIS',margin,y,small?12:18,true,'0.08 0.37 0.27');y-=small?17:23;text(kind==='invoice'?'CUSTOMER INVOICE':'SAFARI ITINERARY',margin,y,small?11:15,true);y-=14;rule(y);y-=17;};
 header();
 const dateRange=p.days.length?`${dateAt(p.start,0)[1]} - ${dateAt(p.start,p.days.length-1)[1]}`:'';
 const fields=[['CUSTOMER',customerName(p)||'Customer'],['SAFARI DATES',dateRange],['TRAVELLERS',p.pax||''],['VEHICLE',p.vehicleType||''],['REGISTRATION',p.vehicleReg||''],['DRIVER-GUIDE',p.driverGuide||'']];
 for(const [label,value] of fields){if(!value)continue;ensure(17);text(label,margin,y,8,true,'0.41 0.51 0.45');text(clean(value).slice(0,78),margin+126,y,10,true);y-=17;}
 y-=8;
 const total=(label,amount)=>{ensure(47);block(y-35,43,'0.08 0.40 0.29');text(label,margin+15,y-17,11,true,'1 1 1');text(amount,W-margin-152,y-18,17,true,'1 1 1');y-=50;};
 if(kind==='invoice'){
  ensure(34);text('SAFARI PACKAGE',margin,y,14,true);y-=17;
  paragraph(invoiceDestinations(p.days),10,0,86);y-=13;
  total('TOTAL AMOUNT (USD)',money(invoicePrice(p)));
 }else{
  for(let i=0;i<p.days.length;i++){
   const d=p.days[i],date=dateAt(p.start,i);ensure(53);text(`DAY ${i+1}  |  ${date[0]}, ${date[1]}`,margin,y,12,true,'0.08 0.37 0.27');y-=16;
   if(d.destination){paragraph(d.destination,9,0,95);y-=3;}
   rule(y);y-=9;
   for(const a of d.items){const desc=clean((a.name||'Other')+(a.detail?' - '+a.detail:''));const lines=wrap(desc,70);ensure(lines.length*12+5);for(let j=0;j<lines.length;j++){text(lines[j],margin+3,y,10);if(j===0)text(a.price===''?'Not priced':money(Number(a.price)||0),W-margin-100,y,10,true);y-=12;}}
   ensure(24);rule(y);y-=14;text('Day total',margin+3,y,10,true);text(money(subtotal(d)),W-margin-100,y,10,true);y-=24;
  }
  total('SAFARI TOTAL (USD)',money(sum(p)));
 }
 pages.push(commands.join('\n'));
 const objs=[null,'<< /Type /Catalog /Pages 2 0 R >>',null,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'];
 const pageIds=[];
 for(const stream of pages){const pageId=objs.length,streamId=pageId+1;pageIds.push(pageId);objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`);objs.push(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`);}
 objs[2]=`<< /Type /Pages /Kids [${pageIds.map(i=>i+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;
 let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objs.length;i++){offsets[i]=encoder.encode(pdf).length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`;}
 const xref=encoder.encode(pdf).length;pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;for(let i=1;i<objs.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=docFilename(p,kind);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
let activeDocumentKind='invoice';
function showDocument(kind){activeDocumentKind=kind;const p=get();if(!p)return;const html=documentHtml(p,kind);const frame=$('plannerDocFrame');frame.srcdoc=html;frame.title=(customerName(p)||'Customer')+' '+(kind==='itinerary'?'Itinerary':'Invoice');$('plannerDocPrint').textContent='⬇ Download '+(kind==='itinerary'?'Itinerary':'Invoice')+' PDF';$('planner').classList.add('hidden');$('plannerDocument').classList.remove('hidden');$('plannerDocument').scrollIntoView({behavior:'smooth',block:'start'});}
$('plannerSaveButton').addEventListener('click',()=>{if(!get())return;save();render();alert('Saved! Open this itinerary later from the Open saved itinerary / safari plan menu. Use Export Planner Backup when moving devices.');});
$('plannerItinerary').addEventListener('click',()=>showDocument('itinerary'));
$('plannerInvoice').addEventListener('click',()=>showDocument('invoice'));
$('plannerDocBack').addEventListener('click',()=>{$('plannerDocument').classList.add('hidden');$('planner').classList.remove('hidden');});
$('plannerDocPrint').addEventListener('click',()=>{const p=get();if(p)downloadPlannerPdf(p,activeDocumentKind);});
$('plannerExport').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(plans,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='alanana-safari-plans-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('plannerImport').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data)||!data.every(p=>p&&typeof p.id==='string'&&Array.isArray(p.days)&&p.days.every(d=>Array.isArray(d.items))))throw Error('Invalid backup');if(!confirm('Import safari plans? Existing planner plans with matching IDs will be replaced.'))return;const byId=new Map(plans.map(p=>[p.id,p]));data.forEach(p=>byId.set(p.id,p));plans=[...byId.values()];current=data[0]?.id||current;active=0;save();render();}catch{alert('This is not a valid Safari Planner backup.');}finally{e.target.value='';}});
render();
})();
