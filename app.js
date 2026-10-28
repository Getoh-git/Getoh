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
const DB="https://osaka-trip-b03a0-default-rtdb.asia-southeast1.firebasedatabase.app";
const KEY="osaka_custom_hotels_v1",CACHE="osaka_remote_cache_v2"; // KEY = ข้อมูลเก่าแบบ localStorage (ใช้ย้ายขึ้นฐานข้อมูล)
const BASE_IDS=new Set(OSAKA.hotels.map(h=>h.id));
let remote={},online=null; // remote: id -> ข้อมูลจาก Firebase (ที่เพิ่ม/แก้/ลบ)
try{remote=JSON.parse(localStorage.getItem(CACHE)||"{}")||{}}catch(e){remote={}}
const cacheSave=()=>{try{localStorage.setItem(CACHE,JSON.stringify(remote))}catch(e){}};
async function dbx(method,path,body,qs=""){
  const r=await fetch(`${DB}${path}.json${qs}`,{method,headers:body!==undefined?{"Content-Type":"application/json"}:undefined,body:body!==undefined?JSON.stringify(body):undefined});
  if(!r.ok)throw new Error("HTTP "+r.status);
  return r.json();
}
const db=(method,path,body)=>dbx(method,"/hotels"+path,body);
let photoSet=new Set(),phCache={}; // photoSet = id โรงแรมที่มีรูป, phCache = รูปที่โหลดแล้ว
const MAXPH=4;
function norm(k,v){
  const id=+k;if(!Number.isFinite(id)||!v||typeof v!=="object")return null;
  if(v.deleted)return {id,deleted:true};
  const r=v.reviews,arr=Array.isArray(r)?r:(r&&typeof r==="object"?Object.values(r):[]);
  return {...v,id,reviews:arr.map(x=>Array.isArray(x)?x:Object.values(x||{}))};
}
async function sync(quiet){
  try{
    const d=(await db("GET",""))||{},m={};
    for(const k in d){const n=norm(k,d[k]);if(n)m[n.id]=n}
    const changed=JSON.stringify(m)!==JSON.stringify(remote);
    remote=m;online=true;cacheSave();
    let pchanged=false;
    try{
      const p=(await dbx("GET","/photos",undefined,"?shallow=true"))||{};
      const ns=new Set(Object.keys(p).map(Number));
      pchanged=[...ns].sort().join()!==[...photoSet].sort().join();photoSet=ns;
    }catch(e){}
    if(changed||pchanged){sel=sel.filter(x=>find(x));chips();draw()}
  }catch(e){if(online!==false&&!quiet)toast("เชื่อมต่อฐานข้อมูลไม่ได้ แสดงข้อมูลที่เก็บไว้ในเครื่อง");online=false}
}
const all=()=>{
  const base=OSAKA.hotels.filter(h=>!(remote[h.id]&&remote[h.id].deleted)).map(h=>remote[h.id]?{...h,...remote[h.id],id:h.id}:h);
  const extra=Object.values(remote).filter(h=>!BASE_IDS.has(h.id)&&!h.deleted).sort((a,b)=>a.id-b.id).map(h=>({...h,custom:true}));
  return [...base,...extra];
};
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
  for(const x of ["count","hotels","map"]){$("p-"+x).classList.toggle("hide",t!==x);$("n-"+x).classList.toggle("on",t===x)}
  if(t!=="map"&&placing)endPlace();
  if(t==="map"&&initMap()){mapDraw();setTimeout(()=>map.invalidateSize(),60)}
  scrollTo(0,0);
}
function openSheet(t,html){$("st").textContent=t;$("sb").innerHTML=html;$("ov").classList.remove("hide");document.body.style.overflow="hidden"}
function closeSheet(){$("ov").classList.add("hide");document.body.style.overflow=""}
function toast(m){const o=$("toast");if(o)o.remove();const t=document.createElement("div");t.id="toast";t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2400)}

function chips(){
  const A=["ALL",...new Set(all().map(h=>h.area).filter(Boolean))];
  if(!A.includes(area))area="ALL";
  const CH=A.map(a=>`<button class="chip ${area===a?"on":""}" data-a="${esc(a)}">${a==="ALL"?"ทั้งหมด":esc(a)}</button>`).join("");
  $("chips").innerHTML=CH;$("mchips").innerHTML=CH;
}
for(const c of ["chips","mchips"])$(c).addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;area=b.dataset.a;chips();draw()});

