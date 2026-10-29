// แท็บแผนวัน: ใส่สถานที่ที่อยากไป แล้วระบบค้นพิกัด จัดเข้าแต่ละวันตามความใกล้ ใส่เวลาให้ + ลิงก์เส้นทางจุดต่อจุด (เก็บในเครื่องนี้)
const PLK="osaka_plan_v1",PPK="osaka_places_v1",AIR="Kansai International Airport",NAMBA=[34.6687,135.5013];
const DURS=[[45,"แวะสั้น ~45 นาที"],[90,"ปกติ ~1.5 ชม."],[120,"นาน ~2 ชม."],[180,"ครึ่งวัน ~3 ชม."],[300,"ทั้งวัน ~5 ชม."]];
const POP=["Dotonbori","Osaka Castle","Universal Studios Japan","Shinsekai Tsutenkaku","Umeda Sky Building","Kuromon Market","Shinsaibashi-suji Shopping Street","Namba Yasaka Shrine"];
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return Array.isArray(v)?v:d}catch(e){return d}};
let PL=ld(PLK,[]),PLACES=ld(PPK,[]),planDay=0,pstat="",pbusy=false;
const plSave=()=>{try{localStorage.setItem(PLK,JSON.stringify(PL))}catch(e){}},placesSave=()=>{try{localStorage.setItem(PPK,JSON.stringify(PLACES))}catch(e){}};
const hm=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const mt=t=>{const d=new Date(t+324e5);return d.getUTCHours()*60+d.getUTCMinutes()};
const hav=(a,b)=>{const r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dn=r(b[1]-a[1]),q=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return 12742*Math.asin(Math.sqrt(q))};
const trav=(a,b)=>{const k=hav(a,b)*1.3;return k<1?Math.round(k/4.5*60)+3:Math.round(15+k/25*60)}; // ประมาณคร่าว ๆ เดินถ้าใกล้ ขนส่งสาธารณะถ้าไกล
const dirUrl=(a,b)=>`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(a)}&destination=${encodeURIComponent(b)}&travelmode=transit`;
const lbl=t=>t.replace(/ Osaka$/,"");
const leg=(a,b)=>a&&b?`<a class="lg" href="${esc(dirUrl(a,b))}" target="_blank" rel="noopener">🚆 ดูเส้นทางไป ${esc(lbl(b))} ›</a>`:"";
async function geoPlace(n){try{const r=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=jp&bounded=1&viewbox=135.2,34.9,135.8,34.4&q="+encodeURIComponent(n.replace(/\(.*?\)/g,"").trim()));const d=await r.json();return d[0]?{lat:+d[0].lat,lng:+d[0].lon}:null}catch(e){return null}}
function plAddP(n){
  n=(n||$("pa-n").value).trim();if(!n)return;
  if(PLACES.some(p=>p.n.toLowerCase()===n.toLowerCase()))return toast("มีสถานที่นี้แล้ว");
  PLACES.push({n,d:/universal/i.test(n)?300:/castle/i.test(n)?120:90});placesSave();renderPlan();
}
function plRm(i){PLACES.splice(i,1);placesSave();renderPlan()}
function plDur(i,v){PLACES[i].d=+v;placesSave()}
async function planGo(){
  if(pbusy)return;if(!PLACES.length)return toast("เพิ่มสถานที่ก่อน");
  pbusy=true;
  try{
    for(const p of PLACES){if(p.lat!=null)continue;pstat="กำลังค้นพิกัด "+p.n+"...";renderPlan();const g=await geoPlace(p.n);if(g){p.lat=g.lat;p.lng=g.lng}placesSave();await new Promise(r=>setTimeout(r,1100))}
    const ok=PLACES.filter(p=>p.lat!=null),miss=PLACES.filter(p=>p.lat==null);
    const hid=(JSON.parse(localStorage.getItem("osaka_prep_v1")||"{}").bk||{}).hid,hh=all().find(x=>x.id===+hid),H=hh&&hasLL(hh)?[hh.lat,hh.lng]:NAMBA;
    let cur=H,rest=[...ok],tour=[];
    while(rest.length){let bi=0,bd=1e9;rest.forEach((p,i)=>{const d=hav(cur,[p.lat,p.lng]);if(d<bd){bd=d;bi=i}});const p=rest.splice(bi,1)[0];tour.push(p);cur=[p.lat,p.lng]}
    const ND=NIGHTS+1,arr=mt(F[0].arr),endLast=mt(F[F.length-1].ap)-90-45,win=i=>[i===0?Math.max(arr+150,660):570,i===ND-1?endLast:1200];
    const build=soft=>{
      const days=Array.from({length:ND},()=>[]),left=[];let d=0,[s,e]=win(0),t=s;cur=H;
      for(const p of tour){const P=[p.lat,p.lng];
        for(;;){
          if(d>=ND){left.push(p);break}
          const tr=trav(cur,P),need=tr+p.d;
          if(t+need<=e&&(!days[d].length||(t-s)+need<=soft)){
            const st=Math.round((t+tr)/5)*5;
            days[d].push({t:hm(st),n:p.n,m:`ราว ${p.d>=60?+(p.d/60).toFixed(1)+" ชม.":p.d+" นาที"} · เดินทางมา ≈${tr} นาที`});
            t=st+p.d;cur=P;break}
          d++;if(d<ND){[s,e]=win(d);t=s;cur=H}
        }}
      return {days,left}};
    let r;for(let q=120;q<=720;q+=30){r=build(q);if(!r.left.length)break} // เริ่มจากวันเบา ๆ แล้วเพิ่มทีละน้อยจนจัดครบ
    if(r.left.length)r=build(1e9);
    PL=r.days;planDay=0;plSave();
    pstat=`จัดแล้ว ${ok.length-r.left.length} แห่ง`+(r.left.length?` · ไม่พอเวลา: ${r.left.map(p=>p.n).join(", ")} (ลองลดเวลาหรือเอาบางที่ออก)`:"")+(miss.length?` · หาพิกัดไม่เจอ: ${miss.map(p=>p.n).join(", ")} (ลองพิมพ์ชื่ออังกฤษให้ชัดขึ้น)`:"")+(hh&&hasLL(hh)?"":" · ยังไม่ได้ปักหมุดโรงแรม ใช้ย่านนัมบะเป็นจุดเริ่ม");
  }finally{pbusy=false;renderPlan()}
}
const pday=d=>{planDay=d;renderPlan()};
function plEdit(d,i){
  const x=PL[d][i];
  openSheet("แก้ไข "+x.n,`<div class="fm"><label>เวลา<input id="pf-t" type="time" value="${esc(x.t)}"></label><label>โน้ต<input id="pf-m" value="${esc(x.m)}"></label></div><button class="btn" onclick="plSaveF(${d},${i})">บันทึก</button><button class="btn o" style="margin-top:8px" onclick="PL[${d}].splice(${i},1);plSave();closeSheet();renderPlan()">🗑 เอาออกจากวันนี้</button>`);
}
function plSaveF(d,i){PL[d][i].t=$("pf-t").value;PL[d][i].m=$("pf-m").value.trim();PL[d].sort((p,q)=>(p.t||"99").localeCompare(q.t||"99"));plSave();closeSheet();renderPlan()}
function renderPlan(){
  const hid=(JSON.parse(localStorage.getItem("osaka_prep_v1")||"{}").bk||{}).hid,h=all().find(x=>x.id===+hid),HN=h?h.name+" Osaka":"";
  while(PL.length<=NIGHTS)PL.push([]);
  if(planDay>NIGHTS)planDay=0;
  const d=planDay,day=PL[d],N=NIGHTS,fd=i=>new Date(F[0].arr+i*864e5).toLocaleDateString("th-TH",{timeZone:"Asia/Tokyo",weekday:"short",day:"numeric",month:"short"});
  const pts=day.map(x=>x.n+" Osaka"),start=d===0?AIR:HN,end=d===N?AIR:HN,any=PL.some(x=>x.length);
  const node=(ic,t)=>`<div class="nd">${ic} ${esc(t)}</div>`;
  const info=d===0?`🛬 เครื่องลง ${tm(F[0].arr,"Asia/Tokyo")} · ระบบเผื่อเวลาเข้าเมืองและฝากกระเป๋า เริ่มเที่ยวหลังเวลาที่แสดง`:d===N?`🛫 เครื่องออก ${tm(F[F.length-1].dep,"Asia/Tokyo")} · ควรออกจากย่านที่พักไม่ช้ากว่า ${tm(F[F.length-1].ap-90*6e4,"Asia/Tokyo")}`:"";
  const sug=POP.filter(n=>!PLACES.some(p=>p.n===n));
  $("plan").innerHTML=`<h1>🗓 แผนรายวัน</h1><p class="sub">ใส่สถานที่ที่อยากไป แล้วให้ระบบจัดเข้าวัน เรียงเส้นทาง และใส่เวลาให้</p>
  <div class="card"><div class="rvh" style="margin-top:0">📍 สถานที่ที่อยากไป (${PLACES.length})</div>
    <div style="display:flex;gap:6px"><input id="pa-n" placeholder="ชื่อสถานที่ (พิมพ์อังกฤษ) เช่น Osaka Castle" onkeydown="if(event.key==='Enter')plAddP()"><button class="btn" style="width:auto;padding:0 18px" onclick="plAddP()">➕</button></div>
    ${sug.length?`<div class="chips">${sug.map(n=>`<button class="chip" onclick="plAddP('${n}')">+ ${n}</button>`).join("")}</div>`:""}
    ${PLACES.map((p,i)=>`<div class="pr2"><span>${p.lat!=null?"📍":"⏳"} ${esc(p.n)}</span><select onchange="plDur(${i},this.value)">${DURS.map(x=>`<option value="${x[0]}" ${x[0]===p.d?"selected":""}>${x[1]}</option>`).join("")}</select><button class="x" onclick="plRm(${i})" aria-label="ลบ">✕</button></div>`).join("")}
    <button class="btn" style="margin-top:12px" onclick="planGo()" ${pbusy?"disabled":""}>${pbusy?"กำลังจัดแผน...":"🪄 จัดแผนให้"}</button>
    ${pstat?`<div class="note">${esc(pstat)}</div>`:""}</div>
  ${any?`<div class="chips">${PL.slice(0,N+1).map((_,i)=>`<button class="chip ${i===d?"on":""}" onclick="pday(${i})">วัน ${i+1} · ${fd(i)}</button>`).join("")}</div>
  ${info?`<div class="pinfo">${info}</div>`:""}
  <div class="tl">${start?node(d===0?"🛬":"🏨",lbl(start)):""}${start&&day.length?leg(start,pts[0]):""}
  ${day.map((x,i)=>`<div class="stp" onclick="plEdit(${d},${i})"><div class="tt">${esc(x.t||"–")}</div><div class="sb"><b>${esc(x.n)}</b>${x.m?`<small>${esc(x.m)}</small>`:""}</div><span class="ed">✎</span></div>${i<day.length-1?leg(pts[i],pts[i+1]):""}`).join("")||`<div class="note" style="padding:14px 0">วันนี้ว่าง ไม่มีสถานที่ที่จัดเข้ามา</div>`}
  ${end&&day.length?leg(pts[pts.length-1],end):""}${end?node(d===N?"🛫":"🏨",lbl(end)):""}</div>
  <div class="note">เวลาเดินทางในแผนเป็นค่าประมาณจากระยะทาง กดปุ่มเส้นทางเพื่อดูเวลาและค่าโดยสารจริง</div>`:""}`;
}
