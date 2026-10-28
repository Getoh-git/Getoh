// Osaka Trip 2026 - ตรรกะของหน้าเว็บ (ข้อมูลอยู่ใน hotels.js)
const $=id=>document.getElementById(id);
const OSAKA=window.OSAKA_CONFIG;
const baht=v=>"฿"+Number(v).toLocaleString("th-TH",{minimumFractionDigits:2});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const F=OSAKA.flights.map(f=>({...f,ap:+new Date(f.ap),dep:+new Date(f.dep),arr:+new Date(f.arr)}));
function dur(ms){
  const m=Math.max(0,Math.floor(ms/6e4)),d=Math.floor(m/1440),h=Math.floor(m%1440/60);
  return (d?d+" วัน ":"")+(d||h?h+" ชม. ":"")+m%60+" นาที";
}
const GL={D:["11110","10001","10001","10001","10001","10001","11110"],M:["10001","11011","10101","10101","10001","10001","10001"],K:["10001","10010","10100","11000","10100","10010","10001"],I:["01110","00100","00100","00100","00100","00100","01110"],X:["10001","10001","01010","00100","01010","10001","10001"],B:["11110","10001","10001","11110","10001","10001","11110"]};
const CITY={DMK:"กรุงเทพ",KIX:"โอซาก้า",BKK:"กรุงเทพ"},ZONE={KIX:"เวลาโอซาก้า",BKK:"เวลากรุงเทพ"},OFF={DMK:7,BKK:7,KIX:9};
const wd=(t,a)=>["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."][new Date(t+OFF[a]*36e5).getUTCDay()];
function dots(t,col){
  let x=0,o="";
  for(const ch of t){const g=GL[ch];if(!g)continue;
    g.forEach((r,y)=>[...r].forEach((b,i)=>{if(b==="1")o+=`<circle cx="${x+i*5+2.5}" cy="${y*5+2.5}" r="1.9"/>`}));x+=30}
  return `<svg viewBox="0 0 ${x-5} 35" fill="${col}" aria-label="${t}">${o}</svg>`;
}
function orbit(p,id){
  const x=14+p*272;
  return `<svg viewBox="0 0 300 44" height="44"><defs><linearGradient id="g${id}"><stop offset="0" stop-color="#2f7d00"/><stop offset="1" stop-color="#7be000"/></linearGradient><clipPath id="c${id}"><rect x="0" y="0" width="${x}" height="44"/></clipPath></defs>
  <ellipse cx="150" cy="22" rx="145" ry="14" fill="#2a2b2e"/>
  <ellipse cx="150" cy="22" rx="145" ry="14" fill="url(#g${id})" clip-path="url(#c${id})"/>
  <g transform="translate(${x} 22) scale(.9)"><polygon fill="#fff" points="10,0 4,-2 -2,-2 -8,-9 -11,-9 -7,-2 -11,-2 -13,-5 -15,-5 -13,0 -15,5 -13,5 -11,2 -7,2 -11,9 -8,9 -2,2 4,2"/></g></svg>`;
}
function fmtR(ms){
  const m=Math.max(0,Math.floor(ms/6e4)),d=Math.floor(m/1440),h=Math.floor(m%1440/60);
  return "-"+(d?`${d}D ${h}H`:h?`${h}H ${m%60}M`:`${m%60}M`);
}
function flightCard(f,now){
  let st,p=0,tg;
  if(now<f.ap){st=`ไปสนามบินใน ${dur(f.ap-now)}`;tg=f.dep-now}
  else if(now<f.dep){st=`ควรอยู่สนามบินแล้ว · ออกใน ${dur(f.dep-now)}`;tg=f.dep-now}
  else if(now<f.arr){p=(now-f.dep)/(f.arr-f.dep);st=`อยู่บนเครื่อง · ถึงใน ${dur(f.arr-now)}`;tg=f.arr-now}
  else{p=1;st="ลงจอดแล้ว ✓";tg=0}
  return `<div class="fc"><div class="fh"><span>${f.title} · ${f.code}</span><span>${f.info.split(" · ")[0]}</span></div>
   <div class="fr"><div>${dots(f.from,"#fff")}<b>${CITY[f.from]}</b><small>${wd(f.dep,f.from)} ${f.depD} · ${f.depT}</small></div><span class="ar">→</span>
   <div>${dots(f.to,"#5fd100")}<b>${CITY[f.to]}</b><small>${wd(f.arr,f.to)} ${f.arrD} · ${f.arrT}</small></div></div>
   <div class="fe"><div><b>ETA ${f.arrT}</b><small>${ZONE[f.to]}</small></div><div class="or">${st}</div></div>
   <div class="ft">${orbit(p,f.code)}<code>${fmtR(tg)}</code></div>
   <div class="fa">🛄 แนะนำถึงสนามบิน <b>${f.apT}</b> (ก่อนเครื่องออก 3 ชม.)</div></div>`;
}
function tick(){
  const now=Date.now(),nx=F.find(f=>now<f.dep);
  const v=nx?nx.dep-now:0;
  $("td").textContent=String(Math.floor(v/864e5)).padStart(2,"0");
  $("th").textContent=String(Math.floor(v%864e5/36e5)).padStart(2,"0");
  $("tm").textContent=String(Math.floor(v%36e5/6e4)).padStart(2,"0");
  $("ts").textContent=String(Math.floor(v%6e4/1e3)).padStart(2,"0");
  $("tlabel").textContent=nx?`เหลือเวลาจนถึงเครื่องออก (${nx.title})`:"ทริปนี้จบแล้ว กลับถึงบ้านเรียบร้อย 🏠";
  $("tnext").textContent=nx?`${nx.from} ➔ ${nx.to} · ${nx.depD} เวลา ${nx.depT}`:"";
  $("flights").innerHTML=F.map(f=>flightCard(f,now)).join("");
}