function card(h){
  const on=sel.includes(h.id);
  return `<div class="card h ${on?"sel":""}" onclick="detail(${h.id})">
    <div class="sc" style="background:${colorOf(h.area)}">${h.score!=null?h.score:"–"}<small>/10</small></div>
    <div class="hb"><h3>${esc(h.name)}</h3><div class="tag">${esc(h.tag||"")}</div><div class="rc">${rcount(h)}${photoSet.has(h.id)?" · 📷":""}${h.custom?" · เพิ่มเอง":""}</div>
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
  if(map)mapDraw();
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
    <div class="rvh">📷 รูปภาพ</div><div id="ph-box" data-id="${id}" class="phg note">กำลังโหลดรูป...</div>
    ${revHtml(h)}
    <button class="btn ${on?"o":""}" style="margin-top:10px" onclick="pick(${id});closeSheet()">${on?"✓ เลือกแล้ว (แตะเพื่อเอาออก)":"+ เลือกเปรียบเทียบ"}</button>
    <a class="btn o" href="${esc(map)}" target="_blank" rel="noopener">📍 ดูบน Google Maps</a>
    <button class="btn o" style="margin-top:8px" onclick="${hasLL(h)?`showOnMap(${id})`:`placeFor(${id})`}">🗺️ ${hasLL(h)?"ดูบนแผนที่ทริป":"ปักหมุดบนแผนที่ทริป"}</button>
    <div class="g2" style="margin-top:8px"><button class="btn o" onclick="openForm(${id})">✏️ แก้ไข</button><button class="btn o" onclick="delHotel(${id},this)">🗑 ลบ</button></div>`);
  loadPhotos(id);
}

// ---------- เพิ่ม / แก้ไข / ลบที่พัก ----------
function openForm(id){
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
  const o={name,area:$("f-area").value.trim()||"อื่น ๆ",size:num($("f-size").value),price:num($("f-price").value),score,tag:$("f-tag").value.trim()||"ที่พักที่เพิ่มเอง",cm:$("f-cm").value.trim(),map,reviews};
  const old=id?find(id):null,ll=parseLL(map);
  if(ll){o.lat=ll[0];o.lng=ll[1]}
  putHotel(id||Date.now(),{...(old||{}),...o});
  closeSheet();
}
async function putHotel(id,o){
  const {id:_i,custom:_c,deleted:_d,...body}=o;
  const prev=remote[id];
  remote[id]=norm(id,body);cacheSave();chips();draw();
  try{await db("PUT","/"+id,body);toast("บันทึกแล้ว ✓");online=true}
  catch(e){if(prev)remote[id]=prev;else delete remote[id];cacheSave();chips();draw();toast("บันทึกไม่สำเร็จ ตรวจอินเทอร์เน็ตหรือกฎฐานข้อมูล")}
}
function delHotel(id,btn){
  if(!btn.dataset.s){btn.dataset.s=1;btn.textContent="แตะอีกครั้งเพื่อยืนยันลบ";return}
  removeHotel(id);closeSheet();
}
async function removeHotel(id){
  const prev=remote[id],isBase=BASE_IDS.has(id);
  if(isBase)remote[id]={id,deleted:true};else delete remote[id];
  sel=sel.filter(x=>x!==id);cacheSave();chips();draw();
  try{await db(isBase?"PUT":"DELETE","/"+id,isBase?{deleted:true}:undefined);toast("ลบแล้ว ✓");online=true;
    if(photoSet.has(id)){photoSet.delete(id);delete phCache[id];dbx("DELETE","/photos/"+id).catch(()=>{})}}
  catch(e){if(prev)remote[id]=prev;else delete remote[id];cacheSave();chips();draw();toast("ลบไม่สำเร็จ ตรวจอินเทอร์เน็ตหรือกฎฐานข้อมูล")}
}
async function restoreBase(){
  const gone=OSAKA.hotels.filter(h=>remote[h.id]&&remote[h.id].deleted);
  if(!gone.length){toast("ไม่มีโรงแรมเดิมที่ถูกลบ");return}
  try{await Promise.all(gone.map(h=>db("DELETE","/"+h.id)));await sync();closeSheet();toast(`กู้คืน ${gone.length} แห่งแล้ว`)}
  catch(e){toast("กู้คืนไม่สำเร็จ")}
}