// ===================== Hotels =====================
const KEY="osaka_custom_hotels_v1";
let custom=[];
try{custom=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){custom=[]}
if(!Array.isArray(custom))custom=[];
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(custom))}catch(e){toast("บันทึกในเครื่องนี้ไม่ได้")}};
const all=()=>[...OSAKA.hotels,...custom];
const find=id=>all().find(h=>h.id===id);
const COL={Namba:"#0284c7",Ebisu:"#059669","Shin-Imamiya":"#7c3aed",Umeda:"#d97706"},PAL=["#db2777","#0d9488","#dc2626","#4f46e5","#ca8a04","#0891b2"];
const colorOf=a=>COL[a]||PAL[[...String(a||"")].reduce((s,c)=>(s*31+c.charCodeAt(0))%PAL.length,0)];
const num=v=>{const n=parseFloat(v);return Number.isFinite(n)?n:null};
const rv=h=>h.reviews||[];
const rcount=h=>rv(h).length?`💬 ${rv(h).length} คอมเมนต์ห้อง`:"⚪ ยังไม่มีคอมเมนต์ห้อง";
const rsum=h=>rv(h).length?`👍${rv(h).filter(x=>x[0]==="+").length} · 👎${rv(h).filter(x=>x[0]==="-").length}`:"ยังไม่มีข้อมูล";
const price=h=>h.price!=null?baht(h.price):"–";
let sel=[],area="ALL";

function tab(t){
  $("p-count").classList.toggle("hide",t!=="count");
  $("p-hotels").classList.toggle("hide",t!=="hotels");
  $("n-count").classList.toggle("on",t==="count");
  $("n-hotels").classList.toggle("on",t==="hotels");
  scrollTo(0,0);
}
function openSheet(t,html){$("st").textContent=t;$("sb").innerHTML=html;$("ov").classList.remove("hide");document.body.style.overflow="hidden"}
function closeSheet(){$("ov").classList.add("hide");document.body.style.overflow=""}
function toast(m){const o=$("toast");if(o)o.remove();const t=document.createElement("div");t.id="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}

function chips(){
  const A=["ALL",...new Set(all().map(h=>h.area).filter(Boolean))];
  if(!A.includes(area))area="ALL";
  $("chips").innerHTML=A.map(a=>`<button class="chip ${area===a?"on":""}" data-a="${esc(a)}">${a==="ALL"?"ทั้งหมด":esc(a)}</button>`).join("");
}
$("chips").addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;area=b.dataset.a;chips();draw()});

function card(h){
  const on=sel.includes(h.id);
  return `<div class="card h ${on?"sel":""}" onclick="detail(${h.id})">
    <div class="sc" style="background:${colorOf(h.area)}">${h.score!=null?h.score:"–"}<small>/10</small></div>
    <div class="hb"><h3>${esc(h.name)}</h3><div class="tag">${esc(h.tag||"")}</div><div class="rc">${rcount(h)}${h.custom?" · เพิ่มเอง":""}</div>
      <div class="meta"><span>📐 ${h.size?h.size+" m²":"–"}</span><span class="pr">${price(h)}</span></div></div>
    <button class="pick" aria-label="เลือกเปรียบเทียบ" onclick="event.stopPropagation();pick(${h.id})">${on?"✓":"+"}</button></div>`;
}
function draw(){
  const q=$("q").value.toLowerCase(),min=+$("size").value,s=$("sort").value;
  const L=all().filter(h=>(h.name.toLowerCase().includes(q)||(h.tag||"").toLowerCase().includes(q))&&(area==="ALL"||h.area===area)&&(h.size||0)>=min);
  const f={pa:(a,b)=>(a.price??1e12)-(b.price??1e12),pd:(a,b)=>(b.price??-1)-(a.price??-1),sz:(a,b)=>(b.size||0)-(a.size||0),sc:(a,b)=>(b.score||0)-(a.score||0)}[s];
  if(f)L.sort(f);
  $("count").textContent=`พบ ${L.length} โรงแรม · แตะการ์ดเพื่อดูรายละเอียด`;
  $("list").innerHTML=L.map(card).join("")||`<div class="card" style="text-align:center;color:var(--mut)">ไม่พบโรงแรมที่ตรงเงื่อนไข</div>`;
  $("n").textContent=sel.length;
  $("act").classList.toggle("hide",!sel.length);
  $("n-hotels").innerHTML=`<span>🏨</span>เลือกโรงแรม (${all().length})`;
}
function pick(id){sel=sel.includes(id)?sel.filter(x=>x!==id):[...sel,id];draw()}

function revHtml(h){
  const r=rv(h),cls={"+":"p","-":"n","~":"m"};
  return `<div class="rvh">💬 คอมเมนต์เกี่ยวกับห้องพัก</div>`+
   (r.length?r.map(x=>`<div class="rv ${cls[x[0]]||"m"}">${esc(x[1])}<small>${esc(x[2]||"")}</small></div>`).join(""):`<div class="note">ยังไม่มีคอมเมนต์ห้อง</div>`)+
   `<div class="note">${h.custom?"คอมเมนต์ที่คุณเพิ่มเอง":"สรุปเป็นภาษาไทยจากรีวิวจริงบนเว็บจองที่พัก ดึงเมื่อ 28 ต.ค. 2026 ไม่ใช่ข้อความต้นฉบับ"}</div>
    <a class="btn o" href="https://www.google.com/search?q=${encodeURIComponent(h.name+" Osaka hotel reviews")}" target="_blank" rel="noopener">🔎 ค้นรีวิวเพิ่มบน Google</a>`;
}
function detail(id){
  const h=find(id);if(!h)return;
  const on=sel.includes(id);
  const cats=h.loc!=null?`<div class="note">คะแนนรายหมวดมาจากไฟล์เดิม ยังไม่ได้ตรวจกับแหล่งรีวิว</div>`+[["ทำเลที่ตั้ง",h.loc],["ความสะอาด",h.cl],["การบริการ",h.sv],["ความคุ้มค่า",h.vl]].map(x=>`<div class="kv"><span>${x[0]}</span><b>${x[1]}</b></div>`).join(""):"";
  const map=h.map||"https://maps.google.com/?q="+encodeURIComponent(h.name+" Osaka");
  openSheet(h.name,`
    <div class="tag" style="margin-bottom:6px">${esc(h.tag||"")} · ${esc(h.area||"")}</div>
    <div class="kv"><span>ราคา / คืน</span><b style="color:var(--grn)">${price(h)}</b></div>
    <div class="kv"><span>ขนาดห้อง</span><b>${h.size?h.size+" ตร.ม.":"–"}</b></div>
    <div class="kv"><span>คะแนนรวม</span><b style="color:var(--amb)">${h.score!=null?"⭐️ "+h.score+" / 10":"–"}</b></div>
    ${cats}${h.cm?`<div class="note">โน้ต: ${esc(h.cm)}</div>`:""}
    ${revHtml(h)}
    <button class="btn ${on?"o":""}" style="margin-top:10px" onclick="pick(${id});closeSheet()">${on?"✓ เลือกแล้ว (แตะเพื่อเอาออก)":"+ เลือกเปรียบเทียบ"}</button>
    <a class="btn o" href="${esc(map)}" target="_blank" rel="noopener">📍 ดูบน Google Maps</a>
    ${h.custom?`<div class="g2" style="margin-top:8px"><button class="btn o" onclick="form(${id})">✏️ แก้ไข</button><button class="btn o" onclick="delHotel(${id},this)">🗑 ลบ</button></div>`:""}`);
}