// ---------- รูปภาพ ----------
const okImg=v=>typeof v==="string"&&v.length<600000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(v);
const okKey=k=>/^[A-Za-z0-9_]+$/.test(k);
function shrink(file,max,q){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file),im=new Image();
    im.onload=()=>{
      const sc=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");
      c.width=Math.max(1,Math.round(im.width*sc));c.height=Math.max(1,Math.round(im.height*sc));
      c.getContext("2d").drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",q));
    };
    im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("img"))};
    im.src=url;
  });
}
async function loadPhotos(id){
  const box=$("ph-box");if(!box)return;
  try{
    const d=(await dbx("GET","/photos/"+id))||{};
    phCache[id]=d;
    if(Object.keys(d).length)photoSet.add(id);else photoSet.delete(id);
    renderPhotos(id);
  }catch(e){
    const b=$("ph-box");if(b&&b.dataset.id==id)b.textContent="โหลดรูปไม่ได้ ตรวจกฎ Firebase ว่ามีข้อ photos หรือยัง";
  }
}
function renderPhotos(id){
  const box=$("ph-box");if(!box||box.dataset.id!=id)return;
  const d=phCache[id]||{},ks=Object.keys(d).filter(k=>okKey(k)&&okImg(d[k])).sort();
  box.className="phg";
  box.innerHTML=ks.map(k=>`<div class="phi"><img src="${d[k]}" alt="" onclick="lightbox(${id},'${k}')"><button class="phx" aria-label="ลบรูป" onclick="delPhoto(${id},'${k}',this)">✕</button></div>`).join("")+
    (ks.length<MAXPH?`<button class="btn o" onclick="addPhoto(${id})">📷 เพิ่มรูป (${ks.length}/${MAXPH})</button>`:`<div class="note" style="grid-column:1/-1">ครบ ${MAXPH} รูปแล้ว ลบรูปเก่าก่อนถึงจะเพิ่มได้</div>`);
}
function lightbox(id,k){
  const src=(phCache[id]||{})[k];if(!okImg(src))return;
  const o=document.createElement("div");
  o.style.cssText="position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;padding:12px;cursor:zoom-out";
  const im=document.createElement("img");im.src=src;im.style.cssText="max-width:100%;max-height:100%;border-radius:8px";
  o.appendChild(im);o.onclick=()=>o.remove();document.body.appendChild(o);
}
function addPhoto(id){
  const have=Object.keys(phCache[id]||{}).length;
  if(have>=MAXPH){toast(`ครบ ${MAXPH} รูปแล้ว`);return}
  const inp=document.createElement("input");inp.type="file";inp.accept="image/*";inp.multiple=true;
  inp.onchange=async()=>{
    const fs=[...inp.files].slice(0,MAXPH-have);if(!fs.length)return;
    toast("กำลังอัปโหลดรูป...");let ok=0;
    for(let i=0;i<fs.length;i++){
      try{
        let u=await shrink(fs[i],800,.72);
        if(u.length>220000)u=await shrink(fs[i],640,.6);
        if(u.length>400000)throw new Error("big");
        const k="p"+Date.now()+"_"+i;
        await dbx("PUT","/photos/"+id+"/"+k,u);
        (phCache[id]=phCache[id]||{})[k]=u;ok++;
      }catch(e){toast(e.message==="img"?"เปิดไฟล์รูปนี้ไม่ได้ (ลองรูป JPG/PNG)":"อัปโหลดไม่สำเร็จ ตรวจกฎ Firebase ข้อ photos")}
    }
    if(ok){photoSet.add(id);renderPhotos(id);draw();toast(`เพิ่ม ${ok} รูปแล้ว ✓`)}
  };
  inp.click();
}
async function delPhoto(id,k,btn){
  if(!btn.dataset.s){btn.dataset.s=1;btn.textContent="ลบ?";btn.style.width="auto";btn.style.padding="0 10px";return}
  const prev=(phCache[id]||{})[k];
  if(phCache[id])delete phCache[id][k];
  if(!Object.keys(phCache[id]||{}).length)photoSet.delete(id);
  renderPhotos(id);draw();
  try{await dbx("DELETE","/photos/"+id+"/"+k);toast("ลบรูปแล้ว ✓")}
  catch(e){(phCache[id]=phCache[id]||{})[k]=prev;photoSet.add(id);renderPhotos(id);draw();toast("ลบรูปไม่สำเร็จ")}
}