// ---------- เพิ่ม / แก้ไข / ลบที่พัก ----------
function form(id){
  const h=id?find(id):null;
  const areas=[...new Set(all().map(x=>x.area).filter(Boolean))];
  openSheet(h?"✏️ แก้ไขที่พัก":"➕ เพิ่มที่พัก",`<div class="fm">
    <label>ชื่อที่พัก *<input id="f-name" maxlength="120"></label>
    <label>ย่าน (เลือกหรือพิมพ์ใหม่)<input id="f-area" list="f-areas" maxlength="40" placeholder="เช่น Namba"><datalist id="f-areas">${areas.map(a=>`<option value="${esc(a)}">`).join("")}</datalist></label>
    <div class="g2"><label>ขนาดห้อง (ตร.ม.)<input id="f-size" type="number" inputmode="decimal" min="0"></label><label>ราคา/คืน (บาท)<input id="f-price" type="number" inputmode="decimal" min="0"></label></div>
    <div class="g2"><label>คะแนนรวม (0-10)<input id="f-score" type="number" inputmode="decimal" step="0.1" min="0" max="10"></label><label>จุดเด่นสั้น ๆ<input id="f-tag" maxlength="60"></label></div>
    <label>ลิงก์ Google Maps หรือเว็บจอง (ไม่บังคับ)<input id="f-map" type="url" inputmode="url" placeholder="https://..."></label>
    <label>โน้ต<input id="f-cm" maxlength="200"></label>
    <label>คอมเมนต์ห้อง บรรทัดละ 1 ข้อ ขึ้นต้นด้วย + (ชม) - (ติ) หรือ ~ (กลาง ๆ)<textarea id="f-rv" rows="5" placeholder="+ ห้องสะอาด&#10;- ห้องเล็ก"></textarea></label>
    <label>แหล่งที่มาของคอมเมนต์<input id="f-src" maxlength="40" placeholder="เช่น Agoda"></label>
    <button class="btn" onclick="saveForm(${id||0})">💾 บันทึก</button></div>`);
  if(h){const set=(k,v)=>{$("f-"+k).value=v??""};
    set("name",h.name);set("area",h.area);set("size",h.size);set("price",h.price);set("score",h.score);set("tag",h.tag);set("map",h.map);set("cm",h.cm);
    set("rv",rv(h).map(r=>r[0]+" "+r[1]).join("\n"));set("src",(rv(h)[0]||[])[2]);}
}
function saveForm(id){
  const name=$("f-name").value.trim();
  if(!name){toast("กรุณาใส่ชื่อที่พัก");$("f-name").focus();return}
  const src=$("f-src").value.trim()||"ของฉัน";
  const reviews=$("f-rv").value.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const s="+-~".includes(l[0])?l[0]:"~";return [s,(s===l[0]?l.slice(1):l).trim(),src]}).filter(r=>r[1]);
  let map=$("f-map").value.trim();if(!/^https?:\/\//i.test(map))map="";
  let score=num($("f-score").value);if(score!=null)score=Math.min(10,Math.max(0,score));
  const o={name,area:$("f-area").value.trim()||"อื่น ๆ",size:num($("f-size").value),price:num($("f-price").value),score,tag:$("f-tag").value.trim()||"ที่พักที่เพิ่มเอง",cm:$("f-cm").value.trim(),map,reviews,custom:true};
  if(id){const i=custom.findIndex(h=>h.id===id);if(i>=0)custom[i]={...custom[i],...o}}
  else custom.push({id:Math.max(1000,...custom.map(h=>h.id))+1,...o});
  persist();closeSheet();chips();draw();toast("บันทึกแล้ว");
}
function delHotel(id,btn){
  if(!btn.dataset.s){btn.dataset.s=1;btn.textContent="แตะอีกครั้งเพื่อยืนยันลบ";return}
  custom=custom.filter(h=>h.id!==id);sel=sel.filter(x=>x!==id);
  persist();closeSheet();chips();draw();toast("ลบแล้ว");
}