// ---------- แผนที่ ----------
let map=null,layer=null,placing=null,prevMk=null,mapFit=false;
const hasLL=h=>Number.isFinite(h.lat)&&Number.isFinite(h.lng);
function parseLL(u){
  u=String(u||"");
  const m=u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||u.match(/[?&](?:q|ll|query)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/);
  if(!m)return null;
  const a=+m[1],b=+m[2];
  return a>=30&&a<=40&&b>=128&&b<=146?[a,b]:null; // เฉพาะพิกัดในญี่ปุ่น
}
const filt=()=>{const q=$("q").value.toLowerCase(),min=+$("size").value;return all().filter(h=>(h.name.toLowerCase().includes(q)||(h.tag||"").toLowerCase().includes(q))&&(area==="ALL"||h.area===area)&&(h.size||0)>=min)};
function initMap(){
  if(map)return true;
  if(typeof L==="undefined"){$("mnote").textContent="โหลดแผนที่ไม่ได้ (ต้องต่ออินเทอร์เน็ต)";return false}
  map=L.map("map").setView([34.6687,135.5013],13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);
  layer=L.layerGroup().addTo(map);
  map.on("click",e=>{if(placing)setLL(placing,e.latlng.lat,e.latlng.lng)});
  return true;
}
function mapDraw(){
  if(!map)return;
  layer.clearLayers();
  const base=filt(),pin=base.filter(hasLL),un=base.filter(h=>!hasLL(h));
  pin.forEach(h=>{
    const ic=L.divIcon({className:"",html:`<div class="pin" style="background:${colorOf(h.area)}">${h.price!=null?"฿"+(h.price/1000).toFixed(1)+"k":"•"}</div>`,iconSize:[54,26],iconAnchor:[27,13]});
    L.marker([h.lat,h.lng],{icon:ic}).addTo(layer).bindPopup(`<b>${esc(h.name)}</b><br>${price(h)} · ⭐️ ${h.score!=null?h.score:"–"} · ${h.size?h.size+" m²":"–"}<br><a href="#" onclick="detail(${h.id});return false">ดูรายละเอียด</a> · <a href="#" onclick="placeFor(${h.id});return false">ย้ายหมุด</a>`);
  });
  if(!mapFit&&pin.length){map.fitBounds(L.latLngBounds(pin.map(h=>[h.lat,h.lng])),{padding:[30,30],maxZoom:16});mapFit=true}
  $("mcount").textContent=`ปักหมุดแล้ว ${pin.length} · ยังไม่ปัก ${un.length}`;
  $("munpin").innerHTML=un.map(h=>`<div class="card" style="display:flex;gap:8px;align-items:center;padding:10px;margin-bottom:8px"><div style="flex:1;min-width:0"><b style="font-size:15px">${esc(h.name)}</b><div class="rc">${esc(h.area||"")}</div></div><button class="btn o" style="width:auto;min-height:40px;font-size:13px" onclick="findLL(${h.id})">🔎 ค้นหา</button><button class="btn" style="width:auto;min-height:40px;font-size:13px" onclick="placeFor(${h.id})">📍 ปัก</button></div>`).join("");
}
function placeFor(id){
  const h=find(id);if(!h)return;
  closeSheet();tab("map");if(!map)return;
  placing=id;map.closePopup();map.getContainer().style.cursor="crosshair";
  $("mnote").innerHTML=`📍 แตะบนแผนที่ตำแหน่งของ <b>${esc(h.name)}</b> <button class="chip on" onclick="endPlace()">ยกเลิก</button>`;
}
function endPlace(){
  placing=null;if(prevMk){prevMk.remove();prevMk=null}
  if(map)map.getContainer().style.cursor="";
  $("mnote").textContent="แตะหมุดเพื่อดูรายละเอียด · ตัวกรองด้านบนใช้ร่วมกับแท็บเลือกโรงแรม";
}
function setLL(id,lat,lng){
  const h=find(id);endPlace();if(!h)return;
  putHotel(id,{...h,lat:+lat.toFixed(6),lng:+lng.toFixed(6)});
}
function showOnMap(id){
  const h=find(id);closeSheet();tab("map");if(!map||!h||!hasLL(h))return;
  setTimeout(()=>{map.invalidateSize();map.setView([h.lat,h.lng],17)},90);
}
async function findLL(id){
  const h=find(id);if(!h)return;
  toast("กำลังค้นหาตำแหน่ง...");
  try{
    const r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=jp&bounded=1&viewbox=135.35,34.8,135.65,34.5&q="+encodeURIComponent(h.name+" Osaka"));
    const d=await r.json();
    if(!Array.isArray(d)||!d.length){toast("ไม่พบชื่อนี้ กด 📍 ปัก แล้วแตะบนแผนที่เอง");return}
    const lat=+d[0].lat,lng=+d[0].lon;
    placeFor(id);if(!map)return;
    map.setView([lat,lng],17);
    prevMk=L.circleMarker([lat,lng],{radius:12,color:"#f59e0b",weight:3,fillOpacity:.15}).addTo(map);
    toast("เจอตำแหน่งใกล้เคียง ตรวจแล้วแตะจุดที่ถูกต้อง");
  }catch(e){toast("ค้นหาไม่ได้ กด 📍 ปัก แล้วแตะบนแผนที่เอง")}
}