// ---------- นำเข้า / ส่งออกข้อมูลที่เพิ่มเอง ----------
function manage(){
  openSheet("⚙️ จัดการข้อมูล",`<p class="note">ที่พักที่เพิ่มเอง ${custom.length} แห่ง · เก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น (เครื่องอื่นหรือคนอื่นจะไม่เห็น)</p>
    <button class="btn" onclick="copyData()">📋 คัดลอกข้อมูลที่เพิ่มไว้ (JSON)</button>
    <label class="note" style="display:block;margin-top:14px">วาง JSON เพื่อนำเข้า (ย้ายข้อมูลมาจากเครื่องอื่น)</label>
    <div class="fm"><textarea id="imp" rows="5" placeholder='[{"name":"...","area":"Namba"}]'></textarea></div>
    <button class="btn o" onclick="importData()">⬆️ นำเข้า</button>
    <p class="note">อยากให้ที่พักอยู่ถาวรสำหรับทุกคน: วางรายการที่คัดลอกลงในอาร์เรย์ hotels ในไฟล์ hotels.js แล้ว commit</p>`);
}
function copyData(){
  const t=JSON.stringify(custom.map(({id,...r})=>r),null,2);
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast("คัดลอกแล้ว"),()=>toast("คัดลอกไม่สำเร็จ"));else toast("เบราว์เซอร์นี้คัดลอกไม่ได้");
}
function importData(){
  let a;try{a=JSON.parse($("imp").value)}catch(e){toast("JSON ไม่ถูกต้อง");return}
  if(!Array.isArray(a)){toast("ต้องเป็นรายการ [ ... ]");return}
  const have=new Set(all().map(h=>h.name.toLowerCase()));let n=0;
  for(const r of a.slice(0,200)){
    if(!r||typeof r.name!=="string"||!r.name.trim()||have.has(r.name.trim().toLowerCase()))continue;
    const rvs=Array.isArray(r.reviews)?r.reviews.filter(x=>Array.isArray(x)&&typeof x[1]==="string").slice(0,30).map(x=>["+-~".includes(x[0])?x[0]:"~",String(x[1]).slice(0,300),String(x[2]||"").slice(0,40)]):[];
    const map=typeof r.map==="string"&&/^https?:\/\//i.test(r.map)?r.map:"";
    custom.push({id:Math.max(1000,...custom.map(h=>h.id))+1,name:r.name.trim().slice(0,120),area:String(r.area||"อื่น ๆ").slice(0,40),size:num(r.size),price:num(r.price),score:num(r.score),tag:String(r.tag||"ที่พักที่เพิ่มเอง").slice(0,60),cm:String(r.cm||"").slice(0,200),map,reviews:rvs,custom:true});
    have.add(r.name.trim().toLowerCase());n++;
  }
  persist();chips();draw();closeSheet();toast(`นำเข้า ${n} แห่ง`);
}

// ---------- เปรียบเทียบ / ส่ง LINE ----------
function compare(){
  const L=all().filter(h=>sel.includes(h.id)).sort((a,b)=>(a.price??1e12)-(b.price??1e12));
  openSheet("📊 เปรียบเทียบ",L.map((h,i)=>{const best=i===0&&h.price!=null;return `<div class="cmp ${best?"best":""}"><h3>${esc(h.name)}${best?" 🏆 ถูกสุด":""}</h3>
    <div class="kv"><span>ราคา/คืน</span><b style="color:var(--grn)">${price(h)}</b></div>
    <div class="kv"><span>ขนาดห้อง</span><b>${h.size?h.size+" m²":"–"}</b></div>
    <div class="kv"><span>คะแนน</span><b style="color:var(--amb)">${h.score!=null?"⭐️ "+h.score:"–"}</b></div>
    <div class="kv"><span>ย่าน</span><b>${esc(h.area||"")}</b></div>
    <div class="kv"><span>คอมเมนต์ห้อง</span><b>${rsum(h)}</b></div></div>`}).join(""));
}
function copyLine(){
  const L=sel.length?all().filter(h=>sel.includes(h.id)):all();
  let t=`🇯🇵 สรุปที่พักโอซาก้า 2026 (${L.length} โรงแรม)\n\n`;
  L.forEach((h,i)=>{t+=`${i+1}. ${h.name}\n   📐 ${h.size?h.size+" ตร.ม.":"-"} | 💵 ${price(h)}\n   ⭐️ ${h.score!=null?h.score+"/10":"-"} | ${h.tag||""}\n\n`});
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast("คัดลอกข้อความสำหรับ LINE แล้ว"),()=>toast("คัดลอกไม่สำเร็จ"));else toast("เบราว์เซอร์นี้คัดลอกไม่ได้");
}

setInterval(tick,1000);tick();chips();draw();