// ---------- จัดการข้อมูล ----------
function manage(){
  let old=[];try{old=JSON.parse(localStorage.getItem(KEY)||"[]");if(!Array.isArray(old))old=[]}catch(e){old=[]}
  const added=all().filter(h=>h.custom).length,gone=OSAKA.hotels.filter(h=>remote[h.id]&&remote[h.id].deleted).length;
  openSheet("⚙️ จัดการข้อมูล",`<p class="note">${online===false?"⚠️ ออฟไลน์ ใช้ข้อมูลที่เก็บไว้ในเครื่อง":"🟢 เชื่อมต่อฐานข้อมูลกลางแล้ว"} · ที่พักที่ทุกคนเพิ่ม ${added} แห่ง · โรงแรมเดิมที่ถูกลบ ${gone} แห่ง<br>ทุกคนที่เปิดลิงก์นี้เห็นข้อมูลชุดเดียวกัน อัปเดตอัตโนมัติทุก 20 วินาที</p>
    <button class="btn o" onclick="sync().then(()=>toast('รีเฟรชแล้ว'))">🔄 รีเฟรชข้อมูลตอนนี้</button>
    <button class="btn" style="margin-top:8px" onclick="copyData()">📋 คัดลอกสำรองที่พักที่เพิ่ม (JSON)</button>
    ${gone?`<button class="btn o" style="margin-top:8px" onclick="restoreBase()">↩️ กู้คืนโรงแรมเดิมที่ลบ (${gone})</button>`:""}
    ${old.length?`<button class="btn g" style="margin-top:8px" onclick="migrateOld()">⬆️ อัปโหลดที่พักในเครื่องนี้ (${old.length}) ขึ้นฐานข้อมูลกลาง</button>`:""}
    <label class="note" style="display:block;margin-top:14px">วาง JSON เพื่อนำเข้า</label>
    <div class="fm"><textarea id="imp" rows="5" placeholder='[{"name":"...","area":"Namba"}]'></textarea></div>
    <button class="btn o" onclick="importData()">⬆️ นำเข้า</button>`);
}
function copyData(){
  const t=JSON.stringify(all().filter(h=>h.custom).map(({id,custom,...r})=>r),null,2);
  if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast("คัดลอกแล้ว"),()=>toast("คัดลอกไม่สำเร็จ"));else toast("เบราว์เซอร์นี้คัดลอกไม่ได้");
}
async function importList(a){
  const have=new Set(all().map(h=>h.name.toLowerCase()));const jobs=[];let i=0;
  for(const r of a.slice(0,200)){
    if(!r||typeof r.name!=="string"||!r.name.trim()||have.has(r.name.trim().toLowerCase()))continue;
    const rvs=Array.isArray(r.reviews)?r.reviews.filter(x=>Array.isArray(x)&&typeof x[1]==="string").slice(0,30).map(x=>["+-~".includes(x[0])?x[0]:"~",String(x[1]).slice(0,300),String(x[2]||"").slice(0,40)]):[];
    const map=typeof r.map==="string"&&/^https?:\/\//i.test(r.map)?r.map:"";
    const body={name:r.name.trim().slice(0,120),area:String(r.area||"อื่น ๆ").slice(0,40),size:num(r.size),price:num(r.price),score:num(r.score),tag:String(r.tag||"ที่พักที่เพิ่มเอง").slice(0,60),cm:String(r.cm||"").slice(0,200),map,reviews:rvs};
    if(num(r.lat)!=null&&num(r.lng)!=null){body.lat=num(r.lat);body.lng=num(r.lng)}
    jobs.push(db("PUT","/"+(Date.now()+i++),body));have.add(body.name.toLowerCase());
  }
  await Promise.all(jobs);await sync();return jobs.length;
}
async function importData(){
  let a;try{a=JSON.parse($("imp").value)}catch(e){toast("JSON ไม่ถูกต้อง");return}
  if(!Array.isArray(a)){toast("ต้องเป็นรายการ [ ... ]");return}
  try{const n=await importList(a);closeSheet();toast(`นำเข้า ${n} แห่ง`)}catch(e){toast("นำเข้าไม่สำเร็จ")}
}
async function migrateOld(){
  try{
    const a=JSON.parse(localStorage.getItem(KEY)||"[]");
    const n=await importList(a);
    localStorage.removeItem(KEY);closeSheet();toast(`อัปโหลด ${n} แห่งแล้ว`);
  }catch(e){toast("อัปโหลดไม่สำเร็จ")}
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
sync();
setInterval(()=>{if(!document.hidden)sync(true)},20000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync(true)});
